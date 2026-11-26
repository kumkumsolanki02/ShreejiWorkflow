const { getLocationById, getOrganizationById, getEmployeeById, getLocationsByOrganizationId } = require('../engine/entityIndex');
const { currentMonthInTimeZone } = require('../engine/normalize');

const DOCUMENT_INTENTS = new Set([
  'salary_slip',
  'payroll',
  'wage_register',
  'attendance_register',
  'bank_invoice',
  'payroll_run',
  'client_invoice',
]);

function isDocumentIntent(intent) {
  return DOCUMENT_INTENTS.has(intent);
}

async function buildDocumentPlan(intent, slots = {}, language = 'hi-IN', user = null) {
  const month = slots.month || currentMonthInTimeZone();
  const format = slots.format === 'excel' ? 'excel' : 'pdf';
  let organizationId = slots.organizationId || null;
  let locationId = slots.locationId || null;
  let locationIds = Array.isArray(slots.locationIds) ? slots.locationIds.filter(Boolean) : [];
  let employeeIds = slots.employeeId ? [slots.employeeId] : null;
  const locationScope = slots.locationScope || null;

  if (!organizationId && locationId) {
    const location = await getLocationById(locationId);
    organizationId = location?.organizationId || null;
  }
  if (!organizationId && slots.employeeId) {
    const employee = await getEmployeeById(slots.employeeId);
    organizationId = employee?.organizationId || null;
    locationId = locationId || employee?.locationId || null;
  }

  // Expand "all locations under org" when needed (payroll / salary slip too — for scope label)
  if (organizationId && !locationId && !locationIds.length
    && (locationScope === 'all_in_org'
      || ['wage_register', 'attendance_register', 'bank_invoice', 'payroll', 'salary_slip'].includes(intent))) {
    const locs = await getLocationsByOrganizationId(organizationId, { status: 'active' });
    locationIds = locs.map((item) => item.id);
  }

  let documentType = intent;
  if (intent === 'payroll_run' && !slots.batchId) {
    documentType = 'payroll';
  }

  const multiLocation = locationIds.length > 1 || (locationScope === 'all_in_org' && locationIds.length >= 1);
  const needsLocation = ['wage_register', 'attendance_register', 'bank_invoice', 'client_invoice'].includes(documentType);

  if (documentType === 'client_invoice' && (!organizationId || (!locationId && locationIds.length !== 1))) {
    return {
      ok: false,
      reply: language.startsWith('hi')
        ? 'Client invoice के लिए organization और एक location दोनों चाहिए।'
        : 'Client invoice needs both organization and one location.',
    };
  }

  if (needsLocation && !locationId && locationIds.length === 1) {
    locationId = locationIds[0];
    locationIds = [];
  }

  if (needsLocation && !locationId && !locationIds.length) {
    return {
      ok: false,
      reply: language.startsWith('hi')
        ? 'इस document के लिए location बताएँ, या organization के साथ “सभी locations” बोलें।'
        : 'Specify a location, or say “all locations” with the organization name.',
    };
  }

  if (['salary_slip', 'payroll'].includes(documentType) && !organizationId && !locationId && !employeeIds && !locationIds.length) {
    return {
      ok: false,
      reply: language.startsWith('hi')
        ? 'Document के लिए organization, location या employee बताएँ।'
        : 'Specify organization, location, or employee for the document.',
    };
  }

  // Validate location ∈ organization
  if (organizationId && locationId) {
    const loc = await getLocationById(locationId);
    if (loc && String(loc.organizationId) !== String(organizationId)) {
      return {
        ok: false,
        reply: language.startsWith('hi')
          ? 'यह location इस organization में नहीं है। सही location बताएँ।'
          : 'That location does not belong to this organization.',
      };
    }
  }

  const orgLabel = organizationId ? (await getOrganizationById(organizationId))?.organizationName : '';
  const locLabel = locationId ? (await getLocationById(locationId))?.name : '';
  const empLabel = slots.employeeId ? (await getEmployeeById(slots.employeeId))?.name : '';
  const scopeLabel = multiLocation
    ? (language.startsWith('hi') ? `सभी locations (${locationIds.length})` : `all locations (${locationIds.length})`)
    : (locLabel || orgLabel || empLabel || '');

  const titles = {
    salary_slip: `Salary slip — ${empLabel || scopeLabel || ''} — ${month}`,
    payroll: `Payroll — ${scopeLabel || ''} — ${month}`,
    wage_register: `Wage register — ${scopeLabel || ''} — ${month}`,
    attendance_register: `Attendance register — ${scopeLabel || ''} — ${month}`,
    bank_invoice: `Bank invoice — ${scopeLabel || ''} — ${month}`,
    payroll_run: `Payroll run — ${scopeLabel || ''} — ${month}`,
    client_invoice: `Client invoice — ${locLabel || ''} — ${month}`,
  };

  const document = {
    type: documentType,
    format,
    month,
    organizationId,
    locationId: multiLocation ? null : locationId,
    locationIds: multiLocation ? locationIds : (locationIds.length ? locationIds : null),
    locationScope: multiLocation ? 'all_in_org' : (locationId ? 'single' : locationScope),
    employeeIds,
    title: titles[documentType] || `${documentType} — ${month}`,
  };
  if (slots.batchId) document.batchId = slots.batchId;

  // Same data gate as download: payroll API only returns employees with attendance in range
  if (user && ['salary_slip', 'payroll'].includes(documentType)) {
    const { calculatePayrollWithDeductions } = require('../../services/payrollService');
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const fromDate = `${month}-01`;
    const toDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    try {
      const payroll = await calculatePayrollWithDeductions(user, {
        organizationId: organizationId || undefined,
        locationId: multiLocation ? undefined : (locationId || undefined),
        employeeIds: employeeIds || undefined,
        fromDate,
        toDate,
        attendanceOnly: true,
      });
      if (!payroll.lines?.length) {
        return {
          ok: false,
          reply: language.startsWith('hi')
            ? `इस महीने (${month}) के लिए कोई attendance/payroll data नहीं मिला। पहले attendance mark करें, फिर payroll माँगें।`
            : `No attendance/payroll data for ${month}. Mark attendance first, then ask for payroll.`,
          source: 'validation',
          slots: {
            organizationId,
            locationId: document.locationId,
            locationIds: document.locationIds,
            locationScope: document.locationScope,
            employeeId: slots.employeeId || null,
            month,
            intent: documentType,
          },
        };
      }
    } catch (error) {
      return {
        ok: false,
        reply: language.startsWith('hi')
          ? `Payroll नहीं बन पाया: ${error.message || 'error'}`
          : `Could not build payroll: ${error.message || 'error'}`,
        source: 'validation',
      };
    }
  }

  // Per-location downloads only for registers / bank letter — payroll is one org-wide file
  const perLocationDownload = multiLocation
    && ['wage_register', 'attendance_register', 'bank_invoice'].includes(documentType);
  const replyExtra = perLocationDownload && language.startsWith('hi')
    ? ` (${locationIds.length} locations — प्रत्येक location की अलग file download होगी।)`
    : (perLocationDownload ? ` (${locationIds.length} locations — one file per location.)` : '');

  return {
    ok: true,
    reply: language.startsWith('hi')
      ? `${document.title} तैयार है। PDF/Excel download करें।${replyExtra}`
      : `${document.title} is ready. Choose PDF or Excel to download.${replyExtra}`,
    document,
    source: 'plan',
    slots: {
      organizationId,
      locationId: document.locationId,
      locationIds: document.locationIds,
      locationScope: document.locationScope,
      employeeId: slots.employeeId || null,
      month,
      format,
      intent: documentType,
    },
  };
}

async function buildSalaryAmount(user, slots = {}, language = 'hi-IN') {
  const { calculatePayroll } = require('../../services/payrollService');
  const month = slots.month || currentMonthInTimeZone();
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const fromDate = `${month}-01`;
  const toDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  if (!slots.organizationId && !slots.locationId && !slots.employeeId) {
    return {
      ok: false,
      reply: language.startsWith('hi') ? 'Salary के लिए employee / location / organization बताएँ।' : 'Specify employee, location, or organization.',
    };
  }

  let organizationId = slots.organizationId;
  if (!organizationId && slots.locationId) {
    organizationId = (await getLocationById(slots.locationId))?.organizationId;
  }
  if (!organizationId && slots.employeeId) {
    organizationId = (await getEmployeeById(slots.employeeId))?.organizationId;
  }

  const payroll = await calculatePayroll(user, {
    organizationId,
    locationId: slots.locationId || undefined,
    employeeIds: slots.employeeId ? [slots.employeeId] : undefined,
    fromDate,
    toDate,
  });

  if (slots.employeeId) {
    const line = payroll.lines.find((item) => String(item.employeeId) === String(slots.employeeId));
    if (!line) {
      return { ok: false, reply: language.startsWith('hi') ? 'इस month का payroll data नहीं मिला।' : 'No payroll data for this month.' };
    }
    return {
      ok: true,
      reply: `${line.employeeName} (${month})\nPaid days: ${line.paidDays}\nGross: ${line.totalWages ?? line.grossPay}\nNet: ${line.netPay ?? line.grossPay}`,
      data: line,
      source: 'data',
      slots: { organizationId, locationId: slots.locationId || null, employeeId: slots.employeeId, month },
    };
  }

  const totals = payroll.netTotals || payroll.totals || [];
  const totalText = totals.map((row) => `${row.currency}: ${row.total}`).join(', ') || '0';
  const scope = slots.locationId
    ? (language.startsWith('hi') ? 'location' : 'location')
    : (language.startsWith('hi') ? 'पूरी organization' : 'entire organization');
  return {
    ok: true,
    reply: `Payroll ${month} (${scope})\nEmployees: ${payroll.summary?.employees ?? payroll.lines.length}\nTotal payable: ${totalText}`,
    data: { summary: payroll.summary, totals, lines: payroll.lines.slice(0, 50) },
    source: 'data',
    slots: { organizationId, locationId: slots.locationId || null, month },
  };
}

module.exports = {
  DOCUMENT_INTENTS,
  isDocumentIntent,
  buildDocumentPlan,
  buildSalaryAmount,
};
