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
        const text = 'BKK[TH] ' + formatted;
        // the header scramble (below) keeps the time as letters it can churn
        if (timeEl._setTime) timeEl._setTime(text);
        else timeEl.textContent = text;
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

      run();
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
    // in again for someone who is already on the site. (The flag and class
    // are named for an earlier page transition; there is none now, pages just
    // cut.)
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
    // via Speculation Rules, so a click changes page without first sitting on
    // the old one for a network round trip. Prefetch only fetches the HTML — none of
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
      // a project's page scrolls by itself, inside a page that doesn't
      function inDetail(e){ return e.target.closest && e.target.closest('.view-detail'); }

      window.addEventListener('wheel', function(e){
        if (inDetail(e)) return;
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
        if (inDetail(e)) return;
        const deltaY = e.touches[0].clientY - touchStartY;
        if (window.scrollY <= 0 && deltaY > 0){
          e.preventDefault();
        } else if (atBottom() && deltaY < 0){
          e.preventDefault();
        }
      }, { passive:false });
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

/* Header scramble — hovering a letter of home's name, WORK, PLAYGROUND, JOURNEY,
   ABOUT, CONTACT or time, or of an inner page's CLOSE (its brackets keep their
   own fade), decrypts just that letter: it churns through random glyphs and
   locks back, with the work list's glyph set, steps and tick. Each letter is its
   own box, held at the width it had inside the word
   (measured once the fonts are in, kerning included, kept in em), so the evenly
   spread line never shifts (WORK, and PLAYGROUND, are in a proportional face).
   Commas and spaces stay put. The real word sits in aria-label on the links and
   in a .sr-only copy on the name and time, which are plain text and can't take
   one. The time changes every second, so its letters stay in place and take new
   values through _setTime; a letter mid-churn settles on the latest one. It's
   all mono, so those letters need no held width. Reduced motion: no effect. */
(function(){
  const links = document.querySelectorAll('header .home-nav, header .home-name, .close-label');
  if (!links.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const GLYPHS = '01<>[]{}/\\|=+*-#%&$ABCDEFGHKMNXZ';
  const STEPS = 14;
  const TICK_MS = 40;

  function scramble(ch){
    if (ch._scr) return;               // let a run finish rather than restart it
    let step = 0;
    ch._scr = setInterval(function(){
      step++;
      ch.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      if (step >= STEPS){
        clearInterval(ch._scr);
        ch._scr = null;
        ch.textContent = ch._letter;
      }
    }, TICK_MS);
  }

  function split(a){
    const word = a.textContent;
    const node = a.firstChild;
    const size = parseFloat(getComputedStyle(a).fontSize);
    const range = document.createRange();
    const widths = Array.from(word, function(c, i){
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      return range.getBoundingClientRect().width / size;
    });
    a.textContent = '';
    if (a.tagName === 'A') a.setAttribute('aria-label', word);
    else {
      const real = document.createElement('span');
      real.className = 'sr-only';
      real.textContent = word;
      a.appendChild(real);
    }
    Array.from(word).forEach(function(letter, i){
      const ch = document.createElement('span');
      ch.className = 'home-ch';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.width = widths[i] + 'em';
      ch.textContent = letter;
      ch._letter = letter;
      if (letter !== ',' && letter !== ' ') ch.addEventListener('mouseenter', function(){ scramble(ch); });
      a.appendChild(ch);
    });
  }

  document.fonts.ready.then(function(){ links.forEach(split); });

  const clock = document.getElementById('bkk-time');
  if (!clock) return;
  const first = clock.textContent;
  const real = document.createElement('span');
  const letters = [];
  real.className = 'sr-only';
  clock.textContent = '';
  clock.appendChild(real);
  clock._setTime = function(text){
    const chars = Array.from(text);
    real.textContent = text;
    while (letters.length > chars.length) letters.pop().remove();
    chars.forEach(function(letter, i){
      let ch = letters[i];
      if (!ch){
        const made = ch = letters[i] = document.createElement('span');
        made.setAttribute('aria-hidden', 'true');
        made.addEventListener('mouseenter', function(){ if (!/\s/.test(made._letter)) scramble(made); });
        clock.appendChild(made);
      }
      if (ch._letter === letter) return;
      ch._letter = letter;
      if (!ch._scr) ch.textContent = letter;
    });
  };
  clock._setTime(first);
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

/* Pop-ups (home): ABOUT opens #whois and CONTACT opens #contact-pop in place,
   each opener naming its pop-up in aria-controls, instead of going to
   about.html / contact.html (a modified click, for a new tab, still goes
   there). Clicking an opener again closes its pop-up; opening one closes the
   other. While one is open a click anywhere else closes it (a link inside it
   still goes where it goes), and so does Esc. */
(function(){
  const html = document.documentElement;
  const pops = Array.prototype.slice.call(document.querySelectorAll('[data-pop]')).map(function(opener){
    return { opener:opener, panel:document.getElementById(opener.getAttribute('aria-controls')) };
  }).filter(p => p.panel);
  if (!pops.length) return;

  function isOpen(p){ return p.panel.classList.contains('is-open'); }
  // closing a pop-up that holds a frame (CONTACT) asks the page in it to play
  // its exit first; it answers 'pop-close' when done, and if it never does
  // (not loaded yet, say) the pop-up closes anyway
  function requestClose(p){
    // a pop-up with an exit of its own (ABOUT's blocks flying back out) plays
    // it, then closes
    if (typeof p.panel.exit === 'function'){
      if (p.closing) return;
      p.closing = true;
      p.panel.exit().then(function(){ if (isOpen(p)) setOpen(p, false); });
      return;
    }
    const frame = p.panel.querySelector('iframe[data-src]');
    if (!frame || !frame.getAttribute('src') || !frame.contentWindow){ setOpen(p, false); return; }
    if (p.closing) return;
    p.closing = true;
    frame.contentWindow.postMessage('pop-exit', window.location.origin);
    p.fallback = setTimeout(function(){ if (isOpen(p)) setOpen(p, false); }, 1500);
  }
  function setOpen(p, on){
    p.closing = false;
    clearTimeout(p.fallback);
    // a pop-up holding a frame (CONTACT) loads it fresh on every open, so its
    // intro plays again, and lets it go once the fade-out is over
    const frame = p.panel.querySelector('iframe[data-src]');
    if (frame){
      clearTimeout(p.unload);
      if (on) frame.src = frame.getAttribute('data-src');
      else p.unload = setTimeout(function(){ if (!isOpen(p)) frame.removeAttribute('src'); }, 600);
    }
    p.panel.classList.toggle('is-open', on);
    p.panel.inert = !on;
    p.panel.setAttribute('aria-hidden', on ? 'false' : 'true');
    p.opener.setAttribute('aria-expanded', on ? 'true' : 'false');
    html.classList.toggle('whois-open', pops.some(isOpen));
    // the walkers keep out of PLAYGROUND and CONTACT ("Home steps")
    html.classList.toggle('steps-off', pops.some(q => isOpen(q) && q.panel.id !== 'whois'));
    // focus left inside a closing panel would vanish with it
    if (!on && p.panel.contains(document.activeElement)) p.opener.focus({ preventScroll:true });
  }

  pops.forEach(function(p){
    p.opener.addEventListener('click', function(e){
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      pops.forEach(q => { if (q !== p && isOpen(q)) requestClose(q); });
      if (isOpen(p)) requestClose(p); else setOpen(p, true);
    });
  });
  // the click that opens a pop-up is its opener's own, which runs first; it
  // mustn't reach here and close the pop-up straight away
  document.addEventListener('click', function(e){
    pops.forEach(function(p){
      if (isOpen(p) && !p.opener.contains(e.target)) requestClose(p);
    });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') pops.forEach(p => { if (isOpen(p)) requestClose(p); });
  });
  // the framed contact page is done with its exit (or was asked to close by a
  // click on its empty space or Esc) — see "Embedded contact" below
  window.addEventListener('message', function(e){
    if (e.origin !== window.location.origin || e.data !== 'pop-close') return;
    pops.forEach(p => { if (isOpen(p)) setOpen(p, false); });
  });
})();

/* Back from View all (home, from playground.html's [CLOSE]): the way there run backwards, the
   window fading in from the colour it left on and the header coming back down through its
   masks. The head script has put it up there already. */
(function(){
  const html = document.documentElement;
  if (!html.classList.contains('view-back')) return;
  const cover = document.createElement('div');
  cover.className = 'view-fade';
  document.body.appendChild(cover);
  cover.animate([{ opacity:1 }, { opacity:0 }], { duration:400, easing:'ease-in-out', fill:'forwards' }).finished.then(function(){
    cover.remove();
    const letters = Array.prototype.slice.call(document.querySelectorAll('header .home-ch'));
    const landing = letters.map(function(letter){
      return letter.animate([{ transform:'translateY(-115%)' }, { transform:'none' }],
        { duration:800, easing:'cubic-bezier(0.16, 1, 0.3, 1)', fill:'both' });
    });
    Promise.all(landing.map(a => a.finished)).then(function(){
      html.classList.remove('view-all', 'view-back');
      landing.forEach(a => a.cancel());
    });
  });
})();

/* View all (playground.html): on opening the tiles slide up from the bottom of the window,
   solid and steady, slowing into place, one after another in a new mixed order each time,
   never starting with the first. It waits for the screens themselves, or not for long. Hovering a tile dims every other project's. The videos play once the page
   is up; with reduced motion they stay on their posters and nothing rises.

   Clicking a tile opens its project, as gilhuybrecht.com does: the other projects go soft
   behind a frosted layer, the project's own tiles lift out of the grid, tilting as they fly
   to a big column on the right, and the text rises line by line through masks on the left,
   as the Playground list does, staying put while the column scrolls. The column holds copies
   of the tiles' media, so each flies from its tile's place. On closing the text goes up out
   of its masks first and then the screens fly back: Esc, the browser's back, or a click
   anywhere but on a screen. At the bottom left, after cathydolle.com's case studies, a little
   map of the column: a thumbnail of every screen, each one a way to it, and a frame that
   follows the scroll, showing what's in view. It slides off to the left on closing.

   Arriving with a project's name in the address (home's SOLE VAULT), the tiles rise as ever,
   and once they've landed that project opens from them as if clicked.

   [CLOSE] is the way in run backwards: the tiles drop off the bottom of the window in a mixed
   order, and home takes it from there ("Back from View all"). */
(function(){
  const tiles = Array.prototype.slice.call(document.querySelectorAll('.view-tile'));
  if (!tiles.length) return;
  const html = document.documentElement;
  const grid = tiles[0].parentElement;
  const RISE_MS = 1050, RISE_STEP_MS = 105, WAIT_MS = 1500, ASKED_AFTER_MS = 120;

  function dim(project){
    tiles.forEach(function(tile){
      tile.classList.toggle('is-dim', !!project && tile.getAttribute('data-project') !== project);
    });
  }
  grid.addEventListener('mouseover', function(e){
    const tile = e.target.closest('.view-tile');
    dim(tile && tile.getAttribute('data-project'));
  });
  grid.addEventListener('mouseleave', function(){ dim(null); });

  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mixed(){
    const order = tiles.slice();
    for (let i = order.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }
  const closer = document.querySelector('.close-btn');
  if (closer) closer.addEventListener('click', function(e){
    if (calm || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (html.classList.contains('view-going')) return;
    html.classList.add('view-going', 'view-rising');
    const falling = mixed().map(function(tile, i){
      const below = Math.max(innerHeight - tile.getBoundingClientRect().top, 80);
      return tile.animate([{ transform:'none' }, { transform:'translateY(' + below + 'px)' }],
        { duration:RISE_MS, delay:i * RISE_STEP_MS, easing:'cubic-bezier(0.9, 0, 0.6, 1)', fill:'both' }).finished;
    });
    Promise.all(falling).then(function(){
      try {
        sessionStorage.setItem('viewBack', '1');
        sessionStorage.setItem('pageTransition', '1');
      } catch(err){}
      window.location.href = closer.href;
    });
  });
  // back again from the browser's memory of the page, tiles gone and all
  window.addEventListener('pageshow', function(e){
    if (!e.persisted || !html.classList.contains('view-going')) return;
    html.classList.remove('view-going', 'view-rising');
    tiles.forEach(tile => tile.getAnimations().forEach(a => a.cancel()));
  });
  const FLY_MS = 750, STAGGER_MS = 35, TEXT_AT_MS = 480, TEXT_MS = 800, TEXT_STEP_MS = 70, TEXT_OUT_MS = 320, TEXT_OUT_STEP_MS = 20, MAP_OUT_MS = 420;
  let open = null;      // the project on show
  let busy = false;
  let leaveAfter = false;   // the browser's back, pressed in mid-flight
  function leave(){ if (open && !busy) history.back(); }

  document.querySelectorAll('.view-detail').forEach(function(detail){
    const project = detail.getAttribute('data-project');
    const own = tiles.filter(tile => tile.getAttribute('data-project') === project);
    const column = detail.querySelector('.view-column');
    // a copy of each tile's media, then any screens that are only here, after the tile they
    // go with; those take no part in the flight, so they're held back until it's over
    const extras = Array.prototype.slice.call(column.querySelectorAll('.view-shot'));
    const shots = [];
    own.forEach(function(tile, i){
      const shot = document.createElement('figure');
      shot.className = 'view-shot';
      shot.appendChild(tile.querySelector('img, video').cloneNode(true));
      column.appendChild(shot);
      shots.push({ el:shot, tile:tile });
      extras.filter(extra => +extra.getAttribute('data-with') === i + 1).forEach(function(extra){
        column.appendChild(extra);
      });
    });
    function hold(on){ extras.forEach(extra => extra.classList.toggle('is-held', on)); }

    const map = document.createElement('div');
    const frame = document.createElement('span');
    const screens = Array.prototype.slice.call(column.querySelectorAll('.view-shot'));
    map.className = 'view-map';
    map.style.setProperty('--screens', screens.length);
    frame.className = 'view-map-frame';
    screens.forEach(function(screen, i){
      const thumb = document.createElement('button');
      const media = screen.firstElementChild;
      const picture = document.createElement('img');
      thumb.type = 'button';
      thumb.className = 'view-thumb';
      thumb.setAttribute('aria-label', 'Go to screen ' + (i + 1));
      picture.src = media.poster || media.getAttribute('src');
      picture.alt = '';
      thumb.appendChild(picture);
      thumb.addEventListener('click', function(){
        detail.scrollTo({ top:screen.offsetTop - column.offsetTop - 16, behavior:calm ? 'auto' : 'smooth' });
      });
      map.appendChild(thumb);
    });
    map.appendChild(frame);
    detail.querySelector('.view-info').appendChild(map);
    function follow(){
      const tall = map.offsetHeight / detail.scrollHeight;
      frame.style.height = detail.clientHeight * tall + 'px';
      frame.style.transform = 'translateY(' + detail.scrollTop * tall + 'px)';
    }
    detail.addEventListener('scroll', follow, { passive:true });
    window.addEventListener('resize', follow);
    const blocks = detail.querySelectorAll('.view-title, .view-about');
    const rows = detail.querySelectorAll('.view-facts > div');
    const logo = detail.querySelector('.view-logo img');
    let moving = [];

    // a block of text as lines, each in a mask of its own, as they fall at this width; it
    // goes back to plain text once still, so it can wrap again if the window changes
    function split(block){
      if (block.querySelector('.view-line')) return block.querySelectorAll('.view-line');
      const text = block.textContent;
      block.textContent = '';
      const words = text.split(' ').map(function(word, i){
        const span = document.createElement('span');
        span.textContent = word;
        if (i) block.appendChild(document.createTextNode(' '));
        block.appendChild(span);
        return span;
      });
      const lines = [];
      words.forEach(function(word){
        const last = lines[lines.length - 1];
        if (last && last.top === word.offsetTop) last.words.push(word.textContent);
        else lines.push({ top:word.offsetTop, words:[word.textContent] });
      });
      block.setAttribute('data-text', text);
      block.textContent = '';
      lines.forEach(function(line){
        const mask = document.createElement('span'), inner = document.createElement('span');
        mask.className = 'view-mask';
        inner.className = 'view-line';
        inner.textContent = line.words.join(' ');
        mask.appendChild(inner);
        block.appendChild(mask);
      });
      return block.querySelectorAll('.view-line');
    }
    function unsplit(){
      blocks.forEach(function(block){
        if (block.hasAttribute('data-text')) block.textContent = block.getAttribute('data-text');
        block.removeAttribute('data-text');
      });
    }
    // what moves together, top to bottom: each line, and each row of the facts
    function groups(){
      const out = [];
      blocks.forEach(block => split(block).forEach(line => out.push([line])));
      rows.forEach(row => out.push(Array.prototype.slice.call(row.children)));
      out[0].push(logo);        // on the title's line
      return out;
    }
    function stop(){
      moving.forEach(a => a.cancel());
      moving = [];
    }
    function textIn(){
      groups().forEach(function(group, i){
        group.forEach(function(el){
          moving.push(el.animate([{ transform:'translateY(115%)' }, { transform:'none' }], {
            duration:TEXT_MS, delay:TEXT_AT_MS + i * TEXT_STEP_MS, easing:'cubic-bezier(0.16, 1, 0.3, 1)', fill:'backwards'
          }));
        });
      });
      moving.push(map.animate([{ opacity:0 }, { opacity:1 }], { duration:400, delay:TEXT_AT_MS, fill:'backwards' }));
      const these = moving;
      Promise.all(these.map(a => a.finished)).then(function(){
        if (moving === these){ moving = []; unsplit(); }
      }, function(){});
    }
    function textOut(){
      stop();
      const all = groups();
      all.forEach(function(group, i){
        group.forEach(function(el){
          moving.push(el.animate([{ transform:'none' }, { transform:'translateY(-115%)' }], {
            duration:TEXT_OUT_MS, delay:(all.length - 1 - i) * TEXT_OUT_STEP_MS, easing:'cubic-bezier(0.7, 0, 0.84, 0)', fill:'both'
          }));
        });
      });
      // and once the words are gone, the map leaves by the left edge of the window; only
      // then do the pictures go (hide())
      return Promise.all(moving.map(a => a.finished)).then(function(){
        const slide = map.animate([{ transform:'none' }, { transform:'translateX(calc(-100% - 1.5rem))' }], {
          duration:MAP_OUT_MS, easing:'cubic-bezier(0.7, 0, 0.84, 0)', fill:'both'
        });
        moving.push(slide);
        return slide.finished;
      });
    }

    // each shot, from flat on its tile, tilted on the way, to flat in the column
    function fly(leaving){
      return Promise.all(shots.map(function(shot, i){
        const to = shot.el.getBoundingClientRect();
        const from = shot.tile.querySelector('img, video').getBoundingClientRect();
        const k = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top;
        const at = (x, y, size, rx, ry, rz) => 'perspective(1400px) translate(' + x + 'px, ' + y + 'px) scale(' + size + ') rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) rotateZ(' + rz + 'deg)';
        const frames = [at(dx, dy, k, 0, 0, 0), at(dx * 0.45, dy * 0.45, k + (1 - k) * 0.55, 8, -16, -3), at(0, 0, 1, 0, 0, 0)];
        if (leaving) frames.reverse();
        return shot.el.animate(frames.map(f => ({ transform:f })), {
          duration:FLY_MS, delay:i * STAGGER_MS, easing:'cubic-bezier(0.6, 0, 0.2, 1)', fill:'both'
        }).finished;
      }));
    }
    function show(){
      if (busy || open) return;
      open = detail;
      dim(null);
      history.pushState({ project:project }, '', '#' + project);
      own.forEach(tile => tile.classList.add('is-lifted'));
      html.classList.add('view-open');
      detail.classList.add('is-on');
      detail.inert = false;
      detail.setAttribute('aria-hidden', 'false');
      detail.scrollTop = 0;
      follow();
      shots.forEach(function(shot){
        const video = shot.el.querySelector('video');
        if (!video || calm) return;
        video.currentTime = shot.tile.querySelector('video').currentTime;
        video.play().catch(function(){});
      });
      if (calm) return;
      busy = true;
      hold(true);
      textIn();
      fly(false).then(function(){
        hold(false);
        busy = false;
        if (leaveAfter){ leaveAfter = false; hide(); }
      });
    }
    function hide(){
      if (busy || open !== detail) return;
      html.classList.remove('view-open');
      function done(){
        detail.classList.remove('is-on');
        detail.inert = true;
        detail.setAttribute('aria-hidden', 'true');
        own.forEach(tile => tile.classList.remove('is-lifted'));
        shots.forEach(function(shot){
          shot.el.getAnimations().forEach(a => a.cancel());
          const video = shot.el.querySelector('video');
          if (video) video.pause();
        });
        open = null;
        busy = false;
      }
      if (calm){ done(); return; }
      busy = true;
      html.classList.add('view-leaving');
      textOut().then(function(){
        html.classList.remove('view-leaving');
        hold(true);
        return fly(true);
      }).then(function(){
        stop();
        unsplit();
        done();
      });
    }
    detail.close = hide;
    detail.open = show;
    own.forEach(function(tile){
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.addEventListener('click', show);
      tile.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); show(); }
      });
    });
    detail.addEventListener('click', function(e){
      if (!e.target.closest('.view-shot, .view-map')) leave();
    });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') leave();
  });
  window.addEventListener('popstate', function(){
    if (!open) return;
    if (busy) leaveAfter = true;
    else open.close();
  });

  const asked = Array.prototype.find.call(document.querySelectorAll('.view-detail'), function(detail){
    return '#' + detail.getAttribute('data-project') === location.hash;
  });
  // from the grid, so that closing lands on the grid and not back in the project
  function openAsked(){
    history.replaceState(null, '', location.pathname);
    asked.open();
  }
  if (!html.classList.contains('view-intro')){
    if (asked) openAsked();
    return;
  }
  function rise(){
    const order = mixed();
    if (order[0] === tiles[0] && order.length > 1) order.push(order.shift());
    html.classList.add('view-rising');
    const rising = order.map(function(tile, i){
      const below = Math.max(innerHeight - tile.getBoundingClientRect().top, 80);
      return tile.animate([{ transform:'translateY(' + below + 'px)' }, { transform:'none' }],
        { duration:RISE_MS, delay:i * RISE_STEP_MS, easing:'cubic-bezier(0.4, 0, 0.1, 1)', fill:'backwards' }).finished;
    });
    Promise.all(rising).then(function(){
      html.classList.remove('view-rising');
      if (asked) setTimeout(openAsked, ASKED_AFTER_MS);
    });
    html.classList.remove('view-intro');
    grid.querySelectorAll('video').forEach(function(video){ video.play().catch(function(){}); });
  }
  const ready = Array.prototype.map.call(grid.querySelectorAll('img, video'), function(media){
    if (media.tagName === 'IMG') return media.decode().catch(function(){});
    return new Promise(function(done){
      if (media.readyState >= 2) done();
      else media.addEventListener('loadeddata', done, { once:true });
    });
  });
  Promise.race([
    Promise.all(ready),
    new Promise(function(done){ setTimeout(done, WAIT_MS); })
  ]).then(rise);
})();

/* Home steps: after the menu on fromanother.love: people walking over a frosted glass
   floor, watched from underneath it. Each is a jointed body walking (or now and then
   running) in 3D, worked out here in centimetres, and seen in perspective from an eye below
   the glass: what's pressed on the glass is full size, and the higher a part of the body,
   the smaller it is, the nearer the middle of the window it draws, and the more the frost
   blurs and pales it, so the legs rise from the feet as soft glowing columns towards a body
   that's only a haze. A bare foot strikes on the heel, rolls flat, peels up from the heel
   and leaves off the toes; only what's on the glass presses dark, a soft bean with no toes
   or lines, coming and going part by part. Legs go thin and thick as legs do; knees are
   solved from hip and ankle, the pelvis turns and sways, and the arms swing against the
   legs. Up to three walk at once, no two alike: each has their own pace, stride
   and turn of the foot, no two of their steps fall quite the same, and they wander a little
   on their way across the window, at any angle, from beyond one edge to beyond another.
   Header letters go white over a shadow, read from what's just been drawn. They wait, out
   of sight, while PLAYGROUND or CONTACT is open. With reduced motion they stand still
   mid-stride; without WebGL2 the page stays bare. */
(function(){
  const canvas = document.querySelector('.home-steps');
  if (!canvas) return;
  const html = document.documentElement;
  const gl = canvas.getContext('webgl2', { alpha:false, depth:false, stencil:false, antialias:false });
  if (!gl) return;
  const WALKERS = 3;
  const LIMBS = 8;            // feet, arms, hips, trunk, shoulders, head (legs are drawn apart)
  const PX = 3;               // px to a centimetre, in a window 1440 wide
  const DEPTH = 140;          // cm the eye is below the glass
  // two ways of going. cycle: seconds for two steps; stride: cm covered in them; stance: how
  // much of its cycle a foot spends down; flat: when the sole has rolled flat; heelOff: when
  // the heel starts to leave; strike: rad, the toes up as the foot lands; push: rad, the heel
  // up as the toes leave; clear: cm the foot rises in mid-swing; kick: how early in the swing
  // it's highest; lead: how far of a stride the foot lands ahead of the body; track: cm each
  // foot falls to the side of the line; bob: cm the hips rise and fall (a runner's are
  // lowest on a foot, not highest); lean: cm the chest is ahead of the hips; then the arms.
  // A run has both feet off the glass between steps, lands nearer flat and under the body,
  // and kicks the swinging heel up behind
  const WALK = { cycle:[0.96, 1.18], stride:[165, 200], stance:0.62, flat:0.1, heelOff:0.4, strike:0.31,
    push:0.8, clear:7, kick:1, lead:0.24, track:7, toeOut:[0.18, 0.32], hip:84, bob:3, lean:2, swing:24, hand:78 };
  const RUN = { cycle:[0.68, 0.78], stride:[230, 280], stance:0.36, flat:0.05, heelOff:0.16, strike:0.1,
    push:0.95, clear:36, kick:0.7, lead:0.14, track:4, toeOut:[0.08, 0.2], hip:80, bob:-5, lean:5, swing:34, hand:98 };
  const RUNNERS = 0.3;        // how many of them run
  const FOOT = 30;            // cm, heel to toe
  const BALL = 0.68;          // where the ball of the foot is along it
  const ANKLE_UP = 8;
  const THIGH = 46, SHIN = 46;
  const KNEE = 1;             // how much of a knee's bend shows
  const HIP_WIDE = 9, TURN = 0.14, SWAY = 2.5;
  const SHOULDER = 142, SHOULDER_WIDE = 19;
  const REACH = 190;          // cm a body shows beyond its feet

  const VERTEX = `#version 300 es
    void main(){
      vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;
  const FRAGMENT = `#version 300 es
    precision highp float;
    #define WALKERS ${WALKERS}
    #define LIMBS ${LIMBS}
    const vec3 PAPER = vec3(0.992);
    const vec3 HAZE = vec3(0.94, 0.52, 0.49);
    const vec3 RED = vec3(0.79, 0.07, 0.1);
    const vec3 DEEP = vec3(0.56, 0.03, 0.07);     // where the weight is
    const float PENUMBRA = 0.16;    // how much blur each px of height brings: frosted, so a lot
    const float FROST = 2.5;        // cm of blur even on the glass
    const float JOIN = 2.5;         // how softly the body's parts join: 1 adds them, higher nears the darkest
    uniform vec4 uLimb[WALKERS * LIMBS * 3];  // its two ends on the glass; their heights, how solid and px to a cm; its form
    uniform vec4 uLeg[WALKERS * 2 * 4];       // ankle and hip as seen; the curve's pull at the knee and px to a cm; at ankle, pull and hip how high (as blur) and how near (as size), and how solid at each end
    uniform vec4 uFoot[WALKERS * 2];          // the end of the heel and of the toes, on the glass
    uniform vec4 uRaised[WALKERS * 2];        // how high heel, ball and toes are, and which way is in
    uniform vec4 uBox[WALKERS];               // all of a body's shadow, to skip the rest of the window
    uniform float uSize[WALKERS];             // a foot's length, 0 for nobody there
    uniform float uHeight;                    // the window, in drawn pixels
    uniform float uRatio;                     // drawn pixels to a CSS pixel
    out vec4 colour;

    float sq(float x){ return x * x; }   // pow() of a number below 0 is no number on some GPUs
    // a limb's shadow, whole at both ends, as the body joins its parts: as wide as its form
    // there, spread by its height and the frost, and paler for being spread
    float limb(vec2 p, vec4 ends, vec4 look, vec4 form){
      vec2 e = ends.zw - ends.xy;
      float past = dot(p - ends.xy, e) / max(dot(e, e), 1e-4);
      float along = clamp(past, 0.0, 1.0);
      vec2 gap = p - ends.xy - e * along;
      float wide = mix(form.x, form.y, along) + form.z * exp(-sq((along - form.w) / 0.28));
      float height = mix(look.x, look.y, along);
      float blur = PENUMBRA * height + FROST * look.w;
      float s2 = wide * wide + blur * blur;
      // darker the nearer the glass, as a leg is, so a lifted foot carries on from its ankle
      float solid = look.z * (1.0 + 1.2 * exp(-height / (look.w * 5.0)));
      return solid * wide * inversesqrt(s2) * exp(-dot(gap, gap) / (2.0 * s2));
    }
    // a leg is one curve from the ankle through the knee to the hip, thin and thick along it as
    // a leg is: a slim ankle, the calf bulging below a narrower knee, the thigh filling out
    // to the hip, so the knee bends rather than two pieces meeting there and doubling up. It's
    // drawn in short pieces, each fading in at its start and out at its end over its own
    // blur, the way the next fades in, so that between them they make exactly one whole
    const vec4 SHIN_FORM = vec4(2.8, 4.4, 1.8, 0.62);
    const vec4 THIGH_FORM = vec4(4.6, 8.0, 0.8, 0.55);
    const int PIECES = 8;
    float swell(vec4 form, float x){
      return mix(form.x, form.y, x) + form.z * exp(-sq((x - form.w) / 0.25));
    }
    float bez(vec3 k, float t){ return mix(mix(k.x, k.y, t), mix(k.y, k.z, t), t); }
    float leg(vec2 p, vec4 ends, vec4 bend, vec4 high, vec4 near){
      float ink = 0.0;
      vec2 a = ends.xy;
      float lift = high.x;
      for (int k = 1; k <= PIECES; k++){
        float t0 = float(k - 1) / float(PIECES), t1 = float(k) / float(PIECES);
        vec2 b = mix(mix(ends.xy, bend.xy, t1), mix(bend.xy, ends.zw, t1), t1);
        float rise = bez(high.xyz, t1);
        vec2 e = b - a;
        float span = max(length(e), 1e-3);
        float past = dot(p - a, e) / (span * span);
        float along = clamp(past, 0.0, 1.0);
        vec2 gap = p - a - e * along;
        float t = mix(t0, t1, along);
        float form = mix(swell(SHIN_FORM, clamp(t * 2.0, 0.0, 1.0)), swell(THIGH_FORM, clamp(t * 2.0 - 1.0, 0.0, 1.0)), smoothstep(0.42, 0.58, t));
        float wide = bend.z * bez(near.xyz, t) * form;
        float blur = PENUMBRA * mix(lift, rise, along) + FROST * bend.z;
        float r = inversesqrt(wide * wide + blur * blur);
        // whole at both ends: down into the foot and up into the hips
        float part = k == 1 ? 1.0 : smoothstep(-1.1, 1.1, past * span * r);
        if (k < PIECES) part -= smoothstep(-1.1, 1.1, (past - 1.0) * span * r);
        // and darker the nearer the glass it comes, so it runs on into the foot's dark
        float low = exp(-mix(lift, rise, along) / (bend.z * 5.0));
        float solid = mix(high.w, near.w, smoothstep(0.2, 0.8, t)) * (1.0 + 1.2 * low);
        ink += part * solid * wide * r * exp(-dot(gap, gap) * r * r / 2.0);
        a = b;
        lift = rise;
      }
      return ink;
    }
    float capsule(vec2 q, vec2 a, vec2 b, float r0, float r1){
      vec2 e = b - a;
      float t = clamp(dot(q - a, e) / dot(e, e), 0.0, 1.0);
      return length(q - a - e * t) - mix(r0, r1, t);
    }
    const vec3 TOES[5] = vec3[5](vec3(1.08, 0.1, 0.048), vec3(1.085, -0.04, 0.029), vec3(1.05, -0.13, 0.026),
      vec3(0.995, -0.21, 0.023), vec3(0.925, -0.27, 0.02));   // where each sits, and how big
    // a foot pressed on frosted glass, after fromanother.love: no lines, only a soft dark
    // bean, narrower at the heel and broader at the ball, and five little soft toes just
    // beyond it, all one colour, fading part by part as it lifts, heel first and toes last. Measured in foot
    // lengths from the heel, y running towards the big toe's side
    float sole(vec2 p, vec4 ends, vec4 raised, float size){
      vec2 axis = ends.zw - ends.xy;
      float span = max(dot(axis, axis), 1e-4);
      vec2 q = vec2(dot(p - ends.xy, axis) / span, dot(p - ends.xy, vec2(-axis.y, axis.x)) * inversesqrt(span) / size * raised.w);
      // nothing past a foot and a half from the heel (measured on the window: a foot tipped up
      // looks short, and a bound in its own lengths would cut straight across it)
      vec2 off = p - (ends.xy + ends.zw) * 0.5;
      if (dot(off, off) > sq(1.5 * size) || abs(q.y) > 0.9) return 0.0;
      // curved like a foot: bowing out along the outer edge, heel and ball turned in, and
      // narrowing at the arch on the inner side
      float arc = 0.07 * (sq((q.x - 0.45) / 0.42) - 0.6);
      vec2 qc = vec2(q.x, q.y - arc);
      float bean = capsule(qc, vec2(0.14, 0.0), vec2(0.76, 0.0), 0.085, 0.14);
      bean += 0.035 * exp(-sq((q.x - 0.46) / 0.14)) * smoothstep(-0.02, 0.06, qc.y);
      float x = clamp(q.x, 0.0, 1.0);
      float height = x < 0.68 ? mix(raised.x, raised.y, x / 0.68) : mix(raised.y, raised.z, (x - 0.68) / 0.32);
      // one even colour all through, foot and toes alike: full inside, soft only at the edge
      float soft = 0.1 + 0.35 * height / size;
      float press = (1.0 - smoothstep(-soft * 0.4, soft * 1.6, bean)) * exp(-height / (size * 0.12));
      // the toes, the big one leading, the rest getting smaller round the ball's edge, each
      // apart from the next and the foot clear of them all; each brought up to the foot's own
      // colour, which the small ones would otherwise never reach inside their soft edges
      float tipSoft = 0.045 + 0.35 * raised.z / size;
      float toes = 0.0, toe = 1.0;
      for (int k = 0; k < 5; k++){
        float d = length(q - TOES[k].xy) - TOES[k].z;
        float full = 1.0 - smoothstep(-tipSoft * 0.4, tipSoft * 1.4, -TOES[k].z);
        toes = max(toes, (1.0 - smoothstep(-tipSoft * 0.4, tipSoft * 1.4, d)) / full);
        toe = min(toe, d);
      }
      // and they leave with the ball of the foot, never lingering on their own once it's up
      toes *= exp(-max(raised.z, raised.y) / (size * 0.12));
      // and the glass darkens softly round it, where the foot is nearly touching
      float close = (1.0 - smoothstep(-0.05, 0.3, min(bean, toe))) * exp(-height / (size * 0.3));
      return 1.05 * max(press, toes) + 0.25 * close;
    }
    float noise(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

    void main(){
      vec2 p = vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y) / uRatio;
      float ink = 0.0;
      for (int i = 0; i < WALKERS; i++){
        vec4 box = uBox[i];
        if (uSize[i] <= 0.0 || p.x < box.x || p.y < box.y || p.x > box.z || p.y > box.w) continue;
        // one body, not pieces: wherever its parts meet, feet and legs, thighs, hips and trunk,
        // added up they'd pile into dark knots and show their seams; instead they're joined
        // softly, as one form, nearly the darkest of them there and no more. (max(): a
        // rounding below 0 would be no number at all to pow())
        float body = 0.0;
        for (int l = 0; l < LIMBS; l++){
          int at = (i * LIMBS + l) * 3;
          body += pow(max(limb(p, uLimb[at], uLimb[at + 1], uLimb[at + 2]), 0.0), JOIN);
        }
        for (int l = 0; l < 2; l++){
          int at = (i * 2 + l) * 4;
          body += pow(max(leg(p, uLeg[at], uLeg[at + 1], uLeg[at + 2], uLeg[at + 3]), 0.0), JOIN);
          body += pow(max(sole(p, uFoot[i * 2 + l], uRaised[i * 2 + l], uSize[i]), 0.0), JOIN);
        }
        ink += pow(body, 1.0 / JOIN);
      }
      vec3 c = mix(PAPER, HAZE, 1.0 - exp(-ink * 2.1));
      c = mix(c, RED, smoothstep(0.5, 1.5, ink));
      c = mix(c, DEEP, smoothstep(1.4, 2.7, ink));
      // a triangular dither of two noises, so the long soft gradients don't band into steps
      colour = vec4(c + (noise(gl_FragCoord.xy) + noise(gl_FragCoord.xy + vec2(17.0, 59.0)) - 1.0) / 255.0, 1.0);
    }`;

  function compile(type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());
  const at = name => gl.getUniformLocation(program, name);
  const u = { limb:at('uLimb'), leg:at('uLeg'), foot:at('uFoot'), raised:at('uRaised'), box:at('uBox'), size:at('uSize'), height:at('uHeight'), ratio:at('uRatio') };

  let strip = null;
  // drawn at the screen's own pixels (a Retina screen's two to a CSS pixel), so nothing is
  // stretched and soft from a smaller canvas
  function fit(){
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(u.height, canvas.height);
    gl.uniform1f(u.ratio, ratio);
    strip = null;
  }

  const between = (a, b) => a + Math.random() * (b - a);
  const smooth = t => t * t * (3 - 2 * t);
  const clamp01 = t => Math.min(1, Math.max(0, t));
  const mix = (a, b, t) => a + (b - a) * t;
  const add = (a, b, by) => a.map((v, n) => v + b[n] * by);
  const length = a => Math.hypot(a[0], a[1], a[2]);

  // a straight line through somewhere in the window, from beyond one edge to beyond another
  function walk(from){
    const px = PX * between(0.9, 1.1) * innerWidth / 1440;
    const angle = between(0, Math.PI * 2);
    const way = [Math.cos(angle), Math.sin(angle)];
    const through = [between(0.1, 0.9) * innerWidth, between(0.15, 0.9) * innerHeight];
    const size = [innerWidth, innerHeight];
    const ahead = Math.min(...[0, 1].map(n => way[n] > 0 ? (size[n] - through[n]) / way[n] : -through[n] / (way[n] || 1e-6)));
    const behind = Math.min(...[0, 1].map(n => way[n] > 0 ? through[n] / way[n] : (through[n] - size[n]) / (way[n] || 1e-6)));
    const margin = REACH * px;
    const gait = Math.random() < RUNNERS ? RUN : WALK;
    return {
      from:from,
      px:px,
      gait:gait,
      seed:between(0, 100),
      stride:between(gait.stride[0], gait.stride[1]),
      cycle:between(gait.cycle[0], gait.cycle[1]),
      toeOut:between(gait.toeOut[0], gait.toeOut[1]),
      drift:between(6, 26),
      way:way,
      side:[-way[1], way[0]],
      start:[through[0] - way[0] * (behind + margin), through[1] - way[1] * (behind + margin)],
      length:behind + ahead + margin * 2
    };
  }
  // how much smaller a thing this high looks to the eye below the glass
  const near = height => DEPTH / (DEPTH + Math.max(0, height));
  // from [along the line, to its side, height], in cm, to where the eye below the glass sees
  // it, in px: the higher, the nearer the middle of the window
  function cast(w, p){
    const side = p[1] + w.drift * Math.sin(p[0] * 0.012 + w.seed);   // their wandering
    const x = w.start[0] + (w.way[0] * p[0] + w.side[0] * side) * w.px;
    const y = w.start[1] + (w.way[1] * p[0] + w.side[1] * side) * w.px;
    const s = near(p[2]);
    return [innerWidth / 2 + (x - innerWidth / 2) * s, innerHeight / 2 + (y - innerHeight / 2) * s];
  }
  // the same small difference every time for a given step of a given walker, from -1 to 1
  function shake(w, n){
    const x = Math.sin((n + w.seed) * 127.1) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }

  // foot 0 or 1, its cycle having reached this far: heel, toes and ankle
  function foot(w, which, cycle){
    const g = w.gait;
    const turn = cycle + which * 0.5;
    const k = Math.floor(turn), u = turn - k;
    const plant = n => (n - which * 0.5 + g.lead) * w.stride + shake(w, n * 2 + which) * 3;
    const track = n => g.track + shake(w, n * 2 + which + 0.5) * 1.8;
    const peelAlong = plant(k) + BALL * FOOT * (1 - Math.cos(g.push));
    const peelHeight = BALL * FOOT * Math.sin(g.push);
    let along, height, pitch, wide = track(k);
    if (u < g.flat){ along = plant(k); height = 0; pitch = g.strike * (1 - smooth(u / g.flat)); }
    else if (u < g.heelOff){ along = plant(k); height = 0; pitch = 0; }
    else if (u < g.stance){
      // over the ball of the foot, which stays where it is
      pitch = -g.push * smooth((u - g.heelOff) / (g.stance - g.heelOff));
      along = plant(k) + BALL * FOOT * (1 - Math.cos(pitch));
      height = BALL * FOOT * Math.sin(-pitch);
    } else {
      // a runner's foot rises first, behind, and only then comes through
      const v = (u - g.stance) / (1 - g.stance);
      along = mix(peelAlong, plant(k + 1), smooth(Math.pow(v, 2 - g.kick)));
      height = peelHeight * (1 - v) * (1 - v) + g.clear * Math.sin(Math.PI * Math.pow(v, g.kick)) * (1 - 0.4 * v);
      pitch = mix(-g.push, g.strike, smooth(v));
      wide = mix(track(k), track(k + 1), smooth(v));
    }
    const out = which ? 1 : -1;
    const c = Math.cos(pitch), s = Math.sin(pitch);
    // toes turned out a little
    const at = by => [along + FOOT * by * c, out * (wide + FOOT * by * w.toeOut), Math.max(0, height + FOOT * by * s)];
    return {
      out:out,
      heel:at(0),
      ball:at(BALL),
      toes:at(1),
      ankle:[along + FOOT * 0.2 * c - ANKLE_UP * s, out * wide, height + FOOT * 0.2 * s + ANKLE_UP * c]
    };
  }
  // the knee between a hip and an ankle, bending the way the body is going
  function knee(hip, ankle){
    const reach = add(ankle, hip, -1);
    const d = Math.min(length(reach), THIGH + SHIN - 0.01);
    const down = reach.map(v => v / (length(reach) || 1));
    const a = (THIGH * THIGH - SHIN * SHIN + d * d) / (2 * d);
    const bend = Math.sqrt(Math.max(0, THIGH * THIGH - a * a));
    const forward = add([1, 0, 0], down, -down[0]);
    return add(add(hip, down, a), forward, KNEE * bend / (length(forward) || 1));
  }

  const limbs = new Float32Array(WALKERS * LIMBS * 12);
  const legs = new Float32Array(WALKERS * 2 * 16);
  const soles = new Float32Array(WALKERS * 8);
  const raised = new Float32Array(WALKERS * 8);
  const boxes = new Float32Array(WALKERS * 4);
  const sizes = new Float32Array(WALKERS);
  // the form of a limb, in cm: wide at each end, and what it swells by, and where (a leg's
  // is in the shader)
  const SMUDGE = [3.5, 4.5, 0, 0.5];      // as broad as the foot, which it is
  const HIPS = [7, 7, 0, 0.5], TRUNK = [8, 11, -1.5, 0.4], YOKE = [5, 5, 0, 0.5], ARM = [3, 2, 0.8, 0.25], HEAD = [5, 6, 1, 0.5];
  function place(w, i, now){
    const seconds = (now - w.from) / 1000;
    const cycle = seconds / w.cycle + 0.02 * Math.sin(seconds * 0.9 + w.seed);   // never quite even
    const along = cycle * w.stride;
    const swing = Math.PI * 2 * cycle;
    const g = w.gait;
    const pelvis = [along, -SWAY * Math.sin(swing), g.hip - g.bob * Math.cos(swing * 2)];
    const turn = TURN * Math.cos(swing);
    const chest = [along + g.lean, pelvis[1] * 0.5, SHOULDER - (84 - g.hip) - g.bob * Math.cos(swing * 2)];
    let slot = i * LIMBS, left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    function reach(from, to, height){
      const spread = height * w.px * 0.6 + 60;
      left = Math.min(left, from[0] - spread, to[0] - spread);
      right = Math.max(right, from[0] + spread, to[0] + spread);
      top = Math.min(top, from[1] - spread, to[1] - spread);
      bottom = Math.max(bottom, from[1] + spread, to[1] + spread);
    }
    // the further up, the smaller it looks, and its blur with it
    function stroke(a, b, form, solid){
      const from = cast(w, a), to = cast(w, b), sa = near(a[2]), sb = near(b[2]);
      limbs.set([from[0], from[1], to[0], to[1], a[2] * w.px * sa, b[2] * w.px * sb, solid, w.px,
        form[0] * w.px * sa, form[1] * w.px * sb, form[2] * w.px * (sa + sb) / 2, form[3]], slot * 12);
      slot++;
      reach(from, to, Math.max(a[2], b[2]));
    }
    const hips = [], shoulders = [];
    [foot(w, 0, cycle), foot(w, 1, cycle)].forEach(function(f, n){
      const hip = [pelvis[0] + f.out * -HIP_WIDE * Math.sin(turn), pelvis[1] + f.out * HIP_WIDE, pelvis[2]];
      // the curve's pull, set so that it passes through the knee, as seen, halfway along;
      // how high (as blur) and how near (as size) go along it the same way
      const joint = knee(hip, f.ankle);
      const from = cast(w, f.ankle), by = cast(w, joint), to = cast(w, hip);
      const pull = (a, b, c) => 2 * b - (a + c) / 2;
      const blur = p3 => p3[2] * w.px * near(p3[2]);
      legs.set([from[0], from[1], to[0], to[1],
        pull(from[0], by[0], to[0]), pull(from[1], by[1], to[1]), w.px, 0,
        blur(f.ankle), pull(blur(f.ankle), blur(joint), blur(hip)), blur(hip), 0.55,
        near(f.ankle[2]), pull(near(f.ankle[2]), near(joint[2]), near(hip[2])), near(hip[2]), 0.44], (i * 2 + n) * 16);
      reach(from, to, hip[2]);
      reach(by, by, joint[2]);
      // the foot off the glass: all that's left of it is this smudge
      stroke(f.heel, f.toes, SMUDGE, 0.35);
      // the print is the whole foot laid flat on the glass under its ball, never the heel and
      // toes where they are: rolling over the ball, the heel rises and the toes tip down,
      // which would squeeze the print shorter, as if it folded in half. A foot bends at the
      // ball and its heel just leaves the glass; only the heights say what's still down
      const flat = by => [f.ball[0] + FOOT * (by - BALL), f.ball[1] + f.out * FOOT * (by - BALL) * w.toeOut, 0];
      const heel = cast(w, flat(0)), toes = cast(w, flat(1));
      soles.set([heel[0], heel[1], toes[0], toes[1]], (i * 2 + n) * 4);
      raised.set([f.heel[2] * w.px, f.ball[2] * w.px, f.toes[2] * w.px, -f.out], (i * 2 + n) * 4);
      // each arm goes with the other leg, and the shoulders turn against the hips
      const shoulder = [chest[0] + f.out * SHOULDER_WIDE * Math.sin(turn), chest[1] + f.out * SHOULDER_WIDE, chest[2]];
      stroke(shoulder, [chest[0] + f.out * g.swing * Math.cos(swing), shoulder[1] + f.out * 3, g.hand], ARM, 0.22);
      hips.push(hip);
      shoulders.push(shoulder);
    });
    stroke(hips[0], hips[1], HIPS, 0.26);
    stroke(pelvis, chest, TRUNK, 0.26);
    stroke(shoulders[0], shoulders[1], YOKE, 0.16);
    stroke([chest[0], chest[1], chest[2] + 10], [chest[0], chest[1], chest[2] + 28], HEAD, 0.16);
    boxes.set([left, top, right, bottom], i * 4);
    sizes[i] = FOOT * w.px;
    return along * w.px > w.length;
  }
  function paint(){
    gl.uniform4fv(u.limb, limbs);
    gl.uniform4fv(u.leg, legs);
    gl.uniform4fv(u.foot, soles);
    gl.uniform4fv(u.raised, raised);
    gl.uniform4fv(u.box, boxes);
    gl.uniform1fv(u.size, sizes);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // header letters over a shadow go white: the green of what's just been drawn tells,
  // red having next to none. Only worth reading while a shadow reaches the header
  const header = document.querySelector('header');
  function tint(){
    const ratio = canvas.width / innerWidth;
    const w = canvas.width, h = Math.min(canvas.height, Math.ceil(header.getBoundingClientRect().bottom * ratio));
    strip = strip || new Uint8Array(w * h * 4);
    gl.readPixels(0, canvas.height - h, w, h, gl.RGBA, gl.UNSIGNED_BYTE, strip);
    let letters = header.querySelectorAll('.home-ch, #bkk-time > [aria-hidden], .time-badge .dot');
    if (letters.length < 2) letters = header.querySelectorAll('.home-name, .home-nav, #bkk-time, .time-badge .dot');
    letters.forEach(function(el){
      const r = el.getBoundingClientRect();
      const x = Math.min(w - 1, Math.round((r.left + r.right) / 2 * ratio));
      const y = Math.max(0, h - 1 - Math.round((r.top + r.bottom) / 2 * ratio));
      const green = strip[(y * w + x) * 4 + 1];
      if (el._over ? green > 120 : green < 90){
        el._over = !el._over;
        el.style[el.classList.contains('dot') ? 'backgroundColor' : 'color'] = el._over ? '#fff' : '';
      }
    });
  }

  fit();
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const walkers = [];
  const begun = performance.now();
  for (let i = 0; i < WALKERS; i++) walkers.push(walk(begun + i * between(1200, 1900)));
  if (calm){
    // the middle of the walk, whichever line it is
    const still = () => { walkers.forEach(function(w, i){ place(w, i, w.from + w.length / 2 / w.px / w.stride * w.cycle * 1000); }); paint(); tint(); };
    still();
    window.addEventListener('resize', function(){ fit(); still(); });
    return;
  }
  window.addEventListener('resize', fit);
  // their own clock, stopped while they're hidden, so they carry on from where they were;
  // a long gap between frames (a hidden tab) doesn't count either
  let clock = begun, last = begun, tick = 0, reached = false;
  (function frame(now){
    requestAnimationFrame(frame);
    const passed = Math.min(now - last, 100);
    last = now;
    if (html.classList.contains('steps-off')) return;
    clock += passed;
    walkers.forEach(function(w, i){
      sizes[i] = 0;             // not on the glass yet, or waiting
      if (clock < w.from) return;
      if (place(w, i, clock)) walkers[i] = walk(clock + between(200, 1600));
    });
    paint();
    if (++tick % 3) return;
    const reach = header.getBoundingClientRect().bottom;
    const near = walkers.some((w, i) => sizes[i] > 0 && boxes[i * 4 + 1] < reach);
    if (near || reached) tint();      // once more after, to put the letters back
    reached = near;
  })(begun);
})();

/* Playground and Work pop-ups (home): one of the pop-ups above, so a click or Enter on
   PLAYGROUND or WORK opens it in place, but unlike them only CLOSE or Esc shuts it: no
   click inside reaches the pop-ups' click-anywhere handler but CLOSE's. This adds
   what's also its own: the list's CLOSE stands where the word that opened it
   stands, wherever the header's spacing has put it, so the word reads as turning
   into CLOSE (the swap itself is CSS, on aria-expanded); one OPEN PROJECT and one
   box of logos serve every project, gliding to the hovered line rather than
   masking out and in again, the logo also fading in huge behind it all, with
   the text turning light where it crosses it (a copy of the list, kept in step
   here and cut to the logo's shape in CSS), with a short wait on leaving a line so the gap
   between two lines doesn't count as leaving; panel.exit sends the words up out
   of their masks before the blur fades. VIEW ALL leaves in style, and so do the
   projects, which have no pages yet and go to the same place: the words and the header
   go up out of their masks, the window fades to stone, and the page, stone itself,
   comes up from there. Work's has no projects yet, so
   what's for them just never runs. Reduced motion: no exit
   to wait for, and no fade. */
document.querySelectorAll('.play-pop').forEach(function(panel){
  const opener = document.querySelector('[aria-controls="' + panel.id + '"]');
  if (!opener) return;
  const list = panel.querySelector('.play-list');
  const ghost = document.createElement('div');
  ghost.className = 'play-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.appendChild(list.cloneNode(true));
  panel.appendChild(ghost);
  const movers = panel.querySelectorAll('.play-open, .play-logos');
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EXIT_MS = 620;      // the last word's delay and travel
  const FADE_MS = 600;      // .whois's fade, with a little to spare
  const LEAVE_MS = 120;     // long enough to cross the gap between two lines
  let active = null;        // the project line OPEN PROJECT is on
  let leaving = null;

  function place(){
    const r = opener.getBoundingClientRect();
    panel.querySelectorAll('.play-list').forEach(function(el){
      el.style.setProperty('--play-x', r.left + 'px');
      el.style.top = r.top + 'px';
    });
  }
  opener.addEventListener('click', place);
  window.addEventListener('resize', place);

  function moveTo(row){
    movers.forEach(function(el){
      const y = row.offsetTop + (row.offsetHeight - el.offsetHeight) / 2;
      el.style.transform = 'translateY(' + y + 'px)';
    });
  }
  // everything here is in the list and its copy alike
  function showProject(name){
    panel.querySelectorAll('.is-project').forEach(function(row){
      row.classList.toggle('is-active', row.getAttribute('data-logo') === name);
    });
    panel.querySelectorAll('.play-open').forEach(function(el){
      el.classList.toggle('is-on', name !== null);
    });
    panel.querySelectorAll('.play-logo, .play-mark').forEach(function(img){
      img.classList.toggle('is-on', img.getAttribute('data-name') === name);
    });
    const mark = panel.querySelector('.play-mark.is-on');
    // no logo: the mask stays as it was while the copy fades away
    if (mark) ghost.style.webkitMaskImage = ghost.style.maskImage = 'url("' + mark.src + '")';
    ghost.classList.toggle('is-on', !!mark);
  }
  function show(row){
    clearTimeout(leaving);
    if (row === active) return;
    if (!active){
      // arriving from nowhere: be on the line already, then open the mask
      movers.forEach(function(el){ el.style.transition = 'none'; });
      moveTo(row);
      movers[0].getBoundingClientRect();
      movers.forEach(function(el){ el.style.transition = ''; });
    }
    moveTo(row);
    showProject(row.getAttribute('data-logo'));
    active = row;
  }
  function clear(){
    showProject(null);
    active = null;
  }
  function hide(){
    clearTimeout(leaving);
    leaving = setTimeout(clear, LEAVE_MS);
  }
  list.querySelectorAll('.is-project').forEach(function(row){
    row.addEventListener('mouseenter', function(){ show(row); });
    row.addEventListener('mouseleave', hide);
    row.addEventListener('focus', function(){ show(row); });
    row.addEventListener('blur', hide);
  });

  panel.exit = function(){
    hide();
    if (calm) return Promise.resolve();
    panel.classList.add('is-leaving');
    // the words stay above their masks until the layer has faded away
    setTimeout(function(){ panel.classList.remove('is-leaving'); }, EXIT_MS + FADE_MS);
    return new Promise(function(done){ setTimeout(done, EXIT_MS); });
  };

  let fade = null;
  function viewAll(href){
    if (fade) return;
    fade = document.createElement('div');
    fade.className = 'view-fade';
    document.documentElement.classList.add('view-all');
    panel.exit().then(function(){
      document.body.appendChild(fade);
      fade.animate([{ opacity:0 }, { opacity:1 }], { duration:400, easing:'ease-in-out', fill:'forwards' }).finished.then(function(){
        window.location.href = href;
      });
    });
  }
  // back again from the browser's memory of the page, covered and all
  window.addEventListener('pageshow', function(e){
    if (!e.persisted || !fade) return;
    fade.remove();
    fade = null;
    document.documentElement.classList.remove('view-all');
  });

  panel.addEventListener('click', function(e){
    if (e.target.closest('button.play-item')) return;
    e.stopPropagation();
    const all = e.target.closest('a.play-item');
    if (all && !calm && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey){
      e.preventDefault();
      viewAll(all.href);
    }
  });
});

/* About pixels (home): after cipher.tv's about. When ABOUT opens, black pixel
   blocks (18px cells) build up from every side and corner of the window
   inward, each block simply appearing in its own place (flat: nothing travels,
   so it never reads as a zoom), outer ones first with a little randomness,
   and fill the window up to a ragged, tilted oval round the bio and the
   drawing, which stay on the light frosted page in
   the opening (no block ever lands on the words or the face). After that,
   every 0.3s, eight blocks along the ragged edge change, some going and some
   coming, so the edge keeps flickering. Closing (panel.exit, called by the pop-up code) takes them
   away in reverse, the ones nearest the text first, back out to the edges,
   before the pop-up fades. Reduced motion: the blocks are simply there, and
   leave at once. */
(function(){
  const panel = document.getElementById('whois');
  const canvas = panel && panel.querySelector('.whois-pixels');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CELL = 18, PAD = 90, CORE = 48, TILT = -12 * Math.PI / 180, COLOUR = '#0b0b0b';
  const OPEN = 0.85, EDGE = 1.15;            // the opening, and its ragged band, in oval radii
  const IN_MS = 900, OUT_MS = 600, JITTER = 0.3, FLIPS = 8, FLIP_MS = 300;
  let cells = [], edge = [], raf = 0, timer = 0, ratio = 1, level = 0;

  // the bio, the availability line and the drawing, in layout coordinates
  // (offset* ignores the pop-in transform)
  function content(){
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    panel.querySelectorAll('.whois-bio, .whois-note, .whois-avatar').forEach(function(el){
      let x = 0, y = 0, n = el;
      while (n && n !== panel){ x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      l = Math.min(l, x); t = Math.min(t, y); r = Math.max(r, x + el.offsetWidth); b = Math.max(b, y + el.offsetHeight);
    });
    return { l:l, t:t, r:r, b:b };
  }
  // a block in the ragged band is there more often the further out it sits
  function roll(c){ return Math.random() < (c.r - OPEN) / (EDGE - OPEN); }
  function build(){
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    const W = panel.clientWidth, H = panel.clientHeight;
    canvas.width = Math.round(W * ratio); canvas.height = Math.round(H * ratio);
    const box = content();
    const cx = (box.l + box.r) / 2, cy = (box.t + box.b) / 2;
    const a = (box.r - box.l) / 2 * 1.25 + PAD, b = (box.b - box.t) / 2 * 1.6 + PAD;
    const cos = Math.cos(TILT), sin = Math.sin(TILT);
    cells = []; edge = [];
    // the grid is anchored on the opening's centre so it sits square on the text
    const x0 = cx - Math.ceil(cx / CELL) * CELL, y0 = cy - Math.ceil(cy / CELL) * CELL;
    for (let y = y0; y < H; y += CELL){
      for (let x = x0; x < W; x += CELL){
        const mx = x + CELL / 2, my = y + CELL / 2;
        if (x + CELL > box.l - CORE && x < box.r + CORE && y + CELL > box.t - CORE && y < box.b + CORE) continue;
        const dx = mx - cx, dy = my - cy;
        const u = dx * cos + dy * sin, v = -dx * sin + dy * cos;
        const r = Math.hypot(u / a, v / b);
        if (r < OPEN) continue;
        // when it turns up: by how far in from the nearest edge of the window
        // it sits (0 at the edge), loosened a little so the front is ragged
        const inward = Math.min(mx, W - mx, my, H - my) / (Math.min(W, H) / 2);
        const c = { x:x, y:y, r:r, k:Math.min(inward, 1) * (1 - JITTER) + Math.random() * JITTER };
        c.on = r >= EDGE || roll(c);
        cells.push(c);
        if (r < EDGE) edge.push(c);
      }
    }
  }
  // every block whose turn (k) has come by the current level is there
  function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLOUR;
    const s = Math.ceil(CELL * ratio);
    for (const c of cells){
      if (!c.on || c.k > level) continue;
      ctx.fillRect(Math.round(c.x * ratio), Math.round(c.y * ratio), s, s);
    }
  }
  // runs the level from where it is to `to`: up brings blocks in from the
  // edges, down takes the innermost away first
  function sweep(to, ms){
    cancelAnimationFrame(raf);
    const from = level, start = performance.now();
    return new Promise(function(done){
      (function frame(now){
        const t = Math.min((now - start) / ms, 1);
        level = from + (to - from) * t;
        draw();
        if (t < 1) raf = requestAnimationFrame(frame); else done();
      })(start);
    });
  }

  function open(){
    stop();
    build();
    level = 0;
    if (still){ level = 1; draw(); return; }
    sweep(1, IN_MS).then(function(){
      // every 0.3s eight edge blocks change, each a real change (one going
      // or one coming), so the ragged edge keeps flickering; the rest stay put
      timer = setInterval(function(){
        for (let k = 0, tries = 0; k < FLIPS && edge.length && tries < FLIPS * 6; tries++){
          const c = edge[(Math.random() * edge.length) | 0];
          const on = roll(c);
          if (on !== c.on){ c.on = on; k++; }
        }
        draw();
      }, FLIP_MS);
    });
  }
  function stop(){ cancelAnimationFrame(raf); clearInterval(timer); raf = timer = 0; }

  // the pop-up code calls this to close ABOUT: the blocks fly back out first
  panel.exit = function(){
    clearInterval(timer);
    if (still || !cells.length) return Promise.resolve();
    return sweep(0, OUT_MS);
  };

  new MutationObserver(function(){
    if (panel.classList.contains('is-open')) open();
    else stop();
  }).observe(panel, { attributes:true, attributeFilter:['class'] });
  window.addEventListener('resize', function(){
    if (!panel.classList.contains('is-open')) return;
    stop(); build(); level = 1; draw();
  });
})();

/* Embedded contact (contact.html?embed, inside home's CONTACT pop-up): a click
   on the empty space round the boxes, Esc, or the home page asking
   ('pop-exit') plays the exit: the boxes drop off the bottom of the window,
   one after another from the left, and the progress ticks go the other way, up
   off the top; then it tells the home
   page to close the pop-up ('pop-close'), which fades the blur out. Clicking a
   box still does that box's own thing. While the boxes' intro is still
   running, clicks do nothing at all; Esc still closes, straight away. */
(function(){
  if (!document.documentElement.classList.contains('embed') || window.parent === window) return;
  const scroller = document.querySelector('.contact-boxes');
  let leaving = false;
  function close(){ window.parent.postMessage('pop-close', window.location.origin); }
  function intro(){ return scroller && scroller.classList.contains('is-intro'); }

  function exit(){
    if (leaving) return;
    leaving = true;
    if (!scroller || intro()){ close(); return; }   // nothing settled to animate yet
    const boxes = Array.prototype.slice.call(scroller.querySelectorAll('.contact-box'));
    const H = window.innerHeight, W = window.innerWidth;
    const at = boxes.map(b => b.getBoundingClientRect());
    // the boxes in view leave left to right, each a step behind the last; the ones
    // scrolled out of view are hidden by the rail anyway, so they just go. `translate`
    // rather than transform, so whatever transform a box already has stays put
    const seen = at.map((r, i) => i).filter(i => at[i].right > 0 && at[i].left < W)
      .sort((a, b) => at[a].left - at[b].left);
    const DUR = 720, STEP = 60, EASE = 'cubic-bezier(0.7, 0, 0.3, 1)';
    const runs = boxes.map(function(b, i){
      const k = seen.indexOf(i);
      return b.animate([{ translate:'0 0' }, { translate:'0 ' + Math.ceil(H - at[i].top + 40) + 'px' }], {
        duration:k < 0 ? 0 : DUR, delay:k < 0 ? 0 : k * STEP, easing:EASE, fill:'forwards'
      }).finished;
    });
    // and the ticks rise out by the top as the first box starts down (the bar's own
    // translateY(-50%) centring is a transform, which `translate` adds to)
    const bar = document.getElementById('contactProgress');
    if (bar){
      const top = bar.getBoundingClientRect().bottom + 40;
      runs.push(bar.animate([{ translate:'0 0' }, { translate:'0 ' + -Math.ceil(top) + 'px' }], {
        duration:DUR, easing:EASE, fill:'forwards'
      }).finished);
    }
    Promise.all(runs).then(close, close);
  }

  // capture, so this runs before the site's own link handling
  document.addEventListener('click', function(e){
    if (intro() || leaving){ e.preventDefault(); e.stopPropagation(); return; }
    if (e.target.closest && e.target.closest('.close-btn')){ e.preventDefault(); exit(); return; }
    if (e.target.closest && e.target.closest('.contact-box, a, button')) return;
    exit();
  }, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') exit(); });
  window.addEventListener('message', function(e){
    if (e.origin === window.location.origin && e.data === 'pop-exit') exit();
  });
})();

/* Contact boxes still waiting for their address (href="#"): a click does
   nothing, rather than opening a copy of this page in a new tab. Fill in the
   href and the box works. */
(function(){
  document.addEventListener('click', function(e){
    const box = e.target.closest && e.target.closest('a.contact-box[href="#"]');
    if (box) e.preventDefault();
  });
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
