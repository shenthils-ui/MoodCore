// Browser check at phone size. Needs Playwright (not part of the app):
//   npm i --no-save playwright && node tests/e2e.mjs
// Serves web/ under /custom-mood/ like GitHub Pages does, then checks load,
// manifest, installability, offline start, tabs, backup export/import,
// pinch zoom, and nav text contrast in every theme.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x').pathname;
  if (!u.startsWith('/custom-mood/')) { res.writeHead(404).end(); return; }
  const f = path.join(WEB, u.slice('/custom-mood/'.length) || 'index.html');
  const file = fs.existsSync(f) && fs.statSync(f).isDirectory() ? path.join(f, 'index.html') : f;
  if (!file.startsWith(WEB) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, r));
const APP = `http://localhost:${server.address().port}/custom-mood/`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-'));
let failed = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' ' + x : '')); if (!c) failed++; };

const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true });
const p = await c.newPage();
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push(String(e)));

await p.goto(APP); await p.waitForTimeout(800);
ok('no console errors on load', errs.length === 0, JSON.stringify(errs));
ok('pinch zoom allowed', !/user-scalable=no|maximum-scale/.test(await p.getAttribute('meta[name=viewport]', 'content')));

const man = await p.evaluate(async () => { const h = document.querySelector('link[rel=manifest]').href; return { h, j: await (await fetch(h)).json() }; });
const m = man.j;
ok('manifest fields', m.display === 'standalone' && m.orientation === 'portrait' && m.start_url === './' && m.scope === './' && m.theme_color === '#f9f3ea' && m.background_color === '#f9f3ea' && m.short_name === 'Custom Mood');
for (const i of m.icons) ok('icon ' + i.src + ' ' + i.sizes + ' ' + (i.purpose || ''), (await c.request.get(new URL(i.src, man.h).href)).ok());

await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(500);
ok('service worker active', await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).active.state === 'activated'));
const cdp = await c.newCDPSession(p);
ok('Chrome reports no installability errors', (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.length === 0);

await p.click('[data-tab=todo]'); await p.click('#fab'); await p.click('[data-k=t]'); await p.fill('#tkName', 'Drink water TEST'); await p.click('[data-ok]'); await p.waitForTimeout(500);

await c.setOffline(true); await p.reload(); await p.waitForTimeout(1000);
ok('offline reload opens app', await p.locator('.brand').count() > 0);
for (const t of ['journal', 'stickers', 'todo', 'calendar']) {
  await p.click(`[data-tab=${t}]`); await p.waitForTimeout(300);
  ok('offline tab ' + t, (await p.locator(`[data-tab=${t}]`).getAttribute('aria-selected')) === 'true');
}
await p.click('[data-tab=todo]'); ok('to-do kept offline', (await p.content()).includes('Drink water TEST'));
await c.setOffline(false);

await p.click('#setBtn'); await p.waitForTimeout(400);
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bkSave')]);
const f = path.join(tmp, 'backup.json'); await dl.saveAs(f);
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
ok('backup downloads as custom-mood-backup-*.json', /^custom-mood-backup-.*\.json$/.test(dl.suggestedFilename()) && j.app === 'custom-mood', dl.suggestedFilename());
ok('backup holds the to-do', JSON.stringify(j).includes('Drink water TEST'));

// contrast of nav labels in every theme (WCAG AA = 4.5)
const themes = await p.$$eval('[data-th]', els => els.map(e => e.dataset.th));
for (const th of themes) {
  await p.click(`[data-th=${th}]`); await p.waitForTimeout(150);
  const r = await p.evaluate(() => {
    const px = (cs, prop) => { const cv = document.createElement('canvas').getContext('2d'); cv.fillStyle = cs[prop]; cv.fillRect(0, 0, 1, 1); return [...cv.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const out = [];
    for (const sel of ['.nav button[aria-selected=false] span', '.nav button[aria-selected=true] span']) {
      const el = document.querySelector(sel), btn = el.parentElement;
      const bg = getComputedStyle(btn).backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.querySelector('.nav')).backgroundColor : getComputedStyle(btn).backgroundColor;
      const cv = document.createElement('canvas').getContext('2d');
      cv.fillStyle = getComputedStyle(el).color; cv.fillRect(0, 0, 1, 1); const fg = [...cv.getImageData(0, 0, 1, 1).data].slice(0, 3);
      cv.fillStyle = bg; cv.fillRect(0, 0, 1, 1); const bgc = [...cv.getImageData(0, 0, 1, 1).data].slice(0, 3);
      out.push([fg, bgc]);
    }
    return out;
  });
  r.forEach(([fg, bg], i) => { const q = ratio(fg, bg); ok(`nav contrast ${th} ${i ? 'selected' : 'idle'}`, q >= 4.5, q.toFixed(2)); });
}
await p.click(`[data-th=${themes[themes.length - 1]}]`);
await p.keyboard.press('Escape');

await p.evaluate(() => new Promise(r => { const q = indexedDB.open('custom-mood'); q.onsuccess = () => { const t = q.result.transaction('kv', 'readwrite'); t.objectStore('kv').clear(); t.oncomplete = () => { q.result.close(); r(); }; }; }));
await p.reload(); await p.waitForTimeout(800); await p.click('[data-tab=todo]');
ok('data wiped before restore', !(await p.content()).includes('Drink water TEST'));
await p.click('#setBtn'); await p.waitForTimeout(400);
await p.setInputFiles('#bkFile', f); await p.waitForTimeout(300); await p.click('[data-rc=yes]'); await p.waitForTimeout(800);
await p.click('[data-tab=todo]'); ok('import restores data', (await p.content()).includes('Drink water TEST'));

// bad file is refused
fs.writeFileSync(path.join(tmp, 'bad.json'), '{"hello":1}');
await p.click('#setBtn'); await p.waitForTimeout(400);
await p.setInputFiles('#bkFile', path.join(tmp, 'bad.json')); await p.waitForTimeout(300);
ok('wrong file is refused', (await p.textContent('#bkMsg')).includes('not a Custom Mood backup'));
await p.keyboard.press('Escape');
await p.click('[data-tab=todo]'); ok('refused file left data untouched', (await p.content()).includes('Drink water TEST'));

ok('no console errors overall', errs.length === 0, JSON.stringify(errs));
await b.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);
