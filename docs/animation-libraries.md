# Animation libraries — CDN drop-in snippets

This is a **pick-and-paste reference** for the portfolio (a static HTML/CSS/JS
site, no build step). For each library there's a CDN tag and a minimal init so
you only load what a given page actually needs — don't add all of these to
`index.html` at once, it'll bloat the page.

Put `<script>` tags just before `</body>` unless noted. Add `defer` where shown.

Legend: ✅ works as-is on this static site · ⚠️ needs a React/Vite build (not
set up here — see note at the bottom).

---

## General-purpose animation

### GSAP (+ ScrollTrigger) ✅ — industry standard
Timelines, easing, sequencing, scroll-triggered animation.

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
```

```js
// after DOM + scripts loaded
gsap.registerPlugin(ScrollTrigger);

// simple tween
gsap.from(".home-link", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" });

// scroll-triggered
gsap.to(".hero", {
  scrollTrigger: { trigger: ".hero", start: "top center", scrub: true },
  scale: 1.05,
});
```

### anime.js ✅ — lighter GSAP alternative
Good for simpler transitions.

```html
<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js" defer></script>
```

```js
anime({
  targets: ".time-badge .dot",
  scale: [1, 1.4],
  opacity: [1, 0.4],
  direction: "alternate",
  loop: true,
  easing: "easeInOutSine",
  duration: 700,
});
```

### Framer Motion ⚠️ — React only
Declarative, spring/elastic physics (the knob-snap feel). Requires a React
build; not usable on this static site as-is. See bottom note.

```bash
npm i framer-motion   # only inside a React/Vite project
```

---

## Scroll-based reveals

### AOS (Animate On Scroll) ✅ — data-attribute fade/slide in
```html
<link href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js" defer></script>
```

```html
<div data-aos="fade-up" data-aos-duration="700">I fade up on scroll</div>
```

```js
AOS.init({ once: true, offset: 80 });
```

### Lenis ✅ — smooth scroll (pairs great with GSAP ScrollTrigger)
```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js" defer></script>
```

```js
const lenis = new Lenis();
function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// optional: sync with GSAP ScrollTrigger
// lenis.on("scroll", ScrollTrigger.update);
```

---

## Pre-rendered / exported animation

### Lottie (lottie-web) ✅ — plays After Effects JSON
```html
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js" defer></script>
```

```html
<div id="lottie" style="width:200px;height:200px"></div>
```

```js
lottie.loadAnimation({
  container: document.getElementById("lottie"),
  renderer: "svg",
  loop: true,
  autoplay: true,
  path: "assets/animations/my-anim.json",
});
```

---

## 3D / WebGL

### Three.js ✅ — core WebGL engine (via ES module import map)
```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/"
}}
</script>
<script type="module">
  import * as THREE from "three";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";
  // build your scene…
</script>
```

### Spline ✅ (viewer) — no-code 3D, exported scene
Use the web-component viewer for a static site:

```html
<script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js"></script>
<spline-viewer url="https://prod.spline.design/XXXXXX/scene.splinecode"></spline-viewer>
```

### React Three Fiber (@react-three/fiber + drei) ⚠️ — React only
React wrapper for Three.js. Needs a React/Vite build. See bottom note.

```bash
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
```

---

## CSS-only (no JS) ✅ — for hover states & micro-interactions

```css
.btn {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease;
}
.btn:hover { transform: translateY(-2px) scale(1.03); }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.badge { animation: float 3s ease-in-out infinite; }
```

---

## Note on the ⚠️ React libraries

Framer Motion, React Three Fiber, and react-spline are React packages — they
can't be dropped into this vanilla static site. To use them you'd convert (part
of) the site to a React app:

```bash
# install Node first (e.g. via https://nodejs.org or `brew install node`)
npm create vite@latest my-app -- --template react
cd my-app
npm i framer-motion three @react-three/fiber @react-three/drei @react-three/postprocessing @splinetool/react-spline
npm run dev
```

Everything marked ✅ above works today with just the CDN tag — no install.
