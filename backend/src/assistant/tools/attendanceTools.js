const { listAttendance, markAttendance, bulkMarkAttendance } = require('../../services/attendanceService');
const { getEmployeesByFilter, getLocationById } = require('../engine/entityIndex');
const { ensureLocationLabel } = require('./locationTools');
const { ensureEmployeeLabel } = require('./employeeTools');
const { currentDateInTimeZone } = require('../engine/normalize');

async function getAttendanceSummary(user, {
  organizationId,
  locationId,
  date,
  language = 'hi-IN',
  timeZone = 'Asia/Kolkata',
} = {}) {
  if (!organizationId && user.role === 'admin') {
    return {
      ok: false,
      reply: language.startsWith('hi') ? 'Attendance के लिए organization / location बताएँ।' : 'Specify organization or location for attendance.',
    };
  }
  if (!locationId && !organizationId) {
    return {
      ok: false,
      reply: language.startsWith('hi') ? 'Location या organization चाहिए।' : 'Location or organization required.',
    };
  }

  // Admin listAttendance requires organizationId
  let orgId = organizationId;
  if (!orgId && locationId) {
    const location = await getLocationById(locationId);
    orgId = location?.organizationId || null;
  }
  if (!orgId) {
    return { ok: false, reply: language.startsWith('hi') ? 'Organization नहीं मिली।' : 'Organization not found.' };
  }

  const targetDate = date || currentDateInTimeZone(timeZone);
  const result = await listAttendance(user, {
    organizationId: orgId,
    locationId: locationId || undefined,
    date: targetDate,
  });

  const counts = {};
  let unmarked = 0;
  for (const row of result.attendance) {
    if (!row.status) {
      unmarked += 1;
      continue;
    }
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  const lines = [
    `Attendance for ${targetDate}`,
    `Employees: ${result.attendance.length}`,
    ...Object.entries(counts).map(([status, count]) => `${status}: ${count}`),
    `unmarked: ${unmarked}`,
  ];

  return {
    ok: true,
    reply: lines.join('\n'),
    data: { date: targetDate, counts, unmarked, attendance: result.attendance },
    source: 'data',
    slots: { organizationId: orgId, locationId: locationId || null, date: targetDate },
  };
}

async function getEmployeeAttendance(user, {
  employeeId,
  organizationId,
  date,
  language = 'hi-IN',
  timeZone = 'Asia/Kolkata',
} = {}) {
  if (!employeeId) {
    return { ok: false, reply: language.startsWith('hi') ? 'किस employee की attendance?' : 'Which employee attendance?' };
  }
  let orgId = organizationId;
  if (!orgId) {
    const { getEmployeeById } = require('../engine/entityIndex');
    const employee = await getEmployeeById(employeeId);
    orgId = employee?.organizationId || null;
  }
  if (!orgId) {
    return { ok: false, reply: language.startsWith('hi') ? 'Employee की organization नहीं मिली।' : 'Employee organization not found.' };
  }

  const targetDate = date || currentDateInTimeZone(timeZone);
  const result = await listAttendance(user, { organizationId: orgId, date: targetDate });
  const row = result.attendance.find((item) => item.employeeId === String(employeeId));
  const name = row?.name || await ensureEmployeeLabel(employeeId);
  const status = row?.status || 'unmarked';
  return {
    ok: true,
    reply: `${name} — ${targetDate}: ${status}`,
    data: row || { employeeId, date: targetDate, status: null },
    source: 'data',
    slots: { employeeId, organizationId: orgId, date: targetDate },
  };
}

function buildAttendancePending({
  organizationId,
  locationId,
  employeeId,
  status,
  date,
  dates = null,
  replace = false,
  scope = 'location',
}) {
  return {
    toolName: employeeId ? 'mark_attendance' : 'bulk_mark_attendance',
    payload: {
      organizationId,
      locationId: locationId || null,
      employeeId: employeeId || null,
      status,
      date: date || (Array.isArray(dates) && dates[0]) || null,
      dates: Array.isArray(dates) && dates.length ? dates : null,
      replace: Boolean(replace),
      scope,
    },
  };
}

async function summarizeAttendanceAction(payload, language = 'hi-IN') {
  const status = payload.status;
  const dateList = Array.isArray(payload.dates) && payload.dates.length
    ? payload.dates
    : (payload.date ? [payload.date] : []);
  const dateLabel = dateList.length > 1
    ? `${dateList[0]} → ${dateList[dateList.length - 1]} (${dateList.length} days)`
    : (dateList[0] || payload.date);

  if (payload.employeeId) {
    const name = await ensureEmployeeLabel(payload.employeeId);
    return language.startsWith('hi')
      ? `${name} की attendance ${dateLabel} को "${status}" mark होगी। Confirm करें।`
      : `Mark ${name} as "${status}" on ${dateLabel}. Confirm to apply.`;
  }

  const locationName = payload.locationId ? await ensureLocationLabel(payload.locationId) : 'location';
  const employees = await getEmployeesByFilter({
    organizationId: payload.organizationId,
    locationId: payload.locationId,
    status: 'active',
  });
  return language.startsWith('hi')
    ? `${locationName} के ${employees.length} active employees की attendance ${dateLabel} को "${status}" mark होगी${payload.replace ? ' (existing भी update)' : ''}। Confirm करें।`
    : `Mark ${employees.length} active employees at ${locationName} as "${status}" on ${dateLabel}${payload.replace ? ' (overwrite existing)' : ''}. Confirm to apply.`;
}

async function executeAttendanceAction(user, payload, timeZone = 'Asia/Kolkata') {
  const dateList = Array.isArray(payload.dates) && payload.dates.length
    ? payload.dates
    : (payload.date ? [payload.date] : []);
  const replace = Boolean(payload.replace) || dateList.length > 1;

  if (payload.employeeId) {
    let last = null;
    for (const day of dateList) {
      last = await markAttendance(user, {
        employeeId: payload.employeeId,
        organizationId: payload.organizationId,
        locationId: payload.locationId || undefined,
        date: day,
        status: payload.status,
        timeZone,
      });
    }
    const name = await ensureEmployeeLabel(payload.employeeId);
    return {
      ok: true,
      reply: `Attendance updated: ${name} → ${payload.status} (${dateList.length > 1 ? `${dateList.length} days` : dateList[0]})`,
      data: last,
      source: 'tool',
      execution: { status: 'completed', verified: true },
    };
  }

  if (!payload.locationId) {
    return { ok: false, reply: 'Bulk attendance needs a location.' };
  }

  const employees = await getEmployeesByFilter({
    organizationId: payload.organizationId,
    locationId: payload.locationId,
    status: 'active',
  });
  const entries = [];
  for (const day of dateList) {
    for (const employee of employees) {
      entries.push({
        employeeId: employee.id,
        status: payload.status,
        date: day,
        replace,
      });
    }
  }

  const result = await bulkMarkAttendance(user, {
    organizationId: payload.organizationId,
    locationId: payload.locationId,
    date: dateList[0],
    entries,
    timeZone,
  });

  const saved = (result.saved ?? 0) + (result.updated ?? 0);
  return {
    ok: true,
    reply: `Bulk attendance done: ${employees.length} employees × ${dateList.length} day(s) → ${payload.status}. Saved/updated: ${saved}.`,
    data: result,
    source: 'tool',
    execution: { status: 'completed', verified: true },
  };
}

module.exports = {
  getAttendanceSummary,
  getEmployeeAttendance,
  buildAttendancePending,
  summarizeAttendanceAction,
  executeAttendanceAction,
};
