/* Custom Mood sticker library: original vector stickers, drawn in code.
   54 motifs x 7 colour packs = 378 stickers. Every sticker gets a white
   die-cut edge and a soft shadow, like a real paper sticker. */
(function () {
  const PACKS = [
    { id: 'coquette', name: 'Coquette', main: '#f4a7b9', light: '#fcd5de', dark: '#d9738e', accent: '#fff6f8', line: '#a94f69' },
    { id: 'cherry', name: 'Cherry', main: '#d8293f', light: '#f48b97', dark: '#8e1426', accent: '#ffe3e7', line: '#5e0c19' },
    { id: 'midnight', name: 'Midnight', main: '#33508f', light: '#9db3de', dark: '#1b2b57', accent: '#f4ead0', line: '#121d3b' },
    { id: 'cozy', name: 'Cozy', main: '#c9a27e', light: '#eddcc4', dark: '#8a6244', accent: '#fff8ec', line: '#55392a' },
    { id: 'mono', name: 'Mono', main: '#3a3a3a', light: '#e8e4de', dark: '#151515', accent: '#ffffff', line: '#111111' },
    { id: 'sage', name: 'Sage', main: '#9db592', light: '#d8e4cf', dark: '#5f7a57', accent: '#fffbef', line: '#3f523a' },
    { id: 'lilac', name: 'Lilac', main: '#c3aee3', light: '#e9def7', dark: '#8b6fb8', accent: '#fdfaff', line: '#5d4683' }
  ];
  const WORDS = { coquette: 'xoxo', cherry: 'love', midnight: 'dream', cozy: 'cozy', mono: 'hi!', sage: 'calm', lilac: 'cute' };
  const BLUSH = '#f39bb0';

  const O = (p, w) => `stroke="${p.line}" stroke-width="${w || 2.6}" stroke-linejoin="round" stroke-linecap="round"`;
  const face = (p, x, y, s) => {
    s = s || 1;
    return `<circle cx="${x - 7 * s}" cy="${y}" r="${2.3 * s}" fill="${p.line}"/><circle cx="${x + 7 * s}" cy="${y}" r="${2.3 * s}" fill="${p.line}"/>` +
      `<ellipse cx="${x - 12 * s}" cy="${y + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="${BLUSH}" opacity=".75"/><ellipse cx="${x + 12 * s}" cy="${y + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="${BLUSH}" opacity=".75"/>` +
      `<path d="M${x - 3 * s} ${y + 4 * s} Q${x} ${y + 7.5 * s} ${x + 3 * s} ${y + 4 * s}" fill="none" ${O(p, 1.8 * s)}/>`;
  };
  const shine = (x, y, rx, ry, rot, c) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c || '#fff'}" opacity=".85" transform="rotate(${rot} ${x} ${y})"/>`;
  const HEART = 'M50 84 C20 64 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 64 50 84Z';
  const heartAt = (cx, cy, s, fill, p, w) => `<path d="${HEART}" fill="${fill}" ${O(p, (w || 2.6) / s)} transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})"/>`;
  const SPARK = 'M50 10 C54 38 62 46 90 50 C62 54 54 62 50 90 C46 62 38 54 10 50 C38 46 46 38 50 10Z';
  const sparkAt = (cx, cy, s, fill, p) => `<path d="${SPARK}" fill="${fill}" ${O(p, 2.4 / s)} transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})"/>`;
  const starPts = (cx, cy, ro, ri) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  };
  const bowShape = (p, fill) => `
    <path d="M47 53 L35 81 L43 77 L47 85 L52 56Z" fill="${p.dark}" ${O(p)}/>
    <path d="M53 53 L65 81 L57 77 L53 85 L48 56Z" fill="${p.dark}" ${O(p)}/>
    <path d="M50 48 C40 32 16 24 13 38 C10 52 32 60 50 52Z" fill="${fill}" ${O(p)}/>
    <path d="M50 48 C60 32 84 24 87 38 C90 52 68 60 50 52Z" fill="${fill}" ${O(p)}/>
    <path d="M45 47 C37 39 25 36 21 41" fill="none" stroke="${p.dark}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
    <path d="M55 47 C63 39 75 36 79 41" fill="none" stroke="${p.dark}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="50" cy="50" rx="7" ry="8" fill="${p.main}" ${O(p)}/>
    <path d="M19 36 C21 32 26 31 30 33" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
  const gingham = (p) => `<pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${p.accent}"/><rect width="5" height="10" fill="${p.main}" opacity=".55"/><rect width="10" height="5" fill="${p.main}" opacity=".55"/></pattern>`;

  const MOTIFS = [
    ['bow', 'Bow', (p) => `<g transform="translate(-8 -6) scale(1.16)">${bowShape(p, p.main)}</g>`],
    ['gingham-bow', 'Gingham bow', (p) => `<defs>${gingham(p)}</defs><g transform="translate(-8 -6) scale(1.16)">${bowShape(p, 'url(#g)')}</g>`],
    ['ribbon', 'Ribbon', (p) => `
      <path d="M48 54 C38 66 52 74 38 90" fill="none" stroke="${p.line}" stroke-width="10" stroke-linecap="round"/>
      <path d="M52 54 C62 66 48 74 62 90" fill="none" stroke="${p.line}" stroke-width="10" stroke-linecap="round"/>
      <path d="M48 54 C38 66 52 74 38 90" fill="none" stroke="${p.light}" stroke-width="5.6" stroke-linecap="round"/>
      <path d="M52 54 C62 66 48 74 62 90" fill="none" stroke="${p.light}" stroke-width="5.6" stroke-linecap="round"/>
      <path d="M50 46 C40 26 18 28 22 42 C25 54 42 52 50 48Z" fill="${p.light}" ${O(p)}/>
      <path d="M50 46 C60 26 82 28 78 42 C75 54 58 52 50 48Z" fill="${p.light}" ${O(p)}/>
      <circle cx="50" cy="48" r="6" fill="${p.main}" ${O(p)}/>`],
    ['heart', 'Puffy heart', (p) => `<path d="${HEART}" fill="${p.main}" ${O(p)}/>` + shine(30, 33, 7, 4, -35) + `<circle cx="40" cy="27" r="2" fill="#fff" opacity=".8"/>`],
    ['check-heart', 'Checkered heart', (p) => `<defs><clipPath id="c"><path d="${HEART}"/></clipPath><pattern id="k" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${p.accent}"/><rect width="8" height="8" fill="${p.dark}"/><rect x="8" y="8" width="8" height="8" fill="${p.dark}"/></pattern></defs><g clip-path="url(#c)"><rect width="100" height="100" fill="url(#k)"/></g><path d="${HEART}" fill="none" ${O(p)}/>`],
    ['lace-heart', 'Lace heart', (p) => `<path d="${HEART}" fill="${p.accent}" stroke="${p.light}" stroke-width="12" stroke-linejoin="round"/><path d="${HEART}" fill="none" stroke="${p.accent}" stroke-width="12" stroke-dasharray="0.1 7" stroke-linecap="round"/><path d="${HEART}" fill="${p.main}" ${O(p)} transform="translate(9 9) scale(.82)"/>` + shine(33, 35, 5, 3, -35)],
    ['cherries', 'Cherries', (p) => `
      <path d="M38 58 C42 40 52 28 62 18" fill="none" ${O(p, 3)}/><path d="M64 60 C62 44 62 30 62 18" fill="none" ${O(p, 3)}/>
      <path d="M62 18 C70 10 84 12 86 20 C78 26 68 24 62 18Z" fill="${p.light}" ${O(p, 2.2)}/>
      <circle cx="35" cy="68" r="16" fill="${p.main}" ${O(p)}/><circle cx="66" cy="70" r="16" fill="${p.main}" ${O(p)}/>` + shine(29, 62, 4, 2.6, -40) + shine(60, 64, 4, 2.6, -40)],
    ['strawberry', 'Strawberry', (p) => `
      <path d="M50 88 C30 80 17 58 21 44 C25 32 40 30 50 34 C60 30 75 32 79 44 C83 58 70 80 50 88Z" fill="${p.main}" ${O(p)}/>
      ${[[36, 48], [50, 46], [64, 48], [42, 60], [58, 60], [50, 72], [34, 62], [66, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="${p.accent}"/>`).join('')}
      <path d="M50 36 L40 26 L46 30 L44 18 L50 28 L56 18 L54 30 L60 26Z" fill="${p.light}" ${O(p, 2.2)}/>`],
    ['flower', 'Flower', (p) => [0, 72, 144, 216, 288].map(a => `<circle cx="50" cy="29" r="16" fill="${p.main}" ${O(p)} transform="rotate(${a} 50 50)"/>`).join('') + `<circle cx="50" cy="50" r="12" fill="${p.accent}" ${O(p)}/><circle cx="46" cy="47" r="1.6" fill="${p.dark}"/><circle cx="54" cy="47" r="1.6" fill="${p.dark}"/><circle cx="50" cy="54" r="1.6" fill="${p.dark}"/>`],
    ['daisy', 'Daisy', (p) => Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="26" rx="6" ry="16" fill="${p.accent}" ${O(p, 2)} transform="rotate(${i * 30} 50 50)"/>`).join('') + `<circle cx="50" cy="50" r="12" fill="${p.main}" ${O(p)}/>` + shine(46, 46, 3, 2, -30)],
    ['tulip', 'Tulip', (p) => `
      <path d="M50 60 L50 90" ${O(p, 3)}/>
      <path d="M50 84 C40 82 32 72 32 62 C42 64 48 72 50 84Z" fill="${p.light}" ${O(p, 2.2)}/>
      <path d="M50 80 C60 78 68 70 70 60 C60 62 52 70 50 80Z" fill="${p.light}" ${O(p, 2.2)}/>
      <path d="M32 24 L41 38 L50 20 L59 38 L68 24 C73 44 66 62 50 62 C34 62 27 44 32 24Z" fill="${p.main}" ${O(p)}/>` + shine(40, 46, 3, 7, 10)],
    ['lily', 'Star lily', (p) => Array.from({ length: 6 }, (_, i) => `<path d="M50 50 C42 38 44 20 50 10 C56 20 58 38 50 50Z" fill="${p.main}" ${O(p, 2.2)} transform="rotate(${i * 60} 50 50)"/><path d="M50 44 L50 22" stroke="${p.dark}" stroke-width="1.4" stroke-linecap="round" transform="rotate(${i * 60} 50 50)"/>`).join('') + `<circle cx="50" cy="50" r="5" fill="${p.accent}" ${O(p, 2)}/>`],
    ['rose', 'Rose', (p) => `
      <ellipse cx="32" cy="78" rx="14" ry="7" fill="${p.light}" ${O(p, 2.2)} transform="rotate(-25 32 78)"/>
      <ellipse cx="68" cy="78" rx="14" ry="7" fill="${p.light}" ${O(p, 2.2)} transform="rotate(25 68 78)"/>
      <circle cx="50" cy="48" r="29" fill="${p.main}" ${O(p)}/>
      <path d="M50 48 C56 44 58 52 52 56 C42 60 38 46 46 40 C58 32 70 44 64 58 C58 70 38 70 32 58 C26 44 34 28 50 26" fill="none" stroke="${p.dark}" stroke-width="2.4" stroke-linecap="round"/>`],
    ['star', 'Star friend', (p) => `<polygon points="${starPts(50, 54, 38, 18)}" fill="${p.line}" stroke="${p.line}" stroke-width="10" stroke-linejoin="round"/><polygon points="${starPts(50, 54, 38, 18)}" fill="${p.main}" stroke="${p.main}" stroke-width="5" stroke-linejoin="round"/>` + face(p, 50, 56, .8)],
    ['sparkles', 'Sparkles', (p) => sparkAt(42, 54, .72, p.main, p) + sparkAt(76, 24, .3, p.light, p) + sparkAt(78, 76, .22, p.dark, p)],
    ['moon', 'Sleepy moon', (p) => `<path d="M64 12 C40 16 24 36 26 58 C28 78 48 92 70 88 C52 80 44 66 44 50 C44 34 52 20 64 12Z" fill="${p.main}" ${O(p)}/>
      <path d="M33 50 C35 53 39 53 41 50" fill="none" ${O(p, 2)}/><ellipse cx="35" cy="58" rx="3.4" ry="2" fill="${BLUSH}" opacity=".75"/>` + sparkAt(76, 30, .2, p.light, p) + sparkAt(84, 58, .14, p.light, p)],
    ['cloud', 'Cloud', (p) => `<path d="M24 72 C10 72 8 54 22 52 C20 36 40 30 48 42 C52 26 74 26 76 44 C90 42 94 64 80 72Z" fill="${p.light}" ${O(p)}/>` + face(p, 50, 58, .9)],
    ['butterfly', 'Butterfly', (p) => `
      <path d="M50 46 C40 20 14 18 14 34 C14 48 34 52 50 50Z" fill="${p.main}" ${O(p)}/><path d="M50 46 C60 20 86 18 86 34 C86 48 66 52 50 50Z" fill="${p.main}" ${O(p)}/>
      <path d="M50 52 C36 54 22 64 28 76 C34 84 46 72 50 58Z" fill="${p.light}" ${O(p)}/><path d="M50 52 C64 54 78 64 72 76 C66 84 54 72 50 58Z" fill="${p.light}" ${O(p)}/>
      <ellipse cx="50" cy="54" rx="4" ry="16" fill="${p.dark}" ${O(p, 2)}/><path d="M48 39 C44 30 40 26 36 25 M52 39 C56 30 60 26 64 25" fill="none" ${O(p, 2)}/>
      <circle cx="30" cy="34" r="4" fill="${p.accent}"/><circle cx="70" cy="34" r="4" fill="${p.accent}"/>`],
    ['lips', 'Kiss', (p) => `<path d="M16 52 C30 56 40 57 50 57 C60 57 70 56 84 52 C74 74 26 74 16 52Z" fill="${p.main}" ${O(p)}/><path d="M16 52 C26 38 40 34 50 44 C60 34 74 38 84 52 C70 54 60 52 50 54 C40 52 30 54 16 52Z" fill="${p.dark}" ${O(p)}/>` + shine(38, 63, 6, 2.4, 0)],
    ['letter', 'Love letter', (p) => `<rect x="14" y="28" width="72" height="48" rx="5" fill="${p.accent}" ${O(p)}/><path d="M16 31 L50 58 L84 31" fill="none" ${O(p)}/><path d="M16 74 L40 52 M84 74 L60 52" fill="none" ${O(p, 2)}/>` + heartAt(50, 57, .26, p.main, p, 2.2)],
    ['cake', 'Cake slice', (p) => `
      <path d="M18 54 L82 40 L82 78 L18 78Z" fill="${p.accent}" ${O(p)}/>
      <path d="M18 66 L82 60" stroke="${p.main}" stroke-width="5"/>
      <path d="M18 54 L82 40 L82 48 C76 54 72 46 66 53 C60 58 56 50 50 56 C44 61 40 54 34 59 C28 64 22 58 18 62Z" fill="${p.main}" ${O(p)}/>
      <path d="M66 34 C66 26 72 22 74 20" fill="none" ${O(p, 2)}/><circle cx="66" cy="38" r="6" fill="${p.dark}" ${O(p, 2.2)}/>` + shine(64, 36, 1.8, 1.2, 0)],
    ['teacup', 'Teacup', (p) => `
      <ellipse cx="48" cy="80" rx="34" ry="7" fill="${p.main}" ${O(p)}/>
      <path d="M72 50 C88 48 88 68 70 68" fill="none" ${O(p, 5.5)}/><path d="M72 50 C88 48 88 68 70 68" fill="none" stroke="${p.accent}" stroke-width="2.4"/>
      <path d="M22 44 L74 44 C74 66 64 78 48 78 C32 78 22 66 22 44Z" fill="${p.accent}" ${O(p)}/>
      <path d="M24 54 L72 54" stroke="${p.main}" stroke-width="5"/>` + heartAt(48, 25, .2, p.light, p, 2) + `<path d="M40 38 C36 34 44 32 40 28 M58 38 C54 34 62 32 58 28" fill="none" stroke="${p.line}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`],
    ['iced-coffee', 'Iced latte', (p) => `
      <path d="M56 26 L66 8" stroke="${p.line}" stroke-width="8" stroke-linecap="round"/><path d="M56 26 L66 8" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 30 L70 30 L64 88 L36 88Z" fill="${p.accent}" ${O(p)}/>
      <path d="M32 46 L68 46 L64 86 L36 86Z" fill="${p.main}"/>
      <rect x="38" y="50" width="10" height="9" rx="2" fill="#fff" opacity=".55" transform="rotate(-12 43 54)"/><rect x="52" y="56" width="9" height="8" rx="2" fill="#fff" opacity=".5" transform="rotate(14 56 60)"/>
      <rect x="24" y="23" width="52" height="9" rx="4" fill="${p.light}" ${O(p)}/>` + heartAt(50, 74, .16, p.accent, p, 1.8)],
    ['cassette', 'Cassette', (p) => `<rect x="10" y="26" width="80" height="50" rx="7" fill="${p.main}" ${O(p)}/><rect x="18" y="32" width="64" height="16" rx="3" fill="${p.accent}"/><path d="M24 40 L60 40" stroke="${p.line}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><rect x="28" y="52" width="44" height="16" rx="8" fill="${p.dark}" ${O(p, 2)}/><circle cx="39" cy="60" r="5" fill="${p.accent}"/><circle cx="61" cy="60" r="5" fill="${p.accent}"/><path d="M30 76 L36 68 L64 68 L70 76" fill="${p.light}" ${O(p, 2)}/>`],
    ['vinyl', 'Record', (p) => `<circle cx="50" cy="50" r="38" fill="${p.dark}" ${O(p)}/><circle cx="50" cy="50" r="30" fill="none" stroke="${p.main}" stroke-width="1" opacity=".55"/><circle cx="50" cy="50" r="24" fill="none" stroke="${p.main}" stroke-width="1" opacity=".55"/><circle cx="50" cy="50" r="13" fill="${p.main}" ${O(p, 2)}/><circle cx="50" cy="50" r="2.6" fill="${p.accent}"/><path d="M26 30 C30 24 36 20 42 18" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`],
    ['camera', 'Instant camera', (p) => `<rect x="12" y="26" width="76" height="56" rx="12" fill="${p.accent}" ${O(p)}/><path d="M12 42 L88 42" stroke="${p.main}" stroke-width="6"/><rect x="18" y="31" width="12" height="7" rx="2" fill="${p.light}" ${O(p, 1.8)}/><circle cx="50" cy="58" r="17" fill="${p.main}" ${O(p)}/><circle cx="50" cy="58" r="10" fill="${p.dark}" ${O(p, 2)}/>` + shine(46, 54, 3, 2, -30) + `<circle cx="78" cy="33" r="3.4" fill="${p.dark}"/><rect x="36" y="20" width="16" height="7" rx="3" fill="${p.main}" ${O(p, 2)}/>`],
    ['polaroid', 'Photo', (p) => `<g transform="rotate(-7 50 50)"><rect x="22" y="12" width="56" height="74" rx="2" fill="#fffdf8" ${O(p)}/><rect x="28" y="18" width="44" height="46" fill="${p.light}"/><circle cx="62" cy="28" r="5" fill="${p.accent}"/><path d="M28 64 L44 44 L54 54 L60 48 L72 64Z" fill="${p.main}"/><path d="M32 76 L58 76" stroke="${p.line}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></g>` + heartAt(74, 18, .2, p.main, p, 2)],
    ['books', 'Book stack', (p) => `<rect x="20" y="66" width="62" height="16" rx="3" fill="${p.main}" ${O(p)}/><rect x="16" y="50" width="62" height="16" rx="3" fill="${p.light}" ${O(p)}/><rect x="24" y="34" width="58" height="16" rx="3" fill="${p.dark}" ${O(p)}/><path d="M30 74 L70 74 M24 58 L64 58 M32 42 L70 42" stroke="${p.accent}" stroke-width="2" stroke-linecap="round" opacity=".8"/>` + heartAt(56, 24, .18, p.main, p, 2)],
    ['teddy', 'Teddy', (p) => `<circle cx="28" cy="30" r="12" fill="${p.main}" ${O(p)}/><circle cx="72" cy="30" r="12" fill="${p.main}" ${O(p)}/><circle cx="28" cy="30" r="5.5" fill="${p.light}"/><circle cx="72" cy="30" r="5.5" fill="${p.light}"/><circle cx="50" cy="55" r="31" fill="${p.main}" ${O(p)}/><ellipse cx="50" cy="65" rx="13" ry="10" fill="${p.accent}" ${O(p, 2)}/><ellipse cx="50" cy="61" rx="4" ry="3" fill="${p.line}"/><path d="M47 68 Q50 71 53 68" fill="none" ${O(p, 1.8)}/><circle cx="39" cy="50" r="2.6" fill="${p.line}"/><circle cx="61" cy="50" r="2.6" fill="${p.line}"/><ellipse cx="33" cy="60" rx="4" ry="2.4" fill="${BLUSH}" opacity=".7"/><ellipse cx="67" cy="60" rx="4" ry="2.4" fill="${BLUSH}" opacity=".7"/>`],
    ['bunny', 'Bunny', (p) => `<ellipse cx="38" cy="28" rx="8" ry="20" fill="${p.accent}" ${O(p)} transform="rotate(-8 38 28)"/><ellipse cx="62" cy="28" rx="8" ry="20" fill="${p.accent}" ${O(p)} transform="rotate(8 62 28)"/><ellipse cx="38" cy="30" rx="3.6" ry="13" fill="${p.light}" transform="rotate(-8 38 30)"/><ellipse cx="62" cy="30" rx="3.6" ry="13" fill="${p.light}" transform="rotate(8 62 30)"/><ellipse cx="50" cy="62" rx="28" ry="24" fill="${p.accent}" ${O(p)}/><circle cx="41" cy="60" r="2.5" fill="${p.line}"/><circle cx="59" cy="60" r="2.5" fill="${p.line}"/><path d="M45 66 C47 69 50 68 50 65.5 C50 68 53 69 55 66" fill="none" ${O(p, 1.8)}/><ellipse cx="34" cy="67" rx="4" ry="2.4" fill="${p.main}" opacity=".85"/><ellipse cx="66" cy="67" rx="4" ry="2.4" fill="${p.main}" opacity=".85"/><g transform="translate(58 10) scale(.36)">${bowShape(p, p.main)}</g>`],
    ['kitty', 'Kitty', (p) => `<path d="M20 42 L24 16 L40 30 C46 28 54 28 60 30 L76 16 L80 42 C84 56 78 78 50 78 C22 78 16 56 20 42Z" fill="${p.main}" ${O(p)}/><path d="M26 24 L28 34 L35 30Z M74 24 L72 34 L65 30Z" fill="${p.light}"/><circle cx="38" cy="50" r="2.6" fill="${p.line}"/><circle cx="62" cy="50" r="2.6" fill="${p.line}"/><path d="M44 58 C46 61 50 61 50 58 C50 61 54 61 56 58" fill="none" ${O(p, 1.8)}/><path d="M14 52 L28 55 M14 60 L28 59 M86 52 L72 55 M86 60 L72 59" stroke="${p.line}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="33" cy="60" rx="4" ry="2.4" fill="${BLUSH}" opacity=".75"/><ellipse cx="67" cy="60" rx="4" ry="2.4" fill="${BLUSH}" opacity=".75"/>`],
    ['perfume', 'Perfume', (p) => `<rect x="38" y="14" width="24" height="15" rx="4" fill="${p.main}" ${O(p)}/><rect x="43" y="28" width="14" height="10" fill="${p.light}" ${O(p, 2)}/><rect x="22" y="38" width="56" height="48" rx="12" fill="${p.light}" ${O(p)}/><path d="M26 60 L74 60 L74 74 C74 80 70 82 66 82 L34 82 C30 82 26 80 26 74Z" fill="${p.main}" opacity=".7"/>` + shine(32, 48, 3, 6, 0) + heartAt(50, 52, .18, p.accent, p, 2)],
    ['lipstick', 'Lipstick', (p) => `<path d="M40 46 L40 26 C40 18 60 10 60 18 L60 46Z" fill="${p.main}" ${O(p)}/><rect x="36" y="44" width="28" height="14" rx="2" fill="${p.light}" ${O(p)}/><rect x="34" y="56" width="32" height="32" rx="4" fill="${p.dark}" ${O(p)}/><path d="M42 64 L42 80" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`],
    ['candle', 'Candle', (p) => `<rect x="34" y="42" width="32" height="44" rx="5" fill="${p.accent}" ${O(p)}/><path d="M34 50 C34 42 66 42 66 50 L66 54 C62 54 62 62 58 62 C54 62 56 54 50 54 C46 54 46 58 42 58 C38 58 38 54 34 54Z" fill="${p.main}" ${O(p, 2.2)}/><path d="M50 42 L50 34" ${O(p, 2)}/><path d="M50 10 C59 20 59 30 50 34 C41 30 41 20 50 10Z" fill="#ffcc66" ${O(p, 2)}/><path d="M50 20 C54 25 54 29 50 31 C46 29 46 25 50 20Z" fill="#fff3c9"/>`],
    ['mushroom', 'Mushroom', (p) => `<path d="M38 54 C36 68 36 80 40 86 L60 86 C64 80 64 68 62 54Z" fill="${p.accent}" ${O(p)}/><path d="M12 54 C12 30 32 16 50 16 C68 16 88 30 88 54 C70 60 30 60 12 54Z" fill="${p.main}" ${O(p)}/><circle cx="32" cy="38" r="5" fill="${p.accent}"/><circle cx="54" cy="28" r="6" fill="${p.accent}"/><circle cx="70" cy="44" r="4.5" fill="${p.accent}"/><circle cx="44" cy="70" r="1.8" fill="${p.line}"/><circle cx="56" cy="70" r="1.8" fill="${p.line}"/><path d="M47 75 Q50 78 53 75" fill="none" ${O(p, 1.6)}/>`],
    ['sprig', 'Sprig', (p) => `<path d="M30 88 C40 66 52 40 72 12" fill="none" ${O(p, 3)}/>` + [[36, 72, -50, 'main'], [48, 70, 40, 'light'], [44, 54, -50, 'light'], [57, 50, 40, 'main'], [54, 36, -50, 'main'], [66, 32, 40, 'light'], [70, 16, -10, 'main']].map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="${p[c]}" ${O(p, 2)} transform="rotate(${r} ${x} ${y})"/>`).join('')],
    ['shell', 'Shell', (p) => `<path d="M50 84 L16 44 C20 22 38 12 50 12 C62 12 80 22 84 44Z" fill="${p.main}" ${O(p)}/>` + [26, 38, 50, 62, 74].map((x, i) => `<path d="M50 82 L${x} ${[30, 18, 14, 18, 30][i]}" stroke="${p.dark}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`).join('') + `<path d="M40 84 L60 84 L56 90 L44 90Z" fill="${p.light}" ${O(p, 2)}/>`],
    ['ice-cream', 'Ice cream', (p) => `<path d="M34 52 L66 52 L50 92Z" fill="#ecc68f" ${O(p)}/><path d="M40 60 L58 74 M60 60 L44 78 M46 56 L56 64" stroke="#c38f5a" stroke-width="1.6" stroke-linecap="round"/><circle cx="50" cy="32" r="14" fill="${p.light}" ${O(p)}/><path d="M30 52 C28 40 40 36 50 40 C60 36 72 40 70 52 C66 56 64 50 60 56 C56 60 54 52 50 56 C46 60 42 52 38 56 C34 58 32 54 30 52Z" fill="${p.main}" ${O(p)}/><circle cx="52" cy="16" r="5.5" fill="${p.dark}" ${O(p, 2)}/>` + shine(44, 28, 3, 2, -30)],
    ['macaron', 'Macaron', (p) => `<path d="M16 46 C16 26 84 26 84 46Z" fill="${p.main}" ${O(p)}/><rect x="16" y="46" width="68" height="9" rx="3" fill="${p.accent}" ${O(p, 2.2)}/><path d="M16 55 L84 55 C84 74 16 74 16 55Z" fill="${p.main}" ${O(p)}/>` + shine(32, 36, 7, 2.6, -8)],
    ['notes', 'Music notes', (p) => `<path d="M36 70 L36 26 L72 18 L72 62" fill="none" ${O(p, 4)}/><path d="M36 26 L72 18 L72 28 L36 36Z" fill="${p.dark}" ${O(p, 2)}/><ellipse cx="28" cy="72" rx="10" ry="8" fill="${p.main}" ${O(p)} transform="rotate(-20 28 72)"/><ellipse cx="64" cy="64" rx="10" ry="8" fill="${p.main}" ${O(p)} transform="rotate(-20 64 64)"/>` + sparkAt(84, 82, .14, p.light, p)],
    ['heart-lock', 'Heart lock', (p) => `<path d="M34 50 L34 32 C34 14 66 14 66 32 L66 50" fill="none" stroke="${p.line}" stroke-width="10" stroke-linecap="round"/><path d="M34 50 L34 32 C34 14 66 14 66 32 L66 50" fill="none" stroke="${p.light}" stroke-width="5" stroke-linecap="round"/>` + heartAt(50, 62, .62, p.main, p) + `<circle cx="50" cy="58" r="4" fill="${p.line}"/><path d="M50 60 L50 68" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>`],
    ['key', 'Key', (p) => `<path d="M50 44 L50 88 M50 74 L60 74 M50 82 L58 82" fill="none" stroke="${p.line}" stroke-width="9" stroke-linecap="round"/><path d="M50 44 L50 88 M50 74 L60 74 M50 82 L58 82" fill="none" stroke="${p.main}" stroke-width="4.5" stroke-linecap="round"/>` + heartAt(50, 30, .46, p.main, p) + `<path d="${HEART}" fill="${p.accent}" transform="translate(${50 - 50 * .2} ${30 - 50 * .2}) scale(.2)"/>`],
    ['rainbow', 'Rainbow', (p) => [[34, p.main], [26, p.light], [18, p.dark]].map(([r, c]) => `<path d="M${50 - r} 66 A${r} ${r} 0 0 1 ${50 + r} 66" fill="none" stroke="${p.line}" stroke-width="10.5"/><path d="M${50 - r} 66 A${r} ${r} 0 0 1 ${50 + r} 66" fill="none" stroke="${c}" stroke-width="6.5"/>`).join('') + `<path d="M6 72 C4 62 14 58 18 62 C20 54 32 56 30 64 C36 64 36 74 30 74 L10 74 C8 74 6 74 6 72Z" fill="${p.accent}" ${O(p, 2.2)}/><path d="M70 72 C68 62 78 58 82 62 C84 54 96 56 94 64 C98 66 96 74 92 74 L74 74 C72 74 70 74 70 72Z" fill="${p.accent}" ${O(p, 2.2)}/>`],
    ['snowflake', 'Snowflake', (p) => [0, 60, 120].map(a => `<g transform="rotate(${a} 50 50)"><path d="M50 14 L50 86 M50 24 L42 16 M50 24 L58 16 M50 76 L42 84 M50 76 L58 84" fill="none" stroke="${p.line}" stroke-width="8" stroke-linecap="round"/></g>`).join('') + [0, 60, 120].map(a => `<g transform="rotate(${a} 50 50)"><path d="M50 14 L50 86 M50 24 L42 16 M50 24 L58 16 M50 76 L42 84 M50 76 L58 84" fill="none" stroke="${p.main}" stroke-width="3.8" stroke-linecap="round"/></g>`).join('') + `<circle cx="50" cy="50" r="6" fill="${p.accent}" ${O(p, 2)}/>`],
    ['clover', 'Clover', (p) => `<path d="M50 52 C54 70 60 80 66 88" fill="none" ${O(p, 3)}/>` + [0, 90, 180, 270].map(a => `<g transform="rotate(${a} 50 50)">${heartAt(50, 32, .38, p.main, p)}</g>`).join('') + `<circle cx="50" cy="50" r="3" fill="${p.dark}"/>`],
    ['apple', 'Apple', (p) => `<path d="M50 30 C40 22 18 24 18 50 C18 72 34 88 50 82 C66 88 82 72 82 50 C82 24 60 22 50 30Z" fill="${p.main}" ${O(p)}/><path d="M50 30 C50 22 52 16 56 12" fill="none" ${O(p, 3)}/><path d="M54 22 C60 12 74 12 76 18 C68 24 60 24 54 22Z" fill="${p.light}" ${O(p, 2.2)}/>` + shine(30, 44, 4, 8, 20)],
    ['mirror', 'Hand mirror', (p) => `<rect x="44" y="64" width="12" height="28" rx="6" fill="${p.dark}" ${O(p)}/><ellipse cx="50" cy="40" rx="26" ry="30" fill="${p.main}" ${O(p)}/><ellipse cx="50" cy="40" rx="18" ry="22" fill="${p.light}" ${O(p, 2)}/><path d="M40 30 L48 22 M40 40 L56 24" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/><g transform="translate(32 54) scale(.36)">${bowShape(p, p.main)}</g>`],
    ['sun', 'Sunny', (p) => Array.from({ length: 10 }, (_, i) => `<path d="M50 6 L57 20 L43 20Z" fill="${p.light}" ${O(p, 2)} transform="rotate(${i * 36} 50 50)"/>`).join('') + `<circle cx="50" cy="50" r="26" fill="${p.main}" ${O(p)}/>` + face(p, 50, 50, .95)],
    ['balloon', 'Heart balloon', (p) => `<path d="M50 70 C46 78 56 82 50 92" fill="none" ${O(p, 2)}/>` + heartAt(50, 40, .78, p.main, p) + `<path d="M46 68 L54 68 L50 73Z" fill="${p.main}" ${O(p, 2)}/>` + shine(34, 30, 4, 7, 30)],
    ['gift', 'Gift', (p) => `<rect x="18" y="44" width="64" height="42" rx="4" fill="${p.main}" ${O(p)}/><rect x="14" y="34" width="72" height="14" rx="4" fill="${p.light}" ${O(p)}/><rect x="45" y="34" width="10" height="52" fill="${p.accent}" ${O(p, 2)}/><g transform="translate(25 6) scale(.5)">${bowShape(p, p.accent)}</g>`],
    ['plant', 'Little plant', (p) => `<path d="M50 56 L50 34" ${O(p, 3)}/><ellipse cx="38" cy="36" rx="12" ry="7" fill="${p.light}" ${O(p, 2.2)} transform="rotate(-30 38 36)"/><ellipse cx="62" cy="30" rx="12" ry="7" fill="${p.light}" ${O(p, 2.2)} transform="rotate(30 62 30)"/>` + heartAt(50, 22, .2, p.main, p, 2) + `<path d="M26 54 L74 54 L68 88 L32 88Z" fill="${p.main}" ${O(p)}/><rect x="22" y="50" width="56" height="10" rx="3" fill="${p.dark}" ${O(p)}/>` + face(p, 50, 72, .7)],
    ['tag', 'Word tag', (p) => `<path d="M12 34 L68 34 L86 50 L68 66 L12 66 C8 66 8 34 12 34Z" fill="${p.main}" ${O(p)}/><circle cx="72" cy="50" r="3.4" fill="${p.accent}" ${O(p, 1.8)}/><text x="38" y="56" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" font-size="18" fill="${p.accent}">${WORDS[p.id]}</text>`],
    ['tape-stripe', 'Washi tape', (p) => `<g transform="rotate(-14 50 50)"><path d="M8 38 L12 42 L8 46 L12 50 L8 54 L12 58 L8 62 L92 62 L88 58 L92 54 L88 50 L92 46 L88 42 L92 38Z" fill="${p.light}" opacity=".95"/>${[16, 30, 44, 58, 72].map(x => `<rect x="${x}" y="38" width="7" height="24" fill="${p.main}" opacity=".7"/>`).join('')}</g>`],
    ['tape-dots', 'Dotty tape', (p) => `<g transform="rotate(10 50 50)"><path d="M8 38 L12 42 L8 46 L12 50 L8 54 L12 58 L8 62 L92 62 L88 58 L92 54 L88 50 L92 46 L88 42 L92 38Z" fill="${p.main}" opacity=".9"/>${[18, 30, 42, 54, 66, 78].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 46 : 54}" r="3.2" fill="${p.accent}"/>`).join('')}</g>`]
  ];

  const FILTER = `<filter id="dc" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feGaussianBlur in="d" stdDeviation="1.8" result="b"/><feOffset in="b" dy="1.6" result="o"/><feFlood flood-color="#3a2a20" flood-opacity=".24"/><feComposite in2="o" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  const LIST = [];
  const BY_ID = {};
  for (const p of PACKS) {
    for (const [mid, mname, fn] of MOTIFS) {
      const id = mid + '.' + p.id;
      const s = { id, pack: p.id, name: mname, fn, p };
      LIST.push(s);
      BY_ID[id] = s;
    }
  }
  const cache = {};
  function url(id) {
    if (cache[id]) return cache[id];
    const s = BY_ID[id];
    if (!s) return '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" width="216" height="216"><defs>${FILTER}</defs><g filter="url(#dc)">${s.fn(s.p)}</g></svg>`;
    return (cache[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  /* Fixed, shuffled order in which daily reward stickers are handed out,
     so each new day brings a different motif and colour. */
  function rewardOrder() {
    const out = [];
    const nm = MOTIFS.length, np = PACKS.length;
    for (let i = 0; i < nm * np; i++) {
      const m = (i * 23) % nm, pk = (i * 3 + Math.floor(i / nm)) % np;
      out.push(MOTIFS[m][0] + '.' + PACKS[pk].id);
    }
    const seen = new Set();
    const res = out.filter(x => !seen.has(x) && seen.add(x));
    for (const s of LIST) if (!seen.has(s.id)) res.push(s.id);
    return res;
  }
  window.Stickers = { PACKS, LIST, BY_ID, url, rewardOrder, count: LIST.length };
})();
