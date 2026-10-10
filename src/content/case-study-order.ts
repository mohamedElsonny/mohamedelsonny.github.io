import type { CollectionEntry } from 'astro:content';
import { projects } from './projects';

export interface NextCaseStudy {
  title: string;
  label: string;
  href: string;
}

// Case studies follow the home page project order and wrap around at the end.
const order = projects.filter((p) => p.href).map((p) => p.slug);

export function nextCaseStudy(
  entries: CollectionEntry<'caseStudies'>[],
  current: CollectionEntry<'caseStudies'>,
): NextCaseStudy | undefined {
  if (entries.length < 2) return undefined;
  const rank = (e: CollectionEntry<'caseStudies'>) => order.indexOf(e.data.translationOf);
  const sorted = [...entries].sort((a, b) => rank(a) - rank(b));
  const next = sorted[(sorted.indexOf(current) + 1) % sorted.length];
  const prefix = next.data.lang === 'ar' ? '/ar' : '';
  return { title: next.data.title, label: next.data.label, href: `${prefix}/case-studies/${next.data.translationOf}/` };
}
