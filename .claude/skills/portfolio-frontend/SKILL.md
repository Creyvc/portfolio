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
index.html            home: plain paper, header line (just the time; the name and the X/FPS/Y HUD were removed 2026-11-05),
                      bottom-centre lockup with its intro
about.html            about ([CLOSE] only); fallback for WHO IS on a modified click / no JS
journey.html          Journey (the lockup's JOURNEY): [CLOSE] and "COMING SOON", dead centre, in
                      light text over a glitching pixel field (.pixel-bg, after thibaud.film)
playground.html       Playground (home's PLAYGROUND,): [CLOSE] and a decrypting "COMING SOON",
                      dead centre, in ink on plain paper (body.playground); nothing else yet
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
assets/icons/         logo.svg + favicon.png / logo-white.png: the two-blade V tab icon, transparent and
                      full-width, ink in light mode, white in dark; logo.png (og:image) and
                      apple-touch-icon.png: the V on an #F4F4F1 tile
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
3. Favicons: `logo.svg?v=18` (switches ink/white itself with an in-SVG prefers-color-scheme query),
   `favicon.png?v=18` (media light) and `logo-white.png?v=18` (media dark) as PNG fallbacks,
   `apple-touch-icon.png?v=16`.
4. Google Fonts (one shared `css2?family=…` URL) → `style.css?v=30`.
5. The inline "arrived from inside the site" script, which reads
   `sessionStorage.pageTransition` and adds `pt pt-open` to `<html>`.

At the end of `<body>`: `main.js`, deferred on every page except `index.html`, with
`grainient.js` before it on contact (the Instagram box).

`?v=N` is a manual cache-buster, and every page uses the same number. Bump it on every
page at once when a change has to reach visitors who have the old file cached. Paths
are relative from the root: `src/css/`, `src/js/`, `assets/`.

## 3. Shared pieces and adding a page

There are no includes or templates. Each page carries its own copy of the shared
markup, so a shared change has to be made in every file.

- **No grid on any page.** The user removed the 3/33/67/97 grid lines and plus marks
  from every page, home included, so don't add them back unless asked. The grid
  survives only as layout percentages and as the faint
  lines on the page-transition backdrop.
- **Home background**: none since 2026-11-05. The owner removed the grainient (and its
  per-letter white/ink text tinting); home is plain paper and every piece of text, the
  lockup words and logo included, is solid ink. grainient.js now only drives contact's Instagram box.
- **No preloader**: two were built and both removed by the owner — a hellohello.is-style one
  (slides, stock clips, count) and, on 2026-11-06, a W A S D-driven gear-shifter console after
  Reijo's "Speed." render (ray-marched in `shifter.js`, now deleted). Home opens straight onto
  the page. Don't add a preloader back unless asked.
- **No lockup** (2026-11-05): the owner removed the bottom-centre WHO IS / CONTACT · JOURNEY /
  WORK/LAB lockup (and its intro) after removing its logo. Home is now just a header line: the name (top
  left) with "WORK," (lab.html; comma included) and "PLAYGROUND," (plain text, no page yet; a size down at 2rem, capitals topping out level with the rest) 4rem after it (WORK, big: Space Grotesk 500 3rem, capitals topping out at 16px like the rest) 4rem after it, and JOURNEY, ABOUT, CONTACT, then the time (top right). JOURNEY is a plain link to
  journey.html. ABOUT and CONTACT (`[data-pop]`,
  aria-controls names the pop-up) open #whois and #contact-pop in place, over the same frosted
  layer; one main.js module ("Pop-ups (home)") drives both. Ask before adding other navigation.
- **No hero mark**: a big 3D glass VC (after guglieri.com's "nu") was built and
  then removed at the user's request. Don't bring it back unless asked.
- **No menu on home** (yet): the user removed the orage.studio-style menu again, so
  home is just the time and the lockup. Inner pages are only reachable by URL
  until a menu returns, so ask before adding one.
- **Header** (home): one line, in order: `.home-name` VUTHY CHEAM (plain text) · `.home-work`
  "WORK," (link to lab.html; Space Grotesk 500 3rem) · `.home-playground` "PLAYGROUND," (link to
  playground.html; 2rem) · `.home-nav` JOURNEY (journey.html) · ABOUT (`.home-about`, opens
  #whois) · CONTACT (opens #contact-pop) · `.time-badge` (`#bkk-time`, 6px dot). No margins
  between them: the header's justify-content:space-between pins the name top left and the time
  top right and spreads everything between at equal gaps (the owner asked for equal spacing).
  Small items: mono 0.8125rem, 500, 0.03em tracking, uppercase, margin-top .275rem; the big
  words' margin-tops are tuned so every word's capitals top out at 17px (measured). Hover only
  decrypts the links (no colour change; the owner asked for none) (main.js "Header link scramble": work-list glyphs, 14 steps
  × 40ms, width held during the run so the spread line never shifts, commas kept, real word in
  aria-label; off under reduced motion).
- **Body class**: every page, home included, starts as `loaded`, which shows its
  `.reveal` elements immediately. The old white progress-bar preloader is gone; the home
  page's only intro is the lockup's.
- **No page transition** (2026-11-05): the owner removed the View Transitions slide (old page
  sinking, new page rising), so changing page is an instant cut. Pages arrived at from inside
  the site still skip their `.reveal` fade-ins (`pt-open`). main.js still prefetches pages on
  hover (Speculation Rules) so clicks open fast. Don't add a transition back unless asked.
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
| logo | `assets/icons/*` (tab icon only; not on any page) | since 2026-11-06 a V made of two slanted blades: the owner supplied the right blade (a parallelogram slanting like "/", ~25° edges, top-left and bottom-right corners rounded) and asked for it mirrored into the left, then for it longer top to bottom: each blade is 130 tall, slant 0.465 across per unit down, 61 thick across, corner rounds starting 44 units back from the corner as cubic curves (handles 0.62 of the way to the corner; settled after the owner went rounder twice, then a little less); 8 units apart at the bottom; the mark is ~251 × 130. Light mode #111111, dark mode white (logo.svg media query; favicon.png / logo-white.png fallbacks); apple-touch-icon.png and logo.png (og:image) are the black V on #F4F4F1. Replaced the bar-V |
| tab icon | `logo.svg`, `favicon.png`, `logo-white.png` (transparent, bars fill the square; #111111 in light mode, white in dark) | the browser-tab icon |
| time badge | `.time-badge`, `#bkk-time` | `BKK[TH] 1:20:31 PM` plus a dot |
| close button | `.close-btn` | `[CLOSE]` top-left on inner pages |
| contact boxes / rail | `.contact-boxes`, `.contact-box` | horizontally scrolling boxes on contact. Sticky, after cathydolle.com: the wheel glides (GLIDE 0.12s), and 160ms after input stops the nearest box glides to the page's middle (measured on screen; offsetLeft reads 32px off) and holds through the 0.4s resize. Touch follows the finger, and release momentum picks the box. Position is kept as a fraction (`pos`) because scrollLeft rounds. Locked during the opening intro (`.is-intro`): JS swallows wheel and touch, and CSS sets overflow:hidden and touch-action:none. The intro starts straight away (there is no page transition to wait for) |
| Instagram gradient | `.contact-box[data-label="Instagram"]` | 7th contact box: its own Grainient (Instagram colours, wander, speed 16, flow 2.4) mounted by main.js; contact.html loads grainient.js; the CSS `insta-flow` is the fallback (off under `.is-lit`) |
| Threads line | `.threads-mark` / `.threads-line` | 6th contact box: the Threads logo as one traced SVG line (pathLength 1), drawn on toward centre and off past it via stroke-dashoffset; run is 1.6 box-widths, and the line trails the scroll (TRAIL 0.45s) |
| work list / work rows | `.work-list`, `.work-row` | project rows on lab.html; `.work-preview` shows the logo on hover, on the hovered row's line (main.js sets its top) in the page's middle. On lab.html each name is followed by its kind of work in brackets (`.work-kind`, e.g. [UI/UX], [AI/ML]) inside a `.work-lead` wrapper. It's a sibling, not a child, of `.work-name` because the scramble rewrites textContent. Every logo is 3rem tall: logo files are trimmed to the mark with no transparent margin, so a new logo must be trimmed too |
| Journey / Lab pages | `journey.html`, `lab.html`, `.work-page`, `.is-centred` | two separate pages: journey.html is the Journey page, just "COMING SOON" in the window's dead centre; Lab has no title, only the list, also centred (`.is-centred`). Add only entries the owner supplies; don't invent any |
| pixel field | `.pixel-bg`, `body.journey` | journey.html only, after thibaud.film: a canvas with one pixel per 45px cell, scaled up unsmoothed. Dark colours only: a near-black base with 8 drifting colour clouds (greys, oxblood, brown, olive, navy), each wandering in its own direction and wrapping at the edges. Single cells flicker, rows slip sideways and blocks flash another tint. Steps at ~12fps, and reduced motion gets one still frame. The page's text is light there (`body.journey`). Keep the tints dark; the brightest cell is ~#42 |
| decrypting text | `[data-decrypt]`, `.sr-only` | journey.html's and playground.html's COMING SOON, big (clamp 1.5rem–3rem, mono so the width never moves). It loops: decode left to right through random glyphs (~1.2s), hold ~3.2s with the odd letter glitching for a frame, scramble back (~0.75s). The real text sits in a `.sr-only` copy, and the churning copy is `aria-hidden`. Reduced motion shows plain text |
| About pixels | `.whois-pixels` canvas in #whois, main.js "About pixels", `panel.exit` | after cipher.tv/about (the owner's screenshot), read correctly the second time: the BLACK is the blocks. On ABOUT opening, #0b0b0b 18px blocks appear IN PLACE (flat 2D; the owner rejected flying in along radial lines as looking 3D), in order of how far in from the nearest window edge they sit (30% random), so the black builds from every side and corner inward over 900ms and fills the window up to a ragged tilted (-12°) oval round the bio + note + avatar box (half-width ×1.25 + 44px, half-height ×1.6 + 90px; open inside r 0.85, ragged band to 1.15; nothing ever lands within 48px of the content box — the owner wants distance). The veil underneath stays the light frost. While open, every 300ms 8 ragged-band blocks actually change (on↔off, re-rolled until different; the owner first wanted it subtle, then asked for more and faster). Closing: the Pop-ups module calls `panel.exit()`, which takes the blocks away in reverse, innermost first, back out to the edges (600ms), and only then the pop-up closes. Reduced motion: blocks just there, leave at once |
| Who is / contact pop-ups | `.whois` (shared style), `#whois`, `#contact-pop` (`.whois-contact`: an `<iframe class="contact-frame">` of `contact.html?embed`, loaded fresh on every open so the boxes' intro replays, unloaded 0.6s after closing; `?embed` sets `html.embed` in contact.html's head, which makes html/body/.contact transparent and hides [CLOSE]; closing plays an exit first: the parent posts `'pop-exit'` into the frame (or the frame starts it itself on a click in empty space or Esc), the boxes draw in to the viewport centre and shrink away (620ms, outer first, 35ms stagger) with the ticks fading, then the frame posts `'pop-close'` and the parent fades the blur (1.5s fallback if the frame never answers). While `.contact-boxes.is-intro` is set every click is swallowed (the owner wants the intro unclickable; Esc still closes, at once). Clicking a box does that box's thing: each opens in a new tab; LinkedIn, X, Threads, Instagram and Resume/CV are still `href="#"` (address not given yet) and do nothing when clicked (same-origin check), handled by the Pop-ups module), `[data-pop]` openers, `html.whois-open` | home only, after cathydolle.com's about: WHO IS opens a frosted layer over the WHOLE page (z 9998, above the header): blur 1.5px under a 50% paper tint, so the background, header, HUD and lockup show through soft. A small sharp text block pops up (rise + scale, overshoot), centred in the window and centre-aligned, with just the bio and availability; the owner removed the role line and the links. A click anywhere or Esc closes it. Home is plain paper now, so the tint mainly softens the lockup and header behind it. The content comes from the site; don't add claims the owner hasn't given, and there are no pronouns in the bio |

## 5. Styles and scripts

**CSS** (`src/css/style.css`)
- Tokens in `:root`: `--paper #FDFDFD`, `--ink #17181C`, `--accent #B4371F`, `--sans`
  (a monospace stack: ui-monospace, SF Mono, …; all body text is mono), `--header-h`.
  Use the tokens. These colours are written out directly by convention: grid rule
  `#dfe2e5`, plus marks `#b3b9bf`, logo ink `#0E0F12`.
- Hand-formatted in the existing style: two-space indent inside the file, compact
  `prop:value;` with no space after the colon, several short declarations on one line.
- Class names are short, hyphenated, and scoped by page or feature (`.cell-ai-rest`,
  `.work-row`, `.whois-avatar`); state classes go on `body`/`html`
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
playwright-cli eval "() => new Promise(r => setTimeout(r, 2500))"   # home: let the lockup intro finish (~2.5s)
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
