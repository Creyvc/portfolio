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
      document.querySelectorAll('.project-box').forEach(box => {
        ['tl', 'tr', 'bl', 'br'].forEach(corner => {
          const dot = document.createElement('span');
          dot.className = `corner-dot ${corner}`;
          box.appendChild(dot);
        });
      });
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
      const projects = document.getElementById('projects');
      const header = document.querySelector('header');
      const boxes = document.querySelectorAll('.project-box');
      if (!projects || !header || !boxes.length) return;

      const dirs = [
        { x: -1, y: 0, base: 'rotate(-1.4deg)' },
        { x: 1, y: 0, base: 'rotate(1.1deg) translateY(0.75rem)' },
        { x: -1, y: 1, base: 'rotate(1deg) translateY(-0.5rem)' },
        { x: 1, y: 1, base: 'rotate(-0.7deg)' }
      ];
      const distance = 500;

      function update(){
        const headerH = header.getBoundingClientRect().height;
        const range = window.innerHeight - headerH;
        const projRect = projects.getBoundingClientRect();

        const entryProgress = 1 - Math.min(Math.max((projRect.top - headerH) / range, 0), 1);
        const exitProgress = Math.min(Math.max((headerH - projRect.top) / range, 0), 1);

        boxes.forEach((box, i) => {
          const dir = dirs[i] || dirs[0];
          const offset = (1 - entryProgress) * distance + exitProgress * distance;
          const dx = dir.x * offset;
          const dy = dir.y * offset;
          box.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) ${dir.base}`;
        });
      }

      window.addEventListener('scroll', update, { passive:true });
      window.addEventListener('resize', update);
      update();
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

    (function(){
      const track = document.getElementById('marqueeTrack');
      if (!track) return;

      let pos = 0;
      const speed = 1.6;
      let halfWidth;

      function measure(){
        halfWidth = track.scrollWidth / 2;
      }

      window.addEventListener('load', measure);
      window.addEventListener('resize', measure);
      measure();

      function animate(){
        pos -= speed;
        if (Math.abs(pos) >= halfWidth){
          pos += halfWidth;
        }
        track.style.transform = `translateX(${pos}px)`;
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
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

      const start = performance.now();
      (function step(now){
        const t = Math.min(now - start, TOTAL);
        render(t);
        if (t < TOTAL) requestAnimationFrame(step); else finish();
      })(start);

      // The boxes are dot-sized and blank until the run completes, so never let
      // that state be the final one: if the frame loop stalls for any reason,
      // put the page into its normal state anyway.
      setTimeout(finish, TOTAL + 900);
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

(function(){
  // ===== Dot Grid Background =====
  // Physics-inspired cursor interaction: dots break from the grid and orbit in
  // randomized 3D planes (atomic-orbital model). A single global clock drives
  // every orbit at constant speed; the cursor only decides which dots are pulled
  // in. On leave, orbits wind down with a smooth ease-out decay.
  const section = document.getElementById('blackDivider');
  const canvas = document.getElementById('dotGrid');
  const cursorCircle = document.getElementById('cursorCircle');
  if (!section || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // ---- Properties ----
  const DOT_COLOR    = '255, 255, 255'; // rgb; white dots on the black section
  const DOT_RADIUS   = 2;    // px (1–12)
  const GRID_SPACING = 28;   // px (12 tight – 80 airy)
  const ENABLE_ORBIT = true; // 3D orbit on/off (off = just scale + brighten)
  const ORBIT_SPEED  = 1.5;  // radians / second (global, cursor never changes it)
  const IMPACT_RADIUS= 160;  // px reach from cursor (20–400)
  const SCALE_HOVER  = 3.6;  // dot enlargement at the center of the impact zone
  const ORBIT_R      = 22;   // how far a fully-pulled dot breaks from its grid spot

  let dots = [];
  let W = 0, H = 0, dpr = 1;
  let mouseX = null, mouseY = null, active = false;
  let raf = null;

  function rand(a, b){ return a + Math.random() * (b - a); }

  function buildGrid(){
    dots = [];
    const cols = Math.ceil(W / GRID_SPACING) + 1;
    const rows = Math.ceil(H / GRID_SPACING) + 1;
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        dots.push({
          x: c * GRID_SPACING,
          y: r * GRID_SPACING,
          inc: rand(0, Math.PI),        // inclination — tilt of the orbital plane
          asc: rand(0, Math.PI * 2),    // ascension — plane rotation around viewer axis
          phase: rand(0, Math.PI * 2),  // where on the orbit it starts
          infl: 0                        // current cursor influence (eased)
        });
      }
    }
  }

  function resize(){
    const rect = section.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2); // resolution-aware
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
    if (!raf) render(); // redraw the static grid after a resize
  }

  function render(){
    raf = null;
    const clock = performance.now() / 1000; // global wall clock — constant orbit speed
    ctx.clearRect(0, 0, W, H);
    let busy = false;

    for (let i = 0; i < dots.length; i++){
      const d = dots[i];

      // target influence from cursor proximity to this dot's grid position
      let target = 0;
      if (active && mouseX !== null){
        const dx = d.x - mouseX, dy = d.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < IMPACT_RADIUS) target = 1 - dist / IMPACT_RADIUS;
      }
      d.infl += (target - d.infl) * 0.12; // ease-in / ease-out decay
      if (d.infl > 0.003) busy = true; else if (target === 0) d.infl = 0;

      let ox = 0, oy = 0, depth = 0;
      if (ENABLE_ORBIT && d.infl > 0.001){
        const R = d.infl * ORBIT_R;
        const th = clock * ORBIT_SPEED + d.phase;
        // point on the orbit circle in its own plane
        let px = Math.cos(th) * R, py = Math.sin(th) * R;
        // tilt the plane by inclination (rotate about X): introduces depth (z)
        const ci = Math.cos(d.inc), si = Math.sin(d.inc);
        const y1 = py * ci;      // z-in was 0
        depth = py * si;
        // rotate the plane about the viewer axis by ascension (rotate about Z)
        const ca = Math.cos(d.asc), sa = Math.sin(d.asc);
        ox = px * ca - y1 * sa;
        oy = px * sa + y1 * ca;
      }

      const depthN = ORBIT_R ? depth / ORBIT_R : 0;         // -1 (back) .. 1 (front)
      const scale = 1 + d.infl * (SCALE_HOVER - 1);
      const radius = Math.max(0.2, DOT_RADIUS * scale * (1 + depthN * 0.5));
      let alpha = 0.45 + d.infl * 0.55;                     // brighten near cursor
      alpha = Math.min(1, Math.max(0.06, alpha * (1 + depthN * 0.35))); // depth shading

      ctx.beginPath();
      ctx.arc(d.x + ox, d.y + oy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + DOT_COLOR + ', ' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    // keep animating while the cursor is active or dots are still settling
    if (active || busy) raf = requestAnimationFrame(render);
  }

  function start(){ if (!raf) raf = requestAnimationFrame(render); }

  section.addEventListener('mouseenter', function(){
    document.body.classList.add('on-black-divider');
    active = true; start();
  });
  section.addEventListener('mousemove', function(e){
    const rect = section.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    active = true;
    if (cursorCircle){
      cursorCircle.style.left = mouseX + 'px';
      cursorCircle.style.top = mouseY + 'px';
      cursorCircle.style.opacity = '1';
    }
    start();
  });
  section.addEventListener('mouseleave', function(){
    active = false; mouseX = null; mouseY = null;
    document.body.classList.remove('on-black-divider');
    if (cursorCircle) cursorCircle.style.opacity = '0';
    start(); // let the orbits wind down to rest, then the loop stops itself
  });

  // rebuild on resize (ResizeObserver per spec, window resize as fallback)
  if ('ResizeObserver' in window){
    new ResizeObserver(resize).observe(section);
  } else {
    window.addEventListener('resize', resize);
  }
  resize();
})();
(function(){
  const section = document.getElementById('blackDivider');
  const text = document.getElementById('discoverText');
  if (!section || !text) return;

  const chars = Array.from(text.childNodes).flatMap(function(node){
    if (node.nodeType === Node.TEXT_NODE){
      return node.textContent.split('').map(function(ch){
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch === ' ' ? ' ' : ch;
        return span;
      });
    }
    node.classList.add('char');
    return [node];
  });
  text.innerHTML = '';
  chars.forEach(function(c){ text.appendChild(c); c.style.display = 'inline-block'; c.style.position = 'relative'; });

  const links = chars.map(function(c){ return { el: c, curX: 0, curY: 0, targetX: 0, targetY: 0 }; });

  // Text stays fixed in the middle — no mouse-following.
})();

(function(){
  if (typeof Matter === 'undefined') return;
  const container = document.getElementById('tagCloud');
  if (!container) return;

  const ICON_ATTR = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    jewelry: '<polygon points="12 2 19 9 12 22 5 9 12 2"/><line x1="5" y1="9" x2="19" y2="9"/>',
    ai: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>',
    ml: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/>',
    fullstack: '<polygon points="12 2 22 8.5 12 15 2 8.5 12 2"/><polyline points="2 15.5 12 21 22 15.5"/>',
    datascience: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    python: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    coding: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    brainstorming: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
    softskills: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    programming: '<rect x="4" y="3" width="16" height="18" rx="2"/><polyline points="9 8 7 10 9 12"/><polyline points="13 8 15 10 13 12"/>',
    java: '<path d="M18 8h1a4 4 0 1 1 0 8h-1"/><path d="M2 8h14v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    cpp: '<line x1="4" y1="9" x2="4" y2="15"/><line x1="1" y1="12" x2="7" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/><path d="M20 8a4 4 0 1 0 0 8"/>',
    c: '<path d="M20 8a7 7 0 1 0 0 8"/>',
    databases: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    oop: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
    frontend: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    backend: '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><line x1="6" y1="7" x2="6.01" y2="7"/><line x1="6" y1="17" x2="6.01" y2="17"/>',
    teamwork: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
    learning: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
    problemsolving: '<path d="M4 8V5a2 2 0 0 1 2-2h3a2 2 0 0 0 4 0h3a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-3a2 2 0 0 0-4 0H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"/>'
  };

  const skills = [
    { name:'Jewelry', icon:'jewelry' },
    { name:'AI', icon:'ai' },
    { name:'ML', icon:'ml' },
    { name:'Full Stack', icon:'fullstack' },
    { name:'Data Science', icon:'datascience' },
    { name:'Python', icon:'python' },
    { name:'Coding', icon:'coding' },
    { name:'Brainstorming', icon:'brainstorming' },
    { name:'Soft Skills', icon:'softskills' },
    { name:'Programming', icon:'programming' },
    { name:'Java', icon:'java' },
    { name:'C++', icon:'cpp' },
    { name:'C', icon:'c' },
    { name:'Databases', icon:'databases' },
    { name:'OOP', icon:'oop' },
    { name:'Frontend', icon:'frontend' },
    { name:'Backend', icon:'backend' },
    { name:'Teamwork', icon:'teamwork' },
    { name:'Learning', icon:'learning' },
    { name:'Problem Solving', icon:'problemsolving' }
  ];

  const circleIndexes = { 2:true, 7:true, 12:true, 17:true };

  const badges = skills.map(function(skill, i){
    const isCircle = !!circleIndexes[i];
    const el = document.createElement('div');
    el.className = 'tag-badge' + (isCircle ? ' is-circle' : '');
    const svg = '<svg viewBox="0 0 24 24" ' + ICON_ATTR + '>' + icons[skill.icon] + '</svg>';
    el.innerHTML = isCircle ? svg : svg + '<span>' + skill.name + '</span>';
    if (isCircle) el.title = skill.name;
    container.appendChild(el);
    return { el: el, isCircle: isCircle, w: 0, h: 0, body: null };
  });

  const Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies,
        Mouse = Matter.Mouse, MouseConstraint = Matter.MouseConstraint,
        Events = Matter.Events, Runner = Matter.Runner;

  const engine = Engine.create();
  engine.gravity.y = 1;
  const world = engine.world;

  let W = 900, H = 480, floorY = 480;
  let wallBodies = [];
  let ceilingWall = null;
  let ceilingTimer = null;
  const divider = document.querySelector('.about-divider');

  const mouse = Mouse.create(container);
  container.removeEventListener('mousewheel', mouse.mousewheel);
  container.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness:0.2, damping:0.15, render:{ visible:false } }
  });

  function buildWalls(){
    const t = 60;
    return [
      Bodies.rectangle(W / 2, floorY + t / 2, W + t * 2, t, { isStatic:true }),
      Bodies.rectangle(-t / 2, floorY / 2, t, floorY + t * 2, { isStatic:true }),
      Bodies.rectangle(W + t / 2, floorY / 2, t, floorY + t * 2, { isStatic:true })
    ];
  }

  function measureFloorY(containerRect){
    if (!divider) return containerRect.height;
    const dRect = divider.getBoundingClientRect();
    return dRect.top - containerRect.top;
  }

  function init(){
    const rect = container.getBoundingClientRect();
    W = rect.width || W;
    H = rect.height || H;
    floorY = measureFloorY(rect) || H;

    World.clear(world, false);
    Engine.clear(engine);
    ceilingWall = null;
    if (ceilingTimer) clearTimeout(ceilingTimer);

    wallBodies = buildWalls();
    wallBodies.forEach(function(w){ World.add(world, w); });

    badges.forEach(function(b, i){
      const bw = b.el.offsetWidth;
      const bh = b.el.offsetHeight;
      b.w = bw; b.h = bh;
      const x = bw / 2 + 8 + Math.random() * Math.max(1, W - bw - 16);
      const y = -(80 + i * 45 + Math.random() * 100);
      const angle = (Math.random() * 16 - 8) * Math.PI / 180;
      const opts = { restitution:0.4, friction:0.3, frictionAir:0.02, angle: angle };
      const body = b.isCircle
        ? Bodies.circle(x, y, Math.max(bw, bh) / 2, opts)
        : Bodies.rectangle(x, y, bw, bh, Object.assign({ chamfer:{ radius: bh / 2 } }, opts));
      b.body = body;
      World.add(world, body);
    });

    World.add(world, mouseConstraint);

    ceilingTimer = setTimeout(function(){
      const t = 60;
      ceilingWall = Bodies.rectangle(W / 2, -t / 2, W + t * 2, t, { isStatic:true });
      World.add(world, ceilingWall);
    }, 2500);
  }

  let started = false;
  function start(){
    if (started) return;
    started = true;
    init();
  }

  if ('IntersectionObserver' in window){
    const observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          start();
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(container);
  } else {
    start();
  }

  window.addEventListener('resize', function(){
    if (started) init();
  });

  function findBadge(body){
    for (let i = 0; i < badges.length; i++){
      if (badges[i].body === body) return badges[i];
    }
    return null;
  }

  Events.on(mouseConstraint, 'startdrag', function(e){
    const b = findBadge(e.body);
    if (b) b.el.classList.add('is-dragging');
  });
  Events.on(mouseConstraint, 'enddrag', function(e){
    const b = findBadge(e.body);
    if (!b) return;
    b.el.classList.remove('is-dragging');
    const v = e.body.velocity;
    Matter.Body.setAngularVelocity(e.body, v.x * 0.06);
  });

  const runner = Runner.create();
  // only simulate physics while the tag cloud is on screen
  let simRunning = false;
  const simObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && !simRunning){
        Runner.run(runner, engine);
        simRunning = true;
      } else if (!entry.isIntersecting && simRunning){
        Runner.stop(runner);
        simRunning = false;
      }
    });
  }, { threshold: 0 });
  simObserver.observe(container);

  function render(){
    badges.forEach(function(b){
      if (!b.body) return;
      const p = b.body.position;
      const deg = b.body.angle * 180 / Math.PI;
      const scale = b.el.classList.contains('is-dragging') ? 1.08 : 1;
      b.el.style.transform =
        'translate(' + (p.x - b.w / 2).toFixed(1) + 'px, ' + (p.y - b.h / 2).toFixed(1) + 'px) ' +
        'rotate(' + deg.toFixed(2) + 'deg) scale(' + scale + ')';
    });
  }
  Events.on(engine, 'afterUpdate', render);
})();

(function(){
  // ===== Eyes Follow Cursor =====
  // Pupils track the mouse with eased, ellipse-constrained motion and return to
  // the exact eye center when the cursor is over it.
  const PUPIL_RANGE = 1.0; // customizable radius: 0 = no movement, 1 = max in-eye travel
  const PUPIL_INSET = 15;  // px kept between the pupil and the eye edge (keeps it inside)
  const EASE = 0.25;       // tracking smoothness: lower = smoother/laggier

  const eyesBox = document.getElementById('cartoonEyes');
  if (!eyesBox) return;
  const eyes = Array.from(eyesBox.querySelectorAll('.eye'));
  const pupils = eyes.map(function(eye){ return eye.querySelector('.pupil'); });
  const curX = eyes.map(function(){ return 0; });
  const curY = eyes.map(function(){ return 0; });

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  window.addEventListener('mousemove', function(e){
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // cache eye geometry; recompute only when layout can actually change
  const geo = eyes.map(function(){ return { cx:0, cy:0, maxX:1, maxY:1 }; });
  function measure(){
    eyes.forEach(function(eye, i){
      const rect = eye.getBoundingClientRect();
      geo[i].cx = rect.left + rect.width / 2;
      geo[i].cy = rect.top + rect.height / 2;
      geo[i].maxX = Math.max(0, rect.width / 2 - PUPIL_INSET) * PUPIL_RANGE;
      geo[i].maxY = Math.max(0, rect.height / 2 - PUPIL_INSET) * PUPIL_RANGE;
    });
  }
  measure();
  window.addEventListener('scroll', measure, { passive:true });
  window.addEventListener('resize', measure);

  let rafId = null;
  function loop(){
    eyes.forEach(function(eye, i){
      const g = geo[i];
      const dx = mouseX - g.cx;
      const dy = mouseY - g.cy;
      const ellipseDist = (dx * dx) / (g.maxX * g.maxX) + (dy * dy) / (g.maxY * g.maxY);
      let tx = dx, ty = dy;
      if (ellipseDist > 1){
        const scale = 1 / Math.sqrt(ellipseDist);
        tx = dx * scale;
        ty = dy * scale;
      }
      curX[i] += (tx - curX[i]) * EASE;
      curY[i] += (ty - curY[i]) * EASE;
      pupils[i].style.transform =
        'translate(-50%, -50%) translate(' + curX[i].toFixed(1) + 'px, ' + curY[i].toFixed(1) + 'px)';
    });
    rafId = requestAnimationFrame(loop);
  }

  // only animate while the eyes are on screen
  const io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && rafId === null){
        measure();
        rafId = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && rafId !== null){
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  }, { threshold: 0 });
  io.observe(eyesBox);

  function scheduleBlink(){
    const delay = 2000 + Math.random() * 4000;
    setTimeout(function(){
      eyes.forEach(function(eye){ eye.classList.add('is-blinking'); });
      setTimeout(function(){
        eyes.forEach(function(eye){ eye.classList.remove('is-blinking'); });
      }, 140);
      scheduleBlink();
    }, delay);
  }
  scheduleBlink();
})();


/* Work list previews (ui-ux.html only): hovering a row shows that piece's
   logo, centred on the page, via the matching data-preview / data-name pair. */
(function(){
  const rows = document.querySelectorAll('.work-row[data-preview]');
  if (!rows.length) return;
  rows.forEach(function(row){
    const img = document.querySelector('.work-preview-img[data-name="' + row.getAttribute('data-preview') + '"]');
    if (!img) return;
    row.addEventListener('mouseenter', function(){ img.classList.add('is-active'); });
    row.addEventListener('mouseleave', function(){ img.classList.remove('is-active'); });
  });
})();

/* Work list scramble (ui-ux.html only) — same glyph set/steps/tick as the home
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
    const meta = row.querySelector('.work-meta');
    row.addEventListener('mouseenter', function(){
      scramble(name);
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
