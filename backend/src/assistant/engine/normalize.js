const { applySttFixes } = require('../knowledge/sttFixes');
const { MONTH_NAMES } = require('../knowledge/synonyms');

function collapseWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripPunctuation(value) {
  return String(value || '')
    .replace(/[?!.,;:'"“”‘’()[\]{}<>|/\\@#%^*=+_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(raw) {
  const original = collapseWhitespace(raw);
  const sttFixed = applySttFixes(original);
  const lower = stripPunctuation(sttFixed).toLowerCase();
  return {
    original,
    text: lower,
    tokens: lower ? lower.split(' ').filter(Boolean) : [],
  };
}

function currentMonthInTimeZone(timeZone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    if (year && month) return `${year}-${month}`;
  } catch {
    // fall through
  }
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function currentDateInTimeZone(timeZone = 'Asia/Kolkata') {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractMonth(text, fallbackMonth = null) {
  const value = String(text || '').toLowerCase();
  const iso = value.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
  if (iso) return iso[0];

  if (/\b(this month|इस महीने|इस माह|current month)\b/i.test(value)) {
    return fallbackMonth || currentMonthInTimeZone();
  }
  if (/\b(last month|पिछले महीने|previous month)\b/i.test(value)) {
    const base = fallbackMonth || currentMonthInTimeZone();
    const [year, month] = base.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  // Longest names first so "november" wins over "nov"; word boundaries so "mar" ≠ "marker"
  const monthEntries = Object.entries(MONTH_NAMES).sort((a, b) => b[0].length - a[0].length);
  for (const [name, monthNumber] of monthEntries) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundary = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'iu');
    if (!boundary.test(value)) continue;
    const yearMatch = value.match(/\b(20\d{2})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : Number((fallbackMonth || currentMonthInTimeZone()).slice(0, 4));
    return `${year}-${String(monthNumber).padStart(2, '0')}`;
  }
  return null;
}

function extractDate(text, timeZone = 'Asia/Kolkata') {
  const value = String(text || '').toLowerCase();
  const iso = value.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (iso) return iso[0];
  // Avoid \\b with Devanagari — it does not treat Hindi letters as word chars.
  if (/(?:^|[^\p{L}\p{N}])(today|आज|aaj)(?=$|[^\p{L}\p{N}])/iu.test(value)) {
    return currentDateInTimeZone(timeZone);
  }
  if (/(?:^|[^\p{L}\p{N}])(yesterday|कल|aaj se pehle)(?=$|[^\p{L}\p{N}])/iu.test(value)) {
    const today = currentDateInTimeZone(timeZone);
    const date = new Date(`${today}T00:00:00+05:30`);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  return null;
}

function levenshtein(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let column = 1; column <= right.length; column += 1) {
    let previous = column;
    for (let row = 1; row <= left.length; row += 1) {
      const current = left[row - 1] === right[column - 1]
        ? rows[row - 1]
        : Math.min(rows[row - 1], rows[row], previous) + 1;
      rows[row - 1] = previous;
      previous = current;
    }
    rows[left.length] = previous;
  }
  return rows[left.length];
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function namesSimilar(left, right, maxRatio = 0.25) {
  if (!left || !right) return false;
  if (left === right) return true;
  if (Math.min(left.length, right.length) < 3) return left === right;
  const distance = levenshtein(left, right);
  const longest = Math.max(left.length, right.length);
  return distance <= Math.max(1, Math.floor(longest * maxRatio));
}

function containsPhrase(text, phrase) {
  const needle = String(phrase || '').toLowerCase().trim();
  if (!needle) return false;
  return String(text || '').toLowerCase().includes(needle);
}

/** Working (Mon–Sat) dates in YYYY-MM up to today (no future, no Sundays). */
function workingDatesInMonth(month, timeZone = 'Asia/Kolkata') {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return [];
  const today = currentDateInTimeZone(timeZone);
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const dates = [];
  for (let day = 1; day <= lastDay; day += 1) {
    const value = `${month}-${String(day).padStart(2, '0')}`;
    if (value > today) break;
    const weekday = new Date(`${value}T12:00:00.000Z`).getUTCDay();
    if (weekday === 0) continue; // Sunday off
    dates.push(value);
  }
  return dates;
}

function wantsMonthWideAttendance(text) {
  const value = String(text || '').toLowerCase();
  const monthWord = String.raw`(?:january|february|march|april|may|june|july|august|september|october|november|december|month|महीने|महीना|this\s*month|last\s*month|current\s*month|इस\s*महीने)`;
  if (/\b(?:sari|saari|सारी|पूरी|poori|poora|entire|whole|full|all|सभी|सारे)\b.{0,40}\b(?:attendance|present|absent)\b/.test(value)) return true;
  if (/\b(?:attendance|present|absent)\b.{0,40}\b(?:sari|saari|सारी|पूरी|month|महीने|महीना|all|सभी)\b/.test(value)) return true;
  if (/\bas\s+a\s+\w+\s+month\b/.test(value)) return true;
  if (new RegExp(`\\b${monthWord}\\b.{0,50}\\b(?:attendance|present|absent)\\b`, 'i').test(value)) return true;
  if (new RegExp(`\\b(?:attendance|present|absent)\\b.{0,50}\\b${monthWord}\\b`, 'i').test(value)) return true;
  if (/\b(?:employee|employees|कर्मचारी).{0,40}(?:present|absent).{0,30}(?:month|महीने)/i.test(value)) return true;
  return false;
}

module.exports = {
  normalizeText,
  currentMonthInTimeZone,
  currentDateInTimeZone,
  extractMonth,
  extractDate,
  workingDatesInMonth,
  wantsMonthWideAttendance,
  levenshtein,
  normalizeName,
  namesSimilar,
  containsPhrase,
  collapseWhitespace,
};
