/** Common speech-to-text mishearings → canonical tokens. */

const STT_REPLACEMENTS = [
  [/अटेंडेंस|अटेन्डन्स|अटेण्डेन्स|attendence|atendance|attendanse|attendence|atendence/gi, 'attendance'],
  [/पेरोल|पे रोल|पे-रोल|pair\s*roll|pay\s*roll|payrole|\bpayrol(?!l)/gi, 'payroll'],
  [/इनवॉइस|इनवोइस|इन्वॉइस|इनवाइस|invoce|invocie|invoices?/gi, 'invoice'],
  [/सैलरी\s*स्लिप|सैलरीस्लिप|सॅलरी\s*स्लिप|salary\s*slips?|salaryslip/gi, 'salary slip'],
  [/वेज\s*रजिस्टर|वेजरेजिस्टर|wage\s*registers?|wageregister/gi, 'wage register'],
  [/बैंक\s*इनवॉइस|बैंक\s*इनवोइस|bank\s*invoices?|bank\s*letter|bankletter/gi, 'bank invoice'],
  [/लोकेशन|लोकेषन|लोकेसन|लोकेशण|locaton|lokation|loaction|locaiton/gi, 'location'],
  [/ऑर्गनाइजेशन|ओर्गनाइजेशन|आर्गेनाइजेशन|organisation|orgnization|organiztion|orginization/gi, 'organization'],
  [/एम्प्लॉई|एम्प्लोयी|एम्प्लोई|एम्प्लाई|emplyee|employess|employes|empolyee|\bemploye(?!e)s?\b|\bemploy\b|\bemploys\b/gi, 'employee'],
  [/कर्मचारियों|कर्मचारीयों/gi, 'employees'],
  [/कर्मचारी/gi, 'employee'],
  [/मोबाइल|मोबाईल|मोबइल|मोबायल|mobail|mobaile/gi, 'mobile'],
  [/अबसेंट|एबसेंट|एब्सेंट|absant|absemt|absenet/gi, 'absent'],
  [/प्रेजेंट|प्रेसेन्ट|प्रेजेन्ट|presant|presemt|presnet/gi, 'present'],
  [/एक्टिव|एक्टिव्|ऐक्टिव|activ|actve/gi, 'active'],
  [/काउंट|काउन्ट|कान्त\b|cont\b/gi, 'count'],
  [/डिटेल्स|डिटेल|डिटेल्ज़|detials|detales|detals/gi, 'details'],
  [/जान्कारी|जान्करि/gi, 'जानकारी'],
  [/लिस्ट|लिस्ट्|lst\b/gi, 'list'],
  [/\bmanth\b|\bmont\b|\bmonht\b/gi, 'month'],
  [/\bmaar\b/gi, 'mark'],
  [/नवंबर|नवम्बर|नवमबर|novemeber|novmber|novembr/gi, 'november'],
  [/दिसंबर|दिसम्बर|दिसमबर|decemeber|decmber|decembr/gi, 'december'],
  [/जनवरी|जनवरि/gi, 'january'],
  [/फरवरी|फ़रवरी|फरवरि/gi, 'february'],
  [/मार्च|मारच/gi, 'march'],
  [/अप्रैल|अप्रेल/gi, 'april'],
  [/मई|मइ/gi, 'may'],
  [/जून|जुन/gi, 'june'],
  [/जुलाई|जुलई/gi, 'july'],
  [/अगस्त|अगस्त/gi, 'august'],
  [/सितंबर|सितम्बर|सितमबर/gi, 'september'],
  [/अक्टूबर|अक्टुबर|अक्टोबर/gi, 'october'],
  [/adress|addres|addrees|एड्रेस|एड्रस/gi, 'address'],
  [/बताओ|बता दो|बता दे|बतादो|batao|bata do/gi, 'बताओ'],
  [/दिखाओ|दिखा दो|दिखादो|dikhao/gi, 'दिखाओ'],
  [/लगा दो|लगा दे|लगादो|laga do|laga de|lagado/gi, 'लगा दो'],
  [/मुझे|मुजे|मुज्हे|mujhe|muze/gi, 'मुझे'],
  [/\bun\s+sab(?:ke|ka|ki|ko)?\b/gi, 'all'],
  [/\bsabke\b/gi, 'all'],
  [/\bjitn[ie]\s+bhi\b/gi, 'all'],
  // STT often says "marker" / "market" for "mark kar"
  [/\bmarke[rt]\s+(?:do|de|karo|the)\b/gi, 'mark kar do'],
  [/\bmarke[rt]\b/gi, 'mark'],
  [/\bkitni\b|\bkitna\b/gi, 'kitne'],
  [/कितनी|कितना/gi, 'कितने'],
  // Place / org STT near-misses (seed demo sites) — keep replacements narrow
  [/\bshower\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:savar|sawar)\s+gate\b/gi, 'sarwar gate'],
  [/\b(?:silver|savar|sawar)\s+(?:oxide|ok|ukai|hoke)\s+care\b/gi, 'silver oak care'],
  [/\bsilver\s+oxide\b/gi, 'silver oak'],
  [/\bsilver\s+ok\b/gi, 'silver oak'],
];

function applySttFixes(text) {
  let value = String(text || '');
  for (const [pattern, replacement] of STT_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

module.exports = { applySttFixes, STT_REPLACEMENTS };
