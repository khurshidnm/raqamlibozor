import { $ } from './dom';

/** Fixed nav: hides on scroll down, shows on scroll up; hamburger panel on phones. */
export function initNav(): void {
  const nav = $('#nav');
  if (!nav) return;
  const button = $<HTMLButtonElement>('.nav__menu-btn', nav);
  const panel = $('.nav__panel', nav);
  const compact = matchMedia('(max-width: 1023.98px)');

  let open = false;
  let last = scrollY;
  let ticking = false;

  const setOpen = (next: boolean): void => {
    if (!button || !panel) return;
    open = next;
    nav.classList.toggle('is-open', open);
    if (open) nav.classList.remove('is-hidden');
    button.setAttribute('aria-expanded', String(open));
    const label = open ? button.dataset.labelClose : button.dataset.labelOpen;
    if (label) button.setAttribute('aria-label', label);
    if (open) panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  };

  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scrollY;
        if (open || y < 24) nav.classList.remove('is-hidden');
        else if (y > last + 4) nav.classList.add('is-hidden');
        else if (y < last - 4) nav.classList.remove('is-hidden');
        last = y;
      });
    },
    { passive: true },
  );

  const lang = $('.lang', nav);
  const langButton = $<HTMLButtonElement>('.lang__btn', nav);
  if (lang && langButton) {
    const setLang = (next: boolean): void => {
      lang.classList.toggle('is-open', next);
      langButton.setAttribute('aria-expanded', String(next));
    };
    langButton.addEventListener('click', () => setLang(!lang.classList.contains('is-open')));
    document.addEventListener('click', (e) => {
      if (!lang.contains(e.target as Node)) setLang(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lang.classList.contains('is-open')) {
        setLang(false);
        langButton.focus();
      }
    });
  }

  if (!button || !panel) return;
  button.addEventListener('click', () => setOpen(!open));
  panel.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (open && !nav.contains(e.target as Node)) setOpen(false);
  });
  compact.addEventListener('change', () => {
    if (!compact.matches) setOpen(false);
  });
}
