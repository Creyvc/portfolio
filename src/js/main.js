    (function(){
      const timeEl = document.getElementById('bkk-time');
      if (!timeEl) return;
      function updateClock(){
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Bangkok',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(new Date());
        timeEl.textContent = 'BKK[TH] ' + formatted;
      }
      updateClock();
      setInterval(updateClock, 1000);
    })();

    (function(){
      function easeInOutCubic(t){
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function smoothScrollTo(targetY, duration){
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();

        function step(now){
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          window.scrollTo(0, startY + distance * easeInOutCubic(progress));
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      document.querySelectorAll('a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href.length < 2) return;
        link.addEventListener('click', (e) => {
          const target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          smoothScrollTo(target.getBoundingClientRect().top + window.scrollY, 900);
        });
      });
    })();


    (function(){
      const homeLink = document.getElementById('home-link');
      if (!homeLink) return;
      const names = [
        { text: '[VUTHY CHEAM]', lang: 'en' },
        { text: '[ជាម វុឌ្ឍី]', lang: 'km' },
        { text: '[เฟิร์ส]', lang: 'th' }
      ];
      // same scramble/decode transition as the multilingual greeting above
      const GLYPHS = '01<>[]{}/\\|=+*-#%&$ｦｧｨｩｪﾊﾋﾌﾍABCDEFGHKMNXZ';
      const HOLD_MS = 2400;   // how long each resolved name stays
      const STEPS = 15;       // scramble ticks before fully resolved
      const TICK_MS = 45;     // ms per scramble tick

      let index = 0;
      let timer = null;

      function play(){
        const n = names[index % names.length];
        homeLink.lang = n.lang;
        const chars = Array.from(n.text);
        const total = chars.length;
        let step = 0;
        clearInterval(timer);
        timer = setInterval(function(){
          step++;
          const revealed = Math.floor(total * step / STEPS);
          let out = '';
          for (let i = 0; i < total; i++){
            const c = chars[i];
            if (i < revealed || c === ' ' || c === '[' || c === ']'){
              out += c;
            } else {
              out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
          }
          homeLink.textContent = out;
          if (step >= STEPS){
            clearInterval(timer);
            homeLink.textContent = n.text;
            index++;
            setTimeout(play, HOLD_MS);
          }
        }, TICK_MS);
      }

      play();
    })();

    // ===== Contact boxes: one driver for every scroll-linked effect =====
    // Six things move as the boxes are swiped: the shrink class, the progress
    // ticks, the X glyph, the LinkedIn letters, the EMAIL word, and the info
    // circle with its letter-by-letter colour flip. Each of those used to attach
    // its own scroll listener and its own rAF throttle, so a single scroll event
    // queued five separate callbacks — and because each one wrote styles before
    // the next one read geometry, the browser was forced to recompute layout
    // between them, several times over per frame. On a fast desktop that is
    // invisible; on a slower machine it is exactly the stutter you feel under
    // your finger, and it got worse with every effect added.
    //
    // They are registered here instead as read/write pairs and run in one pass:
    // every measurement happens first, then every style change. Layout is
    // computed once a frame however many effects are attached.
    const contactScroller = document.querySelector('.contact-boxes');
    const contactEffects = [];
    const contactFrame = {};
    let contactTicking = false;
    let contactStatic = null;
    let contactSettleTimer = null;
    let captureContactSettled = null;

    function contactAdd(effect){ contactEffects.push(effect); }

    // --box-w and the column gap only move with the viewport or the root font
    // size, so they are measured once and kept. Three of the effects were
    // re-deriving them every frame, two getComputedStyle calls at a time.
    function contactStatics(){
      if (contactStatic) return contactStatic;
      const cs = getComputedStyle(contactScroller);
      contactStatic = {
        boxW: refBoxWidth(),
        gap: parseFloat(cs.columnGap || cs.gap) || 24
      };
      return contactStatic;
    }

    function contactRun(){
      contactTicking = false;
      if (!contactScroller) return;
      const f = contactFrame, s = contactStatics();
      // the handful of measurements every effect shares, taken once
      f.scrollLeft = contactScroller.scrollLeft;
      f.clientWidth = contactScroller.clientWidth;
      f.rect = contactScroller.getBoundingClientRect();
      f.boxW = s.boxW;
      f.gap = s.gap;
      for (let i = 0; i < contactEffects.length; i++) contactEffects[i].read(f);
      for (let i = 0; i < contactEffects.length; i++) contactEffects[i].write(f);
    }

    function contactRequest(){
      if (contactTicking || !contactScroller) return;
      contactTicking = true;
      requestAnimationFrame(contactRun);
    }

    // the boxes shrink over 0.4s when .is-scrolled flips, and the effects are
    // scroll-driven — so if the swipe has already stopped (exactly what happens
    // when you come to rest back on the info box) nothing recomputed until the
    // transition ended and the artwork snapped into place instead of following
    function contactTrackResize(){
      let until = 0, running = false;
      function loop(now){
        contactRun();
        if (now < until) requestAnimationFrame(loop);
        else running = false;
      }
      contactScroller.addEventListener('transitionstart', function(e){
        if (e.propertyName !== 'width') return;
        until = performance.now() + 500;      // a little past the 0.4s transition
        if (!running){ running = true; requestAnimationFrame(loop); }
      });
    }

    // The boxes' full-size width, straight from the --box-w custom property, so
    // scroll-driven effects can divide by a number that does not change while the
    // boxes are mid-shrink. Read live so it still tracks a root font-size change.
    function refBoxWidth(){
      const el = document.querySelector('.contact-boxes');
      if (!el) return 0;
      const raw = getComputedStyle(el).getPropertyValue('--box-w').trim();
      const n = parseFloat(raw);
      if (!raw.endsWith('rem')) return n || 0;
      return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    // ---- shrink the boxes once the swipe is under way ----
    (function(){
      if (!contactScroller) return;
      const threshold = 20;
      let scrolled = false;
      contactAdd({
        read(f){ scrolled = f.scrollLeft > threshold; },
        write(){ contactScroller.classList.toggle('is-scrolled', scrolled); }
      });
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      contactScroller.scrollLeft = 0;
    })();

    // ---- progress ticks: mark whichever box is nearest the centre ----
    (function(){
      const progress = document.getElementById('contactProgress');
      const boxes = document.querySelectorAll('.contact-box');
      if (!contactScroller || !progress || !boxes.length) return;

      boxes.forEach(() => {
        const tick = document.createElement('span');
        tick.className = 'tick';
        progress.appendChild(tick);
      });
      const ticks = progress.querySelectorAll('.tick');

      let closest = 0;
      contactAdd({
        read(f){
          const center = f.scrollLeft + f.clientWidth / 2;
          let closestDist = Infinity;
          for (let i = 0; i < boxes.length; i++){
            const dist = Math.abs(boxes[i].offsetLeft + boxes[i].offsetWidth / 2 - center);
            if (dist < closestDist){ closestDist = dist; closest = i; }
          }
        },
        write(){
          for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('active', i === closest);
        }
      });
    })();

    // ---- the X grows as its box leaves the centre ----
    (function(){
      const xBox = document.querySelector('.contact-box[data-label="X"]');
      const glyph = document.querySelector('.x-glyph');
      if (!contactScroller || !xBox || !glyph) return;

      const originalSize = 9;
      // 15rem, not 22: the glyph no longer stretches the box, so at 22 its ink
      // ran the full height of the shrunken box and touched both edges. This
      // leaves it breathing room at the top of the scale.
      const bigSize = 15;
      let size = originalSize;

      contactAdd({
        read(f){
          const viewCenter = f.scrollLeft + f.clientWidth / 2;
          const boxCenter = xBox.offsetLeft + xBox.offsetWidth / 2;
          const windowDist = xBox.offsetWidth + 24;
          const progress = Math.min(Math.abs(boxCenter - viewCenter) / windowDist, 1);
          size = originalSize + progress * (bigSize - originalSize);
        },
        write(){ glyph.style.fontSize = size.toFixed(2) + 'rem'; }
      });
    })();

    // ---- the Threads line draws itself on ----
    // The mark is one traced line (see contact.html). The closer its box is to
    // the middle of the page the more of it is drawn, from the start of the
    // line to the end; dead centre is the whole logo, and as the box moves on
    // the line is taken back off the same way. Slowed two ways: the run starts
    // 1.6 box-widths from centre rather than one, and the line trails the
    // scroll, easing towards where it should be (time constant TRAIL), so even
    // a quick swipe draws it at an unhurried pace.
    (function(){
      const box = document.querySelector('.contact-box[data-label="Threads"]');
      const line = document.querySelector('.threads-line');
      if (!contactScroller || !box || !line) return;
      const RANGE = 1.6, TRAIL = 0.45;          // box-widths of run; seconds to catch up ~63%
      let target = 0, drawn = 0, raf = 0, last = 0;

      function follow(now){
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
        last = now;
        drawn += (target - drawn) * (1 - Math.exp(-dt / TRAIL));
        if (Math.abs(target - drawn) < 0.0005) drawn = target;
        line.style.strokeDashoffset = (1 - drawn).toFixed(4);
        if (drawn !== target) raf = requestAnimationFrame(follow);
        else { raf = 0; last = 0; }
      }

      contactAdd({
        read(f){
          // measured on screen against the page's middle, where the rail now
          // snaps a box to; offsetLeft is taken from the page wrapper and reads
          // 32px off, which left the line a sliver short of whole when centred
          const r = box.getBoundingClientRect();
          const off = (r.left + r.width / 2) - document.documentElement.clientWidth / 2;
          const windowDist = (box.offsetWidth + 24) * RANGE;
          const near = 1 - Math.min(Math.abs(off) / windowDist, 1);
          target = near * near * (3 - 2 * near);     // eased, so it settles into the full logo
        },
        write(){ if (!raf) raf = requestAnimationFrame(follow); }
      });
    })();

    // ---- the Instagram box's gradient roams freely ----
    // A Grainient of its own in Instagram's colours (the same engine as the
    // home background), turned up: wandering in every direction and turning,
    // fast, with a deep warp, so the colours sweep about the box dramatically.
    // The cursor drags them and a click swirls them while over the box. The
    // CSS gradient flow stays underneath as the fallback without WebGL2.
    (function(){
      const box = document.querySelector('.contact-box[data-label="Instagram"]');
      if (!box || typeof Grainient === 'undefined') return;
      const bg = Grainient(box, {
        colors:['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D', '#F56040', '#FCAF45'],
        angle:45,
        speed:16,
        flow:2.4,
        scale:0.8,
        silk:0.3,
        grainAmount:0.05,
        stir:1.6,
        intro:false,
        wander:true
      });
      if (bg) box.classList.add('is-lit');
    })();

    // ---- LinkedIn's I and N part company ----
    (function(){
      const liBox = document.querySelector('.contact-box[data-label="LinkedIn"]');
      const letterI = document.querySelector('.li-i');
      const letterN = document.querySelector('.li-n');
      if (!contactScroller || !liBox || !letterI || !letterN) return;

      let offset = 0;
      contactAdd({
        read(f){
          const viewCenter = f.scrollLeft + f.clientWidth / 2;
          const boxCenter = liBox.offsetLeft + liBox.offsetWidth / 2;
          const windowDist = liBox.offsetWidth + 24;
          const progress = Math.min(Math.abs(boxCenter - viewCenter) / windowDist, 1);

          // Travel is the room each letter actually has before its outer edge meets
          // the box edge, taken from layout positions so the current transform does
          // not feed back into it. The old half-the-box formula ignored that the
          // pair starts side by side rather than both at the centre, so each letter
          // overshot by ~140px and spent most of the scroll clipped out of sight.
          const roomLeft  = letterI.offsetLeft;
          const roomRight = liBox.clientWidth - (letterN.offsetLeft + letterN.offsetWidth);
          const maxOffset = Math.max(0, Math.min(roomLeft, roomRight));
          offset = progress * maxOffset;
        },
        write(){
          letterI.style.transform = `translateX(${(-offset).toFixed(2)}px)`;
          letterN.style.transform = `translateX(${offset.toFixed(2)}px)`;
        }
      });
    })();

    // ---- EMAIL sweeps through its box ----
    (function(){
      const emailBox = document.querySelector('.contact-box[data-label="Email"]');
      const glyph = document.querySelector('.email-glyph');
      if (!contactScroller || !emailBox || !glyph) return;

      let translateX = 0;
      contactAdd({
        read(f){
          // Measured from viewport rects, not offsetLeft: .contact-boxes is not
          // positioned, so a box's offsetLeft resolves against .contact and does
          // not share an origin with scrollLeft. Mixing the two put the zero point
          // outside the box's travel, so progress sat clamped and the word never
          // swept through centre.
          const boxRect = emailBox.getBoundingClientRect();
          const signedDist = (boxRect.left + boxRect.width / 2) - (f.rect.left + f.rect.width / 2);
          // Denominator is the box's full-size width, not its live one. The boxes
          // shrink over 0.4s the moment scrolling starts, and dividing by a width
          // that is mid-transition made progress lurch through that window — the
          // jump you see in the word while the info circle is resizing.
          const windowDist = f.boxW + 24;
          const progress = Math.max(-1, Math.min(1, signedDist / windowDist));

          // The word slides right out of the box, .email-clip trimming it at the
          // edges, so only VISIBLE_CHARS of it remain at either extreme: IL when
          // the box is still to the right, EM once it has passed to the left.
          const TOTAL_CHARS = 5, VISIBLE_CHARS = 2;
          const glyphWidth = glyph.offsetWidth;
          const hideWidth = glyphWidth * (1 - VISIBLE_CHARS / TOTAL_CHARS);
          const sideGap = (emailBox.clientWidth - glyphWidth) / 2;

          translateX = -progress * (hideWidth + sideGap);
        },
        write(){ glyph.style.transform = `translateX(${translateX.toFixed(2)}px)`; }
      });
    })();

    // ---- the info circle, and the letters it turns white ----
    (function(){
      const infoBox = document.querySelector('.contact-info');
      const circle = document.querySelector('.info-circle');
      if (!contactScroller || !infoBox || !circle) return;

      const maxDiameter = 480;
      const minDiameter = 160;
      const textEls = document.querySelectorAll('.info-row .info-label, .info-row .info-value');

      // split each label/value into per-character spans so the color reveal
      // can happen letter-by-letter instead of on the whole word at once
      const chars = [];
      textEls.forEach(el => {
        const text = el.textContent;
        el.textContent = '';
        for (const c of text){
          const span = document.createElement('span');
          span.className = 'ch';
          span.textContent = c;
          if (c === ' ') span.style.whiteSpace = 'pre';
          el.appendChild(span);
          chars.push(span);
        }
      });

      // The circle's `left` is relative to the info box's padding box, so these
      // are what turn it into a viewport coordinate. Read once — a border width
      // does not change.
      const cs = getComputedStyle(infoBox);
      const borderL = parseFloat(cs.borderLeftWidth) || 0;
      const borderT = parseFloat(cs.borderTopWidth) || 0;
      const borderB = parseFloat(cs.borderBottomWidth) || 0;

      // Which characters sit on the circle once the page has settled, captured
      // below before the intro ever transforms anything.
      let settled = null;
      let holding = false;
      let diameter = maxDiameter, left = -maxDiameter / 2;
      const flags = [];

      contactAdd({
        read(f){
          // Through the intro, hold the settled answer rather than re-deriving it.
          // Hit-testing each character against live rects mid-intro asks about a
          // box that is being scaled and moved every frame, and the answer came
          // out as letters flicking between black and white all through the
          // reveal. The colours the row will end up with are already known, so
          // show those from the start and let nothing change until it is over.
          holding = !!(settled && contactScroller.classList.contains('is-intro'));
          if (holding){
            for (let i = 0; i < chars.length; i++) flags[i] = settled[i];
            return;
          }

          const boxRect = infoBox.getBoundingClientRect();
          const boxWidth = infoBox.offsetWidth;
          // full-size width, not the live one — see the note in the email effect:
          // a denominator that shrinks mid-swipe makes the circle jump
          const maxDist = f.boxW + f.gap;
          const progress = Math.min(Math.max(f.scrollLeft / maxDist, 0), 1);

          diameter = maxDiameter - progress * (maxDiameter - minDiameter);
          const radius = diameter / 2;
          const startLeft = -radius;
          const endLeft = boxWidth - diameter;
          left = startLeft + progress * (endLeft - startLeft);

          // The circle's centre is worked out, not measured. Reading it back
          // would mean writing the new size and then asking for its rect in the
          // same frame, which forces layout all over again — and the answer is
          // already implied by the two numbers just computed. `top:50%` plus
          // translateY(-50%) keeps the centre on the padding box's midline
          // whatever the diameter, so only the box's own rect is needed.
          const cx = boxRect.left + borderL + left + radius;
          const cy = boxRect.top + borderT + (boxRect.height - borderT - borderB) / 2;
          for (let i = 0; i < chars.length; i++){
            const r = chars[i].getBoundingClientRect();
            const px = r.left + r.width / 2;
            const py = r.top + r.height / 2;
            flags[i] = Math.hypot(px - cx, py - cy) <= radius;
          }
        },
        write(){
          if (!holding){
            circle.style.width = diameter + 'px';
            circle.style.height = diameter + 'px';
            circle.style.left = left + 'px';
          }
          for (let i = 0; i < chars.length; i++) chars[i].classList.toggle('on-circle', flags[i]);
        }
      });

      // Called once the first pass has run, while the boxes are still at their
      // natural size — the one chance to record the resting answer before the
      // intro collapses everything into its dot.
      captureContactSettled = function(){
        settled = chars.map(span => span.classList.contains('on-circle'));
      };
    })();

    // ---- wire the driver up, once, for all of the above ----
    if (contactScroller){
      contactScroller.addEventListener('scroll', function(){
        contactRequest();
        // when scrolling fully settles, force one authoritative pass so the final
        // resting state is always correct (no letters left white after swiping back)
        clearTimeout(contactSettleTimer);
        contactSettleTimer = setTimeout(contactRun, 120);  // for browsers without scrollend
      }, { passive:true });
      contactScroller.addEventListener('scrollend', contactRun);
      window.addEventListener('resize', function(){ contactStatic = null; contactRun(); });
      contactTrackResize();
      // Synchronous, not deferred: this runs before the intro's IIFE, so the
      // boxes are still at their natural size and this is the one chance to read
      // the resting layout. A rAF-deferred first pass would have measured the
      // boxes already collapsed to the intro's dot.
      contactRun();
      if (captureContactSettled) captureContactSettled();
    }

    // ===== Contact boxes intro =====
    // A hairline is struck from left to right, ink floods down it until it has
    // become a single dot -> that dot comes apart into a column of eight, and on the way apart each
    // one is already turning from a black dot into its own small rectangle — the
    // separating, the squaring off and the colour all run on the same progress ->
    // the column then unrolls into the row while zooming the rest of the way. The
    // reveal is finished before the turn starts, so what rotates is the real boxes
    // rather than black rectangles. Driven per box with transforms — the boxes'
    // own transform is otherwise unused, so nothing else is disturbed, and it all
    // resolves to `transform:none`.
    (function(){
      const scroller = document.querySelector('.contact-boxes');
      if (!scroller) return;
      const boxes = Array.prototype.slice.call(scroller.querySelectorAll('.contact-box'));
      if (boxes.length < 2) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const DOT   = 12;     // square dot, px
      // THUMB and GAP trade against each other: the column has to stay inside the
      // row, so a wider thumbnail leaves less room between them. At 74/36 the
      // thumbnails were ~34px tall on a 36px pitch — barely 2px apart.
      const THUMB = 60;     // width of the small resolved box in the column, px
      const MARGIN = 5;     // px kept clear inside each rule, so it never touches
      // Nothing snaps and nothing overshoots. Every move eases in and out of rest,
      // and the holds between them are long enough to read as breath rather than
      // as beats — the whole thing is one slow exhale instead of a series of hits.
      // The dot is drawn rather than faded up: a hairline strikes across from the
      // left, then ink floods down it until the line has become the dot. Nothing
      // appears out of nowhere — every mark on screen was made by something.
      const LINE  = 1.5;    // px, the struck line's thickness
      const DRAW  = 760;    // the line strikes left to right
      const INK   = 420;    // and floods down into the dot
      const HOLD  = 380;    // which then sits alone
      const SPLIT = 1780;   // comes apart, squares off and colours up, all as one
      const PAUSE = 440;    // the resolved column rests
      const OPEN  = 1760;   // column -> row, zooming the rest of the way
      const TOTAL = DRAW + INK + HOLD + SPLIT + PAUSE + OPEN;

      let done = false;
      const mid = (boxes.length - 1) / 2;
      // sine-in-out is the gentlest S there is: it leaves and reaches rest with
      // no abruptness at either end, which is what keeps the moves from reading
      // as snaps however far they travel.
      const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
      // quart-in-out for the long move only — same shape, more weight behind it
      const easeInOutQuart = t => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t + 2, 4) / 2;
      const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

      // The progress ticks echo the same gesture: collapsed on the centre while the
      // boxes are still a dot / column, then spreading out to their own places as
      // the row opens. Driven inline from here rather than via CSS because the bar
      // sits BEFORE .contact-boxes in the document, so no sibling selector reaches
      // it from the .is-intro class.
      const bar = document.getElementById('contactProgress');
      const ticks = bar ? Array.prototype.slice.call(bar.querySelectorAll('.tick')) : [];
      const barMid = bar ? (function(){ const r = bar.getBoundingClientRect(); return r.left + r.width / 2; })() : 0;
      const tickNat = ticks.map(function(t){ const r = t.getBoundingClientRect(); return r.left + r.width / 2 - barMid; });


      // measured before any transform is applied, so these are layout positions
      const s = scroller.getBoundingClientRect();
      const cx = s.left + s.width / 2, cy = s.top + s.height / 2;
      const nat = boxes.map(function(b){
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width/2 - cx, y: r.top + r.height/2 - cy, w: r.width, h: r.height };
      });
      if (nat.some(n => !n.w || !n.h)) return;   // not laid out yet; leave the page alone

      // Pitch down the column, derived rather than fixed. The column has to fit
      // between the grid's two horizontal rules at 33% and 67%, and that band is
      // a share of the VIEWPORT height while a fixed pitch is not — so on a short
      // window a hard-coded 40 pushed the top and bottom boxes straight through
      // the rules. Solving for the room actually available keeps it inside at any
      // height; the clamp stops it spreading absurdly on a very tall one or
      // closing right up on a very short one.
      const thumbH = THUMB * (nat[0].h / nat[0].w);
      const room = 0.34 * window.innerHeight;    // between the two rules
      const GAP = Math.max(22, Math.min(40,
        (room - thumbH - MARGIN * 2) / (boxes.length - 1)));

      function render(t){
        if (done) return;             // a late frame must not re-apply what finish() cleared
        const i0 = DRAW;                     // the flood begins
        const s0 = DRAW + INK + HOLD;        // the dot comes apart
        const o0 = s0 + SPLIT + PAUSE;       // the column turns into the row
        const draw  = Math.min(t / DRAW, 1);
        const ink   = t > i0 ? Math.min((t - i0) / INK, 1) : 0;
        const split = t > s0 ? Math.min((t - s0) / SPLIT, 1) : 0;
        const open  = t > o0 ? Math.min((t - o0) / OPEN, 1) : 0;
        const ed = easeInOutSine(draw);
        const ei = easeInOutSine(ink);
        // one progress drives the whole coming-apart: the spacing, the dot
        // squaring off into a rectangle, and the ink lifting off it
        const es = easeInOutSine(split);
        const eo = easeInOutQuart(open);
        // the column closes up a little ahead of the row spreading out — enough
        // to read as a turn, gentle enough not to look like two separate moves
        const ey = 1 - easeInOutSine(Math.min(open * 1.2, 1));

        // Nothing to fade: the line starts at zero width, so it enters by being
        // drawn rather than by turning up.
        scroller.style.setProperty('--intro-alpha', '1');
        // Resolves across the coming-apart, so it is finished well before the turn
        // begins — the boxes are fully themselves while still stacked, and it is
        // those that then rotate into the row.
        scroller.style.setProperty('--intro-ink', clamp01(1 - es).toFixed(3));
        scroller.style.setProperty('--intro-show', clamp01(es).toFixed(3));

        // trails the boxes a little, so the row is already on its way out before
        // the ticks follow it rather than the two moving as one block
        if (bar){
          const eb = easeInOutSine(clamp01((open - 0.12) / 0.78));
          bar.style.opacity = eb.toFixed(3);
          for (let i = 0; i < ticks.length; i++){
            ticks[i].style.transform = 'translateX(' + (-(1 - eb) * tickNat[i]).toFixed(2) + 'px)';
          }
        }

        for (let i = 0; i < boxes.length; i++){
          const n = nat[i], k = i - mid;
          // a transform offsets from the box's own layout position, so gathering
          // them all onto the centre means translating by -n and letting that
          // decay to zero as they open out into their real places
          // The mark's own size before the split: it widens to the dot while the
          // line is being struck, then deepens from a hairline to the full square
          // as the ink floods down. Both have finished by the time the split
          // starts, so this hands over at exactly DOT and the rest is unchanged.
          const dw = DOT * ed;
          const dh = LINE + (DOT - LINE) * ei;
          // The extra term pins the line's LEFT edge while it is being struck, so
          // it grows rightward from a fixed point instead of opening out from its
          // middle. It is zero the moment the line reaches full width.
          const x = -(1 - eo) * n.x - (DOT - dw) / 2;
          // No -n.y term. The boxes all share a centre line already, so the only
          // thing it contributed was the offset between the row's border-box
          // centre (which n is measured from) and its content-box centre — the
          // row's padding is 2.25rem top against 0.5rem bottom, so that gap is
          // ~14px, and the whole column was sitting that far above the boxes.
          const y = es * GAP * k * ey;
          // dot is square, so its two scales differ; the thumbnail is uniform, so
          // the box takes its true proportions back as it grows
          const thumb = THUMB / n.w;
          const sxT = (dw / n.w) + (thumb - DOT / n.w) * es;
          const syT = (dh / n.h) + (thumb - DOT / n.h) * es;
          const sx = sxT + (1 - sxT) * eo;
          const sy = syT + (1 - syT) * eo;
          boxes[i].style.transform =
            'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
        }
      }

      function finish(){
        if (done) return;
        done = true;
        boxes.forEach(function(b){ b.style.transform = ''; });
        if (bar){
          bar.style.opacity = '';
          ticks.forEach(function(t){ t.style.transform = ''; });
        }
        scroller.classList.remove('is-intro');
        scroller.style.removeProperty('--intro-alpha');
        scroller.style.removeProperty('--intro-ink');
        scroller.style.removeProperty('--intro-show');
        // the scroll-driven effects measured nothing useful while the boxes were
        // mid-transform; give them one pass now that everything has settled
        window.dispatchEvent(new Event('resize'));
      }

      scroller.classList.add('is-intro');
      render(0);                      // dot state is up before the first paint

      function run(){
        const start = performance.now();
        (function step(now){
          const t = Math.max(0, Math.min(now - start, TOTAL));
          render(t);
          if (t < TOTAL) requestAnimationFrame(step); else finish();
        })(start);

        // The boxes are dot-sized and blank until the run completes, so never let
        // that state be the final one: if the frame loop stalls for any reason,
        // put the page into its normal state anyway.
        setTimeout(finish, TOTAL + 900);
      }

      // Arriving through a page transition, the page rises in from below for
      // 1.4s; start only once it has landed so the whole intro is seen, from
      // the first stroke of the line. window.ptSettled comes from contact.html's
      // head. The cap means a transition that never reports back can't leave
      // the page sitting on a blank row.
      if (window.ptSettled){
        let started = false;
        const go = function(){ if (!started){ started = true; run(); } };
        window.ptSettled.then(go);
        setTimeout(go, 2500);
      } else {
        run();
      }
    })();

    // let users swipe the contact boxes in ANY direction (up/down or left/right),
    // with a sticky, magnetic feel after cathydolle.com: the wheel glides the
    // row towards where it is heading instead of jumping, and once input stops
    // the box nearest the middle glides into dead centre and holds there. A
    // touch drag follows the finger exactly, and on release the swipe's speed
    // carries on to decide which box it settles on. Any new input takes over
    // from a glide at once, so it never fights the hand.
    (function(){
      const scroller = document.querySelector('.contact-boxes');
      if (!scroller) return;
      const boxes = Array.prototype.slice.call(scroller.querySelectorAll('.contact-box'));
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const GLIDE = 0.12;                        // seconds for the glide to cover ~63% of the way
      const SETTLE_AFTER = 160;                  // ms of quiet before the nearest box is pulled in

      function maxScroll(){ return scroller.scrollWidth - scroller.clientWidth; }
      function clampLeft(v){ return Math.max(0, Math.min(maxScroll(), v)); }
      // How far a box's centre is from the middle of the page, measured on
      // screen: offsetLeft is taken from the page wrapper, not the row, and read
      // 32px off, and the row's own box isn't quite centred on the page either.
      // The scrollLeft that centres the box is the current one plus that.
      function offCentre(box){
        const r = box.getBoundingClientRect();
        return (r.left + r.width / 2) - document.documentElement.clientWidth / 2;   // the page's middle
      }
      function centreOf(box){ return clampLeft(scroller.scrollLeft + offCentre(box)); }
      // the box that would be nearest the middle with the row at `left`
      function nearest(left){
        const shift = left - scroller.scrollLeft;
        let best = boxes[0], gap = Infinity;
        boxes.forEach(function(b){
          const d = Math.abs(offCentre(b) - shift);
          if (d < gap){ gap = d; best = b; }
        });
        return best;
      }

      let target = scroller.scrollLeft, holdBox = null, holdUntil = 0, raf = 0, last = 0, quiet = 0;

      // eases the row towards target; while settling on a box, target follows
      // that box, since the boxes change width as the row scrolls. The position
      // is kept here as a fraction (pos): scrollLeft rounds to whole pixels, so
      // reading it back each frame swallowed the last sub-pixel steps and left
      // the glide stalled a few pixels short, running forever.
      let pos = scroller.scrollLeft;
      function glide(now){
        raf = 0;
        if (Math.abs(scroller.scrollLeft - pos) > 1) pos = scroller.scrollLeft;   // moved by something else
        if (holdBox) target = centreOf(holdBox) + (pos - scroller.scrollLeft);
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
        last = now;
        pos = reduce ? target : pos + (target - pos) * (1 - Math.exp(-dt / GLIDE));
        if (Math.abs(target - pos) < 0.5) pos = target;
        scroller.scrollLeft = pos;
        if (pos !== target){ raf = requestAnimationFrame(glide); return; }
        // arrived. Keep holding on the box through the boxes' 0.4s resize, which
        // still moves it after the glide itself has arrived, and until it is
        // within a pixel of the middle (scrollLeft moves in whole pixels, so
        // asking for less only makes it twitch between two); then let go.
        if (holdBox && (now < holdUntil || (Math.abs(offCentre(holdBox)) > 1 && now < holdUntil + 1500))){
          raf = requestAnimationFrame(glide);
          return;
        }
        last = 0;
        // one last, authoritative pass for the scroll effects at the box's final
        // resting place (the same as the scroll-end pass), so artwork driven by
        // the scroll, like the Threads line, ends exactly where it should
        contactRun();
        requestAnimationFrame(contactRun);
      }
      function run(){ if (!raf) raf = requestAnimationFrame(glide); }
      function settleSoon(){
        clearTimeout(quiet);
        quiet = setTimeout(function(){ holdBox = nearest(target); holdUntil = performance.now() + 700; run(); }, SETTLE_AFTER);
      }

      // wheel handler on the whole window so a swipe ANYWHERE on the contact
      // page scrolls the boxes — driven by whichever axis the swipe favours.
      // nothing moves the row while the opening intro is assembling the boxes
      function intro(){ return scroller.classList.contains('is-intro'); }

      window.addEventListener('wheel', function(e){
        if (intro()){ e.preventDefault(); return; }
        const max = maxScroll();
        if (max <= 0) return;
        let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (e.deltaMode === 1) d *= 16;                        // lines -> px
        else if (e.deltaMode === 2) d *= scroller.clientWidth;  // pages -> px
        if (d === 0) return;
        if (!raf) target = pos = scroller.scrollLeft;           // pick up from wherever the row is
        // release to the page when there's no more room in that direction
        if ((d < 0 && target <= 0) || (d > 0 && target >= max - 1)) return;
        holdBox = null;
        target = clampLeft(target + d);
        run();
        settleSoon();
        e.preventDefault();
      }, { passive:false });

      // touch: dominant axis of the swipe drives horizontal scroll (anywhere on the page)
      let startX = 0, startY = 0, startLeft = 0, lastMove = 0, lastT = 0, speed = 0;
      window.addEventListener('touchstart', function(e){
        if (intro()) return;
        clearTimeout(quiet);
        cancelAnimationFrame(raf); raf = 0; last = 0; holdBox = null;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startLeft = target = pos = scroller.scrollLeft;
        lastMove = 0; lastT = performance.now(); speed = 0;
      }, { passive:true });
      window.addEventListener('touchmove', function(e){
        if (intro()){ e.preventDefault(); return; }
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        const move = Math.abs(dy) > Math.abs(dx) ? dy : dx;
        const max = maxScroll();
        const clamped = Math.max(0, Math.min(max, startLeft - move));
        scroller.scrollLeft = target = pos = clamped;
        const now = performance.now();
        if (now > lastT) speed = speed * 0.6 + ((lastMove - move) / (now - lastT)) * 0.4;   // px per ms, smoothed
        lastMove = move; lastT = now;
        // keep the page still only while the boxes still have somewhere to go
        if (clamped > 0 && clamped < max) e.preventDefault();
      }, { passive:false });
      window.addEventListener('touchend', function(){
        if (intro()) return;
        // carry the swipe on for a quarter second's worth of its speed, then
        // settle on whichever box that lands nearest
        pos = scroller.scrollLeft;
        holdBox = nearest(clampLeft(pos + speed * 250));
        holdUntil = performance.now() + 700;
        run();
      }, { passive:true });
    })();

    // ===== Arriving from inside the site =====
    // Following a link to another page of the site leaves a flag in
    // sessionStorage. That page's inline head script reads it and marks <html>
    // with .pt-open before the body renders, so its .reveal elements don't fade
    // in again for someone who is already on the site. (The flag
    // and class are named for an earlier page transition; today's transition
    // is CSS only — see "Page transition" in style.css.)
    (function(){
      const KEY = 'pageTransition';

      function isInternal(a){
        if (!a || !a.getAttribute) return false;
        const href = a.getAttribute('href');
        if (!href) return false;
        if (a.target && a.target !== '_self') return false;
        if (a.hasAttribute('download')) return false;
        if (a.hasAttribute('data-copy')) return false;          // the copy-email box
        if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return false;
        return a.origin === window.location.origin &&           // same site only
               a.pathname !== window.location.pathname;         // not the page we're on
      }

      document.addEventListener('click', function(e){
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (e.defaultPrevented) return;    // handled in place (WHO IS), no page change
        const link = e.target.closest && e.target.closest('a[href]');
        if (!isInternal(link)) return;
        try { sessionStorage.setItem(KEY, '1'); } catch(_){}
      });
    })();

    // Prefetch a page of the site as soon as its link is hovered (or pressed),
    // via Speculation Rules. The page transition can only start once the next
    // page has arrived, so without this every click would sit on the old page
    // for a network round trip first. Prefetch only fetches the HTML — none of
    // the page's scripts run early — so the sessionStorage flag above still
    // reaches it. Browsers without Speculation Rules just skip this.
    (function(){
      if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return;
      const rules = document.createElement('script');
      rules.type = 'speculationrules';
      rules.textContent = JSON.stringify({
        prefetch:[{ source:'document', where:{ href_matches:'/*' }, eagerness:'moderate' }]
      });
      document.head.appendChild(rules);
    })();

    // Clicking a box with data-copy puts that text on the clipboard instead of
    // following the link. The href stays a real mailto: so the box still does
    // something sensible if this script never runs.
    (function(){
      const boxes = document.querySelectorAll('.contact-box[data-copy]');
      if (!boxes.length) return;

      function copy(text){
        if (navigator.clipboard && window.isSecureContext){
          return navigator.clipboard.writeText(text);
        }
        // fallback for non-secure contexts (plain http, older browsers)
        return new Promise(function(resolve, reject){
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
          document.body.appendChild(ta);
          ta.select();
          ta.setSelectionRange(0, text.length);
          let ok = false;
          try { ok = document.execCommand('copy'); } catch(_){}
          ta.remove();
          ok ? resolve() : reject();
        });
      }

      boxes.forEach(function(box){
        const text = box.getAttribute('data-copy');
        // the big word inside the box — swapped in place, so it stays exactly where
        // it already sits (same element, same centring, same slide-on-scroll)
        const glyph = box.querySelector('.email-glyph');
        const original = glyph ? glyph.textContent : null;
        let revert = null;

        function showCopied(){
          clearTimeout(revert);
          box.classList.add('is-copied');
          if (glyph) glyph.textContent = 'Copied';
          revert = setTimeout(function(){
            box.classList.remove('is-copied');
            if (glyph) glyph.textContent = original;
          }, 2000);
        }

        box.addEventListener('click', function(e){
          // let modifier / middle clicks fall through to the real mailto: link
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          copy(text).then(showCopied, function(){});
        });
      });
    })();

    (function(){
      const src = document.querySelector('.github-icon-src');
      const img = document.querySelector('.github-icon');
      if (!src || !img) return;

      const pixelSize = 20;
      const svgData = new XMLSerializer().serializeToString(src);
      const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgData);

      const tempImg = new Image();
      tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelSize;
        canvas.height = pixelSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempImg, 0, 0, pixelSize, pixelSize);
        img.src = canvas.toDataURL('image/png');
      };
      tempImg.src = svgUrl;
    })();

    (function(){
      function atBottom(){
        return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight;
      }

      window.addEventListener('wheel', function(e){
        if (window.scrollY <= 0 && e.deltaY < 0){
          e.preventDefault();
        } else if (atBottom() && e.deltaY > 0){
          e.preventDefault();
        }
      }, { passive:false });

      let touchStartY = 0;
      window.addEventListener('touchstart', function(e){
        touchStartY = e.touches[0].clientY;
      }, { passive:true });
      window.addEventListener('touchmove', function(e){
        const deltaY = e.touches[0].clientY - touchStartY;
        if (window.scrollY <= 0 && deltaY > 0){
          e.preventDefault();
        } else if (atBottom() && deltaY < 0){
          e.preventDefault();
        }
      }, { passive:false });
    })();

    // live cursor position + frame rate readout (home page only)
    (function(){
      const xEl   = document.getElementById('hudX');
      const yEl   = document.getElementById('hudY');
      const fpsEl = document.getElementById('hudFps');
      if (!xEl || !yEl || !fpsEl) return;

      // fixed-width numbers so the readout never jitters as digits change
      function pad(n, w){ return String(n).padStart(w, ' '); }

      let x = 0, y = 0, posDirty = false;
      window.addEventListener('mousemove', function(e){
        x = e.clientX; y = e.clientY; posDirty = true;
      }, { passive:true });

      // Rolling average over the last N frames, recomputed EVERY frame. A fixed
      // 250ms window smoothed away the short dips a hover or transition causes;
      // this reacts within a few frames while still being readable.
      const SAMPLES = 10;
      const stamps = [];
      let shownFps = -1;

      function tick(now){
        if (posDirty){
          xEl.textContent = 'X ' + pad(x, 4);
          yEl.textContent = 'Y ' + pad(y, 4);
          posDirty = false;
        }

        stamps.push(now);
        if (stamps.length > SAMPLES) stamps.shift();
        if (stamps.length > 1){
          const span = stamps[stamps.length - 1] - stamps[0];
          if (span > 0){
            const fps = Math.round((stamps.length - 1) * 1000 / span);
            if (fps !== shownFps){            // only touch the DOM when it changes
              shownFps = fps;
              fpsEl.textContent = 'FPS ' + pad(fps, 4);
            }
          }
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();


/* Work list previews (lab.html): hovering a row shows that piece's
   logo on the row's own line, in the middle of the page, via the matching
   data-preview / data-name pair. Each image is placed at its own row, so one
   fading out stays where it was while the next fades in on its line. */
(function(){
  const rows = document.querySelectorAll('.work-row[data-preview]');
  if (!rows.length) return;
  let active = null;   // { row, img } under the pointer
  function place(row, img){
    const r = row.getBoundingClientRect();
    img.style.top = (r.top + r.height / 2) + 'px';
  }
  rows.forEach(function(row){
    const img = document.querySelector('.work-preview-img[data-name="' + row.getAttribute('data-preview') + '"]');
    if (!img) return;
    row.addEventListener('mouseenter', function(){
      place(row, img);
      img.classList.add('is-active');
      active = { row: row, img: img };
    });
    row.addEventListener('mouseleave', function(){
      img.classList.remove('is-active');
      if (active && active.img === img) active = null;
    });
  });
  // the preview is fixed and the rows scroll, so keep it on its line
  window.addEventListener('scroll', function(){ if (active) place(active.row, active.img); }, { passive:true });
  window.addEventListener('resize', function(){ if (active) place(active.row, active.img); });
})();

/* Work list scramble (lab.html) — same glyph set/steps/tick as the home
   page's blurb-link decode. Bound to the whole row (not just the name span)
   so the hit area matches the row's own hover highlight, and runs on BOTH the
   name (left) and the tags/year (right) so hovering either side of the row
   shows the effect, not just the name text specifically. Spaces, the middle
   dot and its NBSP padding are left alone so the "  ·  " separator never
   scrambles into noise. */
(function(){
  const rows = document.querySelectorAll('.work-row');
  if (!rows.length) return;
  const GLYPHS = '01<>[]{}/\\|=+*-#%&$ABCDEFGHKMNXZ';
  const STEPS = 14;
  const TICK_MS = 40;

  function scramble(el){
    if (!el || el._animating) return;   // don't restart mid-animation (prevents glitch)
    const original = el.textContent;
    el._animating = true;
    const chars = Array.from(original);
    const total = chars.length;
    let step = 0;
    clearInterval(el._scr);
    el._scr = setInterval(function(){
      step++;
      const revealed = Math.floor(total * step / STEPS);
      let out = '';
      for (let i = 0; i < total; i++){
        const c = chars[i];
        out += (i < revealed || c === ' ' || c === ' ' || c === '·') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (step >= STEPS){
        clearInterval(el._scr);
        el.textContent = original;
        el._animating = false;
      }
    }, TICK_MS);
  }

  rows.forEach(function(row){
    const name = row.querySelector('.work-name');
    const kind = row.querySelector('.work-kind');
    const meta = row.querySelector('.work-meta');
    row.addEventListener('mouseenter', function(){
      scramble(name);
      scramble(kind);
      scramble(meta);
    });
  });

  // Also decode in on arrival — every row scrambles once as soon as the page
  // opens, each one starting a beat after the last rather than all at once.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion){
    rows.forEach(function(row, i){
      setTimeout(function(){
        scramble(row.querySelector('.work-name'));
        scramble(row.querySelector('.work-kind'));
        scramble(row.querySelector('.work-meta'));
      }, i * 150);
    });
  }
})();

/* ===== Page background (home) =====
   Mounts the animated "grainient" (src/js/grainient.js, a plain-JS port of
   React Bits' <Grainient />) into .page-bg as soon as the page is .loaded
   (it starts that way now there is no preloader), and its 1.6s colour bloom
   from the middle plays straight away. Without
   WebGL2 Grainient returns null and the still CSS gradient on .page-bg stays.
   Other palettes the owner likes, for bg.set({ colors, angle }):
     steel grey ["#1d232c","#34404d","#5d6c7c","#a9b8c8","#dfe8f1"], angle 128
     deep teal  ["#071b1c","#0f3a3b","#1f5f5b","#4fa596","#c8eadf"], angle 35
     ember      ["#120f17","#2a0f0a","#9a3412","#f97316","#fed7aa"], angle 55 */
(function(){
  const host = document.querySelector('.page-bg');
  if (!host) return;
  if (typeof Grainient === 'undefined'){ document.documentElement.classList.remove('bg-pending'); return; }

  function mount(){
    const bg = Grainient(host, {
      colors:['#0e0f12', '#2a2c31', '#6b6e75', '#b9bcc2', '#f4f5f7'],  // dark to grey to white
      // (was violet: '#2a1f8f', '#5B4FD6', '#8B7FF2', '#b4aaff', '#f1edff')
      angle:75,
      speed:6,
      flow:1.5,                                // looser, more fluid shapes (was 1.1)
      silk:0.35,
      grainAmount:0.08,
      intro:true,
      wander:true                              // drift and turn freely in every direction (grainient.js)
    });
    document.documentElement.classList.remove('bg-pending');   // no WebGL2: the CSS gradient shows
    if (!bg) return;
    document.documentElement.classList.add('is-lit');
    followText(host.querySelector('.grainient-canvas'));
  }

  // The text on the gradient is coloured letter by letter: each letter takes
  // white or ink, whichever stands out more from the colours under that
  // letter right now. The text itself is left alone (the name, the clock and
  // the readings all rewrite theirs constantly); instead each piece is painted
  // through a hard-edged stripe per letter, clipped to the text
  // (background-clip: text, .letter-tinted). The canvas is read straight after
  // grainient.js has drawn into it: getContext hands back its own WebGL2
  // context, and a frame scheduled after its own runs after it in each
  // animation frame, before the drawing is handed to the screen and cleared.
  // It also draws once synchronously while mounting, so the first read is
  // taken right away; that one also covers reduced motion, where it stops.
  function followText(canvas){
    const gl = canvas && canvas.getContext('webgl2');
    if (!gl) return;
    const WHITE = '#ffffff', INK = '#17181c', INK_L = 0.0092;   // INK_L: relative luminance of --ink
    const pieces = Array.prototype.slice.call(
      document.querySelectorAll('#home-link, #bkk-time, .hud > span, .lockup-word')).map(function(el){
        return { el:el, light:[] };
      });
    // decided whole, not per letter: the time's dot and the lockup logo
    const wholes = Array.prototype.slice.call(
      document.querySelectorAll('.time-badge .dot, .lockup-logo')).map(function(el){
        return { el:el, light:[], prop:el.classList.contains('dot') ? 'backgroundColor' : 'color' };
      });
    const range = document.createRange();
    function channel(v){ v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }

    // grab the canvas under a page rect: { px, x0, y0, w, h } in canvas pixels
    function grab(r, ratio){
      const x0 = Math.max(0, Math.floor(r.left * ratio));
      const y0 = Math.max(0, Math.floor((canvas.clientHeight - r.bottom) * ratio));
      const w = Math.min(canvas.width - x0, Math.max(1, Math.ceil(r.width * ratio)));
      const h = Math.min(canvas.height - y0, Math.max(1, Math.ceil(r.height * ratio)));
      if (w < 1 || h < 1) return null;
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      for (let i = 0; i < px.length; i += 4) if (px[i] || px[i + 1] || px[i + 2]) return { px:px, x0:x0, y0:y0, w:w, h:h };
      return null;                              // read after the frame was cleared: skip this round
    }
    // mean luminance of the grabbed pixels inside a smaller page rect
    function lum(g, r, ratio){
      const ax = Math.max(0, Math.floor(r.left * ratio) - g.x0), bx = Math.min(g.w, Math.ceil(r.right * ratio) - g.x0);
      const ay = Math.max(0, Math.floor((canvas.clientHeight - r.bottom) * ratio) - g.y0);
      const by = Math.min(g.h, Math.ceil((canvas.clientHeight - r.top) * ratio) - g.y0);
      let sum = 0, n = 0;
      for (let y = ay; y < by; y++){
        for (let x = ax; x < bx; x++){
          const i = (y * g.w + x) * 4;
          sum += 0.2126 * channel(g.px[i]) + 0.7152 * channel(g.px[i + 1]) + 0.0722 * channel(g.px[i + 2]);
          n++;
        }
      }
      return n ? sum / n : -1;
    }
    // white or ink for one letter, with a 5% margin so letters near the middle don't flicker
    function decide(state, i, L){
      if (L < 0) return state[i];
      const onWhite = 1.05 / (L + 0.05), onInk = (L + 0.05) / (INK_L + 0.05);
      if (state[i] === undefined) state[i] = onInk > onWhite;
      else if (!state[i] && onInk > onWhite * 1.05) state[i] = true;
      else if (state[i] && onWhite > onInk * 1.05) state[i] = false;
      return state[i];
    }

    function read(){
      const ratio = canvas.width / Math.max(1, canvas.clientWidth);
      pieces.forEach(function(p){
        const node = p.el.firstChild;
        if (!node || node.nodeType !== 3 || !node.length) return;
        range.selectNodeContents(p.el);
        const box = range.getBoundingClientRect();
        const g = grab(box, ratio);
        if (!g) return;
        if (p.light.length !== node.length) p.light = [];   // the text changed length: start over
        const left = p.el.getBoundingClientRect().left;
        const stops = [];
        for (let i = 0; i < node.length; i++){
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          if (!r.width) continue;
          const c = decide(p.light, i, lum(g, r, ratio)) ? INK : WHITE;
          const a = (r.left - left).toFixed(1), b = (r.right - left).toFixed(1);
          stops.push(c + ' ' + a + 'px', c + ' ' + b + 'px');
        }
        if (!stops.length) return;
        p.el.style.backgroundImage = 'linear-gradient(90deg, ' + stops.join(', ') + ')';
        p.el.classList.add('letter-tinted');
      });
      wholes.forEach(function(w){
        const r = w.el.getBoundingClientRect(), g = grab(r, ratio);
        if (g) w.el.style[w.prop] = decide(w.light, 0, lum(g, r, ratio)) ? INK : WHITE;
      });
    }
    read();

    let tick = 0;
    (function loop(){
      requestAnimationFrame(loop);
      if (document.hidden || ++tick % 6) return;   // about ten reads a second
      read();
    })();
  }

  if (document.body.classList.contains('loaded')){ mount(); return; }
  const watch = new MutationObserver(function(){
    if (!document.body.classList.contains('loaded')) return;
    watch.disconnect();
    mount();
  });
  watch.observe(document.body, { attributes:true, attributeFilter:['class'] });
})();

/* ===== Lockup intro (home) =====
   The preload animation: on a first visit the logo rises up from below the
   bottom edge of the page into its place in the lockup while the background
   blooms, and then the words slide out from behind it on either side. It's all
   transform, opacity and clip-path on the lockup's own pieces, laid out in
   their final places from the start, so if this never runs the lockup is
   simply there. Skipped when arriving from another page of the site
   (html.pt-open) and for reduced motion — the head script only sets
   .lockup-intro when it should play. */
(function(){
  const lockup = document.getElementById('lockup');
  if (!lockup || !document.documentElement.classList.contains('lockup-intro')) return;
  const logo = lockup.querySelector('.lockup-logo');
  const left = lockup.querySelector('.lockup-left');
  const right = lockup.querySelector('.lockup-right');

  // start just below the bottom edge of the window, then rise into place
  const r = logo.getBoundingClientRect();
  const below = window.innerHeight - r.top + 24;
  const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

  logo.animate([
    { transform:'translateY(' + below + 'px)', opacity:0 },
    { opacity:1, offset:0.25 },
    { transform:'translateY(0px)', opacity:1 }
  ], { duration:1300, delay:250, easing:OUT, fill:'both' });

  // the stacks open out from the logo's side once it has landed
  // slowed from 0.75s by request (tried 1.5s and 1.15s, settled on 0.9s); an even
  // ease-in-out rather than OUT, which front-loads the movement and looks quick
  const WORDS = { duration:900, delay:1150, easing:'cubic-bezier(0.65, 0, 0.35, 1)', fill:'both' };
  left.animate([
    { clipPath:'inset(0 0 0 100%)', transform:'translateX(1.5rem)' },
    { clipPath:'inset(0 0 0 0)', transform:'translateX(0)' }
  ], WORDS);
  right.animate([
    { clipPath:'inset(0 100% 0 0)', transform:'translateX(-1.5rem)' },
    { clipPath:'inset(0 0 0 0)', transform:'translateX(0)' }
  ], WORDS);
  // the animations now hold everything in its starting state; drop the
  // pre-paint hiding (and its 3s failsafe) underneath them
  document.documentElement.classList.remove('lockup-intro');
})();


/* Who is (home): WHO IS opens #whois in place instead of going to about.html
   (a modified click, for a new tab, still goes there), and closes it again.
   While it's open, a click anywhere else closes it too, and so does Esc. */
(function(){
  const panel = document.getElementById('whois');
  const opener = document.querySelector('[data-whois]');
  if (!panel || !opener) return;
  const html = document.documentElement;

  function isOpen(){ return panel.classList.contains('is-open'); }
  function setOpen(on){
    panel.classList.toggle('is-open', on);
    html.classList.toggle('whois-open', on);
    panel.inert = !on;
    panel.setAttribute('aria-hidden', on ? 'false' : 'true');
    opener.setAttribute('aria-expanded', on ? 'true' : 'false');
    // focus left inside a closing panel would vanish with it
    if (!on && panel.contains(document.activeElement)) opener.focus({ preventScroll:true });
  }

  opener.addEventListener('click', function(e){
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(!isOpen());
  });
  // the click that opens it is WHO IS's own, which runs first; it mustn't
  // reach here and close the panel straight away
  document.addEventListener('click', function(e){
    if (isOpen() && !opener.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) setOpen(false); });
})();

/* Pixel field (journey.html): a grid of large square pixels behind the page,
   after thibaud.film. Dark colours only. A few soft clouds of colour drift
   across it, each in its own direction and turning as it goes, and the grid
   quantises them into hard cells; on top of that, single cells flicker, a row
   now and then slips sideways, and a block of cells flashes another dark
   colour for a moment. It steps at about 12 frames a second rather than
   gliding, which is what makes it read as glitching pixels. One canvas pixel
   per cell, scaled up unsmoothed by CSS (.pixel-bg). Reduced motion gets a
   single still frame. */
(function(){
  const canvas = document.querySelector('.pixel-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const CELL = 45;                 // css px per pixel, as on thibaud.film
  const STEP = 1000 / 12;          // ms per frame: stepped, not smooth
  const BASE = [18, 19, 22];       // the page's own near-black
  // the clouds' colours: greys, oxblood, brown, olive, navy, all kept dark
  const TINTS = [
    [62, 64, 70], [80, 82, 88], [40, 41, 46], [68, 26, 30],
    [66, 48, 32], [52, 53, 36], [34, 43, 64], [8, 8, 10]
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let cols = 0, rows = 0, img = null;
  let blobs = [], noise = null, glitches = [];

  function size(){
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    canvas.width = cols; canvas.height = rows;
    canvas.style.width = cols * CELL + 'px';
    canvas.style.height = rows * CELL + 'px';
    img = ctx.createImageData(cols, rows);
    noise = new Float32Array(cols * rows).map(() => rand(-1, 1));
    if (!blobs.length) blobs = TINTS.map(function(c){
      return {
        c: c,
        x: rand(0, cols), y: rand(0, rows),
        r: rand(3, 7),                       // radius in cells
        a: rand(0, Math.PI * 2),             // heading
        v: rand(0.06, 0.2),                  // cells per frame
        turn: rand(-0.06, 0.06),             // how it bends its path
        k: rand(0.7, 1)                      // how strongly it colours
      };
    });
  }

  function move(){
    blobs.forEach(function(b){
      b.turn += rand(-0.02, 0.02);
      b.turn = Math.max(-0.08, Math.min(0.08, b.turn));
      b.a += b.turn;
      b.x += Math.cos(b.a) * b.v;
      b.y += Math.sin(b.a) * b.v;
      const m = b.r;                         // wrap round, just out of sight
      if (b.x < -m) b.x = cols + m; else if (b.x > cols + m) b.x = -m;
      if (b.y < -m) b.y = rows + m; else if (b.y > rows + m) b.y = -m;
    });
    // a few cells re-roll their flicker each frame
    for (let n = Math.ceil(cols * rows * 0.06); n--; ) noise[Math.floor(Math.random() * noise.length)] = rand(-1, 1);
    // start a glitch now and then: a row slipping sideways, or a block flashing
    if (Math.random() < 0.12){
      if (Math.random() < 0.5){
        const y = Math.floor(rand(0, rows));
        glitches.push({ kind:'shift', y0:y, y1:Math.min(rows, y + 1 + Math.floor(rand(0, 3))), dx:(Math.random() < 0.5 ? -1 : 1) * Math.ceil(rand(0, 4)), life:Math.ceil(rand(2, 6)) });
      } else {
        const w = Math.ceil(rand(1, 6)), h = Math.ceil(rand(1, 4));
        glitches.push({ kind:'block', x0:Math.floor(rand(0, cols)), y0:Math.floor(rand(0, rows)), w:w, h:h, c:pick(TINTS), life:Math.ceil(rand(2, 8)) });
      }
    }
    glitches.forEach(g => g.life--);
    glitches = glitches.filter(g => g.life > 0);
  }

  function colourAt(x, y){
    let r = BASE[0], g = BASE[1], bl = BASE[2];
    for (let i = 0; i < blobs.length; i++){
      const b = blobs[i], dx = x + 0.5 - b.x, dy = y + 0.5 - b.y;
      const w = Math.exp(-(dx * dx + dy * dy) / (b.r * b.r)) * b.k;
      if (w < 0.01) continue;
      r += (b.c[0] - r) * w; g += (b.c[1] - g) * w; bl += (b.c[2] - bl) * w;
    }
    const f = noise[y * cols + ((x % cols) + cols) % cols] * 9;   // flicker, a few levels either way
    return [r + f, g + f, bl + f];
  }

  function draw(){
    const d = img.data;
    for (let y = 0; y < rows; y++){
      let shift = 0;
      for (let i = 0; i < glitches.length; i++){
        const gl = glitches[i];
        if (gl.kind === 'shift' && y >= gl.y0 && y < gl.y1) shift = gl.dx;
      }
      for (let x = 0; x < cols; x++){
        let c = colourAt(x - shift, y);
        for (let i = 0; i < glitches.length; i++){
          const gl = glitches[i];
          if (gl.kind === 'block' && x >= gl.x0 && x < gl.x0 + gl.w && y >= gl.y0 && y < gl.y0 + gl.h) c = gl.c;
        }
        const o = (y * cols + x) * 4;
        // stepped to 6 levels a channel: no smooth gradients inside the grid
        d[o]     = Math.round(c[0] / 6) * 6;
        d[o + 1] = Math.round(c[1] / 6) * 6;
        d[o + 2] = Math.round(c[2] / 6) * 6;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  size();
  draw();
  window.addEventListener('resize', function(){ size(); draw(); });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let last = 0;
  (function tick(now){
    if (now - last >= STEP){ last = now; move(); draw(); }
    requestAnimationFrame(tick);
  })(0);
})();

/* Decrypting text ([data-decrypt], journey.html's COMING SOON): the line
   decodes itself on a loop. Each letter churns through random glyphs and
   locks in, roughly left to right; the line holds with the odd letter
   glitching for a frame or two; then it scrambles back to noise and decodes
   again. The real text stays in a screen-reader-only copy, and the churning
   copy is hidden from them. Reduced motion leaves the text as it is. */
(function(){
  const els = document.querySelectorAll('[data-decrypt]');
  if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const GLYPHS = '01<>[]{}/\\|=+*-#%&$@?!ABCDEFGHKMNXZ';
  const TICK = 50;                          // ms between glyph changes
  const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  els.forEach(function(el){
    const text = el.textContent.trim();
    const chars = Array.from(text);
    el.textContent = '';
    const real = document.createElement('span');
    real.className = 'sr-only';
    real.textContent = text;
    const shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    el.append(real, shown);

    let t = 0, phase = 'decode', lock = [], glitch = new Map();
    function plan(){
      // when each letter locks: left to right with some scatter
      lock = chars.map((c, i) => i * 70 + Math.random() * 450);
    }
    plan();

    function render(){
      shown.textContent = chars.map(function(c, i){
        if (c === ' ') return ' ';
        if (phase === 'decode') return t >= lock[i] ? c : glyph();
        if (phase === 'hold')   return glitch.has(i) ? glitch.get(i) : c;
        return t >= lock[i] ? glyph() : c;           // 'encode': letters fall back to noise
      }).join('');
    }

    setInterval(function(){
      t += TICK;
      const end = Math.max.apply(null, lock);
      if (phase === 'decode' && t > end){ phase = 'hold'; t = 0; }
      else if (phase === 'hold'){
        glitch.forEach((g, i) => { if (Math.random() < 0.5) glitch.delete(i); });
        if (Math.random() < 0.12){
          const i = Math.floor(Math.random() * chars.length);
          if (chars[i] !== ' ') glitch.set(i, glyph());
        }
        if (t > 3200){ glitch.clear(); phase = 'encode'; t = 0; lock = chars.map(() => Math.random() * 500); }
      }
      else if (phase === 'encode' && t > Math.max.apply(null, lock) + 250){ phase = 'decode'; t = 0; plan(); }
      render();
    }, TICK);
    render();
  });
})();
