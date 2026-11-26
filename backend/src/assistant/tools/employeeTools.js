const { getEmployee } = require('../../services/employeeService');
const { getEmployeesByFilter, getEmployeeById } = require('../engine/entityIndex');
const { projectFields, formatProjectedReply, formatListReply } = require('../engine/projector');

async function getEmployeeData(user, employeeId, {
  fields = [],
  full = false,
  language = 'hi-IN',
  soughtName = null,
} = {}) {
  if (!employeeId) {
    if (soughtName) {
      return {
        ok: false,
        reply: language.startsWith('hi')
          ? `"${soughtName}" नाम का employee नहीं मिला। पूरा नाम दोबारा बोलें/लिखें, या choices से चुनें।`
          : `No employee found matching "${soughtName}". Try the full name again.`,
      };
    }
    return { ok: false, reply: language.startsWith('hi') ? 'किस employee की जानकारी चाहिए?' : 'Which employee?' };
  }
  const employee = await getEmployee(user, employeeId);
  const projected = full || !fields.length
    ? employee
    : projectFields(employee, fields, { alwaysInclude: ['name'] });
  const title = language.startsWith('hi') ? 'Employee जानकारी' : 'Employee details';
  return {
    ok: true,
    reply: formatProjectedReply(title, projected, language),
    data: projected,
    source: 'data',
    slots: {
      employeeId: String(employee.id || employeeId),
      organizationId: employee.organizationId || null,
      locationId: employee.locationId || null,
    },
  };
}

async function listOrCountEmployees({
  organizationId,
  locationId,
  mode = 'list',
  language = 'hi-IN',
  locationScope = null,
  entityStatus = 'active',
} = {}) {
  const dashboardScope = locationScope === 'dashboard' || (!organizationId && !locationId && mode === 'count');
  if (!organizationId && !locationId && !dashboardScope) {
    return {
      ok: false,
      reply: language.startsWith('hi')
        ? 'किस organization या location के employees चाहिए?'
        : 'Which organization or location?',
    };
  }
  const status = entityStatus || 'active';
  const employees = await getEmployeesByFilter({
    organizationId: organizationId || undefined,
    locationId: locationId || undefined,
    status,
  });

  if (mode === 'count') {
    const label = status === 'inactive' ? 'inactive' : 'active';
    const scope = locationId ? 'location' : (organizationId ? 'organization' : 'dashboard');
    const reply = language.startsWith('hi') && scope === 'dashboard'
      ? `Dashboard में ${label} employees: ${employees.length}`
      : `${label.charAt(0).toUpperCase()}${label.slice(1)} employees (${scope}): ${employees.length}`;
    return {
      ok: true,
      reply,
      data: { count: employees.length, status, employees: employees.map((e) => ({ id: e.id, name: e.name })) },
      source: 'data',
      slots: {
        organizationId: organizationId || null,
        locationId: locationId || null,
        locationScope: scope === 'dashboard' ? 'dashboard' : null,
        entityStatus: status,
        outputMode: 'count',
      },
    };
  }

  return {
    ok: true,
    reply: formatListReply('Active employees', employees),
    data: { count: employees.length, employees: employees.map((e) => ({ id: e.id, name: e.name, email: e.email })) },
    source: 'data',
    slots: { organizationId: organizationId || null, locationId: locationId || null, outputMode: 'list' },
  };
}

async function ensureEmployeeLabel(employeeId) {
  const cached = await getEmployeeById(employeeId);
  return cached?.name || employeeId;
}

module.exports = {
  getEmployeeData,
  listOrCountEmployees,
  ensureEmployeeLabel,
};
