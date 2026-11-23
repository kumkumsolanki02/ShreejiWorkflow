/** Maps spoken / typed field phrases → canonical object keys. */

const EMPLOYEE_FIELDS = {
  phone: [
    'mobile number', 'mobile no', 'phone number', 'phone no', 'contact number', 'contact no',
    'mobile', 'phone', 'contact', 'मोबाइल नंबर', 'मोबाइल नम्बर', 'फोन नंबर', 'मोबाइल', 'फोन',
    'मोबाईल', 'फोन नम्बर', 'whatsapp number', 'whatsapp',
  ],
  email: [
    'email id', 'email address', 'mail id', 'email', 'mail', 'ईमेल आईडी', 'ईमेल', 'मेल आईडी', 'मेल',
  ],
  bankAccountNumber: [
    'bank account number', 'bank account no', 'bank number', 'bank no', 'account number', 'account no',
    'a/c number', 'a/c no', 'ac number', 'ac no', 'bank account', 'अकाउंट नंबर', 'अकाउंट नम्बर',
    'खाता नंबर', 'बैंक अकाउंट', 'बैंक नंबर', 'बैंक अकाउंट नंबर', 'खाता संख्या',
  ],
  bankRoutingCode: [
    'ifsc code', 'ifsc', 'routing code', 'bank code', 'आईएफएससी कोड', 'आईएफएससी', 'ifsc कोड',
  ],
  bankName: ['bank name', 'बैंक का नाम', 'बैंक नाम'],
  bankBranch: ['bank branch', 'branch name', 'branch', 'ब्रांच', 'शाखा'],
  bankAccountHolder: ['account holder', 'account holder name', 'holder name', 'अकाउंट होल्डर'],
  uan: ['uan number', 'uan no', 'uan', 'यूएएन', 'यू ए एन'],
  aadhaarNumber: ['aadhaar number', 'aadhar number', 'aadhaar', 'aadhar', 'आधार नंबर', 'आधार'],
  esicNumber: ['esic number', 'esi number', 'esic', 'esi', 'ईएसआईसी', 'ईएसआई'],
  designation: ['designation', 'पदनाम', 'पद'],
  employmentType: ['employment type', 'job type', 'employment', 'रोजगार प्रकार'],
  skillCategory: ['skill category', 'skill', 'स्किल कैटेगरी', 'स्किल'],
  dateOfJoining: ['date of joining', 'joining date', 'joining', 'doj', 'जॉइनिंग डेट', 'जॉइनिंग'],
  dateOfBirth: ['date of birth', 'birth date', 'birth', 'dob', 'जन्म तिथि', 'जन्मदिन'],
  parentName: ['parent name', 'father name', 'father', 'parent', 'पिता का नाम', 'पिता'],
  department: ['department', 'dept', 'विभाग'],
  jobTitle: ['job title', 'title', 'जॉब टाइटल'],
  address: ['home address', 'address', 'adress', 'addres', 'पता', 'एड्रेस'],
  status: ['employee status', 'status', 'स्थिति'],
  dailySalary: [
    'daily salary', 'daily wage', 'daily pay', 'per day salary', 'wage', 'रोजाना वेतन', 'डेली सैलरी',
  ],
  basicPay: ['basic pay', 'basic salary', 'basic', 'बेसिक पे', 'बेसिक'],
  dearnessAllowance: ['dearness allowance', 'dearness', 'da', 'डीए'],
  name: ['employee name', 'full name', 'emp name'],
};

const ORGANIZATION_FIELDS = {
  organizationName: [
    'organization name', 'organisation name', 'org name', 'company name', 'कंपनी का नाम',
    'संगठन का नाम', 'संगठन नाम',
  ],
  email: [
    'organization email', 'org email', 'company email', 'email id', 'email', 'mail', 'ईमेल', 'मेल',
  ],
  phone: [
    'organization phone', 'org phone', 'company phone', 'phone number', 'mobile number',
    'phone', 'mobile', 'contact', 'मोबाइल', 'फोन',
  ],
  address: ['organization address', 'org address', 'company address', 'address', 'पता'],
  website: ['website', 'web site', 'साइट', 'वेबसाइट'],
  industry: ['industry', 'उद्योग'],
  governmentType: ['government type', 'govt type', 'gov type', 'सरकार प्रकार', 'सरकार'],
  area: ['area', 'क्षेत्र'],
  status: ['organization status', 'org status', 'status', 'स्थिति'],
  about: ['about', 'description', 'परिचय'],
};

const LOCATION_FIELDS = {
  name: ['location name', 'site name', 'लोकेशन नाम', 'साइट नाम'],
  workName: ['work name', 'काम का नाम', 'वर्क नेम'],
  opNumber: ['op number', 'op no', 'op', 'ओपी नंबर', 'ओपी'],
  address: ['location address', 'site address', 'address', 'पता'],
  loaReference: ['loa reference', 'loa number', 'loa', 'work order', 'लोआ'],
  designation: ['location designation', 'designation', 'पद'],
  status: ['location status', 'status', 'स्थिति'],
};

function buildLookup(map) {
  const entries = [];
  for (const [canonical, aliases] of Object.entries(map)) {
    for (const alias of aliases) {
      entries.push({ alias: alias.toLowerCase(), canonical });
    }
  }
  entries.sort((a, b) => b.alias.length - a.alias.length);
  return entries;
}

const EMPLOYEE_LOOKUP = buildLookup(EMPLOYEE_FIELDS);
const ORGANIZATION_LOOKUP = buildLookup(ORGANIZATION_FIELDS);
const LOCATION_LOOKUP = buildLookup(LOCATION_FIELDS);

function aliasMatches(text, alias) {
  const needle = String(alias || '').toLowerCase().trim();
  if (!needle) return false;
  // Short / single-token aliases need word boundaries ("andar" must not hit "da")
  if (needle.length <= 3 || !/\s/.test(needle)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=[^\\p{L}\\p{N}]|$)`, 'iu').test(text);
  }
  return text.includes(needle);
}

function matchFields(text, lookup) {
  const normalized = String(text || '').toLowerCase();
  const found = [];
  const used = new Set();
  for (const { alias, canonical } of lookup) {
    if (used.has(canonical)) continue;
    if (aliasMatches(normalized, alias)) {
      found.push(canonical);
      used.add(canonical);
    }
  }
  return found;
}

module.exports = {
  EMPLOYEE_FIELDS,
  ORGANIZATION_FIELDS,
  LOCATION_FIELDS,
  EMPLOYEE_LOOKUP,
  ORGANIZATION_LOOKUP,
  LOCATION_LOOKUP,
  matchFields,
};
