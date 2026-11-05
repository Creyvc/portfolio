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
  Fonts. There is no third-party code today: Matter.js was dropped on 2026-11-04 with the
  features that used it, and a three.js glass logo was tried and removed. `docs/animation-libraries.md` is a reference list,
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
index.html            home: grainient background, header line (name, X/FPS/Y HUD, time),
                      bottom-centre lockup with its intro
about.html            about ([CLOSE] only); fallback for WHO IS on a modified click / no JS
journey.html          Journey (the lockup's JOURNEY): [CLOSE] and "COMING SOON", dead centre, in
                      light text over a glitching pixel field (.pixel-bg, after thibaud.film)
lab.html              Lab: academic + self-initiated projects (the lockup's WORK/LAB); no title,
                      just the work list (.work-row, hover logo preview), centred
contact.html          contact boxes rail
desktop-only.html     mobile notice; self-contained inline <style>, loads nothing
src/css/style.css     ALL styling (~880 lines)
src/js/main.js        ALL behaviour (independent IIFEs)
src/js/grainient.js   the owner's plain-JS port of React Bits' <Grainient /> (copied from
                      ~/tokenz/frontend) plus one local, opt-in `wander` option (meandering
                      scroll heading and a roaming gradient angle, so colours go anywhere);
                      re-copying the original would drop it
assets/icons/         logo.svg, favicon.png, logo(-white).png, apple-touch-icon.png
assets/images/about/  avatar.png, the ink drawing right of the WHO IS text (greyscale, trimmed)
assets/images/lab/    the Lab rows' hover logos, trimmed to the mark
docs/                 notes and README screenshots
```

All pages sit at the repo root, one level only (2026-11-04 cleanup: src/work/, src/sections/,
assets/videos/ and the unused images were deleted; they're in git history if needed). Keep it
that way: a new page goes at the root, its media in assets/images/<page>/. The same day, dead code went too:
the JS blocks and CSS rules for the old menu, custom cursor, project grid, marquee, black
divider/dot grid, tag cloud and cartoon eyes (main.js 1895 → 1355 lines, style.css 1660 →
880). A before/after computed-style diff of every page showed no change. Don't revive them
from git without asking.

Every live page loads, in this order in `<head>`:
1. The inline mobile-redirect script (it must stay the first thing after `<meta charset>`).
2. viewport, title, description, canonical and `og:*` meta tags.
3. Favicons: `logo.svg?v=16`, `favicon.png?v=16`, `logo-white.png?v=16` (dark mode),
   `apple-touch-icon.png?v=15`.
4. Google Fonts (one shared `css2?family=…` URL) → `style.css?v=30`.
5. The inline "arrived from inside the site" script, which reads
   `sessionStorage.pageTransition` and adds `pt pt-open` to `<html>`.

At the end of `<body>`: `main.js`, deferred on every page except `index.html`, with
`grainient.js` before it on the pages that use it (home, contact).

`?v=N` is a manual cache-buster, and every page uses the same number. Bump it on every
page at once when a change has to reach visitors who have the old file cached. Paths
are relative from the root: `src/css/`, `src/js/`, `assets/`.

## 3. Shared pieces and adding a page

There are no includes or templates. Each page carries its own copy of the shared
markup, so a shared change has to be made in every file.

- **No grid on any page.** The user removed the 3/33/67/97 grid lines and plus marks
  from every page, home included, so don't add them back unless asked. The grid
  survives only as layout percentages (e.g. the HUD's 33% column) and as the faint
  lines on the page-transition backdrop.
- **Page background** (home only): `<div class="page-bg">` is the first child of body
  (`body.home`). main.js mounts `Grainient(.page-bg, {dark→grey→white #0e0f12…#f4f5f7, angle 75 (roams with wander), speed 6, flow 1.5,
  silk .35, grain .08, intro, wander})` right away (body starts `.loaded`; the 1.6s bloom is its own intro),
  and adds `html.is-lit` on success. `.page-bg` is fixed at z -1, with a CSS
  gradient fallback and an SVG-noise grain `::after` (overlay). `body.home` and `.hero`
  are transparent. The text has no boxes (the user rejected them). It's coloured letter by
  letter: `followText()` in main.js reads the grainient canvas under each piece about ten
  times a second (gl.readPixels in a rAF scheduled after the engine's), decides white or ink
  per letter (5% switching margin), and paints the unchanged text through a hard-stop stripe
  per letter (`.letter-tinted` = background-clip:text). The time's dot is decided on its own.
- **Lockup** (home, `#lockup`, bottom-centre, fixed): `WHO IS / CONTACT` · VC logo · `WORK / LAB`,
  after a "WHO IS / TALENTS · DENISE · PRODUCTION / CREATION" lockup the owner sent. Impact
  (a system font, so no web font; the site's mono was tried and rejected), 2.25rem, line-height
  .92, and the logo is 2 lines tall.
  Words are letter-tinted and the logo is white/ink as a whole. Links: WHO IS opens the #whois panel in place
  (about.html only for a modified click / no JS), contact, journey.html (JOURNEY), lab.html (WORK/LAB). **Intro (the preload animation):** the logo rises
  from below the bottom edge into place (1.3s, after 0.25s), then the stacks clip-reveal outward (0.9s, ease-in-out).
  A head script on index.html sets `html.lockup-intro` (hidden, with a 3s CSS failsafe) and
  `html.bg-pending` (dark page-bg until mount) before first paint, and main.js clears them.
  It's skipped on `pt-open` arrivals and with reduced motion.
- **HUD** (X / FPS / Y): on the header line (`top:1rem`, baseline level with the time,
  measured), between 33% and 67% of the width.
  Other palettes the owner likes are listed in the main.js comment.
- **No hero mark**: a big 3D glass VC (after guglieri.com's "nu") was built and
  then removed at the user's request. Don't bring it back unless asked.
- **No menu on home** (yet): the user removed the orage.studio-style menu again, so
  home is just the header and the X/FPS/Y HUD. Inner pages are only reachable by URL
  until a menu returns, so ask before adding one.
- **Header**: home has `#home-link` `[VUTHY CHEAM]` and `.time-badge` (`#bkk-time`), each
  with its visible glyphs 16px from the top and 16px from its side. The small header
  logo was removed (home currently shows no logo). Every other page has only `.close-btn`
  (`[CLOSE]`), which links back to home.
- **Body class**: every page, home included, starts as `loaded`, which shows its
  `.reveal` elements immediately. The old white progress-bar preloader is gone; the home
  page's only intro is the lockup's.
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
  head script turns it into `html.pt-open` (`.reveal` won't re-fade). It's harmless now
  that there's no preloader; keep the head script consistent across pages.

**Adding a page:** copy the closest existing page (`about.html`, `journey.html` or
`lab.html`, all at the root) and keep its head as it is.
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
| logo | `assets/icons/*` | the VC mark (not shown on home right now) |
| tab icon | `logo.svg`, `favicon.png`, `logo-white.png` | the browser-tab icon |
| name link (?) | `#home-link`, `.home-link` | `[VUTHY CHEAM]`, cycles through Khmer and Thai |
| time badge | `.time-badge`, `#bkk-time` | `BKK[TH] 1:20:31 PM` plus a dot |
| HUD (?) | `.hud`, `#hudX/#hudFps/#hudY` | X / FPS / Y readout under the logo |
| close button | `.close-btn` | `[CLOSE]` top-left on inner pages |
| contact boxes / rail | `.contact-boxes`, `.contact-box` | horizontally scrolling boxes on contact. Sticky, after cathydolle.com: the wheel glides (GLIDE 0.12s), and 160ms after input stops the nearest box glides to the page's middle (measured on screen; offsetLeft reads 32px off) and holds through the 0.4s resize. Touch follows the finger, and release momentum picks the box. Position is kept as a fraction (`pos`) because scrollLeft rounds. Locked during the opening intro (`.is-intro`): JS swallows wheel and touch, and CSS sets overflow:hidden and touch-action:none. The intro waits for an arriving page transition to land: a head script on contact.html catches `pagereveal` into `window.ptSettled` (main.js is deferred and can miss the event), and the intro holds its blank first frame until that resolves (capped at 2.5s) |
| Instagram gradient | `.contact-box[data-label="Instagram"]` | 7th contact box: its own Grainient (Instagram colours, wander, speed 16, flow 2.4) mounted by main.js; contact.html loads grainient.js; the CSS `insta-flow` is the fallback (off under `.is-lit`) |
| Threads line | `.threads-mark` / `.threads-line` | 6th contact box: the Threads logo as one traced SVG line (pathLength 1), drawn on toward centre and off past it via stroke-dashoffset; run is 1.6 box-widths, and the line trails the scroll (TRAIL 0.45s) |
| work list / work rows | `.work-list`, `.work-row` | project rows on lab.html; `.work-preview` shows the logo on hover, on the hovered row's line (main.js sets its top) in the page's middle. On lab.html each name is followed by its kind of work in brackets (`.work-kind`, e.g. [UI/UX], [AI/ML]) inside a `.work-lead` wrapper. It's a sibling, not a child, of `.work-name` because the scramble rewrites textContent. Every logo is 3rem tall: logo files are trimmed to the mark with no transparent margin, so a new logo must be trimmed too |
| Journey / Lab pages | `journey.html`, `lab.html`, `.work-page`, `.is-centred` | two separate pages: journey.html is the Journey page, just "COMING SOON" in the window's dead centre; Lab has no title, only the list, also centred (`.is-centred`). Add only entries the owner supplies; don't invent any |
| pixel field | `.pixel-bg`, `body.journey` | journey.html only, after thibaud.film: a canvas with one pixel per 45px cell, scaled up unsmoothed. Dark colours only: a near-black base with 8 drifting colour clouds (greys, oxblood, brown, olive, navy), each wandering in its own direction and wrapping at the edges. Single cells flicker, rows slip sideways and blocks flash another tint. Steps at ~12fps, and reduced motion gets one still frame. The page's text is light there (`body.journey`). Keep the tints dark; the brightest cell is ~#42 |
| decrypting text | `[data-decrypt]`, `.sr-only` | journey.html's COMING SOON, big (clamp 1.5rem–3rem, mono so the width never moves). It loops: decode left to right through random glyphs (~1.2s), hold ~3.2s with the odd letter glitching for a frame, scramble back (~0.75s). The real text sits in a `.sr-only` copy, and the churning copy is `aria-hidden`. Reduced motion shows plain text |
| Who is | `#whois`, `.whois-text`, `[data-whois]`, `html.whois-open` | home only, after cathydolle.com's about: WHO IS opens a frosted layer over the WHOLE page (z 9998, above the header): blur 3px under a 50% paper tint, so the background, header, HUD and lockup show through soft. A small sharp text block pops up (rise + scale, overshoot), centred in the window and centre-aligned, with just the bio and availability; the owner removed the role line and the links. A click anywhere or Esc closes it. The 50% tint keeps ink text at AA over the darkest gradient, so don't thin it without checking. The content comes from the site; don't add claims the owner hasn't given, and there are no pronouns in the bio |

## 5. Styles and scripts

**CSS** (`src/css/style.css`)
- Tokens in `:root`: `--paper #FDFDFD`, `--ink #17181C`, `--accent #B4371F`, `--sans`
  (a monospace stack: ui-monospace, SF Mono, …; all body text is mono), `--header-h`.
  Use the tokens. These colours are written out directly by convention: grid rule
  `#dfe2e5`, plus marks `#b3b9bf`, logo ink `#0E0F12`.
- Hand-formatted in the existing style: two-space indent inside the file, compact
  `prop:value;` with no space after the colon, several short declarations on one line.
- Class names are short, hyphenated, and scoped by page or feature (`.cell-ai-rest`,
  `.work-row`, `.letter-tinted`); state classes go on `body`/`html`
  (`loaded`, `is-lit`, `menu-open`, `pt-*`).
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
playwright-cli eval "() => new Promise(r => setTimeout(r, 2500))"   # home: let the grainient bloom finish (~1.6s)
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
- Look at every screenshot before reporting, and show it to the user.

## 7. Leave what's built alone

- Don't restyle, rename, reformat or refactor working parts unless asked, even ones
  that look odd. Most oddities have a reason in a nearby comment: a stacking context,
  a sub-pixel offset, a handoff that has to match.
- Things that are coupled; change one and you must change the other:
  - the grid percentages ↔ the faint lines in the `::view-transition` backdrop gradients
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
