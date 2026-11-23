function helpReply(language = 'hi-IN') {
  if (String(language).startsWith('hi')) {
    return [
      'मैं Admin Assistant हूँ (बिना external AI के)। आप मुझसे पूछ / करवा सकते हैं:',
      '• Organization / Location / Employee की field या full details',
      '• Active employees की list या count',
      '• Attendance देखना या mark करना (confirm के बाद)',
      '• Payroll, salary slip, wage register, bank invoice, client invoice',
      'उदाहरण: "Lokesh का mobile दो", "Pirana location की attendance present लगा दो", "November का payroll दो"',
    ].join('\n');
  }
  return [
    'I am the Admin Assistant (no external AI). I can:',
    '• Answer org / location / employee field or full details',
    '• List or count active employees',
    '• Show or mark attendance (after confirmation)',
    '• Prepare payroll, salary slips, wage register, bank invoice, client invoice',
    'Examples: "Give Lokesh mobile", "Mark present for Pirana location", "Payroll for November"',
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
