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
      const hellos = [
        { text: 'សួស្តី', lang: 'km' },
        { text: 'สวัสดี', lang: 'th' },
        { text: 'こんにちは', lang: 'ja' },
        { text: '안녕하세요', lang: 'ko' },
        { text: 'Hola', lang: 'es' },
        { text: 'Hello', lang: 'en' },
        { text: 'नमस्ते', lang: 'hi' },
        { text: '你好', lang: 'zh' },
        { text: 'Bonjour', lang: 'fr' },
        { text: 'မင်္ဂလာပါ', lang: 'my' },
        { text: 'سلام', lang: 'ur' },
        { text: 'Xin chào', lang: 'vi' },
        { text: 'ສະບາຍດີ', lang: 'lo' }
      ];
      let index = 0;
      let lastSpawn = 0;
      const spawnGapMs = 90;
      const divider = document.getElementById('vDivider');

      document.addEventListener('mousemove', (e) => {
        if (!e.target.closest('.hero') || e.target.closest('.scroll-cta')) return;

        if (divider){
          const dRect = divider.getBoundingClientRect();
          if (e.clientX <= dRect.left + dRect.width / 2) return;
        }

        const now = performance.now();
        if (now - lastSpawn < spawnGapMs) return;
        lastSpawn = now;

        const word = hellos[index % hellos.length];
        index++;

        const el = document.createElement('span');
        el.className = 'hello-trail';
        el.textContent = word.text;
        el.lang = word.lang;
        el.style.left = e.clientX + 'px';
        el.style.top = e.clientY + 'px';
        document.body.appendChild(el);

        requestAnimationFrame(() => el.classList.add('fade'));
        setTimeout(() => el.remove(), 950);
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
