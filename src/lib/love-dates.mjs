const DAY_MS = 86_400_000;
const chinaDate = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});

function utcDay(year, month, day) {
  // setUTCFullYear also handles years 1–99 without Date.UTC's 1900 offset.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime() / DAY_MS;
}

function parts(day) {
  const date = new Date(day * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function calendarDay(value) {
  // A date-only value is already a calendar date, never the host's midnight.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const result = utcDay(year, month, day);
    const actual = parts(result);
    if (year < 1 || actual.year !== year || actual.month !== month || actual.day !== day) {
      throw new TypeError('日期无效。');
    }
    return result;
  }
  if (!(value instanceof Date) && typeof value !== 'string') throw new TypeError('日期无效。');
  // Datetimes must identify an instant. Refuse host-dependent local timestamps.
  if (typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    throw new TypeError('日期时间需要包含时区。');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('日期无效。');
  const values = Object.fromEntries(chinaDate.formatToParts(date).map(part => [part.type, part.value]));
  return utcDay(Number(values.year), Number(values.month), Number(values.day));
}

function dateString(day) {
  const value = parts(day);
  return `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
}

function addMonths(origin, count) {
  const start = parts(origin);
  const targetMonth = start.month - 1 + count;
  const year = start.year + Math.floor(targetMonth / 12);
  const month = targetMonth % 12 + 1;
  const lastDay = parts(utcDay(year, month + 1, 1) - 1).day;
  return utcDay(year, month, Math.min(start.day, lastDay));
}

function nextRecurrence(origin, today, monthsPerPeriod) {
  const start = parts(origin);
  const current = parts(today);
  const elapsedMonths = (current.year - start.year) * 12 + current.month - start.month;
  let count = Math.max(1, Math.floor(elapsedMonths / monthsPerPeriod));
  let date = addMonths(origin, count * monthsPerPeriod);
  if (date < today) date = addMonths(origin, ++count * monthsPerPeriod);
  return { date, count };
}

/** Count calendar days in China without assuming a relationship start time. */
export function getLoveStats(meetDate, relationshipDate, now = new Date()) {
  const met = calendarDay(meetDate);
  const together = calendarDay(relationshipDate);
  const today = calendarDay(now);
  return {
    togetherDays: Math.max(0, today - together),
    metDays: Math.max(0, today - met),
    waitingDays: together - met,
    togetherDayNumber: today < together ? 0 : today - together + 1,
  };
}

/** Return only upcoming/today milestones; all dates are Shanghai calendar dates. */
export function getAnniversaries(meetDate, relationshipDate, now = new Date()) {
  const met = calendarDay(meetDate);
  const together = calendarDay(relationshipDate);
  const today = calendarDay(now);
  const monthly = nextRecurrence(together, today, 1);
  const yearly = nextRecurrence(together, today, 12);
  const meeting = nextRecurrence(met, today, 12);
  const milestones = [
    { id: 'monthly', title: '每月纪念日', day: monthly.date, kind: 'relationship', detail: `在一起满 ${monthly.count} 个月` },
    { id: '100-days', title: '在一起 100 天', day: together + 100, kind: 'relationship', detail: '一起走过 100 天' },
    { id: 'anniversary', title: `在一起 ${yearly.count} 周年`, day: yearly.date, kind: 'relationship', detail: '新的一年，继续一起走' },
    { id: '520-days', title: '在一起 520 天', day: together + 520, kind: 'relationship', detail: '把喜欢，写进每一天' },
    { id: 'meeting-anniversary', title: `相识 ${meeting.count} 周年`, day: meeting.date, kind: 'meeting', detail: '还记得第一次遇见你' },
  ];
  return milestones.filter(item => item.day >= today)
    .sort((a, b) => a.day - b.day)
    .map(({ day, ...item }) => ({ ...item, date: dateString(day), daysUntil: day - today }));
}

/** Format a date/instant consistently with the calendar used by the counters. */
export function formatLoveDate(date) {
  const value = parts(calendarDay(date));
  return `${value.year}年${value.month}月${value.day}日`;
}
