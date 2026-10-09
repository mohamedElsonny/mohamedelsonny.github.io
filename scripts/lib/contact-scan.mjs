// Pattern-based, so no real number ever has to be written in this repo.
const PHONE_PATTERNS = [
  /(?:\+|00)\s?20[\s-]?1[0125](?:[\s-]?\d){8}/g, // Egyptian mobile, international form
  /\b01[0125](?:[\s-]?\d){8}\b/g, // Egyptian mobile, local form
  /\+\d{1,3}[\s-]?\(?\d{2,4}\)?(?:[\s-]?\d{3,4}){2}/g, // other international numbers
  /tel:/gi, // tel: links
];
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

/**
 * Finds phone numbers and email addresses in text.
 * Returns only the kind and position, never the matched text, so logs stay clean.
 * @param {string} text
 * @returns {{ kind: 'phone' | 'email', index: number }[]}
 */
export function findPrivateContact(text) {
  /** @type {{ kind: 'phone' | 'email', index: number }[]} */
  const hits = [];
  const seen = new Set();
  for (const pattern of PHONE_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (seen.has(match.index)) continue;
      seen.add(match.index);
      hits.push({ kind: 'phone', index: match.index });
    }
  }
  for (const match of text.matchAll(EMAIL_PATTERN)) hits.push({ kind: 'email', index: match.index });
  return hits.sort((a, b) => a.index - b.index);
}
