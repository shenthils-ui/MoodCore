// Run with: node --test tests/
// Loads the same src/logic.js that build.py puts into the app.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const L = createRequire(import.meta.url)('../src/logic.js');

const chk = (id, created = '2026-01-01', extra = {}) => ({ id, type: 'check', created, ...extra });
const cnt = (id, goal, created = '2026-01-01') => ({ id, type: 'count', goal, created });
const log = (d, t = {}, r = {}) => ({ [d]: { t, r } });
const D = '2026-03-10'; // a Tuesday

/* ---------- daily sticker rule ---------- */

test('sticker is due when every to-do of the day is done', () => {
  const tasks = [chk('a'), chk('b')];
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { a: true, b: true })), true);
});

test('no sticker while one to-do is still open', () => {
  const tasks = [chk('a'), chk('b')];
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { a: true })), false);
  assert.equal(L.rewardDue(D, D, [], tasks, {}), false);
});

test('a day with no to-dos gives no sticker', () => {
  assert.equal(L.rewardDue(D, D, [], [], {}), false);
  // to-do created after the day, or deleted before it, does not count for that day
  assert.equal(L.rewardDue(D, D, [], [chk('a', '2026-03-11')], {}), false);
  assert.equal(L.rewardDue(D, D, [], [chk('a', '2026-01-01', { deleted: D })], {}), false);
});

test('routines never count: routine ticks alone give nothing, open routines do not block', () => {
  assert.equal(L.rewardDue(D, D, [], [], log(D, {}, { r1: true })), false);
  const tasks = [chk('a')];
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { a: true }, {})), true);
});

test('counter to-do is done only at its goal', () => {
  const tasks = [cnt('w', 8)];
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { w: 7 })), false);
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { w: 8 })), true);
  assert.equal(L.rewardDue(D, D, [], tasks, log(D, { w: 12 })), true);
  assert.equal(L.rewardDue(D, D, [], [cnt('m', 7.5)], log(D, { m: 7.5 })), true);
});

test('only one sticker per day', () => {
  const tasks = [chk('a')];
  assert.equal(L.rewardDue(D, D, [{ date: D, sticker: 's1' }], tasks, log(D, { a: true })), false);
});

test('no sticker for a future day', () => {
  assert.equal(L.rewardDue('2026-03-11', D, [], [chk('a')], log('2026-03-11', { a: true })), false);
});

test('sticker already given stays given when a to-do is un-ticked', () => {
  const earned = [{ date: D, sticker: 's1' }];
  const tasks = [chk('a')];
  assert.equal(L.rewardDue(D, D, earned, tasks, log(D, { a: true })), false);
  assert.equal(L.rewardDue(D, D, earned, tasks, log(D, { a: false })), false);
  assert.equal(earned.length, 1, 'rewardDue never removes a sticker');
});

test('a to-do added after the sticker was given does not matter for that day', () => {
  const earned = [{ date: D, sticker: 's1' }];
  assert.equal(L.rewardDue(D, D, earned, [chk('a'), chk('b', D)], log(D, { a: true })), false);
});

test('a past day can still earn its sticker when completed later', () => {
  assert.equal(L.rewardDue('2026-03-09', D, [], [chk('a')], log('2026-03-09', { a: true })), true);
});

/* ---------- routine repeat logic ---------- */

const MON = 0, TUE = 1, WED = 2, SUN = 6;

test('weekday numbering starts on Monday', () => {
  assert.equal(L.wdIdx('2026-01-05'), MON);
  assert.equal(L.wdIdx('2026-03-10'), TUE);
  assert.equal(L.wdIdx('2026-01-11'), SUN);
});

test('daily routine happens every day from its start date', () => {
  const r = { repeat: 'daily', start: '2026-03-10', days: [] };
  assert.equal(L.routineOn(r, '2026-03-09'), false);
  assert.equal(L.routineOn(r, '2026-03-10'), true);
  assert.equal(L.routineOn(r, '2026-12-31'), true);
});

test('weekly routine happens only on the chosen weekdays', () => {
  const r = { repeat: 'weekly', start: '2026-01-01', days: [MON, WED] };
  const hits = [];
  for (let i = 5; i <= 11; i++) hits.push(L.routineOn(r, `2026-01-${String(i).padStart(2, '0')}`));
  assert.deepEqual(hits, [true, false, true, false, false, false, false]); // Mon 5 .. Sun 11
});

test('routine stops on its end date and not before', () => {
  const r = { repeat: 'daily', start: '2026-03-01', deleted: '2026-03-10', days: [] };
  assert.equal(L.routineOn(r, '2026-03-09'), true);
  assert.equal(L.routineOn(r, '2026-03-10'), false);
});

test('monthly routine: Nth weekday of the month', () => {
  const r = { repeat: 'monthly', start: '2026-01-01', days: [TUE], nth: 2 }; // 2nd Tuesday
  assert.equal(L.routineOn(r, '2026-03-03'), false); // 1st Tuesday
  assert.equal(L.routineOn(r, '2026-03-10'), true);  // 2nd Tuesday
  assert.equal(L.routineOn(r, '2026-03-17'), false); // 3rd Tuesday
  assert.equal(L.routineOn(r, '2026-03-11'), false); // right week, wrong weekday
  assert.equal(L.routineOn(r, '2026-04-14'), true);  // 2nd Tuesday of April
});

test('monthly routine: last week of the month (nth = 5)', () => {
  const r = { repeat: 'monthly', start: '2026-01-01', days: [TUE], nth: 5 };
  assert.equal(L.routineOn(r, '2026-03-24'), false);
  assert.equal(L.routineOn(r, '2026-03-31'), true);  // last Tuesday of March
  assert.equal(L.routineOn(r, '2026-02-24'), true);  // last Tuesday of February
  assert.equal(L.routineOn(r, '2026-02-17'), false);
});

test('yearly routine happens on the same month and day every year', () => {
  const r = { repeat: 'yearly', start: '2025-06-15', days: [] };
  assert.equal(L.routineOn(r, '2025-06-15'), true);
  assert.equal(L.routineOn(r, '2026-06-15'), true);
  assert.equal(L.routineOn(r, '2026-06-16'), false);
  assert.equal(L.routineOn(r, '2024-06-15'), false); // before start
});

test('yearly routine started on 29 February only appears in leap years', () => {
  const r = { repeat: 'yearly', start: '2024-02-29', days: [] };
  assert.equal(L.routineOn(r, '2025-02-28'), false);
  assert.equal(L.routineOn(r, '2025-03-01'), false);
  assert.equal(L.routineOn(r, '2028-02-29'), true);
});

test('unknown repeat value never matches', () => {
  assert.equal(L.routineOn({ repeat: 'hourly', start: '2026-01-01', days: [] }, D), false);
});

test('date helpers cross month and year boundaries', () => {
  assert.equal(L.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(L.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(L.addDays('2028-02-28', 1), '2028-02-29');
});

/* ---------- backup export / import ---------- */

const sample = () => ({
  settings: { theme: 'sage', tab: 'todo' },
  tasks: [{ id: 'a', name: 'Drink water ☕', type: 'count', goal: 8, unit: 'glasses', created: '2026-03-01' }],
  routines: [{ id: 'r', name: 'Yoga', repeat: 'weekly', days: [MON], start: '2026-03-01' }],
  log: { [D]: { t: { a: 5 }, r: {} } },
  earned: [{ date: D, sticker: 's9' }],
  cal: { [D]: { emoji: '😊', text: 'Tëst ♡' } },
  'page:p1': { strokes: [[1, 2, 3]], items: [{ k: 'sticker', id: 's9', x: 10.5 }] },
});

test('backup round trip returns identical data', () => {
  const data = sample();
  const file = L.buildBackup(data, new Date('2026-03-10T12:00:00Z'));
  const back = L.parseBackup(file);
  assert.deepEqual(back.data, data);
  assert.equal(back.app, 'custom-mood');
  assert.equal(back.version, 1);
  assert.equal(back.exported, '2026-03-10T12:00:00.000Z');
});

test('backup survives being written to and read from a file as text', () => {
  const data = sample();
  const back = L.parseBackup(Buffer.from(L.buildBackup(data), 'utf8').toString('utf8'));
  assert.deepEqual(back.data, data);
});

test('import rejects files that are not Custom Mood backups', () => {
  for (const bad of ['', 'not json', '[]', 'null', '{}', '{"app":"other","data":{}}',
    '{"app":"custom-mood"}', '{"app":"custom-mood","data":null}', '{"app":"custom-mood","data":"x"}', '{"app":"custom-mood","data":[]}']) {
    assert.equal(L.parseBackup(bad), null, 'should reject: ' + bad);
  }
});

test('empty backup is accepted (restores an empty app)', () => {
  const back = L.parseBackup(L.buildBackup({}));
  assert.deepEqual(back.data, {});
});
