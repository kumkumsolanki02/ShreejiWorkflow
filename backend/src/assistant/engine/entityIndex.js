const Employee = require('../../models/Employee');
const Location = require('../../models/Location');
const User = require('../../models/User');
const { normalizeName, namesSimilar } = require('./normalize');
const { extractPossessiveNames } = require('../knowledge/questionPatterns');

const REFRESH_MS = 45_000;

let cache = {
  loadedAt: 0,
  organizations: [],
  locations: [],
  employees: [],
};

function uniqueKeys(values) {
  return [...new Set(values.map((value) => normalizeName(value)).filter(Boolean))];
}

function nameParts(value) {
  return normalizeName(value).split(' ').filter((part) => part.length > 1);
}

async function refreshEntityIndex(force = false) {
  const now = Date.now();
  if (!force && cache.loadedAt && now - cache.loadedAt < REFRESH_MS) {
    return cache;
  }

  const [organizations, locations, employees] = await Promise.all([
    User.find({ role: 'organization' })
      .select('_id organizationName name email phone address status')
      .lean(),
    Location.find()
      .select('_id organizationId workName opNumber name address designation status')
      .lean(),
    Employee.find()
      .select('_id organizationId locationId name email phone parentName status bankAccountNumber')
      .lean(),
  ]);

  cache = {
    loadedAt: now,
    organizations: organizations.map((org) => ({
      id: String(org._id),
      organizationName: org.organizationName || '',
      name: org.name || '',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      status: org.status || 'active',
      // Company keys only — contact person is scored separately (strict).
      // Including "jain"/"lata" as keys made "Lalit Jain"/"Lata Bheel" hit the wrong org.
      keys: uniqueKeys([
        org.organizationName,
        org.email,
        ...nameParts(org.organizationName),
      ]),
    })),
    locations: locations.map((location) => ({
      id: String(location._id),
      organizationId: String(location.organizationId),
      workName: location.workName || '',
      opNumber: location.opNumber || '',
      name: location.name || '',
      address: location.address || '',
      designation: location.designation || '',
      status: location.status || 'active',
      keys: uniqueKeys([
        location.name,
        location.workName,
        location.opNumber,
        ...nameParts(location.name),
        ...nameParts(location.workName),
      ]),
    })),
    employees: employees.map((employee) => {
      const parts = nameParts(employee.name);
      return {
        id: String(employee._id),
        organizationId: employee.organizationId ? String(employee.organizationId) : '',
        locationId: employee.locationId ? String(employee.locationId) : '',
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        parentName: employee.parentName || '',
        status: employee.status || 'active',
        keys: uniqueKeys([
          employee.name,
          employee.email,
          employee.phone,
          parts[0],
          parts.length > 1 ? parts.slice(0, 2).join(' ') : '',
          ...parts,
        ]),
      };
    }),
  };
  return cache;
}

function invalidateEntityIndex() {
  cache.loadedAt = 0;
}

function scoreCandidate(query, keys) {
  if (!query) return 0;
  let best = 0;
  for (const key of keys) {
    if (!key) continue;
    if (key === query) return 100;
    if (key.startsWith(query) || query.startsWith(key)) best = Math.max(best, 90);
    else if (key.includes(query) || query.includes(key)) best = Math.max(best, 82);
    else if (namesSimilar(key, query, 0.22)) best = Math.max(best, 74);
    // Multi-word place names: allow a bit more STT drift (shower gate ≈ sarwar gate)
    else if (query.includes(' ') && key.includes(' ') && namesSimilar(key, query, 0.32)) {
      best = Math.max(best, 76);
    }
  }
  return best;
}

/** Stricter person-name scoring — avoids first-name-only false matches. */
function scoreEmployeeName(query, employee) {
  const q = normalizeName(query);
  const full = normalizeName(employee.name);
  if (!q || !full) return 0;
  if (q === full) return 100;

  const qParts = q.split(' ').filter(Boolean);
  const nParts = full.split(' ').filter(Boolean);

  if (qParts.length >= 2) {
    const matched = qParts.filter((qp) => nParts.some((np) => np === qp || namesSimilar(np, qp, 0.22)));
    if (matched.length === qParts.length) return 96;
    // First name + surname with spelling variants (Chaudhari / Choudhary)
    const firstOk = nParts.some((np) => np === qParts[0] || namesSimilar(np, qParts[0], 0.18));
    const restOk = qParts.slice(1).every((qp) => nParts.some((np) => np === qp || namesSimilar(np, qp, 0.32)));
    if (firstOk && restOk) return 93;
    if (matched.length >= 2) return 90;
    // One token of a multi-word query is never enough to auto-pick
    if (matched.length === 1) return 45;
    if (full.includes(q) || q.includes(full)) return 88;
    return 0;
  }

  // Single-token query: exact token match only (still may be ambiguous)
  if (nParts.some((np) => np === qParts[0])) return 78;
  if (nParts.some((np) => namesSimilar(np, qParts[0], 0.15) && Math.min(np.length, qParts[0].length) >= 4)) {
    return 70;
  }
  if (employee.email && normalizeName(employee.email).startsWith(q)) return 72;
  if (employee.phone && String(employee.phone).includes(q)) return 72;
  return 0;
}

/**
 * Organization scoring: company name/email loose OK; contact person name must be
 * a strong full-name match (never "Jain" alone → "Pooja Jain").
 */
function scoreOrganizationName(query, org) {
  const q = normalizeName(query);
  if (!q) return 0;
  let best = scoreCandidate(q, org.keys || []);
  if (org.name) {
    const contact = scoreEmployeeName(q, { name: org.name, email: '', phone: '' });
    // Only promote contact when both name parts clearly match (or exact)
    if (contact >= 90) best = Math.max(best, contact - 2);
  }
  return best;
}

function resolveFromList(list, rawQuery, { minScore = 70, limit = 6, scorer = null } = {}) {
  const query = normalizeName(rawQuery);
  if (!query || query.length < 2) {
    return { status: 'none', matches: [] };
  }

  const scored = list
    .map((item) => ({
      item,
      score: scorer ? scorer(query, item) : scoreCandidate(query, item.keys),
    }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score || String(a.item.name || '').localeCompare(String(b.item.name || '')));

  if (scored.length === 0) return { status: 'none', matches: [] };

  const top = scored[0];
  const close = scored.filter((entry) => entry.score >= top.score - 5).slice(0, limit);
  if (close.length === 1) {
    if (top.score >= 90) return { status: 'exact', matches: [top.item], score: top.score };
    // One clear candidate — never force a useless single-choice loop
    if (top.score >= minScore) return { status: 'fuzzy', matches: [top.item], score: top.score };
  }
  return { status: 'ambiguous', matches: close.map((entry) => entry.item), score: top.score };
}

async function resolveOrganization(rawQuery, options = {}) {
  const data = await refreshEntityIndex();
  return resolveFromList(data.organizations, rawQuery, {
    ...options,
    minScore: options.minScore ?? 70,
    scorer: scoreOrganizationName,
  });
}

async function resolveLocation(rawQuery, options = {}) {
  const data = await refreshEntityIndex();
  let list = data.locations;
  if (options.organizationId) {
    list = list.filter((item) => item.organizationId === String(options.organizationId));
  }
  return resolveFromList(list, rawQuery, options);
}

async function resolveEmployee(rawQuery, options = {}) {
  const data = await refreshEntityIndex();
  let list = data.employees;
  if (options.organizationId) {
    list = list.filter((item) => item.organizationId === String(options.organizationId));
  }
  if (options.locationId) {
    list = list.filter((item) => item.locationId === String(options.locationId));
  }
  if (options.activeOnly) {
    list = list.filter((item) => item.status === 'active');
  }
  return resolveFromList(list, rawQuery, {
    ...options,
    minScore: options.minScore ?? 70,
    scorer: scoreEmployeeName,
  });
}

async function getEmployeesByFilter({ organizationId, locationId, status = 'active' } = {}) {
  const data = await refreshEntityIndex();
  return data.employees.filter((employee) => {
    if (organizationId && employee.organizationId !== String(organizationId)) return false;
    if (locationId && employee.locationId !== String(locationId)) return false;
    if (status && status !== 'all' && employee.status !== status) return false;
    return true;
  });
}

async function getLocationsByOrganizationId(organizationId, { status = 'active' } = {}) {
  if (!organizationId) return [];
  const data = await refreshEntityIndex();
  return data.locations.filter((location) => {
    if (location.organizationId !== String(organizationId)) return false;
    if (status && status !== 'all' && location.status !== status) return false;
    return true;
  });
}

async function getOrganizationById(id) {
  const data = await refreshEntityIndex();
  return data.organizations.find((item) => item.id === String(id)) || null;
}

async function getLocationById(id) {
  const data = await refreshEntityIndex();
  return data.locations.find((item) => item.id === String(id)) || null;
}

async function getEmployeeById(id) {
  const data = await refreshEntityIndex();
  return data.employees.find((item) => item.id === String(id)) || null;
}

function leftoverNameCandidates(text, stopWords = []) {
  const possessive = extractPossessiveNames(text);
  let value = normalizeName(text);
  const stops = [
    ...stopWords,
    'show', 'give', 'tell', 'get', 'please', 'send', 'fetch', 'need',
    'मुझे', 'दो', 'दे', 'बताओ', 'दिखाओ', 'चाहिए', 'चाहिये',
    'the', 'a', 'an', 'of', 'for', 'to', 'me', 'my', 'all', 'active', 'full', 'details',
    'information', 'जानकारी', 'का', 'की', 'के', 'में', 'पर', 'से', 'और', 'this', 'that',
    'organization', 'organisation', 'location', 'employee', 'employees', 'attendance',
    'payroll', 'invoice', 'salary', 'slip', 'bank', 'count', 'list', 'month', 'today',
    'number', 'mobile', 'phone', 'email', 'account', 'ifsc', 'present', 'absent',
    'summary', 'report', 'register', 'letter', 'bill', 'pdf', 'excel',
    'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october',
  ];
  for (const stop of stops) {
    const needle = normalizeName(stop);
    if (!needle) continue;
    value = value.replace(new RegExp(`(?:^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'g'), ' ');
  }
  value = value.replace(/\s+/g, ' ').trim();
  const candidates = [...possessive.map((name) => normalizeName(name)).filter(Boolean)];
  if (value && value.length >= 2) candidates.push(value);
  const parts = value.split(' ').filter((part) => part.length > 1);
  if (parts.length > 1) {
    for (let i = 0; i < parts.length; i += 1) {
      candidates.push(parts[i]);
      if (i < parts.length - 1) candidates.push(`${parts[i]} ${parts[i + 1]}`);
      if (i < parts.length - 2) candidates.push(`${parts[i]} ${parts[i + 1]} ${parts[i + 2]}`);
    }
  }
  return [...new Set(candidates)].sort((a, b) => b.length - a.length);
}

async function applyMatch(result, kind, resolution) {
  if (!resolution || resolution.status === 'none') return;
  if (resolution.status === 'exact' || resolution.status === 'fuzzy') {
    result[kind] = resolution.matches[0];
    result[`${kind}Matches`] = resolution.matches;
    return;
  }
  if (resolution.status === 'ambiguous' && !result[`${kind}Matches`].length) {
    result[`${kind}Matches`] = resolution.matches;
  }
}

async function detectEntitiesInText(text, context = {}) {
  const possessive = extractPossessiveNames(text).map((name) => normalizeName(name)).filter(Boolean);
  const captured = context.capturedName ? normalizeName(context.capturedName) : '';
  const explicitEmployeeNames = [...new Set([captured, ...possessive].filter(Boolean))];
  const leftovers = leftoverNameCandidates(text);

  const result = {
    organization: null,
    location: null,
    employee: null,
    organizationMatches: [],
    locationMatches: [],
    employeeMatches: [],
    soughtEmployeeName: explicitEmployeeNames[0] || null,
    explicitEmployeeMention: explicitEmployeeNames.length > 0,
  };

  // Employee: ONLY use explicit spoken names (never weak leftover tokens)
  const employeeCandidates = explicitEmployeeNames.length
    ? explicitEmployeeNames
    : leftovers.filter((candidate) => candidate.split(' ').length >= 2).slice(0, 3);

  for (const candidate of employeeCandidates) {
    if (result.employee || result.employeeMatches.length) break;
    await applyMatch(result, 'employee', await resolveEmployee(candidate, {
      organizationId: context.organizationId,
      locationId: context.locationId,
    }));
    if (!result.soughtEmployeeName) result.soughtEmployeeName = candidate;
  }

  if (result.employee) {
    if (!result.organization && result.employee.organizationId) {
      result.organization = await getOrganizationById(result.employee.organizationId);
    }
    if (!result.location && result.employee.locationId) {
      result.location = await getLocationById(result.employee.locationId);
    }
  }

  // Org / location from leftovers + explicit names
  const placeCandidates = [...new Set([...explicitEmployeeNames, ...leftovers])];
  for (const candidate of placeCandidates) {
    if (!result.organization) {
      await applyMatch(result, 'organization', await resolveOrganization(candidate));
    }
    if (!result.location) {
      await applyMatch(result, 'location', await resolveLocation(candidate, {
        organizationId: result.organization?.id || context.organizationId,
      }));
      if (result.location && !result.organization && result.location.organizationId) {
        result.organization = await getOrganizationById(result.location.organizationId);
      }
    }
  }

  return result;
}

module.exports = {
  refreshEntityIndex,
  invalidateEntityIndex,
  resolveOrganization,
  resolveLocation,
  resolveEmployee,
  getEmployeesByFilter,
  getLocationsByOrganizationId,
  getOrganizationById,
  getLocationById,
  getEmployeeById,
  detectEntitiesInText,
  leftoverNameCandidates,
  scoreEmployeeName,
  scoreOrganizationName,
};
