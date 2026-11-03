---
name: portfolio-frontend
description: How the vuthycheam.com portfolio frontend is built — stack, page anatomy, the 3/33/67/97 grid, CSS/JS conventions, design vocabulary, and how to screenshot a change. Use when creating or editing anything in the root *.html pages, src/, or assets/.
---

# Portfolio frontend (vuthycheam.com)

## 1. Frontend rules (non-negotiable)

- **Static site, no build.** Hand-written HTML, one stylesheet, one script. No framework,
  bundler, preprocessor, TypeScript or npm packages. `package.json` has no dependencies
  and its only scripts run `python3 -m http.server`.
- **No new dependencies without asking.** That includes CDN scripts and new Google
  Fonts. The only third-party code today is Matter.js 0.19.0 from jsDelivr, loaded on
  `index.html` and `contact.html`. (A three.js glass logo was tried and removed.) `docs/animation-libraries.md` is a reference list,
  not permission to add anything from it.
- **Desktop only.** Every page except `desktop-only.html` starts with an inline script
  that sends phones and tablets to `desktop-only.html` and lets crawlers through. Don't
  build mobile layouts; check changes at desktop sizes (1440×900 by default).
- **Pushing `main` deploys.** GitHub Pages serves the repo root, and `CNAME` points it at
  vuthycheam.com. Never push, and only commit when asked. The served pages must stay at
  the repo root.
- **Respect reduced motion.** Every animated system checks
  `prefers-reduced-motion: reduce` and falls back to the settled state. New motion must
  do the same.

## 2. How the site is built today

```
index.html            home: loader bar → header (name + time) and X/FPS/Y HUD
about.html            about ([CLOSE] only so far)
contact.html          contact boxes rail (uses Matter.js)
desktop-only.html     mobile notice; self-contained inline <style>, loads nothing
src/css/style.css     ALL styling (~2000 lines)
src/js/main.js        ALL behaviour (~2600 lines of independent IIFEs)
src/work/*.html       one page per discipline: ai-ml, data-science, software-development,
                      ui-ux (work list)
src/work/ai-data-science.html, full-stack.html   older pages with their own inline
                      <style>; not linked from any live page
src/sections/*.html   sections lifted out of index.html "for later reuse"; not loaded
assets/icons/         logo.svg, favicon.png, logo(-white).png, apple-touch-icon.png, cursors
assets/images/, assets/videos/   page imagery, one folder per page (e.g. images/ui-ux/)
docs/                 notes and README screenshots
```

Every live page loads, in this order in `<head>`:
1. The inline mobile-redirect script (it must stay the first thing after `<meta charset>`).
2. viewport, title, description, canonical and `og:*` meta tags.
3. Favicons: `logo.svg?v=16`, `favicon.png?v=16`, `logo-white.png?v=16` (dark mode),
   `apple-touch-icon.png?v=15`.
4. Google Fonts (one shared `css2?family=…` URL) → `style.css?v=30`.
5. The inline "arrived from inside the site" script, which reads
   `sessionStorage.pageTransition` and adds `pt pt-open` to `<html>`.

At the end of `<body>`: `main.js?v=21`, deferred on every page except `index.html`.
Matter.js goes before it on the pages that use it.

`?v=N` is a manual cache-buster, and every page uses the same number. Bump it on every
page at once when a change has to reach visitors who have the old file cached. Paths
are relative: `src/work/*` pages use `../css/`, `../js/` and `../../assets/`.

## 3. Shared pieces and adding a page

There are no includes or templates. Each page carries its own copy of the shared
markup, so a shared change has to be made in every file.

- **No grid on any page.** The user removed the 3/33/67/97 grid lines and plus marks
  from every page, home included, so don't add them back unless asked. The grid
  survives only as layout percentages (e.g. the HUD's 33% column) and as the faint
  lines on the page-transition backdrop.
- **No hero mark**: a big 3D glass VC (after guglieri.com's "nu") was built and
  then removed at the user's request. Don't bring it back unless asked.
- **No menu on home** (yet): the user removed the orage.studio-style menu again, so
  home is just the header and the X/FPS/Y HUD. Inner pages are only reachable by URL
  until a menu returns, so ask before adding one.
- **Header**: home has `#home-link` `[VUTHY CHEAM]` and `.time-badge` (`#bkk-time`), each
  with its visible glyphs 16px from the top and 16px from its side. The small header
  logo was removed (home currently shows no logo). Every other page has only `.close-btn`
  (`[CLOSE]`), which links back to home.
- **Body class**: `index.html` starts as `is-loading`. Every other page uses `loaded`,
  which shows its `.reveal` elements immediately.
- **Page transition**: pure CSS, cross-document View Transitions (`@view-transition`
  in the `===== Page transition =====` block of style.css). The old page sinks (scale
  0.91, `brightness(0.6)`, **sharp square corners**) while the new page rises from
  the bottom with a soft shadow, using curves fitted to cathydolle.com. Every
  navigation, back to home included, plays this same forward animation. The user
  rejected rounded corners and a reversed "undo" animation for going back, so don't
  re-add either. The backdrop is a mid grey (#4a4b51) with the grid drawn faintly on it. main.js
  prefetches pages on hover (Speculation Rules) so the transition starts on click.
  Keep transform/filter animations separate from shadow ones; `clip-path` on a
  snapshot blanks it in Chrome. Firefox and reduced motion switch pages instantly,
  and it only runs over http(s), not file://.
- **In-site flag**: the `===== Arriving from inside the site =====` module in main.js
  sets `sessionStorage.pageTransition` on internal link clicks, and the next page's
  head script turns it into `html.pt-open`. That's how home skips its loader and
  intro for visitors already on the site, so keep the head script on every page.

**Adding a page:** copy the closest existing page at the same depth (`about.html` at the
root, `src/work/ai-ml.html` under work) and keep its head as it is.
Change the title, description, canonical and `og:url`; fix relative paths if the depth
changed; keep the header and deferred `main.js`; then ask the user how it should be linked (home has no menu
right now). Page-specific JS goes in a new IIFE at the
end of `main.js` that returns early if its element isn't on the page (see §5).
`sitemap.xml` lists only `/`, so ask before adding pages to it.

## 4. Names for the pieces of the design

Use these words with the user, and confirm a name before relying on one marked (?).

| Say | Code | What it is |
|---|---|---|
| cells, "row 2 column 3" | — | the 3×3 grid of percentages code comments still position things by |
| loading page / loader | `.loader`, `.loader-line` | white screen with a progress bar (no number) |
| logo | `assets/icons/*` | the VC mark (not shown on home right now) |
| tab icon | `logo.svg`, `favicon.png`, `logo-white.png` | the browser-tab icon |
| name link (?) | `#home-link`, `.home-link` | `[VUTHY CHEAM]`, cycles through Khmer and Thai |
| time badge | `.time-badge`, `#bkk-time` | `BKK[TH] 1:20:31 PM` plus a dot |
| HUD (?) | `.hud`, `#hudX/#hudFps/#hudY` | X / FPS / Y readout under the logo |
| close button | `.close-btn` | `[CLOSE]` top-left on inner pages |
| contact boxes / rail | `.contact-boxes`, `.contact-box` | horizontally scrolling boxes on contact |
| work list / work rows | `.work-list`, `.work-row` | ui-ux project rows; `.work-preview` shows the logo on hover |
| grid fill | `.grid-fill` | ui-ux merged field covering columns 2–3 |

## 5. Styles and scripts

**CSS** (`src/css/style.css`)
- Tokens in `:root`: `--paper #FDFDFD`, `--ink #17181C`, `--accent #B4371F`, `--sans`
  (a monospace stack: ui-monospace, SF Mono, …; all body text is mono), `--header-h`.
  Use the tokens. These colours are written out directly by convention: grid rule
  `#dfe2e5`, plus marks `#b3b9bf`, logo ink `#0E0F12`.
- Hand-formatted in the existing style: two-space indent inside the file, compact
  `prop:value;` with no space after the colon, several short declarations on one line.
- Class names are short, hyphenated, and scoped by page or feature (`.cell-ai-rest`,
  `.work-row`, `.loader-line-fill`); state classes go on `body`/`html`
  (`is-loading`, `loaded`, `menu-open`, `pt-*`).
- Major blocks start with a `/* ===== Name ===== */` header. Comments explain *why*
  (the stacking context, the handoff that has to match), and that density is the norm.
- Position things against the grid in percentages (3/33/67/97 horizontally, 33/67
  vertically) rather than centring them in a container.
- Sizes are rem, with vh for anything that has to follow the grid rows.

**JS** (`src/js/main.js`)
- One IIFE per feature: `(function(){ const el = document.getElementById('x'); if (!el) return; … })();`.
  Always guard, because the same file runs on every page.
- Plain ES2015+ with no modules or imports. Use the Web Animations API (`el.animate`)
  or rAF for motion.
- Only animate `transform` and `opacity` for anything that has to stay aligned with
  other moving parts, and put colour/height on a separate `animate()` call. Mixing
  them pushes the animation onto the main thread, and pieces drift apart during load
  (this once pulled the plus arms off the lines in a since-removed intro).
- Text "scramble" effects share a glyph-cycling pattern (a `GLYPHS` string plus
  ticks), so reuse it instead of inventing a new one.

## 6. Checking how a change looks

The user previews with VS Code Live Server, which can serve stale CSS, so hard-reload
before trusting what it shows. To check a change yourself:

```bash
python3 -m http.server 8765 >/dev/null 2>&1 &     # from the repo root (npm run dev uses 8000)
cd "$SCRATCH"                                      # playwright-cli writes .playwright-cli/ into the cwd; keep it out of the repo
playwright-cli open http://localhost:8765/
playwright-cli resize 1440 900
playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"   # home: wait out the loader (~2.6s)
playwright-cli screenshot --filename="$SCRATCH/home.png"
playwright-cli console          # should report 0 errors
playwright-cli close; pkill -f "http.server 8765"
```

- `playwright-cli` is installed globally. Its agent guide is at
  `$(npm root -g)/@playwright/cli/node_modules/playwright-core/lib/tools/skills/playwright-cli/SKILL.md`;
  read it for hover, mousemove, set-reduced-motion and video-start. Use `hover` for the
  work rows.
- Headless browsers match the redirect's bot regex, so they aren't sent to desktop-only.
- For animations, freeze frames in-page: `document.getAnimations()` → `.pause()` → set
  `currentTime`, then measure with `getBoundingClientRect()` or screenshot. Static
  frames can look right when live playback isn't (main-thread stalls), so for motion
  bugs also record real frames (`video-start`) or block the main thread on purpose.
- Clear `sessionStorage` (or open a fresh session) to see the first-load path. With
  `pageTransition=1` set, the loader is skipped.
- Look at every screenshot before reporting, and show it to the user.

## 7. Leave what's built alone

- Don't restyle, rename, reformat or refactor working parts unless asked, even ones
  that look odd. Most oddities have a reason in a nearby comment: a stacking context,
  a sub-pixel offset, a handoff that has to match.
- Things that are coupled; change one and you must change the other:
  - the grid percentages ↔ the faint lines in the `::view-transition` backdrop gradients
- Leave `src/sections/`, `ai-data-science.html` and `full-stack.html` untouched unless
  told otherwise.
- Don't change the copy (menu labels, contact details) without being asked.

## 8. Working with the user

- Ask before big design changes: new layouts, palette or font changes, new motion
  systems, or removing a feature. Small asked-for tweaks (move it down a bit, make it
  bigger) are fine to just do, then report the value you picked and where to change it.
- Keep diffs small and local: touch only the files the request needs, and match the
  surrounding code and comment voice.
- Show a screenshot (or frozen frames for motion) of the result. Say what you couldn't
  verify.
- Report outcomes plainly, with file:line links, and finish with whether anything was
  committed (by default, nothing is).
