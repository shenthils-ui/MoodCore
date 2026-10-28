# ♡𝓒𝓾𝓼𝓽𝓸𝓶 𝓜𝓸𝓸𝓭 ♡

A cute journaling app for an Android phone:

- **Journal**: a book with pages. Double tap the cover to open it, tap a page to draw, write, and add shapes and stickers.
- **Sticker book**: read only. You earn 1 sticker on each day you finish all your to-dos. A day with no to-dos gives none, routines do not count, and a sticker you already earned stays if you untick a to-do later.
- **To-do and routines**: checkbox or counter to-dos with your own emoji, and routines on chosen days and times.
- **Calendar**: a mood emoji, a short note and a day type (birthday, party, appointment, your own label) for each day.
- 4 colour themes and 378 original stickers.

No cloud, no accounts, no tracking. Everything is stored on the phone.

## Install on the phone

1. One time only, on github.com: open this repo, go to **Settings > Pages**, and under **Source** choose **GitHub Actions**.
2. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to show a green tick. Re-run it if it ran before step 1.
3. The app is at `https://shenthils-ui.github.io/MoodCore/`.
4. On the phone, open that address in **Chrome**.
5. Tap the three-dot menu, then **Add to Home screen** (or **Install app**), then **Install**.
6. Open the app from its pink bow icon. It works without internet from now on.

## Your data

- Data is saved in Chrome's storage on that phone only.
- Clearing Chrome's site data, or uninstalling the app, deletes it.
- Save a backup now and then: gear icon > **Save backup file**. It goes to Downloads.
- **Restore from file** replaces everything in the app with the backup.
- Moving from the old APK version: in the old app use **Save backup file**, then in this app use **Restore from file**.

## Updating the app

1. Edit the files in `src/`.
2. Run `python3 build.py`.
3. Run the tests: `node --test "tests/*.test.mjs"`. Optional phone-size browser check: `npm i --no-save playwright && node tests/e2e.mjs`.
4. Commit and push to `main`. GitHub runs the tests, then deploys. If a test fails, nothing is deployed.
5. On the phone, open the app once with internet, then close and reopen it. The new version loads. Your data is kept.

## Project layout

| Path | What it is |
|---|---|
| `src/logic.js` | Rules without screens: routine repeats, daily sticker rule, backup format |
| `src/app.js` | App logic and screens |
| `src/stickers.js` | The sticker library, drawn in code |
| `src/styles.css` | Look and the 4 themes |
| `fonts/` | Fonts, built into the page so it works offline (SIL Open Font License) |
| `tests/` | `logic.test.mjs` (Node unit tests), `e2e.mjs` (browser check at 390x844) |
| `build.py` | Builds `web/index.html`, `web/sw.js` and the Android copy |
| `tools/sw.template.js` | Source of the offline service worker |
| `web/` | What GitHub Pages serves |
| `android/` | Optional Android app wrapper (see `android/README.md`) |
