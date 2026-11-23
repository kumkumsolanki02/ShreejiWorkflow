/**
 * High-confidence question templates (Hinglish + Hindi + English).
 * Order matters: specific action/domain patterns before generic possessive ones.
 */

const FIELD_GROUP = String.raw`(?:mobile(?:\s*number|\s*no)?|phone(?:\s*number|\s*no)?|contact(?:\s*number)?|मोबाइल|फोन|email|mail|ईमेल|मेल|bank(?:\s*account|\s*number|\s*no)?|account(?:\s*number|\s*no)?|ifsc|uan|aadhaar|aadhar|आधार|esic|designation|पद|address|adress|addres|पता|एड्रेस|joining|doj|dob|status|स्थिति|branch|ब्रांच|holder)`;

const ASK = String.raw`(?:दो|दे|देना|दे\s*दो|दे\s*दे|बताओ|बता\s*दो|बता\s*दे|दिखाओ|दिखा\s*दो|बताना|चाहिए|चाहिये|what\s+is|what'?s|give(?:\s+me)?|show(?:\s+me)?|tell(?:\s+me)?|send(?:\s+me)?|get|fetch|need|wanted)?`;

const NAME = String.raw`([\p{L}][\p{L}\p{N}.'\-\s]{1,48}?)`;

const RESERVED_NAMES = new Set([
  'organization', 'organisation', 'org', 'orgs', 'company', 'कंपनी', 'संगठन',
  'location', 'locations', 'site', 'sites', 'लोकेशन', 'साइट',
  'employee', 'employees', 'employeee', 'कर्मचारी', 'staff', 'worker', 'workers',
  'attendance', 'payroll', 'petrol', 'patrol', 'invoice', 'salary', 'wage', 'bedsheet',
  'slip', 'register', 'sheet', 'neft', 'bill', 'बिल', 'this', 'that', 'आज', 'today',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'month', 'maan', 'mahina',
  'active', 'inactive', 'deactive', 'all', 'सभी', 'सारे', 'महीने', 'इस', 'उस', 'इसी', 'उसी',
  'the', 'a', 'an', 'my', 'me', 'mere', 'meri', 'iska', 'uska',
  'mobile', 'phone', 'email', 'mail', 'address', 'adress', 'bank', 'ifsc', 'uan',
  'details', 'detail', 'information', 'info', 'profile', 'जानकारी',
  'number', 'count', 'list', 'full', 'complete', 'पूरी', 'सारी', 'summary', 'report',
  'tum', 'aap', 'you', 'kya', 'kar', 'sakte', 'ho', 'hai', 'hain', 'help', 'madad',
  'dashboard', 'please', 'krpya', 'mujhe', 'do', 'de', 'chahie', 'चाहिए',
  'present', 'absent', 'mark', 'maar', 'pdf', 'excel', 'download', 'generate',
  'confirm', 'cancel', 'yes', 'no', 'ok', 'okay', 'haan', 'nahi',
]);

function isReservedName(value) {
  const parts = String(value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return true;
  if (parts.every((part) => RESERVED_NAMES.has(part))) return true;
  if (parts.length === 1 && RESERVED_NAMES.has(parts[0])) return true;
  return false;
}

const QUESTION_PATTERNS = [
  {
    intent: 'greeting',
    confidence: 0.97,
    entity: null,
    outputMode: null,
    patterns: [
      /^(?:hi|hello|hey|hii+|helo|good\s*(?:morning|evening|afternoon))(?:\s|$|[,!.])/iu,
      /^(?:नमस्ते|नमस्कार|राधे\s*राधे|जय\s*श्री\s*कृष्ण|ही|हाय|हेलो|हैलो)(?:\s|$|[,!.])/iu,
      /^(?:hi|hello|hey).{0,40}(?:i\s*am|i'm|myself|मेरा\s*नाम|मैं)/iu,
      /^(?:ही|हाय|हेलो|हैलो).{0,40}(?:आई\s*एम|मैं|i\s*am)/iu,
    ],
  },
  {
    intent: 'help',
    confidence: 0.97,
    entity: null,
    outputMode: null,
    patterns: [
      /^(?:help|मदद|हेल्प|commands?|menu|options?)$/iu,
      /(?:क्या\s+कर\s+सकते|what\s+can\s+you|how\s+to\s+use)/iu,
      /(?:tum|aap|you)?\s*kya\s+(?:kya\s+)?kar\s+sakte/iu,
      /kya\s+kya\s+(?:kar\s+)?(?:sakte|karo|ho)/iu,
      /(?:capabilities|features|functions|kya\s+kya\s+ho\s+sakta)\b/iu,
      /(?:mujhe\s+)?(?:batao|बताओ)\s+(?:kya|क्या)\s+(?:kar|कर)/iu,
    ],
  },
  {
    intent: 'confirm_pending',
    confidence: 0.98,
    entity: null,
    outputMode: null,
    patterns: [
      /^(?:confirm|yes|yeah|yep|yup|ok|okay|haan|haa|हाँ|हां|जी|सही|कर\s*दो|kar\s*do|go\s*ahead|proceed|done|thik\s*hai|ठीक\s*है|bilkul|बिल्कुल)$/iu,
      /^(?:please\s+)?(?:confirm|हाँ|हां)\s*(?:karo|करो|do)?$/iu,
      /^(?:haa[n]?|haan\s*ji|yes\s*ji)$/iu,
    ],
  },
  {
    intent: 'cancel',
    confidence: 0.95,
    entity: null,
    outputMode: null,
    patterns: [
      /^(?:cancel|रद्द|कैंसल|mat\s+karo|don't|do\s+not|no|nahi|नहीं|ना|cancel\s*karo|रद्द\s*करो|mat\s*do|rehne\s*do|छोड़\s*दो)$/iu,
    ],
  },
  {
    intent: 'mark_attendance',
    confidence: 0.96,
    entity: 'location',
    outputMode: null,
    patterns: [
      /(?:attendance|अटेंडेंस|हाजरी).{0,40}(?:लगा|laga|mark|maar|डाल|भर|कर\s*दो|कर\s*दे|set)/iu,
      /(?:लगा|laga|mark|maar|डाल|भर).{0,25}(?:attendance|अटेंडेंस|हाजरी)/iu,
      /(?:sabko|सबको|सभी|सारे|all|sare).{0,40}(?:present|absent|प्रेजेंट|अबसेंट)/iu,
      /(?:present|absent|प्रेजेंट|अबसेंट).{0,40}(?:लगा|laga|mark|maar|कर\s*दो|कर\s*दे)/iu,
      /(?:location|लोकेशन).{0,50}(?:attendance|अटेंडेंस).{0,30}(?:present|absent|लगा|mark|maar)/iu,
      // "… employees … October month ki absent mark/maar kar do"
      /(?:employee|employees|कर्मचारी).{0,80}(?:present|absent|प्रेजेंट|अबसेंट).{0,40}(?:लगा|laga|mark|maar|कर\s*दो|कर\s*दे)/iu,
      /(?:month|महीने|manth|january|february|march|april|may|june|july|august|september|october|november|december).{0,40}(?:present|absent|प्रेजेंट|अबसेंट).{0,40}(?:लगा|laga|mark|maar|कर\s*दो|कर\s*दे)/iu,
      /(?:location|लोकेशन).{0,80}(?:employee|employees|कर्मचारी).{0,60}(?:present|absent|प्रेजेंट|अबसेंट)/iu,
      /(?:present|absent|प्रेजेंट|अबसेंट).{0,50}(?:employee|employees|कर्मचारी|sare|all|सभी|सारे)/iu,
      /(?:haazri|hajri|हाजरी).{0,40}(?:लगा|laga|mark|maar|कर\s*दो)/iu,
      /(?:sabko|sabhi|सभी\s*को).{0,30}(?:present|absent|p\b|a\b)/iu,
    ],
  },
  {
    intent: 'edit_attendance',
    confidence: 0.93,
    entity: 'employee',
    outputMode: null,
    patterns: [
      /(?:edit|change|update|बदल|सही\s*कर|सुधार).{0,20}(?:attendance|अटेंडेंस)/iu,
      /(?:attendance|अटेंडेंस).{0,20}(?:edit|change|update|बदल|सही)/iu,
    ],
  },
  {
    intent: 'count_organizations',
    confidence: 0.98,
    entity: 'organization',
    outputMode: 'count',
    forbid: ['location', 'locations', 'लोकेशन', 'employee', 'employees', 'कर्मचारी', 'payroll', 'attendance'],
    patterns: [
      /(?:कितने|कितनी|कितना|kitne|kitni|kitna|how\s+many|count|संख्या)\s+(?:active\s+|inactive\s+|deactive\s+)?(?:organizations?|organisations?|orgs?|कंपनी|कंपनियाँ|संगठन)/iu,
      /(?:organizations?|organisations?|orgs?|कंपनी|कंपनियाँ|संगठन).{0,25}(?:कितने|कितनी|कितना|kitne|kitni|kitna|count|संख्या)/iu,
      /(?:dashboard|डैशबोर्ड).{0,50}(?:कितने|कितनी|kitne|kitni).{0,40}(?:organizations?|organisations?|orgs?|कंपनी|संगठन)/iu,
    ],
  },
  {
    intent: 'count_locations',
    confidence: 0.97,
    entity: 'organization',
    outputMode: 'count',
    forbid: ['employee', 'employees', 'कर्मचारी', 'payroll', 'salary', 'attendance', 'slip'],
    patterns: [
      /(?:कितने|कितनी|कितना|kitne|kitni|kitna|how\s+many|count|संख्या)\s+(?:active\s+|inactive\s+|deactive\s+)?(?:location|locations|लोकेशन|sites?)/iu,
      /(?:location|locations|लोकेशन|sites?).{0,25}(?:कितने|कितनी|कितना|kitne|kitni|kitna|count|संख्या)\b/iu,
      /(?:dashboard|डैशबोर्ड).{0,50}(?:कितने|कितनी|kitne|kitni).{0,40}(?:location|locations|लोकेशन|sites?)/iu,
      /(?:ke\s*andar|के\s*अंदर).{0,40}(?:कितने|कितनी|कितना|kitne|kitni|kitna).{0,30}(?:location|locations|लोकेशन|sites?)/iu,
      /(?:organization|organisation|org|कंपनी).{0,40}(?:के\s*अंदर|ke\s*andar).{0,30}(?:कितने|कितनी|कितना|kitne|kitni|kitna).{0,25}(?:location|locations|लोकेशन|sites?)/iu,
    ],
  },
  {
    intent: 'list_employees',
    confidence: 0.97,
    entity: 'location',
    outputMode: 'list',
    forbid: [
      'payroll', 'पेरोल', 'salary slip', 'salaryslip', 'wage register', 'bank invoice', 'attendance register',
      // marking attendance must not fall through to employee list
      'absent', 'present', 'प्रेजेंट', 'अबसेंट', 'mark', 'maar', 'attendance', 'अटेंडेंस', 'हाजरी',
    ],
    patterns: [
      // "kitne employees … unki details/list/naam" → list, not bare count
      /(?:कितने|कितनी|kitne|kitni|all|jitne|jitni).{0,50}(?:employee|employees|कर्मचारी).{0,50}(?:details?|list|लिस्ट|naam|names?|नाम|जानकारी)/iu,
      // names/list (not lone "employee details" which is a person profile)
      /(?:employee|employees|कर्मचारी).{0,20}(?:ke\s+)?(?:naam|names?|नाम|list|लिस्ट)\s*(?:दो|दे|do|batao|बताओ)?/iu,
      /(?:location|लोकेशन).{0,50}(?:employee|employees|कर्मचारी).{0,40}(?:details?|list|लिस्ट|naam|names?|नाम)/iu,
      /(?:employee|employees|कर्मचारी).{0,40}(?:details?|list|लिस्ट|naam|names?|नाम).{0,50}(?:location|लोकेशन)/iu,
      /(?:active\s+)?(?:employee|employees|कर्मचारी).{0,20}(?:list|लिस्ट|names?|नाम)/iu,
      /(?:list|लिस्ट|show|दिखाओ|बताओ)\s+(?:all\s+|सभी\s+|सारे\s+|active\s+)?(?:employee|employees|कर्मचारी)/iu,
      /(?:location|लोकेशन|organization|org).{0,45}(?:employee|employees|कर्मचारी).{0,20}(?:list|लिस्ट)/iu,
      /(?:सभी|सारे|all)\s+(?:active\s+)?(?:employee|employees|कर्मचारी)/iu,
      /(?:organization|org|कंपनी).{0,60}(?:employee|employees|कर्मचारी).{0,25}(?:list|लिस्ट|नाम|names?|details)/iu,
      /(?:के\s*अंदर|ke\s*andar).{0,80}(?:employee|employees|कर्मचारी).{0,40}(?:list|लिस्ट|नाम|names?|details?|दो|दे|do|chahie|चाहिए)/iu,
      /(?:jitn[ie]\s+bhi|all).{0,40}(?:location|locations|लोकेशन).{0,50}(?:employee|employees|कर्मचारी)/iu,
      /(?:all|सभी|सारे|sabke).{0,40}(?:employee|employees|कर्मचारी).{0,30}(?:दो|दे|do|list|लिस्ट|चाहिए|chahie)?/iu,
      /(?:jo|जो).{0,50}(?:gate|camp|yard|depot|location|लोकेशन).{0,50}(?:employee|employees|कर्मचारी)/iu,
    ],
  },
  {
    intent: 'count_employees',
    confidence: 0.96,
    entity: 'location',
    outputMode: 'count',
    // If they also ask names/details/list, list_employees (above) wins; keep count pure
    forbid: ['details', 'detail', 'list', 'लिस्ट', 'naam', 'names', 'नाम', 'जानकारी'],
    patterns: [
      /(?:कितने|कितनी|कितना|kitne|kitni|kitna|how\s+many|count|संख्या|total)\s+(?:active\s+)?(?:employee|employees|कर्मचारी|staff)/iu,
      /(?:active\s+)?(?:employee|employees|कर्मचारी).{0,25}(?:कितने|कितनी|कितना|kitne|kitni|kitna|count|संख्या)/iu,
      /(?:location|लोकेशन|organization|org|कंपनी).{0,50}(?:कितने|कितनी|kitne|kitni|how\s+many|count).{0,25}(?:employee|employees|कर्मचारी)/iu,
      /(?:में|me)\s+(?:कितने|कितनी|kitne|kitni)\s+(?:active\s+)?(?:employee|employees|कर्मचारी)/iu,
      /(?:organization|org|कंपनी).{0,60}(?:active\s+)?(?:employee|employees|कर्मचारी).{0,20}(?:कितने|कितनी|kitne|kitni|count)/iu,
    ],
  },
  {
    intent: 'salary_slip',
    confidence: 0.96,
    entity: 'employee',
    outputMode: null,
    patterns: [
      /(?:salary\s*slip|payslip|pay\s*slip|सैलरी\s*स्लिप|celery\s*slip|salary\s*sleep)/iu,
      /(?:location|लोकेशन|organization|org).{0,60}(?:salary\s*slip|payslip|सैलरी\s*स्लिप)/iu,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december|month).{0,40}(?:salary\s*slip|payslip)/iu,
    ],
  },
  {
    intent: 'wage_register',
    confidence: 0.96,
    entity: 'location',
    outputMode: null,
    patterns: [
      /(?:wage\s*register|वेज\s*रजिस्टर|form\s*xvii|wage\s*sheet|bedsheet|bed\s*sheet|wedge\s*sheet)/iu,
      /(?:सभी|सारी|all).{0,30}(?:location|लोकेशन).{0,40}(?:wage\s*register|वेज\s*रजिस्टर|wage\s*sheet)/iu,
      /(?:location|लोकेशन).{0,50}(?:january|february|march|april|may|june|july|august|september|october|november|december|month).{0,40}(?:wage\s*register|wage\s*sheet|bedsheet|wedge\s*sheet)/iu,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december|month).{0,50}(?:location|लोकेशन).{0,40}(?:wage\s*register|wage\s*sheet|bedsheet|wedge\s*sheet)/iu,
    ],
  },
  {
    intent: 'attendance_register',
    confidence: 0.96,
    entity: 'location',
    outputMode: null,
    patterns: [
      /(?:attendance\s*register|अटेंडेंस\s*रजिस्टर|attendance\s*sheet)/iu,
      /(?:सभी|सारी|all).{0,30}(?:location|लोकेशन).{0,40}(?:attendance|अटेंडेंस).{0,20}(?:register|रजिस्टर|pdf|excel|दो|दे)?/iu,
      /(?:organization|org|कंपनी).{0,50}(?:सभी|सारी|all).{0,20}(?:location|लोकेशन).{0,30}(?:attendance|अटेंडेंस)/iu,
      /(?:location|लोकेशन).{0,50}(?:january|february|march|april|may|june|july|august|september|october|november|december|month).{0,40}(?:attendance\s*register|attendance\s*sheet)/iu,
    ],
  },
  {
    intent: 'bank_invoice',
    confidence: 0.96,
    entity: 'location',
    outputMode: null,
    patterns: [
      /(?:bank\s*invoice|bank\s*letter|बैंक\s*इनवॉइस|neft\s*letter|bank\s*payment)/iu,
      /(?:सभी|सारी|all).{0,30}(?:location|लोकेशन).{0,40}(?:bank\s*invoice|बैंक\s*इनवॉइस)/iu,
      /(?:location|लोकेशन).{0,50}(?:january|february|march|april|may|june|july|august|september|october|november|december|month).{0,40}(?:bank\s*invoice|bank\s*letter|neft)/iu,
    ],
  },
  {
    intent: 'payroll_run',
    confidence: 0.94,
    entity: 'location',
    outputMode: null,
    patterns: [/(?:payroll\s*run|payroll\s*letter|पेरोल\s*रन)/iu],
  },
  {
    intent: 'client_invoice',
    confidence: 0.96,
    entity: 'location',
    outputMode: null,
    forbid: ['bank invoice', 'bank letter', 'neft', 'बैंक', 'payroll', 'wage', 'salary slip'],
    patterns: [
      /(?:client\s*invoice|client\s*bill|location\s*invoice|बिल\s*दो)/iu,
      /(?:invoice|invoicee|बिल).{0,25}(?:दो|दे|do|list|बताओ|generate|download|बनाओ|निकालो|चाहिए)/iu,
      /(?:location|लोकेशन).{0,60}(?:invoice|invoicee|बिल)/iu,
      /(?:invoice|invoicee|बिल).{0,40}(?:location|लोकेशन|november|december|january|february|march|april|may|june|july|august|september|october|month)/iu,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december|month|इस\s*महीने|this\s*month).{0,40}(?:invoice|invoicee|बिल)/iu,
    ],
  },
  {
    intent: 'payroll',
    confidence: 0.95,
    entity: 'location',
    outputMode: null,
    // Require a clear ask — bare "petrol bhi" inside location-details must NOT win
    patterns: [
      /(?:payroll|पेरोल|pay\s*roll|petrol|patrol)\s*(?:दो|दे|do|बताओ|दिखाओ|report|निकालो|generate|चाहिए|chahie|download)/iu,
      /(?:ka|ki|ke|का|की)\s+(?:payroll|पेरोल|petrol|patrol)\s*(?:दो|दे|do|बताओ|निकालो|चाहिए|chahie)?/iu,
      /(?:इस\s*महीने|this\s*month|current\s*month).{0,25}(?:payroll|पेरोल|petrol|patrol)/iu,
      /(?:organization|org|कंपनी).{0,40}(?:के\s*अंदर|ke\s*andar).{0,40}(?:payroll|पेरोल|petrol|patrol)/iu,
      /(?:location|लोकेशन).{0,40}(?:ka|ki|ke|का|की)?\s*(?:payroll|पेरोल|petrol|patrol)\s*(?:दो|दे|do|बताओ|निकालो|चाहिए|chahie)/iu,
      /(?:सभी|सारी|all).{0,25}(?:location|लोकेशन).{0,30}(?:payroll|पेरोल|petrol|patrol)/iu,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december|आक्ट[ोो]बर|नव[म्म]्बर|सितंबर|इस\s*महीने|current\s*month).{0,40}(?:payroll|पेरोल|petrol|patrol)\s*(?:दो|दे|do|बताओ|निकालो|चाहिए|chahie)?/iu,
    ],
  },
  {
    intent: 'salary_amount',
    confidence: 0.95,
    entity: 'employee',
    outputMode: 'value',
    patterns: [
      /(?:salary|वेतन|net\s*pay|gross\s*pay|payable).{0,20}(?:कितना|kitna|how\s+much|amount)/iu,
      /(?:कितना|kitna|how\s+much).{0,20}(?:salary|वेतन|pay)/iu,
      new RegExp(`${NAME}\\s+(?:का|की|के)\\s+(?:salary|वेतन|net\\s*pay|सैलरी)\\s*(?:कितना|kitna|how\\s+much|है|hai)?\\s*${ASK}`, 'iu'),
    ],
  },
  {
    intent: 'employee_attendance',
    confidence: 0.95,
    entity: 'employee',
    outputMode: null,
    requireRealName: true,
    // Named person attendance — before site get_attendance; never steal "X location … attendance"
    forbid: ['location', 'locations', 'लोकेशन', 'ke andar', 'के अंदर', 'site', 'andar'],
    patterns: [
      new RegExp(`${NAME}\\s+(?:की|का|के|ki|ka|'s)\\s+(?:attendance|अटेंडेंस|हाजरी)\\s*${ASK}`, 'iu'),
      new RegExp(`(?:attendance|अटेंडेंस)\\s+(?:of|for)\\s+${NAME}`, 'iu'),
    ],
  },
  {
    intent: 'get_attendance',
    confidence: 0.94,
    entity: 'location',
    outputMode: null,
    forbid: ['register', 'sheet', 'mark', 'maar', 'present', 'absent', 'लगा'],
    patterns: [
      /(?:आज|today|aaj).{0,20}(?:attendance|अटेंडेंस|हाजरी)/iu,
      /(?:attendance|अटेंडेंस)\s*(?:summary|status|details?|detail|की\s*जानकारी|report|check)/iu,
      /(?:show|give|tell).{0,20}(?:attendance|अटेंडेंस)/iu,
      /(?:location|लोकेशन).{0,50}(?:attendance|अटेंडेंस|हाजरी)\s*(?:details?|detail|summary|जानकारी|दो|दे|बताओ|दिखाओ)?/iu,
      /(?:ke\s*andar|के\s*अंदर).{0,40}(?:attendance|अटेंडेंस|हाजरी)\s*(?:details?|detail|summary|जानकारी|दो|दे)?/iu,
      /(?:organization|org|कंपनी).{0,50}(?:attendance|अटेंडेंस)\s*(?:दो|दे|बताओ|summary|pdf|excel)?/iu,
      /(?:सभी|सारी|all).{0,25}(?:location|लोकेशन).{0,30}(?:attendance|अटेंडेंस)/iu,
    ],
  },
  {
    intent: 'get_org_field',
    confidence: 0.95,
    entity: 'organization',
    outputMode: 'value',
    patterns: [
      /(?:organization|organisation|org|कंपनी|संगठन)\s*(?:की|का|के|ki|ka)?\s*(?:email|mail|ईमेल|phone|mobile|फोन|मोबाइल|address|पता|name|नाम|website)\s*/iu,
      /(?:organization|organisation|org|कंपनी|संगठन)\s+email/iu,
    ],
  },
  {
    intent: 'get_org_full',
    confidence: 0.94,
    entity: 'organization',
    outputMode: 'full',
    forbid: ['kitne', 'kitni', 'kitna', 'कितने', 'कितनी', 'कितना', 'location', 'locations', 'लोकेशन', 'employee', 'payroll'],
    patterns: [
      /(?:organization|organisation|org|कंपनी|संगठन)\s*(?:की|का)?\s*(?:पूरी|सारी|full|complete)?\s*(?:details?|जानकारी|information|info)/iu,
    ],
  },
  {
    intent: 'get_location_full',
    confidence: 0.94,
    entity: 'location',
    outputMode: 'full',
    // Do NOT forbid payroll/petrol — "details … petrol bhi" is still location details
    // (document override + payroll ask-patterns handle real payroll asks)
    forbid: ['employee', 'employees', 'कर्मचारी', 'salary', 'attendance', 'list', 'kitne', 'kitni', 'kitna', 'कितने', 'कितनी', 'कितना'],
    patterns: [
      /(?:location|लोकेशन|site)\s*(?:की|का|के|ki|ka|ke)?\s*(?:पूरी|सारी|full|complete)?\s*(?:details?|जानकारी|information|info)/iu,
      new RegExp(`${NAME}\\s+(?:location|लोकेशन|site)\\s*(?:की|का|के|ki|ka|ke)?\\s*(?:पूरी|सारी|full|complete)\\s*(?:details?|जानकारी|information)?\\s*${ASK}`, 'iu'),
      new RegExp(`${NAME}\\s+(?:location|लोकेशन|site)\\s*(?:की|का|के|ki|ka|ke)\\s*(?:details?|जानकारी|information)\\s*${ASK}`, 'iu'),
    ],
  },
  {
    intent: 'get_location_field',
    confidence: 0.92,
    entity: 'location',
    outputMode: 'value',
    patterns: [
      /(?:location|लोकेशन|site)\s*(?:की|का|के)?\s*(?:address|पता|op\s*number|work\s*name|name|नाम|designation|पद)/iu,
    ],
  },
  {
    intent: 'get_employee_field',
    confidence: 0.94,
    entity: 'employee',
    outputMode: 'value',
    requireRealName: true,
    patterns: [
      new RegExp(`${NAME}\\s+(?:का|की|के|ka|ki|ke|'s)\\s+${FIELD_GROUP}\\s*${ASK}`, 'iu'),
      new RegExp(`${FIELD_GROUP}\\s+(?:of|for)\\s+${NAME}`, 'iu'),
      new RegExp(`(?:give|tell|show|get|send)?\\s*(?:me\\s+)?${NAME}(?:'s)?\\s+${FIELD_GROUP}`, 'iu'),
    ],
  },
  {
    intent: 'get_employee_full',
    confidence: 0.93,
    entity: 'employee',
    outputMode: 'full',
    requireRealName: true,
    forbid: [
      'ke andar', 'के अंदर', 'organization', 'payroll', 'पेरोल', 'salary slip',
      'jitne bhi', 'jitni bhi', 'all location', 'location', 'लोकेशन',
      'kitne', 'kitni', 'list', 'लिस्ट', 'naam', 'नाम', 'names',
    ],
    patterns: [
      new RegExp(`${NAME}\\s+(?:employee|कर्मचारी)\\s*(?:की|का|के)?\\s*(?:पूरी|सारी|full|complete)?\\s*(?:details?|जानकारी|information)?\\s*${ASK}`, 'iu'),
      /(?:employee|कर्मचारी)\s+(?:की|का)?\s*(?:पूरी|full)?\s*(?:details?|जानकारी)/iu,
    ],
  },
  {
    intent: 'lookup_entity',
    confidence: 0.91,
    entity: null,
    outputMode: 'full',
    requireRealName: true,
    patterns: [
      new RegExp(`${NAME}\\s+(?:की|का|के|ki|ka|ke|'s)?\\s*(?:पूरी|सारी|full|complete)?\\s*(?:details?|जानकारी|information|info|data|profile)\\s*${ASK}`, 'iu'),
      new RegExp(`(?:details?|जानकारी|information)\\s+(?:of|for|about)?\\s*${NAME}`, 'iu'),
      new RegExp(`${NAME}\\s*(?:बताओ|दिखाओ|दो|दे|बताना)\\s*$`, 'iu'),
      new RegExp(`^(?:मुझे\\s+|please\\s+|कृपया\\s+)?${NAME}\\s*$`, 'iu'),
    ],
  },
];

function matchQuestionPatterns(text) {
  const value = String(text || '').trim();
  if (!value) return null;
  const lower = value.toLowerCase();

  for (const rule of QUESTION_PATTERNS) {
    if (Array.isArray(rule.forbid) && rule.forbid.some((word) => lower.includes(String(word).toLowerCase()))) {
      continue;
    }
    for (const pattern of rule.patterns) {
      const match = value.match(pattern);
      if (!match) continue;
      const hasCapture = match[1] !== undefined;
      const captured = String(match[1] || '').trim();
      if (rule.requireRealName && hasCapture) {
        if (!captured || isReservedName(captured)) continue;
      } else if (hasCapture && captured && isReservedName(captured)) {
        return {
          intent: rule.intent,
          confidence: rule.confidence,
          outputMode: rule.outputMode,
          entityHint: rule.entity,
          capturedName: null,
        };
      }
      return {
        intent: rule.intent,
        confidence: rule.confidence,
        outputMode: rule.outputMode,
        entityHint: rule.entity,
        capturedName: hasCapture && captured && !isReservedName(captured) ? captured : null,
      };
    }
  }
  return null;
}

function extractPossessiveNames(text) {
  const value = String(text || '');
  const names = [];
  const patterns = [
    new RegExp(`${NAME}\\s+(?:का|की|के|ka|ki|ke|'s)\\s+`, 'giu'),
    new RegExp(`(?:of|for)\\s+${NAME}(?:\\s|$|,|\\.)`, 'giu'),
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(value);
    while (match) {
      const name = String(match[1] || '').trim();
      if (name.length > 1 && !isReservedName(name)) names.push(name);
      match = pattern.exec(value);
    }
  }
  return [...new Set(names)];
}

module.exports = {
  QUESTION_PATTERNS,
  matchQuestionPatterns,
  extractPossessiveNames,
  isReservedName,
};
