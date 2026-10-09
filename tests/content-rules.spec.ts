import { test, expect } from '@playwright/test';
import { relative } from 'node:path';
import { findPrivateContact } from '../scripts/lib/contact-scan.mjs';
import { profile } from '../src/content/profile';
import { ROOT, read, textFiles } from './helpers/files';

// resume.pdf is the normal CV and keeps phone and email on purpose (spec §7); it is not a text file, so it is not scanned.
test.skip(!!process.env.BASE_URL, 'reads local files');

// The scanner's own source holds the patterns (including the literal `tel:`), so it is the one file not scanned.
const SCANNER = relative(ROOT, `${ROOT}/scripts/lib/contact-scan.mjs`);

function offenders(dirs: string[]) {
  const found: string[] = [];
  for (const dir of dirs) {
    for (const file of textFiles(`${ROOT}/${dir}`)) {
      if (relative(ROOT, file) === SCANNER) continue;
      for (const hit of findPrivateContact(read(file))) found.push(`${relative(ROOT, file)} @${hit.index}: ${hit.kind}`);
    }
  }
  return found;
}

test('no phone number or email address in built text files', () => {
  expect(textFiles(`${ROOT}/dist`).length).toBeGreaterThan(0);
  expect(offenders(['dist'])).toEqual([]);
});

test('no phone number or email address in source or public text files', () => {
  expect(offenders(['src', 'public', 'scripts'])).toEqual([]);
});

test('the whole email address is in no built file', () => {
  const address = `${profile.emailParts.user}@${profile.emailParts.domain}`;
  const files = textFiles(`${ROOT}/dist`).filter((file) => read(file).includes(address));
  expect(files).toEqual([]);
});
