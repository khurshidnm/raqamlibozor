/** Splits CMS text on line breaks so templates can render `<br>` between lines. */
export function lines(text: string): string[] {
  return text.split(/\r?\n/);
}

/** Replaces `{year}` with the build-time year. */
export function withYear(template: string, date: Date = new Date()): string {
  return template.replaceAll('{year}', String(date.getFullYear()));
}

/** Escapes `<` so JSON can be embedded in a <script type="application/json"> block. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
