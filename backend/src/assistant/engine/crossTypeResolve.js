const {
  resolveOrganization,
  resolveLocation,
  resolveEmployee,
  leftoverNameCandidates,
} = require('./entityIndex');
const { extractPossessiveNames, isReservedName } = require('../knowledge/questionPatterns');
const { ENTITY_HINTS } = require('../knowledge/synonyms');
const { containsPhrase, normalizeName } = require('./normalize');
const {
  matchFields,
  EMPLOYEE_LOOKUP,
  ORGANIZATION_LOOKUP,
  LOCATION_LOOKUP,
} = require('../knowledge/fieldAliases');

/** Fields that only make sense on employees → search employee only. */
const EMPLOYEE_ONLY_FIELDS = new Set([
  'bankAccountNumber', 'bankRoutingCode', 'bankName', 'bankBranch', 'bankAccountHolder',
  'uan', 'aadhaarNumber', 'esicNumber', 'dailySalary', 'basicPay', 'dearnessAllowance',
  'dateOfJoining', 'dateOfBirth', 'parentName', 'department', 'jobTitle', 'employmentType',
  'skillCategory', 'designation',
]);

/** Fields mainly for organizations. */
const ORGANIZATION_ONLY_FIELDS = new Set([
  'organizationName', 'website', 'industry', 'governmentType', 'area', 'about',
]);

/** Fields mainly for locations. */
const LOCATION_ONLY_FIELDS = new Set([
  'workName', 'opNumber', 'loaReference',
]);

function detectTypeHint(text) {
  const value = String(text || '').toLowerCase();
  const employee = ENTITY_HINTS.employee.some((word) => containsPhrase(value, word));
  const organization = ENTITY_HINTS.organization.some((word) => containsPhrase(value, word));
  const location = ENTITY_HINTS.location.some((word) => containsPhrase(value, word));
  const count = Number(employee) + Number(organization) + Number(location);
  if (count !== 1) return null;
  if (employee) return 'employee';
  if (organization) return 'organization';
  if (location) return 'location';
  return null;
}

/**
 * Decide which entity types to query.
 * - Explicit "employee/org/location" in speech → only that
 * - Bank / UAN / salary-like fields → employee only
 * - Shared or generic details → all three in parallel
 */
function decideSearchTypes(text, intent = null, fields = []) {
  const hinted = detectTypeHint(text);
  if (hinted) return [hinted];

  const fieldList = fields.length
    ? fields
    : [
      ...matchFields(text, EMPLOYEE_LOOKUP),
      ...matchFields(text, ORGANIZATION_LOOKUP),
      ...matchFields(text, LOCATION_LOOKUP),
    ];

  if (fieldList.some((field) => EMPLOYEE_ONLY_FIELDS.has(field))) return ['employee'];
  if (fieldList.some((field) => ORGANIZATION_ONLY_FIELDS.has(field))) return ['organization'];
  if (fieldList.some((field) => LOCATION_ONLY_FIELDS.has(field))) return ['location'];

  // Intent can narrow, but untyped "details" / lookup searches all
  if (intent === 'lookup_entity') return ['employee', 'organization', 'location'];
  if (intent && intent.includes('employee') && intent !== 'list_employees' && intent !== 'count_employees') {
    return ['employee'];
  }
  if (intent && intent.includes('org')) return ['organization'];
  if (intent && intent.includes('location') && !['list_employees', 'count_employees'].includes(intent)) {
    return ['location'];
  }

  // Org-scoped actions: prefer organization (+ location) over person false-hits
  const orgActions = new Set([
    'payroll', 'salary_slip', 'wage_register', 'attendance_register', 'bank_invoice',
    'payroll_run', 'client_invoice', 'list_employees', 'count_employees', 'count_locations',
    'get_attendance', 'mark_attendance', 'edit_attendance', 'salary_amount',
  ]);
  if (orgActions.has(intent)) {
    if (hinted === 'location') return ['location', 'organization'];
    return ['organization', 'location'];
  }

  // Flexible default for bare names / shared fields (email, phone, address, details)
  return ['employee', 'organization', 'location'];
}

function extractLookupNames(text, capturedName = null) {
  const names = [];
  if (capturedName && !isReservedName(capturedName)) names.push(normalizeName(capturedName));
  for (const name of extractPossessiveNames(text)) {
    if (!isReservedName(name)) names.push(normalizeName(name));
  }
  for (const candidate of leftoverNameCandidates(text)) {
    if (!candidate || isReservedName(candidate) || candidate.length < 3) continue;
    names.push(candidate);
  }
  const unique = [...new Set(names)].sort((a, b) => b.length - a.length);
  // Multi-word person queries: drop surname-only leftovers ("jain") that false-hit orgs
  const multi = unique.filter((name) => name.split(/\s+/).length >= 2);
  if (multi.length) return multi.slice(0, 3);
  return unique.slice(0, 5);
}

function pushHits(bucket, type, resolution, query) {
  if (!resolution || resolution.status === 'none') return;
  for (const item of resolution.matches || []) {
    bucket.push({
      type,
      item,
      score: resolution.score || 0,
      query,
      status: resolution.status,
    });
  }
}

async function resolveNameAcrossTypes(query, options = {}) {
  const types = options.types || ['employee', 'organization', 'location'];
  const context = options.context || {};
  const q = normalizeName(query);
  if (!q || q.length < 2) return { status: 'none', hits: [], query: q, winner: null };

  const tasks = [];
  if (types.includes('organization')) {
    tasks.push(resolveOrganization(q).then((resolution) => ({ type: 'organization', resolution })));
  }
  if (types.includes('location')) {
    tasks.push(resolveLocation(q, { organizationId: context.organizationId })
      .then((resolution) => ({ type: 'location', resolution })));
  }
  if (types.includes('employee')) {
    tasks.push(resolveEmployee(q, {
      organizationId: context.organizationId,
      locationId: context.locationId,
    }).then((resolution) => ({ type: 'employee', resolution })));
  }

  // Parallel — in-memory index, no HTTP race needed
  const settled = await Promise.all(tasks);
  const hits = [];
  for (const row of settled) pushHits(hits, row.type, row.resolution, q);

  const byKey = new Map();
  for (const hit of hits) {
    const key = `${hit.type}:${hit.item.id}`;
    const prev = byKey.get(key);
    if (!prev || hit.score > prev.score) byKey.set(key, hit);
  }
  const unique = [...byKey.values()].sort((a, b) => b.score - a.score);
  if (!unique.length) return { status: 'none', hits: [], query: q, winner: null };

  const top = unique[0];
  const close = unique.filter((hit) => hit.score >= top.score - 5);
  const qParts = q.split(/\s+/).filter(Boolean);
  const looksLikePerson = qParts.length >= 2;

  // Person-like queries: prefer a clear employee hit over org contact / company noise
  if (looksLikePerson) {
    const employeeHits = unique.filter((hit) => hit.type === 'employee' && hit.score >= 90);
    if (employeeHits.length === 1) {
      return { status: 'exact', hits: [employeeHits[0]], query: q, winner: employeeHits[0] };
    }
    if (employeeHits.length > 1) {
      return { status: 'ambiguous', hits: employeeHits.slice(0, 8), query: q, winner: null };
    }
    // No strong employee — only accept org/location with strong company/place score
    const placeHits = unique.filter((hit) => hit.type !== 'employee' && hit.score >= 90);
    if (placeHits.length === 1) {
      return { status: 'exact', hits: [placeHits[0]], query: q, winner: placeHits[0] };
    }
    if (placeHits.length > 1) {
      return { status: 'ambiguous', hits: placeHits.slice(0, 8), query: q, winner: null };
    }
    return { status: 'none', hits: [], query: q, winner: null };
  }

  // Prefer exact same-type single winner; if multiple types tied, ambiguous
  if (close.length === 1 && top.score >= 78) {
    return { status: 'exact', hits: [top], query: q, winner: top };
  }
  return { status: 'ambiguous', hits: close.slice(0, 8), query: q, winner: null };
}

async function resolveBestAcrossTypes(names, options = {}) {
  const list = (names || []).filter(Boolean).slice(0, 5);
  if (!list.length) return { status: 'none', hits: [], query: null, winner: null, types: options.types || [] };

  const results = await Promise.all(list.map((name) => resolveNameAcrossTypes(name, options)));
  const exact = results.find((row) => row.status === 'exact' && row.winner);
  if (exact) return { ...exact, types: options.types || [] };

  const merged = [];
  const seen = new Set();
  for (const row of results) {
    for (const hit of row.hits || []) {
      const key = `${hit.type}:${hit.item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
  }
  merged.sort((a, b) => b.score - a.score);
  if (!merged.length) return { status: 'none', hits: [], query: list[0], winner: null, types: options.types || [] };
  if (merged.length === 1 && merged[0].score >= 78) {
    return { status: 'exact', hits: merged, query: list[0], winner: merged[0], types: options.types || [] };
  }
  return { status: 'ambiguous', hits: merged.slice(0, 8), query: list[0], winner: null, types: options.types || [] };
}

function hitsToAmbiguous(hits = []) {
  return {
    organizations: hits.filter((hit) => hit.type === 'organization').map((hit) => hit.item),
    locations: hits.filter((hit) => hit.type === 'location').map((hit) => hit.item),
    employees: hits.filter((hit) => hit.type === 'employee').map((hit) => hit.item),
    crossType: hits,
  };
}

module.exports = {
  detectTypeHint,
  decideSearchTypes,
  extractLookupNames,
  resolveNameAcrossTypes,
  resolveBestAcrossTypes,
  hitsToAmbiguous,
  EMPLOYEE_ONLY_FIELDS,
  ORGANIZATION_ONLY_FIELDS,
  LOCATION_ONLY_FIELDS,
};
