import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One MDX file per language; both share `translationOf`, which is the page slug.
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lead: z.string(),
    lang: z.enum(['en', 'ar']),
    translationOf: z.string(),
    label: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = { caseStudies };
