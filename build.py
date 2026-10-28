"""Builds the single-file app from src/ and fonts/.

Outputs:
  web/index.html                         the phone web app (GitHub Pages)
  web/sw.js                              offline service worker, cache name tied to this build
  android/app/src/main/assets/index.html the same app for the optional Android wrapper

Run: python3 build.py
"""
import base64, hashlib, pathlib

R = pathlib.Path(__file__).parent
FACES = [
    ('Nunito', 'nunito-latin-400-normal.woff2', 400, 'normal'),
    ('Nunito', 'nunito-latin-700-normal.woff2', 700, 'normal'),
    ('Nunito', 'nunito-latin-800-normal.woff2', 800, 'normal'),
    ('Caveat', 'caveat-latin-400-normal.woff2', 400, 'normal'),
    ('Caveat', 'caveat-latin-600-normal.woff2', 600, 'normal'),
    ('Caveat', 'caveat-latin-700-normal.woff2', 700, 'normal'),
    ('Gaegu', 'gaegu-latin-400-normal.woff2', 400, 'normal'),
    ('Gaegu', 'gaegu-latin-700-normal.woff2', 700, 'normal'),
    ('Playfair Display', 'playfair-display-latin-500-normal.woff2', 500, 'normal'),
    ('Playfair Display', 'playfair-display-latin-400-italic.woff2', 400, 'italic'),
    ('Playfair Display', 'playfair-display-latin-500-italic.woff2', 500, 'italic'),
]
TITLE = '♡𝓒𝓾𝓼𝓽𝓸𝓶 𝓜𝓸𝓸𝓭 ♡'

fonts = ''.join(
    f"@font-face{{font-family:'{n}';font-style:{s};font-weight:{w};font-display:swap;"
    f"src:url(data:font/woff2;base64,{base64.b64encode((R / 'fonts' / f).read_bytes()).decode()}) format('woff2')}}\n"
    for n, f, w, s in FACES)
css = (R / 'src/styles.css').read_text()
js = (R / 'src/logic.js').read_text() + '\n' + (R / 'src/stickers.js').read_text() + '\n' + (R / 'src/app.js').read_text()

# Service worker registration. Skipped inside the Android wrapper, which serves files itself.
SW = """<script>
if ('serviceWorker' in navigator && !window.AndroidBridge && location.protocol !== 'file:') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
}
</script>"""

html = f'''<!doctype html>
<html lang="en" data-mood="beige"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f9f3ea">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Custom Mood">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" href="./icons/icon-192.png">
<link rel="apple-touch-icon" href="./icons/icon-192.png">
<title>{TITLE}</title></head><body>
<style>
{fonts}{css}
</style>
<noscript>This app needs JavaScript.</noscript>
<script>
{js}
</script>
{SW}
</body></html>
'''

(R / 'web/index.html').write_text(html)
(R / 'android/app/src/main/assets/index.html').write_text(html)

version = hashlib.sha256((html + (R / 'web/manifest.webmanifest').read_text()).encode()).hexdigest()[:10]
sw = (R / 'tools/sw.template.js').read_text().replace('__VERSION__', version)
(R / 'web/sw.js').write_text(sw)
print(f'Built web/index.html ({len(html) // 1024} KB), cache version {version}')
