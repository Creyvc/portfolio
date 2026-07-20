    (function(){
      const pattern = [
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [0,1,0,0,0,1,0],
        [0,1,0,0,0,1,0],
        [0,0,1,0,1,0,0],
        [0,0,1,0,1,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0]
      ];
      const cols = 7, rows = 8;
      const logo = document.getElementById('vLogo');
      if (!logo) return;

      const centerCol = (cols - 1) / 2;
      const centerRow = (rows - 1) / 2;

      pattern.forEach((rowArr, r) => {
        rowArr.forEach((val, c) => {
          if (!val) return;
          const px = document.createElement('span');
          px.className = 'px';
          px.style.left = (c / cols * 100) + '%';
          px.style.top = (r / rows * 100) + '%';
          px.style.setProperty('--dx', (centerCol - c) * 100 + '%');
          px.style.setProperty('--dy', (centerRow - r) * 100 + '%');
          logo.appendChild(px);
        });
      });

      const label = document.createElement('span');
      label.className = 'menu-label';
      label.innerHTML = '<span>ME</span><span>NU</span>';
      logo.appendChild(label);

      const lines = document.createElement('span');
      lines.className = 'menu-lines';
      lines.innerHTML = '<span></span><span></span><span></span>';
      logo.appendChild(lines);
    })();

    (function(){
      const divider = document.getElementById('vDivider');
      const logo = document.getElementById('vLogo');
      const nameEl = document.getElementById('home-link');
      if (!divider || !logo || !nameEl) return;

      function positionDivider(){
        const logoRect = logo.getBoundingClientRect();
        const nameRect = nameEl.getBoundingClientRect();
        const x = (logoRect.right + nameRect.left) / 2;
        divider.style.left = x + 'px';
        divider.style.height = window.innerHeight + 'px';
      }
      positionDivider();
      window.addEventListener('resize', positionDivider);
      window.addEventListener('load', positionDivider);
      setTimeout(positionDivider, 300);
    })();

    (function(){
      const track = document.getElementById('scrollTrack');
      const thumb = document.getElementById('scrollThumb');
      if (!track || !thumb) return;

      function update(){
        const trackRect = track.getBoundingClientRect();
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        thumb.style.top = (Math.min(Math.max(progress, 0), 1) * trackRect.height) + 'px';
      }
      window.addEventListener('scroll', update, { passive:true });
      window.addEventListener('resize', update);
      update();
    })();

    (function(){
      const line = document.getElementById('hBottomLine');
      const header = document.querySelector('header');
      if (!line || !header) return;

      function positionLine(){
        const rect = header.getBoundingClientRect();
        line.style.top = rect.bottom + 'px';
      }
      positionLine();
      window.addEventListener('resize', positionLine);
      window.addEventListener('load', positionLine);
      setTimeout(positionLine, 300);
    })();

    (function(){
      const timeEl = document.getElementById('bkk-time');
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
      const duration = 80;

      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('loaded');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
      }, duration);
    })();

    (function(){
      const box = document.querySelector('.cursor-box');
      document.addEventListener('mousemove', (e) => {
        box.style.left = e.clientX + 'px';
        box.style.top = e.clientY + 'px';
      });

      document.querySelectorAll('a.project-box').forEach(link => {
        link.addEventListener('mouseenter', () => box.classList.add('is-viewing'));
        link.addEventListener('mouseleave', () => box.classList.remove('is-viewing'));
      });

      const vLogo = document.getElementById('vLogo');
      if (vLogo){
        vLogo.addEventListener('mouseenter', () => box.classList.add('is-menu'));
        vLogo.addEventListener('mouseleave', () => box.classList.remove('is-menu'));
      }
    })();

    (function(){
      const vLogo = document.getElementById('vLogo');
      const overlay = document.getElementById('menuOverlay');
      if (!vLogo || !overlay) return;

      vLogo.addEventListener('click', () => {
        overlay.classList.toggle('is-open');
        document.body.classList.toggle('menu-open', overlay.classList.contains('is-open'));
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay){
          overlay.classList.remove('is-open');
          document.body.classList.remove('menu-open');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape'){
          overlay.classList.remove('is-open');
          document.body.classList.remove('menu-open');
        }
      });

      function easeInOutCubic(t){
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function goToY(targetY){
        overlay.classList.remove('is-open');
        document.body.classList.remove('menu-open');

        const startY = window.scrollY;
        const startTime = performance.now();
        const duration = 600;
        function step(now){
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          window.scrollTo(0, startY + (targetY - startY) * easeInOutCubic(progress));
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      function wireNavBox(selector, sectionId){
        const box = document.querySelector(selector);
        const section = sectionId ? document.getElementById(sectionId) : null;
        if (!box || (sectionId && !section)) return;
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
          const targetY = section ? section.getBoundingClientRect().top + window.scrollY : 0;
          goToY(targetY);
        });
      }

      wireNavBox('.menu-money', null);
      wireNavBox('.menu-dog', 'projects');
      wireNavBox('.menu-cat2', 'about');
      wireNavBox('.menu-cat1', 'contact');
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
      const el = document.getElementById('heroGreet');
      if (!el) return;
      const greetings = [
        { text: 'ខ្ញុំទន្ទឹងរង់ចាំជួបអ្នកណាស់!', lang: 'km' },
        { text: 'ฉันตั้งตารอที่จะได้พบคุณ!', lang: 'th' },
        { text: 'お会いできるのを楽しみにしていました！', lang: 'ja' },
        { text: '만나 뵙기를 고대하고 있었어요!', lang: 'ko' },
        { text: 'Tenía muchas ganas de conocerte!', lang: 'es' },
        { text: "I've been looking forward to meeting you!", lang: 'en' },
        { text: 'मैं आपसे मिलने का इंतज़ार कर रहा था!', lang: 'hi' },
        { text: '我一直很期待见到你！', lang: 'zh' },
        { text: "J'avais hâte de vous rencontrer!", lang: 'fr' },
        { text: 'သင့်ကိုတွေ့ဖို့ စောင့်မျှော်နေခဲ့တယ်!', lang: 'my' },
        { text: 'مجھے آپ سے ملنے کا بہت انتظار تھا!', lang: 'ur' },
        { text: 'Tôi đã rất mong được gặp bạn!', lang: 'vi' },
        { text: 'ຂ້ອຍລໍຖ້າທີ່ຈະໄດ້ພົບເຈົ້າ!', lang: 'lo' }
      ];
      const GLYPHS = '01<>[]{}/\\|=+*-#%&$ｦｧｨｩｪﾊﾋﾌﾍABCDEFGHKMNXZ';
      const HOLD_MS = 1400;    // how long each resolved phrase stays
      const STEPS = 15;        // scramble ticks before fully resolved
      const TICK_MS = 26;      // ms per scramble tick

      let index = 0;
      let timer = null;

      function play(){
        const g = greetings[index % greetings.length];
        el.lang = g.lang;
        const chars = Array.from(g.text);
        const total = chars.length;
        let step = 0;
        clearInterval(timer);
        timer = setInterval(function(){
          step++;
          const revealed = Math.floor(total * step / STEPS);
          let out = '';
          for (let i = 0; i < total; i++){
            const c = chars[i];
            if (i < revealed || c === ' '){
              out += c;
            } else {
              out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
          }
          el.textContent = out;
          if (step >= STEPS){
            clearInterval(timer);
            el.textContent = g.text;
            index++;
            setTimeout(play, HOLD_MS);
          }
        }, TICK_MS);
      }

      play();
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
      const names = [
        { text: '[VUTHY CHEAM]', lang: 'en' },
        { text: '[ជាម វុឌ្ឍី]', lang: 'km' },
        { text: '[เฟิร์ส]', lang: 'th' }
      ];
      let i = 0;
      setInterval(() => {
        i = (i + 1) % names.length;
        homeLink.textContent = names[i].text;
        homeLink.lang = names[i].lang;
      }, 1250);
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
      const bigSize = 22;

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

        const maxOffset = Math.max(0, (liBox.clientWidth / 2) - (letterI.offsetWidth / 2));
        const offset = progress * maxOffset;
        letterI.style.transform = `translateX(${(-offset).toFixed(2)}px)`;
        letterN.style.transform = `translateX(${offset.toFixed(2)}px)`;
      }

      let ticking = false;
      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
      }, { passive:true });
      window.addEventListener('resize', update);
      update();
    })();

    (function(){
      const scroller = document.querySelector('.contact-boxes');
      const emailBox = document.querySelector('.contact-box[data-label="Email"]');
      const glyph = document.querySelector('.email-glyph');
      if (!scroller || !emailBox || !glyph) return;

      const totalChars = 5;
      const visibleChars = 2;

      function update(){
        const viewCenter = scroller.scrollLeft + scroller.clientWidth / 2;
        const boxCenter = emailBox.offsetLeft + emailBox.offsetWidth / 2;
        const windowDist = emailBox.offsetWidth + 24;
        const signedDist = boxCenter - viewCenter;
        const progress = Math.max(-1, Math.min(1, signedDist / windowDist));

        const glyphWidth = glyph.offsetWidth;
        const charWidth = glyphWidth / totalChars;
        const hideWidth = glyphWidth - visibleChars * charWidth;
        const sideGap = (emailBox.clientWidth - glyphWidth) / 2;

        const translateX = -progress * (hideWidth + sideGap);
        glyph.style.transform = `translateX(${translateX.toFixed(2)}px)`;
      }

      let ticking = false;
      scroller.addEventListener('scroll', () => {
        if (!ticking){ requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
      }, { passive:true });
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

      function update(){
        const boxWidth = infoBox.offsetWidth;
        const gapPx = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap) || 24;
        const maxDist = boxWidth + gapPx;
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
        textEls.forEach(el => {
          const r = el.getBoundingClientRect();
          const overlap = r.left < circleRect.right && r.right > circleRect.left &&
                           r.top < circleRect.bottom && r.bottom > circleRect.top;
          el.classList.toggle('on-circle', overlap);
        });
      }

      function loop(){
        update();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
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
(function(){
  const section = document.getElementById('blackDivider');
  const grid = document.getElementById('dotGrid');
  const cursorCircle = document.getElementById('cursorCircle');
  if (!section || !grid) return;

  const SPACING = 28;
  const MAX_DIST = 160;
  const MAX_SCALE = 6;
  let dots = [];
  let mouseX = null, mouseY = null;
  let raf = null;

  function buildGrid(){
    grid.innerHTML = '';
    dots = [];
    const w = section.clientWidth;
    const h = section.clientHeight;
    const cols = Math.ceil(w / SPACING) + 1;
    const rows = Math.ceil(h / SPACING) + 1;
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const x = c * SPACING;
        const y = r * SPACING;
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        frag.appendChild(dot);
        dots.push({ el: dot, x, y });
      }
    }
    grid.appendChild(frag);
  }

  function update(){
    raf = null;
    if (mouseX === null){
      dots.forEach(d => {
        d.el.style.transform = 'scale(1)';
        d.el.style.background = 'rgba(255,255,255,0.45)';
      });
      return;
    }
    dots.forEach(d => {
      const dx = d.x - mouseX;
      const dy = d.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST){
        const t = 1 - (dist / MAX_DIST);
        const scale = 1 + t * (MAX_SCALE - 1);
        const alpha = 0.45 + t * 0.55;
        d.el.style.transform = 'scale(' + scale.toFixed(3) + ')';
        d.el.style.background = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      } else {
        d.el.style.transform = 'scale(1)';
        d.el.style.background = 'rgba(255,255,255,0.45)';
      }
    });
  }

  section.addEventListener('mouseenter', function(){
    document.body.classList.add('on-black-divider');
  });
  section.addEventListener('mousemove', function(e){
    const rect = section.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (cursorCircle){
      cursorCircle.style.left = mouseX + 'px';
      cursorCircle.style.top = mouseY + 'px';
      cursorCircle.style.opacity = '1';
    }
    if (!raf) raf = requestAnimationFrame(update);
  });
  section.addEventListener('mouseleave', function(){
    mouseX = null;
    document.body.classList.remove('on-black-divider');
    if (cursorCircle) cursorCircle.style.opacity = '0';
    if (!raf) raf = requestAnimationFrame(update);
  });

  buildGrid();
  window.addEventListener('resize', buildGrid);
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

  let mouseX = 0, mouseY = 0;

  section.addEventListener('mousemove', function(e){
    const rect = section.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) - rect.width / 2;
    mouseY = (e.clientY - rect.top) - rect.height / 2;
  });
  section.addEventListener('mouseleave', function(){
    mouseX = 0;
    mouseY = 0;
  });

  const midIndex = Math.floor((links.length - 1) / 2);

  function step(link, leader, dist){
    const rate = Math.max(0.075 - dist * 0.003, 0.025);
    link.targetX = leader.curX;
    link.targetY = leader.curY;
    link.curX += (link.targetX - link.curX) * rate;
    link.curY += (link.targetY - link.curY) * rate;
    link.el.style.transform = 'translate(' + link.curX.toFixed(1) + 'px, ' + link.curY.toFixed(1) + 'px)';
  }

  function loop(){
    step(links[midIndex], { curX: mouseX, curY: mouseY }, 0);
    for (let i = midIndex + 1; i < links.length; i++){
      step(links[i], links[i - 1], i - midIndex);
    }
    for (let i = midIndex - 1; i >= 0; i--){
      step(links[i], links[i + 1], midIndex - i);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
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
  Runner.run(runner, engine);

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

  function loop(){
    eyes.forEach(function(eye, i){
      const rect = eye.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const maxX = rect.width / 2 - 15;
      const maxY = rect.height / 2 - 15;
      const ellipseDist = (dx * dx) / (maxX * maxX) + (dy * dy) / (maxY * maxY);
      let tx = dx, ty = dy;
      if (ellipseDist > 1){
        const scale = 1 / Math.sqrt(ellipseDist);
        tx = dx * scale;
        ty = dy * scale;
      }
      curX[i] += (tx - curX[i]) * 0.25;
      curY[i] += (ty - curY[i]) * 0.25;
      pupils[i].style.transform =
        'translate(-50%, -50%) translate(' + curX[i].toFixed(1) + 'px, ' + curY[i].toFixed(1) + 'px)';
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

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
