const {
  INTENTS,
  ENTITY_HINTS,
  FULL_WORDS,
  COUNT_WORDS,
  LIST_WORDS,
  NOISE_WORDS,
} = require('../knowledge/synonyms');
const { matchQuestionPatterns } = require('../knowledge/questionPatterns');
const { containsPhrase } = require('./normalize');
const {
  matchFields,
  EMPLOYEE_LOOKUP,
  ORGANIZATION_LOOKUP,
  LOCATION_LOOKUP,
} = require('../knowledge/fieldAliases');

function phraseHits(text, phrases) {
  let score = 0;
  let hits = 0;
  for (const phrase of phrases) {
    if (containsPhrase(text, phrase)) {
      hits += 1;
      score += Math.max(1, Math.min(5, String(phrase).split(/\s+/).length + 1));
    }
  }
  return { score, hits };
}

function hasAny(text, list) {
  return list.some((item) => containsPhrase(text, item));
}

function stripNoise(text) {
  let value = String(text || '').toLowerCase();
  for (const noise of NOISE_WORDS) {
    value = value.replace(new RegExp(`(?:^|\\s)${noise.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'gi'), ' ');
  }
  return value.replace(/\s+/g, ' ').trim();
}

function hasActionVerb(text) {
  return hasAny(text, [
    'लगा', 'लगा दो', 'mark', 'maar', 'डाल', 'डाल दो', 'भर', 'भर दो',
    'कर दो', 'कर दे', 'set', 'update', 'edit', 'change', 'बदल',
    'nikalo', 'निकालो', 'banao', 'बनाओ', 'generate', 'download',
  ]);
}

function hasDocumentCue(text) {
  return hasAny(text, [
    'payroll', 'petrol', 'patrol', 'पेरोल',
    'wage register', 'wage sheet', 'bedsheet', 'वेज रजिस्टर', 'वेज',
    'salary slip', 'payslip', 'सैलरी स्लिप',
    'bank invoice', 'bank letter', 'neft letter', 'neft', 'बैंक इनवॉइस',
    'attendance register', 'attendance sheet',
    'client invoice', 'client bill', 'invoicee',
  ]) || (/\binvoices?\b|\binvoicee\b/i.test(text) && !/\bbank\s*(?:number|account|ac)\b/i.test(text));
}

function hasStatusCue(text) {
  return hasAny(text, [
    'present', 'absent', 'प्रेजेंट', 'अबसेंट', 'half_day', 'leave',
    'haazir', 'hazir', 'गैरहाजिर',
  ]);
}

function matchIntent(text, context = {}) {
  const raw = String(text || '').toLowerCase();
  const normalized = stripNoise(raw);
  const employeeFields = matchFields(normalized, EMPLOYEE_LOOKUP);
  const orgFields = matchFields(normalized, ORGANIZATION_LOOKUP);
  const locationFields = matchFields(normalized, LOCATION_LOOKUP);
  const wantsFull = FULL_WORDS.some((word) => containsPhrase(normalized, word));
  const wantsCount = COUNT_WORDS.some((word) => containsPhrase(normalized, word));
  const wantsList = LIST_WORDS.some((word) => containsPhrase(normalized, word));
  const mentionsOrg = hasAny(normalized, ENTITY_HINTS.organization);
  const mentionsLocation = hasAny(normalized, ENTITY_HINTS.location);
  const mentionsEmployee = hasAny(normalized, ENTITY_HINTS.employee);
  const attendanceMention = containsPhrase(normalized, 'attendance') || containsPhrase(normalized, 'अटेंडेंस') || containsPhrase(normalized, 'हाजरी');

  // 1) High-confidence template patterns first
  const patterned = matchQuestionPatterns(normalized);
  if (patterned && patterned.confidence >= 0.88) {
    let fields = [];
    if (patterned.intent.includes('employee')) fields = employeeFields;
    else if (patterned.intent.includes('org')) fields = orgFields;
    else if (patterned.intent.includes('location')) fields = locationFields;

    // Mark vs get attendance disambiguation
    if (patterned.intent === 'get_attendance' && hasActionVerb(normalized)) {
      return {
        intent: 'mark_attendance',
        confidence: 0.95,
        fields: [],
        outputMode: null,
        capturedName: patterned.capturedName,
        ranked: [{ id: 'mark_attendance', score: 999, hits: 1 }],
      };
    }

    // Status + action verb must never fall through to list/lookup
    if (
      hasStatusCue(normalized)
      && hasActionVerb(normalized)
      && ['list_employees', 'count_employees', 'lookup_entity', 'get_location_full', 'get_org_full', 'get_employee_full'].includes(patterned.intent)
    ) {
      return {
        intent: 'mark_attendance',
        confidence: 0.96,
        fields: [],
        outputMode: null,
        capturedName: null,
        ranked: [{ id: 'mark_attendance', score: 999, hits: 1 }],
      };
    }

    // "location details … petrol bhi" = details primary, document is secondary — keep details
    const detailsPrimary = /\b(?:details?|जानकारी|पूरी)\b/i.test(normalized)
      && /\b(?:location|लोकेशन|organization|org)\b/i.test(normalized);
    const secondaryDocOnly = /\b(?:bhi|भी|also|with|jismein|जिसमें)\b/i.test(normalized);

    // Document cues beat bare location/org details (unless details are clearly primary)
    if (
      hasDocumentCue(normalized)
      && ['lookup_entity', 'get_location_full', 'get_org_full', 'get_employee_full', 'list_employees'].includes(patterned.intent)
      && !(detailsPrimary && secondaryDocOnly)
    ) {
      const docIntent = containsPhrase(normalized, 'salary slip') || containsPhrase(normalized, 'payslip')
        ? 'salary_slip'
        : containsPhrase(normalized, 'wage') || containsPhrase(normalized, 'bedsheet') || containsPhrase(normalized, 'form xvii')
          ? 'wage_register'
          : containsPhrase(normalized, 'bank invoice') || containsPhrase(normalized, 'neft') || containsPhrase(normalized, 'bank letter')
            ? 'bank_invoice'
            : containsPhrase(normalized, 'attendance register') || containsPhrase(normalized, 'attendance sheet')
              ? 'attendance_register'
              : containsPhrase(normalized, 'client invoice')
                || ((containsPhrase(normalized, 'invoice') || containsPhrase(normalized, 'invoicee') || containsPhrase(normalized, 'बिल'))
                  && !containsPhrase(normalized, 'bank'))
                ? 'client_invoice'
                : 'payroll';
      return {
        intent: docIntent,
        confidence: 0.95,
        fields: [],
        outputMode: null,
        capturedName: null,
        ranked: [{ id: docIntent, score: 999, hits: 1 }],
      };
    }

    // "Tony location ki attendance details" must not become employee_attendance
    if (
      patterned.intent === 'employee_attendance'
      && (/\blocation\b|लोकेशन|ke\s*andar|के\s*अंदर/i.test(normalized))
    ) {
      return {
        intent: 'get_attendance',
        confidence: 0.95,
        fields: [],
        outputMode: null,
        capturedName: null,
        ranked: [{ id: 'get_attendance', score: 999, hits: 1 }],
      };
    }

    return {
      intent: patterned.intent,
      confidence: patterned.confidence,
      fields,
      outputMode: patterned.outputMode || (fields.length ? 'value' : null),
      capturedName: patterned.capturedName,
      ranked: [{ id: patterned.intent, score: 999, hits: 1 }],
    };
  }

  // 2) Phrase scoring
  const ranked = INTENTS.map((intent) => {
    const { score: base, hits } = phraseHits(normalized, intent.phrases);
    if (!hits) return null;
    let score = base * (intent.weight || 1);

    if (intent.id === 'count_employees' && wantsCount) score += 12;
    if (intent.id === 'count_payroll_locations' && wantsCount && (containsPhrase(normalized, 'payroll') || containsPhrase(normalized, 'petrol') || containsPhrase(normalized, 'पेरोल'))) {
      score += 20;
    }
    if (intent.id === 'payroll' && wantsCount) score -= 25;
    if (intent.id === 'list_employees' && wantsList && !wantsCount) score += 12;
    if (intent.id === 'get_employee_full' && wantsFull && (mentionsEmployee || context.employeeId)) score += 12;
    if (intent.id === 'get_employee_full' && mentionsLocation && !mentionsEmployee) score -= 30;
    if (intent.id === 'get_employee_full' && mentionsOrg && !mentionsEmployee) score -= 30;
    if (intent.id === 'get_org_full' && mentionsLocation && !mentionsOrg) score -= 20;

    if (intent.id === 'get_employee_field' && employeeFields.length && !wantsList && !wantsCount && !attendanceMention) {
      score += 14 + employeeFields.length * 2;
      if (context.employeeId) score += 8;
    }
    if (intent.id === 'get_org_full' && wantsFull && mentionsOrg) score += 16;
    if (intent.id === 'get_org_field' && orgFields.length && mentionsOrg && !wantsFull) score += 14;
    if (intent.id === 'get_location_full' && wantsFull && mentionsLocation) score += 16;
    if (intent.id === 'get_location_field' && locationFields.length && mentionsLocation && !wantsFull) score += 10;

    if ((intent.id === 'mark_attendance' || intent.id === 'edit_attendance') && (attendanceMention || hasStatusCue(normalized))) {
      score += hasActionVerb(normalized) ? 28 : 8;
    }
    if (intent.id === 'get_attendance' && attendanceMention && !hasActionVerb(normalized) && !hasStatusCue(normalized)) score += 10;
    if (intent.id === 'employee_attendance' && attendanceMention && (mentionsEmployee || context.employeeId)) {
      score += 12;
    }

    if (hasDocumentCue(normalized)) {
      if (['payroll', 'salary_slip', 'wage_register', 'bank_invoice', 'attendance_register', 'client_invoice', 'payroll_run'].includes(intent.id)) {
        score += 18;
      }
      if (['lookup_entity', 'get_location_full', 'get_org_full', 'list_employees'].includes(intent.id)) {
        score -= 35;
      }
    }

    if (intent.id.endsWith('_field') && (attendanceMention || hasDocumentCue(normalized) || containsPhrase(normalized, 'register'))) {
      score -= 28;
    }
    if ((intent.id === 'payroll' || intent.id === 'salary_amount') && containsPhrase(normalized, 'salary slip')) {
      score -= 40;
    }
    if (intent.id === 'list_employees' && (hasStatusCue(normalized) || hasDocumentCue(normalized))) {
      score -= 40;
    }

    if (context.intent && context.intent === intent.id) score += 3;
    if (context.employeeId && intent.id.startsWith('get_employee')) score += 4;
    if (context.organizationId && intent.id.startsWith('get_org')) score += 3;
    if (context.locationId && intent.id.startsWith('get_location')) score += 3;

    return { id: intent.id, score, hits };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  // 3) Context follow-ups
  if (employeeFields.length && context.employeeId && (!ranked.length || ranked[0].score < 18)) {
    return {
      intent: wantsFull ? 'get_employee_full' : 'get_employee_field',
      confidence: 0.86,
      fields: employeeFields,
      outputMode: wantsFull ? 'full' : 'value',
      ranked,
    };
  }
  if (orgFields.length && context.organizationId && !mentionsEmployee && (!ranked.length || ranked[0].score < 18)) {
    return {
      intent: wantsFull ? 'get_org_full' : 'get_org_field',
      confidence: 0.82,
      fields: orgFields,
      outputMode: wantsFull ? 'full' : 'value',
      ranked,
    };
  }
  if (locationFields.length && context.locationId && !mentionsEmployee && (!ranked.length || ranked[0].score < 18)) {
    return {
      intent: wantsFull ? 'get_location_full' : 'get_location_field',
      confidence: 0.8,
      fields: locationFields,
      outputMode: wantsFull ? 'full' : 'value',
      ranked,
    };
  }
  if (wantsCount && (mentionsEmployee || context.locationId || context.organizationId || mentionsLocation || mentionsOrg)) {
    return {
      intent: 'count_employees',
      confidence: 0.88,
      fields: [],
      outputMode: 'count',
      ranked,
    };
  }

  // 4) Soft heuristics when phrase score is weak / empty
  if (!ranked.length || ranked[0].score < 6) {
    if (employeeFields.length) {
      return {
        intent: wantsFull ? 'get_employee_full' : 'get_employee_field',
        confidence: 0.62,
        fields: employeeFields,
        outputMode: wantsFull ? 'full' : 'value',
        ranked,
      };
    }
    if (mentionsOrg) {
      return {
        intent: wantsFull ? 'get_org_full' : (orgFields.length ? 'get_org_field' : 'get_org_full'),
        confidence: 0.58,
        fields: orgFields,
        outputMode: wantsFull ? 'full' : (orgFields.length ? 'value' : 'full'),
        ranked,
      };
    }
    if (mentionsLocation) {
      return {
        intent: wantsFull ? 'get_location_full' : (locationFields.length ? 'get_location_field' : 'get_location_full'),
        confidence: 0.58,
        fields: locationFields,
        outputMode: wantsFull ? 'full' : (locationFields.length ? 'value' : 'full'),
        ranked,
      };
    }
    if (mentionsEmployee || wantsList) {
      return {
        intent: wantsCount ? 'count_employees' : 'list_employees',
        confidence: 0.58,
        fields: [],
        outputMode: wantsCount ? 'count' : 'list',
        ranked,
      };
    }
    if (patterned) {
      return {
        intent: patterned.intent,
        confidence: patterned.confidence,
        fields: employeeFields.length ? employeeFields : orgFields.length ? orgFields : locationFields,
        outputMode: patterned.outputMode,
        capturedName: patterned.capturedName,
        ranked,
      };
    }
    return { intent: 'unknown', confidence: 0, fields: [], outputMode: null, ranked };
  }

  const top = ranked[0];
  const second = ranked[1];
  const confidence = second
    ? Math.min(0.98, top.score / (top.score + second.score + 1) + 0.4)
    : Math.min(0.98, 0.5 + top.score / 35);

  let fields = [];
  let outputMode = null;
  if (top.id.includes('employee')) fields = employeeFields;
  else if (top.id.includes('org')) fields = orgFields;
  else if (top.id.includes('location')) fields = locationFields;

  if (top.id.endsWith('_full') || wantsFull) outputMode = 'full';
  else if (top.id === 'count_employees' || wantsCount) outputMode = 'count';
  else if (top.id === 'list_employees' || wantsList) outputMode = 'list';
  else if (fields.length) outputMode = 'value';

  return {
    intent: top.id,
    confidence,
    fields,
    outputMode,
    capturedName: patterned?.capturedName || null,
    ranked,
  };
}

module.exports = { matchIntent };
