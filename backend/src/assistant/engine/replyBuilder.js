function helpReply(language = 'hi-IN') {
  if (String(language).startsWith('hi')) {
    return [
      'मैं Admin Assistant हूँ (बिना external AI के)। आप मुझसे पूछ / करवा सकते हैं:',
      '• Organization / Location / Employee की field या full details',
      '• Dashboard: kitni active/inactive organizations, locations या employees',
      '• Pending payroll locations: "Kitni locations ka payroll ban sakta hai"',
      '• Active employees की list या count (dashboard / location / org)',
      '• Attendance देखना या mark करना — दिन या पूरे month (confirm के बाद)',
      '• Payroll, salary slip, wage register/sheet, attendance register',
      '• Bank invoice / NEFT letter, client invoice (location + month)',
      'उदाहरण:',
      '  - "Lokesh का mobile दो"',
      '  - "Madanganj location की November attendance present लगा दो"',
      '  - "Tata DB location का invoice दो"',
      '  - "Mere dashboard ke andar kitni active locations hai"',
      '  - "Dashboard mein kitne employees hain"',
      'Confirm/Cancel लिखकर pending action पूरा करें।',
    ].join('\n');
  }
  return [
    'I am the Admin Assistant (no external AI). I can:',
    '• Answer org / location / employee field or full details',
    '• Dashboard counts: active/inactive organizations, locations, or employees',
    '• Pending payroll locations: "How many locations can payroll be made for"',
    '• List or count employees (dashboard / location / organization)',
    '• Show or mark attendance — day or full month (after confirm)',
    '• Payroll, salary slip, wage register/sheet, attendance register',
    '• Bank invoice / NEFT letter, client invoice (location + month)',
    'Examples:',
    '  - "Give Lokesh mobile"',
    '  - "Mark November present for Madanganj location"',
    '  - "Invoice for Tata DB location"',
    '  - "How many active locations on my dashboard"',
    '  - "How many employees on my dashboard"',
    'Type Confirm/Cancel to finish a pending action.',
  ].join('\n');
}

function clarify(message) {
  return { reply: message, source: 'validation', success: true };
}

function unknownReply(language = 'hi-IN') {
  return String(language).startsWith('hi')
    ? 'समझ नहीं पाया। Organization, location, employee, attendance, payroll या invoice के बारे में साफ़ शब्दों में पूछें। Help लिखें।'
    : 'I could not understand. Ask about organization, location, employee, attendance, payroll, or invoice. Say help.';
}

module.exports = { helpReply, clarify, unknownReply };
