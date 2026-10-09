# Getridley Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Getridley case study at `/case-studies/getridley/` (English) and `/ar/case-studies/getridley/` (Arabic), with a scrollytelling pipeline diagram and an interactive claim-check explainer.

**Architecture:** An Astro content collection (`caseStudies`, MDX via `@astrojs/mdx`) holds one MDX file per language. Two static routes render the entries through a new `CaseStudyLayout`, which wraps the existing `BaseLayout`. Two framework-free Astro components (`PipelineScrolly`, `ClaimCheckExplainer`) take all their visible text as props from the MDX, draw inline SVG, and each carry a small inline script. RTL works by mirroring SVG shapes with a transform while text stays outside the mirrored group.

**Tech Stack:** Astro 7.3.8 (static), TypeScript strict, `@astrojs/mdx` 8.0.2, `@fontsource/readex-pro` 5.3.0, Playwright 1.64.0, `@axe-core/playwright` 4.13.0, Lighthouse CI 0.15.1.

**Spec:** `docs/superpowers/specs/2026-10-10-getridley-case-study-design.md`

## Global Constraints

- Install new dependencies with `npm install --save-exact`: only `@astrojs/mdx@8.0.2` and `@fontsource/readex-pro@5.3.0`. No other new dependency, no client framework.
- Copy is the spec's §5 (English) and §6 (Arabic) text, reproduced in this plan. Do not reword it, shorten it or add claims. No numbers the vault does not hold (no SQS size limit, retry count, traffic, latency).
- In JS strings inside MDX exports, write typographic quotes and apostrophes directly (“ ” ’), so they match the Markdown prose that Astro's smartypants converts.
- Technical terms stay in English inside Arabic text (spec §6 glossary).
- The phone number never appears anywhere: page, metadata, JSON-LD, source files, tests, commit messages. The email address is not shown on the case-study pages. The existing scanners (`tests/contact-scan.spec.ts`, `tests/content-rules.spec.ts`) must stay green.
- Vault sources go into source comments as 8-character ID prefixes (e.g. `A:51697763`, `F:1de76cfa`), the way `src/content/projects.ts` does it.
- All CSS uses logical properties (`margin-inline-start`, `inset-inline-start`, `padding-block`, …). `tests/rtl-ready.spec.ts` rejects `left:`, `right:`, `margin-left`, `padding-right`, `border-left`, `text-align: left|right`, `float`.
- URLs always carry the trailing slash: `/case-studies/getridley/` and `/ar/case-studies/getridley/` (canonical, hreflang, links, Home row). This matches the sitemap and avoids the GitHub Pages redirect. It deviates on purpose from the spec's slash-less spelling.
- Breakpoint is `min-width: 1024px`, the same as Home.
- Do not push, deploy or commit unless the task step says commit. Never use `--no-verify`.

## Review Focus

1. **Jumping, not scrolling, through the pipeline** (End/Home keys, `scrollTo`, anchor jumps): exactly one step is active and the diagram matches the step at the middle of the viewport. Test: Task 3, "jumping past several steps leaves exactly one active step".
2. **Reloading mid-article** (browser scroll restoration): the step at the restored position is active, not step 1. Test: Task 3, "reloading mid-pipeline restores the matching step".
3. **Crossing the 1024px breakpoint**: below it the diagram sticks under the 48px section title (240px tall); from 1024px it sits mid-screen (380px tall) beside the steps. Test: Task 3, "the stage moves at the 1024px breakpoint".
4. **A 375px phone**: no horizontal page scroll on either page; the explainer SVG fits its panel and its buttons wrap. Test: Task 5, "no horizontal overflow at 375px".
5. **Latin code inside Arabic text** (`inbox.getridley.com` in step 1): stays left-to-right and isolated, so the dots don't jump around. Test: Task 3, "Latin code inside Arabic text stays left-to-right".

---

## File Structure

```
src/content.config.ts                              NEW  caseStudies collection (glob loader, zod schema)
src/content/case-studies/en/getridley.mdx          NEW  English copy, step and explainer data
src/content/case-studies/ar/getridley.mdx          NEW  Arabic copy, step and explainer data
src/pages/case-studies/[slug].astro                NEW  English entries only
src/pages/ar/case-studies/[slug].astro             NEW  Arabic entries only, loads Readex Pro
src/layouts/CaseStudyLayout.astro                  NEW  top bar, language switcher, article header, footer, JSON-LD, alternates
src/layouts/BaseLayout.astro                       MOD  + alternates prop, + head slot, localized skip link
src/components/Tags.astro                          MOD  + label prop
src/components/case-study/pipeline.ts              NEW  scrolly node/edge geometry, packet paths, label x for RTL
src/components/case-study/PipelineScrolly.astro    NEW  sticky SVG + step list + script
src/components/case-study/ClaimCheckExplainer.astro NEW interactive SVG + controls + captions + script
src/styles/case-study.css                          NEW  page, scrolly and explainer styles
src/styles/home.css                                MOD  .tags/.tag/.spotlight rules move out
src/styles/global.css                              MOD  .tags/.tag/.spotlight rules move in
src/content/projects.ts                            MOD  Getridley href
astro.config.mjs                                   MOD  + mdx()
lighthouserc.json                                  MOD  + two URLs
tests/helpers/files.ts                             MOD  + .mdx in TEXT_EXT
tests/case-study.spec.ts                           NEW  routes, meta, switcher, JSON-LD, sitemap, fonts
tests/case-study-scrolly.spec.ts                   NEW  scrolly behaviour
tests/case-study-explainer.spec.ts                 NEW  explainer behaviour
tests/quality.spec.ts                              MOD  axe, links, JS budget, CLS, overflow for both pages
tests/home-content.spec.ts                         MOD  Getridley row link
tests/desktop.spec.ts                              MOD  row tab order, linked row hover
```

Commands used throughout (run from the repo root, `C:\Users\El Sonny\workspaces\portfolio`):

- `npm run build` builds `dist/`. Playwright tests run against `astro preview` on port 4321, so **always build before running tests**.
- `npx playwright test tests/<file>.spec.ts` runs one file. `npm test` runs all.
- `npm run check` runs `astro check` (TypeScript).

---

### Task 1: Content collection, layout and the English page

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm), `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/components/Tags.astro`, `src/styles/home.css`, `src/styles/global.css`, `tests/helpers/files.ts`
- Create: `src/content.config.ts`, `src/layouts/CaseStudyLayout.astro`, `src/styles/case-study.css`, `src/pages/case-studies/[slug].astro`, `src/content/case-studies/en/getridley.mdx`, `tests/case-study.spec.ts`

**Interfaces:**
- Consumes: `Section.astro` (`id`, `title`, slot), `Spotlight.astro`, `profile` from `src/content/profile.ts` (`profile.name`, `profile.siteUrl`).
- Produces:
  - Collection `caseStudies` with schema `{ title: string; description: string; lead: string; lang: 'en' | 'ar'; translationOf: string; label: string; tags: string[] }`.
  - `CaseStudyLayout` props: exactly that schema object (routes spread `entry.data`), plus a named slot `head` and a default slot for the article body.
  - `BaseLayout` new prop `alternates?: { lang: string; path: string }[]` and named slot `head`.
  - `Tags` new prop `label?: string` (default `'Technologies'`).
  - CSS classes later tasks rely on: `.cs` (sets `--cs-bar: 48px`), `.cs .section`, `.cs .section__title` (sticky, `block-size: var(--cs-bar)`), `.cs__body`.
  - `tests/case-study.spec.ts` exports nothing; it holds a `PAGES` array that Task 2 extends.

- [ ] **Step 1: Install dependencies and register MDX**

Run:

```bash
npm install --save-exact @astrojs/mdx@8.0.2 @fontsource/readex-pro@5.3.0
```

Expected: `package.json` `dependencies` now lists `"@astrojs/mdx": "8.0.2"` and `"@fontsource/readex-pro": "5.3.0"` (no `^`).

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mohamedelsonny.github.io',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('404') })],
});
```

In `tests/helpers/files.ts`, add `'.mdx'` to `TEXT_EXT` so the contact scanners read MDX files:

```ts
const TEXT_EXT = new Set([
  '.html', '.xml', '.txt', '.js', '.mjs', '.css', '.json', '.svg', '.webmanifest', '.astro', '.ts', '.md', '.mdx',
]);
```

- [ ] **Step 2: Write the failing test**

Create `tests/case-study.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const SITE = 'https://mohamedelsonny.github.io';
const EN_PATH = '/case-studies/getridley/';
const AR_PATH = '/ar/case-studies/getridley/';

const PAGES = [
  {
    lang: 'en',
    dir: 'ltr',
    path: EN_PATH,
    title: 'A real-time inbox for property sellers · Mohamed Gamal',
    h1: 'A real-time inbox for property sellers',
    description:
      "How I built Getridley's serverless seller inbox with SES, S3, SQS, Lambda, DynamoDB and WebSockets, and why large attachments never travel through the queue.",
    kicker: 'Case study · Real estate',
    sections: ['Context', 'Why a claim check', 'What it cost', 'Reliability', 'Delivery'],
    current: 'EN',
    other: { text: 'عربي', href: AR_PATH },
    back: 'Mohamed Gamal',
    foot: 'Designed and built by me.',
  },
];

for (const p of PAGES) {
  test.describe(p.path, () => {
    test('renders with the right language, title and heading', async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      await expect(page.locator('html')).toHaveAttribute('dir', p.dir);
      await expect(page).toHaveTitle(p.title);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
      await expect(page.locator('.cs__kicker')).toHaveText(p.kicker);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', p.description);
      await expect(page.locator('.cs__head .tag')).toHaveText(['AWS SES', 'S3', 'SQS', 'Lambda', 'DynamoDB', 'WebSockets']);
      await expect(page.locator('.cs .section__title')).toHaveText(p.sections);
    });

    test('canonical and hreflang alternates', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${p.path}`);
      const alternates = await page.$$eval('link[rel="alternate"][hreflang]', (links) =>
        links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]),
      );
      expect(alternates).toEqual([
        ['en', `${SITE}${EN_PATH}`],
        ['ar', `${SITE}${AR_PATH}`],
        ['x-default', `${SITE}${EN_PATH}`],
      ]);
    });

    test('JSON-LD TechArticle without email or phone', async ({ page }) => {
      await page.goto(p.path);
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const data = JSON.parse(raw ?? '{}');
      expect(data['@type']).toBe('TechArticle');
      expect(data.headline).toBe(p.h1);
      expect(data.description).toBe(p.description);
      expect(data.inLanguage).toBe(p.lang);
      expect(data.url).toBe(`${SITE}${p.path}`);
      expect(data.author).toEqual({ '@type': 'Person', name: 'Mohamed Gamal', url: `${SITE}/` });
      expect(raw).not.toMatch(/email|telephone/i);
    });

    test('language switcher marks the current language and links the other', async ({ page }) => {
      await page.goto(p.path);
      const nav = page.locator('nav.cs__lang');
      await expect(nav.locator('[aria-current="page"]')).toHaveText(p.current);
      const other = nav.getByRole('link');
      await expect(other).toHaveCount(1);
      await expect(other).toHaveText(p.other.text);
      await expect(other).toHaveAttribute('href', p.other.href);
    });

    test('back links and footer', async ({ page }) => {
      await page.goto(p.path);
      const back = page.locator('a.cs__back');
      await expect(back).toHaveCount(2);
      for (const link of await back.all()) {
        await expect(link).toHaveAttribute('href', '/');
        await expect(link).toContainText(p.back);
      }
      await expect(page.locator('.cs__foot')).toContainText(p.foot);
    });

    test('loads without the trailing slash too', async ({ page }) => {
      const res = await page.goto(p.path.replace(/\/$/, ''));
      expect(res?.ok()).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
    });

    test('is listed in the sitemap', async ({ request }) => {
      const sitemap = await (await request.get('/sitemap-0.xml')).text();
      expect(sitemap).toContain(`<loc>${SITE}${p.path}</loc>`);
    });
  });
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run build && npx playwright test tests/case-study.spec.ts`
Expected: FAIL, the route returns 404 (`expect(res?.status()).toBe(200)` receives 404).

- [ ] **Step 4: Content collection**

Create `src/content.config.ts`:

```ts
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
```

- [ ] **Step 5: BaseLayout alternates, head slot and skip link; Tags label**

In `src/layouts/BaseLayout.astro`:

1. Add to `Props`: `alternates?: { lang: string; path: string }[];`
2. Change the destructuring line to:

```ts
const { title, description, lang = 'en', dir = 'ltr', path = '/', noindex = false, jsonLd, alternates = [] } = Astro.props;
const canonical = new URL(path, Astro.site).href;
const ogImage = new URL('/og.png', Astro.site).href;
const skipLabel = lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content';
```

3. Directly after `<link rel="canonical" href={canonical} />` add:

```astro
    {alternates.map((a) => <link rel="alternate" hreflang={a.lang} href={new URL(a.path, Astro.site).href} />)}
```

4. Directly before `</head>` (after the JSON-LD line) add `    <slot name="head" />`.
5. Replace the skip link with `<a class="skip-link" href="#main">{skipLabel}</a>`.

Replace `src/components/Tags.astro` with:

```astro
---
interface Props {
  items: string[];
  /** Accessible name of the list; Arabic pages pass their own. */
  label?: string;
}

const { items, label = 'Technologies' } = Astro.props;
---

<ul class="tags" aria-label={label}>
  {items.map((item) => <li class="tag">{item}</li>)}
</ul>
```

- [ ] **Step 6: Move shared styles to global.css**

Cut these rule blocks from `src/styles/home.css` unchanged and paste them at the end of `src/styles/global.css`, under a comment `/* Shared by Home and case studies. */`:

- `.tags { … }`
- `.tag { … }`
- the comment `/* Static glow at the top of the page (mobile, tablet, reduced motion). */` and `.spotlight { … }`
- the comment `/* Pointer spotlight (desktop only, toggled by Spotlight.astro). */` and `.has-spotlight .spotlight { … }`

Leave everything else in `home.css` where it is.

- [ ] **Step 7: CaseStudyLayout**

Create `src/layouts/CaseStudyLayout.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import Spotlight from '../components/Spotlight.astro';
import Tags from '../components/Tags.astro';
import { profile } from '../content/profile';
import '../styles/case-study.css';

interface Props {
  title: string;
  description: string;
  lead: string;
  lang: 'en' | 'ar';
  translationOf: string;
  label: string;
  tags: string[];
}

const { title, description, lead, lang, translationOf, label, tags } = Astro.props;

const UI = {
  en: {
    name: 'Mohamed Gamal',
    arrow: '←',
    kicker: 'Case study',
    languages: 'Language',
    tags: 'Technologies',
    foot: 'Designed and built by me.',
  },
  ar: {
    name: 'محمد جمال',
    arrow: '→',
    kicker: 'دراسة حالة',
    languages: 'اللغة',
    tags: 'التقنيات',
    foot: 'صمّمتُه وبنيتُه بنفسي.',
  },
} as const;

const ui = UI[lang];
const paths = { en: `/case-studies/${translationOf}/`, ar: `/ar/case-studies/${translationOf}/` };
const alternates = [
  { lang: 'en', path: paths.en },
  { lang: 'ar', path: paths.ar },
  { lang: 'x-default', path: paths.en },
];

// No email and no phone, by spec §8.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: title,
  description,
  inLanguage: lang,
  author: { '@type': 'Person', name: profile.name, url: `${profile.siteUrl}/` },
  url: new URL(paths[lang], Astro.site).href,
};
---

<BaseLayout
  title={`${title} · ${ui.name}`}
  description={description}
  lang={lang}
  dir={lang === 'ar' ? 'rtl' : 'ltr'}
  path={paths[lang]}
  alternates={alternates}
  jsonLd={jsonLd}
>
  <slot name="head" slot="head" />
  <Spotlight />
  <div class="cs">
    <header class="cs__top">
      <a class="cs__back" href="/"><span aria-hidden="true">{ui.arrow}</span> {ui.name}</a>
      <nav class="cs__lang" aria-label={ui.languages}>
        <ul>
          <li>
            {lang === 'en' ? <span aria-current="page">EN</span> : <a href={paths.en} lang="en" hreflang="en">EN</a>}
          </li>
          <li>
            {lang === 'ar' ? <span aria-current="page">عربي</span> : <a href={paths.ar} lang="ar" hreflang="ar">عربي</a>}
          </li>
        </ul>
      </nav>
    </header>
    <main id="main" tabindex="-1">
      <article>
        <header class="cs__head">
          <p class="cs__kicker">{ui.kicker} · {label}</p>
          <h1 class="cs__title">{title}</h1>
          <p class="cs__lead">{lead}</p>
          <Tags items={tags} label={ui.tags} />
        </header>
        <div class="cs__body">
          <slot />
        </div>
      </article>
    </main>
    <footer class="cs__foot">
      <p>{ui.foot}</p>
      <a class="cs__back" href="/"><span aria-hidden="true">{ui.arrow}</span> {ui.name}</a>
    </footer>
  </div>
</BaseLayout>
```

- [ ] **Step 8: Page styles**

Create `src/styles/case-study.css`:

```css
/* Case-study pages (spec §4). Mobile-first; desktop rules from 1024px, like Home. */

html[lang='ar'] body {
  font-family: 'Readex Pro', var(--font-sans);
}

.cs {
  /* Height of the sticky section title; the mobile diagram sticks right under it. */
  --cs-bar: 48px;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}

.cs__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-block: 24px;
}

.cs__back {
  display: inline-block;
  padding-block: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  transition: color 0.2s;
}

.cs__back:hover {
  color: var(--teal);
}

.cs__lang ul {
  display: flex;
  gap: 4px;
}

.cs__lang a,
.cs__lang [aria-current] {
  display: inline-block;
  padding-block: 4px;
  padding-inline: 10px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.cs__lang a {
  color: var(--muted);
  transition: color 0.2s;
}

.cs__lang a:hover {
  color: var(--ink);
}

.cs__lang [aria-current] {
  color: var(--ink);
  background: var(--tag-bg);
}

.cs__head {
  max-width: 45rem;
  padding-block: 40px 8px;
}

.cs__kicker {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
}

.cs__title {
  margin-block: 14px 16px;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: var(--ink);
  text-wrap: balance;
}

.cs__lead {
  margin-block-end: 20px;
  font-size: 1.0625rem;
  line-height: 1.75;
}

.cs .section {
  margin-block-start: 56px;
}

/* Prose keeps an article column; the section title and the scrolly use the full width. */
.cs .section > * {
  max-width: 45rem;
}

.cs .section > .section__title,
.cs .section > .scrolly {
  max-width: none;
}

.cs .section__title {
  position: sticky;
  inset-block-start: 0;
  z-index: 3;
  block-size: var(--cs-bar);
  margin-block-end: 8px;
  margin-inline: -24px;
  padding-block: 16px 12px;
  padding-inline: 24px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--title-bg);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.cs .section > p {
  margin-block-end: 16px;
  line-height: 1.8;
}

.cs code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--ink);
}

.cs__foot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 45rem;
  padding-block: 48px 64px;
  font-size: 0.8125rem;
  color: var(--muted);
}

/* Letter spacing breaks Arabic joining. */
html[lang='ar'] .cs__kicker,
html[lang='ar'] .cs__title,
html[lang='ar'] .cs .section__title {
  letter-spacing: 0;
}

html[lang='ar'] .cs__title {
  font-weight: 600;
  line-height: 1.35;
}

@media (min-width: 1024px) {
  .cs {
    padding-inline: 48px;
  }

  .cs .section__title {
    margin-inline: -48px;
    padding-inline: 48px;
  }
}
```

- [ ] **Step 9: English route**

Create `src/pages/case-studies/[slug].astro`:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('caseStudies', ({ data }) => data.lang === 'en');
  return entries.map((entry) => ({ params: { slug: entry.data.translationOf }, props: { entry } }));
}

interface Props {
  entry: CollectionEntry<'caseStudies'>;
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<CaseStudyLayout {...entry.data}>
  <Content />
</CaseStudyLayout>
```

- [ ] **Step 10: English MDX (prose sections)**

Create `src/content/case-studies/en/getridley.mdx`. The pipeline section is added in Task 3 and the explainer in Task 4; leave the marked places as they are.

```mdx
---
# Lead sources: A:51697763, A:9e6a4a8c, A:0c92c89f, F:1de76cfa.
title: "A real-time inbox for property sellers"
description: "How I built Getridley's serverless seller inbox with SES, S3, SQS, Lambda, DynamoDB and WebSockets, and why large attachments never travel through the queue."
lead: "Getridley sellers used to get buyer inquiries in their personal email. I built a serverless pipeline that receives every inquiry in code, keeps large attachments out of the queue, and puts the message in a Gmail-style inbox the moment it arrives."
lang: en
translationOf: getridley
label: "Real estate"
tags: ["AWS SES", "S3", "SQS", "Lambda", "DynamoDB", "WebSockets"]
---

import Section from '../../../components/Section.astro';

<Section id="context" title="Context">
{/* A:51697763 (context), A:9577edf2, A:0c92c89f */}

Property listings on Getridley already had a "Contact seller" button. It emailed the buyer's message straight to the seller's personal address, so every conversation lived in the seller's own inbox. The goal was an inbox inside the app that updates in real time, without taking away the email sellers were used to.

</Section>

{/* PIPELINE SECTION (Task 3) */}

<Section id="claim-check" title="Why a claim check">
{/* F:b9f5b694, F:14989da7, F:1de76cfa */}

Buyers don't only send questions. They attach ownership contracts and high-resolution photos of the property. The queue is there to coordinate work and retry it safely, not to carry files. So the file goes to S3, and the queue only carries a claim ticket: a small reference to where the message is stored.

{/* EXPLAINER (Task 4) */}

</Section>

<Section id="cost" title="What it cost">
{/* F:219c8540, F:9361e234. Costs of the design, not a claim that a cleanup policy was built. */}

A claim check is not free. Each email now has state in two places, the object in S3 and its metadata in DynamoDB, and processing is asynchronous, so the two have to be kept consistent. Keeping the original message is what makes reprocessing possible after a parser failure, but it also means the raw messages need a deliberate retention and cleanup policy.

</Section>

<Section id="reliability" title="Reliability">
{/* F:c36a8ea8, F:7f098636 */}

The queue is an SQS standard queue, not FIFO. Strict ordering was never needed: each inquiry is independent, and a conversation orders its messages by the time each one was received, not by queue order.

{/* F:5e83a966, F:71cb730b */}

A standard queue delivers at least once, so duplicates are expected, and the conditional write on the SES message ID turns a second delivery into a no-op.

{/* F:16f362d2, A:15674748 */}

A message that keeps failing is moved to a dead-letter queue by a redrive policy instead of retrying forever, and CloudWatch alarms send an email when something fails, so problems are noticed rather than discovered later.

{/* F:e4e94791, F:df0de13e */}

At the edge, SES's managed spam and virus scanning is on and the application acts on its verdicts. There is no custom antivirus engine and no separate malware-scanning pipeline to maintain.

</Section>

<Section id="delivery" title="Delivery">
{/* A:c128753c, A:638205f3 */}

The first scope had a one-month deadline. The core was done in the first two weeks, and the other two went to testing, bug fixes and UI polish before handoff. The engagement then continued for another month, in which I delivered a new onboarding flow and a new dashboard.

</Section>
```

The blank lines inside each `<Section>` are required: without them MDX does not parse the text as Markdown paragraphs.

- [ ] **Step 11: Run the tests to verify they pass**

Run: `npm run check && npm run build && npx playwright test tests/case-study.spec.ts tests/content-rules.spec.ts tests/contact-scan.spec.ts tests/rtl-ready.spec.ts`
Expected: PASS. `astro check` reports 0 errors.

- [ ] **Step 12: Run the whole suite**

Run: `npm test`
Expected: PASS (Home tests are unaffected; the moved styles still apply because `global.css` loads on every page).

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/content.config.ts src/layouts src/components/Tags.astro src/styles src/pages/case-studies src/content/case-studies tests/helpers/files.ts tests/case-study.spec.ts
git commit -m "Add case-study collection, layout and the English Getridley page"
```

---

### Task 2: Arabic page and Readex Pro

**Files:**
- Create: `src/pages/ar/case-studies/[slug].astro`, `src/content/case-studies/ar/getridley.mdx`
- Modify: `tests/case-study.spec.ts`

**Interfaces:**
- Consumes: `CaseStudyLayout` (props = collection schema, named slot `head`), collection `caseStudies`, `Section.astro`.
- Produces: the Arabic route; the Arabic MDX file with the same marked places (`PIPELINE SECTION (Task 3)`, `EXPLAINER (Task 4)`) that Tasks 3 and 4 fill.

- [ ] **Step 1: Write the failing test**

In `tests/case-study.spec.ts`, add this second object to the end of the `PAGES` array:

```ts
  {
    lang: 'ar',
    dir: 'rtl',
    path: AR_PATH,
    title: 'صندوق بريد لحظي لبائعي العقارات · محمد جمال',
    h1: 'صندوق بريد لحظي لبائعي العقارات',
    description:
      'كيف بنيت صندوق بريد البائعين في Getridley بـ SES وS3 وSQS وLambda وDynamoDB وWebSockets، ولماذا لا تمر المرفقات الكبيرة عبر الـ queue أبدًا.',
    kicker: 'دراسة حالة · عقارات',
    sections: ['السياق', 'لماذا claim check', 'ماذا كلّف هذا التصميم', 'الاعتمادية', 'التسليم'],
    current: 'عربي',
    other: { text: 'EN', href: EN_PATH },
    back: 'محمد جمال',
    foot: 'صمّمتُه وبنيتُه بنفسي.',
  },
```

Then append these tests at the end of the file:

```ts
test('the Arabic page loads Readex Pro and the English page does not', async ({ page }) => {
  const fonts: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('readex-pro')) fonts.push(req.url());
  });
  await page.goto(EN_PATH);
  await page.waitForLoadState('networkidle');
  expect(fonts).toEqual([]);
  await page.goto(AR_PATH);
  await page.waitForLoadState('networkidle');
  expect(fonts.some((url) => /readex-pro-arabic-400-normal.*\.woff2$/.test(url))).toBe(true);
});

test('Arabic text uses Readex Pro first', async ({ page }) => {
  await page.goto(AR_PATH);
  await expect(page.locator('body')).toHaveCSS('font-family', /^"Readex Pro"/);
});

test('the Arabic skip link is translated', async ({ page }) => {
  await page.goto(AR_PATH);
  await expect(page.locator('a.skip-link')).toHaveText('انتقل إلى المحتوى');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && npx playwright test tests/case-study.spec.ts`
Expected: FAIL on the Arabic entries (404 for `/ar/case-studies/getridley/`) and the font test.

- [ ] **Step 3: Arabic route with Readex Pro**

Create `src/pages/ar/case-studies/[slug].astro`. The font CSS is imported here, not in a shared layout, so English pages never load it (Astro bundles CSS per page):

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import CaseStudyLayout from '../../../layouts/CaseStudyLayout.astro';
import '@fontsource/readex-pro/arabic-400.css';
import '@fontsource/readex-pro/arabic-500.css';
import '@fontsource/readex-pro/arabic-600.css';
import readex400Url from '@fontsource/readex-pro/files/readex-pro-arabic-400-normal.woff2?url';
import readex600Url from '@fontsource/readex-pro/files/readex-pro-arabic-600-normal.woff2?url';

export async function getStaticPaths() {
  const entries = await getCollection('caseStudies', ({ data }) => data.lang === 'ar');
  return entries.map((entry) => ({ params: { slug: entry.data.translationOf }, props: { entry } }));
}

interface Props {
  entry: CollectionEntry<'caseStudies'>;
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<CaseStudyLayout {...entry.data}>
  <link slot="head" rel="preload" href={readex400Url} as="font" type="font/woff2" crossorigin />
  <link slot="head" rel="preload" href={readex600Url} as="font" type="font/woff2" crossorigin />
  <Content />
</CaseStudyLayout>
```

The spec asks for a 400 preload; the 600 preload is added because the Arabic H1 (the largest text on the page) uses 600, and a late swap there would cost layout shift.

- [ ] **Step 4: Arabic MDX (prose sections)**

Create `src/content/case-studies/ar/getridley.mdx`:

```mdx
---
# Lead sources: A:51697763, A:9e6a4a8c, A:0c92c89f, F:1de76cfa.
title: "صندوق بريد لحظي لبائعي العقارات"
description: "كيف بنيت صندوق بريد البائعين في Getridley بـ SES وS3 وSQS وLambda وDynamoDB وWebSockets، ولماذا لا تمر المرفقات الكبيرة عبر الـ queue أبدًا."
lead: "كانت استفسارات المشترين تصل إلى بائعي Getridley في بريدهم الشخصي. بنيتُ مسارًا serverless يستقبل كل استفسار داخل الكود، ويُبقي المرفقات الكبيرة خارج الـ queue، ويضع الرسالة في صندوق بريد يشبه Gmail لحظة وصولها."
lang: ar
translationOf: getridley
label: "عقارات"
tags: ["AWS SES", "S3", "SQS", "Lambda", "DynamoDB", "WebSockets"]
---

import Section from '../../../components/Section.astro';

<Section id="context" title="السياق">
{/* A:51697763 (context), A:9577edf2, A:0c92c89f */}

كان في صفحات العقارات على Getridley زر "Contact seller"، يرسل رسالة المشتري مباشرةً إلى البريد الشخصي للبائع، فكانت كل محادثة تعيش في صندوق البائع الخاص. كان الهدف صندوق بريد داخل التطبيق يتحدّث لحظيًا، دون أن يفقد البائعون البريد الذي اعتادوا عليه.

</Section>

{/* PIPELINE SECTION (Task 3) */}

<Section id="claim-check" title="لماذا claim check">
{/* F:b9f5b694, F:14989da7, F:1de76cfa */}

المشترون لا يرسلون أسئلة فقط، بل يرفقون عقود الملكية وصورًا عالية الدقة للعقار. وظيفة الـ queue تنسيق العمل وإعادة محاولته بأمان، لا نقل الملفات. لذلك يذهب الملف إلى S3، ولا يحمل الـ queue سوى "إيصال استلام": مرجع صغير لمكان تخزين الرسالة.

{/* EXPLAINER (Task 4) */}

</Section>

<Section id="cost" title="ماذا كلّف هذا التصميم">
{/* F:219c8540, F:9361e234 */}

الـ claim check ليس مجانيًا. صار لكل بريد حالة في مكانين، الملف في S3 والـ metadata في DynamoDB، والمعالجة غير متزامنة، فلا بد من الحفاظ على اتساقهما. والاحتفاظ بالرسالة الأصلية هو ما يجعل إعادة المعالجة ممكنة بعد فشل التحليل، لكنه يعني أيضًا أن الرسائل الخام تحتاج إلى سياسة واضحة للاحتفاظ بها وتنظيفها.

</Section>

<Section id="reliability" title="الاعتمادية">
{/* F:c36a8ea8, F:7f098636 */}

الـ queue هنا SQS standard queue وليس FIFO. لم يكن الترتيب الصارم مطلوبًا أصلًا: كل استفسار مستقل عن غيره، والمحادثة ترتّب رسائلها حسب وقت استلام كل رسالة، لا حسب ترتيبها في الـ queue.

{/* F:5e83a966, F:71cb730b */}

الـ standard queue يسلّم الرسالة مرة واحدة على الأقل، فالتكرار متوقع، والـ conditional write على الـ SES message ID يجعل التسليم الثاني بلا أثر.

{/* F:16f362d2, A:15674748 */}

الرسالة التي يتكرر فشلها تنتقل إلى dead-letter queue عبر redrive policy بدلًا من إعادة المحاولة إلى ما لا نهاية، وترسل تنبيهات CloudWatch بريدًا عند حدوث أي فشل، فتُكتشف المشكلات فور حدوثها لا بعد فوات الأوان.

{/* F:e4e94791, F:df0de13e */}

وعند نقطة الدخول، فحص الـ spam والفيروسات المُدار في SES مفعّل، والتطبيق يتصرف بناءً على نتائجه. لا يوجد محرك antivirus خاص ولا مسار منفصل لفحص الملفات الضارة يحتاج إلى صيانة.

</Section>

<Section id="delivery" title="التسليم">
{/* A:c128753c, A:638205f3 */}

كان للنطاق الأول موعد تسليم مدته شهر. انتهى الجزء الأساسي في أول أسبوعين، وذهب الأسبوعان الآخران إلى الاختبار وإصلاح الأخطاء وتحسين الواجهة قبل التسليم. ثم استمر العمل شهرًا إضافيًا، سلّمتُ فيه onboarding flow جديدًا وdashboard جديدة.

</Section>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run check && npm run build && npx playwright test tests/case-study.spec.ts tests/content-rules.spec.ts tests/contact-scan.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ar src/content/case-studies/ar tests/case-study.spec.ts
git commit -m "Add the Arabic Getridley page with Readex Pro"
```

---

### Task 3: Pipeline scrollytelling diagram

**Files:**
- Create: `src/components/case-study/pipeline.ts`, `src/components/case-study/PipelineScrolly.astro`, `tests/case-study-scrolly.spec.ts`
- Modify: `src/content/case-studies/en/getridley.mdx`, `src/content/case-studies/ar/getridley.mdx`, `src/styles/case-study.css`, `tests/case-study.spec.ts`

**Interfaces:**
- Consumes: `.cs` custom property `--cs-bar` (48px) and the sticky `.cs .section__title` from Task 1; the MDX marker `{/* PIPELINE SECTION (Task 3) */}` in both MDX files.
- Produces:
  - `pipeline.ts`: `type NodeId`, `interface PipelineNode`, `type PipelineLabels = Record<NodeId, { main: string; sub?: string }>`, `NODES`, `EDGES`, `PACKET_PATH`, `VIEW_W`, `VIEW_H`, `labelX(node, rtl)`.
  - `PipelineScrolly` props `{ steps: { title: string; body: string }[]; labels: PipelineLabels; dir: 'ltr' | 'rtl' }`.
  - DOM contract used by tests: root `.scrolly[data-scrolly]` (gets `is-live` when the script runs), `.scrolly__stage`, `li.scrolly__step[data-step="1..6"][data-packet]` (active one has `is-on`), `rect.scrolly__node[data-node]`, `path.scrolly__edge`, `g.scrolly__label[data-label]`, `circle.scrolly__pkt` with one `<mpath>`. Every element that lights has `data-s` = space-separated step numbers and gets `is-on`.

Two deliberate deviations from the spec, both forced by its own tests:
- Inactive steps are dimmed with `color: var(--muted)` instead of `opacity: .35`. At 35% opacity the step text fails WCAG contrast, and the spec requires zero serious axe violations. `--muted` is 5.33:1 on the background.
- The active step is computed from step positions on every animation frame after a scroll (and on resize), instead of an IntersectionObserver. An observer only fires when an element crosses the band, so a jump (End key, anchor, scroll restoration) that lands between steps would leave the old step lit. The rule is the same as the spec's band: the last step whose top has passed the middle of the viewport.

- [ ] **Step 1: Write the failing test**

Create `tests/case-study-scrolly.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';

const EN = '/case-studies/getridley/';
const AR = '/ar/case-studies/getridley/';

async function centerStep(page: Page, n: number) {
  await page
    .locator(`.scrolly__step[data-step="${n}"]`)
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

function litNodes(page: Page) {
  return page.$$eval('.scrolly rect.scrolly__node.is-on', (els) => els.map((el) => el.getAttribute('data-node')));
}

const activeStep = (page: Page) => page.locator('.scrolly__step.is-on');

test('step 4 in the middle is the only active step and lights SQS and the DLQ', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 4);
  await expect(activeStep(page)).toHaveCount(1);
  await expect(activeStep(page)).toHaveAttribute('data-step', '4');
  await expect.poll(() => litNodes(page)).toEqual(['sqs', 'dlq']);
  await expect(page.locator('.scrolly mpath')).toHaveAttribute('href', '#ps-e3');
});

test('step 6 lights WebSocket and the seller inbox', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 6);
  await expect(activeStep(page)).toHaveAttribute('data-step', '6');
  await expect.poll(() => litNodes(page)).toEqual(['websocket', 'inbox']);
  await expect(page.locator('.scrolly mpath')).toHaveAttribute('href', '#ps-e9');
});

test('jumping past several steps leaves exactly one active step', async ({ page }) => {
  await page.goto(EN);
  // Land with the middle of the viewport in the padding under the last step: no step crosses the middle.
  await page.evaluate(() => {
    const steps = document.querySelector('.scrolly__steps')!;
    const bottom = steps.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom - window.innerHeight * 0.6, behavior: 'instant' });
  });
  await expect(activeStep(page)).toHaveCount(1);
  await expect(activeStep(page)).toHaveAttribute('data-step', '6');
  await page.keyboard.press('Home');
  await expect(activeStep(page)).toHaveAttribute('data-step', '1');
  await expect(activeStep(page)).toHaveCount(1);
});

test('reloading mid-pipeline restores the matching step', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 5);
  await expect(activeStep(page)).toHaveAttribute('data-step', '5');
  await page.reload();
  await expect(activeStep(page)).toHaveAttribute('data-step', '5');
});

test('the stage moves at the 1024px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto(EN);
  const stage = page.locator('.scrolly__stage');
  await expect(stage).toHaveCSS('position', 'sticky');
  await expect(stage).toHaveCSS('top', '48px');
  await expect(stage).toHaveCSS('height', '240px');
  await page.setViewportSize({ width: 1024, height: 800 });
  // calc(50vh - 190px) at 800px tall.
  await expect(stage).toHaveCSS('top', '210px');
  await expect(stage).toHaveCSS('height', '380px');
});

test('the Arabic diagram is mirrored but its labels are not', async ({ page }) => {
  await page.goto(AR);
  const buyer = (await page.locator('.scrolly rect[data-node="buyer"]').boundingBox())!;
  const ses = (await page.locator('.scrolly rect[data-node="ses"]').boundingBox())!;
  expect(buyer.x).toBeGreaterThan(ses.x);
  const label = page.locator('.scrolly [data-label="buyer"] text').first();
  await expect(label).toHaveText('المشتري');
  const scaleX = await label.evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a);
  expect(scaleX).toBeGreaterThan(0);
});

test('Latin code inside Arabic text stays left-to-right', async ({ page }) => {
  await page.goto(AR);
  const code = page.locator('.scrolly__step code').first();
  await expect(code).toHaveText('inbox.getridley.com');
  await expect(code).toHaveCSS('direction', 'ltr');
  await expect(code).toHaveCSS('unicode-bidi', 'isolate');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every step is readable at full strength and no packet is drawn', async ({ page }) => {
    await page.goto(EN);
    const steps = page.locator('.scrolly__step');
    await expect(steps).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(steps.nth(i)).toBeVisible();
      await expect(steps.nth(i)).toHaveCSS('opacity', '1');
      await expect(steps.nth(i).locator('h3')).toHaveCSS('color', 'rgb(230, 237, 248)');
    }
    await expect(page.locator('.scrolly__pkt')).toBeHidden();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no packet, but highlighting still follows the scroll', async ({ page }) => {
    await page.goto(EN);
    await centerStep(page, 4);
    await expect(activeStep(page)).toHaveAttribute('data-step', '4');
    await expect(page.locator('.scrolly__pkt')).toBeHidden();
  });
});
```

Also update the section lists in `tests/case-study.spec.ts`: in the English `PAGES` entry set `sections: ['Context', 'The pipeline', 'Why a claim check', 'What it cost', 'Reliability', 'Delivery']`, and in the Arabic entry `sections: ['السياق', 'مسار الرسالة', 'لماذا claim check', 'ماذا كلّف هذا التصميم', 'الاعتمادية', 'التسليم']`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && npx playwright test tests/case-study-scrolly.spec.ts tests/case-study.spec.ts`
Expected: FAIL (no `.scrolly__step` elements; section lists differ).

- [ ] **Step 3: Diagram data**

Create `src/components/case-study/pipeline.ts`:

```ts
// Geometry of the pipeline diagram (spec §7.1). Coordinates are in the SVG's 620 × 330 viewBox.

export const VIEW_W = 620;
export const VIEW_H = 330;

export type NodeId = 'buyer' | 'ses' | 's3' | 'sqs' | 'dlq' | 'lambda' | 'dynamodb' | 'websocket' | 'inbox';

export interface PipelineNode {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Steps (1–6) in which the node is lit. */
  steps: number[];
  dashed?: boolean;
}

export interface PipelineEdge {
  id: string;
  d: string;
  steps: number[];
  dashed?: boolean;
}

export type PipelineLabels = Record<NodeId, { main: string; sub?: string }>;

export const NODES: PipelineNode[] = [
  { id: 'buyer', x: 16, y: 140, w: 88, h: 44, steps: [1] },
  { id: 'ses', x: 134, y: 140, w: 88, h: 44, steps: [1, 2] },
  { id: 's3', x: 252, y: 40, w: 88, h: 44, steps: [3, 5] },
  { id: 'sqs', x: 252, y: 140, w: 88, h: 44, steps: [4] },
  { id: 'dlq', x: 252, y: 240, w: 88, h: 40, steps: [4], dashed: true },
  { id: 'lambda', x: 370, y: 140, w: 88, h: 44, steps: [5] },
  { id: 'dynamodb', x: 370, y: 240, w: 88, h: 44, steps: [5] },
  { id: 'websocket', x: 370, y: 40, w: 88, h: 44, steps: [6] },
  { id: 'inbox', x: 500, y: 40, w: 104, h: 44, steps: [6] },
];

export const EDGES: PipelineEdge[] = [
  { id: 'e1', d: 'M104 162 H134', steps: [1] },
  { id: 'e2', d: 'M222 152 C238 152 236 62 252 62', steps: [3] },
  { id: 'e3', d: 'M222 162 H252', steps: [4] },
  { id: 'e4', d: 'M296 184 V240', steps: [4], dashed: true },
  { id: 'e5', d: 'M340 162 H370', steps: [5] },
  { id: 'e6', d: 'M370 152 C354 152 356 62 340 62', steps: [5], dashed: true },
  { id: 'e7', d: 'M414 184 V240', steps: [5] },
  { id: 'e8', d: 'M414 140 V84', steps: [6] },
  { id: 'e9', d: 'M458 62 H500', steps: [6] },
];

/** The edge the packet travels in each step, steps 1–6 in order. */
export const PACKET_PATH = ['e1', 'e1', 'e2', 'e3', 'e5', 'e9'];

/** Labels are drawn outside the mirrored group, so in RTL their x is mirrored by hand. */
export function labelX(node: PipelineNode, rtl: boolean): number {
  const center = node.x + node.w / 2;
  return rtl ? VIEW_W - center : center;
}
```

- [ ] **Step 4: The component**

Create `src/components/case-study/PipelineScrolly.astro`:

```astro
---
import { EDGES, NODES, PACKET_PATH, VIEW_H, VIEW_W, labelX, type PipelineLabels } from './pipeline';

interface Props {
  /** Six steps in order. `body` is trusted HTML from the MDX file (it may contain <code>). */
  steps: { title: string; body: string }[];
  labels: PipelineLabels;
  dir: 'ltr' | 'rtl';
}

const { steps, labels, dir } = Astro.props;
const rtl = dir === 'rtl';
const lit = (stepList: number[]) => stepList.join(' ');
const pad = (n: number) => String(n).padStart(2, '0');
---

<div class="scrolly" data-scrolly>
  <div class="scrolly__stage">
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true" focusable="false">
      <g transform={rtl ? `matrix(-1 0 0 1 ${VIEW_W} 0)` : undefined}>
        {
          EDGES.map((e) => (
            <path
              id={`ps-${e.id}`}
              class:list={['scrolly__edge', { 'scrolly__edge--dash': e.dashed }]}
              d={e.d}
              data-s={lit(e.steps)}
            />
          ))
        }
        {
          NODES.map((n) => (
            <rect
              class:list={['scrolly__node', { 'scrolly__node--dash': n.dashed }]}
              data-node={n.id}
              data-s={lit(n.steps)}
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              rx="8"
            />
          ))
        }
        <circle class="scrolly__pkt" r="4">
          <animateMotion dur="1.4s" repeatCount="indefinite">
            <mpath href={`#ps-${PACKET_PATH[0]}`} />
          </animateMotion>
        </circle>
      </g>
      {
        NODES.map((n) => {
          const label = labels[n.id];
          const x = labelX(n, rtl);
          return (
            <g class="scrolly__label" data-label={n.id} data-s={lit(n.steps)}>
              <text x={x} y={label.sub ? n.y + 17 : n.y + n.h / 2}>
                {label.main}
              </text>
              {label.sub && (
                <text class="scrolly__sub" x={x} y={n.y + 32}>
                  {label.sub}
                </text>
              )}
            </g>
          );
        })
      }
    </svg>
  </div>
  <ol class="scrolly__steps">
    {
      steps.map((step, i) => (
        <li class="scrolly__step" data-step={i + 1} data-packet={`ps-${PACKET_PATH[i]}`}>
          <p class="scrolly__n" aria-hidden="true">
            {pad(i + 1)} / {pad(steps.length)}
          </p>
          <h3>{step.title}</h3>
          <p set:html={step.body} />
        </li>
      ))
    }
  </ol>
</div>

<script>
  // The active step is the last one whose top has passed the middle of the viewport (step 1 before that).
  // Measured on every frame after a scroll, so jumps and scroll restoration land on the right step.
  for (const root of document.querySelectorAll<HTMLElement>('[data-scrolly]')) {
    const steps = [...root.querySelectorAll<HTMLElement>('.scrolly__step')];
    const parts = [...root.querySelectorAll<SVGElement>('[data-s]')];
    const mpath = root.querySelector('mpath');
    let active = 0;
    let frame = 0;

    const activate = (n: number) => {
      if (n === active) return;
      active = n;
      for (const step of steps) step.classList.toggle('is-on', step.dataset.step === String(n));
      for (const part of parts) part.classList.toggle('is-on', (part.dataset.s ?? '').split(' ').includes(String(n)));
      const packet = steps[n - 1]?.dataset.packet;
      if (mpath && packet) mpath.setAttribute('href', `#${packet}`);
    };

    const sync = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let n = 1;
      for (const step of steps) if (step.getBoundingClientRect().top <= middle) n = Number(step.dataset.step);
      activate(n);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    root.classList.add('is-live');
    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
</script>
```

- [ ] **Step 5: Scrolly styles**

Append to `src/styles/case-study.css`:

```css
/* ---------- Pipeline scrolly (spec §7.1) ---------- */

/* Block, not grid, on mobile: a sticky grid item can only stick inside its own grid area. */
.scrolly {
  display: block;
}

.scrolly__stage {
  position: sticky;
  inset-block-start: var(--cs-bar);
  z-index: 2;
  height: 240px;
  background: var(--bg);
}

.scrolly__stage svg {
  display: block;
  width: 100%;
  height: 100%;
}

.scrolly__steps {
  list-style: none;
  margin: 0;
  padding-block: 20vh 30vh;
  padding-inline: 0;
}

.scrolly__step {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 62vh;
}

.scrolly__n {
  margin-block-end: 10px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--teal);
}

.scrolly__step h3 {
  margin-block-end: 10px;
  font-size: 1.3125rem;
  font-weight: 600;
  color: var(--ink);
  transition: color 0.3s;
}

.scrolly__step p:not(.scrolly__n) {
  font-size: 1rem;
  line-height: 1.75;
  transition: color 0.3s;
}

/* Dimming only after the script runs; colour, not opacity, so dimmed text keeps AA contrast. */
.scrolly.is-live .scrolly__step:not(.is-on) h3,
.scrolly.is-live .scrolly__step:not(.is-on) p,
.scrolly.is-live .scrolly__step:not(.is-on) code {
  color: var(--muted);
}

.scrolly__edge {
  fill: none;
  stroke: #243045;
  stroke-width: 1.6;
  transition: stroke 0.3s;
}

.scrolly__edge--dash {
  stroke-dasharray: 4 4;
}

.scrolly__edge.is-on {
  stroke: var(--teal);
}

.scrolly__node {
  fill: #111a2e;
  stroke: var(--line);
  stroke-width: 1.2;
  transition:
    fill 0.3s,
    stroke 0.3s;
}

.scrolly__node--dash {
  stroke-dasharray: 4 3;
}

.scrolly__node.is-on {
  fill: rgba(45, 212, 191, 0.08);
  stroke: var(--teal);
}

.scrolly__label text {
  fill: var(--muted);
  font-size: 11.5px;
  font-weight: 500;
  text-anchor: middle;
  dominant-baseline: middle;
  transition: fill 0.3s;
}

.scrolly__label .scrolly__sub {
  fill: #526077;
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.scrolly__label.is-on text {
  fill: var(--ink);
}

.scrolly__label.is-on .scrolly__sub {
  fill: var(--teal);
}

.scrolly__pkt {
  fill: var(--teal);
}

.scrolly:not(.is-live) .scrolly__pkt {
  display: none;
}

html[lang='ar'] .scrolly__label .scrolly__sub {
  font-family: inherit;
}

/* Latin code inside Arabic text keeps its own direction. */
html[dir='rtl'] .cs code {
  direction: ltr;
  unicode-bidi: isolate;
}

@media (min-width: 1024px) {
  .scrolly {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 56px;
  }

  .scrolly__stage {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    inset-block-start: calc(50vh - 190px);
    height: 380px;
    margin-block-start: 20vh;
    background: none;
  }

  .scrolly__steps {
    grid-column: 1;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scrolly__pkt {
    display: none;
  }
}
```

- [ ] **Step 6: Pipeline section in the English MDX**

In `src/content/case-studies/en/getridley.mdx`:

1. Add this import under the `Section` import:

```mdx
import PipelineScrolly from '../../../components/case-study/PipelineScrolly.astro';
```

2. Under the imports, add the step and label data:

```mdx
{/* Step sources: 1 A:51697763, A:9577edf2 · 2 F:e4e94791, F:df0de13e · 3 F:b9f5b694, F:1de76cfa · 4 F:1de76cfa, F:16f362d2 · 5 A:51697763, decision 31ae17de · 6 A:0c92c89f, F:fc706c71, F:95133f62 */}

export const steps = [
  {
    title: 'The entry point already existed',
    body: 'Listings had a “Contact seller” button that emailed the seller directly. I rerouted it to a custom mail server at <code>inbox.getridley.com</code>, so every inquiry is received in code instead of disappearing into a personal inbox.',
  },
  {
    title: 'SES receives the mail',
    body: 'Amazon SES accepts the message with its managed spam and virus scanning turned on. The application handles the verdicts; there is no custom antivirus engine to maintain.',
  },
  {
    title: 'The raw message goes to S3',
    body: 'Buyers attach ownership contracts and high-resolution property photos. The full raw message and its attachments are stored in S3, not passed around.',
  },
  {
    title: 'Only a reference enters the queue',
    body: 'SQS carries a small object reference and routing metadata, never the attachment itself. Messages that keep failing are moved to a dead-letter queue instead of retrying forever.',
  },
  {
    title: 'Lambda does the work',
    body: 'A Lambda function reads the message from S3, opens a buyer–seller conversation containing it, and stores searchable metadata in DynamoDB.',
  },
  {
    title: 'The seller sees it instantly',
    body: 'API Gateway WebSockets push the new message to the seller’s dashboard in real time. The same Lambda function also sends the seller a copy through SES, so nothing about their old habit breaks.',
  },
];

export const pipelineLabels = {
  buyer: { main: 'Buyer', sub: 'Contact seller' },
  ses: { main: 'SES', sub: 'spam + virus' },
  s3: { main: 'S3', sub: 'raw message' },
  sqs: { main: 'SQS', sub: 'reference only' },
  dlq: { main: 'DLQ' },
  lambda: { main: 'Lambda', sub: 'parse + thread' },
  dynamodb: { main: 'DynamoDB', sub: 'metadata' },
  websocket: { main: 'WebSocket', sub: 'API Gateway' },
  inbox: { main: 'Seller inbox', sub: 'real time' },
};
```

3. Replace the line `{/* PIPELINE SECTION (Task 3) */}` with:

```mdx
<Section id="pipeline" title="The pipeline">
  <PipelineScrolly steps={steps} labels={pipelineLabels} dir="ltr" />
</Section>
```

- [ ] **Step 7: Pipeline section in the Arabic MDX**

In `src/content/case-studies/ar/getridley.mdx`:

1. Add the same import under the `Section` import:

```mdx
import PipelineScrolly from '../../../components/case-study/PipelineScrolly.astro';
```

2. Under the imports, add:

```mdx
{/* Step sources: 1 A:51697763, A:9577edf2 · 2 F:e4e94791, F:df0de13e · 3 F:b9f5b694, F:1de76cfa · 4 F:1de76cfa, F:16f362d2 · 5 A:51697763, decision 31ae17de · 6 A:0c92c89f, F:fc706c71, F:95133f62 */}

export const steps = [
  {
    title: 'نقطة البداية كانت موجودة',
    body: 'كان في صفحات العقارات زر “Contact seller” يرسل البريد إلى البائع مباشرةً. حوّلتُه إلى خادم بريد مخصص على <code>inbox.getridley.com</code>، فصار كل استفسار يُستقبل داخل الكود بدلًا من أن يضيع في بريد شخصي.',
  },
  {
    title: 'SES يستقبل البريد',
    body: 'يستقبل Amazon SES الرسالة مع تفعيل فحص الـ spam والفيروسات المُدار. يتعامل التطبيق مع نتائج الفحص، ولا يوجد محرك antivirus خاص يحتاج إلى صيانة.',
  },
  {
    title: 'الرسالة الخام تذهب إلى S3',
    body: 'يرفق المشترون عقود الملكية وصورًا عالية الدقة للعقار. تُخزَّن الرسالة الخام كاملةً بمرفقاتها في S3، ولا تُمرَّر من مكان إلى آخر.',
  },
  {
    title: 'مرجع فقط يدخل الـ queue',
    body: 'يحمل SQS مرجعًا صغيرًا للملف وبيانات التوجيه، ولا يحمل المرفق نفسه أبدًا. والرسائل التي يتكرر فشلها تنتقل إلى dead-letter queue بدلًا من إعادة المحاولة إلى ما لا نهاية.',
  },
  {
    title: 'Lambda تقوم بالعمل',
    body: 'تقرأ دالة Lambda الرسالة من S3، وتفتح محادثة بين المشتري والبائع تحتوي عليها، وتحفظ metadata قابلة للبحث في DynamoDB.',
  },
  {
    title: 'البائع يراها فورًا',
    body: 'تدفع API Gateway WebSockets الرسالة الجديدة إلى الـ dashboard الخاصة بالبائع لحظيًا. وترسل دالة Lambda نفسها نسخةً إلى البائع عبر SES، فلا يتغير شيء في عادته القديمة.',
  },
];

export const pipelineLabels = {
  buyer: { main: 'المشتري', sub: 'زر التواصل' },
  ses: { main: 'SES', sub: 'فحص spam وفيروسات' },
  s3: { main: 'S3', sub: 'الرسالة الخام' },
  sqs: { main: 'SQS', sub: 'مرجع فقط' },
  dlq: { main: 'DLQ' },
  lambda: { main: 'Lambda', sub: 'تحليل + محادثة' },
  dynamodb: { main: 'DynamoDB', sub: 'metadata' },
  websocket: { main: 'WebSocket', sub: 'API Gateway' },
  inbox: { main: 'صندوق البائع', sub: 'لحظيًا' },
};
```

3. Replace `{/* PIPELINE SECTION (Task 3) */}` with:

```mdx
<Section id="pipeline" title="مسار الرسالة">
  <PipelineScrolly steps={steps} labels={pipelineLabels} dir="rtl" />
</Section>
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm run check && npm run build && npx playwright test tests/case-study-scrolly.spec.ts tests/case-study.spec.ts tests/rtl-ready.spec.ts tests/content-rules.spec.ts tests/contact-scan.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/case-study src/content/case-studies src/styles/case-study.css tests/case-study-scrolly.spec.ts tests/case-study.spec.ts
git commit -m "Add the pipeline scrollytelling diagram to the Getridley case study"
```

---

### Task 4: Claim-check explainer

**Files:**
- Create: `src/components/case-study/ClaimCheckExplainer.astro`, `tests/case-study-explainer.spec.ts`
- Modify: `src/content/case-studies/en/getridley.mdx`, `src/content/case-studies/ar/getridley.mdx`, `src/styles/case-study.css`

**Interfaces:**
- Consumes: the MDX marker `{/* EXPLAINER (Task 4) */}` inside the `claim-check` section of both MDX files.
- Produces:
  - `ClaimCheckExplainer` props `{ title: string; scenarios: { id: 'normal' | 'large' | 'fail' | 'dup'; label: string; caption: string }[]; alt: { label: string; caption: string }; svgLabels: ExplainerLabels; dir: 'ltr' | 'rtl' }`, where `ExplainerLabels` is exported from the component file.
  - DOM contract used by tests: root `.ex[data-ex]` with `data-mode` (`normal|large|fail|dup`) and `data-alt` (`on|off`), `is-live` after the script runs; `.ex__btns` (`role="group"`) holding `button[data-m][aria-pressed]`; `.ex__alt` holding `button.ex__switch[role="switch"][aria-checked]`; `.ex__cap[data-cap="normal|large|queueit|fail|dup"]` each with an `h3.ex__cap-title`; packet groups `g.ex__pk`; scenario overlays `[data-only]`; node rects `rect.ex__n[data-node]`.

The switch is 40 × 24px instead of the mockup's 34 × 19px so it meets the 24px target size that axe checks.

- [ ] **Step 1: Write the failing test**

Create `tests/case-study-explainer.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const EN = '/case-studies/getridley/';
const AR = '/ar/case-studies/getridley/';
const SCENARIOS = ['normal', 'large', 'fail', 'dup'];

test('each scenario button presses itself and shows only its caption', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  const buttons = ex.locator('.ex__btns button');
  await expect(buttons).toHaveText(['A short question', 'A large attachment', 'Parsing fails', 'It arrives twice']);
  await expect(ex.locator('.ex__title')).toHaveText('Try it: what happens when');
  for (const [i, id] of SCENARIOS.entries()) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute('aria-pressed', 'true');
    await expect(ex.locator('.ex__btns button[aria-pressed="true"]')).toHaveCount(1);
    await expect(ex.locator('.ex__cap').filter({ visible: true })).toHaveCount(1);
    await expect(ex.locator(`.ex__cap[data-cap="${id}"]`)).toBeVisible();
    await expect(ex.locator(`.ex__pk[data-only~="${id}"]`)).toBeVisible();
  }
});

test('the switch shows only in "large", turns on the queue-it state and resets', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  const sw = ex.getByRole('switch', { name: 'What if the file went in the queue instead?' });
  await expect(sw).toBeHidden();
  await ex.getByRole('button', { name: 'A large attachment' }).click();
  await expect(sw).toBeVisible();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(ex).toHaveAttribute('data-alt', 'on');
  await expect(ex.locator('.ex__cap[data-cap="queueit"]')).toBeVisible();
  await expect(ex.locator('.ex__cap').filter({ visible: true })).toHaveCount(1);
  await expect(ex.locator('.ex__pk[data-only~="queueit"]')).toBeVisible();
  await expect(ex.locator('.ex__pk[data-only~="large"]')).toBeHidden();
  await ex.getByRole('button', { name: 'Parsing fails' }).click();
  await expect(sw).toBeHidden();
  await ex.getByRole('button', { name: 'A large attachment' }).click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(ex.locator('.ex__cap[data-cap="large"]')).toBeVisible();
});

test('keyboard: Tab reaches the buttons and the switch, Enter and Space work, focus is visible', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  await ex.getByRole('button', { name: 'A short question' }).focus();
  await page.keyboard.press('Tab');
  const large = ex.getByRole('button', { name: 'A large attachment' });
  await expect(large).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(large).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const sw = ex.getByRole('switch');
  await expect(sw).toBeFocused();
  await expect(sw).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
});

test('the Arabic explainer is mirrored, labelled in Arabic, and its text is not mirrored', async ({ page }) => {
  await page.goto(AR);
  const ex = page.locator('[data-ex]');
  await expect(ex.locator('.ex__btns button')).toHaveText(['سؤال قصير', 'مرفق كبير', 'فشل التحليل', 'وصلت مرتين']);
  await expect(ex.locator('.ex__title')).toHaveText('جرّب: ماذا يحدث عندما');
  const ses = (await ex.locator('rect[data-node="ses"]').boundingBox())!;
  const s3 = (await ex.locator('rect[data-node="s3"]').boundingBox())!;
  expect(ses.x).toBeGreaterThan(s3.x);
  const scaleX = await ex.locator('text.ex__label').first().evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a);
  expect(scaleX).toBeGreaterThan(0);
  await ex.getByRole('button', { name: 'مرفق كبير' }).click();
  await expect(ex.getByRole('switch', { name: 'ماذا لو وُضع الملف في الـ queue؟' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all five captions are listed with headings and the controls are hidden', async ({ page }) => {
    await page.goto(EN);
    const ex = page.locator('[data-ex]');
    const caps = ex.locator('.ex__cap');
    await expect(caps).toHaveCount(5);
    for (let i = 0; i < 5; i++) await expect(caps.nth(i)).toBeVisible();
    await expect(ex.locator('.ex__cap-title')).toHaveText([
      'A short question',
      'A large attachment',
      'What if the file went in the queue instead?',
      'Parsing fails',
      'It arrives twice',
    ]);
    await expect(ex.locator('.ex__btns')).toBeHidden();
    await expect(ex.locator('.ex__alt')).toBeHidden();
    await expect(ex.locator('[data-only~="normal"]').first()).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no packets in any scenario', async ({ page }) => {
    await page.goto(EN);
    const ex = page.locator('[data-ex]');
    for (const name of ['A short question', 'A large attachment', 'Parsing fails', 'It arrives twice']) {
      await ex.getByRole('button', { name }).click();
      await expect(ex.locator('.ex__pk').filter({ visible: true })).toHaveCount(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && npx playwright test tests/case-study-explainer.spec.ts`
Expected: FAIL (no `[data-ex]` element).

- [ ] **Step 3: The component**

Create `src/components/case-study/ClaimCheckExplainer.astro`. This ports the approved mockup (`.superpowers/brainstorm/589-1791584624/content/claimcheck-explainer.html`) with three changes: shapes and packets sit in a mirrored group while all text sits outside it; colours come from classes instead of presentation attributes; packet `begin` delays are written as negative offsets (`begin = delay − dur`) so no dot waits at the SVG origin before it starts.

```astro
---
type ScenarioId = 'normal' | 'large' | 'fail' | 'dup';

export interface ExplainerLabels {
  receives: string;
  rawMessage: string;
  reference: string;
  parse: string;
  conversation: string;
  files: string;
  overLimit: string;
  retryMoves: string;
  stillHere: string;
  retry: string;
  emailAlert: string;
  oneConversation: string;
  rejected: string;
  key: string;
}

interface Props {
  title: string;
  scenarios: { id: ScenarioId; label: string; caption: string }[];
  /** The "what if the file went in the queue" switch, shown only in the large scenario. */
  alt: { label: string; caption: string };
  svgLabels: ExplainerLabels;
  dir: 'ltr' | 'rtl';
}

const { title, scenarios, alt, svgLabels: t, dir } = Astro.props;
const W = 600;
const rtl = dir === 'rtl';
const tx = (x: number) => (rtl ? W - x : x);
const mirror = rtl ? `matrix(-1 0 0 1 ${W} 0)` : undefined;
// Captions in reading order; the switch caption follows "large".
const captions = scenarios.flatMap((s) =>
  s.id === 'large' ? [s, { id: 'queueit', label: alt.label, caption: alt.caption }] : [s],
);
---

<div class="ex" data-ex data-mode="normal" data-alt="off">
  <div class="ex__top">
    <p class="ex__title" id="cc-title">{title}</p>
    <div class="ex__btns" role="group" aria-labelledby="cc-title">
      {
        scenarios.map((s, i) => (
          <button type="button" data-m={s.id} aria-pressed={i === 0 ? 'true' : 'false'}>
            {s.label}
          </button>
        ))
      }
    </div>
  </div>
  <div class="ex__alt">
    <button type="button" class="ex__switch" role="switch" aria-checked="false" aria-labelledby="cc-alt"></button>
    <span id="cc-alt">{alt.label}</span>
  </div>

  <svg viewBox="0 0 600 236" aria-hidden="true" focusable="false">
    <defs>
      <path id="cc-s3" d="M100 104 C130 104 130 42 160 42"></path>
      <path id="cc-q" d="M100 116 H160"></path>
      <path id="cc-l" d="M260 122 H320"></path>
      <path id="cc-read" d="M365 100 C365 58 300 42 260 42"></path>
      <path id="cc-db" d="M410 122 H470"></path>
      <path id="cc-dlq" d="M210 144 V182"></path>
      <path id="cc-back" d="M345 144 C340 170 250 170 236 144"></path>
      <path id="cc-cw" d="M260 200 H320"></path>
    </defs>

    <g transform={mirror}>
      <use href="#cc-s3" class="ex__w"></use>
      <use href="#cc-q" class="ex__w"></use>
      <use href="#cc-l" class="ex__w"></use>
      <use href="#cc-read" class="ex__w"></use>
      <use href="#cc-db" class="ex__w"></use>
      <use href="#cc-dlq" class="ex__w"></use>

      <rect class="ex__n" data-node="ses" x="20" y="88" width="80" height="44" rx="8"></rect>
      <rect class="ex__n" data-node="s3" x="160" y="20" width="100" height="44" rx="8"></rect>
      <rect class="ex__n" data-node="sqs" x="160" y="100" width="100" height="44" rx="8"></rect>
      <rect class="ex__n ex__n--dash" data-node="dlq" x="160" y="182" width="100" height="36" rx="8"></rect>
      <rect class="ex__n" data-node="lambda" x="320" y="100" width="90" height="44" rx="8"></rect>
      <rect class="ex__n" data-node="dynamodb" x="470" y="100" width="110" height="44" rx="8"></rect>

      <g data-only="large queueit">
        <rect class="ex__icon" x="270" y="20" width="16" height="20" rx="2"></rect>
        <rect class="ex__icon" x="290" y="24" width="20" height="16" rx="2"></rect>
        <rect class="ex__icon" x="314" y="24" width="20" height="16" rx="2"></rect>
      </g>
      <g data-only="queueit">
        <rect class="ex__n ex__n--rose" x="160" y="100" width="100" height="44" rx="8"></rect>
        <use href="#cc-back" class="ex__loop ex__loop--rose"></use>
      </g>
      <g data-only="fail">
        <use href="#cc-back" class="ex__loop ex__loop--amber"></use>
        <rect class="ex__outline--amber" x="320" y="100" width="90" height="44" rx="8"></rect>
        <rect class="ex__n ex__n--amber ex__n--dash" x="160" y="182" width="100" height="36" rx="8"></rect>
        <use href="#cc-cw" class="ex__w"></use>
        <rect class="ex__n ex__n--cw" x="320" y="182" width="110" height="36" rx="8"></rect>
      </g>

      <g class="ex__pk" data-only="normal">
        <circle class="ex__dot" r="4"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#cc-s3"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#cc-q"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" begin="-1.1s" repeatCount="indefinite"><mpath href="#cc-l"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="4"><animateMotion dur="1.6s" begin="-0.8s" repeatCount="indefinite"><mpath href="#cc-read"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" begin="-0.5s" repeatCount="indefinite"><mpath href="#cc-db"></mpath></animateMotion></circle>
      </g>
      <g class="ex__pk" data-only="large">
        <circle class="ex__dot" r="9" fill-opacity="0.85"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#cc-s3"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#cc-q"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" begin="-1.1s" repeatCount="indefinite"><mpath href="#cc-l"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" begin="-0.5s" repeatCount="indefinite"><mpath href="#cc-db"></mpath></animateMotion></circle>
      </g>
      <g class="ex__pk" data-only="queueit">
        <circle class="ex__dot ex__dot--rose" r="10" fill-opacity="0.85"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#cc-q"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--rose" r="9" fill-opacity="0.6"><animateMotion dur="2.6s" begin="-1.6s" repeatCount="indefinite"><mpath href="#cc-back"></mpath></animateMotion></circle>
      </g>
      <g class="ex__pk" data-only="fail">
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#cc-q"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--amber" r="3.5"><animateMotion dur="2.4s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#cc-l"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--amber" r="3.5"><animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite"><mpath href="#cc-back"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--amber" r="3.5"><animateMotion dur="2.4s" begin="-1.8s" repeatCount="indefinite"><mpath href="#cc-dlq"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--amber" r="3"><animateMotion dur="2.4s" begin="-1s" repeatCount="indefinite"><mpath href="#cc-cw"></mpath></animateMotion></circle>
      </g>
      <g class="ex__pk" data-only="dup">
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.8s" repeatCount="indefinite"><mpath href="#cc-l"></mpath></animateMotion></circle>
        <circle class="ex__dot" r="3.5"><animateMotion dur="1.8s" repeatCount="indefinite"><mpath href="#cc-db"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--rose" r="3.5"><animateMotion dur="1.8s" begin="-1.2s" repeatCount="indefinite"><mpath href="#cc-l"></mpath></animateMotion></circle>
        <circle class="ex__dot ex__dot--rose" r="3.5"><animateMotion dur="1.8s" begin="-1.2s" repeatCount="indefinite" keyPoints="0;.85;0" keyTimes="0;.6;1" calcMode="linear"><mpath href="#cc-db"></mpath></animateMotion></circle>
      </g>
    </g>

    <g>
      <text class="ex__label" x={tx(60)} y="104">SES</text>
      <text class="ex__sub" x={tx(60)} y="119">{t.receives}</text>
      <text class="ex__label" x={tx(210)} y="36">S3</text>
      <text class="ex__sub" x={tx(210)} y="51">{t.rawMessage}</text>
      <g class="ex__base-sqs">
        <text class="ex__label" x={tx(210)} y="116">SQS</text>
        <text class="ex__sub" x={tx(210)} y="131">{t.reference}</text>
      </g>
      <text class="ex__label ex__base-dlq" x={tx(210)} y="200">DLQ</text>
      <text class="ex__label" x={tx(365)} y="116">Lambda</text>
      <text class="ex__sub" x={tx(365)} y="131">{t.parse}</text>
      <text class="ex__label" x={tx(525)} y="116">DynamoDB</text>
      <text class="ex__sub" x={tx(525)} y="131">{t.conversation}</text>

      <g data-only="large queueit">
        <text class="ex__note ex__note--teal ex__pdf" x={tx(278)} y="33">PDF</text>
        <text class="ex__note ex__note--teal" x={tx(300)} y="54">{t.files}</text>
      </g>
      <g data-only="queueit">
        <text class="ex__label ex__label--rose" x={tx(210)} y="116">SQS</text>
        <text class="ex__sub ex__sub--rose" x={tx(210)} y="131">{t.overLimit}</text>
        <text class="ex__note ex__note--rose" x={tx(290)} y="178">{t.retryMoves}</text>
      </g>
      <g data-only="fail">
        <text class="ex__note ex__note--amber" x={tx(292)} y="176">{t.retry}</text>
        <text class="ex__label ex__label--amber" x={tx(210)} y="200">DLQ</text>
        <text class="ex__label" x={tx(375)} y="196">CloudWatch</text>
        <text class="ex__sub ex__sub--amber" x={tx(375)} y="209">{t.emailAlert}</text>
        <text class="ex__note ex__note--teal" x={tx(210)} y="80">{t.stillHere}</text>
      </g>
      <g data-only="dup">
        <text class="ex__note ex__note--teal" x={tx(525)} y="160">{t.oneConversation}</text>
        <text class="ex__note ex__note--rose" x={tx(525)} y="176">{t.rejected}</text>
        <text class="ex__note ex__note--muted" x={tx(440)} y="96">{t.key}</text>
      </g>
    </g>
  </svg>

  <div class="ex__caps" aria-live="polite">
    {
      captions.map((c) => (
        <div class="ex__cap" data-cap={c.id}>
          <h3 class="ex__cap-title">{c.label}</h3>
          <p>{c.caption}</p>
        </div>
      ))
    }
  </div>
</div>

<script>
  for (const ex of document.querySelectorAll<HTMLElement>('[data-ex]')) {
    const buttons = [...ex.querySelectorAll<HTMLButtonElement>('button[data-m]')];
    const toggle = ex.querySelector<HTMLButtonElement>('[role="switch"]');

    const setAlt = (on: boolean) => {
      ex.dataset.alt = on ? 'on' : 'off';
      toggle?.setAttribute('aria-checked', String(on));
    };

    for (const button of buttons) {
      button.addEventListener('click', () => {
        ex.dataset.mode = button.dataset.m;
        for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
        if (button.dataset.m !== 'large') setAlt(false);
      });
    }

    toggle?.addEventListener('click', () => setAlt(toggle.getAttribute('aria-checked') !== 'true'));
    ex.classList.add('is-live');
  }
</script>
```

- [ ] **Step 4: Explainer styles**

Append to `src/styles/case-study.css`:

```css
/* ---------- Claim-check explainer (spec §7.2) ---------- */

.ex {
  margin-block: 26px 30px;
  padding-block: 18px 14px;
  padding-inline: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
}

.ex__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-block-end: 10px;
}

.ex__title {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.ex__btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ex__btns button {
  padding-block: 6px;
  padding-inline: 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--body);
  font-family: var(--font-mono);
  font-size: 0.71875rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.ex__btns button:hover {
  border-color: #64748b;
  color: var(--ink);
}

.ex__btns button[aria-pressed='true'] {
  border-color: var(--teal);
  color: var(--teal);
  background: rgba(45, 212, 191, 0.08);
}

.ex__alt {
  display: none;
  align-items: center;
  gap: 10px;
  margin-block-end: 6px;
  font-size: 0.8125rem;
}

.ex.is-live[data-mode='large'] .ex__alt {
  display: flex;
}

.ex__switch {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.ex__switch::after {
  content: '';
  position: absolute;
  inset-block-start: 3px;
  inset-inline-start: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--muted);
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.ex__switch[aria-checked='true'] {
  border-color: #fb7185;
}

.ex__switch[aria-checked='true']::after {
  transform: translateX(16px);
  background: #fb7185;
}

html[dir='rtl'] .ex__switch[aria-checked='true']::after {
  transform: translateX(-16px);
}

.ex svg {
  display: block;
  width: 100%;
  height: auto;
  margin-block: 6px;
}

.ex__w {
  fill: none;
  stroke: #334155;
  stroke-width: 1.4;
  stroke-dasharray: 3 4;
}

.ex__n {
  fill: #111a2e;
  stroke: var(--line);
  stroke-width: 1.2;
}

.ex__n--dash {
  stroke-dasharray: 4 3;
}

.ex__n--rose {
  fill: #2a1520;
  stroke: #fb7185;
}

.ex__n--amber {
  fill: #2a1f0e;
  stroke: #fbbf24;
}

.ex__n--cw {
  stroke: #fbbf24;
}

.ex__outline--amber {
  fill: none;
  stroke: #fbbf24;
}

.ex__icon {
  fill: none;
  stroke: var(--teal);
}

.ex__loop {
  fill: none;
  stroke-dasharray: 2 3;
}

.ex__loop--rose {
  stroke: #fb7185;
  stroke-opacity: 0.5;
}

.ex__loop--amber {
  stroke: #fbbf24;
  stroke-opacity: 0.55;
}

.ex__dot {
  fill: var(--teal);
}

.ex__dot--rose {
  fill: #fb7185;
}

.ex__dot--amber {
  fill: #fbbf24;
}

.ex__label,
.ex__sub {
  text-anchor: middle;
  dominant-baseline: middle;
}

.ex__label {
  fill: #cbd5e1;
  font-size: 11.5px;
  font-weight: 500;
}

.ex__sub {
  fill: #526077;
  font-family: var(--font-mono);
  font-size: 9px;
}

.ex__note {
  text-anchor: middle;
  font-size: 9.5px;
}

.ex__pdf {
  font-size: 7px;
}

.ex__note--teal {
  fill: var(--teal);
}

.ex__note--rose,
.ex__label--rose,
.ex__sub--rose {
  fill: #fb7185;
}

.ex__note--amber,
.ex__label--amber,
.ex__sub--amber {
  fill: #fbbf24;
}

.ex__note--muted {
  fill: var(--muted);
}

/* Scenario overlays: [data-only] lists the states an element belongs to. */
.ex [data-only] {
  display: none;
}

.ex[data-mode='normal'] [data-only~='normal'],
.ex[data-mode='large'][data-alt='off'] [data-only~='large'],
.ex[data-mode='large'][data-alt='on'] [data-only~='queueit'],
.ex[data-mode='fail'] [data-only~='fail'],
.ex[data-mode='dup'] [data-only~='dup'] {
  display: inline;
}

/* The overlay labels replace these, so hide the originals underneath. */
.ex[data-mode='large'][data-alt='on'] .ex__base-sqs,
.ex[data-mode='fail'] .ex__base-dlq {
  display: none;
}

.ex__caps {
  margin-block-start: 10px;
  font-size: 0.875rem;
  line-height: 1.65;
}

.ex__cap + .ex__cap {
  margin-block-start: 14px;
}

.ex__cap-title {
  margin-block-end: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
}

/* Without JavaScript: no controls, every caption listed under its heading. */
.ex:not(.is-live) .ex__top {
  display: none;
}

.ex.is-live .ex__caps {
  min-height: 70px;
}

.ex.is-live .ex__cap,
.ex.is-live .ex__cap-title {
  display: none;
}

.ex.is-live[data-mode='normal'] .ex__cap[data-cap='normal'],
.ex.is-live[data-mode='large'][data-alt='off'] .ex__cap[data-cap='large'],
.ex.is-live[data-mode='large'][data-alt='on'] .ex__cap[data-cap='queueit'],
.ex.is-live[data-mode='fail'] .ex__cap[data-cap='fail'],
.ex.is-live[data-mode='dup'] .ex__cap[data-cap='dup'] {
  display: block;
}

html[lang='ar'] .ex__title {
  font-size: 0.8125rem;
  letter-spacing: 0;
}

html[lang='ar'] .ex__btns button {
  font-family: inherit;
  font-size: 0.8125rem;
}

html[lang='ar'] .ex__sub {
  font-family: inherit;
}

@media (prefers-reduced-motion: reduce) {
  .ex .ex__pk {
    display: none !important;
  }
}
```

`!important` is needed in the reduced-motion rule because the scenario rules above it are more specific.

- [ ] **Step 5: Explainer in the English MDX**

In `src/content/case-studies/en/getridley.mdx`:

1. Add the import under the other imports:

```mdx
import ClaimCheckExplainer from '../../../components/case-study/ClaimCheckExplainer.astro';
```

2. Under the `pipelineLabels` export, add:

```mdx
{/* Caption sources: normal/large F:1de76cfa · queue-it decision 31ae17de alternatives, F:1d55d7d7 · fail F:16f362d2, A:15674748, F:9361e234 · dup F:c36a8ea8, F:5e83a966, F:71cb730b */}

export const explainer = {
  title: 'Try it: what happens when',
  scenarios: [
    {
      id: 'normal',
      label: 'A short question',
      caption: 'SES stores the raw message in S3 and puts a small reference on the queue. Lambda takes the reference, reads the message from S3, and opens the buyer–seller conversation in DynamoDB.',
    },
    {
      id: 'large',
      label: 'A large attachment',
      caption: 'The contract and photos go into S3 with the raw message. The queue message is the same small reference as before, so the queue never sees how big the email was, and a retry only moves a few bytes.',
    },
    {
      id: 'fail',
      label: 'Parsing fails',
      caption: 'Lambda can’t parse the message, so it goes back to the queue and is retried. After repeated failures, the dead-letter queue takes it instead of retrying forever, and CloudWatch sends an email alert. The original is still in S3, so it can be processed again after a fix.',
    },
    {
      id: 'dup',
      label: 'It arrives twice',
      caption: 'A standard queue delivers at least once, so the same message can arrive twice. The SES message ID is the conversation’s key, written with a conditional write: the second write is rejected, and the seller still sees one conversation.',
    },
  ],
  alt: {
    label: 'What if the file went in the queue instead?',
    caption: 'A natural first idea is to Base64 the file into the queue message. But SQS messages have a size limit that a contract plus a set of photos can exceed, and every retry would move the whole file again. Splitting it into chunks only trades that for ordering, reassembly, partial failures and cleanup.',
  },
  svgLabels: {
    receives: 'receives',
    rawMessage: 'raw message',
    reference: 'reference',
    parse: 'parse',
    conversation: 'conversation',
    files: 'contract + photos',
    overLimit: 'over size limit',
    retryMoves: 'every retry moves the whole file',
    stillHere: 'still here ✓',
    retry: 'retry',
    emailAlert: 'email alert',
    oneConversation: '1 conversation',
    rejected: '2nd write rejected ✕',
    key: 'key: SES message ID',
  },
};
```

3. Replace `{/* EXPLAINER (Task 4) */}` with:

```mdx
<ClaimCheckExplainer {...explainer} dir="ltr" />
```

- [ ] **Step 6: Explainer in the Arabic MDX**

In `src/content/case-studies/ar/getridley.mdx`:

1. Add the same import:

```mdx
import ClaimCheckExplainer from '../../../components/case-study/ClaimCheckExplainer.astro';
```

2. Under the `pipelineLabels` export, add:

```mdx
{/* Caption sources: normal/large F:1de76cfa · queue-it decision 31ae17de alternatives, F:1d55d7d7 · fail F:16f362d2, A:15674748, F:9361e234 · dup F:c36a8ea8, F:5e83a966, F:71cb730b */}

export const explainer = {
  title: 'جرّب: ماذا يحدث عندما',
  scenarios: [
    {
      id: 'normal',
      label: 'سؤال قصير',
      caption: 'يخزّن SES الرسالة الخام في S3 ويضع مرجعًا صغيرًا في الـ queue. تأخذ Lambda المرجع، وتقرأ الرسالة من S3، وتفتح محادثة المشتري والبائع في DynamoDB.',
    },
    {
      id: 'large',
      label: 'مرفق كبير',
      caption: 'يذهب العقد والصور إلى S3 مع الرسالة الخام. أما رسالة الـ queue فهي المرجع الصغير نفسه، فلا يعرف الـ queue حجم البريد أصلًا، وأي retry لا ينقل سوى بضعة bytes.',
    },
    {
      id: 'fail',
      label: 'فشل التحليل',
      caption: 'لا تستطيع Lambda تحليل الرسالة، فتعود إلى الـ queue ويُعاد تنفيذها. وبعد تكرار الفشل تنتقل إلى الـ dead-letter queue بدلًا من إعادة المحاولة إلى ما لا نهاية، ويرسل CloudWatch تنبيهًا بالبريد. والرسالة الأصلية ما زالت في S3، فيمكن معالجتها من جديد بعد الإصلاح.',
    },
    {
      id: 'dup',
      label: 'وصلت مرتين',
      caption: 'الـ standard queue يسلّم الرسالة مرة واحدة على الأقل، فقد تصل الرسالة نفسها مرتين. الـ SES message ID هو مفتاح المحادثة، ويُكتب بـ conditional write: تُرفض الكتابة الثانية، ويرى البائع محادثة واحدة فقط.',
    },
  ],
  alt: {
    label: 'ماذا لو وُضع الملف في الـ queue؟',
    caption: 'الفكرة الأولى الطبيعية هي تحويل الملف إلى Base64 ووضعه في رسالة الـ queue. لكن لرسائل SQS حدًّا أقصى للحجم قد يتجاوزه عقد مع مجموعة صور، وكل retry سينقل الملف كاملًا من جديد. وتقسيمه إلى أجزاء لا يحل المشكلة، بل يستبدل بها مشكلات الترتيب وإعادة التجميع والفشل الجزئي والتنظيف.',
  },
  svgLabels: {
    receives: 'يستقبل',
    rawMessage: 'الرسالة الخام',
    reference: 'مرجع',
    parse: 'تحليل',
    conversation: 'محادثة',
    files: 'عقد + صور',
    overLimit: 'تجاوز الحد',
    retryMoves: 'كل retry ينقل الملف كاملًا',
    stillHere: 'ما زالت هنا ✓',
    retry: 'retry',
    emailAlert: 'تنبيه بالبريد',
    oneConversation: 'محادثة واحدة',
    rejected: 'رُفضت الكتابة الثانية ✕',
    key: 'المفتاح: SES message ID',
  },
};
```

3. Replace `{/* EXPLAINER (Task 4) */}` with:

```mdx
<ClaimCheckExplainer {...explainer} dir="rtl" />
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run check && npm run build && npx playwright test tests/case-study-explainer.spec.ts tests/case-study-scrolly.spec.ts tests/case-study.spec.ts tests/rtl-ready.spec.ts tests/content-rules.spec.ts tests/contact-scan.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/case-study/ClaimCheckExplainer.astro src/content/case-studies src/styles/case-study.css tests/case-study-explainer.spec.ts
git commit -m "Add the interactive claim-check explainer to the Getridley case study"
```

---

### Task 5: Home link and quality gates

**Files:**
- Modify: `src/content/projects.ts`, `tests/home-content.spec.ts`, `tests/desktop.spec.ts`, `tests/quality.spec.ts`, `lighthouserc.json`

**Interfaces:**
- Consumes: both case-study routes (Tasks 1–4); `Row.astro`, which already renders `a.row__link` and `span.row__arrow` when `href` is set.
- Produces: the final, fully gated feature.

- [ ] **Step 1: Write the failing tests**

In `tests/home-content.spec.ts`, replace the test `'v1 rows are not links and show no arrow'` with:

```ts
test('only the Getridley row links to its case study', async ({ page }) => {
  const links = page.locator('.row a');
  await expect(links).toHaveCount(1);
  await expect(links).toHaveAttribute('href', '/case-studies/getridley/');
  await expect(links).toContainText('Getridley');
  await expect(page.locator('.row__arrow')).toHaveCount(1);
});
```

In `tests/desktop.spec.ts`, replace the test `'rows are not in the tab order in v1'` with:

```ts
test('only the Getridley row is in the tab order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.row a')).toHaveCount(1);
  await expect(page.locator('.row [tabindex]')).toHaveCount(0);
});

test('the linked Getridley row turns teal on hover', async ({ page }) => {
  await page.goto('/');
  const row = page.locator('#projects .row--link');
  await row.hover();
  await expect(row.locator('.row__title')).toHaveCSS('color', 'rgb(94, 234, 212)');
});
```

Replace `tests/quality.spec.ts` with:

```ts
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CASE_STUDIES = ['/case-studies/getridley/', '/ar/case-studies/getridley/'];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
}

async function scriptBytes(page: Page, request: APIRequestContext) {
  const inline = await page.$$eval('script:not([src]):not([type="application/ld+json"])', (scripts) =>
    scripts.map((s) => s.textContent ?? '').join(''),
  );
  const sources = await page.$$eval('script[src]', (scripts) => scripts.map((s) => (s as HTMLScriptElement).src));
  let total = Buffer.byteLength(inline);
  for (const src of sources) total += (await (await request.get(src)).body()).length;
  return total;
}

async function layoutShift(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          // LayoutShift is not in TypeScript's DOM lib yet, so describe the two fields used here.
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 1000);
      }),
  );
}

test('axe: home on desktop', async ({ page }) => {
  await page.goto('/');
  expect(await seriousViolations(page)).toEqual([]);
});

for (const path of CASE_STUDIES) {
  test(`axe: ${path} on desktop`, async ({ page }) => {
    await page.goto(path);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('axe: home on mobile', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });

  for (const path of CASE_STUDIES) {
    test(`axe: ${path} on mobile`, async ({ page }) => {
      await page.goto(path);
      expect(await seriousViolations(page)).toEqual([]);
    });

    test(`no horizontal overflow at 375px: ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const panel = (await page.locator('[data-ex]').boundingBox())!;
      const svg = (await page.locator('[data-ex] svg').boundingBox())!;
      expect(svg.width).toBeLessThanOrEqual(panel.width);
      const buttons = page.locator('[data-ex] .ex__btns');
      const box = (await buttons.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width);
    });
  }
});

test('axe: 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  expect(await seriousViolations(page)).toEqual([]);
});

test('internal links resolve and external links are well-formed https', async ({ page, request }) => {
  for (const path of ['/', '/does-not-exist', ...CASE_STUDIES]) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (links) => links.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      if (href.startsWith('#')) {
        await expect(page.locator(href), href).toHaveCount(1);
      } else if (href.startsWith('/')) {
        expect((await request.get(href)).status(), href).toBe(200);
      } else {
        const url = new URL(href);
        expect(url.protocol, href).toBe('https:');
        expect(['github.com', 'linkedin.com']).toContain(url.hostname);
      }
    }
  }
});

test('home ships under 5KB of JavaScript', async ({ page, request }) => {
  await page.goto('/');
  expect(await scriptBytes(page, request)).toBeLessThan(5120);
});

for (const path of CASE_STUDIES) {
  test(`${path} ships under 8KB of JavaScript`, async ({ page, request }) => {
    await page.goto(path);
    expect(await scriptBytes(page, request)).toBeLessThan(8192);
  });
}

for (const path of ['/', ...CASE_STUDIES]) {
  test(`no layout shift on load: ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await layoutShift(page)).toBeLessThan(0.02);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/home-content.spec.ts tests/desktop.spec.ts tests/quality.spec.ts`
Expected: FAIL on the three Home row tests (no `.row a` yet). The quality tests for the case-study pages should already pass; if any fail, fix the cause in the case-study code (not in the test) before going on.

- [ ] **Step 3: Link the Getridley row**

In `src/content/projects.ts`, add `href` to the Getridley item, after `tags`:

```ts
    tags: ['AWS SES', 'AWS Lambda', 'DynamoDB', 'WebSockets'],
    href: '/case-studies/getridley/',
  },
```

- [ ] **Step 4: Add both pages to Lighthouse CI**

In `lighthouserc.json`, set `ci.collect.url` to:

```json
      "url": [
        "http://localhost/index.html",
        "http://localhost/case-studies/getridley/index.html",
        "http://localhost/ar/case-studies/getridley/index.html"
      ],
```

- [ ] **Step 5: Run everything**

Run: `npm run verify`
Expected: `astro check` 0 errors, build succeeds, every Playwright test passes.

Run: `npm run lhci`
Expected: all three URLs meet ≥ 0.95 in performance, accessibility, best practices and SEO.

- [ ] **Step 6: Commit**

```bash
git add src/content/projects.ts tests/home-content.spec.ts tests/desktop.spec.ts tests/quality.spec.ts lighthouserc.json
git commit -m "Link Home to the Getridley case study and gate both pages on axe, links, JS, CLS and Lighthouse"
```
