/**
 * Merge session memory with this-turn slots.
 * Critical rule: if the user explicitly named an employee/location/org this turn,
 * never silently reuse a previous entity of that kind (prevents wrong-person answers).
 */
function mergeSlots(sessionSlots = {}, filledSlots = {}, options = {}) {
  const {
    usesContext = false,
    explicitEmployeeMention = false,
    explicitLocationMention = false,
    explicitOrganizationMention = false,
  } = options;

  const merged = {
    organizationId: filledSlots.organizationId || null,
    locationId: filledSlots.locationId || null,
    locationIds: Array.isArray(filledSlots.locationIds) ? filledSlots.locationIds : null,
    locationScope: filledSlots.locationScope || null,
    employeeId: filledSlots.employeeId || null,
    month: filledSlots.month || null,
    date: filledSlots.date || null,
    status: filledSlots.status || null,
    fields: Array.isArray(filledSlots.fields) ? filledSlots.fields : [],
    format: filledSlots.format || 'pdf',
    outputMode: filledSlots.outputMode || null,
    intent: filledSlots.intent || null,
  };

  const canCarryEmployee = !explicitEmployeeMention;
  const canCarryLocation = !explicitLocationMention;
  const canCarryOrganization = !explicitOrganizationMention;

  // Carry only missing soft slots / follow-up context
  if (usesContext || !merged.month || !merged.date || !merged.status || !merged.fields.length
    || !merged.organizationId || !merged.locationId || !merged.employeeId) {
    if (!merged.organizationId && canCarryOrganization) {
      merged.organizationId = sessionSlots.organizationId || null;
    }
    if (!merged.locationId && canCarryLocation) {
      merged.locationId = sessionSlots.locationId || null;
    }
    if (!merged.employeeId && canCarryEmployee) {
      merged.employeeId = sessionSlots.employeeId || null;
    }
    if (!merged.month) merged.month = sessionSlots.month || null;
    if (!merged.date) merged.date = sessionSlots.date || null;
    if (!merged.status) merged.status = sessionSlots.status || null;
    if (!merged.fields.length && Array.isArray(sessionSlots.fields)) {
      if (usesContext && (merged.intent || '').includes('_field')) {
        merged.fields = sessionSlots.fields;
      }
    }
    if (!merged.outputMode && sessionSlots.outputMode && usesContext) {
      merged.outputMode = sessionSlots.outputMode;
    }
  }

  return merged;
}

function slotsFromPlan(plan = {}) {
  return {
    organizationId: plan.organizationId || null,
    locationId: plan.locationId || null,
    employeeId: plan.employeeId || null,
    month: plan.month || null,
    date: Array.isArray(plan.dates) && plan.dates[0] ? plan.dates[0] : null,
    status: plan.status || null,
    fields: [],
    format: plan.format || 'pdf',
    outputMode: plan.full ? 'full' : null,
    intent: plan.type || null,
  };
}

module.exports = { mergeSlots, slotsFromPlan };
