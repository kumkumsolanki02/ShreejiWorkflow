/** Intent synonym packs — Hindi + English + Hinglish. Higher weight phrases win. */

const INTENTS = [
  {
    id: 'greeting',
    weight: 2,
    phrases: [
      'hello', 'hi', 'hey', 'नमस्ते', 'नमस्कार', 'good morning', 'good evening', 'हेलो', 'हाय',
    ],
  },
  {
    id: 'help',
    weight: 1,
    phrases: [
      'help', 'मदद', 'हेल्प', 'क्या कर सकते', 'what can you', 'commands', 'assist', 'menu',
      'kya kar sakte', 'kya kya kar sakte', 'tum kya kya', 'aap kya kar',
      'क्या क्या कर सकते', 'how to use', 'options', 'features',
    ],
  },
  {
    id: 'cancel',
    weight: 3,
    phrases: ['cancel', 'रद्द', 'मत करो', "don't", 'do not', 'कैंसल', 'cancel karo', 'रद्द करो'],
  },
  {
    id: 'count_organizations',
    weight: 5,
    phrases: [
      'kitne organizations', 'kitni organisations', 'kitne organisations', 'kitni organizations',
      'कितने organization', 'कितनी organizations', 'how many organizations', 'organization count',
      'active organizations', 'inactive organizations', 'deactive organizations',
      'dashboard organizations', 'kitne orgs', 'kitni orgs', 'कितनी कंपनी',
    ],
  },
  {
    id: 'count_locations',
    weight: 5,
    phrases: [
      'kitne locations', 'kitni locations', 'कितने location', 'कितनी locations', 'कितने locations',
      'how many locations', 'location count', 'locations कितने', 'locations kitne', 'locations kitni',
      'kitne sites', 'kitni sites', 'organization में कितने location', 'ke andar kitne locations',
      'ke andar kitni locations', 'organization ke andar kitni', 'org ke andar kitne',
      'dashboard locations', 'active locations', 'inactive locations', 'deactive locations',
    ],
  },
  {
    id: 'count_employees',
    weight: 5,
    phrases: [
      'count', 'कितने employee', 'कितने employees', 'how many employee', 'how many employees',
      'संख्या', 'total employees', 'employee count', 'active कितने', 'kitne employee',
      'kitne employees', 'employees kitne', 'employee kitne', 'कितने कर्मचारी', 'कर्मचारी कितने',
      'active employees count', 'active employee count', 'total active', 'count active',
      'कितने एक्टिव', 'एक्टिव कितने', 'number of employees', 'employees की संख्या',
      'location में कितने', 'org में कितने', 'organization में कितने',
    ],
  },
  {
    id: 'list_employees',
    weight: 4,
    phrases: [
      'employee list', 'employees list', 'list of employee', 'list of employees', 'list employees',
      'employees बताओ', 'employee बताओ', 'कर्मचारी लिस्ट', 'active employees', 'active employee list',
      'सभी employee', 'सारे employee', 'सभी employees', 'सारे employees', 'show employees',
      'employees दिखाओ', 'employee दिखाओ', 'employee की list', 'employees की list',
      'employees के नाम', 'employee names', 'नाम बताओ employees', 'list all employees',
      'सभी कर्मचारी', 'सारे कर्मचारी', 'कर्मचारी लिस्ट दो', 'employees की लिस्ट दो',
      'location के employees', 'location के कर्मचारी', 'org के employees',
      'organization के employees', 'organization के अंदर employees', 'org ke andar employees',
      'organization की employee list', 'सारे employee के नाम',
    ],
  },
  {
    id: 'lookup_entity',
    weight: 4,
    phrases: [
      'details दो', 'जानकारी दो', 'details बताओ', 'जानकारी बताओ', 'की details', 'की जानकारी',
      'full details', 'पूरी जानकारी', 'पूरी details', 'complete details',
    ],
  },
  {
    id: 'get_employee_full',
    weight: 5,
    phrases: [
      'employee details', 'employee की details', 'employee की जानकारी',
      'employee full', 'full profile', 'employee profile',
      'कर्मचारी की जानकारी', 'कर्मचारी की details', 'emp details', 'employee info',
    ],
  },
  {
    id: 'get_employee_field',
    weight: 6,
    phrases: [
      'mobile', 'phone', 'bank number', 'account number', 'ifsc', 'email', 'uan', 'aadhaar',
      'aadhar', 'मोबाइल', 'फोन', 'बैंक', 'ईमेल', 'bank account', 'mobile number', 'phone number',
      'contact number', 'whatsapp', 'आधार', 'esic', 'designation', 'पद', 'joining', 'dob',
      'daily salary', 'basic pay', 'account holder', 'branch', 'पता', 'address', 'adress', 'एड्रेस',
    ],
  },
  {
    id: 'get_org_full',
    weight: 5,
    phrases: [
      'organization details', 'organisation details', 'org details', 'organization की जानकारी',
      'organization की details', 'पूरी organization', 'full organization', 'संगठन की जानकारी',
      'organization full', 'org full details', 'company details', 'कंपनी की जानकारी',
      'कंपनी की details', 'org info', 'organization info', 'संगठन की पूरी',
    ],
  },
  {
    id: 'get_org_field',
    weight: 6,
    phrases: [
      'organization email', 'org email', 'organization का email', 'organization की email',
      'organization phone', 'org phone', 'organization का नाम', 'organization name',
      'company email', 'कंपनी का email', 'कंपनी की email', 'संगठन का email',
      'org का email', 'org की email', 'organization address', 'org address',
      'organization का फोन', 'organization का mobile',
    ],
  },
  {
    id: 'get_location_full',
    weight: 5,
    phrases: [
      'location details', 'location की जानकारी', 'location की details', 'पूरी location',
      'location की पूरी', 'location की पूरी जानकारी', 'location की पूरी details',
      'site details', 'लोकेशन की जानकारी', 'लोकेशन की पूरी', 'location full',
      'लोकेशन डिटेल्स', 'site की जानकारी', 'location info', 'लोकेशन की details',
    ],
  },
  {
    id: 'get_location_field',
    weight: 5,
    phrases: [
      'location name', 'location address', 'location का पता', 'location की address',
      'op number', 'work name', 'लोकेशन का नाम', 'लोकेशन का पता', 'site address',
      'location designation', 'loa',
    ],
  },
  {
    id: 'mark_attendance',
    weight: 7,
    phrases: [
      'attendance लगा', 'attendance mark', 'mark attendance', 'mark present', 'mark absent',
      'present लगा', 'absent लगा', 'absent mark', 'present mark', 'attendance कर दो',
      'सभी की attendance', 'सारे employee की attendance', 'attendance लगा दो', 'attendance लगा दे',
      'लगा दो attendance', 'लगा दे attendance', 'attendance कर देना', 'attendance डाल',
      'attendance भर', 'सबको present', 'सबको absent', 'sabko present', 'sabko absent',
      'attendance laga do', 'attendance laga de', 'mark all present', 'mark all absent',
      'सभी को present', 'सभी को absent', 'सारे को present', 'सारे को absent',
      'attendance set', 'attendance do', 'हाजरी लगा', 'हाजिरी लगा', 'present कर दो',
      'absent कर दो', 'location की attendance', 'employees की attendance लगा',
      'absent mark', 'absent maar', 'present mark', 'present maar', 'maar kar do', 'mark kar do',
      'month ki absent', 'month ki present', 'sare employee',
      'absent laga do', 'present laga do', 'haazri laga', 'hajri mark',
      'october ki absent', 'november ki present', 'sare employ ki attendance',
    ],
  },
  {
    id: 'edit_attendance',
    weight: 6,
    phrases: [
      'edit attendance', 'change attendance', 'attendance बदल', 'attendance update',
      'attendance सही', 'attendance सुधार', 'correct attendance', 'fix attendance',
      'attendance change करो',
    ],
  },
  {
    id: 'get_attendance',
    weight: 5,
    phrases: [
      'attendance दो', 'attendance बताओ', 'attendance दिखाओ', 'show attendance',
      'attendance summary', 'आज की attendance', 'today attendance', 'attendance status',
      'attendance की जानकारी', 'आज की हाजरी', 'today की attendance', 'aaj ki attendance',
      'attendance report', 'attendance देखो', 'attendance check', 'हाजरी बताओ',
    ],
  },
  {
    id: 'employee_attendance',
    weight: 6,
    phrases: [
      'employee attendance', 'की attendance', 'का attendance', 'attendance of',
      'की हाजरी', 'का हाजरी', 'attendance क्या है', 'present है क्या',
    ],
  },
  {
    id: 'salary_slip',
    weight: 7,
    phrases: [
      'salary slip', 'सैलरी स्लिप', 'pay slip', 'payslip', 'salary slips',
      'salary slip दो', 'सैलरी स्लिप दो', 'pay slip दो', 'slip दो',
      'celery slip', 'salary sleep', 'location ka salary slip',
    ],
  },
  {
    id: 'payroll',
    weight: 7,
    phrases: [
      'payroll', 'पेरोल', 'payroll दो', 'payroll बताओ', 'show payroll', 'payroll details',
      'salary amount', 'वेतन', 'इस महीने का payroll', 'this month payroll', 'payroll report',
      'पेरोल दो', 'पेरोल बताओ', 'payroll निकालो', 'payroll generate',
      'सभी locations का payroll', 'सारी locations का पेरोल', 'organization का payroll',
      'org का payroll', 'all locations payroll', 'october का payroll',
      'petrol', 'petrol do', 'patrol', 'september ka petrol', 'november ka petrol',
      'january ka payroll', 'pay role', 'pay royal', 'location ka payroll',
    ],
  },
  {
    id: 'wage_register',
    weight: 7,
    phrases: [
      'wage register', 'वेज रजिस्टर', 'form xvii', 'wage sheet', 'wage register दो',
      'वेज रजिस्टर दो', 'सभी locations का wage register',
      'bedsheet', 'wedge sheet', 'january ka wage sheet', 'location ka wage sheet',
      'wage resister', 'form 17', 'form 17 register',
    ],
  },
  {
    id: 'attendance_register',
    weight: 7,
    phrases: [
      'attendance register', 'अटेंडेंस रजिस्टर', 'register attendance', 'attendance sheet download',
      'attendance register दो', 'अटेंडेंस रजिस्टर दो', 'attendance sheet',
      'सभी locations का attendance', 'सारी locations की attendance', 'all locations attendance',
      'location ka attendance register', 'month ka attendance register',
    ],
  },
  {
    id: 'bank_invoice',
    weight: 7,
    phrases: [
      'bank invoice', 'bank letter', 'बैंक इनवॉइस', 'bank payment letter', 'neft letter',
      'bank invoice दो', 'बैंक लेटर', 'bank payment', 'neft',
      'सभी locations का bank invoice', 'location ka bank invoice', 'bank later',
    ],
  },
  {
    id: 'payroll_run',
    weight: 7,
    phrases: ['payroll run', 'payroll letter', 'पेरोल रन', 'payroll run दो'],
  },
  {
    id: 'client_invoice',
    weight: 7,
    phrases: [
      'client invoice', 'invoice दो', 'location invoice', 'बिल दो', 'invoice for',
      'client bill', 'organization invoice', 'invoice generate', 'बिल निकालो',
      'client का invoice', 'location का invoice', 'invoice बनाओ',
      'invoice do', 'november ka invoice', 'month ka invoice', 'location ka invoice',
    ],
  },
  {
    id: 'salary_amount',
    weight: 5,
    phrases: [
      'salary कितना', 'कितना salary', 'how much salary', 'net pay', 'gross pay',
      'वेतन कितना', 'payable', 'kitna salary', 'salary kitna', 'net salary',
      'कितना वेतन', 'pay कितना', 'earning कितना',
    ],
  },
];

const ENTITY_HINTS = {
  organization: [
    'organization', 'organisation', 'org', 'company', 'संगठन', 'कंपनी', 'ऑर्गनाइजेशन',
    'client org', 'firm', 'कंपनी का', 'org का', 'organisation का',
  ],
  location: [
    'location', 'site', 'लोकेशन', 'साइट', 'work site', 'कार्यस्थल', 'unit', 'plant',
    'camp', 'gate', 'yard', 'depot', 'location का', 'site का',
  ],
  employee: [
    'employee', 'employees', 'staff', 'कर्मचारी', 'एम्प्लॉई', 'worker', 'workers',
    'emp', 'person', 'व्यक्ति', 'employ', 'labour', 'labor',
  ],
};

const STATUS_PHRASES = [
  { status: 'present', phrases: ['present', 'प्रेजेंट', 'हाजिर', 'p mark', 'mark p', 'haazir', 'hazir', 'prasant', 'presant'] },
  { status: 'absent', phrases: ['absent', 'अबसेंट', 'गैरहाजिर', 'a mark', 'mark a', 'non present', 'absant', 'upsant'] },
  { status: 'half_day', phrases: ['half day', 'half_day', 'हाफ डे', 'hd', 'halfday'] },
  { status: 'leave', phrases: ['leave', 'छुट्टी', 'leave mark'] },
  { status: 'paid_leave', phrases: ['paid leave', 'pl', 'पेड लीव', 'paid leave'] },
  { status: 'casual_leave', phrases: ['casual leave', 'cl', 'कैजुअल'] },
  { status: 'sick_leave', phrases: ['sick leave', 'sl', 'सिक लीव'] },
  { status: 'weekly_off', phrases: ['weekly off', 'wo', 'week off'] },
  { status: 'holiday', phrases: ['holiday', 'छुट्टी का दिन', 'public holiday'] },
];

const MONTH_NAMES = {
  january: 1, jan: 1, जनवरी: 1,
  february: 2, feb: 2, फरवरी: 2, फ़रवरी: 2,
  march: 3, mar: 3, मार्च: 3,
  april: 4, apr: 4, अप्रैल: 4,
  may: 5, मई: 5,
  june: 6, jun: 6, जून: 6,
  july: 7, jul: 7, जुलाई: 7,
  august: 8, aug: 8, अगस्त: 8,
  september: 9, sep: 9, sept: 9, सितंबर: 9, सितम्बर: 9,
  october: 10, oct: 10, अक्टूबर: 10,
  november: 11, nov: 11, नवंबर: 11, नवम्बर: 11,
  december: 12, dec: 12, दिसंबर: 12, दिसम्बर: 12,
};

const CONTEXT_WORDS = [
  'इस', 'उस', 'वही', 'उसी', 'इसी', 'इसका', 'उसका', 'उसकी', 'उसके', 'इसकी', 'इसके',
  'this', 'that', 'same', 'uska', 'uski', 'uske', 'iska', 'iski', 'iske', 'their', 'his', 'her',
  'उन्हीं', 'इन्हीं', 'वही वाला', 'same wala',
];

const FULL_WORDS = [
  'full', 'complete', 'पूरी', 'सारी', 'सभी जानकारी', 'पूरी जानकारी', 'full details', 'complete details',
  'पूरी details', 'full जानकारी', 'सारी details', 'सब details', 'सब जानकारी', 'entire', 'complete info',
];
const COUNT_WORDS = [
  'count', 'कितने', 'how many', 'संख्या', 'total number', 'kitne', 'कितना', 'number of', 'total',
];
const LIST_WORDS = [
  'list', 'लिस्ट', 'दिखाओ', 'बताओ', 'show', 'names', 'नाम', 'नाम बताओ', 'list out', 'enumerate',
];

const NOISE_WORDS = [
  'please', 'pls', 'plz', 'कृपया', 'भाई', 'यार', 'sir', 'ji', 'जी', 'बस', 'only', 'just',
  'can you', 'could you', 'mujhe', 'मुझे', 'mera', 'meri', 'mere',
  'like', 'basically', 'actually', 'simply', 'bas', 'thoda', 'थोड़ा',
];

module.exports = {
  INTENTS,
  ENTITY_HINTS,
  STATUS_PHRASES,
  MONTH_NAMES,
  CONTEXT_WORDS,
  FULL_WORDS,
  COUNT_WORDS,
  LIST_WORDS,
  NOISE_WORDS,
};
