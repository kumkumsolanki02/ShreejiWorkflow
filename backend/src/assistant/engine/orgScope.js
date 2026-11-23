const { containsPhrase, normalizeName } = require('./normalize');
const { ENTITY_HINTS } = require('../knowledge/synonyms');
const {
  resolveOrganization,
  resolveLocation,
  getLocationsByOrganizationId,
  leftoverNameCandidates,
} = require('./entityIndex');
const { extractPossessiveNames, isReservedName } = require('../knowledge/questionPatterns');

/** Intents that can run at organization scope (all locations or one location under the org). */
const ORG_ACTION_INTENTS = new Set([
  'payroll',
  'salary_slip',
  'wage_register',
  'attendance_register',
  'bank_invoice',
  'payroll_run',
  'client_invoice',
  'list_employees',
  'count_employees',
  'count_locations',
  'count_organizations',
  'get_attendance',
  'mark_attendance',
  'edit_attendance',
  'salary_amount',
]);

const ALL_LOCATION_PHRASES = [
  'सभी location', 'सारी location', 'सभी locations', 'सारी locations',
  'सभी लोकेशन', 'सारी लोकेशन', 'हर location', 'हर लोकेशन',
  'all location', 'all locations', 'every location', 'each location',
  'sabhi location', 'saari location', 'har location',
  'सभी site', 'सारी site', 'all sites', 'सभी साइट',
  'पूरी organization', 'पूरी org', 'entire organization', 'whole organization',
  'org की सभी', 'organization की सभी', 'organization के अंदर सभी',
  'org ke andar sabhi', 'organization ke andar sabhi',
  'सभी जगह', 'हर जगह',
  'jitni bhi location', 'jitne bhi location', 'jitni bhi locations', 'jitne bhi locations',
  'un sab', 'un sabke', 'un sab ka', 'un sab ki',
];

const ORG_INNER_PHRASES = [
  'के अंदर', 'के अन्दर', 'के अंतर्गत', 'में',
  'ke andar', 'under', 'inside', 'within',
];

function isOrgActionIntent(intent) {
  return ORG_ACTION_INTENTS.has(intent);
}

/**
 * @returns {'all_in_org'|'single'|null}
 * all_in_org = every location under the org
 * single = one location (name present or will ask)
 * null = unset (org-only actions like payroll/list can still use organizationId alone)
 */
function hasNamedLocationPhrase(value) {
  // "madanganj location" / "tata db location" — allow short tokens like "db"
  return /(?:^|\s)([\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}(?:\s+[\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}){0,3})\s+(?:location|लोकेशन|site)\b/iu.test(value)
    || /\b(?:location|लोकेशन|site)\s+([\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}(?:\s+[\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}){0,3})\b/iu.test(value);
}

function hasAllLocationsPhrase(value) {
  if (ALL_LOCATION_PHRASES.some((phrase) => containsPhrase(value, phrase))) return true;
  // Explicit plural / "all locations" only — NOT "all employees at X location"
  if (/(?:all|सभी|सारी|jitn[ie]\s+bhi|sabhi)\s+locations?\b/i.test(value)) return true;
  if (/\blocations?\s+(?:all|सभी|सारी|kitne|kitni|कितने|कितनी)\b/i.test(value)) return true;
  if (/(?:all|सभी|सारी).{0,25}\blocations?\b/i.test(value) && !hasNamedLocationPhrase(value)) return true;
  return false;
}

function detectLocationScope(text) {
  const value = String(text || '').toLowerCase();

  // Named site wins: "Madanganj location ke andar jitne bhi employee…" = that one location
  if (hasNamedLocationPhrase(value) && !hasAllLocationsPhrase(value)) {
    return 'single';
  }

  if (hasAllLocationsPhrase(value)) {
    return 'all_in_org';
  }

  // Org-wide employee/payroll/slip language without naming one site
  if (
    !hasNamedLocationPhrase(value)
    && (/\ball\b/.test(value) || containsPhrase(value, 'सभी') || containsPhrase(value, 'सारे')
      || containsPhrase(value, 'sabke') || containsPhrase(value, 'un sab')
      || containsPhrase(value, 'ke andar') || containsPhrase(value, 'के अंदर'))
    && (containsPhrase(value, 'payroll') || containsPhrase(value, 'पेरोल')
      || containsPhrase(value, 'salary slip') || containsPhrase(value, 'salary')
      || containsPhrase(value, 'attendance') || containsPhrase(value, 'अटेंडेंस')
      || containsPhrase(value, 'employee') || containsPhrase(value, 'employees')
      || containsPhrase(value, 'कर्मचारी'))
  ) {
    return 'all_in_org';
  }

  const mentionsLocation = ENTITY_HINTS.location.some((word) => containsPhrase(value, word));
  if (mentionsLocation) return 'single';
  return null;
}

function stripResolvedName(text, entity) {
  let value = normalizeName(text);
  const needles = [
    entity?.organizationName,
    entity?.name,
    entity?.workName,
  ].map((item) => normalizeName(item)).filter(Boolean);
  for (const needle of needles) {
    value = value.replace(new RegExp(`(?:^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'g'), ' ');
  }
  return value.replace(/\s+/g, ' ').trim();
}

function extractJoClauseNames(text) {
  const value = String(text || '');
  const names = [];
  const patterns = [
    /\bjo\s+([\p{L}][\p{L}\p{N}.'\-\s]{1,40}?)\s+hai\b/giu,
    /\bजो\s+([\p{L}][\p{L}\p{N}.'\-\s]{1,40}?)\s+है\b/giu,
    /\b(?:uske|उसके|usi|उसी)\s+(?:andar\s+)?([\p{L}][\p{L}\p{N}.'\-\s]{1,40}?)\s+(?:hai|है|ka|ke|ki|का|के|की)\b/giu,
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(value);
    while (match) {
      const name = normalizeName(match[1]);
      if (name && name.length > 2 && !isReservedName(name)) names.push(name);
      match = pattern.exec(value);
    }
  }
  return names;
}

function candidateNamesFromText(text, capturedName = null) {
  const names = [];
  if (capturedName && !isReservedName(capturedName)) names.push(normalizeName(capturedName));
  for (const name of extractPossessiveNames(text)) {
    if (!isReservedName(name)) names.push(normalizeName(name));
  }
  for (const name of extractJoClauseNames(text)) names.push(name);
  for (const candidate of leftoverNameCandidates(text)) {
    if (!candidate || isReservedName(candidate) || candidate.length < 2) continue;
    names.push(candidate);
  }
  return [...new Set(names)].sort((a, b) => b.length - a.length);
}

/**
 * Resolve organization (+ optional location under it) for org-scoped actions.
 * Returns organization, location, locationIds (when all_in_org), locationScope, ambiguous.
 */
async function resolveOrgScopedEntities(text, {
  intent = null,
  capturedName = null,
  sessionSlots = {},
} = {}) {
  const locationScope = detectLocationScope(text);
  const mentionsOrg = ENTITY_HINTS.organization.some((word) => containsPhrase(text, word))
    || ORG_INNER_PHRASES.some((phrase) => containsPhrase(text, phrase));
  const mentionsLocation = ENTITY_HINTS.location.some((word) => containsPhrase(text, word));

  const names = candidateNamesFromText(text, capturedName);
  let organization = null;
  let organizationMatches = [];
  let location = null;
  let locationMatches = [];

  // Prefer an explicit "jo <place> hai" / "Tata DB location" — resolve LOCATION first
  // so "tata db" is not stolen by a similarly named organization ("tata fund").
  const joPlaces = extractJoClauseNames(text);
  const namedPlace = hasNamedLocationPhrase(text);
  const forceSingleLocation = joPlaces.length > 0
    || locationScope === 'single'
    || namedPlace
    || (mentionsLocation && locationScope !== 'all_in_org');

  const namedPlaceMatch = String(text || '').match(
    /(?:^|\s)([\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}(?:\s+[\p{L}\p{N}][\p{L}\p{N}'.\-]{0,20}){0,3})\s+(?:location|लोकेशन|site)\b/iu,
  );
  const placeToken = namedPlaceMatch?.[1] ? normalizeName(namedPlaceMatch[1]) : null;
  if (placeToken && isReservedName(placeToken)) {
    // ignore reserved place tokens
  }

  const earlyPlaceNames = [...new Set([
    ...joPlaces,
    ...(placeToken && !isReservedName(placeToken) ? [placeToken] : []),
  ])].sort((a, b) => b.length - a.length);

  async function adoptLocation(hit) {
    location = hit;
    locationMatches = [hit];
    if (hit.organizationId) {
      const { getOrganizationById } = require('./entityIndex');
      const locOrg = await getOrganizationById(hit.organizationId);
      if (locOrg) {
        organization = locOrg;
        organizationMatches = [locOrg];
      }
    }
  }

  if (earlyPlaceNames.length) {
    for (const candidate of earlyPlaceNames.slice(0, 4)) {
      if (candidate.split(/\s+/).length === 1 && candidate.length < 3) continue;
      const resolution = await resolveLocation(candidate, { minScore: 70 });
      if (resolution.status === 'exact' || resolution.status === 'fuzzy') {
        await adoptLocation(resolution.matches[0]);
        break;
      }
      if (resolution.status === 'ambiguous' && !locationMatches.length) {
        locationMatches = resolution.matches;
      }
    }
  }

  // Document asks often omit the word "location" ("Tata DB ka invoice do") —
  // try strong location matches before org, so work-names are not stolen by company names.
  const docNeedsPlace = [
    'client_invoice', 'wage_register', 'attendance_register', 'bank_invoice',
    'salary_slip', 'payroll', 'mark_attendance', 'get_attendance',
  ].includes(intent);
  if (!location && docNeedsPlace) {
    for (const candidate of names.slice(0, 6)) {
      if (!candidate || candidate.length < 3) continue;
      if (isReservedName(candidate)) continue;
      const resolution = await resolveLocation(candidate, { minScore: 88 });
      if (resolution.status === 'exact' || (resolution.status === 'fuzzy' && (resolution.score || 0) >= 90)) {
        await adoptLocation(resolution.matches[0]);
        break;
      }
    }
  }

  // 1) Resolve organization only when location was not pinned by "X location"
  const orgCandidates = names.length ? names : [];
  if (!location) {
    if (sessionSlots.organizationId && !orgCandidates.length && (mentionsOrg || usesSoftOrgRef(text))) {
      // follow-up without new org name handled by caller via session
    }

    for (const candidate of orgCandidates) {
      // Skip candidates that are clearly the spoken place name
      if (placeToken && (candidate === placeToken || placeToken.includes(candidate) || candidate.includes(placeToken))) {
        continue;
      }
      const resolution = await resolveOrganization(candidate, { minScore: 78 });
      if (resolution.status === 'exact' || resolution.status === 'fuzzy') {
        organization = resolution.matches[0];
        organizationMatches = resolution.matches;
        break;
      }
      if (resolution.status === 'ambiguous' && !organizationMatches.length) {
        organizationMatches = resolution.matches;
      }
    }

    if (!organization && mentionsOrg && orgCandidates.length) {
      for (const candidate of orgCandidates) {
        if (placeToken && (candidate === placeToken || placeToken.includes(candidate))) continue;
        const resolution = await resolveOrganization(candidate, { minScore: 70 });
        if (resolution.matches?.length === 1) {
          organization = resolution.matches[0];
          organizationMatches = resolution.matches;
          break;
        }
      }
    }
  }

  // 2) Resolve location under org (or globally) when not already pinned
  const remainder = organization ? stripResolvedName(text, organization) : normalizeName(text);
  const locationCandidates = candidateNamesFromText(remainder, null)
    .filter((name) => !organization || normalizeName(organization.organizationName) !== name);

  const extraLoc = names.filter((name) => {
    if (!organization) return true;
    const orgName = normalizeName(organization.organizationName);
    const contact = normalizeName(organization.name);
    return name !== orgName && name !== contact && !orgName.includes(name);
  });
  const locNames = [...new Set([
    ...(placeToken && !isReservedName(placeToken) ? [placeToken] : []),
    ...locationCandidates,
    ...extraLoc,
  ])]
    .filter((name) => name.split(/\s+/).length >= 1 && name.length >= 3)
    .sort((a, b) => b.length - a.length);

  // Named place → always search locations globally (do not filter by a wrongly matched org)
  const orgIdForLocation = (namedPlace || joPlaces.length > 0)
    ? null
    : (organization?.id || sessionSlots.organizationId || null);

  if (!location && (forceSingleLocation || (locationScope !== 'all_in_org' && locNames.length)) && locNames.length) {
    const tryNames = [...new Set([...joPlaces, ...locNames])].sort((a, b) => b.length - a.length);
    for (const candidate of tryNames.slice(0, 6)) {
      if (organization && !(namedPlace || joPlaces.length)) {
        const orgTokens = normalizeName(organization.organizationName || '').split(/\s+/).filter(Boolean);
        const candTokens = candidate.split(/\s+/);
        if (orgTokens.length && candTokens.every((token) => orgTokens.includes(token)) && candTokens.length <= orgTokens.length) {
          continue;
        }
      }
      if (candidate.split(/\s+/).length === 1 && candidate.length < 3) continue;
      const resolution = await resolveLocation(candidate, {
        organizationId: orgIdForLocation || undefined,
        minScore: 70,
      });
      if (resolution.status === 'exact' || resolution.status === 'fuzzy') {
        location = resolution.matches[0];
        locationMatches = resolution.matches;
        if (location.organizationId) {
          const { getOrganizationById } = require('./entityIndex');
          const locOrg = await getOrganizationById(location.organizationId);
          if (locOrg) {
            organization = locOrg;
            organizationMatches = [locOrg];
          }
        }
        break;
      }
      if (resolution.status === 'ambiguous' && !locationMatches.length) {
        locationMatches = resolution.matches;
      }
    }
  }

  let locationIds = [];
  let effectiveScope = locationScope;

  // Named site ("jo Savar Gate hai" / "Madanganj location") always wins over all_in_org
  if (location && (joPlaces.length > 0 || namedPlace || locationScope === 'single')) {
    effectiveScope = 'single';
    locationIds = [];
  } else if (organization && locationScope === 'all_in_org' && !location) {
    const locs = await getLocationsByOrganizationId(organization.id, { status: 'active' });
    locationIds = locs.map((item) => item.id);
    location = null;
  } else if (organization && !location && !locationScope && isOrgActionIntent(intent)) {
    effectiveScope = null;
  } else if (location) {
    effectiveScope = 'single';
  }

  // Named place wins: keep location and adopt its org. Otherwise drop mismatched location.
  if (organization && location && String(location.organizationId) !== String(organization.id)) {
    if (namedPlace || joPlaces.length > 0) {
      const { getOrganizationById } = require('./entityIndex');
      const locOrg = await getOrganizationById(location.organizationId);
      if (locOrg) {
        organization = locOrg;
        organizationMatches = [locOrg];
      }
    } else {
      locationMatches = [location];
      location = null;
    }
  }

  return {
    organization,
    organizationMatches,
    location,
    locationMatches,
    locationIds,
    locationScope: effectiveScope,
    mentionsOrg,
    mentionsLocation,
    names,
  };
}

function usesSoftOrgRef(text) {
  return CONTEXT_WORDS_SAFE.some((word) => containsPhrase(text, word));
}

const CONTEXT_WORDS_SAFE = ['इस', 'उस', 'इसी', 'उसी', 'this', 'that', 'same', 'usi', 'isi'];

module.exports = {
  ORG_ACTION_INTENTS,
  ALL_LOCATION_PHRASES,
  isOrgActionIntent,
  detectLocationScope,
  hasNamedLocationPhrase,
  hasAllLocationsPhrase,
  resolveOrgScopedEntities,
  candidateNamesFromText,
  stripResolvedName,
};
