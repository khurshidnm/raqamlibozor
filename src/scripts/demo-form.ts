import { extractNationalDigits, formatUzPhone, isCompleteUzPhone, toE164 } from '../lib/phone';
import { $ } from './dom';
import { trackDemoRequest } from './track';

const MIN_FILL_TIME_MS = 1500;
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Demo request form: +998 input mask, validation with a visible message,
 * honeypot + timing spam guard, POST to the configured endpoint, and a
 * `demo:request` DOM event for custom integrations.
 */
export function initDemoForm(): void {
  const form = $<HTMLFormElement>('#demoForm');
  const input = form && $<HTMLInputElement>('input[name="phone"]', form);
  const button = form && $<HTMLButtonElement>('button[type="submit"]', form);
  const message = $('#demoMsg');
  if (!form || !input || !button) return;

  const honeypot = $<HTMLInputElement>('input[name="website"]', form);
  const msgs = form.dataset;
  const endpoint = (msgs.endpoint || '').trim();
  const openedAt = Date.now();
  const submitLabel = button.textContent;

  const setMessage = (text: string, kind: 'error' | 'success' | '' = ''): void => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('cta__msg--error', kind === 'error');
    message.classList.toggle('cta__msg--success', kind === 'success');
  };
  const dialog = $<HTMLDialogElement>('#demoSent');
  dialog?.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // backdrop click
  });
  const succeed = (): void => {
    setMessage(msgs.msgSuccess || '', 'success');
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  };
  const setInvalid = (invalid: boolean): void => {
    form.classList.toggle('is-invalid', invalid);
    input.setAttribute('aria-invalid', String(invalid));
  };

  input.addEventListener('focus', () => {
    if (!input.value) input.value = formatUzPhone('');
  });
  input.addEventListener('blur', () => {
    if (!extractNationalDigits(input.value)) input.value = '';
  });
  input.addEventListener('input', () => {
    setInvalid(false);
    setMessage('');
    input.value = formatUzPhone(extractNationalDigits(input.value));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const digits = extractNationalDigits(input.value);
    if (!isCompleteUzPhone(digits)) {
      setInvalid(true);
      setMessage(msgs.msgInvalid || '', 'error');
      input.focus();
      return;
    }
    /* Bots fill hidden fields and submit instantly; pretend it worked. */
    if (honeypot?.value || Date.now() - openedAt < MIN_FILL_TIME_MS) {
      succeed();
      return;
    }

    const phone = toE164(digits);
    form.dispatchEvent(new CustomEvent('demo:request', { bubbles: true, detail: { phone } }));

    if (!endpoint) {
      console.info(
        `[Raqamli Bozor] Demo request for ${phone} — set “Demo request endpoint” in Site settings to send it.`,
      );
      succeed();
      input.value = '';
      return;
    }

    button.disabled = true;
    button.textContent = msgs.msgSending || submitLabel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, page: location.pathname }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      input.value = '';
      succeed();
      trackDemoRequest(msgs.ym);
    } catch {
      setMessage(msgs.msgNetwork || '', 'error');
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = submitLabel;
    }
  });
}
