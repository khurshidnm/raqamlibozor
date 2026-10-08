/* Raqamli Bozor — landing page behaviour (no dependencies) */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phone = window.matchMedia('(max-width: 809.98px)');
  var IMG = 'assets/img/';

  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function seconds(v) { return (parseFloat(v) || 0) * (/ms$/.test(v) ? 1 : 1000); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Web Animations helper: uses the spring curve when the browser supports linear() */
  function animate(el, frames, opts) {
    if (!el.animate) { return null; }
    try { return el.animate(frames, opts); }
    catch (e) { opts.easing = 'cubic-bezier(.22, 1, .36, 1)'; return el.animate(frames, opts); }
  }

  /* ------------------------------------------------------------------ *
   * 1. Large screens: the 1440px layout is zoomed at half speed
   * ------------------------------------------------------------------ */
  function setZoom() {
    var w = root.clientWidth;
    var z = w >= 1440 ? 1 + (w / 1440 - 1) * 0.5 : 1;
    root.style.setProperty('--page-zoom', z.toFixed(4));
  }
  setZoom();
  window.addEventListener('resize', setZoom);

  /* ------------------------------------------------------------------ *
   * 2. Navigation: hide on scroll down, show on scroll up
   * ------------------------------------------------------------------ */
  (function () {
    var nav = $('#nav');
    if (!nav) { return; }
    var last = window.scrollY || 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      if (y < 24) { nav.classList.remove('is-hidden'); last = y; return; }
      if (y > last + 4) { nav.classList.add('is-hidden'); }
      else if (y < last - 4) { nav.classList.remove('is-hidden'); }
      last = y;
    }, { passive: true });
  })();

  /* placeholder links (href="#") should not jump to the top of the page */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) { e.preventDefault(); }
  });

  /* ------------------------------------------------------------------ *
   * 3. Hero: rotating headline + banner slides
   * ------------------------------------------------------------------ */
  (function () {
    var stage = $('#heroStage');
    var title = $('#heroTitle');
    if (!stage || !title) { return; }

    var INTERVAL = 2000;
    // x / y are offsets in % from the centre of the banner, w is the image width in px
    var SLIDES = [
      { title: 'Yuqori aniqlikdagi\nsun’iy intellekt',
        d: { img: 'hero-basket.png', w: 675, x: 2, y: 23 }, m: { img: 'hero-basket.png', w: 578, x: 13, y: 7 },
        tags: [['Xavfsizlik', -30, -3], ['Tekshiruv', 13, 27], ['Aniq hisobot', 24, -5]] },
      { title: 'Uy hayvonlari\nsotuv va savdo',
        d: { img: 'hero-cow.png', w: 468, x: 0, y: 0 }, m: { img: 'hero-cow-sm.png', w: 486, x: 11, y: -6 },
        tags: [['Sanoq', -20, -15], ['Nazorat', -6, 26], ['Aniq hisob', 18, -3]] },
      { title: 'Rastalar va to‘lovlar\nnazorati qilish',
        d: { img: 'hero-phone.png', w: 576, x: 4, y: 20 }, m: { img: 'hero-phone-sm.png', w: 581, x: 16, y: 14 },
        tags: [['Tekshiruv', -25, -12], ['Kafolat', 24, -14], ['Elektron arxiv', -15, 22]] },
      { title: 'Raqamli avtoturargoh\nyechimi',
        d: { img: 'hero-cars.png', w: 1101, x: 0, y: 10 }, m: { img: 'hero-cars-sm.png', w: 956, x: 50, y: 16 },
        tags: [['Kirish-chiqish', -37, -15], ['Tartib', 32, -12], ['To\'lov nazorati', -11, -20]] }
    ];

    var imgEase = cssVar('--sp-hero-img'), imgDur = seconds(cssVar('--sp-hero-img-d')) || 530;
    var tagEase = cssVar('--sp-hero-tag'), tagDur = seconds(cssVar('--sp-hero-tag-d')) || 640;
    var index = 0;
    var current = null;

    // warm the cache so slides never pop in half-loaded
    SLIDES.forEach(function (s) { [s.d.img, s.m.img].forEach(function (src) { var i = new Image(); i.src = IMG + src; }); });

    function build(slide) {
      var v = phone.matches ? slide.m : slide.d;
      var el = doc.createElement('div');
      el.className = 'slide';

      var box = doc.createElement('div');
      box.className = 'slide__img';
      box.style.top = (50 + v.y) + '%';
      box.style.left = (50 + v.x) + '%';
      box.style.width = v.w + 'px';
      var img = doc.createElement('img');
      img.src = IMG + v.img; img.alt = ''; img.decoding = 'async';
      box.appendChild(img);
      el.appendChild(box);

      if (!phone.matches) {
        slide.tags.forEach(function (t) {
          var wrap = doc.createElement('div');
          wrap.className = 'slide__tag';
          wrap.style.top = (50 + t[2]) + '%';
          wrap.style.left = (50 + t[1]) + '%';
          var s = doc.createElement('span');
          s.textContent = t[0];
          wrap.appendChild(s);
          el.appendChild(wrap);
        });
      }
      return el;
    }

    function enter(el) {
      if (reduceMotion.matches) { return; }
      animate($('.slide__img img', el),
        [{ opacity: 0, transform: 'translateY(60px) scale(.95)' }, { opacity: 1, transform: 'none' }],
        { duration: imgDur, easing: imgEase, fill: 'both' });
      $$('.slide__tag span', el).forEach(function (s, i) {
        animate(s, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
          { duration: tagDur, delay: 100 + i * 80, easing: tagEase, fill: 'both' });
      });
    }

    function leave(el) {
      if (reduceMotion.matches || !el.animate) { el.remove(); return; }
      var a = animate($('.slide__img img', el),
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40px) scale(.95)' }],
        { duration: imgDur, easing: imgEase, fill: 'both' });
      $$('.slide__tag span', el).forEach(function (s) {
        animate(s, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-20px)' }],
          { duration: tagDur, easing: tagEase, fill: 'both' });
      });
      var done = function () { el.remove(); };
      if (a && a.finished) { a.finished.then(done, done); }
      setTimeout(done, Math.max(imgDur, tagDur) + 100);
    }

    function setTitle(text, instant) {
      var old = $$('.hero__title-in', title);
      var span = doc.createElement('span');
      span.className = 'hero__title-in';
      span.textContent = text;
      title.appendChild(span);
      if (instant || reduceMotion.matches || !span.animate) { old.forEach(function (o) { o.remove(); }); return; }
      span.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, easing: 'ease-out', fill: 'both' });
      old.forEach(function (o) {
        o.setAttribute('aria-hidden', 'true');
        var a = o.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-16px)' }],
          { duration: 280, easing: 'ease-out', fill: 'both' });
        var rm = function () { o.remove(); };
        a.finished.then(rm, rm);
      });
    }

    function show(i, first) {
      index = (i + SLIDES.length) % SLIDES.length;
      var next = build(SLIDES[index]);
      stage.appendChild(next);
      enter(next);
      if (current) { leave(current); }
      current = next;
      setTitle(SLIDES[index].title, first);
    }

    // Headlines wrap to a different number of lines on narrow screens; reserve the tallest
    // one so the page below does not jump every time the slide changes.
    function reserve() {
      var probe = doc.createElement('span');
      probe.className = 'hero__title-in';
      probe.style.cssText = 'position:absolute;left:0;right:0;visibility:hidden;pointer-events:none';
      title.appendChild(probe);
      var max = 0;
      SLIDES.forEach(function (s) { probe.textContent = s.title; max = Math.max(max, probe.offsetHeight); });
      probe.remove();
      title.style.minHeight = max ? max + 'px' : '';
    }

    show(0, true);
    reserve();
    window.addEventListener('resize', reserve);
    if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(reserve); }
    setInterval(function () { if (!doc.hidden) { show(index + 1); } }, INTERVAL);

    // swap the image set when crossing the phone breakpoint
    var onBreakpoint = function () {
      if (current) { current.remove(); }
      current = build(SLIDES[index]);
      stage.appendChild(current);
    };
    if (phone.addEventListener) { phone.addEventListener('change', onBreakpoint); }
    else if (phone.addListener) { phone.addListener(onBreakpoint); }
  })();

  /* ------------------------------------------------------------------ *
   * 4. Appear on scroll (once, when half of the element is visible)
   * ------------------------------------------------------------------ */
  (function () {
    var targets = $$('.appear, .intro__text');
    if (!('IntersectionObserver' in window)) { targets.forEach(function (t) { t.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ------------------------------------------------------------------ *
   * 5. Feature cards: notification stack + icon tiles
   * ------------------------------------------------------------------ */
  (function () {
    var items = $$('#notifStack .notif__item');
    if (!items.length) { return; }
    var n = items.length, i = 0;
    function layout() {
      items.forEach(function (el, a) {
        var o = (a - i + n) % n;
        el.style.setProperty('--y', (o * -26) + 'px');
        el.style.setProperty('--s', String(1 - o * 0.12));
        el.style.zIndex = String(n - o);
        el.classList.toggle('is-front', o === 0);
      });
    }
    layout();
    setInterval(function () { if (!doc.hidden) { i = (i + 1) % n; layout(); } }, 2500);
  })();

  (function () {
    var tiles = $$('#tiles .tiles__item');
    if (tiles.length !== 3) { return; }
    var a = 0;
    function layout() {
      tiles.forEach(function (el, t) {
        var pos = (t + a) % 3;                       // 0 = left, 1 = centre, 2 = right
        el.style.setProperty('--x', (pos === 1 ? 0 : pos === 0 ? -105 : 105) + 'px');
        el.style.setProperty('--s', pos === 1 ? '1' : '.85');
        el.classList.toggle('is-center', pos === 1);
      });
    }
    layout();
    setInterval(function () { if (!doc.hidden) { a = (a + 1) % 3; layout(); } }, 2500);
  })();

  /* ------------------------------------------------------------------ *
   * 6. Solutions: cards shrink 5% for every following card that arrives
   * ------------------------------------------------------------------ */
  (function () {
    var list = $('#stack');
    var cards = $$('.scard', list);
    if (!list || !cards.length) { return; }
    var N = cards.length;
    var cur = cards.map(function () { return 1; });
    var target = cur.slice();
    var raf = 0, lastT = 0;

    function measure() {
      var rect = list.getBoundingClientRect();
      var zoom = rect.width / (list.offsetWidth || rect.width) || 1;   // page zoom on large screens
      var cs = getComputedStyle(list);
      var gap = (parseFloat(cs.rowGap) || 0) * zoom;
      var y = rect.top + window.scrollY + (parseFloat(cs.paddingTop) || 0) * zoom;   // natural (un-stuck) top of card 1
      var half = window.innerHeight / 2;
      for (var i = 0; i < N; i++) {
        var h = cards[i].offsetHeight * zoom;
        var pitch = h + gap;
        var progress = clamp((window.scrollY - (y - half)) / pitch, 0, N - i);
        target[i] = 1 - 0.05 * progress;
        y += pitch;
      }
      if (!raf) { raf = requestAnimationFrame(tick); }
    }

    function tick(t) {
      raf = 0;
      var dt = clamp(t - (lastT || t - 16.7), 1, 64); lastT = t;
      var k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 130);
      var moving = false;
      for (var i = 0; i < N; i++) {
        var d = target[i] - cur[i];
        if (Math.abs(d) < 0.0004) { cur[i] = target[i]; } else { cur[i] += d * k; moving = true; }
        cards[i].style.setProperty('--scale', cur[i].toFixed(4));
      }
      if (moving) { raf = requestAnimationFrame(tick); } else { lastT = 0; }
    }

    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  })();

  /* ------------------------------------------------------------------ *
   * 7. Steps: dotted rail
   * ------------------------------------------------------------------ */
  (function () {
    var dots = $('#stepDots');
    if (!dots) { return; }
    var html = '';
    for (var i = 0; i < 67; i++) { html += '<i></i>'; }
    dots.innerHTML = html;
  })();

  /* ------------------------------------------------------------------ *
   * 8. Globe: 80 frames scrubbed by scroll position
   * ------------------------------------------------------------------ */
  (function () {
    var box = $('#globe');
    var canvas = box && $('canvas', box);
    if (!canvas || !canvas.getContext) { return; }
    var ctx = canvas.getContext('2d');
    var COUNT = 80, SMOOTHING = 110;
    var frames = new Array(COUNT);
    var started = false, active = false;
    var current = 0, target = 0, drawn = -1, raf = 0, lastT = 0;

    function src(i) { return 'assets/earth/earth-' + (i < 10 ? '0' : '') + i + '.webp'; }

    function load(i) {
      if (frames[i]) { return; }
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { im.ready = true; wake(); };
      im.src = src(i);
      frames[i] = im;
    }

    function loadAll() {
      if (started) { return; }
      started = true;
      // nearest frames first, then the rest
      var order = [], c = Math.round(target);
      for (var d = 0; d < COUNT; d++) {
        if (c + d < COUNT) { order.push(c + d); }
        if (d && c - d >= 0) { order.push(c - d); }
      }
      var k = 0;
      (function next() {
        for (var n = 0; n < 6 && k < order.length; n++, k++) { load(order[k]); }
        if (k < order.length) { setTimeout(next, 60); }
      })();
    }

    function nearestReady(i) {
      for (var d = 0; d < COUNT; d++) {
        if (frames[i - d] && frames[i - d].ready) { return i - d; }
        if (frames[i + d] && frames[i + d].ready) { return i + d; }
      }
      return -1;
    }

    function measure() {
      var r = box.getBoundingClientRect();
      var vh = window.innerHeight;
      active = r.top < vh && r.bottom > 0;
      target = clamp((vh - r.top) / Math.max(1, vh + r.height), 0, 1) * (COUNT - 1);
      if (!active) { current = target; }
      wake();
    }

    function wake() { if (!raf) { raf = requestAnimationFrame(tick); } }

    function tick(t) {
      raf = 0;
      if (active) {
        var dt = clamp(t - (lastT || t - 16.67), 1, 64); lastT = t;
        var k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / SMOOTHING);
        var maxStep = Math.max(1, dt / 16.67);
        var next = current + clamp((target - current) * k, -maxStep, maxStep);
        if (Math.abs(target - next) < 0.015) { next = target; }
        current = next;
      }
      var f = nearestReady(Math.round(current));
      if (f >= 0 && f !== drawn) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[f], 0, 0, canvas.width, canvas.height);
        drawn = f;
      }
      if (active && current !== target) { wake(); } else { lastT = 0; }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { measure(); loadAll(); }
      }, { rootMargin: '800px 0px' }).observe(box);
    } else { loadAll(); }

    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    load(0);
  })();

  /* ------------------------------------------------------------------ *
   * 9. FAQ accordion (each item toggles on its own)
   * ------------------------------------------------------------------ */
  $$('.faq__item').forEach(function (item) {
    var btn = $('.faq__q', item);
    item.addEventListener('click', function (e) {
      if (window.getSelection && String(window.getSelection())) { return; }   // let people select answer text
      var open = item.classList.toggle('is-open');
      if (btn) { btn.setAttribute('aria-expanded', String(open)); }
      e.preventDefault();
    });
  });

  /* ------------------------------------------------------------------ *
   * 10. Demo request form: +998 mask and optional POST
   * ------------------------------------------------------------------ */
  (function () {
    var form = $('#demoForm');
    var input = form && $('input[name="phone"]', form);
    if (!input) { return; }

    function digits(v) {
      var d = v.replace(/\D/g, '');
      if (d.indexOf('998') === 0) { d = d.slice(3); }
      return d.slice(0, 9);
    }
    function format(d) {
      var out = '+998';
      if (d.length) { out += ' ' + d.slice(0, 2); }
      if (d.length > 2) { out += ' ' + d.slice(2, 5); }
      if (d.length > 5) { out += ' ' + d.slice(5, 7); }
      if (d.length > 7) { out += ' ' + d.slice(7, 9); }
      return out;
    }

    input.addEventListener('focus', function () { if (!input.value) { input.value = '+998 '; } });
    input.addEventListener('blur', function () { if (!digits(input.value)) { input.value = ''; } });
    input.addEventListener('input', function () {
      form.classList.remove('is-invalid');
      var d = digits(input.value);
      input.value = d.length ? format(d) : '+998 ';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = digits(input.value);
      if (d.length !== 9) { form.classList.add('is-invalid'); input.focus(); return; }
      var phoneNumber = '+998' + d;
      form.dispatchEvent(new CustomEvent('demo:request', { bubbles: true, detail: { phone: phoneNumber } }));

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        if (window.console) { console.info('[Raqamli Bozor] Demo request for ' + phoneNumber + ' — set data-endpoint on #demoForm to send it.'); }
        return;
      }
      var button = $('button[type="submit"]', form);
      var label = button.textContent;
      button.disabled = true;
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneNumber }) })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          input.value = '';
          button.textContent = 'Yuborildi';
          setTimeout(function () { button.textContent = label; button.disabled = false; }, 2500);
        })
        .catch(function () { form.classList.add('is-invalid'); button.disabled = false; });
    });
  })();
})();
