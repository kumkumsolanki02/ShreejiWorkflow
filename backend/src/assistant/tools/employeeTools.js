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

async function listOrCountEmployees({ organizationId, locationId, mode = 'list', language = 'hi-IN' } = {}) {
  if (!organizationId && !locationId) {
    return {
      ok: false,
      reply: language.startsWith('hi')
        ? 'किस organization या location के employees चाहिए?'
        : 'Which organization or location?',
    };
  }
  const employees = await getEmployeesByFilter({
    organizationId,
    locationId,
    status: 'active',
  });

  if (mode === 'count') {
    const scope = locationId ? 'location' : 'organization';
    const reply = `Active employees (${scope}): ${employees.length}`;
    return {
      ok: true,
      reply,
      data: { count: employees.length, employees: employees.map((e) => ({ id: e.id, name: e.name })) },
      source: 'data',
      slots: { organizationId: organizationId || null, locationId: locationId || null, outputMode: 'count' },
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
