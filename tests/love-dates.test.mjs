import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoveStats, getAnniversaries, formatLoveDate } from '../src/lib/love-dates.mjs';

const milestone = (items, id) => items.find(item => item.id === id);

test('counters change at Shanghai midnight, irrespective of the host timezone', () => {
  const before = getLoveStats('2030-01-01', '2030-01-03', new Date('2030-01-02T15:59:59Z'));
  assert.deepEqual(before, { togetherDays: 0, metDays: 1, waitingDays: 2, togetherDayNumber: 0 });
  const midnight = getLoveStats('2030-01-01', '2030-01-03', new Date('2030-01-02T16:00:00Z'));
  assert.deepEqual(midnight, { togetherDays: 0, metDays: 2, waitingDays: 2, togetherDayNumber: 1 });
  const nextDay = getLoveStats('2030-01-01', '2030-01-03', new Date('2030-01-03T16:00:00Z'));
  assert.deepEqual(nextDay, { togetherDays: 1, metDays: 3, waitingDays: 2, togetherDayNumber: 2 });
});

test('date-only inputs do not invent a start time and future counters remain zero', () => {
  assert.deepEqual(getLoveStats('2040-02-28', '2040-03-01', '2040-03-01'),
    { togetherDays: 0, metDays: 2, waitingDays: 2, togetherDayNumber: 1 });
  assert.deepEqual(getLoveStats('2040-05-01', '2040-05-06', '2040-04-30'),
    { togetherDays: 0, metDays: 0, waitingDays: 5, togetherDayNumber: 0 });
  assert.equal(getLoveStats('2040-01-01T17:00:00Z', '2040-01-03', '2040-01-03').waitingDays, 1);
});

test('monthly anniversaries clamp the original day without accumulating month-end drift', () => {
  const inFebruary = getAnniversaries('2020-01-01', '2024-01-31', '2024-02-28');
  assert.equal(milestone(inFebruary, 'monthly').date, '2024-02-29');
  assert.equal(milestone(inFebruary, 'monthly').daysUntil, 1);
  const onTheDay = getAnniversaries('2020-01-01', '2024-01-31', '2024-02-29');
  assert.equal(milestone(onTheDay, 'monthly').daysUntil, 0);
  const inMarch = getAnniversaries('2020-01-01', '2024-01-31', '2024-03-01');
  assert.equal(milestone(inMarch, 'monthly').date, '2024-03-31');
  const ordinaryFebruary = getAnniversaries('2020-01-01', '2023-01-31', '2023-02-01');
  assert.equal(milestone(ordinaryFebruary, 'monthly').date, '2023-02-28');
});

test('leap-day anniversaries clamp to February 28 and return to February 29 in leap years', () => {
  const ordinaryYear = getAnniversaries('2020-02-29', '2024-02-29', '2025-02-28');
  assert.equal(milestone(ordinaryYear, 'anniversary').date, '2025-02-28');
  assert.equal(milestone(ordinaryYear, 'anniversary').daysUntil, 0);
  assert.equal(milestone(ordinaryYear, 'meeting-anniversary').daysUntil, 0);
  const next = getAnniversaries('2020-02-29', '2024-02-29', '2025-03-01');
  assert.equal(milestone(next, 'anniversary').date, '2026-02-28');
  assert.equal(milestone(next, 'anniversary').title, '在一起 2 周年');
  const leapYear = getAnniversaries('2020-02-29', '2024-02-29', '2028-02-28');
  assert.equal(milestone(leapYear, 'anniversary').date, '2028-02-29');
});

test('100 days means 100 elapsed calendar days; completed one-time milestones disappear', () => {
  const before = getAnniversaries('2020-01-01', '2030-01-01', '2030-04-10');
  assert.equal(milestone(before, '100-days').date, '2030-04-11');
  assert.equal(milestone(before, '100-days').daysUntil, 1);
  const today = getAnniversaries('2020-01-01', '2030-01-01', '2030-04-11');
  assert.equal(milestone(today, '100-days').daysUntil, 0);
  assert.equal(getLoveStats('2020-01-01', '2030-01-01', '2030-04-11').togetherDays, 100);
  const day520 = getAnniversaries('2020-01-01', '2030-01-01', '2031-06-05');
  assert.equal(milestone(day520, '520-days').date, '2031-06-05');
  assert.equal(milestone(day520, '520-days').daysUntil, 0);
  assert.equal(getLoveStats('2020-01-01', '2030-01-01', '2031-06-05').togetherDays, 520);
  const later = getAnniversaries('2020-01-01', '2030-01-01', '2032-01-02');
  assert.equal(milestone(later, '100-days'), undefined);
  assert.equal(milestone(later, '520-days'), undefined);
  assert.equal(milestone(later, 'anniversary').date, '2033-01-01');
});

test('future starts have no zero-month/year anniversary; milestones stay ordered and classified', () => {
  const items = getAnniversaries('2030-05-01', '2030-06-01', '2030-04-01');
  assert.equal(milestone(items, 'monthly').date, '2030-07-01');
  assert.equal(milestone(items, 'anniversary').date, '2031-06-01');
  assert.equal(milestone(items, 'meeting-anniversary').date, '2031-05-01');
  assert.equal(milestone(items, 'meeting-anniversary').kind, 'meeting');
  assert.ok(items.filter(item => item.id !== 'meeting-anniversary').every(item => item.kind === 'relationship'));
  assert.deepEqual(items.map(item => item.daysUntil), items.map(item => item.daysUntil).sort((a, b) => a - b));
  assert.ok(items.every(item => item.daysUntil >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.date)));
});

test('dates format in Chinese using Shanghai dates and reject ambiguous or invalid input', () => {
  assert.equal(formatLoveDate('2030-02-03'), '2030年2月3日');
  assert.equal(formatLoveDate(new Date('2030-02-03T16:00:00Z')), '2030年2月4日');
  assert.equal(formatLoveDate('2030-02-03T23:00:00+08:00'), '2030年2月3日');
  for (const invalid of ['2030-02-29', '2030-13-01', '2030-01-00', '2030-02-03T12:00:00', 'invalid', new Date(NaN)]) {
    assert.throws(() => formatLoveDate(invalid), TypeError);
  }
});
