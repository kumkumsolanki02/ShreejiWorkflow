const mongoose = require('mongoose');
const AssistantSession = require('../models/AssistantSession');
const AssistantPendingAction = require('../models/AssistantPendingAction');
const {
  normalizeText,
  currentDateInTimeZone,
  currentMonthInTimeZone,
  workingDatesInMonth,
  wantsMonthWideAttendance,
} = require('./normalize');
const { matchIntent } = require('./intentMatcher');
const { fillSlots } = require('./slotFiller');
const { mergeSlots, slotsFromPlan } = require('./contextMerger');
const { helpReply, unknownReply } = require('./replyBuilder');
const { getOrganizationData } = require('../tools/organizationTools');
const { getLocationData } = require('../tools/locationTools');
const { getEmployeeData, listOrCountEmployees } = require('../tools/employeeTools');
const {
  getAttendanceSummary,
  getEmployeeAttendance,
  buildAttendancePending,
  summarizeAttendanceAction,
  executeAttendanceAction,
} = require('../tools/attendanceTools');
const { isDocumentIntent, buildDocumentPlan, buildSalaryAmount } = require('../tools/documentTools');
const { refreshEntityIndex } = require('./entityIndex');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 40;

function publicPending(action) {
  if (!action) return null;
  return {
    id: String(action._id),
    toolName: action.toolName,
    summary: action.summary,
    expiresAt: action.expiresAt?.toISOString?.() || action.expiresAt,
    status: action.status,
  };
}

async function getOrCreateSession(adminId, sessionId, language) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  if (sessionId && mongoose.isValidObjectId(sessionId)) {
    const existing = await AssistantSession.findOne({ _id: sessionId, adminId });
    if (existing) {
      existing.expiresAt = expiresAt;
      if (language) existing.language = language;
      return existing;
    }
  }
  return AssistantSession.create({
    adminId,
    language: language || 'hi-IN',
    messages: [],
    slots: {},
    expiresAt,
  });
}

function pushMessages(session, userText, assistantReply, document = null) {
  if (userText) session.messages.push({ role: 'user', content: String(userText).slice(0, 4000) });
  session.messages.push({
    role: 'assistant',
    content: String(assistantReply).slice(0, 8000),
    document: document || null,
  });
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
}

function applySlotUpdate(session, slotPatch = {}) {
  const next = { ...(session.slots?.toObject?.() || session.slots || {}) };
  for (const [key, value] of Object.entries(slotPatch)) {
    if (value !== undefined && value !== null && value !== '') next[key] = value;
  }
  session.slots = next;
}

function continueIntentForType(type, fields = [], outputMode = 'full') {
  const hasFields = Array.isArray(fields) && fields.length > 0 && outputMode !== 'full';
  if (type === 'organization') return hasFields ? 'get_org_field' : 'get_org_full';
  if (type === 'location') return hasFields ? 'get_location_field' : 'get_location_full';
  return hasFields ? 'get_employee_field' : 'get_employee_full';
}

async function choiceForEntity(type, entity, meta = {}) {
  const typeLabel = type === 'organization' ? 'Organization' : type === 'location' ? 'Location' : 'Employee';
  let label = type === 'organization'
    ? (entity.organizationName || entity.name)
    : type === 'location'
      ? (entity.name || entity.workName)
      : entity.name;

  const pendingFields = meta.pendingFields || [];
  const pendingOutputMode = meta.pendingOutputMode || 'full';
  const plan = {
    type: `select_${type}`,
    continueIntent: continueIntentForType(type, pendingFields, pendingOutputMode),
    continueFields: pendingFields,
    continueOutputMode: pendingOutputMode,
  };
  if (type === 'organization') plan.organizationId = entity.id;
  if (type === 'location') {
    plan.locationId = entity.id;
    plan.organizationId = entity.organizationId;
  }
  if (type === 'employee') {
    plan.employeeId = entity.id;
    plan.organizationId = entity.organizationId || null;
    plan.locationId = entity.locationId || null;
    const { getOrganizationById, getLocationById } = require('./entityIndex');
    const [org, loc] = await Promise.all([
      entity.organizationId ? getOrganizationById(entity.organizationId) : null,
      entity.locationId ? getLocationById(entity.locationId) : null,
    ]);
    const bits = [entity.name];
    if (loc?.name) bits.push(loc.name);
    else if (org?.organizationName) bits.push(org.organizationName);
    if (entity.phone) bits.push(entity.phone);
    else if (entity.email) bits.push(entity.email);
    label = bits.join(' · ');
  }
  return { label: `${label} (${typeLabel})`, plan };
}

async function ambiguousResponse(ambiguous, language, meta = {}) {
  const choices = [];
  const pending = {
    pendingFields: meta.pendingFields || [],
    pendingOutputMode: meta.pendingOutputMode || 'full',
  };

  if (ambiguous.crossType?.length > 1) {
    for (const hit of ambiguous.crossType.slice(0, 6)) {
      choices.push(await choiceForEntity(hit.type, hit.item, pending));
    }
  } else if (ambiguous.organizations?.length > 1) {
    for (const item of ambiguous.organizations.slice(0, 5)) {
      choices.push(await choiceForEntity('organization', item, pending));
    }
  } else if (ambiguous.locations?.length > 1) {
    for (const item of ambiguous.locations.slice(0, 5)) {
      choices.push(await choiceForEntity('location', item, pending));
    }
  } else if (ambiguous.employees?.length > 1) {
    for (const item of ambiguous.employees.slice(0, 5)) {
      choices.push(await choiceForEntity('employee', item, pending));
    }
  }
  if (!choices.length) return null;
  return {
    success: true,
    reply: language.startsWith('hi')
      ? 'यह नाम employee / organization / location में मिला। सही विकल्प चुनें — details तुरंत मिल जाएंगी:'
      : 'This name matched employee / organization / location. Pick one — details follow immediately:',
    source: 'validation',
    choices,
    intent: 'disambiguate',
  };
}

async function findLatestPending(session, adminId) {
  return AssistantPendingAction.findOne({
    sessionId: session._id,
    adminId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}

async function cancelOpenPendings(session, adminId, { exceptId = null } = {}) {
  const filter = {
    sessionId: session._id,
    adminId,
    status: 'pending',
  };
  if (exceptId) filter._id = { $ne: exceptId };
  await AssistantPendingAction.updateMany(filter, { $set: { status: 'cancelled' } });
}

function newIdempotencyKey(session, adminId) {
  return `${session._id}:${adminId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

async function createPending(session, adminId, toolName, summary, payload) {
  // Reuse the open pending row when possible so unique idempotencyKey indexes never block writes
  const existing = await findLatestPending(session, adminId);
  const idempotencyKey = newIdempotencyKey(session, adminId);
  const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

  if (existing) {
    existing.toolName = toolName;
    existing.summary = summary;
    existing.payload = payload;
    existing.status = 'pending';
    existing.idempotencyKey = idempotencyKey;
    existing.expiresAt = expiresAt;
    await existing.save();
    await cancelOpenPendings(session, adminId, { exceptId: existing._id });
    return existing;
  }

  await cancelOpenPendings(session, adminId);
  try {
    return await AssistantPendingAction.create({
      sessionId: session._id,
      adminId,
      toolName,
      summary,
      payload,
      status: 'pending',
      idempotencyKey,
      expiresAt,
    });
  } catch (error) {
    // Legacy unique index on idempotencyKey:null — heal old rows then retry once
    if (error && (error.code === 11000 || error.statusCode === 409)) {
      await healPendingIdempotencyKeys();
      return AssistantPendingAction.create({
        sessionId: session._id,
        adminId,
        toolName,
        summary,
        payload,
        status: 'pending',
        idempotencyKey: newIdempotencyKey(session, adminId),
        expiresAt,
      });
    }
    throw error;
  }
}

async function healPendingIdempotencyKeys() {
  try {
    await AssistantPendingAction.collection.dropIndex('idempotencyKey_1');
  } catch {
    // index missing or already sparse — ignore
  }
  const broken = await AssistantPendingAction.find({
    $or: [{ idempotencyKey: null }, { idempotencyKey: { $exists: false } }],
  }).select('_id').lean();
  for (const doc of broken) {
    await AssistantPendingAction.updateOne(
      { _id: doc._id },
      { $set: { idempotencyKey: `legacy:${doc._id}` } },
    );
  }
  try {
    await AssistantPendingAction.collection.createIndex(
      { idempotencyKey: 1 },
      { unique: true, sparse: true, name: 'idempotencyKey_1' },
    );
  } catch {
    // already exists
  }
}

function isConfirmUtterance(text) {
  return /^(?:confirm|yes|yeah|yep|yup|ok|okay|haan|haa|हाँ|हां|जी\s*हाँ|जी|सही|कर\s*दो|kar\s*do|go\s*ahead|proceed|done|thik\s*hai|ठीक\s*है|bilkul|बिल्कुल)$/iu.test(String(text || '').trim());
}

function isCancelUtterance(text) {
  return /^(?:cancel|रद्द|कैंसल|mat\s+karo|don't|do\s+not|no|nahi|नहीं|ना|cancel\s*karo|रद्द\s*करो|mat\s*do| छोड़\s*दो|rehne\s*do)$/iu.test(String(text || '').trim());
}

async function executeIntent(user, intent, slots, language, timeZone) {
  switch (intent) {
    case 'greeting':
      return {
        ok: true,
        reply: language.startsWith('hi')
          ? 'नमस्ते! मैं आपका Admin Assistant हूँ। Employee, location, attendance, payroll पूछ सकते हैं।'
          : 'Hello! I am your Admin Assistant. Ask about employees, locations, attendance, or payroll.',
        source: 'rules',
      };
    case 'help':
      return { ok: true, reply: helpReply(language), source: 'rules' };
    case 'get_org_full':
      return getOrganizationData(slots.organizationId, { full: true, language });
    case 'get_org_field':
      return getOrganizationData(slots.organizationId, { fields: slots.fields, full: false, language });
    case 'get_location_full':
      return getLocationData(user, slots.organizationId, slots.locationId, { full: true, language });
    case 'get_location_field':
      return getLocationData(user, slots.organizationId, slots.locationId, {
        fields: slots.fields,
        full: false,
        language,
      });
    case 'get_employee_full':
      return getEmployeeData(user, slots.employeeId, {
        full: true,
        language,
        soughtName: slots.soughtEmployeeName || null,
      });
    case 'get_employee_field':
      return getEmployeeData(user, slots.employeeId, {
        fields: slots.fields,
        full: false,
        language,
        soughtName: slots.soughtEmployeeName || slots.soughtName || null,
      });
    case 'lookup_entity': {
      const sought = slots.soughtEmployeeName || slots.soughtName || null;
      const type = slots.resolvedType
        || (slots.employeeId ? 'employee' : null)
        || (slots.locationId ? 'location' : null)
        || (slots.organizationId ? 'organization' : null);
      if (type === 'employee') {
        return getEmployeeData(user, slots.employeeId, {
          full: !slots.fields?.length || slots.outputMode === 'full',
          fields: slots.fields || [],
          language,
          soughtName: sought,
        });
      }
      if (type === 'organization') {
        return getOrganizationData(slots.organizationId, {
          full: !slots.fields?.length || slots.outputMode === 'full',
          fields: slots.fields || [],
          language,
        });
      }
      if (type === 'location') {
        return getLocationData(user, slots.organizationId, slots.locationId, {
          full: !slots.fields?.length || slots.outputMode === 'full',
          fields: slots.fields || [],
          language,
        });
      }
      return {
        ok: false,
        reply: language.startsWith('hi')
          ? (sought
            ? `"${sought}" employee / organization / location में नहीं मिला।`
            : 'किसका नाम? Employee, organization या location।')
          : (sought
            ? `"${sought}" not found in employees, organizations, or locations.`
            : 'Which name should I look up?'),
      };
    }
    case 'list_employees':
      return listOrCountEmployees({
        organizationId: slots.organizationId,
        locationId: slots.locationId,
        mode: 'list',
        language,
        locationScope: slots.locationScope,
        entityStatus: slots.entityStatus || 'active',
      });
    case 'count_employees':
      return listOrCountEmployees({
        organizationId: slots.organizationId,
        locationId: slots.locationId,
        mode: 'count',
        language,
        locationScope: slots.locationScope,
        entityStatus: slots.entityStatus || 'active',
      });
    case 'count_organizations': {
      const { getOrganizationsByFilter } = require('./entityIndex');
      const entityStatus = slots.entityStatus || 'active';
      const orgs = await getOrganizationsByFilter({ status: entityStatus });
      const label = entityStatus === 'inactive' ? 'inactive' : 'active';
      const lines = orgs.slice(0, 40).map((item, index) => `${index + 1}. ${item.organizationName || item.name || item.id}`);
      const more = orgs.length > 40 ? `\n… +${orgs.length - 40} more` : '';
      return {
        ok: true,
        reply: language.startsWith('hi')
          ? `Dashboard में ${label} organizations: ${orgs.length}\n${lines.join('\n')}${more}`
          : `Dashboard — ${label} organizations: ${orgs.length}\n${lines.join('\n')}${more}`,
        data: { count: orgs.length, status: entityStatus, organizations: orgs.map((item) => ({ id: item.id, name: item.organizationName })) },
        source: 'data',
      };
    }
    case 'count_payroll_locations': {
      const { listDocumentLocations } = require('../../services/bankInvoiceService');
      const month = slots.month || currentMonthInTimeZone(timeZone);
      const data = await listDocumentLocations(user, { month }, 'payroll');
      const pending = data.organizations.flatMap((org) => (
        org.locations
          .filter((loc) => loc.status === 'pending' && loc.employees > 0)
          .map((loc) => ({
            locationId: loc.locationId,
            locationName: loc.locationName,
            organizationName: org.organizationName,
            employees: loc.employees,
            total: loc.total,
          }))
      ));
      const printed = data.summary?.printed ?? 0;
      const lines = pending.slice(0, 40).map((item, index) => (
        `${index + 1}. ${item.locationName} (${item.organizationName}) — ${item.employees} emp`
      ));
      const more = pending.length > 40 ? `\n… +${pending.length - 40} more` : '';
      if (!pending.length) {
        return {
          ok: true,
          reply: language.startsWith('hi')
            ? `${month} में अभी कोई pending payroll location नहीं है${printed ? ` (printed: ${printed})` : ''}।`
            : `No pending payroll locations for ${month}${printed ? ` (${printed} already printed)` : ''}.`,
          data: { month, pending: 0, printed, locations: [] },
          source: 'data',
          slots: { month, locationScope: 'dashboard', intent: 'count_payroll_locations' },
        };
      }
      return {
        ok: true,
        reply: language.startsWith('hi')
          ? `${month} — Pending payroll locations: ${pending.length}${printed ? ` · Printed: ${printed}` : ''}\n${lines.join('\n')}${more}`
          : `${month} — Pending payroll locations: ${pending.length}${printed ? ` · Printed: ${printed}` : ''}\n${lines.join('\n')}${more}`,
        data: {
          month,
          pending: pending.length,
          printed,
          locations: pending,
          summary: data.summary,
        },
        source: 'data',
        slots: { month, locationScope: 'dashboard', intent: 'count_payroll_locations' },
      };
    }
    case 'count_locations': {
      const { getLocationsByFilter, getLocationsByOrganizationId, getOrganizationById } = require('./entityIndex');
      const entityStatus = slots.entityStatus || 'active';
      const label = entityStatus === 'inactive' ? 'inactive' : 'active';

      if (!slots.organizationId) {
        const locs = await getLocationsByFilter({ status: entityStatus });
        const lines = locs.slice(0, 40).map((item, index) => `${index + 1}. ${item.name || item.workName || item.id}`);
        const more = locs.length > 40 ? `\n… +${locs.length - 40} more` : '';
        return {
          ok: true,
          reply: language.startsWith('hi')
            ? `Dashboard में ${label} locations: ${locs.length}\n${lines.join('\n')}${more}`
            : `Dashboard — ${label} locations: ${locs.length}\n${lines.join('\n')}${more}`,
          data: { count: locs.length, status: entityStatus, locations: locs.map((item) => ({ id: item.id, name: item.name, workName: item.workName })) },
          source: 'data',
          slots: { locationIds: locs.map((item) => item.id), locationScope: 'dashboard', entityStatus },
        };
      }

      const locs = await getLocationsByOrganizationId(slots.organizationId, { status: entityStatus });
      const org = await getOrganizationById(slots.organizationId);
      const orgName = org?.organizationName || 'Organization';
      const lines = locs.map((item, index) => `${index + 1}. ${item.name || item.workName || item.id}`);
      return {
        ok: true,
        reply: language.startsWith('hi')
          ? `${orgName} में ${label} locations: ${locs.length}\n${lines.join('\n')}`
          : `${orgName} — ${label} locations: ${locs.length}\n${lines.join('\n')}`,
        data: { count: locs.length, status: entityStatus, locations: locs.map((item) => ({ id: item.id, name: item.name, workName: item.workName })) },
        source: 'data',
        slots: { organizationId: slots.organizationId, locationIds: locs.map((item) => item.id), locationScope: 'all_in_org', entityStatus },
      };
    }
    case 'get_attendance':
      return getAttendanceSummary(user, {
        organizationId: slots.organizationId,
        locationId: slots.locationId,
        date: slots.date || currentDateInTimeZone(timeZone),
        language,
        timeZone,
      });
    case 'employee_attendance':
      return getEmployeeAttendance(user, {
        employeeId: slots.employeeId,
        organizationId: slots.organizationId,
        date: slots.date || currentDateInTimeZone(timeZone),
        language,
        timeZone,
      });
    case 'salary_amount':
      return buildSalaryAmount(user, slots, language);
    default:
      if (isDocumentIntent(intent)) {
        return buildDocumentPlan(intent, slots, language, user);
      }
      return null;
  }
}

async function handleWriteIntent(user, intent, slots, session, language, timeZone, rawText = '') {
  const status = slots.status || (intent === 'mark_attendance' ? null : null);
  if (!status) {
    return {
      success: true,
      reply: language.startsWith('hi')
        ? 'Attendance status बताएँ: present या absent (या half_day / leave)।'
        : 'Which attendance status? present or absent (or half_day / leave).',
      source: 'validation',
      intent,
      choices: [
        { label: 'Present', plan: { type: intent, status: 'present', confirm: false, organizationId: slots.organizationId, locationId: slots.locationId, employeeId: slots.employeeId, dates: [slots.date || currentDateInTimeZone(timeZone)] } },
        { label: 'Absent', plan: { type: intent, status: 'absent', confirm: false, organizationId: slots.organizationId, locationId: slots.locationId, employeeId: slots.employeeId, dates: [slots.date || currentDateInTimeZone(timeZone)] } },
      ],
    };
  }

  // Only expand to full month when the user clearly asked for month-wide marking
  const monthWide = Boolean(slots.month) && wantsMonthWideAttendance(rawText);
  const dates = monthWide
    ? workingDatesInMonth(slots.month, timeZone)
    : [slots.date || currentDateInTimeZone(timeZone)];
  if (!dates.length) {
    return {
      success: true,
      reply: language.startsWith('hi')
        ? 'इस month में mark करने के लिए कोई working day नहीं मिला।'
        : 'No working days available to mark in that month.',
      source: 'validation',
      intent,
    };
  }
  const date = dates[0];
  let organizationId = slots.organizationId;
  let locationId = slots.locationId;
  const employeeId = intent === 'edit_attendance' || slots.employeeId ? slots.employeeId : null;

  if (!organizationId && locationId) {
    const { getLocationById } = require('./entityIndex');
    organizationId = (await getLocationById(locationId))?.organizationId || null;
  }

  if (!locationId && Array.isArray(slots.locationIds) && slots.locationIds.length === 1) {
    locationId = slots.locationIds[0];
  }

  if (employeeId) {
    // single employee mark
  } else if (!locationId && Array.isArray(slots.locationIds) && slots.locationIds.length > 1) {
    const { getLocationById } = require('./entityIndex');
    const choices = [];
    for (const id of slots.locationIds.slice(0, 8)) {
      const loc = await getLocationById(id);
      choices.push({
        label: loc?.name || loc?.workName || id,
        plan: {
          type: intent,
          status,
          confirm: false,
          organizationId,
          locationId: id,
          employeeId: null,
          dates: [date],
        },
      });
    }
    return {
      success: true,
      reply: language.startsWith('hi')
        ? 'Attendance mark करने के लिए एक location चुनें:'
        : 'Pick one location to mark attendance:',
      source: 'validation',
      intent,
      choices,
    };
  } else if (!locationId) {
    return {
      success: true,
      reply: language.startsWith('hi')
        ? 'किस location की attendance लगानी है?'
        : 'Which location should I mark attendance for?',
      source: 'validation',
      intent,
    };
  }

  if (!organizationId) {
    return {
      success: true,
      reply: language.startsWith('hi') ? 'Organization नहीं मिली।' : 'Organization is required.',
      source: 'validation',
      intent,
    };
  }

  const pendingPayload = buildAttendancePending({
    organizationId,
    locationId,
    employeeId,
    status,
    date,
    dates: dates.length > 1 ? dates : null,
    replace: dates.length > 1,
    scope: employeeId ? 'employee' : 'location',
  }).payload;

  const summary = await summarizeAttendanceAction(pendingPayload, language);
  const action = await createPending(
    session,
    user.id,
    employeeId ? 'mark_attendance' : 'bulk_mark_attendance',
    summary,
    pendingPayload,
  );

  return {
    success: true,
    reply: summary,
    source: 'pending_action',
    intent,
    pendingAction: publicPending(action),
    choices: [
      {
        label: language.startsWith('hi') ? 'Confirm' : 'Confirm',
        plan: { type: intent, confirm: true, pendingActionId: String(action._id) },
      },
      {
        label: language.startsWith('hi') ? 'Cancel' : 'Cancel',
        plan: { type: 'cancel', pendingActionId: String(action._id) },
      },
    ],
  };
}

async function handlePlan(user, plan, session, language, timeZone) {
  if (!plan || typeof plan !== 'object') {
    return { success: false, reply: 'Invalid plan.', source: 'validation' };
  }

  if (plan.type === 'cancel' || plan.cancel) {
    if (plan.pendingActionId && mongoose.isValidObjectId(plan.pendingActionId)) {
      await AssistantPendingAction.updateOne(
        { _id: plan.pendingActionId, adminId: user.id, status: 'pending' },
        { $set: { status: 'cancelled' } },
      );
    }
    return { success: true, reply: language.startsWith('hi') ? 'रद्द कर दिया।' : 'Cancelled.', source: 'rules', intent: 'cancel' };
  }

  if (plan.pendingActionId && plan.confirm) {
    return confirmPending(user, plan.pendingActionId, session, language, timeZone);
  }

  if (String(plan.type || '').startsWith('select_')) {
    const currentSlots = session.slots?.toObject?.() || session.slots || {};
    const resolvedType = plan.type === 'select_employee'
      ? 'employee'
      : plan.type === 'select_organization'
        ? 'organization'
        : plan.type === 'select_location'
          ? 'location'
          : null;
    const pendingFields = Array.isArray(plan.continueFields)
      ? plan.continueFields
      : (Array.isArray(currentSlots.pendingFields) ? currentSlots.pendingFields : []);
    const pendingOutputMode = plan.continueOutputMode || currentSlots.pendingOutputMode || 'full';
    const pendingIntent = plan.continueIntent
      || currentSlots.pendingIntent
      || (resolvedType ? continueIntentForType(resolvedType, pendingFields, pendingOutputMode) : null);
    const slotPatch = slotsFromPlan(plan);
    applySlotUpdate(session, {
      ...slotPatch,
      intent: pendingIntent || currentSlots.intent || null,
      fields: pendingFields.length ? pendingFields : (currentSlots.fields || []),
      outputMode: pendingOutputMode,
      resolvedType,
      pendingIntent: null,
      pendingFields: [],
      pendingOutputMode: null,
    });

    if (pendingIntent && !['disambiguate', 'greeting', 'help', 'cancel', 'unknown'].includes(pendingIntent)) {
      const slots = {
        ...(session.slots?.toObject?.() || session.slots || {}),
        ...slotPatch,
        fields: pendingFields,
        outputMode: pendingOutputMode,
        intent: pendingIntent,
        resolvedType,
      };
      if (pendingIntent === 'mark_attendance' || pendingIntent === 'edit_attendance') {
        const writeResult = await handleWriteIntent(user, pendingIntent, slots, session, language, timeZone);
        applySlotUpdate(session, { ...slots, intent: pendingIntent });
        await session.save();
        return writeResult;
      }
      const executed = await executeIntent(user, pendingIntent, slots, language, timeZone);
      if (executed) {
        if (executed.slots) applySlotUpdate(session, { ...executed.slots, intent: pendingIntent, resolvedType });
        else applySlotUpdate(session, { ...slots, intent: pendingIntent, resolvedType });
        await session.save();
        return {
          success: true,
          reply: executed.reply,
          source: executed.source || (executed.ok === false ? 'validation' : 'plan'),
          data: executed.data,
          document: executed.document,
          intent: pendingIntent,
          execution: executed.execution,
          choices: executed.choices,
        };
      }
    }

    await session.save();
    return {
      success: true,
      reply: language.startsWith('hi')
        ? 'चयन हो गया। अब अपना सवाल दोहराएँ।'
        : 'Selection saved. Please repeat your question.',
      source: 'plan',
      intent: plan.type,
    };
  }

  const slots = mergeSlots(session.slots || {}, slotsFromPlan(plan), { usesContext: true });
  if (plan.status) slots.status = plan.status;
  if (plan.dates?.[0]) slots.date = plan.dates[0];
  if (plan.month) slots.month = plan.month;
  if (plan.format) slots.format = plan.format;
  if (plan.full) slots.outputMode = 'full';

  const intent = plan.type;
  if (intent === 'mark_attendance' || intent === 'edit_attendance') {
    const result = await handleWriteIntent(user, intent, slots, session, language, timeZone);
    applySlotUpdate(session, slots);
    return result;
  }

  const executed = await executeIntent(user, intent, slots, language, timeZone);
  if (!executed) {
    return { success: true, reply: unknownReply(language), source: 'validation', intent };
  }
  if (executed.slots) applySlotUpdate(session, executed.slots);
  else applySlotUpdate(session, slots);

  return {
    success: true,
    reply: executed.reply,
    source: executed.source || (executed.ok === false ? 'validation' : 'plan'),
    data: executed.data,
    document: executed.document,
    intent,
    execution: executed.execution,
  };
}

async function confirmPending(user, pendingActionId, session, language, timeZone) {
  if (!mongoose.isValidObjectId(pendingActionId)) {
    return { success: false, reply: 'Invalid pending action.', source: 'validation' };
  }
  const action = await AssistantPendingAction.findOne({
    _id: pendingActionId,
    adminId: user.id,
    sessionId: session._id,
  });
  if (!action || action.status !== 'pending') {
    return {
      success: false,
      reply: language.startsWith('hi') ? 'Pending action नहीं मिली या expire हो गई।' : 'Pending action missing or expired.',
      source: 'validation',
    };
  }
  if (action.expiresAt && action.expiresAt.getTime() < Date.now()) {
    action.status = 'expired';
    await action.save();
    return { success: false, reply: 'Pending action expired.', source: 'validation' };
  }

  let result;
  try {
    result = await executeAttendanceAction(user, action.payload, timeZone);
  } catch (error) {
    if (error && (error.code === 11000 || error.statusCode === 409)) {
      return {
        success: false,
        reply: language.startsWith('hi')
          ? 'कुछ attendance records पहले से मौजूद हैं। Month-wide mark existing को update करके फिर try करें, या एक दिन चुनें।'
          : 'Some attendance records already exist. Retry with month-wide overwrite, or mark a single day.',
        source: 'validation',
        intent: action.toolName,
      };
    }
    throw error;
  }
  action.status = result.ok ? 'confirmed' : 'pending';
  await action.save();

  applySlotUpdate(session, {
    organizationId: action.payload.organizationId,
    locationId: action.payload.locationId,
    employeeId: action.payload.employeeId,
    date: action.payload.date,
    status: action.payload.status,
    intent: action.toolName,
  });

  return {
    success: result.ok !== false,
    reply: result.reply,
    source: result.source || 'tool',
    data: result.data,
    intent: action.toolName,
    execution: result.execution,
    pendingAction: null,
  };
}

async function askAssistant(user, input = {}) {
  const language = input.language || 'hi-IN';
  const timeZone = input.timeZone || 'Asia/Kolkata';
  try {
    return await askAssistantInner(user, input, language, timeZone);
  } catch (error) {
    if (error && (error.code === 11000 || error.statusCode === 409)) {
      return {
        success: false,
        reply: language.startsWith('hi')
          ? 'यह action पहले से pending/recorded है। Confirm/Cancel करें या थोड़ी देर बाद फिर कोशिश करें।'
          : 'This action is already pending or recorded. Confirm/Cancel it, or try again shortly.',
        source: 'validation',
        sessionId: input.sessionId || null,
        error: { code: 'conflict', message: error.message, retryable: true },
      };
    }
    throw error;
  }
}

async function askAssistantInner(user, input = {}, language, timeZone) {
  await refreshEntityIndex();

  const session = await getOrCreateSession(user.id, input.sessionId, language);
  const userText = input.label || input.message || '';

  let result;

  if (input.cancel) {
    result = await handlePlan(user, { type: 'cancel', pendingActionId: input.confirmPendingActionId }, session, language, timeZone);
  } else if (input.confirmPendingActionId) {
    result = await confirmPending(user, input.confirmPendingActionId, session, language, timeZone);
  } else if (input.plan) {
    result = await handlePlan(user, input.plan, session, language, timeZone);
  } else if (input.message) {
    const normalized = normalizeText(input.message);
    const rawTrim = String(input.message || '').trim();
    const earlyIntent = matchIntent(normalized.text, session.slots || {});

    // Typed "confirm" / "cancel" must resolve the open pending action (buttons are optional)
    if (
      isConfirmUtterance(normalized.text)
      || isConfirmUtterance(rawTrim)
      || earlyIntent.intent === 'confirm_pending'
    ) {
      const pending = await findLatestPending(session, user.id);
      result = pending
        ? await confirmPending(user, String(pending._id), session, language, timeZone)
        : {
          success: true,
          reply: language.startsWith('hi')
            ? 'Confirm करने के लिए कोई pending action नहीं है।'
            : 'There is no pending action to confirm.',
          source: 'validation',
          intent: 'confirm_pending',
        };
    } else if (
      isCancelUtterance(normalized.text)
      || isCancelUtterance(rawTrim)
      || earlyIntent.intent === 'cancel'
    ) {
      const pending = await findLatestPending(session, user.id);
      if (pending) {
        pending.status = 'cancelled';
        await pending.save();
        result = {
          success: true,
          reply: language.startsWith('hi') ? 'Pending action cancel हो गई।' : 'Pending action cancelled.',
          source: 'plan',
          intent: 'cancel',
          pendingAction: null,
        };
      } else {
        result = {
          success: true,
          reply: language.startsWith('hi') ? 'Cancel करने के लिए कुछ pending नहीं था।' : 'Nothing pending to cancel.',
          source: 'validation',
          intent: 'cancel',
        };
      }
    }

    if (!result) {
    const intentResult = earlyIntent;
    const filled = await fillSlots(normalized.text, intentResult, session.slots || {}, timeZone);
    const slots = mergeSlots(session.slots || {}, filled.slots, {
      usesContext: filled.usesContext,
      explicitEmployeeMention: filled.explicitEmployeeMention,
      explicitLocationMention: filled.explicitLocationMention,
      explicitOrganizationMention: filled.explicitOrganizationMention,
    });
    // Prefer remapped intent from cross-type resolve (e.g. lookup_entity → get_location_full)
    const effectiveIntent = filled.slots?.intent || intentResult.intent;
    slots.soughtEmployeeName = filled.soughtEmployeeName || intentResult.capturedName || null;
    slots.soughtName = filled.soughtEmployeeName || intentResult.capturedName || null;
    slots.resolvedType = filled.slots?.resolvedType || slots.resolvedType || null;
    slots.searchTypes = filled.searchTypes || filled.slots?.searchTypes || null;
    slots.locationIds = filled.slots?.locationIds || slots.locationIds || null;
    slots.locationScope = filled.slots?.locationScope || slots.locationScope || null;
    slots.entityStatus = filled.slots?.entityStatus || slots.entityStatus || null;
    if (filled.slots?.format) slots.format = filled.slots.format;

    if (!slots.month && isDocumentIntent(effectiveIntent)) {
      slots.month = currentMonthInTimeZone(timeZone);
    }
    if (!slots.date && (effectiveIntent === 'mark_attendance' || effectiveIntent === 'get_attendance' || effectiveIntent === 'employee_attendance')) {
      slots.date = currentDateInTimeZone(timeZone);
    }

    // Auto-pick lone ambiguous candidates
    if (!slots.employeeId && filled.ambiguous.employees?.length === 1 && !(filled.ambiguous.crossType?.length > 1)) {
      const only = filled.ambiguous.employees[0];
      slots.employeeId = only.id;
      slots.organizationId = slots.organizationId || only.organizationId || null;
      slots.locationId = slots.locationId || only.locationId || null;
      slots.resolvedType = slots.resolvedType || 'employee';
    }
    if (!slots.locationId && filled.ambiguous.locations?.length === 1 && !(filled.ambiguous.crossType?.length > 1)) {
      slots.locationId = filled.ambiguous.locations[0].id;
      slots.organizationId = slots.organizationId || filled.ambiguous.locations[0].organizationId || null;
      slots.resolvedType = slots.resolvedType || 'location';
    }
    if (!slots.organizationId && filled.ambiguous.organizations?.length === 1 && !(filled.ambiguous.crossType?.length > 1)) {
      slots.organizationId = filled.ambiguous.organizations[0].id;
      slots.resolvedType = slots.resolvedType || 'organization';
    }

    if (!slots.employeeId && filled.ambiguous.employees?.length > 1 && session.slots?.employeeId) {
      const previous = filled.ambiguous.employees.find((item) => item.id === String(session.slots.employeeId));
      if (previous) {
        slots.employeeId = previous.id;
        slots.organizationId = slots.organizationId || previous.organizationId || null;
        slots.locationId = slots.locationId || previous.locationId || null;
        slots.resolvedType = 'employee';
      }
    }

    const crossHits = filled.ambiguous?.crossType || [];
    const needsCrossChoice = crossHits.length > 1
      && !slots.employeeId
      && !slots.locationId
      && !(slots.organizationId && slots.resolvedType === 'organization');
    const orgActionNeedsOrg = [
      'payroll', 'salary_slip', 'wage_register', 'attendance_register', 'bank_invoice',
      'list_employees', 'get_attendance', 'mark_attendance', 'edit_attendance',
    ].includes(effectiveIntent)
      || (effectiveIntent === 'count_employees' && slots.locationScope !== 'dashboard');
    const docNeedsLocationChoice = [
      'client_invoice', 'wage_register', 'attendance_register', 'bank_invoice', 'salary_slip', 'payroll',
    ].includes(effectiveIntent);

    const needsEntityChoice = needsCrossChoice || (
      ((effectiveIntent || '').includes('employee') && !slots.employeeId && filled.ambiguous.employees.length > 1)
      || ((effectiveIntent || '').includes('org') && !slots.organizationId && filled.ambiguous.organizations.length > 1)
      || ((effectiveIntent || '').includes('location') && !slots.locationId && filled.ambiguous.locations.length > 1)
      || (effectiveIntent === 'lookup_entity' && crossHits.length > 1)
      || (docNeedsLocationChoice && !slots.locationId && filled.ambiguous.locations?.length > 1)
      || (orgActionNeedsOrg && !slots.organizationId && !slots.locationId
        && ((filled.ambiguous.locations?.length > 1) || (filled.ambiguous.organizations?.length > 1)))
    );

    if (needsEntityChoice && intentResult.confidence >= 0.4) {
      applySlotUpdate(session, {
        pendingIntent: effectiveIntent === 'lookup_entity' ? 'lookup_entity' : effectiveIntent,
        pendingFields: slots.fields || [],
        pendingOutputMode: slots.outputMode || 'full',
        intent: effectiveIntent,
        fields: slots.fields || [],
      });
      result = await ambiguousResponse(filled.ambiguous, language, {
        pendingFields: slots.fields || [],
        pendingOutputMode: slots.outputMode || 'full',
      });
    }

    if (!result) {
      if (effectiveIntent === 'greeting' || intentResult.intent === 'greeting') {
        result = {
          success: true,
          reply: language.startsWith('hi')
            ? 'नमस्ते! मैं आपका Admin Assistant हूँ। Employee, location, attendance, payroll पूछ सकते हैं।'
            : 'Hello! I am your Admin Assistant. Ask about employees, locations, attendance, or payroll.',
          source: 'rules',
          intent: 'greeting',
        };
      } else if (effectiveIntent === 'unknown' || intentResult.confidence < 0.35) {
        result = {
          success: true,
          reply: unknownReply(language),
          source: 'validation',
          intent: 'unknown',
        };
      } else if (effectiveIntent === 'mark_attendance' || effectiveIntent === 'edit_attendance') {
        result = await handleWriteIntent(user, effectiveIntent, slots, session, language, timeZone, userText);
        applySlotUpdate(session, { ...slots, intent: effectiveIntent });
      } else {
        const executed = await executeIntent(user, effectiveIntent, slots, language, timeZone);
        if (!executed) {
          result = {
            success: true,
            reply: unknownReply(language),
            source: 'validation',
            intent: effectiveIntent,
          };
        } else {
          if (executed.slots) applySlotUpdate(session, { ...executed.slots, intent: effectiveIntent, resolvedType: slots.resolvedType });
          else applySlotUpdate(session, { ...slots, intent: effectiveIntent });
          result = {
            success: true,
            reply: executed.reply,
            source: executed.source || (executed.ok === false ? 'validation' : 'rules'),
            data: executed.data,
            document: executed.document,
            intent: effectiveIntent,
            execution: executed.execution,
            choices: executed.choices,
          };
        }
      }
    }
    } // end if (!result) NLU path
  } else {
    result = {
      success: false,
      reply: language.startsWith('hi') ? 'Message या plan भेजें।' : 'Send a message or plan.',
      source: 'validation',
    };
  }

  pushMessages(session, userText, result.reply, result.document || null);
  session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await session.save();

  return {
    success: result.success !== false,
    reply: result.reply,
    source: result.source || 'rules',
    sessionId: String(session._id),
    intent: result.intent,
    document: result.document,
    choices: result.choices,
    pendingAction: result.pendingAction === undefined ? undefined : result.pendingAction,
    execution: result.execution,
    data: result.data,
    error: result.success === false
      ? { code: 'assistant_error', message: result.reply, retryable: false }
      : undefined,
  };
}

async function getSession(adminId, sessionId) {
  if (!mongoose.isValidObjectId(sessionId)) return { sessionId, messages: [] };
  const session = await AssistantSession.findOne({ _id: sessionId, adminId }).lean();
  if (!session) return { sessionId, messages: [] };
  return {
    sessionId: String(session._id),
    messages: (session.messages || []).map((message) => ({
      role: message.role,
      content: message.content,
      document: message.document || undefined,
    })),
  };
}

async function deleteSession(adminId, sessionId) {
  if (!mongoose.isValidObjectId(sessionId)) return;
  await AssistantPendingAction.updateMany(
    { sessionId, adminId, status: 'pending' },
    { $set: { status: 'cancelled' } },
  );
  await AssistantSession.deleteOne({ _id: sessionId, adminId });
}

module.exports = {
  askAssistant,
  getSession,
  deleteSession,
};
