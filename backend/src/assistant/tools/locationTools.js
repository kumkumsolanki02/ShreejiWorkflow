const mongoose = require('mongoose');
const Location = require('../../models/Location');
const { httpError } = require('../../utils/httpError');
const { getLocationById } = require('../engine/entityIndex');
const { projectFields, formatProjectedReply } = require('../engine/projector');

function publicLocation(location) {
  const value = location.toObject ? location.toObject() : location;
  return {
    id: String(value._id || value.id),
    organizationId: String(value.organizationId?._id || value.organizationId),
    workName: value.workName || '',
    opNumber: value.opNumber || '',
    name: value.name,
    address: value.address || '',
    loaReference: value.loaReference || '',
    designation: value.designation || '',
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function fetchLocation(organizationId, locationId) {
  if (!mongoose.isValidObjectId(locationId)) throw httpError(400, 'Invalid location id.');
  const filter = { _id: locationId };
  if (organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) throw httpError(400, 'Invalid organization id.');
    filter.organizationId = organizationId;
  }
  const location = await Location.findOne(filter);
  if (!location) throw httpError(404, 'Location not found.');
  return publicLocation(location);
}

async function getLocationData(_user, organizationId, locationId, { fields = [], full = false, language = 'hi-IN' } = {}) {
  if (!locationId) {
    return { ok: false, reply: language.startsWith('hi') ? 'किस location की जानकारी चाहिए?' : 'Which location?' };
  }
  let orgId = organizationId;
  if (!orgId) {
    const cached = await getLocationById(locationId);
    orgId = cached?.organizationId || null;
  }

  const location = await fetchLocation(orgId, locationId);
  const projected = full || !fields.length
    ? location
    : projectFields(location, fields, { alwaysInclude: ['name', 'workName'] });
  const title = language.startsWith('hi') ? 'Location जानकारी' : 'Location details';
  return {
    ok: true,
    reply: formatProjectedReply(title, projected, language),
    data: projected,
    source: 'data',
    slots: {
      organizationId: String(location.organizationId || orgId),
      locationId: String(location.id || locationId),
    },
  };
}

async function ensureLocationLabel(locationId) {
  const cached = await getLocationById(locationId);
  return cached?.name || cached?.workName || locationId;
}

module.exports = { getLocationData, ensureLocationLabel, fetchLocation };
