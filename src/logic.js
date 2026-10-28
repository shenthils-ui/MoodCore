/* Custom Mood rules without any screen code: dates, routine repeats, the daily
   sticker rule and the backup file format. build.py puts this in front of
   app.js, and tests/ loads the same file in Node. */
const CMLogic = (function () {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const wdIdx = s => (parse(s).getDay() + 6) % 7; // Monday = 0
  const weekOfMonth = s => Math.ceil(parse(s).getDate() / 7);
  function isLastWeek(s) { const d = parse(s); const n = new Date(d); n.setDate(d.getDate() + 7); return n.getMonth() !== d.getMonth(); }

  /* Does routine r happen on date d (YYYY-MM-DD)? */
  function routineOn(r, d) {
    if (d < r.start || (r.deleted && d >= r.deleted)) return false;
    const wd = wdIdx(d);
    switch (r.repeat) {
      case 'daily': return true;
      case 'weekly': return r.days.includes(wd);
      case 'monthly': return r.days.includes(wd) && (r.nth === 5 ? isLastWeek(d) : weekOfMonth(d) === r.nth);
      case 'yearly': { const a = parse(r.start), b = parse(d); return a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    }
    return false;
  }

  /* To-dos only. Routines are never part of the sticker rule. */
  const activeTasks = (tasks, d) => tasks.filter(t => t.created <= d && (!t.deleted || d < t.deleted));
  function taskDone(t, log, d) {
    const v = log[d] && log[d].t[t.id];
    return t.type === 'check' ? !!v : (+v || 0) >= t.goal;
  }
  function allDone(tasks, log, d) { const ts = activeTasks(tasks, d); return ts.length > 0 && ts.every(t => taskDone(t, log, d)); }

  /* Is a sticker due for date d? Once per day, never for a future day, only when
     the day has at least one to-do and all are done. A sticker already given is
     never taken back, so un-ticking later does not remove it. */
  function rewardDue(d, todayStr, earned, tasks, log) {
    if (d > todayStr || earned.some(e => e.date === d)) return false;
    return allDone(tasks, log, d);
  }

  /* Backup file: one JSON document holding every stored key. */
  function buildBackup(data, now) { return JSON.stringify({ app: 'custom-mood', version: 1, exported: (now || new Date()).toISOString(), data }); }
  function parseBackup(text) {
    let obj; try { obj = JSON.parse(text); } catch (e) { return null; }
    if (!obj || obj.app !== 'custom-mood' || !obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) return null;
    return obj;
  }

  const api = { pad, ymd, parse, addDays, wdIdx, weekOfMonth, isLastWeek, routineOn, activeTasks, taskDone, allDone, rewardDue, buildBackup, parseBackup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();
