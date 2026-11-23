const { STATUS_PHRASES, CONTEXT_WORDS } = require('../knowledge/synonyms');
const { extractMonth, extractDate, containsPhrase, currentMonthInTimeZone, currentDateInTimeZone } = require('./normalize');
const { detectEntitiesInText } = require('./entityIndex');
const {
  detectTypeHint,
  decideSearchTypes,
  extractLookupNames,
  resolveBestAcrossTypes,
  hitsToAmbiguous,
} = require('./crossTypeResolve');
const {
  isOrgActionIntent,
  detectLocationScope,
  resolveOrgScopedEntities,
} = require('./orgScope');
const { extractPossessiveNames } = require('../knowledge/questionPatterns');
const { matchFields, EMPLOYEE_LOOKUP, ORGANIZATION_LOOKUP, LOCATION_LOOKUP } = require('../knowledge/fieldAliases');

function extractStatus(text) {
  const value = String(text || '').toLowerCase();
  for (const entry of STATUS_PHRASES) {
    if (entry.phrases.some((phrase) => containsPhrase(value, phrase))) {
      return entry.status;
    }
  }
  return null;
}

function extractFormat(text) {
  const value = String(text || '').toLowerCase();
  if (containsPhrase(value, 'excel') || containsPhrase(value, 'xlsx') || containsPhrase(value, 'sheet')) {
    return 'excel';
  }
  if (containsPhrase(value, 'pdf')) return 'pdf';
  return 'pdf';
}

function usesContextReference(text) {
  const value = String(text || '').toLowerCase();
  return CONTEXT_WORDS.some((word) => containsPhrase(value, word));
}

async function fillSlots(text, intentResult, sessionSlots = {}, timeZone = 'Asia/Kolkata') {
  const month = extractMonth(text, sessionSlots.month || currentMonthInTimeZone(timeZone));
  const date = extractDate(text, timeZone);
  const status = extractStatus(text);
  const format = extractFormat(text);

  const employeeFields = matchFields(text, EMPLOYEE_LOOKUP);
  const orgFields = matchFields(text, ORGANIZATION_LOOKUP);
  const locationFields = matchFields(text, LOCATION_LOOKUP);
  let fields = intentResult.fields || [];
  if (!fields.length) {
    if (intentResult.intent?.includes('employee')) fields = employeeFields;
    else if (intentResult.intent?.includes('org')) fields = orgFields;
    else if (intentResult.intent?.includes('location')) fields = locationFields;
    else fields = [...new Set([...employeeFields, ...orgFields, ...locationFields])];
  }

  let intent = intentResult.intent;
  let outputMode = intentResult.outputMode || null;
  const typeHintEarly = detectTypeHint(text);

  // ── Org-scoped actions: resolve org (+ optional location / all locations) ──
  if (isOrgActionIntent(intent)) {
    const scoped = await resolveOrgScopedEntities(text, {
      intent,
      capturedName: intentResult.capturedName || null,
      sessionSlots,
    });

    let organization = scoped.organization;
    let location = scoped.location;
    let locationIds = scoped.locationIds || [];
    let locationScope = scoped.locationScope;

    // Carry org from session when no new name was spoken (follow-up: "payroll दो", "employees list")
    if (!organization && sessionSlots.organizationId && !scoped.names.length) {
      const { getOrganizationById } = require('./entityIndex');
      organization = await getOrganizationById(sessionSlots.organizationId);
    }

    if (intent === 'count_locations') {
      location = null;
      locationScope = 'all_in_org';
    }

    const orgNamedThisTurn = Boolean(organization) && (scoped.names || []).length > 0;
    // If a specific location was resolved, never force all-locations
    const wantAllLocations = !location && (
      locationScope === 'all_in_org'
      || (['list_employees', 'count_employees', 'count_locations', 'payroll', 'salary_slip', 'get_attendance'].includes(intent)
        && orgNamedThisTurn
        && locationScope !== 'single')
    );

    // Never stick previous location onto a fresh org-wide ask
    if (wantAllLocations) {
      location = null;
      locationScope = 'all_in_org';
    }

    // Carry location only for true follow-ups (no new org/location name this turn)
    if (
      !location
      && sessionSlots.locationId
      && !wantAllLocations
      && locationScope !== 'all_in_org'
      && !orgNamedThisTurn
      && !scoped.mentionsLocation
      && !(scoped.names || []).length
    ) {
      const { getLocationById } = require('./entityIndex');
      const sessionLoc = await getLocationById(sessionSlots.locationId);
      if (sessionLoc && (!organization || String(sessionLoc.organizationId) === String(organization.id))) {
        location = sessionLoc;
      }
    }

    // For registers / bank invoice with org but no location → all locations
    const needsAllOrOne = ['wage_register', 'attendance_register', 'bank_invoice'].includes(intent);
    if (organization && !location && locationScope !== 'single' && (locationScope === 'all_in_org' || needsAllOrOne || wantAllLocations)) {
      const { getLocationsByOrganizationId } = require('./entityIndex');
      const locs = await getLocationsByOrganizationId(organization.id, { status: 'active' });
      locationIds = locs.map((item) => item.id);
      locationScope = 'all_in_org';
    }

    // Payroll / salary_slip / list / count / get_attendance: org alone is enough
    if (organization && !location && ['payroll', 'salary_slip', 'list_employees', 'count_employees', 'count_locations', 'get_attendance', 'salary_amount'].includes(intent)) {
      locationScope = locationScope || 'all_in_org';
      if (!locationIds.length) {
        const { getLocationsByOrganizationId } = require('./entityIndex');
        const locs = await getLocationsByOrganizationId(organization.id, { status: 'active' });
        locationIds = locs.map((item) => item.id);
      }
    }

    const slots = {
      organizationId: organization?.id || location?.organizationId || null,
      locationId: locationScope === 'all_in_org' ? null : (location?.id || null),
      locationIds: locationIds.length ? locationIds : null,
      locationScope: locationScope || null,
      employeeId: null,
      month: month || null,
      date: date || null,
      status: status || null,
      fields,
      format,
      outputMode,
      intent,
      resolvedType: location ? 'location' : (organization ? 'organization' : null),
      soughtName: scoped.names[0] || null,
      searchTypes: ['organization', 'location'],
    };

    const ambiguous = {
      organizations: organization ? [] : (scoped.organizationMatches || []),
      locations: location ? [] : (scoped.locationMatches || []),
      employees: [],
      crossType: [],
    };

    const namedLookup = scoped.names.length > 0;
    return {
      slots,
      entities: {
        organization,
        location,
        employee: null,
        organizationMatches: scoped.organizationMatches,
        locationMatches: scoped.locationMatches,
        employeeMatches: [],
        soughtEmployeeName: null,
        resolvedType: slots.resolvedType,
        searchTypes: slots.searchTypes,
        locationScope,
        locationIds,
      },
      ambiguous,
      usesContext: usesContextReference(text) && !namedLookup,
      explicitEmployeeMention: false,
      // Only treat as an explicit location pick when we actually resolved one (or typed "location …")
      // locationScope===single alone must NOT block carrying session.locationId on a failed resolve
      explicitLocationMention: Boolean(location) || typeHintEarly === 'location',
      explicitOrganizationMention: Boolean(organization) || typeHintEarly === 'organization' || namedLookup,
      soughtEmployeeName: null,
      typeHint: typeHintEarly || (organization ? 'organization' : null),
      searchTypes: slots.searchTypes,
      crossStatus: organization || location ? 'exact' : (ambiguous.organizations.length || ambiguous.locations.length ? 'ambiguous' : 'none'),
      defaultDate: currentDateInTimeZone(timeZone),
      defaultMonth: currentMonthInTimeZone(timeZone),
    };
  }

  // ── Default person / entity lookup path ──
  const searchTypes = decideSearchTypes(text, intentResult.intent, fields);
  const names = extractLookupNames(text, intentResult.capturedName || null);

  const resolveContext = names.length
    ? {}
    : {
      organizationId: sessionSlots.organizationId || null,
      locationId: sessionSlots.locationId || null,
    };

  let cross = await resolveBestAcrossTypes(names, {
    types: searchTypes,
    context: resolveContext,
  });

  // Typed hint missed (e.g. "Madanganj organisation" but Madanganj is a location) → search all types
  if (names.length && cross.status === 'none' && searchTypes.length < 3) {
    cross = await resolveBestAcrossTypes(names, {
      types: ['employee', 'organization', 'location'],
      context: {},
    });
  }

  let entities = {
    organization: null,
    location: null,
    employee: null,
    organizationMatches: [],
    locationMatches: [],
    employeeMatches: [],
    soughtEmployeeName: names[0] || null,
    explicitEmployeeMention: names.length > 0,
    crossTypeHits: cross.hits || [],
    resolvedType: null,
    searchTypes,
  };

  if (cross.status === 'exact' && cross.winner) {
    const winner = cross.winner;
    entities.resolvedType = winner.type;
    if (winner.type === 'employee') {
      entities.employee = winner.item;
      entities.employeeMatches = [winner.item];
      entities.soughtEmployeeName = names[0] || winner.item.name;
    } else if (winner.type === 'organization') {
      entities.organization = winner.item;
      entities.organizationMatches = [winner.item];
    } else if (winner.type === 'location') {
      entities.location = winner.item;
      entities.locationMatches = [winner.item];
    }
  } else if (cross.status === 'ambiguous') {
    Object.assign(entities, hitsToAmbiguous(cross.hits));
    entities.crossTypeHits = cross.hits;
  } else if (searchTypes.length === 1 && !names.length) {
    const legacy = await detectEntitiesInText(text, {
      ...sessionSlots,
      capturedName: intentResult.capturedName || null,
    });
    entities = { ...entities, ...legacy, crossTypeHits: [], searchTypes };
  }

  const explicitNames = [
    intentResult.capturedName,
    entities.soughtEmployeeName,
    ...extractPossessiveNames(text),
  ].filter(Boolean);

  if (entities.resolvedType && (intent === 'lookup_entity' || intent === 'unknown')) {
    intent = entities.resolvedType === 'employee'
      ? (fields.length && outputMode !== 'full' ? 'get_employee_field' : 'get_employee_full')
      : entities.resolvedType === 'organization'
        ? (fields.length && outputMode !== 'full' ? 'get_org_field' : 'get_org_full')
        : (fields.length && outputMode !== 'full' ? 'get_location_field' : 'get_location_full');
    if (!fields.length) outputMode = 'full';
  }

  if (entities.resolvedType === 'employee' && !fields.length && intent?.includes('field')) {
    fields = employeeFields;
  } else if (entities.resolvedType === 'organization' && !fields.length && intent?.includes('field')) {
    fields = orgFields;
  } else if (entities.resolvedType === 'location' && !fields.length && intent?.includes('field')) {
    fields = locationFields;
  }

  const slots = {
    organizationId: entities.organization?.id || entities.location?.organizationId || entities.employee?.organizationId || null,
    locationId: entities.location?.id || entities.employee?.locationId || null,
    locationIds: null,
    locationScope: detectLocationScope(text),
    employeeId: entities.employee?.id || null,
    month: month || null,
    date: date || null,
    status: status || null,
    fields,
    format,
    outputMode,
    intent,
    // Never invent resolvedType from a failed typed hint (showed Warm Earth when Madanganj is a location)
    resolvedType: entities.resolvedType || null,
    soughtName: names[0] || null,
    searchTypes,
  };

  const ambiguous = {
    organizations: entities.organizationMatches || [],
    locations: entities.locationMatches || [],
    employees: entities.employeeMatches || [],
    crossType: entities.crossTypeHits || [],
  };

  const typeHint = typeHintEarly || null;
  const namedLookup = names.length > 0;

  return {
    slots,
    entities,
    ambiguous,
    usesContext: usesContextReference(text) && explicitNames.length === 0 && !namedLookup,
    explicitEmployeeMention: namedLookup || typeHint === 'employee',
    explicitLocationMention: namedLookup || typeHint === 'location' || Boolean(entities.location),
    explicitOrganizationMention: namedLookup || typeHint === 'organization' || Boolean(entities.organization),
    soughtEmployeeName: entities.soughtEmployeeName || names[0] || null,
    typeHint,
    searchTypes,
    crossStatus: cross.status,
    defaultDate: currentDateInTimeZone(timeZone),
    defaultMonth: currentMonthInTimeZone(timeZone),
  };
}

module.exports = {
  fillSlots,
  extractStatus,
  extractFormat,
  usesContextReference,
  detectTypeHint,
  decideSearchTypes,
  detectLocationScope,
  isOrgActionIntent,
};
