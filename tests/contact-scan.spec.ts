import { test, expect } from '@playwright/test';
import { findPrivateContact } from '../scripts/lib/contact-scan.mjs';

test('detects phone numbers in common formats', () => {
  for (const sample of [
    '+20 100 123 4567',
    '+201001234567',
    '0020 100 123 4567',
    '01001234567',
    '010-0123-4567',
    '+44 20 7946 0958',
    '+1 (415) 555 2671',
    'tel:+10000',
  ]) {
    expect(findPrivateContact(sample).map((hit) => hit.kind), sample).toContain('phone');
  }
});

test('detects email addresses', () => {
  expect(findPrivateContact('write to someone@example.com today')).toEqual([{ kind: 'email', index: 9 }]);
});

test('ignores ordinary site text', () => {
  for (const sample of [
    '2018 — 2023',
    '7+ years',
    '5+ blockchains and 3+ APIs',
    '20+ engineer team',
    'an estimated 50%+',
    'https://github.com/mohamedElsonny',
    'https://linkedin.com/in/mohamedelsonny8',
    'inter-latin-400-normal.woff2',
    'translate(3px, -3px)',
    'grid-template-columns: 0.9fr 1.3fr',
    'rgba(45, 212, 191, 0.1)',
    '@font-face{font-family:Inter}',
    '}@media (min-width:1024px)',
    'b979c75a-f6d2-5b12-884b-7ca5d04871a9',
  ]) {
    expect(findPrivateContact(sample), sample).toEqual([]);
  }
});

test('never returns the matched text', () => {
  const [hit] = findPrivateContact('+20 100 123 4567');
  expect(Object.keys(hit).sort()).toEqual(['index', 'kind']);
});
