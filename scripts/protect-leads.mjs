/**
 * Keeps contact-form leads (customers' phone numbers) out of git.
 *
 * The rule lives in .git/info/exclude instead of .gitignore because Keystatic's
 * local mode hides every file matched by a .gitignore, which would hide the
 * Leads collection itself. Runs on `npm install` / `npm ci` via the `prepare` script;
 * tests/leads.test.ts fails if a lead file is ever tracked anyway.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RULE = 'src/content/leads/*.json';
const gitDir = join(import.meta.dirname, '..', '.git');
if (existsSync(gitDir)) {
  const exclude = join(gitDir, 'info', 'exclude');
  mkdirSync(join(gitDir, 'info'), { recursive: true });
  const current = existsSync(exclude) ? readFileSync(exclude, 'utf8') : '';
  if (!current.split('\n').includes(RULE)) {
    appendFileSync(
      exclude,
      `${current.endsWith('\n') || !current ? '' : '\n'}# Raqamli Bozor: leads are personal data\n${RULE}\n`,
    );
    console.log(`protect-leads: added "${RULE}" to .git/info/exclude`);
  }
}
