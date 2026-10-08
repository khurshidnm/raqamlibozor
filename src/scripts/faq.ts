import { $, $$ } from './dom';

/** FAQ accordion: each item toggles independently; text selection inside an item does not toggle it. */
export function initFaq(): void {
  for (const item of $$('.faq__item')) {
    const button = $<HTMLButtonElement>('.faq__q', item);
    item.addEventListener('click', (e) => {
      const selection = getSelection();
      if (selection && String(selection) && item.contains(selection.anchorNode)) return;
      const open = item.classList.toggle('is-open');
      button?.setAttribute('aria-expanded', String(open));
      e.preventDefault();
    });
  }
}
