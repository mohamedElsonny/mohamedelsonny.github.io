import { test, expect } from '@playwright/test';
import { extname, relative } from 'node:path';
import { ROOT, read, walk } from './helpers/files';

// Physical properties break RTL pages. Use logical ones (margin-inline-start, inset-inline-end, ...).
const PHYSICAL = [
  /(?:^|[\s;{])(?:margin|padding|border)-(?:left|right)\b/,
  /(?:^|[\s;{])(?:left|right)\s*:/,
  /text-align\s*:\s*(?:left|right)\b/,
  /float\s*:\s*(?:left|right)\b/,
];

test('source CSS uses logical properties only', () => {
  const files = walk(`${ROOT}/src`).filter((f) => ['.css', '.astro'].includes(extname(f)));
  expect(files.length).toBeGreaterThan(0);
  const offenders: string[] = [];
  for (const file of files) {
    read(file)
      .split('\n')
      .forEach((line, i) => {
        if (PHYSICAL.some((re) => re.test(line))) offenders.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
  }
  expect(offenders).toEqual([]);
});
