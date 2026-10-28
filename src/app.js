/* Custom Mood: journal, sticker book, to-dos and routines, calendar.
   Everything is stored on the device in IndexedDB. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const wdIdx = s => (parse(s).getDay() + 6) % 7; // Monday = 0
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WDL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const PW = 360, PH = 560; // page coordinate space

  const ic = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${d}</svg>`;
  const I = {
    book: ic('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M10 8h5"/>'),
    sticker: ic('<path d="M20 12a8 8 0 1 1-8-8h3l5 5z"/><path d="M15 4v3a2 2 0 0 0 2 2h3"/><path d="M9 13.5c.8 1 2 1.5 3 1.5s2.2-.5 3-1.5"/><path d="M9 10h.01M14 10h.01"/>'),
    todo: ic('<path d="M4 6l2 2 3-3"/><path d="M4 13l2 2 3-3"/><path d="M12 7h8M12 14h8M5 20h15"/>'),
    cal: ic('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M12 13.2c-.7-1-2.4-.8-2.4.6 0 1.3 2.4 2.7 2.4 2.7s2.4-1.4 2.4-2.7c0-1.4-1.7-1.6-2.4-.6z"/>'),
    gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    left: ic('<path d="M15 18l-6-6 6-6"/>'), right: ic('<path d="M9 18l6-6-6-6"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'), check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'), trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'), redo: ic('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    hand: ic('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5v-7a1.5 1.5 0 0 1 3 0V12"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8"/><path d="M8 13l-1.6-1.6a1.6 1.6 0 0 0-2.3 2.2L8 18a5 5 0 0 0 4 2h1a5 5 0 0 0 5-5v-3.5a1.5 1.5 0 0 1 3 0"/>'),
    brush: ic('<path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L12 16l-4-4z"/><path d="M8 12c-2.5 0-4 1.6-4 4 0 1.3-.6 2.6-2 3 4.5 1.2 9-1 8-5"/>'),
    eraser: ic('<path d="M20 20H9L4.3 15.3a1.5 1.5 0 0 1 0-2.1L13.2 4.3a1.5 1.5 0 0 1 2.1 0l4.4 4.4a1.5 1.5 0 0 1 0 2.1L11 19.6"/><path d="M8.5 9.5l6 6"/>'),
    text: ic('<path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/>'),
    shapes: ic('<rect x="3.5" y="12" width="8" height="8" rx="1.5"/><circle cx="16.5" cy="7.5" r="4"/><path d="M14 20l3-6 3 6z"/>'),
    star: ic('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>'),
    paper: ic('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>'),
    rotate: ic('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', 'stroke-width="2.6"'),
    front: ic('<path d="M12 19V6M6 11l6-6 6 6"/>', 'stroke-width="2.6"'),
    pencil: ic('<path d="M4 20l1-5L16 4l4 4L9 19z"/>', 'stroke-width="2.4"'),
    done: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"')
  };

  /* ---------------- storage ---------------- */
  const DB = {
    db: null, mem: {},
    open() {
      return new Promise(res => {
        try {
          const r = indexedDB.open('custom-mood', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => { this.db = r.result; res(); };
          r.onerror = () => res();
          r.onblocked = () => res();
        } catch (e) { res(); }
      });
    },
    get(k) {
      if (!this.db) return Promise.resolve(this.mem[k]);
      return new Promise(res => {
        try { const q = this.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(this.mem[k]); }
        catch (e) { res(this.mem[k]); }
      });
    },
    set(k, v) {
      this.mem[k] = v;
      if (!this.db) return Promise.resolve();
      return new Promise(res => {
        try { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; }
        catch (e) { res(); }
      });
    },
    del(k) {
      delete this.mem[k];
      if (!this.db) return Promise.resolve();
      return new Promise(res => {
        try { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = res; }
        catch (e) { res(); }
      });
    },
    keys() {
      if (!this.db) return Promise.resolve(Object.keys(this.mem));
      return new Promise(res => {
        try { const q = this.db.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = () => res(q.result.map(String)); q.onerror = () => res([]); }
        catch (e) { res([]); }
      });
    }
  };
  const S = {}; // settings, journal, tasks, routines, log, earned, cal
  const PAGES = {};
  const saveTimers = {};
  function save(k) {
    clearTimeout(saveTimers[k]);
    saveTimers[k] = setTimeout(() => DB.set(k, S[k]), 150);
  }
  async function getPage(id) {
    if (PAGES[id]) return PAGES[id];
    const p = await DB.get('page:' + id);
    PAGES[id] = p || blankPage(id);
    return PAGES[id];
  }
  function savePage(p) { PAGES[p.id] = p; return DB.set('page:' + p.id, p); }
  function blankPage(id) { return { id: id || uid(), paper: 'lined', pc: '', els: [], ink: null }; }

  /* ---------------- seed data for a first run ---------------- */
  function seed() {
    const t = today();
    S.settings = { theme: 'beige', tab: 'journal', recent: [] };
    const p1 = blankPage();
    p1.els = [
      { id: uid(), type: 'text', text: 'hello, new journal ♡', x: 180, y: 70, w: 280, fs: 38, font: 'hand', color: '#8a5f40', style: 'plain', align: 'center', rot: -3 },
      { id: uid(), type: 'sticker', sid: 'bow.coquette', x: 70, y: 150, w: 86, h: 86, rot: -12 },
      { id: uid(), type: 'text', text: 'tap this page to start writing,\ndrawing and adding stickers', x: 190, y: 270, w: 250, fs: 22, font: 'cute', color: '#5a4636', style: 'note', align: 'center', rot: 2 },
      { id: uid(), type: 'sticker', sid: 'cherries.cherry', x: 290, y: 410, w: 80, h: 80, rot: 10 },
      { id: uid(), type: 'sticker', sid: 'daisy.sage', x: 80, y: 450, w: 76, h: 76, rot: -6 }
    ];
    const cover = { id: 'cover', color: '', pattern: 'gingham', els: [
      { id: uid(), type: 'sticker', sid: 'gingham-bow.coquette', x: 300, y: 60, w: 96, h: 96, rot: 14 },
      { id: uid(), type: 'sticker', sid: 'strawberry.cherry', x: 70, y: 470, w: 80, h: 80, rot: -10 },
      { id: uid(), type: 'sticker', sid: 'star.cozy', x: 280, y: 480, w: 66, h: 66, rot: 8 },
      { id: uid(), type: 'sticker', sid: 'polaroid.sage', x: 180, y: 330, w: 120, h: 120, rot: -4 }
    ], ink: null };
    S.journal = { title: 'my journal', pages: [p1.id] };
    PAGES[p1.id] = p1; PAGES.cover = cover;
    DB.set('page:' + p1.id, p1); DB.set('page:cover', cover);
    S.tasks = [
      { id: uid(), name: 'Study', emoji: '📚', type: 'count', goal: 2, unit: 'hours', created: t, deleted: null },
      { id: uid(), name: 'Drink water', emoji: '💧', type: 'count', goal: 8, unit: 'bottles', created: t, deleted: null },
      { id: uid(), name: 'Read', emoji: '📖', type: 'count', goal: 20, unit: 'pages', created: t, deleted: null },
      { id: uid(), name: 'Make something', emoji: '🎨', type: 'check', goal: 1, unit: '', created: t, deleted: null }
    ];
    S.routines = [
      { id: uid(), name: 'Homework', emoji: '✏️', days: [0, 1, 2, 3, 4], from: '16:00', to: '17:00', repeat: 'weekly', nth: 1, start: t, deleted: null }
    ];
    S.log = {}; S.earned = []; S.cal = {};
    ['settings', 'journal', 'tasks', 'routines', 'log', 'earned', 'cal'].forEach(k => DB.set(k, S[k]));
  }
  async function load() {
    await DB.open();
    S.settings = await DB.get('settings');
    if (!S.settings) { seed(); return; }
    S.settings.recent = S.settings.recent || [];
    S.journal = (await DB.get('journal')) || { title: 'my journal', pages: [] };
    S.tasks = (await DB.get('tasks')) || [];
    S.routines = (await DB.get('routines')) || [];
    S.log = (await DB.get('log')) || {};
    S.earned = (await DB.get('earned')) || [];
    S.cal = (await DB.get('cal')) || {};
  }

  /* ---------------- UI helpers ---------------- */
  let toastTimer;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  const SHEETS = [];
  function openSheet({ title, body, foot, onMount, onClose }) {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', title || 'Sheet');
    sh.innerHTML = `<div class="grab"></div><div class="sheet-head"><h2>${esc(title || '')}</h2><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div><div class="sheet-body">${body || ''}</div>${foot ? `<div class="sheet-foot">${foot}</div>` : ''}`;
    document.body.append(scrim, sh);
    const api = {
      el: sh, closed: false,
      close() {
        if (api.closed) return; api.closed = true;
        sh.classList.remove('show'); scrim.classList.remove('show');
        setTimeout(() => { sh.remove(); scrim.remove(); }, 260);
        const i = SHEETS.indexOf(api); if (i >= 0) SHEETS.splice(i, 1);
        onClose && onClose();
      }
    };
    SHEETS.push(api);
    scrim.addEventListener('click', () => api.close());
    sh.querySelector('[data-close]').addEventListener('click', () => api.close());
    requestAnimationFrame(() => { sh.classList.add('show'); scrim.classList.add('show'); });
    onMount && onMount(sh, api);
    return api;
  }
  /* Double tap detection that works with fingers and mouse. */
  function onTaps(el, { single, double }) {
    let last = 0, lx = 0, ly = 0, sx = 0, sy = 0, timer = null;
    el.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    el.addEventListener('pointerup', e => {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 14) return;
      const now = Date.now();
      if (now - last < 380 && Math.hypot(e.clientX - lx, e.clientY - ly) < 40) {
        clearTimeout(timer); last = 0; double && double(e);
      } else {
        last = now; lx = e.clientX; ly = e.clientY;
        clearTimeout(timer); timer = setTimeout(() => single && single(e), 390);
      }
    });
  }
  function scaleInners(root) {
    $$('.page-box', root).forEach(b => {
      const inner = b.querySelector(':scope > .page-inner');
      if (inner && b.clientWidth) inner.style.transform = `scale(${b.clientWidth / PW})`;
    });
  }
  const COLORS = ['#3a2a20', '#ffffff', '#f4a7b9', '#e05a7a', '#d8293f', '#f6c28b', '#f3d36b', '#a8c99a', '#5f7a57', '#a9d1f2', '#33508f', '#c3aee3', '#8a6244', '#c9a27e', '#9e9e9e', '#111111'];
  const PASTELS = ['#f4a7b9', '#fcd5de', '#cfe3f6', '#d8e4cf', '#e9def7', '#fff1b8', '#eddcc4', '#f6c28b'];
  const swatches = (sel, attr, list) => (list || COLORS).map(c => `<button class="swatch" style="background:${c}" ${attr}="${c}" aria-label="Colour ${c}" aria-pressed="${c === sel}"></button>`).join('');

  /* ---------------- page rendering ---------------- */
  const FONTS = { hand: 'var(--f-hand)', cute: 'var(--f-cute)', serif: 'var(--f-serif)', ui: 'var(--f-ui)' };
  const HEART_D = 'M50 92 C18 70 4 50 8 30 C12 12 36 6 50 26 C64 6 88 12 92 30 C96 50 82 70 50 92Z';
  function shapeSVG(el) {
    const w = el.w, h = el.h, sw = el.sw || 4, c = el.color || '#3a2a20';
    const fill = el.fill ? `fill="${c}" fill-opacity=".32"` : 'fill="none"';
    const st = `stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
    let d = '';
    switch (el.kind) {
      case 'rect': d = `<rect x="${sw / 2}" y="${sw / 2}" width="${Math.max(1, w - sw)}" height="${Math.max(1, h - sw)}" rx="${Math.min(14, w / 4, h / 4)}" ${fill} ${st}/>`; break;
      case 'ellipse': d = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${Math.max(1, w / 2 - sw / 2)}" ry="${Math.max(1, h / 2 - sw / 2)}" ${fill} ${st}/>`; break;
      case 'line': d = `<line x1="${sw}" y1="${h / 2}" x2="${w - sw}" y2="${h / 2}" ${st}/>`; break;
      case 'arrow': { const a = Math.min(16 + sw * 1.5, w / 2); d = `<line x1="${sw}" y1="${h / 2}" x2="${w - sw}" y2="${h / 2}" ${st}/><polyline points="${w - sw - a},${h / 2 - a * .6} ${w - sw},${h / 2} ${w - sw - a},${h / 2 + a * .6}" fill="none" ${st}/>`; break; }
      case 'heart': d = `<g transform="scale(${w / 100} ${h / 100})"><path d="${HEART_D}" ${fill} ${st}/></g>`; break;
      case 'star': {
        const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 20 : 48, a = -Math.PI / 2 + i * Math.PI / 5; pts.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (53 + r * Math.sin(a)).toFixed(1)); }
        d = `<g transform="scale(${w / 100} ${h / 100})"><polygon points="${pts.join(' ')}" ${fill} ${st}/></g>`; break;
      }
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${d}</svg>`;
  }
  function elStyle(el) {
    let s = `left:${el.x}px;top:${el.y}px;width:${el.w}px;${el.type !== 'text' ? `height:${el.h}px;` : ''}transform:translate(-50%,-50%) rotate(${el.rot || 0}deg);`;
    if (el.type === 'text') s += `font-family:${FONTS[el.font] || FONTS.hand};font-size:${el.fs}px;color:${el.color};text-align:${el.align || 'center'};--lc:${el.lc || '#f4a7b9'};`;
    return s;
  }
  function elInner(el) {
    if (el.type === 'sticker') return `<img src="${Stickers.url(el.sid)}" alt="" draggable="false">`;
    if (el.type === 'text') return esc(el.text || ' ');
    if (el.type === 'shape') return shapeSVG(el);
    return '';
  }
  function elHTML(el, selected) {
    const cls = 'el ' + el.type + (el.type === 'text' ? ' ' + (el.style || 'plain') : '');
    let handles = '';
    if (selected) {
      handles = `<div class="sel-box"></div><button class="handle h-del" data-h="del" aria-label="Delete">${I.x}</button><button class="handle h-rot" data-h="rot" aria-label="Resize and turn">${I.rotate}</button><button class="handle h-front" data-h="front" aria-label="Bring to front">${I.front}</button>${el.type === 'text' ? `<button class="handle h-edit" data-h="edit" aria-label="Edit text">${I.pencil}</button>` : ''}`;
    }
    return `<div class="${cls}" data-id="${el.id}" style="${elStyle(el)}">${elInner(el)}${handles}</div>`;
  }
  function paperHTML(pg, isCover) {
    if (isCover) return `<div class="paper ${esc(pg.pattern || 'plain')}" style="--pc:${pg.color || 'var(--cover)'}"></div>`;
    return `<div class="paper ${esc(pg.paper || 'plain')}" style="${pg.pc ? `--pc:${pg.pc}` : ''}"></div>`;
  }
  function pageInnerHTML(pg, isCover) {
    return `${paperHTML(pg, isCover)}${pg.ink ? `<img class="ink" src="${pg.ink}" alt="">` : ''}<div class="els">${(pg.els || []).map(e => elHTML(e)).join('')}</div>`;
  }

  /* ---------------- app shell ---------------- */
  const TABS = [['journal', 'Journal', I.book], ['stickers', 'Stickers', I.sticker], ['todo', 'To-do', I.todo], ['calendar', 'Calendar', I.cal]];
  let view;
  function shell() {
    const root = document.createElement('div'); document.body.appendChild(root);
    root.innerHTML = `<div class="app">
      <header class="top"><div class="brand" aria-label="Custom Mood">♡𝓒𝓾𝓼𝓽𝓸𝓶 𝓜𝓸𝓸𝓭 ♡</div><button class="icon-btn" id="setBtn" aria-label="Settings">${I.gear}</button></header>
      <main class="view" id="view"></main>
      <nav class="nav" role="tablist">${TABS.map(([id, l, i]) => `<button role="tab" data-tab="${id}" aria-selected="false">${i}<span>${l}</span></button>`).join('')}</nav>
    </div>`;
    view = $('#view');
    $$('.nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
    $('#setBtn').addEventListener('click', openSettings);
  }
  function go(tab) {
    S.settings.tab = tab; save('settings');
    $$('.nav button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    const fab = $('#fab'); if (fab) fab.remove();
    view.scrollTop = 0;
    view.className = 'view';
    ({ journal: renderJournal, stickers: renderStickerBook, todo: renderTodo, calendar: renderCalendar })[tab]();
  }
  function rerender() { go(S.settings.tab || 'journal'); }
  function applyTheme() {
    document.documentElement.dataset.mood = S.settings.theme || 'beige';
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
      window.AndroidBridge && window.AndroidBridge.setBarColor && window.AndroidBridge.setBarColor(bg, S.settings.theme === 'vibrant');
    } catch (e) { /* not in the Android shell */ }
  }

  /* ================= JOURNAL ================= */
  const J = { open: false, idx: 0, anim: false };
  function coverHTML(title, sub) {
    return `<div class="book-cover" id="cov"><div class="spine"></div><div class="page-box" style="position:absolute;inset:0"><div class="page-inner">${pageInnerHTML(PAGES.cover || { els: [] }, true)}</div></div><div class="cover-title"><div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div></div>`;
  }
  async function renderJournal() {
    await getPage('cover');
    if (!J.open) {
      view.className = 'view center';
      view.innerHTML = `<div class="book-wrap">${coverHTML(S.journal.title || 'my journal', S.journal.pages.length + (S.journal.pages.length === 1 ? ' page' : ' pages'))}</div>
        <p class="hint">double tap the cover to open ♡</p>
        <button class="btn soft" id="custCover" style="margin-top:10px">${I.pencil} Customise cover</button>`;
      scaleInners(view);
      const cov = $('#cov');
      onTaps(cov, {
        single: () => { cov.classList.remove('wiggle'); void cov.offsetWidth; cov.classList.add('wiggle'); toast('Double tap to open ♡'); },
        double: () => { cov.classList.add('opening'); setTimeout(() => { J.open = true; renderJournal(); }, 380); }
      });
      $('#custCover').addEventListener('click', openCoverSheet);
      return;
    }
    view.className = 'view center';
    J.idx = Math.min(J.idx, S.journal.pages.length);
    view.innerHTML = `<div class="reader">
      <div class="flip-stage" id="fstage"></div>
      <div class="pager"><button class="icon-btn" id="pPrev" aria-label="Previous page">${I.left}</button><span class="num" id="pNum"></span><button class="icon-btn" id="pNext" aria-label="Next page">${I.right}</button></div>
      <div class="row wrap" style="justify-content:center"><button class="btn soft" id="pClose">${I.book} Close</button><button class="btn" id="pAdd">${I.plus} New page</button><button class="icon-btn" id="pDel" aria-label="Delete this page">${I.trash}</button></div>
      <p class="small" style="margin:0">Tap a page to edit it. Swipe to turn pages.</p></div>`;
    const stage = $('#fstage');
    stage.appendChild(await makeFlipPage(J.idx));
    scaleInners(stage);
    updatePager();
    let sx = 0, sy = 0, st = 0;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
    stage.addEventListener('pointerup', e => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) flipTo(J.idx + (dx < 0 ? 1 : -1));
      else if (Math.hypot(dx, dy) < 12 && Date.now() - st < 600) {
        if (J.idx >= S.journal.pages.length) addPage();
        else editPage(S.journal.pages[J.idx]);
      }
    });
    $('#pPrev').addEventListener('click', () => flipTo(J.idx - 1));
    $('#pNext').addEventListener('click', () => flipTo(J.idx + 1));
    $('#pClose').addEventListener('click', () => { J.open = false; renderJournal(); });
    $('#pAdd').addEventListener('click', addPage);
    $('#pDel').addEventListener('click', confirmDeletePage);
  }
  function updatePager() {
    const n = S.journal.pages.length;
    $('#pNum').textContent = J.idx >= n ? 'new page' : `${J.idx + 1} / ${n}`;
    $('#pPrev').disabled = J.idx <= 0; $('#pNext').disabled = J.idx >= n;
    $('#pDel').disabled = J.idx >= n;
  }
  async function makeFlipPage(i) {
    const d = document.createElement('div'); d.className = 'flip-page';
    if (i >= S.journal.pages.length) {
      d.innerHTML = `<div class="newpage"><div><b>+ new page</b>tap to add a fresh page</div></div>`;
      return d;
    }
    const pg = await getPage(S.journal.pages[i]);
    d.innerHTML = `<div class="page-box" style="position:absolute;inset:0"><div class="page-inner">${pageInnerHTML(pg)}</div></div><div class="page-holes">${'<i></i>'.repeat(7)}</div>`;
    return d;
  }
  async function flipTo(n) {
    if (J.anim || n < 0 || n > S.journal.pages.length || n === J.idx) return;
    J.anim = true;
    const stage = $('#fstage'); const old = stage.lastElementChild;
    const nu = await makeFlipPage(n);
    if (n > J.idx) {
      stage.insertBefore(nu, stage.firstChild); scaleInners(stage);
      requestAnimationFrame(() => old.classList.add('turn-out'));
    } else {
      nu.classList.add('turn-in'); stage.appendChild(nu); scaleInners(stage);
      void nu.offsetWidth; nu.classList.add('go');
    }
    J.idx = n; updatePager();
    setTimeout(() => { if (n > J.idx - 1) old.remove(); $$('.flip-page', stage).forEach(p => { if (p !== nu) p.remove(); }); nu.classList.remove('turn-in', 'go'); J.anim = false; }, 470);
  }
  async function addPage() {
    const p = blankPage();
    await savePage(p);
    S.journal.pages.push(p.id); save('journal');
    J.idx = S.journal.pages.length - 1;
    editPage(p.id);
  }
  function confirmDeletePage() {
    if (J.idx >= S.journal.pages.length) return;
    const sh = openSheet({
      title: 'Delete this page?',
      body: `<p style="margin:0">Page ${J.idx + 1} and everything on it will be removed. This cannot be undone.</p>`,
      foot: `<button class="btn soft" data-no>Keep it</button><button class="btn" data-yes style="background:#c0475f;color:#fff">Delete page</button>`,
      onMount: (el, api) => {
        $('[data-no]', el).addEventListener('click', () => api.close());
        $('[data-yes]', el).addEventListener('click', async () => {
          const id = S.journal.pages.splice(J.idx, 1)[0];
          delete PAGES[id]; DB.del('page:' + id); save('journal');
          J.idx = Math.max(0, Math.min(J.idx, S.journal.pages.length - 1));
          api.close(); renderJournal(); toast('Page deleted');
        });
      }
    });
    return sh;
  }
  async function editPage(id) {
    const pg = await getPage(id);
    openEditor(pg, false, () => { savePage(pg); renderJournal(); });
  }
  const COVER_COLORS = ['', '#f4a7b9', '#e8c0c8', '#d8293f', '#33508f', '#1b2b57', '#9db592', '#c9a27e', '#8a6244', '#a9d1f2', '#c3aee3', '#fff1d6', '#2b2b2b'];
  const PATTERNS = [['plain', 'Plain'], ['gingham', 'Gingham'], ['dots', 'Dots'], ['stripes', 'Stripes'], ['hearts', 'Hearts']];
  function openCoverSheet() {
    const cv = PAGES.cover;
    openSheet({
      title: 'Customise cover',
      body: `<div class="field"><label for="cvTitle">Title</label><input class="input" id="cvTitle" maxlength="40" value="${esc(S.journal.title)}"></div>
        <div class="field"><span class="lbl">Cover colour</span><div class="row wrap">${COVER_COLORS.map(c => `<button class="swatch" data-cc="${c}" style="background:${c || 'var(--cover)'}" aria-label="${c ? 'Colour ' + c : 'Theme colour'}" aria-pressed="${(cv.color || '') === c}"></button>`).join('')}
          <label class="swatch custom" aria-label="Pick any colour"><input type="color" id="cvCustom" value="${cv.color || '#f4a7b9'}"></label></div></div>
        <div class="field"><span class="lbl">Pattern</span><div class="row wrap">${PATTERNS.map(([k, l]) => `<button class="chip" data-cp="${k}" aria-pressed="${(cv.pattern || 'plain') === k}">${l}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Decorate</span><button class="btn soft" id="cvDeco">${I.star} Stickers, drawing and text on the cover</button></div>`,
      foot: `<button class="btn" data-close2>Done</button>`,
      onMount: (el, api) => {
        const refresh = () => { savePage(cv); save('journal'); renderJournal(); };
        $('#cvTitle', el).addEventListener('input', e => { S.journal.title = e.target.value; refresh(); });
        el.addEventListener('click', e => {
          const c = e.target.closest('[data-cc]'); const p = e.target.closest('[data-cp]');
          if (c) { cv.color = c.dataset.cc; $$('[data-cc]', el).forEach(b => b.setAttribute('aria-pressed', String(b === c))); refresh(); }
          if (p) { cv.pattern = p.dataset.cp; $$('[data-cp]', el).forEach(b => b.setAttribute('aria-pressed', String(b === p))); refresh(); }
        });
        $('#cvCustom', el).addEventListener('input', e => { cv.color = e.target.value; $$('[data-cc]', el).forEach(b => b.setAttribute('aria-pressed', 'false')); refresh(); });
        $('#cvDeco', el).addEventListener('click', () => { api.close(); openEditor(cv, true, () => { savePage(cv); renderJournal(); }); });
        $('[data-close2]', el).addEventListener('click', () => api.close());
      }
    });
  }

  /* ================= EDITOR ================= */
  const BRUSHES = [['pen', 'Pen'], ['marker', 'Marker'], ['pencil', 'Pencil'], ['crayon', 'Crayon'], ['highlighter', 'Highlighter'], ['spray', 'Spray']];
  const SHAPES = [['rect', '▭ Box'], ['ellipse', '◯ Circle'], ['line', '╱ Line'], ['arrow', '→ Arrow'], ['heart', '♡ Heart'], ['star', '☆ Star']];
  const E = { tool: 'draw', brush: 'pen', color: '#3a2a20', size: 4, eSize: 18, shape: 'rect', shapeFill: false, font: 'hand' };
  let ED = null; // live editor state
  function openEditor(pg, isCover, onDone) {
    const ed = document.createElement('div'); ed.className = 'editor';
    ed.innerHTML = `<div class="ed-top">
        <button class="btn" id="edDone">${I.done} Done</button><div class="grow"></div>
        <button class="icon-btn" id="edUndo" aria-label="Undo">${I.undo}</button><button class="icon-btn" id="edRedo" aria-label="Redo">${I.redo}</button>
        <button class="icon-btn" id="edPaper" aria-label="${isCover ? 'Cover style' : 'Paper style'}">${I.paper}</button></div>
      <div class="ed-stage" id="edStage"><div class="ed-page page-box" id="edPage"><div class="page-inner" id="edInner">
        <div id="edPaperEl"></div><canvas class="ink-cv" width="${PW * 2}" height="${PH * 2}"></canvas><canvas class="stroke-cv" width="${PW * 2}" height="${PH * 2}"></canvas><div class="els" id="edEls"></div>
      </div></div></div>
      <div class="ed-tools"><div id="edSub"></div><div class="toolrow" role="toolbar">
        ${[['select', 'Move', I.hand], ['draw', 'Draw', I.brush], ['eraser', 'Eraser', I.eraser], ['text', 'Text', I.text], ['shape', 'Shapes', I.shapes], ['stickers', 'Stickers', I.star]].map(([k, l, i]) => `<button class="tool" data-tool="${k}" aria-pressed="false">${i}<span>${l}</span></button>`).join('')}
      </div></div>`;
    document.body.appendChild(ed);
    const inkCv = $('.ink-cv', ed), strokeCv = $('.stroke-cv', ed);
    const ink = inkCv.getContext('2d'), sctx = strokeCv.getContext('2d');
    ink.setTransform(2, 0, 0, 2, 0, 0); sctx.setTransform(2, 0, 0, 2, 0, 0);
    ED = { pg, isCover, ed, ink, sctx, inkCv, strokeCv, sel: null, hist: [], fut: [], inkEmpty: !pg.ink, inkDirty: false, scale: 1, onDone };
    const drawPaper = () => { $('#edPaperEl', ed).innerHTML = paperHTML(pg, isCover) + (isCover ? '' : ''); };
    drawPaper(); ED.drawPaper = drawPaper;
    if (pg.ink) loadImg(pg.ink).then(img => { ink.drawImage(img, 0, 0, PW, PH); });
    renderEls();
    const fit = () => {
      const st = $('#edStage', ed); const aw = st.clientWidth - 24, ah = st.clientHeight - 8;
      const s = Math.max(.3, Math.min(aw / PW, ah / PH)); ED.scale = s;
      const p = $('#edPage', ed); p.style.width = PW * s + 'px'; p.style.height = PH * s + 'px';
      $('#edInner', ed).style.transform = `scale(${s})`;
    };
    ED.fit = fit;
    requestAnimationFrame(fit); window.addEventListener('resize', fit);
    setTool(E.tool === 'stickers' ? 'select' : E.tool);
    $$('.tool', ed).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.tool === 'stickers') { openStickerDrawer(); return; }
      setTool(b.dataset.tool);
    }));
    $('#edDone', ed).addEventListener('click', closeEditor);
    $('#edUndo', ed).addEventListener('click', undo);
    $('#edRedo', ed).addEventListener('click', redo);
    $('#edPaper', ed).addEventListener('click', () => isCover ? openCoverSheet2() : openPaperSheet());
    bindEditorPointer();
    updateUndo();
  }
  function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  function commitInk() {
    if (!ED) return;
    if (ED.inkDirty) { ED.pg.ink = ED.inkEmpty ? null : ED.inkCv.toDataURL('image/png'); ED.inkDirty = false; }
  }
  function closeEditor() {
    if (!ED) return;
    commitInk(); ED.sel = null;
    const done = ED.onDone; ED.ed.remove(); window.removeEventListener('resize', ED.fit); ED = null;
    done && done();
  }
  function snapshot() { return { els: JSON.stringify(ED.pg.els), ink: ED.inkEmpty ? null : ED.inkCv.toDataURL('image/png') }; }
  function pushHist() { ED.hist.push(snapshot()); if (ED.hist.length > 25) ED.hist.shift(); ED.fut = []; updateUndo(); }
  async function restore(snap) {
    ED.pg.els = JSON.parse(snap.els); ED.sel = null;
    ED.ink.clearRect(0, 0, PW, PH);
    if (snap.ink) { const img = await loadImg(snap.ink); if (img) ED.ink.drawImage(img, 0, 0, PW, PH); }
    ED.inkEmpty = !snap.ink; ED.inkDirty = true; renderEls(); updateUndo();
  }
  function undo() { if (!ED || !ED.hist.length) return; ED.fut.push(snapshot()); restore(ED.hist.pop()); }
  function redo() { if (!ED || !ED.fut.length) return; ED.hist.push(snapshot()); restore(ED.fut.pop()); }
  function updateUndo() { if (!ED) return; $('#edUndo', ED.ed).disabled = !ED.hist.length; $('#edRedo', ED.ed).disabled = !ED.fut.length; }
  function renderEls() {
    if (!ED) return;
    $('#edEls', ED.ed).innerHTML = ED.pg.els.map(e => elHTML(e, e.id === ED.sel)).join('');
    $('#edEls', ED.ed).style.pointerEvents = E.tool === 'select' ? 'auto' : 'none';
  }
  function updateElNode(el) {
    const n = $(`.el[data-id="${el.id}"]`, ED.ed); if (!n) return;
    n.style.cssText = elStyle(el);
    if (el.type === 'shape') { const svg = n.querySelector('svg'); if (svg) svg.outerHTML = shapeSVG(el); }
  }
  function setTool(t) {
    E.tool = t;
    if (t !== 'select') ED.sel = null;
    $$('.tool', ED.ed).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    renderEls(); renderSub();
  }
  function renderSub() {
    const sub = $('#edSub', ED.ed); const t = E.tool;
    const colorRow = `<div class="subrow">${swatches(E.color, 'data-col')}<label class="swatch custom" aria-label="Pick any colour"><input type="color" id="edCustom" value="${/^#[0-9a-f]{6}$/i.test(E.color) ? E.color : '#f4a7b9'}"></label></div>`;
    let html = '';
    if (t === 'draw') html = `<div class="subrow">${BRUSHES.map(([k, l]) => `<button class="chip" data-brush="${k}" aria-pressed="${E.brush === k}">${l}</button>`).join('')}<input type="range" class="size-range" id="edSize" min="1" max="24" value="${E.size}" aria-label="Brush size"></div>` + colorRow;
    else if (t === 'eraser') html = `<div class="subrow"><span class="small">Size</span><input type="range" class="size-range" id="edESize" min="6" max="60" value="${E.eSize}" aria-label="Eraser size"><button class="chip" id="edClear">Clear all drawing</button></div><div class="subrow"><span class="small">The eraser removes drawing only. Use Move to delete stickers and text.</span></div>`;
    else if (t === 'text') html = `<div class="subrow"><span class="small">Tap the page to add text.</span>${[['hand', 'Handwritten'], ['cute', 'Cute'], ['serif', 'Serif'], ['ui', 'Rounded']].map(([k, l]) => `<button class="chip" data-font="${k}" aria-pressed="${E.font === k}" style="font-family:${FONTS[k]}">${l}</button>`).join('')}</div>` + colorRow;
    else if (t === 'shape') html = `<div class="subrow">${SHAPES.map(([k, l]) => `<button class="chip" data-shape="${k}" aria-pressed="${E.shape === k}">${l}</button>`).join('')}<button class="chip" id="edFill" aria-pressed="${E.shapeFill}">Fill</button><input type="range" class="size-range" id="edSize" min="1" max="14" value="${Math.min(E.size, 14)}" aria-label="Line width"></div>` + colorRow;
    else html = `<div class="subrow"><span class="small">Tap a sticker, text or shape to select it. Drag to move. Drag the turn button to resize and rotate.</span></div><div class="subrow"><button class="chip" id="edAddSt">${'＋'} Add sticker</button></div>`;
    sub.innerHTML = html;
    sub.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.brush) { E.brush = b.dataset.brush; renderSub(); }
      else if (b.dataset.col) { E.color = b.dataset.col; recolorSelected(); renderSub(); }
      else if (b.dataset.font) { E.font = b.dataset.font; renderSub(); }
      else if (b.dataset.shape) { E.shape = b.dataset.shape; renderSub(); }
      else if (b.id === 'edFill') { E.shapeFill = !E.shapeFill; renderSub(); }
      else if (b.id === 'edClear') { pushHist(); ED.ink.clearRect(0, 0, PW, PH); ED.inkEmpty = true; ED.inkDirty = true; toast('Drawing cleared. Undo brings it back.'); }
      else if (b.id === 'edAddSt') openStickerDrawer();
    };
    const sz = $('#edSize', sub); if (sz) sz.oninput = e => { E.size = +e.target.value; };
    const es = $('#edESize', sub); if (es) es.oninput = e => { E.eSize = +e.target.value; };
    const cc = $('#edCustom', sub); if (cc) cc.oninput = e => { E.color = e.target.value; recolorSelected(); $$('[data-col]', sub).forEach(x => x.setAttribute('aria-pressed', 'false')); };
  }
  function recolorSelected() {
    if (!ED || !ED.sel) return;
    const el = ED.pg.els.find(x => x.id === ED.sel);
    if (el && (el.type === 'text' || el.type === 'shape')) { pushHist(); el.color = E.color; renderEls(); }
  }
  function pagePt(e) {
    const r = $('#edPage', ED.ed).getBoundingClientRect();
    return { x: (e.clientX - r.left) / ED.scale, y: (e.clientY - r.top) / ED.scale };
  }
  function bindEditorPointer() {
    const pageEl = $('#edPage', ED.ed);
    let mode = null, pts = [], start = null, target = null, orig = null, preview = null, pid = null, lastTap = { t: 0, id: null };
    pageEl.addEventListener('pointerdown', e => {
      if (!e.isPrimary || !ED) return;
      const p = pagePt(e); pid = e.pointerId;
      try { pageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (E.tool === 'draw' || E.tool === 'eraser') {
        pushHist(); mode = E.tool; pts = [p];
        if (mode === 'draw') beginStroke(p); else eraseAt(p, p);
      } else if (E.tool === 'text') {
        mode = 'tap'; start = p;
      } else if (E.tool === 'shape') {
        mode = 'shape'; start = p;
        preview = { id: 'tmp', type: 'shape', kind: E.shape, color: E.color, fill: E.shapeFill, sw: Math.min(E.size, 14), x: p.x, y: p.y, w: 2, h: 2, rot: 0 };
      } else if (E.tool === 'select') {
        const h = e.target.closest('.handle'); const n = e.target.closest('.el');
        if (h && n) {
          const el = ED.pg.els.find(x => x.id === n.dataset.id); if (!el) return;
          const act = h.dataset.h;
          if (act === 'del') { pushHist(); ED.pg.els = ED.pg.els.filter(x => x !== el); ED.sel = null; renderEls(); mode = null; return; }
          if (act === 'front') { pushHist(); ED.pg.els = ED.pg.els.filter(x => x !== el).concat(el); renderEls(); mode = null; return; }
          if (act === 'edit') { mode = null; openTextSheet(el, false); return; }
          if (act === 'rot') {
            pushHist(); mode = 'rot'; target = el;
            const nn = $(`.el[data-id="${el.id}"]`, ED.ed);
            orig = { w: el.w, h: el.h, fs: el.fs, rot: el.rot || 0, d: Math.hypot(p.x - el.x, p.y - el.y) || 1, a: Math.atan2(p.y - el.y, p.x - el.x), sw: el.sw, hh: nn ? nn.offsetHeight : 40 };
            return;
          }
        } else if (n) {
          const el = ED.pg.els.find(x => x.id === n.dataset.id); if (!el) return;
          const now = Date.now();
          if (el.type === 'text' && lastTap.id === el.id && now - lastTap.t < 380) { openTextSheet(el, false); lastTap = { t: 0, id: null }; mode = null; return; }
          lastTap = { t: now, id: el.id };
          if (ED.sel !== el.id) { ED.sel = el.id; renderEls(); }
          pushHist(); mode = 'move'; target = el; start = p; orig = { x: el.x, y: el.y }; ED.moved = false;
        } else {
          if (ED.sel) { ED.sel = null; renderEls(); }
          mode = null;
        }
      }
    });
    pageEl.addEventListener('pointermove', e => {
      if (!mode || e.pointerId !== pid || !ED) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const p = pagePt(ev);
        if (mode === 'draw') { pts.push(p); strokeTo(pts); }
        else if (mode === 'eraser') { eraseAt(pts[pts.length - 1], p); pts.push(p); }
      }
      const p = pagePt(e);
      if (mode === 'move') { target.x = clamp(orig.x + p.x - start.x, 0, PW); target.y = clamp(orig.y + p.y - start.y, 0, PH); ED.moved = true; updateElNode(target); }
      else if (mode === 'rot') {
        const s = clamp(Math.hypot(p.x - target.x, p.y - target.y) / orig.d, .2, 6);
        const da = (Math.atan2(p.y - target.y, p.x - target.x) - orig.a) * 180 / Math.PI;
        target.w = Math.max(16, orig.w * s);
        if (target.type === 'text') target.fs = clamp(orig.fs * s, 8, 160);
        else if (target.type === 'shape' && (target.kind === 'line' || target.kind === 'arrow')) target.h = orig.h;
        else target.h = Math.max(16, orig.h * s);
        target.rot = Math.round(orig.rot + da);
        if (Math.abs(target.rot % 90) < 4) target.rot = Math.round(target.rot / 90) * 90; // gentle snap
        updateElNode(target);
      } else if (mode === 'shape') {
        Object.assign(preview, shapeBox(E.shape, start, p, preview.sw));
        let n = $('.el[data-id="tmp"]', ED.ed);
        if (!n) { $('#edEls', ED.ed).insertAdjacentHTML('beforeend', elHTML(preview)); }
        else { n.style.cssText = elStyle(preview); n.innerHTML = shapeSVG(preview); }
      }
    });
    const end = e => {
      if (!mode || e.pointerId !== pid || !ED) { mode = null; return; }
      const p = pagePt(e);
      if (mode === 'draw') endStroke();
      else if (mode === 'eraser') { ED.inkDirty = true; }
      else if (mode === 'tap') {
        if (Math.hypot(p.x - start.x, p.y - start.y) < 12) {
          pushHist();
          const el = { id: uid(), type: 'text', text: '', x: clamp(p.x, 40, PW - 40), y: p.y, w: 220, fs: 28, font: E.font, color: E.color, style: 'plain', align: 'center', rot: 0, lc: '#f4a7b9' };
          ED.pg.els.push(el); openTextSheet(el, true);
        }
      } else if (mode === 'shape') {
        let box = shapeBox(E.shape, start, p, preview.sw);
        if (Math.hypot(p.x - start.x, p.y - start.y) < 10) box = shapeBox(E.shape, { x: start.x - 50, y: start.y - 40 }, { x: start.x + 50, y: start.y + 40 }, preview.sw);
        pushHist();
        const el = Object.assign({}, preview, box, { id: uid() });
        ED.pg.els.push(el); renderEls();
      } else if (mode === 'move' && !ED.moved) {
        ED.hist.pop(); updateUndo();
      }
      mode = null; preview = null;
    };
    pageEl.addEventListener('pointerup', end);
    pageEl.addEventListener('pointercancel', end);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function shapeBox(kind, a, b, sw) {
    if (kind === 'line' || kind === 'arrow') {
      const len = Math.max(10, Math.hypot(b.x - a.x, b.y - a.y));
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: len, h: Math.max(28, sw * 3 + 20), rot: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: Math.max(16, Math.abs(b.x - a.x)), h: Math.max(16, Math.abs(b.y - a.y)), rot: 0 };
  }
  /* Brushes. Each stroke is drawn on a separate canvas, then merged so
     see-through brushes do not get darker where the stroke overlaps itself. */
  const BRUSH_DEF = {
    pen: { a: 1, wm: 1 }, marker: { a: .9, wm: 2.2 }, pencil: { a: .85, wm: .8 }, crayon: { a: .9, wm: 2.4 }, highlighter: { a: .38, wm: 4 }, spray: { a: 1, wm: 3 }
  };
  function beginStroke(p) {
    const d = BRUSH_DEF[E.brush], c = ED.sctx;
    c.clearRect(0, 0, PW, PH);
    ED.strokeCv.style.opacity = d.a;
    c.strokeStyle = c.fillStyle = E.color;
    c.lineWidth = Math.max(1, E.size * d.wm);
    c.lineCap = E.brush === 'highlighter' ? 'butt' : 'round';
    c.lineJoin = 'round';
    if (E.brush === 'pen' || E.brush === 'marker' || E.brush === 'highlighter') { c.beginPath(); c.arc(p.x, p.y, c.lineWidth / 2, 0, Math.PI * 2); if (E.brush !== 'highlighter') c.fill(); }
    else texture(p, p);
  }
  function strokeTo(pts) {
    const c = ED.sctx, n = pts.length;
    if (E.brush === 'pen' || E.brush === 'marker' || E.brush === 'highlighter') {
      if (n < 3) { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[n - 1].x, pts[n - 1].y); c.stroke(); return; }
      const a = pts[n - 3], b = pts[n - 2], d = pts[n - 1];
      c.beginPath(); c.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2); c.quadraticCurveTo(b.x, b.y, (b.x + d.x) / 2, (b.y + d.y) / 2); c.stroke();
    } else texture(pts[n - 2] || pts[n - 1], pts[n - 1]);
  }
  function texture(a, b) {
    const c = ED.sctx, w = Math.max(1, E.size * BRUSH_DEF[E.brush].wm);
    const dist = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(dist / (E.brush === 'spray' ? 3 : 1)));
    for (let i = 0; i <= steps; i++) {
      const x = a.x + (b.x - a.x) * i / steps, y = a.y + (b.y - a.y) * i / steps;
      if (E.brush === 'spray') {
        for (let k = 0; k < 10; k++) { const r = Math.random() * w * 1.5, t = Math.random() * 6.283; c.fillRect(x + r * Math.cos(t), y + r * Math.sin(t), .9, .9); }
      } else if (E.brush === 'pencil') {
        for (let k = 0; k < 3; k++) if (Math.random() < .8) c.fillRect(x + (Math.random() - .5) * w * 1.6, y + (Math.random() - .5) * w * 1.6, .8, .8);
      } else { // crayon
        for (let k = 0; k < 6; k++) if (Math.random() < .7) c.fillRect(x + (Math.random() - .5) * w, y + (Math.random() - .5) * w, 1.2, 1.2);
      }
    }
  }
  function endStroke() {
    const d = BRUSH_DEF[E.brush];
    ED.ink.save(); ED.ink.setTransform(1, 0, 0, 1, 0, 0); ED.ink.globalAlpha = d.a; ED.ink.drawImage(ED.strokeCv, 0, 0); ED.ink.restore();
    ED.sctx.clearRect(0, 0, PW, PH); ED.inkEmpty = false; ED.inkDirty = true;
  }
  function eraseAt(a, b) {
    const c = ED.ink; c.save(); c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineWidth = E.eSize;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x + .01, b.y); c.stroke(); c.restore();
  }
  const FONT_LIST = [['hand', 'Handwritten'], ['cute', 'Cute'], ['serif', 'Serif'], ['ui', 'Rounded']];
  const TEXT_STYLES = [['plain', 'Plain'], ['note', 'Sticky note'], ['label', 'Label'], ['tape', 'Tape']];
  function openTextSheet(el, isNew) {
    let saved = false;
    const draw = () => renderEls();
    openSheet({
      title: isNew ? 'Add text' : 'Edit text',
      body: `<textarea class="input" id="txVal" maxlength="600" placeholder="Write something sweet…" style="font-family:${FONTS[el.font]}">${esc(el.text)}</textarea>
        <div class="field"><span class="lbl">Font</span><div class="row wrap">${FONT_LIST.map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${el.font === k}" style="font-family:${FONTS[k]}">${l}</button>`).join('')}</div></div>
        <div class="field"><label for="txSize">Size</label><input type="range" id="txSize" min="12" max="80" value="${Math.round(el.fs)}"></div>
        <div class="field"><span class="lbl">Colour</span><div class="row wrap">${swatches(el.color, 'data-c')}</div></div>
        <div class="field"><span class="lbl">Style</span><div class="row wrap">${TEXT_STYLES.map(([k, l]) => `<button class="chip" data-s="${k}" aria-pressed="${(el.style || 'plain') === k}">${l}</button>`).join('')}</div></div>
        <div class="field" id="txLc" ${['label', 'tape'].includes(el.style) ? '' : 'hidden'}><span class="lbl">Label colour</span><div class="row wrap">${swatches(el.lc, 'data-l', PASTELS)}</div></div>
        <div class="field"><span class="lbl">Align</span><div class="seg">${['left', 'center', 'right'].map(a => `<button data-a="${a}" aria-pressed="${(el.align || 'center') === a}">${a[0].toUpperCase() + a.slice(1)}</button>`).join('')}</div></div>`,
      foot: `<button class="btn danger" data-del>${I.trash} Delete</button><button class="btn" data-ok>Save</button>`,
      onMount: (sh, api) => {
        const ta = $('#txVal', sh); setTimeout(() => ta.focus(), 280);
        ta.addEventListener('input', () => { el.text = ta.value; draw(); });
        $('#txSize', sh).addEventListener('input', e => { el.fs = +e.target.value; draw(); });
        sh.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.f) { el.font = b.dataset.f; ta.style.fontFamily = FONTS[el.font]; $$('[data-f]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }
          if (b.dataset.c) { el.color = b.dataset.c; $$('[data-c]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }
          if (b.dataset.s) { el.style = b.dataset.s; $$('[data-s]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#txLc', sh).hidden = !['label', 'tape'].includes(el.style); draw(); }
          if (b.dataset.l) { el.lc = b.dataset.l; $$('[data-l]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }
          if (b.dataset.a) { el.align = b.dataset.a; $$('[data-a]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }
          if ('ok' in b.dataset) { saved = true; api.close(); }
          if ('del' in b.dataset) { el.text = ''; api.close(); }
        });
      },
      onClose: () => {
        if (!ED) return;
        if (!el.text || !el.text.trim()) { ED.pg.els = ED.pg.els.filter(x => x !== el); ED.sel = null; }
        else { ED.sel = el.id; if (E.tool !== 'select') setTool('select'); }
        renderEls();
        void saved;
      }
    });
  }
  function openStickerDrawer() {
    const packs = [['recent', 'Recent']].concat(Stickers.PACKS.map(p => [p.id, p.name]));
    let cur = S.settings.recent.length ? 'recent' : 'coquette';
    const grid = id => {
      const list = id === 'recent' ? S.settings.recent.filter(s => Stickers.BY_ID[s]) : Stickers.LIST.filter(s => s.pack === id).map(s => s.id);
      if (!list.length) return `<div class="empty" style="grid-column:1/-1"><b>No recent stickers yet</b>Stickers you use show up here.</div>`;
      return list.map(s => `<button data-sid="${s}" aria-label="${esc(Stickers.BY_ID[s].name)}"><img loading="lazy" src="${Stickers.url(s)}" alt=""></button>`).join('');
    };
    openSheet({
      title: `Stickers (${Stickers.count})`,
      body: `<div class="st-tabs">${packs.map(([k, l]) => `<button class="chip" data-pk="${k}" aria-pressed="${k === cur}">${l}</button>`).join('')}</div><div class="st-grid" id="stGrid">${grid(cur)}</div>`,
      onMount: (sh, api) => {
        sh.addEventListener('click', e => {
          const pk = e.target.closest('[data-pk]'); const s = e.target.closest('[data-sid]');
          if (pk) { cur = pk.dataset.pk; $$('[data-pk]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === pk))); $('#stGrid', sh).innerHTML = grid(cur); $('.sheet-body', sh).scrollTop = 0; }
          if (s && ED) {
            pushHist();
            const sid = s.dataset.sid;
            const el = { id: uid(), type: 'sticker', sid, x: PW / 2 + (Math.random() * 60 - 30), y: PH / 2 + (Math.random() * 60 - 30), w: 96, h: 96, rot: Math.round(Math.random() * 20 - 10) };
            ED.pg.els.push(el); ED.sel = el.id;
            S.settings.recent = [sid].concat(S.settings.recent.filter(x => x !== sid)).slice(0, 24); save('settings');
            api.close(); setTool('select'); ED.sel = el.id; renderEls();
          }
        });
      }
    });
  }
  const PAPERS = [['plain', 'Plain'], ['lined', 'Lined'], ['dotted', 'Dotted'], ['grid', 'Grid']];
  const PAPER_COLORS = ['', '#fffaf0', '#fde7ee', '#e9f3fb', '#eef3e6', '#f3ecfa', '#fff6d6', '#f6ebe0'];
  function openPaperSheet() {
    const pg = ED.pg;
    openSheet({
      title: 'Paper',
      body: `<div class="field"><span class="lbl">Lines</span><div class="row wrap">${PAPERS.map(([k, l]) => `<button class="chip" data-pp="${k}" aria-pressed="${(pg.paper || 'plain') === k}">${l}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Paper colour</span><div class="row wrap">${PAPER_COLORS.map(c => `<button class="swatch" data-pc="${c}" style="background:${c || 'var(--paper)'}" aria-label="${c || 'Theme paper'}" aria-pressed="${(pg.pc || '') === c}"></button>`).join('')}</div></div>`,
      foot: `<button class="btn" data-ok>Done</button>`,
      onMount: (sh, api) => sh.addEventListener('click', e => {
        const a = e.target.closest('[data-pp]'), b = e.target.closest('[data-pc]');
        if (a) { pg.paper = a.dataset.pp; $$('[data-pp]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === a))); ED.drawPaper(); }
        if (b) { pg.pc = b.dataset.pc; $$('[data-pc]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ED.drawPaper(); }
        if (e.target.closest('[data-ok]')) api.close();
      })
    });
  }
  function openCoverSheet2() {
    const cv = ED.pg;
    openSheet({
      title: 'Cover style',
      body: `<div class="field"><span class="lbl">Cover colour</span><div class="row wrap">${COVER_COLORS.map(c => `<button class="swatch" data-cc="${c}" style="background:${c || 'var(--cover)'}" aria-label="${c || 'Theme colour'}" aria-pressed="${(cv.color || '') === c}"></button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Pattern</span><div class="row wrap">${PATTERNS.map(([k, l]) => `<button class="chip" data-cp="${k}" aria-pressed="${(cv.pattern || 'plain') === k}">${l}</button>`).join('')}</div></div>`,
      foot: `<button class="btn" data-ok>Done</button>`,
      onMount: (sh, api) => sh.addEventListener('click', e => {
        const a = e.target.closest('[data-cc]'), b = e.target.closest('[data-cp]');
        if (a) { cv.color = a.dataset.cc; $$('[data-cc]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === a))); ED.drawPaper(); }
        if (b) { cv.pattern = b.dataset.cp; $$('[data-cp]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ED.drawPaper(); }
        if (e.target.closest('[data-ok]')) api.close();
      })
    });
  }

  /* ================= TASKS + ROUTINES ================= */
  const T = { date: today() };
  const activeTasks = d => S.tasks.filter(t => t.created <= d && (!t.deleted || d < t.deleted));
  const dayLog = d => (S.log[d] = S.log[d] || { t: {}, r: {} });
  function taskDone(t, d) {
    const v = (S.log[d] && S.log[d].t[t.id]);
    return t.type === 'check' ? !!v : (+v || 0) >= t.goal;
  }
  function allDone(d) { const ts = activeTasks(d); return ts.length > 0 && ts.every(t => taskDone(t, d)); }
  function weekOfMonth(s) { return Math.ceil(parse(s).getDate() / 7); }
  function isLastWeek(s) { const d = parse(s); const n = new Date(d); n.setDate(d.getDate() + 7); return n.getMonth() !== d.getMonth(); }
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
  const earnedOn = d => S.earned.find(e => e.date === d);
  function checkReward(d) {
    if (d > today() || earnedOn(d) || !allDone(d)) return;
    const order = Stickers.rewardOrder();
    const sid = order[S.earned.length % order.length];
    S.earned.push({ date: d, sticker: sid }); save('earned');
    SB.newDate = d;
    celebrate(sid, d);
  }
  function fmtNum(n) { return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10); }
  function stepFor(t) { return /^min/i.test(t.unit) ? 5 : 1; }
  function renderTodo() {
    const d = T.date, dt = parse(d), isToday = d === today(), future = d > today();
    const ts = activeTasks(d), done = ts.filter(t => taskDone(t, d)).length;
    const ern = earnedOn(d);
    const rs = S.routines.filter(r => !r.deleted || d < r.deleted).filter(r => routineOn(r, d)).sort((a, b) => (a.from || '').localeCompare(b.from || ''));
    let prog;
    if (!ts.length) prog = `<div class="grow"><b>No to-dos yet</b><div class="small">Add a to-do to start earning stickers.</div></div>`;
    else if (ern) prog = `<img src="${Stickers.url(ern.sticker)}" alt="Sticker earned"><div class="grow"><b>All done, sticker earned ♡</b><div class="small">It is in your sticker book.</div><div class="bar"><i style="width:100%"></i></div></div>`;
    else prog = `<div class="grow"><b>${done} of ${ts.length} done</b><div class="small">${future ? 'This day has not started yet.' : 'Finish every to-do to earn ' + (isToday ? "today's" : "this day's") + ' sticker.'}</div><div class="bar"><i style="width:${Math.round(done / ts.length * 100)}%"></i></div></div>`;
    view.innerHTML = `
      <div class="day-head"><div class="big-num">${dt.getDate()}</div>
        <div class="day-meta"><span class="day-pill">${isToday ? 'TODAY' : WD[wdIdx(d)].toUpperCase()}</span><span class="wd">${WDL[wdIdx(d)]}</span><span class="small">${MONTHS[dt.getMonth()]} ${dt.getFullYear()}</span></div>
        <div class="day-nav"><button class="icon-btn" data-act="prev" aria-label="Previous day">${I.left}</button>${isToday ? '' : `<button class="icon-btn" data-act="today" aria-label="Back to today" style="width:auto;padding:0 12px;border-radius:999px;font-weight:800;font-size:13px">Today</button>`}<button class="icon-btn" data-act="next" aria-label="Next day">${I.right}</button></div></div>
      <div class="progress-card">${prog}</div>
      <div class="sec-title"><h3>To-do</h3><span class="small">counts for stickers</span></div>
      <div class="list">${ts.length ? ts.map(t => taskHTML(t, d)).join('') : `<div class="empty"><b>Nothing here yet</b>Tap + to add a to-do like study, drink water or read.</div>`}</div>
      <div class="sec-title"><h3>Routines</h3><span class="small">don't count for stickers</span></div>
      <div class="list">${rs.length ? rs.map(r => routineHTML(r, d)).join('') : `<div class="empty"><b>No routines on this day</b>Tap + to add one with days and a time slot.</div>`}</div>
      <div style="height:80px"></div>`;
    if (!$('#fab')) {
      const f = document.createElement('button'); f.id = 'fab'; f.className = 'fab'; f.setAttribute('aria-label', 'Add to-do or routine'); f.innerHTML = I.plus;
      f.addEventListener('click', openAddChoice); document.body.appendChild(f);
    }
    view.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'prev') { T.date = addDays(T.date, -1); renderTodo(); }
      else if (act === 'next') { T.date = addDays(T.date, 1); renderTodo(); }
      else if (act === 'today') { T.date = today(); renderTodo(); }
      else if (act === 'edit-task') openTaskSheet(S.tasks.find(t => t.id === id));
      else if (act === 'edit-rt') openRoutineSheet(S.routines.find(r => r.id === id));
      else if (future && ['tick', 'inc', 'dec', 'val', 'rtick'].includes(act)) toast('This day has not started yet');
      else if (act === 'tick') { const L = dayLog(T.date); L.t[id] = !L.t[id]; save('log'); renderTodo(); checkReward(T.date); }
      else if (act === 'inc' || act === 'dec') {
        const t = S.tasks.find(x => x.id === id); const L = dayLog(T.date);
        L.t[id] = Math.max(0, (+L.t[id] || 0) + (act === 'inc' ? stepFor(t) : -stepFor(t))); save('log'); renderTodo(); checkReward(T.date);
      } else if (act === 'val') openValueSheet(S.tasks.find(x => x.id === id));
      else if (act === 'rtick') { const L = dayLog(T.date); L.r[id] = !L.r[id]; save('log'); renderTodo(); }
    };
  }
  function taskHTML(t, d) {
    const v = S.log[d] && S.log[d].t[t.id];
    const done = taskDone(t, d);
    if (t.type === 'check') return `<div class="task ${done ? 'done' : ''}"><button class="emo" data-act="edit-task" data-id="${t.id}" aria-label="Edit ${esc(t.name)}">${esc(t.emoji)}</button><button class="grow name" data-act="edit-task" data-id="${t.id}">${esc(t.name)}</button><button class="check" data-act="tick" data-id="${t.id}" aria-label="${done ? 'Mark not done' : 'Mark done'}" aria-pressed="${done}">${I.check}</button></div>`;
    const n = +v || 0;
    return `<div class="task ${done ? 'done' : ''}"><button class="emo" data-act="edit-task" data-id="${t.id}" aria-label="Edit ${esc(t.name)}">${esc(t.emoji)}</button>
      <div class="grow"><button class="name" data-act="edit-task" data-id="${t.id}">${esc(t.name)}</button><button class="sub" data-act="val" data-id="${t.id}" style="display:block">${fmtNum(n)} / ${fmtNum(t.goal)} ${esc(t.unit)}${done ? ' ✓' : ''}</button><div class="bar"><i style="width:${Math.min(100, n / t.goal * 100)}%"></i></div></div>
      <div class="counter"><button data-act="dec" data-id="${t.id}" aria-label="Minus">−</button><button data-act="inc" data-id="${t.id}" aria-label="Plus">+</button></div></div>`;
  }
  function routineText(r) {
    const days = r.days.length === 7 ? 'every day' : r.days.slice().sort().map(i => WD[i]).join(', ');
    if (r.repeat === 'daily') return 'Daily';
    if (r.repeat === 'weekly') return 'Weekly · ' + days;
    if (r.repeat === 'monthly') return `Monthly · ${['', '1st', '2nd', '3rd', '4th', 'last'][r.nth]} ${days}`;
    const s = parse(r.start); return `Yearly · ${s.getDate()} ${MONTHS[s.getMonth()]}`;
  }
  function routineHTML(r, d) {
    const done = !!(S.log[d] && S.log[d].r[r.id]);
    return `<div class="task ${done ? 'done' : ''}"><button class="emo" data-act="edit-rt" data-id="${r.id}" aria-label="Edit ${esc(r.name)}">${esc(r.emoji)}</button>
      <button class="grow" data-act="edit-rt" data-id="${r.id}" style="text-align:left"><span class="name" style="display:block">${esc(r.name)}</span><span class="row" style="gap:6px;margin-top:3px">${r.from ? `<span class="time-chip">${esc(r.from)}${r.to ? '–' + esc(r.to) : ''}</span>` : ''}<span class="sub">${esc(routineText(r))}</span></span></button>
      <button class="check" data-act="rtick" data-id="${r.id}" aria-label="${done ? 'Mark not done' : 'Mark done'}" aria-pressed="${done}">${I.check}</button></div>`;
  }
  function openAddChoice() {
    openSheet({
      title: 'Add',
      body: `<button class="task" data-k="t" style="text-align:left"><span class="emo">✅</span><span class="grow"><span class="name" style="display:block">To-do</span><span class="sub">Every day. Finish all of them to earn a sticker.</span></span></button>
        <button class="task" data-k="r" style="text-align:left"><span class="emo">🕓</span><span class="grow"><span class="name" style="display:block">Routine</span><span class="sub">Chosen days and a time slot, for example 16:00–17:00.</span></span></button>`,
      onMount: (sh, api) => sh.addEventListener('click', e => {
        const b = e.target.closest('[data-k]'); if (!b) return;
        api.close(); setTimeout(() => b.dataset.k === 't' ? openTaskSheet(null) : openRoutineSheet(null), 200);
      })
    });
  }
  const TASK_EMOJI = ['📚', '✏️', '💧', '🥤', '📖', '🎨', '🧘‍♀️', '🏃‍♀️', '🚶‍♀️', '🛏️', '🪥', '🧴', '🍎', '🥗', '🍳', '☕', '🍵', '💊', '🎹', '🎸', '🎧', '📝', '💻', '🧹', '🧺', '🪴', '🐶', '🐱', '🌙', '☀️', '⭐', '💖', '🎀', '🧸', '🌸', '🌷', '🍓', '🍒', '🧁', '📷', '🎬', '🛁', '💅', '🧶', '✂️', '📞', '🙏', '⏰'];
  const UNITS = ['bottles', 'glasses', 'minutes', 'hours', 'pages', 'times', 'steps', 'km'];
  function emojiPicker(sel, list) {
    const custom = !list.includes(sel) ? sel : '';
    return `<div class="emoji-grid">${list.map(e => `<button data-emo="${e}" aria-pressed="${e === sel}">${e}</button>`).join('')}</div>
      <div class="row"><span class="small">Or type your own</span><input class="input" id="emoOwn" maxlength="8" value="${esc(custom)}" style="width:90px;text-align:center;font-size:22px;padding:6px"></div>`;
  }
  function bindEmoji(sh, onPick) {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-emo]'); if (!b) return;
      $$('[data-emo]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#emoOwn', sh).value = ''; onPick(b.dataset.emo);
    });
    $('#emoOwn', sh).addEventListener('input', e => {
      const v = firstGrapheme(e.target.value.trim()); if (!v) return;
      $$('[data-emo]', sh).forEach(x => x.setAttribute('aria-pressed', 'false')); onPick(v);
    });
  }
  function firstGrapheme(s) {
    if (!s) return '';
    try { if (Intl.Segmenter) { const it = new Intl.Segmenter().segment(s)[Symbol.iterator]().next(); return it.value ? it.value.segment : ''; } } catch (e) { /* fall through */ }
    return Array.from(s)[0];
  }
  function openTaskSheet(task) {
    const isNew = !task;
    const t = task ? Object.assign({}, task) : { id: uid(), name: '', emoji: '📚', type: 'check', goal: 8, unit: 'bottles', created: today(), deleted: null };
    if (t.type === 'check' && !t.goal) t.goal = 8;
    const unitCustom = !UNITS.includes(t.unit) ? t.unit : '';
    openSheet({
      title: isNew ? 'New to-do' : 'Edit to-do',
      body: `<div class="field"><label for="tkName">Name</label><input class="input" id="tkName" maxlength="40" placeholder="Study, drink water, read…" value="${esc(t.name)}"></div>
        <div class="field"><span class="lbl">Icon</span>${emojiPicker(t.emoji, TASK_EMOJI)}</div>
        <div class="field"><span class="lbl">Type</span><div class="seg"><button data-ty="check" aria-pressed="${t.type === 'check'}">✅ Checkbox</button><button data-ty="count" aria-pressed="${t.type === 'count'}">🔢 Counter</button></div></div>
        <div id="tkCount" ${t.type === 'count' ? '' : 'hidden'} style="display:flex;flex-direction:column;gap:12px">
          <div class="field"><label for="tkGoal">Goal</label><input class="input" id="tkGoal" type="number" inputmode="decimal" min="0.5" step="0.5" value="${t.goal}"></div>
          <div class="field"><span class="lbl">Unit</span><div class="row wrap">${UNITS.map(u => `<button class="chip" data-u="${u}" aria-pressed="${t.unit === u}">${u}</button>`).join('')}</div>
            <input class="input" id="tkUnit" maxlength="16" placeholder="Or type your own unit" value="${esc(unitCustom)}"></div>
        </div>`,
      foot: (isNew ? '' : `<button class="btn danger" data-del>${I.trash} Delete</button>`) + `<button class="btn" data-ok>Save</button>`,
      onMount: (sh, api) => {
        if (isNew) setTimeout(() => $('#tkName', sh).focus(), 280);
        bindEmoji(sh, v => { t.emoji = v; });
        sh.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.ty) { t.type = b.dataset.ty; $$('[data-ty]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#tkCount', sh).hidden = t.type !== 'count'; }
          if (b.dataset.u) { t.unit = b.dataset.u; $('#tkUnit', sh).value = ''; $$('[data-u]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }
          if ('ok' in b.dataset) {
            t.name = $('#tkName', sh).value.trim();
            if (!t.name) { toast('Give your to-do a name'); $('#tkName', sh).focus(); return; }
            const own = $('#tkUnit', sh).value.trim(); if (own) t.unit = own;
            if (t.type === 'count') { const g = parseFloat($('#tkGoal', sh).value); if (!(g > 0)) { toast('Set a goal above 0'); return; } t.goal = g; }
            else { t.goal = 1; }
            if (isNew) S.tasks.push(t); else Object.assign(task, t);
            save('tasks'); api.close(); renderTodo(); toast(isNew ? 'To-do added' : 'Saved'); checkReward(T.date);
          }
          if ('del' in b.dataset) {
            if (task.created >= today()) S.tasks = S.tasks.filter(x => x !== task); else task.deleted = today();
            save('tasks'); api.close(); renderTodo(); toast('To-do removed');
          }
        });
      }
    });
  }
  function openRoutineSheet(rt) {
    const isNew = !rt;
    const r = rt ? JSON.parse(JSON.stringify(rt)) : { id: uid(), name: '', emoji: '⏰', days: [wdIdx(today())], from: '16:00', to: '17:00', repeat: 'weekly', nth: weekOfMonth(today()) > 4 ? 5 : weekOfMonth(today()), start: today(), deleted: null };
    const sync = sh => {
      $('#rtDays', sh).hidden = !(r.repeat === 'weekly' || r.repeat === 'monthly' || r.repeat === 'daily');
      $('.days', sh).classList.toggle('locked', r.repeat === 'daily');
      $$('[data-day]', sh).forEach(b => b.setAttribute('aria-pressed', String(r.repeat === 'daily' || r.days.includes(+b.dataset.day))));
      $('#rtNth', sh).hidden = r.repeat !== 'monthly';
      $('#rtStartLbl', sh).textContent = r.repeat === 'yearly' ? 'Date (repeats every year)' : 'Starts on';
      $('#rtSum', sh).textContent = routineText(r);
    };
    openSheet({
      title: isNew ? 'New routine' : 'Edit routine',
      body: `<div class="field"><label for="rtName">Name</label><input class="input" id="rtName" maxlength="40" placeholder="Homework, dance class…" value="${esc(r.name)}"></div>
        <div class="field"><span class="lbl">Icon</span>${emojiPicker(r.emoji, TASK_EMOJI)}</div>
        <div class="field"><span class="lbl">Repeats</span><div class="seg">${[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']].map(([k, l]) => `<button data-rp="${k}" aria-pressed="${r.repeat === k}">${l}</button>`).join('')}</div></div>
        <div class="field" id="rtDays"><span class="lbl">Days</span><div class="days">${WD.map((w, i) => `<button data-day="${i}" aria-label="${WDL[i]}" aria-pressed="false">${w[0]}${w[1]}</button>`).join('')}</div></div>
        <div class="field" id="rtNth"><span class="lbl">Which week of the month</span><div class="row wrap">${[[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [5, 'Last']].map(([k, l]) => `<button class="chip" data-nth="${k}" aria-pressed="${r.nth === k}">${l}</button>`).join('')}</div></div>
        <div class="row"><div class="field grow"><label for="rtFrom">From</label><input class="input" type="time" id="rtFrom" value="${esc(r.from)}"></div><div class="field grow"><label for="rtTo">To</label><input class="input" type="time" id="rtTo" value="${esc(r.to)}"></div></div>
        <div class="field"><label for="rtStart" id="rtStartLbl">Starts on</label><input class="input" type="date" id="rtStart" value="${r.start}"></div>
        <p class="small" style="margin:0">Shows up: <b id="rtSum"></b></p>`,
      foot: (isNew ? '' : `<button class="btn danger" data-del>${I.trash} Delete</button>`) + `<button class="btn" data-ok>Save</button>`,
      onMount: (sh, api) => {
        sync(sh);
        if (isNew) setTimeout(() => $('#rtName', sh).focus(), 280);
        bindEmoji(sh, v => { r.emoji = v; });
        $('#rtStart', sh).addEventListener('change', e => { if (e.target.value) { r.start = e.target.value; sync(sh); } });
        sh.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.rp) { r.repeat = b.dataset.rp; $$('[data-rp]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); sync(sh); }
          if (b.dataset.day) { const d = +b.dataset.day; r.days = r.days.includes(d) ? r.days.filter(x => x !== d) : r.days.concat(d); sync(sh); }
          if (b.dataset.nth) { r.nth = +b.dataset.nth; $$('[data-nth]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); sync(sh); }
          if ('ok' in b.dataset) {
            r.name = $('#rtName', sh).value.trim(); r.from = $('#rtFrom', sh).value; r.to = $('#rtTo', sh).value; r.start = $('#rtStart', sh).value || today();
            if (!r.name) { toast('Give your routine a name'); $('#rtName', sh).focus(); return; }
            if (r.repeat === 'daily') r.days = [0, 1, 2, 3, 4, 5, 6];
            if ((r.repeat === 'weekly' || r.repeat === 'monthly') && !r.days.length) { toast('Pick at least one day'); return; }
            if (r.from && r.to && r.to <= r.from) { toast('The end time should be after the start time'); return; }
            if (isNew) S.routines.push(r); else Object.assign(rt, r);
            save('routines'); api.close(); renderTodo(); toast(isNew ? 'Routine added' : 'Saved');
          }
          if ('del' in b.dataset) {
            if (rt.start >= today()) S.routines = S.routines.filter(x => x !== rt); else rt.deleted = today();
            save('routines'); api.close(); renderTodo(); toast('Routine removed');
          }
        });
      }
    });
  }
  function openValueSheet(t) {
    const L = dayLog(T.date);
    openSheet({
      title: `${t.emoji} ${t.name}`,
      body: `<div class="field"><label for="valIn">How many ${esc(t.unit)}? Goal: ${fmtNum(t.goal)}</label><input class="input" id="valIn" type="number" inputmode="decimal" min="0" step="any" value="${fmtNum(+L.t[t.id] || 0)}" style="font-size:28px;text-align:center"></div>`,
      foot: `<button class="btn soft" data-full>Set to goal</button><button class="btn" data-ok>Save</button>`,
      onMount: (sh, api) => {
        const inp = $('#valIn', sh); setTimeout(() => { inp.focus(); inp.select(); }, 280);
        const commit = v => { L.t[t.id] = Math.max(0, v || 0); save('log'); api.close(); renderTodo(); checkReward(T.date); };
        $('[data-ok]', sh).addEventListener('click', () => commit(parseFloat(inp.value)));
        $('[data-full]', sh).addEventListener('click', () => commit(t.goal));
      }
    });
  }

  /* ================= STICKER BOOK ================= */
  const SB = { open: false, idx: 0, anim: false, newDate: null };
  const PER = 12;
  function sbCoverHTML() {
    const deco = [['bow.cherry', 290, 70, 100, 12], ['heart.coquette', 70, 460, 80, -12], ['sparkles.cozy', 300, 470, 70, 0], ['star.midnight', 64, 90, 60, -8], ['cherries.cherry', 190, 360, 110, 4]];
    return `<div class="book-cover" id="sbCov" style="background:var(--deep)"><div class="spine"></div><div class="page-box" style="position:absolute;inset:0"><div class="page-inner"><div class="paper dots" style="--pc:var(--deep)"></div><div class="els">${deco.map(([s, x, y, w, r]) => `<div class="el sticker" style="left:${x}px;top:${y}px;width:${w}px;height:${w}px;transform:translate(-50%,-50%) rotate(${r}deg)"><img src="${Stickers.url(s)}" alt=""></div>`).join('')}</div></div></div>
      <div class="cover-title"><div class="t">my sticker book</div><div class="s">${S.earned.length} ${S.earned.length === 1 ? 'sticker' : 'stickers'} collected</div></div></div>`;
  }
  function sbPagesCount() { return Math.max(1, Math.ceil((S.earned.length + 1) / PER)); }
  function sbPageEl(i) {
    const d = document.createElement('div'); d.className = 'flip-page';
    const items = S.earned.slice(i * PER, i * PER + PER);
    let slots = '';
    for (let k = 0; k < PER; k++) {
      const it = items[k];
      if (it) { const dt = parse(it.date); slots += `<div class="sb-slot ${it.date === SB.newDate ? 'new' : ''}"><img src="${Stickers.url(it.sticker)}" alt="${esc((Stickers.BY_ID[it.sticker] || {}).name || 'Sticker')}"><span>${dt.getDate()} ${MONTHS[dt.getMonth()].slice(0, 3).toLowerCase()}</span></div>`; }
      else slots += `<div class="sb-slot empty-slot"><i>?</i></div>`;
    }
    d.innerHTML = `<div class="sb-page"><h4>page ${i + 1}</h4><div class="sb-grid">${slots}</div></div><div class="page-holes">${'<i></i>'.repeat(7)}</div>`;
    return d;
  }
  function renderStickerBook() {
    view.className = 'view center';
    const t = today(), ts = activeTasks(t), done = ts.filter(x => taskDone(x, t)).length;
    const status = earnedOn(t) ? "Today's sticker is in the book ♡" : ts.length ? `Today: ${done} of ${ts.length} to-dos done` : 'Add to-dos to start earning stickers';
    if (!SB.open) {
      view.innerHTML = `<div class="book-wrap">${sbCoverHTML()}</div><p class="hint">double tap to open ♡</p><p class="small" style="margin:6px 0 0">${esc(status)}</p>`;
      scaleInners(view);
      const cov = $('#sbCov');
      onTaps(cov, {
        single: () => { cov.classList.remove('wiggle'); void cov.offsetWidth; cov.classList.add('wiggle'); toast('Double tap to open ♡'); },
        double: () => { cov.classList.add('opening'); setTimeout(() => { SB.open = true; SB.idx = Math.max(0, Math.floor(Math.max(0, S.earned.length - 1) / PER)); renderStickerBook(); }, 380); }
      });
      return;
    }
    const n = sbPagesCount(); SB.idx = Math.min(SB.idx, n - 1);
    view.innerHTML = `<div class="reader"><div class="flip-stage" id="sbStage"></div>
      <div class="pager"><button class="icon-btn" id="sbPrev" aria-label="Previous page">${I.left}</button><span class="num" id="sbNum"></span><button class="icon-btn" id="sbNext" aria-label="Next page">${I.right}</button></div>
      <button class="btn soft" id="sbClose">${I.book} Close</button><p class="small" style="margin:0">${esc(status)}. The sticker book is read only.</p></div>`;
    const stage = $('#sbStage'); stage.appendChild(sbPageEl(SB.idx));
    const upd = () => { $('#sbNum').textContent = `${SB.idx + 1} / ${n}`; $('#sbPrev').disabled = SB.idx <= 0; $('#sbNext').disabled = SB.idx >= n - 1; };
    upd();
    const flip = to => {
      if (SB.anim || to < 0 || to >= n || to === SB.idx) return; SB.anim = true;
      const old = stage.lastElementChild, nu = sbPageEl(to);
      if (to > SB.idx) { stage.insertBefore(nu, stage.firstChild); requestAnimationFrame(() => old.classList.add('turn-out')); }
      else { nu.classList.add('turn-in'); stage.appendChild(nu); void nu.offsetWidth; nu.classList.add('go'); }
      SB.idx = to; upd();
      setTimeout(() => { $$('.flip-page', stage).forEach(p => { if (p !== nu) p.remove(); }); nu.classList.remove('turn-in', 'go'); SB.anim = false; }, 470);
    };
    let sx = 0, sy = 0;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', e => { const dx = e.clientX - sx; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sy)) flip(SB.idx + (dx < 0 ? 1 : -1)); });
    $('#sbPrev').addEventListener('click', () => flip(SB.idx - 1));
    $('#sbNext').addEventListener('click', () => flip(SB.idx + 1));
    $('#sbClose').addEventListener('click', () => { SB.open = false; renderStickerBook(); });
    setTimeout(() => { SB.newDate = null; }, 1200);
  }
  function celebrate(sid, d) {
    const c = document.createElement('div'); c.className = 'celebrate'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'New sticker');
    c.innerHTML = `<div class="card"><img src="${Stickers.url(sid)}" alt=""><h3>New sticker!</h3><p>You finished all your to-dos${d === today() ? ' today' : ''}. Your sticker is now in your sticker book.</p><div class="row" style="justify-content:center"><button class="btn soft" data-k="ok">Yay ♡</button><button class="btn" data-k="see">See my book</button></div></div>`;
    document.body.appendChild(c);
    const bits = ['♡', '✿', '★', '♥', '❀', '✧'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('div'); s.className = 'confetti'; s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + 'vw'; s.style.color = ['#f4a7b9', '#d8293f', '#f3d36b', '#a8c99a', '#a9d1f2', '#c3aee3'][i % 6];
      s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; s.style.animationDelay = Math.random() * .5 + 's';
      document.body.appendChild(s); setTimeout(() => s.remove(), 4000);
    }
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b && e.target !== c) return;
      c.remove();
      if (b && b.dataset.k === 'see') { SB.open = true; SB.idx = Math.floor((S.earned.length - 1) / PER); go('stickers'); }
    });
  }

  /* ================= CALENDAR ================= */
  const now0 = new Date();
  const C = { y: now0.getFullYear(), m: now0.getMonth() };
  const MOODS = ['😊', '🥰', '😍', '🤩', '😌', '🙂', '😐', '😴', '🥱', '😔', '😢', '😭', '😤', '😡', '🤒', '🤯', '🥳', '😎', '🤗', '💖', '🌧️', '☀️', '🌈', '✨'];
  const TYPES = [['', 'None', ''], ['birthday', 'Birthday', '🎂'], ['party', 'Party', '🎉'], ['appointment', 'Appointment', '📌'], ['custom', 'My own label', '🏷️']];
  function renderCalendar() {
    const first = new Date(C.y, C.m, 1), startOff = (first.getDay() + 6) % 7;
    const t = today();
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const dt = new Date(C.y, C.m, 1 - startOff + i), d = ymd(dt), out = dt.getMonth() !== C.m;
      const e = S.cal[d] || {}, er = earnedOn(d);
      const mark = e.type === 'custom' ? `<span class="mark lbl">${esc(e.label || '')}</span>` : e.type ? `<span class="mark">${TYPES.find(x => x[0] === e.type)[2]}</span>` : '';
      cells += `<button class="cal-cell ${out ? 'out' : ''} ${d === t ? 'today' : ''}" data-d="${d}" aria-label="${dt.getDate()} ${MONTHS[dt.getMonth()]}${e.emoji ? ', mood ' + e.emoji : ''}"><span class="d">${dt.getDate()}</span>${mark}${e.emoji ? `<span class="em">${esc(e.emoji)}</span>` : ''}${e.text ? '<span class="txt"></span>' : ''}${er && !out ? `<img class="stk" src="${Stickers.url(er.sticker)}" alt="">` : ''}</button>`;
    }
    const prefix = `${C.y}-${pad(C.m + 1)}-`;
    const marked = Object.keys(S.cal).filter(k => k.startsWith(prefix) && (S.cal[k].type || S.cal[k].text)).sort();
    view.innerHTML = `<div class="cal-head"><div class="m">${MONTHS[C.m]}</div><div class="y">${C.y}</div><div class="grow"></div>
        <button class="icon-btn" data-c="prev" aria-label="Previous month">${I.left}</button><button class="icon-btn" data-c="next" aria-label="Next month">${I.right}</button></div>
      <div class="cal-card"><div class="cal-wd">${WD.map(w => `<span>${w.slice(0, 2).toUpperCase()}</span>`).join('')}</div><div class="cal-grid">${cells}</div></div>
      <div class="legend"><span>🎂 birthday</span><span>🎉 party</span><span>📌 appointment</span><span>● note written</span><span>small sticker = all to-dos done</span></div>
      <div class="sec-title"><h3>This month</h3>${(C.y !== now0.getFullYear() || C.m !== now0.getMonth()) ? `<button class="chip" data-c="now">Back to today</button>` : ''}</div>
      <div class="marked-list">${marked.length ? marked.map(k => { const e = S.cal[k], dt = parse(k); const ty = TYPES.find(x => x[0] === e.type); return `<button class="it" data-d="${k}"><span class="dn">${dt.getDate()}</span><span style="font-size:20px">${esc(e.emoji || (ty && ty[2]) || '·')}</span><span class="grow"><b style="display:block">${esc(e.type === 'custom' ? e.label : ty && ty[0] ? ty[1] : WDL[wdIdx(k)])}</b><span class="small">${esc(e.text || '')}</span></span></button>`; }).join('') : `<div class="empty"><b>Nothing marked yet</b>Tap a day to pick a mood, write what you did or mark a birthday.</div>`}</div>`;
    view.onclick = e => {
      const c = e.target.closest('[data-c]'), d = e.target.closest('[data-d]');
      if (c) {
        if (c.dataset.c === 'now') { C.y = now0.getFullYear(); C.m = now0.getMonth(); }
        else { const n = new Date(C.y, C.m + (c.dataset.c === 'next' ? 1 : -1), 1); C.y = n.getFullYear(); C.m = n.getMonth(); }
        renderCalendar();
      } else if (d) openDaySheet(d.dataset.d);
    };
    let sx = 0, sy = 0; const card = $('.cal-card', view);
    card.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    card.addEventListener('pointerup', e => { const dx = e.clientX - sx; if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(e.clientY - sy)) { const n = new Date(C.y, C.m + (dx < 0 ? 1 : -1), 1); C.y = n.getFullYear(); C.m = n.getMonth(); renderCalendar(); } });
  }
  function openDaySheet(d) {
    const e = Object.assign({ emoji: '', text: '', type: '', label: '' }, S.cal[d] || {});
    const dt = parse(d), ts = activeTasks(d), done = ts.filter(t => taskDone(t, d)).length, er = earnedOn(d);
    openSheet({
      title: `${WDL[wdIdx(d)]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`,
      body: `<div class="field"><span class="lbl">Mood</span>${emojiPicker(e.emoji, MOODS)}</div>
        <div class="field"><label for="dayTxt">What did I do?</label><textarea class="input" id="dayTxt" maxlength="200" placeholder="Went to the park, baked cookies…">${esc(e.text)}</textarea></div>
        <div class="field"><span class="lbl">Type of day</span><div class="row wrap">${TYPES.map(([k, l, i]) => `<button class="chip" data-ty="${k}" aria-pressed="${e.type === k}">${i} ${l}</button>`).join('')}</div>
          <input class="input" id="dayLbl" maxlength="18" placeholder="Your label, for example Dance show" value="${esc(e.label)}" ${e.type === 'custom' ? '' : 'hidden'}></div>
        ${ts.length && d <= today() ? `<div class="progress-card">${er ? `<img src="${Stickers.url(er.sticker)}" alt="">` : ''}<div class="grow"><b>${done} of ${ts.length} to-dos done</b><div class="small">${er ? 'Sticker earned this day ♡' : 'No sticker this day'}</div></div></div>` : ''}`,
      foot: `<button class="btn soft" data-clear>Clear day</button><button class="btn" data-ok>Save</button>`,
      onMount: (sh, api) => {
        bindEmoji(sh, v => { e.emoji = v; });
        sh.addEventListener('click', ev => {
          const b = ev.target.closest('button'); if (!b) return;
          if ('ty' in b.dataset && !b.dataset.emo) { e.type = b.dataset.ty; $$('[data-ty]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#dayLbl', sh).hidden = e.type !== 'custom'; if (e.type === 'custom') $('#dayLbl', sh).focus(); }
          if ('ok' in b.dataset) {
            e.text = $('#dayTxt', sh).value.trim(); e.label = $('#dayLbl', sh).value.trim();
            if (e.type === 'custom' && !e.label) { toast('Type your label first'); $('#dayLbl', sh).focus(); return; }
            if (!e.emoji && !e.text && !e.type) delete S.cal[d]; else S.cal[d] = e;
            save('cal'); api.close(); renderCalendar();
          }
          if ('clear' in b.dataset) { delete S.cal[d]; save('cal'); api.close(); renderCalendar(); toast('Day cleared'); }
        });
      }
    });
  }

  /* ================= SETTINGS ================= */
  const THEMES = [
    ['vibrant', 'Rich & vibrant', ['#0f1838', '#2c418a', '#e9c27b', '#f2b5ca']],
    ['sage', 'Sage & cream', ['#f0ecdc', '#9db592', '#6b8962', '#fffbef']],
    ['sky', 'White & baby blue', ['#ffffff', '#b0d6f5', '#5a93c8', '#e3effa']],
    ['beige', 'Brown & beige', ['#efe5d6', '#d8b48f', '#8a5f40', '#f9f3ea']]
  ];
  async function exportData() {
    const out = { app: 'custom-mood', version: 1, exported: new Date().toISOString(), data: {} };
    for (const k of await DB.keys()) out.data[k] = await DB.get(k);
    for (const k of ['settings', 'journal', 'tasks', 'routines', 'log', 'earned', 'cal']) out.data[k] = S[k];
    for (const id in PAGES) out.data['page:' + id] = PAGES[id];
    return JSON.stringify(out);
  }
  function openSettings() {
    openSheet({
      title: 'Settings',
      body: `<div class="field"><span class="lbl">Colour theme</span><div class="theme-grid">${THEMES.map(([k, l, sw]) => `<button class="theme-card" data-th="${k}" aria-pressed="${S.settings.theme === k}"><div class="sw">${sw.map(c => `<i style="background:${c}"></i>`).join('')}</div><b>${l}</b></button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Backup</span><p class="small" style="margin:0">Your journal and lists are saved only on this phone. Save a backup file now and then, so nothing is lost if the app is removed.</p>
          <div class="row wrap"><button class="btn soft" id="bkSave">Save backup file</button><label class="btn soft" for="bkFile">Restore from file</label><input type="file" id="bkFile" accept=".json,application/json" hidden></div><div id="bkMsg" class="small"></div></div>
        <div class="field"><span class="lbl">About</span><p class="small" style="margin:0">${Stickers.count} stickers in the library. ${S.earned.length} earned in your sticker book.</p></div>`,
      onMount: (sh, api) => {
        sh.addEventListener('click', e => {
          const b = e.target.closest('[data-th]'); if (!b) return;
          S.settings.theme = b.dataset.th; save('settings'); applyTheme();
          $$('[data-th]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          rerender();
        });
        $('#bkSave', sh).addEventListener('click', async () => {
          const json = await exportData();
          const name = `custom-mood-backup-${today()}.json`;
          if (window.AndroidBridge && window.AndroidBridge.saveBackup) { $('#bkMsg', sh).textContent = window.AndroidBridge.saveBackup(name, json); return; }
          try {
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
            document.body.appendChild(a); a.click(); a.remove();
            $('#bkMsg', sh).textContent = 'Backup file saved to Downloads as ' + name + '.';
          } catch (err) { $('#bkMsg', sh).textContent = 'Saving files is not possible here.'; }
        });
        $('#bkFile', sh).addEventListener('change', async e => {
          const f = e.target.files[0]; if (!f) return;
          let obj; try { obj = JSON.parse(await f.text()); } catch (err) { $('#bkMsg', sh).textContent = 'That file is not a Custom Mood backup.'; return; }
          if (!obj || obj.app !== 'custom-mood' || !obj.data) { $('#bkMsg', sh).textContent = 'That file is not a Custom Mood backup.'; return; }
          $('#bkMsg', sh).innerHTML = `<div class="confirm-box"><b>Replace everything in the app with this backup from ${esc((obj.exported || '').slice(0, 10))}?</b><div class="row"><button class="btn soft" data-rc="no">Cancel</button><button class="btn" data-rc="yes">Restore</button></div></div>`;
          $('#bkMsg', sh).onclick = async ev => {
            const r = ev.target.closest('[data-rc]'); if (!r) return;
            if (r.dataset.rc === 'no') { $('#bkMsg', sh).textContent = ''; return; }
            for (const k of await DB.keys()) await DB.del(k);
            for (const k in obj.data) await DB.set(k, obj.data[k]);
            for (const k in PAGES) delete PAGES[k];
            await load(); applyTheme(); api.close(); J.open = false; SB.open = false; rerender(); toast('Backup restored');
          };
        });
      }
    });
  }

  /* Android back button: close the top-most layer first. */
  window.cmBack = function () {
    if ($('.celebrate')) { $('.celebrate').remove(); return true; }
    if (SHEETS.length) { SHEETS[SHEETS.length - 1].close(); return true; }
    if (ED) { closeEditor(); return true; }
    if (S.settings.tab === 'journal' && J.open) { J.open = false; renderJournal(); return true; }
    if (S.settings.tab === 'stickers' && SB.open) { SB.open = false; renderStickerBook(); return true; }
    if (S.settings.tab !== 'journal') { go('journal'); return true; }
    return false;
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.cmBack(); });
  function saveNow() {
    if (ED) { commitInk(); savePage(ED.pg); }
    ['settings', 'journal', 'tasks', 'routines', 'log', 'earned', 'cal'].forEach(k => { clearTimeout(saveTimers[k]); DB.set(k, S[k]); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  window.addEventListener('pagehide', saveNow);
  window.cmSaveNow = saveNow;
  let rsTimer;
  window.addEventListener('resize', () => { clearTimeout(rsTimer); rsTimer = setTimeout(() => { if (!ED && view) scaleInners(view); }, 120); });

  let lastDay = today();
  setInterval(() => { // midnight rollover keeps the to-do list on the right day
    const t = today();
    if (t !== lastDay) { if (T.date === lastDay) T.date = t; lastDay = t; if (!ED && !SHEETS.length) rerender(); }
  }, 60000);

  (async function boot() {
    await load();
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* optional */ }
    applyTheme(); shell();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (view) scaleInners(view); });
    go(S.settings.tab || 'journal');
  })();
})();
