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
      const loader = document.getElementById('loader');
      const countEl = document.getElementById('loaderCount');
      const fillEl = document.getElementById('loaderFill');
      if (!loader) return;

      // Came in through the page transition (back button, logo, any internal
      // link) — skip the preloader and the grid build entirely and hand the page
      // over already settled, so the two lines pulling apart are the only thing
      // that plays. The grid is drawn at rest, which is exactly where the wipe's
      // lines land, so they hand off to .hl-1 / .hl-4 without a seam.
      if (document.documentElement.classList.contains('pt-open')){
        loader.style.display = 'none';
        document.body.classList.remove('is-loading');
        document.body.classList.add('loaded');
        return;
      }

      // ===== Loader outro =====
      // The count lands on 100 and then comes apart instead of cutting: each
      // character takes its turn cycling through glyphs while fading on its own
      // clock, so the number dissolves left to right rather than all at once.
      // The percent mark goes last, once the final digit has started. The loader
      // bar is deliberately left alone — it has to stay exactly where it is to
      // become the grid's first line.
      const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/=+*#%';
      const OUTRO_HOLD = 200;      // let 100 actually land before it comes apart
      const OUTRO_TICK = 40;       // glyph cycle rate, matching the home-text scramble
      const OUTRO_STEPS = 10;      // ticks each character spends dissolving
      const OUTRO_STAGGER = 3;     // ticks between one character starting and the next
      const OUTRO_MS = OUTRO_HOLD + ((3 - 1) * OUTRO_STAGGER + OUTRO_STEPS) * OUTRO_TICK;  // "100" is three characters

      const pctEl = loader.querySelector('.loader-pct');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const PreloaderDelay = 5000 + OUTRO_MS;   // total ms scroll stays locked until the grid build + reveal finish
      const countDuration = 1900;    // counter run time
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);

      // Splits the settled count into per-character spans and dissolves them in
      // sequence, then hands over to the grid build.
      function dissolveCount(done){
        if (!countEl || reduce){
          if (pctEl) pctEl.style.opacity = '0';
          setTimeout(done, reduce ? 0 : OUTRO_MS);
          return;
        }
        const spans = countEl.textContent.split('').map(function(c){
          const s = document.createElement('span');
          s.className = 'loader-char';
          s.textContent = c;
          return s;
        });
        countEl.textContent = '';
        spans.forEach(function(s){ countEl.appendChild(s); });

        const lastStart = (spans.length - 1) * OUTRO_STAGGER;
        const totalSteps = lastStart + OUTRO_STEPS;
        let step = 0;
        setTimeout(function(){
          const id = setInterval(function(){
            step++;
            for (let i = 0; i < spans.length; i++){
              const local = step - i * OUTRO_STAGGER;   // this character's own progress
              if (local <= 0) continue;                 // not its turn yet — still reads as the real digit
              if (local >= OUTRO_STEPS){ spans[i].style.opacity = '0'; continue; }
              spans[i].textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
              spans[i].style.opacity = (1 - local / OUTRO_STEPS).toFixed(3);
            }
            if (pctEl){
              const pl = step - lastStart;              // trails the final digit
              if (pl > 0) pctEl.style.opacity = (0.5 * Math.max(0, 1 - pl / OUTRO_STEPS)).toFixed(3);
            }
            if (step >= totalSteps){
              clearInterval(id);
              done();
            }
          }, OUTRO_TICK);
        }, OUTRO_HOLD);
      }

      function frame(now){
        const t = Math.min((now - start) / countDuration, 1);
        const p = ease(t);
        if (countEl) countEl.textContent = Math.round(p * 100);
        if (fillEl) fillEl.style.width = (p * 100) + '%';
        if (t < 1){
          requestAnimationFrame(frame);
        } else {
          dissolveCount(buildGrid);
        }
      }

      function buildGrid(){
          loader.style.display = 'none';              // hide instantly (no fade) — the loader bar connects straight into the spinning line
          document.body.classList.add('grid-build');  // hide the real grid; JS spins the line then flies it out
          const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)', DUR = 2000, HOLD = 300;
          const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
          const INK = '#17181C';           // starts black, settles to the grid's grey

          const FLY = { duration:DUR, delay:HOLD, easing:EASE, fill:'both' };
          // 1) the loader bar stays as a single horizontal line at center for HOLD ms,
          //    2) then it splits to its rows — one continuous move, never hidden.
          document.querySelectorAll('.home-lines .hlh').forEach(function(l){
            const dy = cy - parseFloat(getComputedStyle(l).top);
            const spinner = l.classList.contains('hlh-1');   // one line is the held loader bar...
            const frames = spinner
              ? [ { transform:`translateY(${dy - 1.5}px)`, opacity:1, backgroundColor:INK, height:'3px' },   // centered on the midline, exactly matching the loader bar (no jump)
                  { transform:'translateY(0px)', opacity:1, backgroundColor:'#dfe2e5', height:'1px' } ]      // shrinks to a grid line
              : [ { transform:`translateY(${dy}px)`, opacity:0, backgroundColor:INK },   // ...the other emerges at center
                  { opacity:1, offset:0.08 },
                  { transform:'translateY(0px)', opacity:1, backgroundColor:'#dfe2e5' } ];
            l.animate(frames, FLY);
          });
          // vertical lines fly out from center-x to their columns (appear as they go)
          document.querySelectorAll('.home-lines .hl').forEach(function(l){
            const dx = cx - parseFloat(getComputedStyle(l).left);
            l.animate([
              { transform:`translateX(${dx}px)`, opacity:0, backgroundColor:INK },
              { opacity:1, offset:0.05 },
              { transform:'translateX(0px)', opacity:1, backgroundColor:'#dfe2e5' }
            ], FLY);
          });
          // plus marks start stacked at screen center, then fly out to their intersections
          document.querySelectorAll('.home-lines .plus:not(.plus-c)').forEach(function(p){
            const L = parseFloat(p.style.left) || 50;
            const T = parseFloat(p.style.top) || 50;
            const dx = ((50 - L) / 100) * window.innerWidth;   // px from its spot back to center
            const dy = ((50 - T) / 100) * window.innerHeight;
            p.animate([
              { transform:`translate(calc(-50% + 0.5px + ${dx}px), calc(-50% + 0.5px + ${dy}px))`, opacity:0, color:INK },
              { opacity:1, offset:0.05 },
              { transform:'translate(calc(-50% + 0.5px), calc(-50% + 0.5px))', opacity:1, color:'#b3b9bf' }
            ], FLY);
          });
          const BUILD_DURATION = HOLD + DUR + 100;  // hold + fly-out, then reveal the content
          setTimeout(function(){
            document.body.classList.add('loaded');       // reveal the blurbs / letters
            if (window.__homeScramble) window.__homeScramble();   // scramble-in the home text
          }, BUILD_DURATION);
      }
      requestAnimationFrame(frame);

      const scrollY = window.scrollY || 0;
      function lockScroll(){ window.scrollTo(0, scrollY); }
      window.addEventListener('scroll', lockScroll, { passive:true });
      setTimeout(function(){
        window.removeEventListener('scroll', lockScroll);
        document.body.classList.remove('is-loading');
        loader.style.display = 'none';
      }, PreloaderDelay);
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

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      if (!scroller) return;

      const threshold = 20;

      function updateScale(){
        scroller.classList.toggle('is-scrolled', scroller.scrollLeft > threshold);
      }

      scroller.addEventListener('scroll', updateScale, { passive:true });
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      scroller.scrollLeft = 0;
      updateScale();
    })();

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const progress = document.getElementById('contactProgress');
      const boxes = document.querySelectorAll('.contact-box');
      if (!scroller || !progress || !boxes.length) return;

      boxes.forEach(() => {
        const tick = document.createElement('span');
        tick.className = 'tick';
        progress.appendChild(tick);
      });
      const ticks = progress.querySelectorAll('.tick');

      let ticking = false;
      function updateActive(){
        const center = scroller.scrollLeft + scroller.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        boxes.forEach((box, i) => {
          const boxCenter = box.offsetLeft + box.offsetWidth / 2;
          const dist = Math.abs(boxCenter - center);
          if (dist < closestDist){
            closestDist = dist;
            closest = i;
          }
        });
        ticks.forEach((tick, i) => tick.classList.toggle('active', i === closest));
        ticking = false;
      }

      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(updateActive); ticking = true; }
      }, { passive:true });
      window.addEventListener('resize', updateActive);
      updateActive();
    })();

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const xBox = document.querySelector('.contact-box[data-label="X"]');
      const glyph = document.querySelector('.x-glyph');
      if (!scroller || !xBox || !glyph) return;

      const originalSize = 9;
      // 15rem, not 22: the glyph no longer stretches the box, so at 22 its ink
      // ran the full height of the shrunken box and touched both edges. This
      // leaves it breathing room at the top of the scale.
      const bigSize = 15;

      function update(){
        const viewCenter = scroller.scrollLeft + scroller.clientWidth / 2;
        const boxCenter = xBox.offsetLeft + xBox.offsetWidth / 2;
        const windowDist = xBox.offsetWidth + 24;
        const progress = Math.min(Math.abs(boxCenter - viewCenter) / windowDist, 1);
        const size = originalSize + progress * (bigSize - originalSize);
        glyph.style.fontSize = size.toFixed(2) + 'rem';
      }

      let ticking = false;
      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
      }, { passive:true });
      trackBoxResize(scroller, update);
      window.addEventListener('resize', update);
      update();
    })();

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const liBox = document.querySelector('.contact-box[data-label="LinkedIn"]');
      const letterI = document.querySelector('.li-i');
      const letterN = document.querySelector('.li-n');
      if (!scroller || !liBox || !letterI || !letterN) return;

      function update(){
        const viewCenter = scroller.scrollLeft + scroller.clientWidth / 2;
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
        const offset = progress * maxOffset;
        letterI.style.transform = `translateX(${(-offset).toFixed(2)}px)`;
        letterN.style.transform = `translateX(${offset.toFixed(2)}px)`;
      }

      let ticking = false;
      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
      }, { passive:true });
      trackBoxResize(scroller, update);
      window.addEventListener('resize', update);
      update();
    })();

    // Runs fn every frame while the boxes are mid-resize. They grow or shrink over
    // 0.4s when .is-scrolled flips, but the scroll-driven effects only fire on
    // scroll — so if the swipe has already stopped (which is exactly what happens
    // when you come to rest back on the info box) nothing recomputed until the
    // transition ended, and the artwork snapped into place instead of following.
    function trackBoxResize(scroller, fn){
      let until = 0, running = false;
      function loop(now){
        fn();
        if (now < until) requestAnimationFrame(loop);
        else running = false;
      }
      scroller.addEventListener('transitionstart', function(e){
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

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const emailBox = document.querySelector('.contact-box[data-label="Email"]');
      const glyph = document.querySelector('.email-glyph');
      if (!scroller || !emailBox || !glyph) return;

      function update(){
        // Measured from viewport rects, not offsetLeft: .contact-boxes is not
        // positioned, so a box's offsetLeft resolves against .contact and does
        // not share an origin with scrollLeft. Mixing the two put the zero point
        // outside the box's travel, so progress sat clamped and the word never
        // swept through centre.
        const boxRect = emailBox.getBoundingClientRect();
        const scRect = scroller.getBoundingClientRect();
        const signedDist = (boxRect.left + boxRect.width / 2) - (scRect.left + scRect.width / 2);
        // Denominator is the box's full-size width, not its live one. The boxes
        // shrink over 0.4s the moment scrolling starts, and dividing by a width
        // that is mid-transition made progress lurch through that window — the
        // jump you see in the word while the info circle is resizing.
        const windowDist = refBoxWidth() + 24;
        const progress = Math.max(-1, Math.min(1, signedDist / windowDist));

        // The word slides right out of the box, .email-clip trimming it at the
        // edges, so only VISIBLE_CHARS of it remain at either extreme: IL when
        // the box is still to the right, EM once it has passed to the left.
        const TOTAL_CHARS = 5, VISIBLE_CHARS = 2;
        const glyphWidth = glyph.offsetWidth;
        const hideWidth = glyphWidth * (1 - VISIBLE_CHARS / TOTAL_CHARS);
        const sideGap = (emailBox.clientWidth - glyphWidth) / 2;

        const translateX = -progress * (hideWidth + sideGap);
        glyph.style.transform = `translateX(${translateX.toFixed(2)}px)`;
      }

      let ticking = false;
      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
      }, { passive:true });
      trackBoxResize(scroller, update);
      window.addEventListener('resize', update);
      update();
    })();

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const infoBox = document.querySelector('.contact-info');
      const circle = document.querySelector('.info-circle');
      if (!scroller || !infoBox || !circle) return;

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

      function update(){
        const boxWidth = infoBox.offsetWidth;
        const gapPx = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap) || 24;
        // full-size width, not the live one — see the note in the email effect:
        // a denominator that shrinks mid-swipe makes the circle jump
        const maxDist = refBoxWidth() + gapPx;
        const progress = Math.min(Math.max(scroller.scrollLeft / maxDist, 0), 1);

        const diameter = maxDiameter - progress * (maxDiameter - minDiameter);
        const radius = diameter / 2;
        const startLeft = -radius;
        const endLeft = boxWidth - diameter;
        const left = startLeft + progress * (endLeft - startLeft);
        circle.style.width = diameter + 'px';
        circle.style.height = diameter + 'px';
        circle.style.left = left + 'px';

        const circleRect = circle.getBoundingClientRect();
        const cx = circleRect.left + circleRect.width / 2;
        const cy = circleRect.top + circleRect.height / 2;
        const rad = circleRect.width / 2;
        chars.forEach(span => {
          const r = span.getBoundingClientRect();
          const px = r.left + r.width / 2;
          const py = r.top + r.height / 2;
          const inside = Math.hypot(px - cx, py - cy) <= rad;
          span.classList.toggle('on-circle', inside);
        });
      }

      // only recompute when the boxes actually move (was a perpetual rAF that
      // read layout on every character every frame — very costly on Windows)
      let ticking = false;
      function requestUpdate(){
        if (!ticking){
          ticking = true;
          // try/finally so a throw can never leave `ticking` stuck (which would
          // freeze the letter-reveal mid-sweep, leaving stale white letters)
          requestAnimationFrame(function(){ try { update(); } finally { ticking = false; } });
        }
      }
      // when scrolling fully settles, force one authoritative pass so the final
      // resting state is always correct (no letters left white after swiping back)
      let settleTimer;
      function onScroll(){
        requestUpdate();
        clearTimeout(settleTimer);
        settleTimer = setTimeout(update, 120); // fallback for browsers without scrollend
      }
      scroller.addEventListener('scroll', onScroll, { passive:true });
      scroller.addEventListener('scrollend', update);
      window.addEventListener('resize', requestUpdate);
      // the circle is positioned against the info box's live width, so it has to
      // keep up while that box resizes — otherwise it holds still through the
      // 0.4s grow-back and then jumps
      trackBoxResize(scroller, update);
      requestUpdate();
    })();

    // ===== Contact boxes intro =====
    // One dot -> it comes apart into a column of eight, and on the way apart each
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
      const GAP   = 40;     // pitch down the column, leaving ~13px between them
      // Nothing snaps and nothing overshoots. Every move eases in and out of rest,
      // and the holds between them are long enough to read as breath rather than
      // as beats — the whole thing is one slow exhale instead of a series of hits.
      const FADE  = 420;    // the dot surfaces out of nothing
      const HOLD  = 380;    // and sits alone
      const SPLIT = 1780;   // comes apart, squares off and colours up, all as one
      const PAUSE = 440;    // the resolved column rests
      const OPEN  = 1760;   // column -> row, zooming the rest of the way
      const TOTAL = FADE + HOLD + SPLIT + PAUSE + OPEN;

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

      function render(t){
        if (done) return;             // a late frame must not re-apply what finish() cleared
        const s0 = FADE + HOLD;
        const o0 = s0 + SPLIT + PAUSE;
        const fade  = Math.min(t / FADE, 1);
        const split = t > s0 ? Math.min((t - s0) / SPLIT, 1) : 0;
        const open  = t > o0 ? Math.min((t - o0) / OPEN, 1) : 0;
        // one progress drives the whole coming-apart: the spacing, the dot
        // squaring off into a rectangle, and the ink lifting off it
        const es = easeInOutSine(split);
        const eo = easeInOutQuart(open);
        // the column closes up a little ahead of the row spreading out — enough
        // to read as a turn, gentle enough not to look like two separate moves
        const ey = 1 - easeInOutSine(Math.min(open * 1.2, 1));

        // the dot does not simply appear; it surfaces
        scroller.style.setProperty('--intro-alpha', easeInOutSine(fade).toFixed(3));
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
          const x = -(1 - eo) * n.x;
          // No -n.y term. The boxes all share a centre line already, so the only
          // thing it contributed was the offset between the row's border-box
          // centre (which n is measured from) and its content-box centre — the
          // row's padding is 2.25rem top against 0.5rem bottom, so that gap is
          // ~14px, and the whole column was sitting that far above the boxes.
          const y = es * GAP * k * ey;
          // dot is square, so its two scales differ; the thumbnail is uniform, so
          // the box takes its true proportions back as it grows
          const thumb = THUMB / n.w;
          const sxT = (DOT / n.w) + (thumb - DOT / n.w) * es;
          const syT = (DOT / n.h) + (thumb - DOT / n.h) * es;
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

      // if we arrived through the page transition the wipe still covers the page
      // for the best part of a second — no sense playing the intro behind it
      const delay = document.documentElement.classList.contains('pt-open') ? 620 : 0;
      setTimeout(function(){
        const start = performance.now();
        (function step(now){
          const t = Math.min(now - start, TOTAL);
          render(t);
          if (t < TOTAL) requestAnimationFrame(step); else finish();
        })(start);
      }, delay);

      // The boxes are dot-sized and blank until the run completes, so never let
      // that state be the final one: if the frame loop stalls for any reason,
      // put the page into its normal state anyway.
      setTimeout(finish, delay + TOTAL + 900);
    })();

    // let users swipe the contact boxes in ANY direction (up/down or left/right)
    (function(){
      const scroller = document.querySelector('.contact-boxes');
      if (!scroller) return;

      function maxScroll(){
        return scroller.scrollWidth - scroller.clientWidth;
      }

      // snapping is off (scroll-snap-type:none) so the boxes rest exactly where
      // the user stops — no yanking to the nearest box after a swipe.

      // wheel handler on the whole window so a swipe ANYWHERE on the contact
      // page scrolls the boxes — driven by whichever axis the swipe favours.
      window.addEventListener('wheel', function(e){
        const max = maxScroll();
        if (max <= 0) return;
        let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (e.deltaMode === 1) d *= 16;                        // lines -> px
        else if (e.deltaMode === 2) d *= scroller.clientWidth;  // pages -> px
        if (d === 0) return;
        const atStart = scroller.scrollLeft <= 0;
        const atEnd = scroller.scrollLeft >= max - 1;
        // release to the page when there's no more room in that direction
        if ((d < 0 && atStart) || (d > 0 && atEnd)) return;
        scroller.scrollLeft += d;
        e.preventDefault();
      }, { passive:false });

      // touch: dominant axis of the swipe drives horizontal scroll (anywhere on the page)
      let startX = 0, startY = 0, startLeft = 0;
      window.addEventListener('touchstart', function(e){
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startLeft = scroller.scrollLeft;
      }, { passive:true });
      window.addEventListener('touchmove', function(e){
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        const move = Math.abs(dy) > Math.abs(dx) ? dy : dx;
        const max = maxScroll();
        const clamped = Math.max(0, Math.min(max, startLeft - move));
        scroller.scrollLeft = clamped;
        // keep the page still only while the boxes still have somewhere to go
        if (clamped > 0 && clamped < max) e.preventDefault();
      }, { passive:false });
    })();

    // ===== Page transition =====
    // Clicking an internal link pulls two lines inward until they meet, wiping
    // the page blank; the page you land on pushes them back out. Every page owns
    // where its own lines rest: the home page has a grid, so they sit on .hl-1 /
    // .hl-4 at 3% / 97% (the .pt-grid variant); every other page has nothing to
    // rest on, so they sit on the page edges. That means a trip out of home
    // starts on the grid and ends at the edges, and the trip back does the
    // reverse — each half anchored to whichever page is on screen for it.
    // The wipe is ::before/::after on <html> (see style.css) and the reopen is a
    // plain CSS animation, so this only has to close it and follow the link.
    (function(){
      const KEY = 'pageTransition';
      const CLOSE = 780, OPEN = 900;      // must match the pt-close-* / pt-open-* durations in style.css
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const html = document.documentElement;

      // animationend bubbles, so the loader and .reveal animations reach <html>
      // too — only the cover's own pseudo-elements count
      function onCoverEnd(fn){
        const h = function(e){
          if (e.target !== html || !e.pseudoElement) return;
          html.removeEventListener('animationend', h);
          fn();
        };
        html.addEventListener('animationend', h);
      }

      // ---- arriving: the inline head script already put the cover up ----
      if (html.classList.contains('pt-open')){
        const done = function(){ html.classList.remove('pt', 'pt-open', 'pt-grid'); };
        onCoverEnd(done);
        setTimeout(done, OPEN + 400);      // safety net if animationend never fires
      }

      // ---- leaving: close the cover, then navigate ----
      if (reduce) return;

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

      let leaving = false;
      document.addEventListener('click', function(e){
        if (leaving) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const link = e.target.closest && e.target.closest('a[href]');
        if (!isInternal(link)) return;

        e.preventDefault();
        leaving = true;

        // anchor to the grid only if this page actually has one to anchor to;
        // the page we are heading for makes the same call for itself in its head
        html.classList.add('pt', 'pt-close');
        if (document.querySelector('.home-lines')) html.classList.add('pt-grid');
        try { sessionStorage.setItem(KEY, '1'); } catch(_){}   // tells the next page to open

        let gone = false;
        const go = function(){ if (gone) return; gone = true; window.location.href = link.href; };
        onCoverEnd(go);
        setTimeout(go, CLOSE + 200);       // safety net if animationend never fires
      });

      // the back button can restore a page from bfcache mid-transition — clear the
      // cover so it isn't left sitting closed over the page
      window.addEventListener('pageshow', function(e){
        if (!e.persisted) return;
        leaving = false;
        html.classList.remove('pt', 'pt-close', 'pt-open', 'pt-grid');
      });
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

/* Hover scramble on the underlined phrases in the home blurbs — same
   decode animation as the multilingual name, but resolves back to the
   identical text (scramble only, no word change). */
(function(){
  const els = document.querySelectorAll('.home-blurb u');
  if (!els.length) return;
  const GLYPHS = '01<>[]{}/\\|=+*-#%&$ABCDEFGHKMNXZ';
  const STEPS = 14;
  const TICK_MS = 40;

  els.forEach(function(el){
    const original = el.textContent;
    el.addEventListener('mouseenter', function(){
      if (el._animating) return;   // don't restart mid-animation (prevents glitch)
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
          if (i < revealed || c === ' ' || c === '/'){
            out += c;
          } else {
            out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        el.textContent = out;
        if (step >= STEPS){
          clearInterval(el._scr);
          el.textContent = original;
          el._animating = false;
        }
      }, TICK_MS);
    });
  });
})();

/* On first entry to the home page, scramble-decode the paragraph text. */
(function(){
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/=+*#%';

  function scramble(el){
    // walk text nodes so <u>/<sup> markup is preserved; treat as one stream
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) if (n.nodeValue.length) nodes.push({ node:n, text:n.nodeValue });
    const total = nodes.reduce((a,b) => a + b.text.length, 0);
    if (!total) return;

    const STEPS = Math.min(46, Math.max(16, Math.round(total / 7)));
    let step = 0;
    clearInterval(el._enterScr);
    el._enterScr = setInterval(function(){
      step++;
      const revealed = Math.floor(total * step / STEPS);
      let idx = 0;
      for (const it of nodes){
        let out = '';
        for (let i = 0; i < it.text.length; i++){
          const c = it.text[i];
          if (idx < revealed || c === ' ' || c === '\n'){ out += c; }
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          idx++;
        }
        it.node.nodeValue = out;
      }
      if (step >= STEPS){
        clearInterval(el._enterScr);
        for (const it of nodes) it.node.nodeValue = it.text;   // restore exact text
      }
    }, 40);
  }

  // exposed so the loader can fire it right as the home page reveals
  window.__homeScramble = function(){
    document.querySelectorAll('.home-blurb .blurb-text').forEach(scramble);
  };
})();

/* ===== Measure scale =====
   A ruler across the page: a short tick at every step and a long numbered one
   every fifth, 30 numbers in all. Built here rather than written out as 150
   spans of markup — the page only has to supply the empty container. */
(function(){
  const scale = document.getElementById('scale');
  if (!scale) return;

  const MAJORS = 30;   // numbered ticks
  const STEP = 5;      // ticks per number, so every 5th one is long and labelled

  const frag = document.createDocumentFragment();
  for (let i = 0; i < MAJORS * STEP; i++){
    const tick = document.createElement('span');
    tick.className = 'scale-tick';
    if (i % STEP === 0){
      tick.classList.add('is-major');
      const num = document.createElement('span');
      num.className = 'scale-num';
      num.textContent = i / STEP + 1;
      tick.appendChild(num);
    }
    frag.appendChild(tick);
  }
  scale.appendChild(frag);
})();
