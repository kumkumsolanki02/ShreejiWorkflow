/** Common speech-to-text mishearings → canonical tokens (Hinglish + Hindi + English).
 * Rule: never use bare stems that are prefixes of the correct word
 * (e.g. "invoic" → invoicee, "activ" → activee, "attendanc" → attendancee).
 */

const STT_REPLACEMENTS = [
  // ── Documents / payroll family ───────────────────────────────────────────
  [/अटेंडेंस|अटेन्डन्स|अटेण्डेन्स|अटेन्डेंस|अटेन्डेन्स|attendence|atendance|attendanse|atendence|attendens|atendens|attendnce|attendent\s*ce/gi, 'attendance'],
  [/\battendanc(?!e)\b|\batendanc(?!e)\b|\battandance\b|\battandence\b/gi, 'attendance'],
  [/पेरोल|पे\s*रोल|पे-रोल|पेयरोल|पे\s*रोलल|pair\s*roll|pay\s*roll|pay\s*role|payrole|\bpayrol(?!l)\b|payrolll|\bpetrol\b|\bpatrol\b|\bpetroleum\b|\bpay\s*royal\b|\bpay\s*rol\b|\bpay\s*row\b|\bpay\s*rule\b|\bpairo\b|\bpayro\b|\bpay\s*rolll\b|\bpayrole\b/gi, 'payroll'],
  [/इनवॉइस|इनवोइस|इन्वॉइस|इनवाइस|इनवॉयस|इनवोइसस|इनवॉयसेस/gi, 'invoice'],
  [/\binvoices?\b|\binvoce\b|\binvocie\b|\binvoise\b|\benvoice\b|\binvoicee\b|\binvoic(?!e)\b|\binvois\b|\binvoys\b/gi, 'invoice'],
  [/सैलरी\s*स्लिप|सैलरीस्लिप|सॅलरी\s*स्लिप|सैलरी\s*स्लीप|सैलरी\s*स्लिपस|salary\s*slips?|salaryslip|salary\s*sleep|celery\s*slip|celery\s*sleep|salry\s*slip|sallery\s*slip|salary\s*slim|salery\s*slip|salary\s*chip|salary\s*slap|celery\s*ship/gi, 'salary slip'],
  [/वेज\s*रजिस्टर|वेजरेजिस्टर|वेज\s*रजिस्टार|wage\s*registers?|wageregister/gi, 'wage register'],
  [/\b(?:bed\s*sheets?|bedsheets?|wedge\s*sheets?|page\s*sheets?|beige\s*sheets?|veg\s*sheets?|age\s*sheets?|wage\s*shit|ways\s*sheet|vague\s*sheet|wide\s*sheet|white\s*sheet|wait\s*sheet|gate\s*sheet|badge\s*sheet|wed\s*sheet)\b/gi, 'wage sheet'],
  [/\bwedge\s+register\b|\bveg\s+register\b|\bage\s+register\b|\bwage\s+resister\b|\bwage\s+registor\b|\bwage\s+registar\b|\bform\s*(?:17|xvii|seventeen)\b/gi, 'wage register'],
  [/बैंक\s*इनवॉइस|बैंक\s*इनवोइस|बैंक\s*लेटर|bank\s*invoices?|bank\s*letter|bankletter|bank\s*later|bang\s*invoice|ban\s*invoice|bank\s*leter|bank\s*lettar|bank\s*payment\s*letter|bank\s*latter/gi, 'bank invoice'],
  [/\bneft\s*(?:letter|leter|later|lettar)?\b|\bn\s*e\s*f\s*t\b|\bneftt\b/gi, 'neft letter'],
  [/\battendance\s*(?:resister|registor|registerr|registar|sheet|shit|shhet)\b/gi, 'attendance register'],
  [/\bclient\s*(?:invoce|invocie|bill|invoice)\b|\bbill\s*(?:do|de|banao|nikalo|chahie|चाहिए)\b/gi, 'client invoice'],
  [/\bpay\s*slip\b|\bpayslips?\b|\bpay\s*sleep\b|\bpay\s*slim\b/gi, 'salary slip'],

  // ── Formats / download verbs ─────────────────────────────────────────────
  [/\bexcel\b|\bxlsx?\b|\bspread\s*sheet\b|\bsheet\s*format\b|\bexcell\b|\bxl\b/gi, 'excel'],
  [/\bpdf\b|\bp\s*d\s*f\b|\bpidf\b|\bpee\s*df\b|\bpdee\s*f\b/gi, 'pdf'],
  [/\bdownload\b|\bdown\s*load\b|\bdawnload\b|\bdaunload\b|\bdounload\b|डाउनलोड|डाऊनलोड/gi, 'download'],
  [/\bgenerate\b|\bgenrate\b|\bgenarate\b|\bgenerat\b|जनरेट|जेनरेट/gi, 'generate'],
  [/\bnikalo\b|\bnikal\s*do\b|\bnikal\s*de\b|\bnikaalo\b|निकालो|निकाल\s*दो|निकाल\s*दे/gi, 'निकालो'],
  [/\bbanao\b|\bbana\s*do\b|\bbana\s*de\b|\bbanaao\b|बनाओ|बना\s*दो|बना\s*दे/gi, 'बनाओ'],
  [/\bsend\s*(?:karo|kar\s*do|do)?\b|\bbhejo\b|\bbhej\s*do\b|भेजो|भेज\s*दो/gi, 'भेजो'],

  // ── Entity type words ────────────────────────────────────────────────────
  [/लोकेशन|लोकेषन|लोकेसन|लोकेशण|लोकेषन|लोकेशन्स|locaton|lokation|loaction|locaiton|locatiom|lokashon|locationn|locatoin|loctation|loktion|locashun|lokeshon/gi, 'location'],
  [/ऑर्गनाइजेशन|ओर्गनाइजेशन|आर्गेनाइजेशन|organisation|orgnization|organiztion|orginization|organisaion|orgnisaton|organizaton|orgnisation|orgnaisaton/gi, 'organization'],
  [/\borgs?\b/gi, 'org'],
  [/एम्प्लॉई|एम्प्लोयी|एम्प्लोई|एम्प्लाई|एम्प्लोयीज़|emplyee|employess|employes|empolyee|\bemploye(?!e)s?\b|\bemploy\b|\bemploys\b|\bemloyee\b|\bemplyees\b|\bemplye\b|\bemploees\b|\bemplopyee\b/gi, 'employee'],
  [/कर्मचारियों|कर्मचारीयों/gi, 'employees'],
  [/कर्मचारी/gi, 'employee'],
  [/\bstaffs?\b|\bworkers?\b|\blabou?rs?\b/gi, 'employee'],

  // ── Contact / fields ─────────────────────────────────────────────────────
  [/मोबाइल|मोबाईल|मोबइल|मोबायल|mobail|mobaile|moble|mibile|moblie|mobiile|mobille/gi, 'mobile'],
  [/\bphone\s*num(?:ber|br)?\b|\bph\s*no\b|\bphono\b|\bfone\b|\bphoen\b/gi, 'phone'],
  [/adress|addres|addrees|addreess|एड्रेस|एड्रस|एड्रेस्स|adres|addrss|addreess/gi, 'address'],
  [/ईमेल|इमेल|emeil|emial|i\s*mail|e\-?mail|imail/gi, 'email'],
  [/\bifsc\s*code\b|\bifsc\b|\bifc\s*code\b|\bifc\b|\bifsc\s*kod\b/gi, 'ifsc'],
  [/\baadhar\b|\badhar\b|\badhaar\b|आधार|आधार\s*नंबर/gi, 'aadhaar'],
  [/\buan\s*(?:number|no|num)?\b/gi, 'uan'],
  [/\besic\b|\be\s*s\s*i\s*c\b|\besic\s*number\b/gi, 'esic'],
  [/\bdesignation\b|\bdesig\b|\bdesiganation\b|\bdesignasion\b|पद|पोस्ट/gi, 'designation'],
  [/\bbank\s*(?:account|ac|a\/c|acc)\s*(?:number|no|num)?\b|\baccount\s*(?:number|no)\b|\bac\s*number\b/gi, 'bank number'],
  [/\bwhatsapp\b|\bwhats\s*app\b|\bwatsapp\b|\bwhatspp\b/gi, 'whatsapp'],
  [/\bjoining\s*date\b|\bdoj\b|जॉइनिंग/gi, 'joining'],
  [/\bdate\s*of\s*birth\b|\bdob\b|जन्म\s*तारीख/gi, 'dob'],

  // ── Attendance status / verbs ────────────────────────────────────────────
  [/अबसेंट|एबसेंट|एब्सेंट|absant|absemt|absenet|abscent|abcent|upsant|abasant|absend|absennt/gi, 'absent'],
  [/प्रेजेंट|प्रेसेन्ट|प्रेजेन्ट|presant|presemt|presnet|prezent|prasant|prasent|presnt|prezentt/gi, 'present'],
  [/हाजरी|हाजिरी|हाज़री|hajri|haazri|hazri|hajiri/gi, 'attendance'],
  [/\bhalf\s*day\b|\bhalfday\b|\bhalf\s*dy\b|\bhaf\s*day\b|आधा\s*दिन|हाफ\s*डे/gi, 'half_day'],
  [/\bleave\b|छुट्टी|छुटि|chutti|chhutti|leavee/gi, 'leave'],
  [/\bde\s*activ(?:e|ated|ee)?\b|\bdeactivee?\b|\bdeactivated\b|\bdisabled\b|डिएक्टिव|डी\s*एक्टिव/gi, 'inactive'],
  [/\bin\s*active\b|\binactivee?\b|इनएक्टिव|इन\s*एक्टिव/gi, 'inactive'],
  [/\bactivee\b|\bactve\b|\bactice\b|\bactuve\b|\bactiv(?!e)\b/gi, 'active'],
  [/एक्टिव्?|ऐक्टिव/gi, 'active'],
  [/\bdashboard\b|\bdash\s*board\b|\bdashbord\b|डैशबोर्ड|डेशबोर्ड|डैश\s*बोर्ड/gi, 'dashboard'],

  // mark / maar / market / marker / laga
  [/\bmarke[rt]\s+(?:do|de|karo|the|kar\s*do)\b/gi, 'mark kar do'],
  [/\bmarke[rt]\b/gi, 'mark'],
  [/\bmaar\b/gi, 'mark'],
  [/\bmar\s+kar\s+do\b|\bmark\s+karo\b|\bmark\s+kar\s+do\b|\bmark\s+kar\s+de\b/gi, 'mark kar do'],
  [/\blaga\s*(?:do|de|dao)\b/gi, 'लगा दो'],
  [/लगा\s*दो|लगा\s*दे|लगादो|laga\s*do|laga\s*de|lagado|lagaa\s*do/gi, 'लगा दो'],
  [/\bdal\s*(?:do|de)\b|\bdaal\s*(?:do|de)\b|डाल\s*दो|डाल\s*दे/gi, 'डाल दो'],
  [/\bbhar\s*(?:do|de)\b|भर\s*दो|भर\s*दे/gi, 'भर दो'],
  [/\bupdate\s*(?:karo|kar\s*do)?\b|\bchange\s*(?:karo|kar\s*do)?\b|बदल\s*दो|अपडेट/gi, 'update'],

  // ── Generic ask / list words ─────────────────────────────────────────────
  [/काउंट|काउन्ट|कान्त\b|\bcont\b|\bcoun\b|\bcaunt\b|\bkaunt\b/gi, 'count'],
  [/डिटेल्स|डिटेल|डिटेल्ज़|detials|detales|detals|detial|detaile|detailes|detalis|detaails/gi, 'details'],
  [/जान्कारी|जान्करि|jankari|jaankari|jankaari|jaankarii/gi, 'जानकारी'],
  [/लिस्ट|लिस्ट्|\blst\b|\blits\b|\blisst\b|\blistt\b/gi, 'list'],
  [/बताओ|बता\s*दो|बता\s*दे|बतादो|batao|bata\s*do|batado|btao|btado|bataao|battao/gi, 'बताओ'],
  [/दिखाओ|दिखा\s*दो|दिखादो|dikhao|dikha\s*do|dikhado|dikhhao/gi, 'दिखाओ'],
  [/मुझे|मुजे|मुज्हे|मुजेह|mujhe|muze|muje|mjhe|mujhse|mujhee/gi, 'मुझे'],
  [/\bchahi[ey]e\b|\bchahie\b|\bchaie\b|\bchahiye\b|चाहिए|चाहिये|चाहीए/gi, 'चाहिए'],
  [/\bdo\s+do\b/gi, 'दो'],
  [/\bplease\b|\bpls\b|\bplz\b|\bplis\b|\bplese\b|कृपया/gi, 'please'],
  [/\bnaam\b|\bnam\b|नाम/gi, 'naam'],
  [/\bsummary\b|\bsummery\b|\bsumary\b|सारांश/gi, 'summary'],
  [/\breport\b|\breprt\b|रिपोर्ट/gi, 'report'],

  // ── Quantifiers / “all” ──────────────────────────────────────────────────
  [/\bun\s+sab(?:ke|ka|ki|ko)?\b|\bunke\s+sab\b|\bunki\s+sab\b|\bun\s+sabhi\b/gi, 'all'],
  [/\bsabke\b|\bsabhi\b|\bsaare\b|\bsare\b|\bsab\s+hi\b|\bsabhee\b/gi, 'all'],
  [/\bjitn[ie]\s+bhi\b|\bjitna\s+bhi\b|\bjitne\s+bhee\b/gi, 'all'],
  [/\bkitni\b|\bkitna\b|\bkitno\b|\bkitnii\b/gi, 'kitne'],
  [/कितनी|कितना|कितनो|कितनें/gi, 'कितने'],
  [/\bke\s+under\b|\bke\s+andar\b|\bke\s+andhar\b|\bke\s+ander\b|के\s*अंदर|के\s*अन्दर/gi, 'ke andar'],
  [/\binside\b|\bwithin\b/gi, 'ke andar'],
  [/\bpoori\b|\bpoora\b|\bpuri\b|पूरी|पूरा/gi, 'पूरी'],

  // ── Month / date words ───────────────────────────────────────────────────
  [/\bmanth\b|\bmont\b|\bmonht\b|\bmounth\b|\bmunth\b|\bmahina\b|\bmahine\b|\bmaah\b|\bmaan\b|\bmonnth\b/gi, 'month'],
  [/महीने|महीना|माह/gi, 'month'],
  [/नवंबर|नवम्बर|नवमबर|novemeber|novmber|novembr|novomber|novemebr|novembar|novemeber/gi, 'november'],
  [/दिसंबर|दिसम्बर|दिसमबर|decemeber|decmber|decembr|deceber|desember|decembar/gi, 'december'],
  [/जनवरी|जनवरि|janurary|janvary|janwary|januray|janary|janurari/gi, 'january'],
  [/फरवरी|फ़रवरी|फरवरि|februry|febuary|febraury|februay|februvary/gi, 'february'],
  [/मार्च|मारच|marchh/gi, 'march'],
  [/अप्रैल|अप्रेल|aprail|aprl|avril/gi, 'april'],
  [/मई|मइ/gi, 'may'],
  [/जून|जुन/gi, 'june'],
  [/जुलाई|जुलई|julyy|jully/gi, 'july'],
  [/अगस्त|अगस्थ|agust|augast/gi, 'august'],
  [/सितंबर|सितम्बर|सितमबर|septmber|setember|septembar|septembar|septeber/gi, 'september'],
  [/अक्टूबर|अक्टुबर|अक्टोबर|octobar|octomber|oktober|octuber|octber/gi, 'october'],
  [/\btody\b|\btodays\b|\btodai\b|\btodaa\b/gi, 'today'],
  [/\byestarday\b|\byesterdy\b|\byesturday\b|\byesterdai\b/gi, 'yesterday'],
  [/\bthis\s*month\b|\bcurrent\s*month\b|\bis\s*month\b|\bis\s*mahine\b|\bis\s*mahina\b|इस\s*महीने|इस\s*माह/gi, 'this month'],
  [/\blast\s*month\b|\bprevious\s*month\b|पिछले\s*महीने|pichle\s*mahine|pichhla\s*mahina/gi, 'last month'],

  // ── Confirm / cancel (spoken) ────────────────────────────────────────────
  [/\bcancel\s*karo\b|\bcancel\s*kar\s*do\b|\bcancel\s*it\b|\bcancell\b|रद्द\s*करो|कैंसल|कैन्सल|कैंसिल/gi, 'cancel'],
  [/\bconfirm\s*karo\b|\bconfirm\s*kar\s*do\b|\bconfirm\s*it\b|\bconfrm\b|कन्फर्म|कंफर्म/gi, 'confirm'],
  [/\byes\s*please\b|\byes\s*ji\b|\bok\s*ji\b|\bokey\b|\bok\s*karo\b/gi, 'yes'],
  [/\bnahi\s*karo\b|\bmat\s*karo\b|\bmat\s*kar\s*do\b|नहीं\s*करो|मत\s*करो/gi, 'cancel'],

  // ── Place / org STT near-misses (seed demo sites) — keep narrow ───────────
  [/\bshower\s+gate\b|\bshaower\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:savar|sawar|saawar|sarver)\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:silver|savar|sawar)\s+(?:oxide|ok|ukai|hoke|oak)\s+care\b/gi, 'silver oak care'],
  [/\bsilver\s+oxide\b/gi, 'silver oak'],
  [/\bsilver\s+ok\b/gi, 'silver oak'],
  [/\bmadangan\b|\bmadan\s*ganj\b|\bmada\s*ganj\b|\bmadangaj\b|\bmadangung\b|\bmadangunge\b/gi, 'madanganj'],
  [/\bwarm\s+earth\b|\bworm\s+earth\b|\bwarm\s+earh\b|\bwarm\s+erth\b/gi, 'warm earth'],
  [/\bgolden\s+track\b|\bgolden\s+trak\b|\bgoldan\s+track\b|\bgolden\s+tract\b|\bgolden\s+truck\b/gi, 'golden track'],
  [/\bgreen\s+valley\b|\bgrean\s+valley\b|\bgreen\s+vali\b|\bgreen\s+vally\b/gi, 'green valley'],
  [/\braipur\s+camp\b|\braipur\s+kamp\b|\braipur\s+cam\b/gi, 'raipur camp'],
  [/\bloki\b|\blokey\b|\bloky\b|\blokhi\b/gi, 'loki'],
  [/\btv\s*a\b|\bt\.?\s*v\.?\s*a\b/gi, 'tva'],
  [/\btata\s*d\s*b\b|\btata\s*dee\s*bee\b|\btata\s*dib\b/gi, 'tata db'],
  [/\bfresh\s+plot\b|\bfresh\s+plots?\b/gi, 'fresh plot'],
  [/\bpisangan\b|\bpisagan\b|\bpisangaan\b/gi, 'pisangan'],
  // STT often hears Tony as turning / turn my / toni
  [/\bturning\b|\bturn\s*my\b|\bturn\s*me\b|\btonny\b|\btoni\b|\bthony\b/gi, 'tony'],
];

function applySttFixes(text) {
  let value = String(text || '');
  for (const [pattern, replacement] of STT_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

module.exports = { applySttFixes, STT_REPLACEMENTS };
