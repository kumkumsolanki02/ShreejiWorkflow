/** Common speech-to-text mishearings → canonical tokens (Hinglish + Hindi + English). */

const STT_REPLACEMENTS = [
  // ── Documents / payroll family ───────────────────────────────────────────
  [/अटेंडेंस|अटेन्डन्स|अटेण्डेन्स|अटेन्डेंस|अटेन्डेन्स|attendence|atendance|attendanse|atendence|attendens|atendens|attendnce|attendent\s*ce/gi, 'attendance'],
  [/\battendanc(?!e)\b|\batendanc(?!e)\b/gi, 'attendance'],
  // payroll — petrol/patrol/pay role are frequent mishearings
  [/पेरोल|पे\s*रोल|पे-रोल|पेयरोल|पे\s*रोलल|pair\s*roll|pay\s*roll|pay\s*role|payrole|\bpayrol(?!l)\b|payrolll|\bpetrol\b|\bpatrol\b|\bpetroleum\b|\bpay\s*royal\b|\bpay\s*rol\b|\bpay\s*row\b|\bpay\s*rule\b|\bpairo\b|\bpayro\b/gi, 'payroll'],
  [/इनवॉइस|इनवोइस|इन्वॉइस|इनवाइस|इनवॉयस|इनवोइसस/gi, 'invoice'],
  // Never use bare "invoic" — it turns "invoice" into "invoicee"
  [/\binvoices?\b|\binvoce\b|\binvocie\b|\binvoise\b|\benvoice\b|\binvoicee\b|\binvoic(?!e)\b/gi, 'invoice'],
  [/सैलरी\s*स्लिप|सैलरीस्लिप|सॅलरी\s*स्लिप|सैलरी\s*स्लीप|सैलरी\s*स्लिपस|salary\s*slips?|salaryslip|salary\s*sleep|celery\s*slip|celery\s*sleep|salry\s*slip|sallery\s*slip|salary\s*slim|celery\s*sleep|salery\s*slip|salary\s*chip/gi, 'salary slip'],
  [/वेज\s*रजिस्टर|वेजरेजिस्टर|वेज\s*रजिस्टार|wage\s*registers?|wageregister/gi, 'wage register'],
  // wage sheet — bedsheet / wedge / page / beige are classic STT fails
  [/\b(?:bed\s*sheets?|bedsheets?|wedge\s*sheets?|page\s*sheets?|beige\s*sheets?|veg\s*sheets?|age\s*sheets?|wage\s*shit|ways\s*sheet|vague\s*sheet|wide\s*sheet|white\s*sheet|wait\s*sheet|gate\s*sheet)\b/gi, 'wage sheet'],
  [/\bwedge\s+register\b|\bveg\s+register\b|\bage\s+register\b|\bwage\s+resister\b|\bwage\s+registor\b|\bwage\s+registar\b|\bform\s*(?:17|xvii|seventeen)\b/gi, 'wage register'],
  [/बैंक\s*इनवॉइस|बैंक\s*इनवोइस|बैंक\s*लेटर|bank\s*invoices?|bank\s*letter|bankletter|bank\s*later|bang\s*invoice|ban\s*invoice|bank\s*leter|bank\s*lettar|bank\s*payment\s*letter/gi, 'bank invoice'],
  [/\bneft\s*(?:letter|leter|later|lettar)?\b|\bn\s*e\s*f\s*t\b/gi, 'neft letter'],
  [/\battendance\s*(?:resister|registor|registerr|registar|sheet|shit)\b/gi, 'attendance register'],
  [/\bclient\s*(?:invoce|invocie|bill|invoice)\b|\bbill\s*(?:do|de|banao|nikalo)\b/gi, 'client invoice'],
  [/\bpay\s*slip\b|\bpayslips?\b|\bpay\s*sleep\b/gi, 'salary slip'],

  // ── Formats / download verbs ─────────────────────────────────────────────
  [/\bexcel\b|\bxlsx?\b|\bspread\s*sheet\b|\bsheet\s*format\b/gi, 'excel'],
  [/\bpdf\b|\bp\s*d\s*f\b|\bpidf\b|\bpee\s*df\b/gi, 'pdf'],
  [/\bdownload\b|\bdown\s*load\b|\bdawnload\b|\bdaunload\b|डाउनलोड/gi, 'download'],
  [/\bgenerate\b|\bgenrate\b|\bgenarate\b|जनरेट/gi, 'generate'],
  [/\bnikalo\b|\bnikal\s*do\b|\bnikal\s*de\b|निकालो|निकाल\s*दो/gi, 'निकालो'],
  [/\bbanao\b|\bbana\s*do\b|\bbana\s*de\b|बनाओ|बना\s*दो/gi, 'बनाओ'],

  // ── Entity type words ────────────────────────────────────────────────────
  [/लोकेशन|लोकेषन|लोकेसन|लोकेशण|लोकेषन|लोकेशन्स|locaton|lokation|loaction|locaiton|locatiom|lokashon|locationn|locatoin|loctation|loktion/gi, 'location'],
  [/ऑर्गनाइजेशन|ओर्गनाइजेशन|आर्गेनाइजेशन|organisation|orgnization|organiztion|orginization|organisaion|orgnisaton|organizaton|orgnisation/gi, 'organization'],
  [/\borg\b/gi, 'org'],
  [/एम्प्लॉई|एम्प्लोयी|एम्प्लोई|एम्प्लाई|एम्प्लोयीज़|emplyee|employess|employes|empolyee|\bemploye(?!e)s?\b|\bemploy\b|\bemploys\b|\bemloyee\b|\bemplyees\b|\bemplye\b|\bemploees\b/gi, 'employee'],
  [/कर्मचारियों|कर्मचारीयों/gi, 'employees'],
  [/कर्मचारी/gi, 'employee'],
  [/\bstaffs?\b|\bworkers?\b/gi, 'employee'],

  // ── Contact / fields ─────────────────────────────────────────────────────
  [/मोबाइल|मोबाईल|मोबइल|मोबायल|mobail|mobaile|moble|mibile|moblie|mobiile/gi, 'mobile'],
  [/\bphone\s*num(?:ber|br)?\b|\bph\s*no\b|\bphono\b|\bfone\b/gi, 'phone'],
  [/adress|addres|addrees|addreess|एड्रेस|एड्रस|एड्रेस्स|adres|addrss/gi, 'address'],
  [/ईमेल|इमेल|emeil|emial|i\s*mail|e\-?mail/gi, 'email'],
  [/\bifsc\s*code\b|\bifsc\b|\bifc\s*code\b|\bifc\b/gi, 'ifsc'],
  [/\baadhar\b|\badhar\b|\badhaar\b|आधार/gi, 'aadhaar'],
  [/\buan\s*(?:number|no)?\b/gi, 'uan'],
  [/\besic\b|\be\s*s\s*i\s*c\b/gi, 'esic'],
  [/\bdesignation\b|\bdesig\b|\bdesiganation\b|पद/gi, 'designation'],
  [/\bbank\s*(?:account|ac|a\/c|acc)\s*(?:number|no|num)?\b|\baccount\s*(?:number|no)\b/gi, 'bank number'],
  [/\bwhatsapp\b|\bwhats\s*app\b|\bwatsapp\b/gi, 'whatsapp'],

  // ── Attendance status / verbs ────────────────────────────────────────────
  [/अबसेंट|एबसेंट|एब्सेंट|absant|absemt|absenet|abscent|abcent|upsant|abasant|absend/gi, 'absent'],
  [/प्रेजेंट|प्रेसेन्ट|प्रेजेन्ट|presant|presemt|presnet|prezent|prasant|prasent|presnt|presant/gi, 'present'],
  [/हाजरी|हाजिरी|हाज़री|hajri|haazri|hazri/gi, 'attendance'],
  [/\bhalf\s*day\b|\bhalfday\b|\bhalf\s*dy\b|आधा\s*दिन|हाफ\s*डे/gi, 'half_day'],
  [/\bleave\b|छुट्टी|छुटि|chutti|chhutti/gi, 'leave'],
  // deactive BEFORE active (avoid partial "activ" eating "active" → "activee")
  [/\bde\s*activ(?:e|ated|ee)?\b|\bdeactivee?\b|\bdeactivated\b|\bdisabled\b|डिएक्टिव|डी\s*एक्टिव/gi, 'inactive'],
  [/\bin\s*active\b|\binactivee?\b|इनएक्टिव|इन\s*एक्टिव/gi, 'inactive'],
  [/\bactivee\b|\bactve\b|\bactice\b|\bactuve\b|\bactiv(?!e)\b/gi, 'active'],
  [/एक्टिव्?|ऐक्टिव/gi, 'active'],
  [/\bdashboard\b|\bdash\s*board\b|डैशबोर्ड|डेशबोर्ड/gi, 'dashboard'],

  // mark / maar / market / marker / laga
  [/\bmarke[rt]\s+(?:do|de|karo|the|kar\s*do)\b/gi, 'mark kar do'],
  [/\bmarke[rt]\b/gi, 'mark'],
  [/\bmaar\b/gi, 'mark'],
  [/\bmar\s+kar\s+do\b|\bmark\s+karo\b|\bmark\s+kar\s+do\b/gi, 'mark kar do'],
  [/\blaga\s*(?:do|de|dao|do)\b/gi, 'लगा दो'],
  [/लगा\s*दो|लगा\s*दे|लगादो|laga\s*do|laga\s*de|lagado|lagaa\s*do/gi, 'लगा दो'],
  [/\bdal\s*(?:do|de)\b|\bdaal\s*(?:do|de)\b|डाल\s*दो/gi, 'डाल दो'],
  [/\bbhar\s*(?:do|de)\b|भर\s*दो/gi, 'भर दो'],

  // ── Generic ask / list words ─────────────────────────────────────────────
  [/काउंट|काउन्ट|कान्त\b|\bcont\b|\bcoun\b|\bcaunt\b/gi, 'count'],
  [/डिटेल्स|डिटेल|डिटेल्ज़|detials|detales|detals|detial|detaile|detailes|detalis/gi, 'details'],
  [/जान्कारी|जान्करि|jankari|jaankari|jankaari/gi, 'जानकारी'],
  [/लिस्ट|लिस्ट्|\blst\b|\blits\b|\blisst\b/gi, 'list'],
  [/बताओ|बता\s*दो|बता\s*दे|बतादो|batao|bata\s*do|batado|btao|btado|bataao/gi, 'बताओ'],
  [/दिखाओ|दिखा\s*दो|दिखादो|dikhao|dikha\s*do|dikhado/gi, 'दिखाओ'],
  [/मुझे|मुजे|मुज्हे|मुजेह|mujhe|muze|muje|mjhe|mujhse/gi, 'मुझे'],
  [/\bchahi[ey]e\b|\bchahie\b|\bchaie\b|चाहिए|चाहिये/gi, 'चाहिए'],
  [/\bdo\s+do\b/gi, 'दो'],
  [/\bplease\b|\bpls\b|\bplz\b|\bplis\b|कृपया/gi, 'please'],

  // ── Quantifiers / “all” ──────────────────────────────────────────────────
  [/\bun\s+sab(?:ke|ka|ki|ko)?\b|\bunke\s+sab\b|\bunki\s+sab\b/gi, 'all'],
  [/\bsabke\b|\bsabhi\b|\bsaare\b|\bsare\b|\bsab\s+hi\b/gi, 'all'],
  [/\bjitn[ie]\s+bhi\b|\bjitna\s+bhi\b/gi, 'all'],
  [/\bkitni\b|\bkitna\b|\bkitno\b/gi, 'kitne'],
  [/कितनी|कितना|कितनो/gi, 'कितने'],
  [/\bke\s+under\b|\bke\s+andar\b|\bke\s+andhar\b|के\s*अंदर|के\s*अन्दर|के\s*अन्दर/gi, 'ke andar'],
  [/\binside\b|\bwithin\b/gi, 'ke andar'],

  // ── Month / date words ───────────────────────────────────────────────────
  [/\bmanth\b|\bmont\b|\bmonht\b|\bmounth\b|\bmunth\b|\bmahina\b|\bmahine\b|\bmaah\b|\bmaan\b/gi, 'month'],
  [/महीने|महीना|माह/gi, 'month'],
  [/नवंबर|नवम्बर|नवमबर|novemeber|novmber|novembr|novomber|novemebr|novemeber/gi, 'november'],
  [/दिसंबर|दिसम्बर|दिसमबर|decemeber|decmber|decembr|deceber|desember/gi, 'december'],
  [/जनवरी|जनवरि|janurary|janvary|janwary|januray|janary/gi, 'january'],
  [/फरवरी|फ़रवरी|फरवरि|februry|febuary|febraury|februay/gi, 'february'],
  [/मार्च|मारच|marchh/gi, 'march'],
  [/अप्रैल|अप्रेल|aprail|aprl|avril/gi, 'april'],
  [/मई|मइ/gi, 'may'],
  [/जून|जुन/gi, 'june'],
  [/जुलाई|जुलई|julyy|jully/gi, 'july'],
  [/अगस्त|अगस्थ|agust/gi, 'august'],
  [/सितंबर|सितम्बर|सितमबर|septmber|setember|septembar|septembar/gi, 'september'],
  [/अक्टूबर|अक्टुबर|अक्टोबर|octobar|octomber|oktober|octuber/gi, 'october'],
  [/\btody\b|\btodays\b|\btodai\b/gi, 'today'],
  [/\byestarday\b|\byesterdy\b|\byesturday\b/gi, 'yesterday'],
  [/\bthis\s*month\b|\bcurrent\s*month\b|\bis\s*month\b|\bis\s*mahine\b|इस\s*महीने|इस\s*माह/gi, 'this month'],
  [/\blast\s*month\b|पिछले\s*महीने|pichle\s*mahine/gi, 'last month'],

  // ── Confirm / cancel (spoken) ────────────────────────────────────────────
  [/\bcancel\s*karo\b|\bcancel\s*kar\s*do\b|\bcancel\s*it\b|रद्द\s*करो|कैंसल|कैन्सल/gi, 'cancel'],
  [/\bconfirm\s*karo\b|\bconfirm\s*kar\s*do\b|\bconfirm\s*it\b|कन्फर्म/gi, 'confirm'],
  [/\byes\s*please\b|\byes\s*ji\b|\bok\s*ji\b/gi, 'yes'],

  // ── Place / org STT near-misses (seed demo sites) — keep narrow ───────────
  [/\bshower\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:savar|sawar|saawar)\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:silver|savar|sawar)\s+(?:oxide|ok|ukai|hoke|oak)\s+care\b/gi, 'silver oak care'],
  [/\bsilver\s+oxide\b/gi, 'silver oak'],
  [/\bsilver\s+ok\b/gi, 'silver oak'],
  [/\bmadangan\b|\bmadan\s*ganj\b|\bmada\s*ganj\b|\bmadangaj\b|\bmadangung\b/gi, 'madanganj'],
  [/\bwarm\s+earth\b|\bworm\s+earth\b|\bwarm\s+earh\b/gi, 'warm earth'],
  [/\bgolden\s+track\b|\bgolden\s+trak\b|\bgoldan\s+track\b|\bgolden\s+tract\b/gi, 'golden track'],
  [/\bgreen\s+valley\b|\bgrean\s+valley\b|\bgreen\s+vali\b/gi, 'green valley'],
  [/\braipur\s+camp\b|\braipur\s+kamp\b/gi, 'raipur camp'],
  [/\bloki\b|\blokey\b|\bloky\b/gi, 'loki'],
  [/\btv\s*a\b|\bt\.?\s*v\.?\s*a\b/gi, 'tva'],
  [/\btata\s*d\s*b\b|\btata\s*dee\s*bee\b/gi, 'tata db'],
];

function applySttFixes(text) {
  let value = String(text || '');
  for (const [pattern, replacement] of STT_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

module.exports = { applySttFixes, STT_REPLACEMENTS };
