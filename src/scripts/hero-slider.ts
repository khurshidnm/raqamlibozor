import { $, $$, animate, cssVar, phoneQuery, reduceMotion, toMs } from './dom';

export interface SlideVariant {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  /** Placement: rendered width in px and offsets in % from the banner centre. */
  w: number;
  x: number;
  y: number;
}
export interface SlideData {
  title: string;
  tags: { label: string; x: number; y: number }[];
  d: SlideVariant;
  m: SlideVariant;
}
export interface HeroData {
  slides: SlideData[];
  intervalMs: number;
  labels: { pause: string; play: string };
}

const PHONE_MEDIA = '(max-width: 809.98px)';

/**
 * Rotating headline + banner slides. Slide 0 is server-rendered; this module
 * builds the following slides from the JSON block, animates the swap, pauses
 * when the hero is off-screen / the tab is hidden / the user asks, and skips
 * autoplay for people who prefer reduced motion.
 */
export function initHeroSlider(): void {
  const stage = $('#heroStage');
  const title = $('#heroTitle');
  const dataEl = $('#hero-data');
  const pauseBtn = $<HTMLButtonElement>('.hero__pause');
  if (!stage || !title || !dataEl) return;

  const data = JSON.parse(dataEl.textContent || '{}') as HeroData;
  const slides = data.slides ?? [];
  if (slides.length < 2) {
    pauseBtn?.setAttribute('hidden', '');
    return;
  }

  const imgEase = cssVar('--sp-hero-img');
  const imgDur = toMs(cssVar('--sp-hero-img-d')) || 530;
  const tagEase = cssVar('--sp-hero-tag');
  const tagDur = toMs(cssVar('--sp-hero-tag-d')) || 640;
  const phone = phoneQuery();

  let index = 0;
  let current: HTMLElement | null = $('.slide', stage);
  let timer: ReturnType<typeof setInterval> | undefined;
  let userPaused = reduceMotion();
  let visible = true;

  /* Warm only the variant this device will show. */
  const warm = (): void => {
    for (const s of slides) {
      const v = phone.matches ? s.m : s.d;
      const img = new Image();
      img.sizes = v.sizes;
      img.srcset = v.srcset;
      img.src = v.src;
    }
  };
  warm();
  phone.addEventListener('change', warm);

  const build = (slide: SlideData): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'slide';

    const box = document.createElement('div');
    box.className = 'slide__img';
    box.style.cssText = `--wd:${slide.d.w}px;--xd:${50 + slide.d.x}%;--yd:${50 + slide.d.y}%;--wm:${slide.m.w}px;--xm:${50 + slide.m.x}%;--ym:${50 + slide.m.y}%`;

    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.media = PHONE_MEDIA;
    source.srcset = slide.m.srcset;
    source.sizes = slide.m.sizes;
    const img = document.createElement('img');
    img.src = slide.d.src;
    img.srcset = slide.d.srcset;
    img.sizes = slide.d.sizes;
    img.width = slide.d.width;
    img.height = slide.d.height;
    img.alt = '';
    img.decoding = 'async';
    picture.append(source, img);
    box.append(picture);
    el.append(box);

    const tags = document.createElement('div');
    tags.className = 'slide__tags';
    for (const t of slide.tags) {
      const wrap = document.createElement('div');
      wrap.className = 'slide__tag';
      wrap.style.left = `${50 + t.x}%`;
      wrap.style.top = `${50 + t.y}%`;
      const span = document.createElement('span');
      span.textContent = t.label;
      wrap.append(span);
      tags.append(wrap);
    }
    el.append(tags);
    return el;
  };

  const enter = (el: HTMLElement): void => {
    if (reduceMotion()) return;
    animate(
      $('.slide__img img', el),
      [
        { opacity: 0, transform: 'translateY(60px) scale(.95)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: imgDur, easing: imgEase, fill: 'both' },
    );
    $$('.slide__tag span', el).forEach((s, i) =>
      animate(
        s,
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: tagDur,
          delay: 100 + i * 80,
          easing: tagEase,
          fill: 'both',
        },
      ),
    );
  };

  const leave = (el: HTMLElement): void => {
    if (reduceMotion()) {
      el.remove();
      return;
    }
    const a = animate(
      $('.slide__img img', el),
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-40px) scale(.95)' },
      ],
      { duration: imgDur, easing: imgEase, fill: 'both' },
    );
    $$('.slide__tag span', el).forEach((s) =>
      animate(
        s,
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-20px)' },
        ],
        {
          duration: tagDur,
          easing: tagEase,
          fill: 'both',
        },
      ),
    );
    const done = () => el.remove();
    a?.finished.then(done, done);
    setTimeout(done, Math.max(imgDur, tagDur) + 100);
  };

  const setTitle = (text: string): void => {
    const old = $$('.hero__title-in', title);
    const span = document.createElement('span');
    span.className = 'hero__title-in';
    span.textContent = text;
    title.append(span);
    if (reduceMotion() || !span.animate) {
      old.forEach((o) => o.remove());
      return;
    }
    span.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 280,
        easing: 'ease-out',
        fill: 'both',
      },
    );
    for (const o of old) {
      o.setAttribute('aria-hidden', 'true');
      const a = o.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-16px)' },
        ],
        {
          duration: 280,
          easing: 'ease-out',
          fill: 'both',
        },
      );
      const rm = () => o.remove();
      a.finished.then(rm, rm);
    }
  };

  const show = (i: number): void => {
    index = (i + slides.length) % slides.length;
    const slide = slides[index];
    if (!slide) return;
    const next = build(slide);
    stage.append(next);
    enter(next);
    if (current) leave(current);
    current = next;
    setTitle(slide.title);
  };

  /* Reserve the tallest headline so the page below never jumps. */
  const reserve = (): void => {
    const probe = document.createElement('span');
    probe.className = 'hero__title-in';
    probe.style.cssText = 'position:absolute;left:0;right:0;visibility:hidden;pointer-events:none';
    title.append(probe);
    let max = 0;
    for (const s of slides) {
      probe.textContent = s.title;
      max = Math.max(max, probe.offsetHeight);
    }
    probe.remove();
    title.style.minHeight = max ? `${max}px` : '';
  };
  reserve();
  addEventListener('resize', reserve, { passive: true });
  document.fonts?.ready.then(reserve);

  const schedule = (): void => {
    if (timer) clearInterval(timer);
    timer = undefined;
    if (userPaused || !visible || document.hidden) return;
    timer = setInterval(() => show(index + 1), data.intervalMs || 2000);
  };

  const setPaused = (paused: boolean): void => {
    userPaused = paused;
    if (pauseBtn) {
      pauseBtn.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-label', paused ? data.labels.play : data.labels.pause);
    }
    schedule();
  };

  pauseBtn?.addEventListener('click', () => setPaused(!userPaused));
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        schedule();
      },
      { threshold: 0.1 },
    ).observe(stage);
  }
  setPaused(userPaused);
}
