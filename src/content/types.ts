/** A paragraph: plain strings and emphasised spans, rendered in order. */
export type RichText = Array<string | { strong: string }>;

export interface Profile {
  name: string;
  title: string;
  lead: string;
  location: string;
  siteUrl: string;
  links: { github: string; linkedin: string };
  /** Split on purpose: the whole address must never appear in built files. */
  emailParts: { user: string; domain: string };
  about: RichText[];
}

export interface ExperienceItem {
  role: string;
  company?: string;
  period: string;
  summary: string;
  tags: string[];
  /** Set when a case study exists; v1 rows have none. */
  href?: string;
}

export interface ProjectItem {
  slug: string;
  label: string;
  title: string;
  summary: string;
  tags: string[];
  /** Set to /case-studies/<slug> when that case study ships; v1 rows have none. */
  href?: string;
}
