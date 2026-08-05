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
          // Both rows run the identical keyframes, so the bar reads as splitting
          // evenly in two. They previously differed: the top one WAS the loader
          // bar, 2.5px and thinning to 1px, while the bottom merely faded in at
          // 1px — which showed as a heavier top line all the way through the
          // split. Starting both as a 3px ink bar on the midline means they
          // overlap the loader bar exactly at rest, so the substitution is still
          // invisible; there are simply two of them now instead of one.
          document.querySelectorAll('.home-lines .hlh').forEach(function(l){
            const dy = cy - parseFloat(getComputedStyle(l).top);
            l.animate([
              // centered on the midline, exactly matching the 2.5px loader bar (no
              // jump) — the offset is half the height, so the two stay in step
              { transform:`translateY(${dy - 1.25}px)`, opacity:1, backgroundColor:INK, height:'2.5px' },
              // Sheds most of its weight in the first fifth of the move. It has
              // to leave at the bar's full 2.5px or the handoff would step, but
              // carrying that all the way out read as a heavy pair of rules
              // sliding apart; dropping it early means only the bar itself is
              // thick, and what travels is already close to a grid line.
              { height:'1.15px', offset:0.2 },
              { transform:'translateY(0px)', opacity:1, backgroundColor:'#dfe2e5', height:'1px' }
            ], FLY);
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
      const MARGIN = 16;    // px kept clear inside each rule, so it never touches
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
      // must match the pt-close-* / pt-open-* durations in style.css, which the
      // jewelry page overrides via .pt-jw — these are only the safety nets that
      // fire if animationend never does, so they have to track whichever set of
      // durations this document is actually running
      const jw = document.documentElement.classList.contains('pt-jw');
      const CLOSE = jw ? 1120 : 780, OPEN = jw ? 360 : 900;
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

        // Anchor the closing lines to the grid only on the home page, whose hero
        // grid is a plain .home-lines. Every other page carries .page-lines — a
        // copy of the grid drawn over its content — and there the lines pull in
        // from the page edges instead, which is where the opening wipe left them
        // on the way in. Matching any .home-lines started them on 3% / 97%, so
        // leaving one of those pages the lines appeared inset rather than
        // sweeping in from the ends.
        html.classList.add('pt', 'pt-close');
        if (!jw && document.querySelector('.home-lines')) html.classList.add('pt-grid');
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
   every STEP, 30 numbers in all. Built here rather than written out as several
   hundred spans of markup — the page only has to supply the empty container. */
(function(){
  const scale = document.getElementById('scale');
  if (!scale) return;

  const MAJORS = 30;   // numbered ticks
  const STEP = 45;     // ticks per number, so every 45th one is long and labelled
  // One number to the next spans a single grid column. The columns are not equal
  // — 30% / 34% / 30% — and this takes the wider middle one, 33% -> 67%, so 34vw.
  // The ticks in between divide that run evenly: raise or lower STEP alone to
  // change how finely it is divided, and the 34vw between numbers stays put.
  const SPAN = 34;
  const GAP = SPAN / STEP;
  // Half a viewport of empty track at each end, so the run can be scrolled until
  // the 1 sits on the centre line and again until the 30 does. Without it the
  // first and last ticks could only ever reach the left and right edges.
  const PAD = 50;      // vw

  // Stops on the last numbered tick: 29 full runs plus the 30 itself, so the
  // ruler ends on a number rather than trailing minor ticks past it.
  const total = (MAJORS - 1) * STEP + 1;
  const track = document.createElement('div');
  track.className = 'scale-track';
  track.style.width = (PAD * 2 + (total - 1) * GAP) + 'vw';

  const majors = [];
  const ticks = [];
  for (let i = 0; i < total; i++){
    const tick = document.createElement('span');
    ticks.push(tick);
    tick.className = 'scale-tick';
    tick.style.left = (PAD + i * GAP) + 'vw';
    if (i % STEP === 0){
      tick.classList.add('is-major');
      const num = document.createElement('span');
      num.className = 'scale-num';
      // Brackets are always in the layout at opacity 0 and only fade in, so the
      // number never shifts as it takes them — same trick as the CLOSE button.
      const lb = document.createElement('span');
      lb.className = 'num-bracket';
      lb.textContent = '[';
      const rb = document.createElement('span');
      rb.className = 'num-bracket';
      rb.textContent = ']';
      num.appendChild(lb);
      num.appendChild(document.createTextNode(i / STEP + 1));
      num.appendChild(rb);
      tick.appendChild(num);
      majors.push(tick);
    }
    track.appendChild(tick);
  }
  scale.appendChild(track);

  // Bracket the last number the centre line has gone past, and hold it there
  // until the next one arrives — floor, not round. Rounding would hand the
  // brackets over at the midpoint between two numbers, so [1] would drop before
  // 2 ever reached the line and there would be a stretch with the brackets on a
  // number that is not the one you last passed.
  //   The index comes straight out of scrollLeft rather than from measuring the
  // ticks, so it stays free no matter how many hundred are in the track: the
  // first major is PAD across, they repeat every SPAN, both in vw so a resize
  // carries them. The epsilon keeps the last number from falling to 29.999... on
  // a float and bracketing 29 at the very end of the run.
  let current = -1;
  function syncCurrent(){
    const vw = window.innerWidth / 100;
    const k = Math.max(0, Math.min(majors.length - 1,
      Math.floor((scale.scrollLeft + window.innerWidth / 2 - PAD * vw) / (SPAN * vw) + 1e-6)));
    if (k === current) return;
    if (current >= 0) majors[current].classList.remove('is-current');
    majors[k].classList.add('is-current');
    current = k;
  }

  // Ticks stand tallest on the centre line and ease back down to their base
  // height further out, and the arc travels with the line as you scroll.
  // Only minor ticks are scaled: the majors carry the numbers, and a transform
  // on a major would stretch its digits along with the tick.
  // Only the span within RADIUS is touched — about forty ticks of the thirteen
  // hundred — and the previous span is cleared, so a frame costs a fixed small
  // number of writes however long the ruler gets.
  // Ceiling is 3.04: the numbers sit 3.35rem above the baseline (a 2.8rem major
  // plus the 0.55rem gap) and a 1.1rem minor scaled past that would run into
  // them. Going higher than this means lifting the numbers and growing the band.
  const PEAK = 2.35;     // tallest multiplier, right on the line
  const RADIUS = 0.05;   // share of the viewport the arc reaches across

  let lo = 0, hi = -1;   // index span currently carrying a transform
  function syncArc(){
    const vw = window.innerWidth / 100;
    const first = PAD * vw, pitch = GAP * vw;
    const centre = scale.scrollLeft + window.innerWidth / 2;   // in track space
    const R = RADIUS * window.innerWidth;
    const nlo = Math.max(0, Math.ceil((centre - R - first) / pitch));
    const nhi = Math.min(total - 1, Math.floor((centre + R - first) / pitch));
    for (let i = lo; i <= hi; i++){
      if (i < nlo || i > nhi) ticks[i].style.transform = '';
    }
    for (let i = nlo; i <= nhi; i++){
      if (i % STEP === 0) continue;                            // leave the majors alone
      const d = Math.min(Math.abs(first + i * pitch - centre) / R, 1);
      const k = 1 + (PEAK - 1) * 0.5 * (1 + Math.cos(Math.PI * d));
      ticks[i].style.transform = 'scaleY(' + k.toFixed(3) + ')';
    }
    lo = nlo; hi = nhi;
  }

  // One box per gap between numbers — 29 of them — but loose inside its gap
  // rather than pinned to the midpoint, and free vertically instead of dropping
  // onto one of a few fixed lines. Positions come from a seeded generator, not
  // Math.random: the scatter looks arbitrary but is identical on every load, so
  // the page does not reshuffle itself when you navigate back to it.
  const field = document.getElementById('scaleField');
  const boxCx = [];        // each box's centre, in vw of track space
  const boxPaths = [];     // the filled path that draws each box
  const SVGNS = 'http://www.w3.org/2000/svg';
  const FLAT = 'M0,0 L100,0 L100,100 L0,100 Z';   // the box at rest
  // The wave has to read as one surface breathing, not as a row of louvres, so
  // the slices are many and the motion small: at these values neighbours never
  // part far enough to show paper through the overlap. Depth does the work —
  // under the perspective it scales each slice slightly, which bends the
  // silhouette smoothly — and the tilt is only a hint to catch the turn.
  const SAMPLES = 120;       // points the curve is drawn through, across the box
  const WAVELENGTH = 0.8;    // one full cycle per this fraction of the box width
  const AMPLITUDE = 1;       // crest height, in viewBox units (100 = box height)
  // Near the left and right of the window the boxes sweep upward, as though the
  // whole run were wrapped round a cylinder and curling away at the ends.
  // Reaches a little past the grid's outermost verticals (.hl-1 at 3%, .hl-4 at
  // 97%) so the bend has begun by the time a box crosses the line, rather than
  // starting abruptly at it.
  const CURL_ZONE = 0.07;    // how far in from each edge the sweep reaches, as a share of the width
  const CURL = 14;           // how far the very edge lifts, in viewBox units
  const CURL_POW = 2.4;      // >1 keeps the middle flat and puts the bend at the ends
  let ftrack = null;
  if (field){
    ftrack = document.createElement('div');
    ftrack.className = 'scale-field-track';

    let seed = 20260804;
    const rnd = function(){
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    // Held off the very ends of the gap so two neighbours can never collide. The
    // closest they get is (1 - SPREAD) of a gap: 0.65 x 34vw = 309px against a
    // 28vh box, so 57px clear at the worst case on a 900px-tall window. Note the
    // box is sized off the viewport HEIGHT and the gap off its WIDTH, so a short
    // wide window has the most room and a tall narrow one the least — check this
    // clearance if either constant changes.
    const NEAR = 0.325, SPREAD = 0.35;
    // Vertically they only ever land on one of three lines (see the CSS). The
    // pick never repeats the previous one, so the run cannot stall into three or
    // four boxes at the same height, which would read as a deliberate row.
    const SPOTS = ['is-r1b', 'is-r2t', 'is-r2b'];
    let prev = -1;

    for (let k = 0; k < MAJORS - 1; k++){
      let s = Math.floor(rnd() * SPOTS.length);
      if (s === prev) s = (s + 1 + Math.floor(rnd() * (SPOTS.length - 1))) % SPOTS.length;
      prev = s;

      const box = document.createElement('span');
      box.className = 'scale-box ' + SPOTS[s];
      const cx = PAD + (k + NEAR + rnd() * SPREAD) * SPAN;   // centre, in vw
      box.style.left = cx + 'vw';
      boxCx.push(cx);

      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'scale-svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');   // stretch to the box
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', FLAT);
      svg.appendChild(path);
      box.appendChild(svg);
      boxPaths.push(path);

      ftrack.appendChild(box);
    }
    field.appendChild(ftrack);
  }

  // While the centre line is inside a box, a wave runs through it: each slice is
  // pushed in and out of depth on a phase delay, so the face ripples rather than
  // tilting as one plane. The envelope is sin(pi * t), t being how far the line
  // has crossed the box — so it swells from nothing at the leading edge, peaks
  // as the line reaches the middle, and has settled flat again by the far edge.
  // Only one box can be on the line at a time (they never overlap), so a frame
  // touches SLICES elements at most.
  // every box that currently carries a shaped path, so it can be flattened again
  // once it is off screen and out of both the wave and the curl
  let shaped = [];

  // How far this point of the window has curled away. Zero across the middle,
  // rising to CURL right at either edge.
  function curlAt(vx){
    const W = window.innerWidth;
    const zone = CURL_ZONE * W;
    const near = Math.max((zone - vx) / zone, (vx - (W - zone)) / zone);
    if (near <= 0) return 0;
    return CURL * Math.pow(Math.min(near, 1), CURL_POW);
  }

  // Top and bottom edges swell in step for the wave, so the box bulges where the
  // crest is rather than shearing. The curl works the other way round: the top
  // edge lifts while the bottom drops, so the box opens out as it nears the
  // window's edge instead of sliding upward as one piece. Moving both the same
  // way was only a translation — nothing actually bent.
  // Drawn through SAMPLES points: at 2px apart on a 250px box the straight run
  // between two of them is far under a pixel of the true curve, so the edge
  // reads as continuous.
  function boxD(left, width, t, env){
    let d = '';
    for (let i = 0; i <= SAMPLES; i++){
      const u = i / SAMPLES;
      const s = Math.sin(((u - t) / WAVELENGTH) * Math.PI * 2) * env;
      const c = curlAt(left + u * width);
      d += (i ? 'L' : 'M') + (u * 100).toFixed(2) + ',' + (-AMPLITUDE * s - c).toFixed(2) + ' ';
    }
    for (let i = SAMPLES; i >= 0; i--){
      const u = i / SAMPLES;
      const s = Math.sin(((u - t) / WAVELENGTH) * Math.PI * 2) * env;
      const c = curlAt(left + u * width);
      d += 'L' + (u * 100).toFixed(2) + ',' + (100 + AMPLITUDE * s + c).toFixed(2) + ' ';
    }
    return d + 'Z';
  }
  function syncWave(){
    if (!boxPaths.length) return;
    const vw = window.innerWidth / 100;
    const W = window.innerWidth, cx = W / 2;
    const width = 28 * (window.innerHeight / 100);   // a 28vh box, in px
    const half = width / 2;

    // only the boxes actually on screen can be bent, and there are never more
    // than a handful of those however long the run is
    const lo = Math.max(0, Math.floor((scale.scrollLeft / vw - PAD) / SPAN) - 1);
    const hi = Math.min(boxCx.length - 1, Math.ceil(((scale.scrollLeft + W) / vw - PAD) / SPAN) + 1);

    const next = [];
    for (let k = lo; k <= hi; k++){
      const centre = boxCx[k] * vw - scale.scrollLeft;
      const left = centre - half;
      if (left > W || left + width < 0) continue;

      // the wave only runs while the centre line is actually inside the box
      let t = 0, env = 0;
      if (Math.abs(centre - cx) < half){
        t = (cx - left) / width;
        env = Math.sin(Math.PI * t);
      }
      boxPaths[k].setAttribute('d', boxD(left, width, t, env));
      next.push(k);
    }

    for (let i = 0; i < shaped.length; i++){
      if (next.indexOf(shaped[i]) === -1) boxPaths[shaped[i]].setAttribute('d', FLAT);
    }
    shaped = next;
  }

  // The centre line reaches the foot of the ruler, but pulls up above the numbers
  // as one arrives on it, so it passes over a number rather than striking
  // through it — and extends again once the number has gone by. Driven off the
  // distance from the line to the nearest number, eased so there is no snap.
  const midLine = document.querySelector('.hl-mid');
  const CLEAR = 70;        // px from the line at which a number starts pushing it back
  const TICK_GAP = 8;      // px held between the line's foot and the tick below it
  function syncMidLine(){
    if (!midLine) return;
    const vw = window.innerWidth / 100;
    const first = PAD * vw, pitch = SPAN * vw;
    const centreTrack = scale.scrollLeft + window.innerWidth / 2;
    const idx = Math.max(0, Math.min(MAJORS - 1, Math.round((centreTrack - first) / pitch)));
    const d = Math.abs(first + idx * pitch - centreTrack);
    const near = Math.max(0, 1 - d / CLEAR);
    const ease = near * near * (3 - 2 * near);          // smoothstep
    // Resting foot sits a fixed gap above whichever tick is under the line, not
    // at the ruler's baseline — so as the arc lifts the ticks the line lifts with
    // them and the gap stays even, instead of the line cutting down through them.
    const ti = Math.max(0, Math.min(ticks.length - 1, Math.round((centreTrack - first) / (GAP * vw))));
    const long = ticks[ti].getBoundingClientRect().top - TICK_GAP;
    const short = scale.getBoundingClientRect().top - 4;   // just clear of the numbers
    midLine.style.height = (long - (long - short) * ease).toFixed(1) + 'px';
  }

  function sync(){
    syncCurrent();
    syncArc();
    syncMidLine();
    // the boxes do not scroll themselves — they are carried by the ruler
    if (ftrack) ftrack.style.transform = 'translateX(' + (-scale.scrollLeft) + 'px)';
    syncWave();
  }

  let ticking = false;
  scale.addEventListener('scroll', function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; sync(); });
  }, { passive:true });
  window.addEventListener('resize', sync);
  sync();

  // Let the ruler be driven from anywhere on the page, not just from the band
  // itself — the band is only ~3.6rem tall, so requiring the pointer to be over
  // it made the thing feel like it was hiding. Same approach as the contact
  // boxes: window-level listeners, whichever axis the gesture favours wins, and
  // control is handed back to the page once the run is exhausted.
  function maxScroll(){
    return scale.scrollWidth - scale.clientWidth;
  }

  window.addEventListener('wheel', function(e){
    const max = maxScroll();
    if (max <= 0) return;
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;                    // lines -> px
    else if (e.deltaMode === 2) d *= scale.clientWidth;  // pages -> px
    if (d === 0) return;
    const atStart = scale.scrollLeft <= 0;
    const atEnd = scale.scrollLeft >= max - 1;
    if ((d < 0 && atStart) || (d > 0 && atEnd)) return;
    scale.scrollLeft += d;
    e.preventDefault();
  }, { passive:false });

  let startX = 0, startY = 0, startLeft = 0;
  window.addEventListener('touchstart', function(e){
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startLeft = scale.scrollLeft;
  }, { passive:true });
  window.addEventListener('touchmove', function(e){
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    const move = Math.abs(dy) > Math.abs(dx) ? dy : dx;
    const max = maxScroll();
    const clamped = Math.max(0, Math.min(max, startLeft - move));
    scale.scrollLeft = clamped;
    // hold the page still only while the ruler still has somewhere to go
    if (clamped > 0 && clamped < max) e.preventDefault();
  }, { passive:false });

  // ===== Entrance =====
  // The ruler arrives already run out to 30 and rewinds to 1, fast at first and
  // easing right down as it arrives, so it settles onto the number instead of
  // stopping dead. Everything else — the brackets, the arc, the wave, the boxes
  // — is driven off scrollLeft, so it all plays through on its own as the run
  // goes by; this only has to move the scroll position.
  (function(){
    const REWIND = 4200;   // ms end to end
    // Exponential ease-out, so the two halves of the run read as clearly
    // different: it leaves at speed and has covered most of the ruler almost at
    // once, then spends the rest of the time easing the last stretch in. A
    // polynomial curve spreads the slowing out too evenly to feel like two
    // phases; this one is unmistakably fast, then slow.
    // Divided by its own value at x = 1 so it lands exactly on 1. Raw
    // 1 - 2^-kx never quite reaches it, which left the run to close the last
    // fraction in a single jump at the end — small at k = 10, but plainly
    // visible at the gentler curve used here.
    const DECAY = 8, SPAN1 = 1 - Math.pow(2, -DECAY);
    const easeOut = x => x >= 1 ? 1 : (1 - Math.pow(2, -DECAY * x)) / SPAN1;

    const max = maxScroll();
    if (max <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    scale.scrollLeft = max;      // set before the first paint, so 1 is never shown first
    sync();

    let cancelled = false;
    const stop = function(){ cancelled = true; };
    window.addEventListener('wheel', stop, { passive:true, once:true });
    window.addEventListener('touchstart', stop, { passive:true, once:true });

    // Straight onto the next frame — no wait. The wipe opens from the centre
    // outward, so the middle of the screen, which is exactly where the numbers
    // run, is uncovered almost at once; holding the run back until the
    // transition had finished just read as a stall before anything happened.
    let start = null;                            // null, not 0: a 0 timestamp would never latch
    requestAnimationFrame(function step(now){
      if (cancelled) return;                     // hand over the moment it is touched
      if (start === null) start = now;
      const t = Math.min((now - start) / REWIND, 1);
      scale.scrollLeft = max * (1 - easeOut(t));
      sync();
      if (t < 1) requestAnimationFrame(step);
    });
  })();
})();
