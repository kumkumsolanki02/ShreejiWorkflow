const FIELD_LABELS = {
  name: 'Name',
  organizationName: 'Organization',
  email: 'Email',
  phone: 'Mobile',
  address: 'Address',
  website: 'Website',
  industry: 'Industry',
  governmentType: 'Government type',
  area: 'Area',
  status: 'Status',
  about: 'About',
  workName: 'Work name',
  opNumber: 'OP number',
  loaReference: 'LOA reference',
  designation: 'Designation',
  bankAccountNumber: 'Bank account number',
  bankRoutingCode: 'IFSC',
  bankName: 'Bank name',
  bankBranch: 'Branch',
  bankAccountHolder: 'Account holder',
  uan: 'UAN',
  aadhaarNumber: 'Aadhaar',
  esicNumber: 'ESIC',
  employmentType: 'Employment type',
  skillCategory: 'Skill category',
  dateOfJoining: 'Date of joining',
  dateOfBirth: 'Date of birth',
  parentName: 'Parent name',
  department: 'Department',
  jobTitle: 'Job title',
  dailySalary: 'Daily salary',
  basicPay: 'Basic pay',
  dearnessAllowance: 'Dearness allowance',
};

function projectFields(entity, fields = [], { alwaysInclude = ['name'] } = {}) {
  if (!entity) return null;
  if (!fields.length) return { ...entity };

  const projected = {};
  for (const key of alwaysInclude) {
    if (entity[key] !== undefined) projected[key] = entity[key];
  }
  for (const field of fields) {
    if (entity[field] !== undefined) projected[field] = entity[field];
  }
  return projected;
}

const HIDDEN_PROJECT_KEYS = new Set([
  'id', 'organizationId', 'locationId', 'keys', '_id', '__v',
  'password', 'passwordHash', 'token', 'refreshToken',
  'posts', 'role', 'createdAt', 'updatedAt', 'permissions',
]);

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    if (value.every((item) => item && typeof item === 'object')) {
      return value.map((item) => item.workName || item.name || item.label || '').filter(Boolean).join(', ') || '—';
    }
    return value.map((item) => (item && typeof item === 'object' ? (item.name || JSON.stringify(item)) : String(item))).join(', ');
  }
  if (value instanceof Date) return value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  if (typeof value === 'object') {
    return value.workName || value.name || value.label || value.organizationName || '—';
  }
  return String(value);
}

function formatProjectedReply(title, projected, language = 'hi-IN') {
  if (!projected) {
    return language.startsWith('hi') ? 'जानकारी नहीं मिली।' : 'No data found.';
  }
  const lines = Object.entries(projected)
    .filter(([key]) => !HIDDEN_PROJECT_KEYS.has(key))
    .map(([key, value]) => {
      const label = FIELD_LABELS[key] || key;
      return `${label}: ${formatDisplayValue(value)}`;
    });
  return `${title}\n${lines.join('\n')}`;
}

function formatListReply(title, items, { nameKey = 'name', limit = 40 } = {}) {
  if (!items.length) return `${title}\n(none)`;
  const shown = items.slice(0, limit);
  const lines = shown.map((item, index) => `${index + 1}. ${item[nameKey] || item.name || item.id}`);
  if (items.length > limit) lines.push(`… and ${items.length - limit} more`);
  return `${title} (${items.length})\n${lines.join('\n')}`;
}

module.exports = {
  FIELD_LABELS,
  projectFields,
  formatProjectedReply,
  formatListReply,
};
