const { getOrganization } = require('../../services/organizationService');
const { getOrganizationById } = require('../engine/entityIndex');
const { projectFields, formatProjectedReply } = require('../engine/projector');

async function getOrganizationData(organizationId, { fields = [], full = false, language = 'hi-IN' } = {}) {
  if (!organizationId) {
    return { ok: false, reply: language.startsWith('hi') ? 'किस organization की जानकारी चाहिए?' : 'Which organization?' };
  }
  const org = await getOrganization(organizationId);
  const projected = full || !fields.length
    ? org
    : projectFields(org, fields, { alwaysInclude: ['organizationName', 'name'] });
  const title = language.startsWith('hi') ? 'Organization जानकारी' : 'Organization details';
  return {
    ok: true,
    reply: formatProjectedReply(title, projected, language),
    data: projected,
    source: 'data',
    slots: { organizationId: String(org.id || organizationId) },
  };
}

async function ensureOrganizationLabel(organizationId) {
  const cached = await getOrganizationById(organizationId);
  return cached?.organizationName || cached?.name || organizationId;
}

module.exports = { getOrganizationData, ensureOrganizationLabel };
