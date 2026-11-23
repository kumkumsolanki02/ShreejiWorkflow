/**
 * Offline smoke tests for assistant NLU (no DB / no HTTP).
 * Run: node src/assistant/scripts/smoke-nlu.js
 */
const {
  normalizeText,
  extractMonth,
  extractDate,
  namesSimilar,
  normalizeName,
  wantsMonthWideAttendance,
  workingDatesInMonth,
} = require('../engine/normalize');
const { matchIntent } = require('../engine/intentMatcher');
const { matchFields, EMPLOYEE_LOOKUP, ORGANIZATION_LOOKUP } = require('../knowledge/fieldAliases');
const { applySttFixes } = require('../knowledge/sttFixes');
const { leftoverNameCandidates, scoreOrganizationName, scoreEmployeeName } = require('../engine/entityIndex');
const { decideSearchTypes, extractLookupNames } = require('../engine/crossTypeResolve');
const { detectLocationScope, isOrgActionIntent, hasNamedLocationPhrase } = require('../engine/orgScope');
const { formatProjectedReply } = require('../engine/projector');
const { mergeSlots } = require('../engine/contextMerger');

let failed = 0;

function assert(condition, label) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${label}`);
  } else {
    console.log(`ok: ${label}`);
  }
}

function timed(label, fn, maxMs = 500) {
  const start = process.hrtime.bigint();
  fn();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert(ms < maxMs, `${label} under ${maxMs}ms (was ${ms.toFixed(2)}ms)`);
  return ms;
}

assert(applySttFixes('अटेंडेंस लगा दो').toLowerCase().includes('attendance'), 'stt attendance');
assert(applySttFixes('पेरोल दो').toLowerCase().includes('payroll'), 'stt payroll');
assert(applySttFixes('madanganj ka petrol do').toLowerCase().includes('payroll'), 'stt petrol→payroll');
assert(applySttFixes('january ka bedsheet do').toLowerCase().includes('wage sheet'), 'stt bedsheet→wage sheet');
assert(applySttFixes('january ka wedge sheet do').toLowerCase().includes('wage sheet'), 'stt wedge sheet→wage sheet');
assert(applySttFixes('celery slip do').toLowerCase().includes('salary slip'), 'stt celery slip→salary slip');
assert(applySttFixes('bank later do').toLowerCase().includes('bank invoice'), 'stt bank later→bank invoice');
assert(applySttFixes('october manth ki absant maar kar do').toLowerCase().includes('month'), 'stt manth→month');
assert(applySttFixes('october manth ki absant maar kar do').toLowerCase().includes('absent'), 'stt absant→absent');
assert(applySttFixes('october manth ki absant maar kar do').toLowerCase().includes('mark'), 'stt maar→mark');
assert(applySttFixes('pay role do').toLowerCase().includes('payroll'), 'stt pay role→payroll');
assert(applySttFixes('madan ganj location').toLowerCase().includes('madanganj'), 'stt madan ganj→madanganj');
assert(applySttFixes('form 17 do').toLowerCase().includes('wage register'), 'stt form 17→wage register');
assert(applySttFixes('pay sleep do').toLowerCase().includes('salary slip'), 'stt pay sleep→salary slip');
assert(applySttFixes('nikalo payroll').toLowerCase().includes('निकालो'), 'stt nikalo');
assert(applySttFixes('this month ka petrol').toLowerCase().includes('payroll'), 'stt this month petrol');
assert(applySttFixes('kitne deactive organisations').toLowerCase().includes('inactive'), 'stt deactive→inactive');
assert(!applySttFixes('active locations').toLowerCase().includes('activee'), 'stt active not activee');
assert(!applySttFixes('invoice do').toLowerCase().includes('invoicee'), 'stt invoice not invoicee');
assert(applySttFixes('invoicee do').toLowerCase().includes('invoice'), 'stt invoicee→invoice');
assert(applySttFixes('tv a location').toLowerCase().includes('tva'), 'stt tv a→tva');
assert(applySttFixes('is mahine ka payroll').toLowerCase().includes('this month'), 'stt is mahine→this month');
assert(applySttFixes('sabhi employee').toLowerCase().includes('all'), 'stt sabhi→all');
assert(applySttFixes('hajri laga do').toLowerCase().includes('attendance'), 'stt hajri→attendance');
assert(applySttFixes('नवम्बर का bank invoice').toLowerCase().includes('november'), 'stt november');
assert(applySttFixes('emplyee list').toLowerCase().includes('employee'), 'stt employee typo');
assert(applySttFixes('loaction details').toLowerCase().includes('location'), 'stt location typo');
assert(applySttFixes('turning location').toLowerCase().includes('tony'), 'stt turning→tony');
assert(applySttFixes('turn my location').toLowerCase().includes('tony'), 'stt turn my→tony');
assert(applySttFixes('toni location').toLowerCase().includes('tony'), 'stt toni→tony');

const nov = normalizeText('November 2024 का payroll दो');
assert(extractMonth(nov.text) === '2024-11', 'extract november 2024');
assert(extractDate('आज की attendance', 'Asia/Kolkata'), 'extract today');

assert(matchFields('lokesh का mobile number दो', EMPLOYEE_LOOKUP).includes('phone'), 'field mobile→phone');
assert(matchFields('organization की email बताओ', ORGANIZATION_LOOKUP).includes('email'), 'field org email');
assert(matchFields('bank number दो', EMPLOYEE_LOOKUP).includes('bankAccountNumber'), 'field bank number');
assert(matchFields('ifsc code बताओ', EMPLOYEE_LOOKUP).includes('bankRoutingCode'), 'field ifsc');
assert(!matchFields('bank invoice दो', EMPLOYEE_LOOKUP).includes('phone'), 'bank invoice not phone');
assert(applySttFixes('ka adress do').toLowerCase().includes('address'), 'stt adress→address');
{
  const normalized = normalizeText('Deepak Regar ka adress do');
  const result = matchIntent(normalized.text, {});
  assert(result.intent === 'get_employee_field', `adress intent (got ${result.intent})`);
  assert(matchFields(normalized.text, EMPLOYEE_LOOKUP).includes('address'), 'adress field→address');
}

assert(leftoverNameCandidates('Lokesh का mobile दो').some((c) => c.includes('lokesh')), 'possessive lokesh');
assert(leftoverNameCandidates('Pirana location की attendance').some((c) => c.includes('pirana')), 'location pirana');

{
  const bankTypes = decideSearchTypes('Lokesh ka bank number do', 'get_employee_field', ['bankAccountNumber']);
  assert(bankTypes.length === 1 && bankTypes[0] === 'employee', 'bank → employee only');
  const typedLoc = decideSearchTypes('Pirana location details दो', 'lookup_entity', []);
  assert(typedLoc.length === 1 && typedLoc[0] === 'location', 'typed location → location only');
  const bare = decideSearchTypes('Pirana की details दो', 'lookup_entity', []);
  assert(bare.length === 3, 'bare details → all three types');
  const typedOrg = decideSearchTypes('ABC organization की email', 'get_org_field', ['email']);
  assert(typedOrg.length === 1 && typedOrg[0] === 'organization', 'typed org → organization only');
  const payrollTypes = decideSearchTypes('Bright Path Services ka payroll दो', 'payroll', []);
  assert(payrollTypes.includes('organization'), 'payroll prefers org/location search');
  assert(isOrgActionIntent('payroll') && isOrgActionIntent('list_employees'), 'org action intents flagged');
  assert(detectLocationScope('सभी locations का attendance register दो') === 'all_in_org', 'all locations scope');
  assert(detectLocationScope('Pirana location का payroll') === 'single', 'single location scope');
  assert(detectLocationScope('madanganj location ke andar all employee hai unki sari attendance present kar do') === 'single', 'named location + all employees = single site');
  assert(hasNamedLocationPhrase('madanganj location ke andar jitne bhi employee'), 'detect named location phrase');
  assert(detectLocationScope('organization के employees की list') == null
    || detectLocationScope('organization के employees की list') !== 'all_in_org', 'employee list is not all-locations');
}

timed('intent batch', () => {
  const cases = [
    ['Lokesh का mobile दो', 'get_employee_field'],
    ['Lokesh का mobile number बताओ', 'get_employee_field'],
    ['mobile of Lokesh', 'get_employee_field'],
    ['Lokesh की पूरी details दो', 'lookup_entity'],
    ['employee की पूरी details दो', 'get_employee_full'],
    ['Pirana की details दो', 'lookup_entity'],
    ['Lokesh employee की details दो', 'get_employee_full'],
    ['इस location में कितने employee active है', 'count_employees'],
    ['kitne employees active hain', 'count_employees'],
    ['active employees की list दो', 'list_employees'],
    ['सभी employees दिखाओ', 'list_employees'],
    ['organization की email बताओ', 'get_org_field'],
    ['org का email दो', 'get_org_field'],
    ['organization की पूरी जानकारी दो', 'get_org_full'],
    ['location की पूरी जानकारी दो', 'get_location_full'],
    ['Pirana location की attendance present लगा दो', 'mark_attendance'],
    ['sabko present mark kar do', 'mark_attendance'],
    ['आज की attendance summary दो', 'get_attendance'],
    ['Lokesh की attendance बताओ', 'employee_attendance'],
    ['November का payroll दो', 'payroll'],
    ['इस महीने का payroll दो', 'payroll'],
    ['salary slip दो', 'salary_slip'],
    ['bank invoice दो इस month का', 'bank_invoice'],
    ['wage register दो', 'wage_register'],
    ['attendance register दो', 'attendance_register'],
    ['client invoice दो', 'client_invoice'],
    ['Lokesh का salary कितना है', 'salary_amount'],
    ['help', 'help'],
    ['tum kya kya kar sakte ho', 'help'],
    ['aap kya kar sakte ho', 'help'],
    ['hi i am lokesh', 'greeting'],
    ['नमस्ते', 'greeting'],
    ['Amit Chaudhari ka mobile number do', 'get_employee_field'],
    ['Anil Paliwal ka mobile number do', 'get_employee_field'],
    ['मुझे कृपया Lokesh का phone number दे दो', 'get_employee_field'],
    ['organization के अंदर कितने employee active है', 'count_employees'],
    ['सभी locations का attendance register दो', 'attendance_register'],
    ['सभी locations का payroll दो', 'payroll'],
    ['organization की employee list दो', 'list_employees'],
    ['Green Valley Care Organisation ke andar jitni bhi location hai mujhe UN Sabke employee do', 'list_employees'],
    ['Green Valley Care Organisation ke andar jitne bhi employ Hai Un Sab Ka Mujhe payroll do', 'payroll'],
    ['Green Valley Care Organisation ke andar jitne bhi like employee UN Sab Ka pair roll do', 'payroll'],
    ['Golden track work organisation ke andar jitne bhi location hai mujhe UN Sab Ka salary slip chahie', 'salary_slip'],
    ['Golden track work ke andar kitne locations hai', 'count_locations'],
    ['Golden track works organisation ke andar Kitni locations Hain', 'count_locations'],
    ['plan view support organisation ke andar Kitni locations Hain', 'count_locations'],
    ['Oppo organisation ke andar Kitni locations Hain', 'count_locations'],
    ['Golden track work ke andar jitne bhi employee UN sab ki list do', 'list_employees'],
    ['Raipur camp location ke andar kitne employ Hai Unki details do', 'list_employees'],
    ['employee Ke Naam Do Raipur camp location ke', 'list_employees'],
    ['shower Gate location ke employee ki details do', 'list_employees'],
    ['Savar Gate employee ki list do', 'list_employees'],
    ['silver ok Care Organisation ke andar Jo Sawar Gate Hai Uske Jo employ details do', 'list_employees'],
    ['madanganj location Hai usmein jitne bhi employee Hai Unki sari attendance present kar do as a November month', 'mark_attendance'],
    ['madanganj organisation Hai uski details do', 'lookup_entity'],
    ['confirm', 'confirm_pending'],
    ['हाँ', 'confirm_pending'],
    ['cancel', 'cancel'],
    ['Loki location ke andar jitne bhi employ Hai unke October manth ki absent Maar kar do Sare employee ki', 'mark_attendance'],
    ['Loki location ke andar jitne bhi employ Hai Unki October manth ki absent Maar kar do Sare employ ki', 'mark_attendance'],
    ['madanganj Ka Mujhe November ka petrol do', 'payroll'],
    ['September Ka Mujhe madanganj location ka petrol do', 'payroll'],
    ['September month Ka Mujhe madanganj location ka petrol do', 'payroll'],
    ['madanganj location Ka Mujhe January ka bedsheet do', 'wage_register'],
    ['madanganj location Ka Mujhe January ka wedge sheet do', 'wage_register'],
    ['madanganj location Ka Mujhe January ka celery slip do', 'salary_slip'],
    ['madanganj location Ka Mujhe November ka bank later do', 'bank_invoice'],
    ['madanganj location Ka Mujhe January ka attendance sheet do', 'attendance_register'],
    ['Mere dashboard ke andar Kitni active locations hai', 'count_locations'],
    ['Mere dashboard ke andar Kitni locations hai', 'count_locations'],
    ['Mere dashboard ke andar Kitni organisations hai', 'count_organizations'],
    ['Mere dashboard ke andar Kitni active organisation', 'count_organizations'],
    ['kitne deactive organisations hai', 'count_organizations'],
    ['Kitni deactive locations hai', 'count_locations'],
    ['Tata DB location ka invoice 2 November ka', 'client_invoice'],
    ['Tata DB location Ka Mujhe invoice do', 'client_invoice'],
    ['Tata DB location ka is manth ka invoice do', 'client_invoice'],
    ['Tata DB location ka December Ka Mujhe invoice do', 'client_invoice'],
    ['Tata DB ka invoice do', 'client_invoice'],
    // Tony / turning transcript regressions
    ['Tony location ki details do jismein petrol bhi ho', 'get_location_full'],
    ['Tony location ki veg sheet do', 'wage_register'],
    ['turning location ki Bank invoice do', 'bank_invoice'],
    ['Tony location ki Bank invoice do', 'bank_invoice'],
    ['turn my location ke andar employ ki details do', 'list_employees'],
    ['Tony location ki mujhe attendance details do', 'get_attendance'],
    ['Tony location ke andar ki attendance detail do', 'get_attendance'],
    ['Tony location ke andar ki mujhe attendance sheet do', 'attendance_register'],
  ];
  for (const [text, expected] of cases) {
    const normalized = normalizeText(text);
    const result = matchIntent(normalized.text, {});
    assert(result.intent === expected, `intent "${text}" → ${expected} (got ${result.intent})`);
  }
});

assert(namesSimilar(normalizeName('Lokesh Sharma'), normalizeName('Lokesh Sharma')), 'exact name');
assert(namesSimilar(normalizeName('Lokesh'), normalizeName('Lokes')), 'fuzzy lokesh');
assert(!namesSimilar(normalizeName('Ram'), normalizeName('Shyam')), 'not similar short names');

{
  const text = normalizeText('madanganj location Hai usmein jitne bhi employee Hai Unki sari attendance present kar do as a November month').text;
  assert(wantsMonthWideAttendance(text), 'detect month-wide attendance ask');
  assert(extractMonth(text) === '2026-11' || String(extractMonth(text) || '').endsWith('-11'), 'november month extracted');
  const days = workingDatesInMonth('2026-11', 'Asia/Kolkata');
  assert(days.length > 0 && days.every((d) => d.startsWith('2026-11')), 'working days in november');
}
{
  // STT "marker" must not become March; November must still win
  const text = normalizeText('madanganj location ke andar all employee unki attendance as a present marker do November month ki').text;
  assert(!String(extractMonth(text) || '').endsWith('-03'), 'marker must not extract as March');
  assert(String(extractMonth(text) || '').endsWith('-11'), 'november wins over marker');
}

{
  const result = matchIntent(normalizeText('mobile दो').text, { employeeId: 'abc', intent: 'get_employee_full' });
  assert(result.intent === 'get_employee_field', 'context follow-up mobile → employee field');
}
{
  const result = matchIntent(normalizeText('email बताओ').text, { organizationId: 'org1', intent: 'get_org_full' });
  assert(result.intent === 'get_org_field', 'context follow-up email → org field');
}

{
  const org = {
    organizationName: 'Bright Path Services',
    name: 'Pooja Jain',
    email: 'bright.path@shreeji.local',
    keys: ['bright path services', 'bright', 'path', 'services', 'bright.path@shreeji.local'],
  };
  assert(scoreOrganizationName('lalit jain', org) < 70, 'org must not match Lalit Jain via Jain');
  assert(scoreOrganizationName('pooja jain', org) >= 90, 'org contact full name still matches');
  assert(scoreOrganizationName('bright path services', org) >= 90, 'org company name matches');
  const org2 = {
    organizationName: 'True Ground Support',
    name: 'Lata Sharma',
    email: 'true.ground@shreeji.local',
    keys: ['true ground support', 'true', 'ground', 'support', 'true.ground@shreeji.local'],
  };
  assert(scoreOrganizationName('lata bheel', org2) < 70, 'org must not match Lata Bheel via Lata');
  assert(scoreEmployeeName('lata bheel', { name: 'Lata Bheel' }) >= 96, 'employee Lata Bheel exact-ish');
  assert(scoreEmployeeName('lalit jain', { name: 'Lalit Jain' }) >= 96, 'employee Lalit Jain exact-ish');
}

{
  const names = extractLookupNames('Lalit Jain ki details do', 'Lalit Jain');
  assert(names.every((n) => n.split(/\s+/).length >= 2), 'multi-word lookup drops surname-only leftovers');
  assert(names.some((n) => n.includes('lalit')), 'keeps Lalit Jain');
}

{
  const merged = mergeSlots(
    { organizationId: 'old-org', employeeId: 'old-emp' },
    { organizationId: null, employeeId: null, fields: [] },
    { explicitEmployeeMention: true, explicitOrganizationMention: true, explicitLocationMention: true },
  );
  assert(!merged.organizationId && !merged.employeeId, 'named lookup does not carry previous entities');
}

{
  const reply = formatProjectedReply('Organization details', {
    name: 'Pooja Jain',
    organizationName: 'Bright Path',
    posts: [{ workName: 'A' }, { workName: 'B' }],
    role: 'organization',
    createdAt: new Date(),
  });
  assert(!reply.includes('[object Object]'), 'no object Object in reply');
  assert(!reply.toLowerCase().includes('role:'), 'hides role');
  assert(!reply.toLowerCase().includes('createdat'), 'hides createdAt');
}

if (failed) {
  console.error(`\n${failed} failing assertion(s)`);
  process.exit(1);
}
console.log('\nAll NLU smoke tests passed.');
