# Portfolio v1 Implementation Plan

> **For agentic workers:** pi implements this plan one task at a time (`pi -p "<task text>"`, run from the repo root). After each task, Claude reviews the diff against the spec and this plan before the next task starts. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the English Home page, `/resume.pdf` and a 404 page as a static Astro site on GitHub Pages at `https://mohamedelsonny.github.io/`.

**Architecture:** Astro 7 static output. There is no client framework, only three small inline scripts: spotlight, active nav and email assembly. Content lives in typed TypeScript files under `src/content/`, and only `src/pages/index.astro` imports them; components receive props. Playwright runs against `astro preview` locally and in CI, and against the live site when `BASE_URL` is set. GitHub Actions builds, checks, tests and deploys to Pages.

**Tech Stack:**
- **Runtime:** Node 24 (engines `>=22.12.0`), Astro 7.3.8, TypeScript 6.0.3 (strict), @astrojs/check 0.9.10, @astrojs/sitemap 3.7.4.
- **Fonts:** @fontsource/inter 5.3.0, @fontsource/jetbrains-mono 5.3.0.
- **Testing:** @playwright/test 1.64.0, @axe-core/playwright 4.13.0, unpdf 1.8.1, @lhci/cli 0.15.1.

**Spec:** `docs/superpowers/specs/2026-10-09-portfolio-design.md`. Read it with this plan. The spec wins on intent; this plan wins on exact code.

## Global Constraints

- **Phone:** no phone number in any page, the JSON-LD, meta tags, or any source or text file. `public/resume.pdf` is the only exception: it is the normal CV and keeps the phone and email.
- **Email:** the whole email address never appears in any built text file. It is split across `data-email-user` / `data-email-domain` and joined into `mailto:` by script. Without JavaScript, the link points to LinkedIn.
- **Never print or commit the phone number,** not even in tests, fixtures, commit messages or logs. Tests detect phones by pattern (`scripts/lib/contact-scan.mjs`) and report only the kind and position, never the matched text.
- **Content:** copy comes verbatim from spec §7. Every sentence in `src/content/*.ts` has a source comment with the vault record ID.
- **Layout:** all CSS uses logical properties. `margin-left`, `padding-right`, `left:`, `right:`, `text-align: left/right` and `float: left/right` are forbidden; a test enforces this.
- **Breakpoints:** desktop is `min-width: 1024px`; mobile and tablet are below it.
- **Tokens:**
  - `--bg #0c1222`, `--ink #e6edf8`, `--body #94a3b8`, `--teal #5eead4`
  - `--muted #7c8aa0` (raised from `#64748b`: 3.92:1 fails AA, 5.33:1 passes; 4.77:1 on the row-hover background)
  - `--tag-bg rgba(45,212,191,.1)`, `--spot rgba(56,189,248,.09)`, `--row-hover rgba(30,41,59,.5)`
- **Client JS:** under 5120 bytes in total on the Home page.
- **Lighthouse:** ≥ 0.95 in all four categories (mobile, the default).
- **Rows in v1:** no row is a link. No ↗ arrow, no `<a>` inside `.row`, rows are not in the tab order.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Pushing:** never push or deploy without the user's explicit approval in chat.

## Review Focus

1. **Keyboard only:** Tab order is skip link → nav (About, Experience, Projects) → GitHub → LinkedIn → Email → résumé link. The skip link moves focus to `<main>`, and Enter on a nav item scrolls to its section. *(Task 4: `tests/desktop.spec.ts`)*
2. **320px phone:** there is no horizontal scroll at 320px wide. *(Task 5: `tests/mobile-motion.spec.ts`)*
3. **JavaScript disabled:** all content is readable, Email falls back to LinkedIn, and the nav anchors still jump to sections. *(Task 3: `tests/email.spec.ts`; Task 4: `tests/desktop.spec.ts`)*
4. **Deep link:** opening `/#experience` shows that section and marks its nav item as current. *(Task 4: `tests/desktop.spec.ts`)*
5. **RTL readiness:** CSS has no physical properties, and setting `dir="rtl"` mirrors the desktop columns. *(Task 2: `tests/rtl-ready.spec.ts`; Task 4: `tests/desktop.spec.ts`)*

## File map

```
package.json, astro.config.mjs, tsconfig.json, playwright.config.ts, lighthouserc.json, .gitignore
.github/workflows/deploy.yml
src/layouts/BaseLayout.astro         html shell, fonts, meta, skip link
src/styles/tokens.css                design tokens
src/styles/global.css                reset, focus, skip link, reduced motion
src/styles/home.css                  Home layout, rows, desktop and mobile rules
src/styles/notfound.css              404 page
src/content/types.ts                 Profile, RichText, ExperienceItem, ProjectItem
src/content/profile.ts | experience.ts | projects.ts
src/components/Hero.astro            name, title, lead
src/components/Nav.astro             section nav + active-section script
src/components/Section.astro         section + h2
src/components/About.astro           rich-text paragraphs
src/components/Row.astro             one experience or project row (replaces ExperienceRow/ProjectRow)
src/components/Tags.astro            tag pills
src/components/Social.astro          GitHub, LinkedIn, Email
src/components/EmailLink.astro       protected email link + script
src/components/Spotlight.astro       spotlight layer + pointer script
src/pages/index.astro | 404.astro
public/favicon.svg | robots.txt | og.png | resume.pdf
scripts/lib/contact-scan.mjs         findPrivateContact(text)
scripts/lib/pdf-text.mjs             pdfText(buffer)
scripts/sync-resume.mjs              build CV in ai-cv-tailor, copy to public/resume.pdf
scripts/make-og.mjs                  render public/og.png
tests/helpers/files.ts               file walking helpers
tests/*.spec.ts
```

**Deviations from the spec's repo layout, on purpose:**
- **One `Row.astro`:** it replaces `ExperienceRow`/`ProjectRow`, because their markup is identical.
- **Sync script:** `sync-resume.mjs` is Node, not sh/ps1, so it runs the same on Windows and Linux.
- **Two extra components:** `About.astro` and `EmailLink.astro` keep each component to one job.
- **Content types:** components import types (never data) from `src/content/types.ts`.

---

### Task 1: Scaffold, layout and smoke test

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `playwright.config.ts`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`
- Test: `tests/smoke.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces:
  - `BaseLayout` props `{ title: string; description: string; lang?: 'en' | 'ar'; dir?: 'ltr' | 'rtl'; path?: string; noindex?: boolean; jsonLd?: Record<string, unknown> }`
  - A skip link `a.skip-link[href="#main"]`
  - npm scripts `dev`, `build`, `preview`, `check`, `test`, `verify`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "mohamedelsonny-portfolio",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4321",
    "check": "astro check",
    "test": "playwright test",
    "verify": "npm run check && npm run build && npm test",
    "sync-resume": "node scripts/sync-resume.mjs",
    "og": "node scripts/make-og.mjs",
    "lhci": "lhci autorun"
  }
}
```

- [ ] **Step 2: Install pinned dependencies**

Run:
```bash
npm install astro@7.3.8 @astrojs/sitemap@3.7.4 @fontsource/inter@5.3.0 @fontsource/jetbrains-mono@5.3.0
npm install -D @astrojs/check@0.9.10 typescript@6.0.3 @playwright/test@1.64.0 @axe-core/playwright@4.13.0 unpdf@1.8.1 @lhci/cli@0.15.1
npx playwright install chromium
```
Expected: `package-lock.json` is created and there are no errors. Do not use TypeScript 7; @astrojs/check 0.9.10 does not support it.

- [ ] **Step 3: Create the configs**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mohamedelsonny.github.io',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: { prefixDefaultLocale: false },
  },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

// BASE_URL set: test the live site. Unset: build first, then test `astro preview`.
const externalBase = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: externalBase ?? 'http://localhost:4321',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: externalBase
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
```

Replace `.gitignore` with:
```
.superpowers/
node_modules/
dist/
.astro/
.lighthouseci/
test-results/
playwright-report/
```

- [ ] **Step 4: Write the failing smoke test**

`tests/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home responds with English LTR HTML and the right title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page).toHaveTitle('Mohamed Gamal · Senior Full Stack Engineer');
});

test('skip link points at main', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('main#main')).toHaveCount(1);
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx playwright test tests/smoke.spec.ts`
Expected: FAIL. `astro preview` cannot start because `dist/` does not exist, or the page is missing.

- [ ] **Step 6: Write tokens, global CSS, layout and a minimal index**

`src/styles/tokens.css`:
```css
:root {
  color-scheme: dark;
  --bg: #0c1222;
  --ink: #e6edf8;
  --body: #94a3b8;
  /* Spec value #64748b is 3.92:1 on --bg and fails WCAG AA; #7c8aa0 is 5.33:1. */
  --muted: #7c8aa0;
  --teal: #5eead4;
  --tag-bg: rgba(45, 212, 191, 0.1);
  --spot: rgba(56, 189, 248, 0.09);
  --row-hover: rgba(30, 41, 59, 0.5);
  --line: #334155;
  --title-bg: rgba(12, 18, 34, 0.78);
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
}
```

`src/styles/global.css`:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--body);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
p {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 3px;
  border-radius: 4px;
}

main:focus {
  outline: none;
}

.skip-link {
  position: absolute;
  inset-inline-start: 16px;
  inset-block-start: -100px;
  z-index: 100;
  padding-block: 8px;
  padding-inline: 16px;
  border-radius: 6px;
  background: var(--ink);
  color: var(--bg);
  font-weight: 600;
}

.skip-link:focus {
  inset-block-start: 16px;
}

@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

`src/layouts/BaseLayout.astro`:
```astro
---
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '../styles/tokens.css';
import '../styles/global.css';
import interUrl from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';

interface Props {
  title: string;
  description: string;
  lang?: 'en' | 'ar';
  dir?: 'ltr' | 'rtl';
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const { title, description, lang = 'en', dir = 'ltr', path = '/', noindex = false, jsonLd } = Astro.props;
const canonical = new URL(path, Astro.site).href;
---

<!doctype html>
<html lang={lang} dir={dir}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="theme-color" content="#0c1222" />
    <link rel="preload" href={interUrl} as="font" type="font/woff2" crossorigin />
    {noindex && <meta name="robots" content="noindex" />}
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <slot />
  </body>
</html>
```

`src/pages/index.astro` (replaced in Task 2):
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Mohamed Gamal · Senior Full Stack Engineer"
  description="I design and ship scalable web apps, serverless pipelines, and real-time systems."
>
  <main id="main" tabindex="-1"><h1>Mohamed Gamal</h1></main>
</BaseLayout>
```

- [ ] **Step 7: Build, check and run the test**

Run: `npm run check && npm run build && npx playwright test tests/smoke.spec.ts`
Expected: `astro check` reports 0 errors, and both tests pass.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json playwright.config.ts .gitignore src tests
git commit -m "Scaffold Astro site with base layout and smoke test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Typed content and static Home render

**Files:**
- Create: `src/content/types.ts`, `src/content/profile.ts`, `src/content/experience.ts`, `src/content/projects.ts`
- Create: `src/components/Hero.astro`, `Section.astro`, `About.astro`, `Row.astro`, `Tags.astro`
- Create: `src/styles/home.css`
- Modify: `src/pages/index.astro` (full rewrite)
- Test: `tests/home-content.spec.ts`, `tests/rtl-ready.spec.ts`, `tests/helpers/files.ts`

**Interfaces:**
- Consumes: `BaseLayout` (Task 1).
- Produces:
  - Exports `profile: Profile`, `experience: ExperienceItem[]` and `projects: ProjectItem[]`.
  - `Row` props `{ label: string; title: string; subtitle?: string; summary: string; tags: string[]; href?: string }`.
  - Page structure: `div.page > header.intro + div.content > main#main > section#about|#experience|#projects`, plus `footer.foot`.
  - Class names `.row`, `.row__label`, `.row__title`, `.row__sub`, `.row__summary`, `.row__arrow`, `.rows`, `.tags`, `.tag`, `.hero__name`, `.hero__title`, `.hero__lead`, `.section__title`, `.more`.
  - Helpers `walk(dir)`, `textFiles(dir)`, `read(file)` and the constant `ROOT`.

- [ ] **Step 1: Write the failing content and RTL tests**

`tests/helpers/files.ts`:
```ts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export const ROOT = process.cwd();

const TEXT_EXT = new Set([
  '.html', '.xml', '.txt', '.js', '.mjs', '.css', '.json', '.svg', '.webmanifest', '.astro', '.ts', '.md',
]);

export function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function textFiles(dir: string): string[] {
  return walk(dir).filter((file) => TEXT_EXT.has(extname(file)));
}

export function read(file: string): string {
  return readFileSync(file, 'utf8');
}
```

`tests/home-content.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('hero shows name, title and lead', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mohamed Gamal');
  await expect(page.locator('.hero__title')).toHaveText('Senior Full Stack Engineer');
  await expect(page.locator('.hero__lead')).toHaveText(
    'I design and ship scalable web apps, serverless pipelines, and real-time systems.',
  );
});

test('sections appear in order', async ({ page }) => {
  await expect(page.locator('main h2')).toHaveText(['About', 'Experience', 'Projects']);
});

test('about copy matches the spec', async ({ page }) => {
  const about = page.locator('#about');
  await expect(about.locator('strong')).toHaveText([
    '7+ years',
    'React and Next.js',
    'Node.js, Go, and PostgreSQL',
    'AWS, GCP, and Kubernetes',
  ]);
  await expect(about).toContainText("Lately I've been building as an independent engineer for clients.");
});

test('experience rows match the spec', async ({ page }) => {
  const rows = page.locator('#experience .row');
  await expect(rows).toHaveCount(3);
  await expect(rows.locator('.row__label')).toHaveText(['2024 — Present', '2023 — 2024', '2018 — 2023']);
  await expect(rows.locator('.row__title')).toHaveText([
    /^Independent Software Engineer$/,
    /^Backend Engineer\s*· Mozare3$/,
    /^Software Engineer\s*· Syft$/,
  ]);
  await expect(rows.nth(2).locator('.tag')).toHaveText(['NestJS', 'GraphQL', 'Prisma', 'Redis', 'Pub/Sub', 'GKE']);
});

test('projects appear in the spec order with their labels', async ({ page }) => {
  const rows = page.locator('#projects .row');
  await expect(rows.locator('.row__title')).toHaveText([
    'Syft App',
    'Mynt.la',
    'Getridley',
    'Mozare3',
    'Yoga Digital Library',
    'Meenda.com',
    'RandomMath',
  ]);
  await expect(rows.locator('.row__label')).toHaveText([
    'Influencer marketing',
    'Web3 & NFTs',
    'Real estate',
    'AgriTech',
    'Digital library',
    'Influencer bios',
    'EdTech',
  ]);
  await expect(rows.nth(0)).toContainText('an estimated 50%+');
  await expect(rows.nth(0).locator('.tag')).toHaveText(['NestJS', 'GraphQL', 'Stripe', 'Redis']);
});

test('v1 rows are not links and show no arrow', async ({ page }) => {
  await expect(page.locator('.row a')).toHaveCount(0);
  await expect(page.locator('.row__arrow')).toHaveCount(0);
});

test('résumé link downloads the PDF', async ({ page }) => {
  const link = page.getByRole('link', { name: /View full résumé/ });
  await expect(link).toHaveAttribute('href', '/resume.pdf');
  await expect(link).toHaveAttribute('download', 'Mohamed-Gamal-CV.pdf');
});

test('footer copy', async ({ page }) => {
  await expect(page.locator('footer.foot')).toHaveText(
    'Designed and built by me. Case studies and Arabic articles are coming.',
  );
});
```

`tests/rtl-ready.spec.ts`:
```ts
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/home-content.spec.ts tests/rtl-ready.spec.ts`
Expected:
- `home-content` FAILS: missing `.hero__title`, sections and rows.
- `rtl-ready` PASSES already, because no CSS breaks it yet. Keep it: it guards every later task.

- [ ] **Step 3: Write the content types and data**

`src/content/types.ts`:
```ts
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
```

`src/content/profile.ts`:
```ts
import type { Profile } from './types';

// Source: Career Vault profile bcbef25e-bf60-513f-91c1-d181bc6f2aed (usable_profiles).
export const profile: Profile = {
  // full_name "Mohamed Gamal Abdelrazeq"; the short form was chosen by the user (2026-10-09).
  name: 'Mohamed Gamal',
  // professional_title "Senior Full Stack Software Engineer", shortened for the site.
  title: 'Senior Full Stack Engineer',
  // profile summary: web apps, serverless pipelines, real-time systems.
  lead: 'I design and ship scalable web apps, serverless pipelines, and real-time systems.',
  location: 'Cairo, Egypt',
  siteUrl: 'https://mohamedelsonny.github.io',
  links: {
    github: 'https://github.com/mohamedElsonny',
    linkedin: 'https://linkedin.com/in/mohamedelsonny8',
  },
  // profiles.email, split so the whole address never appears in the HTML.
  emailParts: { user: 'mohamedelsonny5', domain: 'gmail.com' },
  about: [
    // profile summary: Cairo, 7+ years, the frontend/backend/cloud stack.
    [
      "I'm a full stack engineer based in Cairo with ",
      { strong: '7+ years' },
      ' of designing and shipping production systems. On the frontend I work in ',
      { strong: 'React and Next.js' },
      '; on the backend in ',
      { strong: 'Node.js, Go, and PostgreSQL' },
      ', running on ',
      { strong: 'AWS, GCP, and Kubernetes' },
      '.',
    ],
    // profile summary (domains) + experience 467d7423-acab-5001-8608-bd976dc33331 (independent, 2024-03 to present).
    [
      "I've built across influencer marketing, FinTech and NFTs, real estate, industrial logistics, AgriTech, and AI reading platforms. Lately I've been building as an independent engineer for clients.",
    ],
  ],
};
```

`src/content/experience.ts`:
```ts
import type { ExperienceItem } from './types';

export const experience: ExperienceItem[] = [
  {
    // experience 467d7423-acab-5001-8608-bd976dc33331 (2024-03 to present).
    role: 'Independent Software Engineer',
    period: '2024 — Present',
    // projects Getridley b979c75a-f6d2-5b12-884b-7ca5d04871a9, STSX 17c70a20-1d26-5630-b0d2-c7b66ef515f8 (achievement 1c79beec-a911-576d-ad48-fb71ad760e1d),
    // Yoga eb1da6c3-2f25-5620-ac60-b50dd79f5964.
    summary:
      'Contract work for clients: a serverless email inbox on AWS for a real estate platform, a steel-tracking barcoding system in Go and PostgreSQL, and an AI-assisted digital reading library.',
    // project skills of Getridley, STSX and Yoga.
    tags: ['AWS Lambda', 'SQS', 'DynamoDB', 'Go', 'Next.js', 'Firebase'],
  },
  {
    // experience 065591b1-aedd-5780-9710-4fc4132f79c0 (2023-10 to 2024-03).
    role: 'Backend Engineer',
    company: 'Mozare3',
    period: '2023 — 2024',
    // achievements 42e44d8f-7ba6-5a28-b8a4-077975fb8a09 (Kissflow migration), b43667bd-ee34-504a-8dfa-2a70f48aba96 (SAP XML).
    summary: 'Moved operational workflows off Kissflow into microservices on AWS ECS, including XML reporting for SAP.',
    tags: ['AWS ECS', 'Microservices', 'SAP integration'],
  },
  {
    // experience f9dac276-c289-5279-9174-97ff0375bba4 (2018-12 to 2023-10).
    role: 'Software Engineer',
    company: 'Syft',
    period: '2018 — 2023',
    // achievements 9974829b-6cb8-58ee-a95e-e76dae0bb798 (20+ team, 4 engineers), b2fe6020-99f1-5823-9702-15d08efb0211 (social pipelines),
    // f613e0b9-57d6-5044-92b1-1ec3bf7d8b59 (Stripe), 6a0e74d2-eeb2-5fc5-9a5f-eacbb988c573 (CI/CD), eea6f2f0-27f5-5218-bc65-ed4cb5126f37 (GKE).
    summary:
      'Nearly five years on an influencer marketing platform with a 20+ engineer team, directly leading 4 backend engineers. Built GraphQL APIs, social data pipelines, Stripe payments, and CI/CD to GKE.',
    // project skills of Syft App 2ab1fd89-74dd-56f8-83dc-e429a315face; Pub/Sub from 0446af9b-ee19-5ee6-b9b0-a2dba25bdd84.
    tags: ['NestJS', 'GraphQL', 'Prisma', 'Redis', 'Pub/Sub', 'GKE'],
  },
];
```

`src/content/projects.ts`:
```ts
import type { ProjectItem } from './types';

// Order is fixed by spec §7. Labels come from the vault project descriptions; tags from verified project skills or achievements.
export const projects: ProjectItem[] = [
  {
    // project 2ab1fd89-74dd-56f8-83dc-e429a315face.
    slug: 'syft-app',
    label: 'Influencer marketing',
    title: 'Syft App',
    // achievements 9974829b-6cb8-58ee-a95e-e76dae0bb798 (owned architecture, 20+ team), b2fe6020-99f1-5823-9702-15d08efb0211 + fact 24a14a1d-5ebf-59c5-a66e-26de7f0a0130 (six platforms),
    // f613e0b9-57d6-5044-92b1-1ec3bf7d8b59 (Stripe), 1663901c-e2b1-5460-802b-e01d7cf47dc9 + metric b0dbfbc4-4c63-54e7-a633-55ecbfb66627 (estimated >50%) + fact 8f412b95-604f-5237-94ff-3eaab82bf47b (Redis).
    summary:
      'Owned cross-stack architecture and technology standards for a 20+ engineer team. Built data pipelines across six social platforms, Stripe payments, and Redis caching that cut page-load latency by an estimated 50%+.',
    tags: ['NestJS', 'GraphQL', 'Stripe', 'Redis'],
  },
  {
    // project 5afd6a66-cc80-51c2-a566-afa76f5f9cb3.
    slug: 'mynt',
    label: 'Web3 & NFTs',
    title: 'Mynt.la',
    // achievements 0d663337-f158-5619-aa25-5979420cdbca (OpenSea), b65205f0-a351-5e35-98fd-c49ed21d5736 (5+ chains, 3+ APIs),
    // decision a8366407-727e-52cc-a72a-13300d3b53e9 (RabbitMQ), fact d8e2ce10-82f3-5150-946e-1076b536208f (retries, circuit breakers).
    summary:
      'Built the backend for an NFT marketplace with OpenSea integration. Decoupled ingestion from 5+ blockchains and 3+ APIs through RabbitMQ, with retries and circuit breakers.',
    tags: ['RabbitMQ', 'Circuit Breaker', 'Retries', 'OpenSea'],
  },
  {
    // project b979c75a-f6d2-5b12-884b-7ca5d04871a9.
    slug: 'getridley',
    label: 'Real estate',
    title: 'Getridley',
    // achievements 9e6a4a8c-fbda-55b0-a0e8-30816f036f37 (SES → SQS → Lambda → DynamoDB, WebSockets), c128753c-2b3a-5d59-8da9-3be2692c3c13 (2 of 4 weeks).
    summary:
      'A serverless Gmail-style inbox: SES → SQS → Lambda → DynamoDB, with real-time updates over WebSockets. Core scope delivered in 2 weeks of a 4-week deadline.',
    tags: ['AWS SES', 'AWS Lambda', 'DynamoDB', 'WebSockets'],
  },
  {
    // experience 065591b1-aedd-5780-9710-4fc4132f79c0 (no projects row); AgriTech domain from profile summary.
    slug: 'mozare3',
    label: 'AgriTech',
    title: 'Mozare3',
    // achievements 42e44d8f-7ba6-5a28-b8a4-077975fb8a09 (led Kissflow migration), b43667bd-ee34-504a-8dfa-2a70f48aba96 (SAP XML reporting).
    summary:
      "Led the migration of the company's core system from Kissflow (no-code) to microservices on AWS ECS, plus scheduled SAP reporting over XML web services.",
    tags: ['AWS ECS', 'Microservices', 'SAP integration'],
  },
  {
    // project eb1da6c3-2f25-5620-ac60-b50dd79f5964.
    slug: 'yoga-digital-library',
    label: 'Digital library',
    title: 'Yoga Digital Library',
    // achievements 1a23efdd-07d6-50ef-906e-99499e11c648 (Firebase library), 0045e3f5-607c-5ab7-b51f-bda6810b15e9 (PDF encryption),
    // 1bee7a77-7dae-5293-8d6b-674c347ef22a (TTS), ac4ed6e6-b294-50d7-894b-879be8e08357 (Gemini on Vertex AI).
    summary:
      'A Firebase digital library with client-side PDF encryption for offline reading, text-to-speech, and a Gemini-powered reading assistant on Vertex AI.',
    tags: ['Firebase', 'React', 'Vertex AI', 'Gemini'],
  },
  {
    // project ee19be95-d658-5693-914a-73ff71a56736.
    slug: 'meenda',
    label: 'Influencer bios',
    title: 'Meenda.com',
    // source: user (2026-10-09), recorded as verified achievements bedd915a-4f65-5bd6-8d79-674f7d411d23 (one-time scraping)
    // and 26cc20bf-63c3-50f8-a5b6-91f18baf6402 (admin panel) by ai-cv-tailor/scripts/record_meenda_scraping_admin.py.
    summary:
      'Built scraping scripts that collected public information about celebrities and turned it into published biographies. The job was deliberately a one-time run rather than a continuous sync pipeline. Added an admin panel so editors could review and correct the data.',
    tags: ['Node.js', 'GraphQL', 'Supabase', 'Web Scraping'],
  },
  {
    // project 04da7f85-8c60-5a50-bf39-907a29515c20.
    slug: 'randommath',
    label: 'EdTech',
    title: 'RandomMath',
    // achievement 266cf309-77ae-5516-b40e-c8b94659e997.
    summary:
      'Architected a quiz management system with role-based access for teachers, students, and parents, self-hosted on DigitalOcean.',
    tags: ['Next.js', 'PostgreSQL', 'Docker', 'DigitalOcean'],
  },
];
```

- [ ] **Step 4: Write the components**

`src/components/Hero.astro`:
```astro
---
interface Props {
  name: string;
  title: string;
  lead: string;
}

const { name, title, lead } = Astro.props;
---

<div class="hero">
  <h1 class="hero__name">{name}</h1>
  <p class="hero__title">{title}</p>
  <p class="hero__lead">{lead}</p>
</div>
```

`src/components/Section.astro`:
```astro
---
interface Props {
  id: string;
  title: string;
}

const { id, title } = Astro.props;
---

<section id={id} class="section" aria-labelledby={`${id}-title`}>
  <h2 id={`${id}-title`} class="section__title">{title}</h2>
  <slot />
</section>
```

`src/components/About.astro`:
```astro
---
import type { RichText } from '../content/types';

interface Props {
  paragraphs: RichText[];
}

const { paragraphs } = Astro.props;
---

<div class="about">
  {paragraphs.map((parts) => <p>{parts.map((part) => (typeof part === 'string' ? part : <strong>{part.strong}</strong>))}</p>)}
</div>
```

`src/components/Tags.astro`:
```astro
---
interface Props {
  items: string[];
}

const { items } = Astro.props;
---

<ul class="tags" aria-label="Technologies">
  {items.map((item) => <li class="tag">{item}</li>)}
</ul>
```

`src/components/Row.astro`:
```astro
---
import Tags from './Tags.astro';

interface Props {
  label: string;
  title: string;
  subtitle?: string;
  summary: string;
  tags: string[];
  /** Only linked rows get the arrow, the teal title and keyboard focus (spec §5). */
  href?: string;
}

const { label, title, subtitle, summary, tags, href } = Astro.props;
---

<li class:list={['row', { 'row--link': href }]}>
  <p class="row__label">{label}</p>
  <div class="row__body">
    <h3 class="row__title">
      {
        href ? (
          <a class="row__link" href={href}>
            {title}
            {subtitle && <span class="row__sub">· {subtitle}</span>}
            <span class="row__arrow" aria-hidden="true">↗</span>
          </a>
        ) : (
          <>
            {title}
            {subtitle && <span class="row__sub">· {subtitle}</span>}
          </>
        )
      }
    </h3>
    <p class="row__summary">{summary}</p>
    <Tags items={tags} />
  </div>
</li>
```

- [ ] **Step 5: Write the mobile-first Home CSS**

`src/styles/home.css`:
```css
/* Mobile-first. Desktop rules (min-width: 1024px) are added in Task 4. */

.page {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}

.intro {
  padding-block: 56px 8px;
}

.hero__name {
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.025em;
  line-height: 1.05;
}

.hero__title {
  margin-block: 12px;
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--ink);
}

.hero__lead {
  max-width: 22rem;
  font-size: 0.9375rem;
}

.content {
  padding-block-end: 48px;
}

.section {
  margin-block-start: 40px;
}

.section__title {
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
  margin-inline: -24px;
  padding-block: 16px 12px;
  padding-inline: 24px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--title-bg);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.about p {
  margin-block-end: 14px;
  font-size: 0.9375rem;
  line-height: 1.75;
}

.about strong {
  color: var(--ink);
  font-weight: 500;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row {
  position: relative;
  margin-inline: -12px;
  padding-block: 14px 16px;
  padding-inline: 12px;
  border-radius: 8px;
  transition:
    opacity 0.2s,
    background-color 0.2s;
}

.row__label {
  margin-block-end: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
}

.row__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink);
  transition: color 0.2s;
}

.row__sub {
  color: var(--body);
  font-weight: 500;
}

.row__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
}

.row__arrow {
  display: inline-block;
  color: var(--muted);
  transition:
    transform 0.2s,
    color 0.2s;
}

.row__summary {
  margin-block: 6px 10px;
  font-size: 0.875rem;
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding-block: 3px;
  padding-inline: 10px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--teal);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
}

.more {
  display: inline-block;
  margin-block-start: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  transition: color 0.2s;
}

.more:hover {
  color: var(--teal);
}

.foot {
  max-width: 26rem;
  padding-block: 32px 0;
  font-size: 0.8125rem;
  color: var(--muted);
}
```

- [ ] **Step 6: Rewrite the Home page**

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import Section from '../components/Section.astro';
import About from '../components/About.astro';
import Row from '../components/Row.astro';
import { profile } from '../content/profile';
import { experience } from '../content/experience';
import { projects } from '../content/projects';
import '../styles/home.css';
---

<BaseLayout title={`${profile.name} · ${profile.title}`} description={profile.lead}>
  <div class="page">
    <header class="intro">
      <div>
        <Hero name={profile.name} title={profile.title} lead={profile.lead} />
      </div>
    </header>
    <div class="content">
      <main id="main" tabindex="-1">
        <Section id="about" title="About">
          <About paragraphs={profile.about} />
        </Section>
        <Section id="experience" title="Experience">
          <ul class="rows">
            {
              experience.map((item) => (
                <Row
                  label={item.period}
                  title={item.role}
                  subtitle={item.company}
                  summary={item.summary}
                  tags={item.tags}
                  href={item.href}
                />
              ))
            }
          </ul>
          <a class="more" href="/resume.pdf" download="Mohamed-Gamal-CV.pdf">View full résumé <span aria-hidden="true">→</span></a>
        </Section>
        <Section id="projects" title="Projects">
          <ul class="rows">
            {
              projects.map((item) => (
                <Row label={item.label} title={item.title} summary={item.summary} tags={item.tags} href={item.href} />
              ))
            }
          </ul>
        </Section>
      </main>
      <footer class="foot">Designed and built by me. Case studies and Arabic articles are coming.</footer>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 7: Build, check and run all tests**

Run: `npm run check && npm run build && npx playwright test`
Expected: 0 check errors; all tests in `smoke`, `home-content` and `rtl-ready` pass.

If the résumé link's accessible name fails the `/View full résumé/` match because of the arrow, keep the arrow `aria-hidden` and fix the markup, not the test.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "Render Home content from typed vault-sourced data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Email protection and social links

**Files:**
- Create: `src/components/Social.astro`, `src/components/EmailLink.astro`
- Modify: `src/pages/index.astro` (full rewrite below), `src/styles/home.css` (append)
- Test: `tests/email.spec.ts`

**Interfaces:**
- Consumes: `profile.links` and `profile.emailParts` (Task 2).
- Produces:
  - `Social` props `{ github: string; linkedin: string; emailParts: { user: string; domain: string } }`.
  - `EmailLink` props `{ user: string; domain: string; fallback: string }`.
  - Markup `ul.social`, and `a.email-link[data-email-user][data-email-domain]`.

- [ ] **Step 1: Write the failing email tests**

`tests/email.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { profile } from '../src/content/profile';

// Built at runtime from the split parts, so the whole address is not written in this file either.
const address = `${profile.emailParts.user}@${profile.emailParts.domain}`;

test('the whole address is not in the raw HTML', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html.includes(address)).toBe(false);
});

test('social links point at GitHub and LinkedIn', async ({ page }) => {
  await page.goto('/');
  const social = page.locator('ul.social');
  await expect(social.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', profile.links.github);
  await expect(social.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.links.linkedin);
});

test('focusing Email builds the mailto link', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Email' });
  await link.focus();
  await expect(link).toHaveAttribute('href', `mailto:${address}`);
});

test('clicking Email builds the mailto link', async ({ page }) => {
  await page.goto('/');
  // Cancel the navigation after the element's own click handler has run.
  await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault()));
  const link = page.getByRole('link', { name: 'Email' });
  await link.click();
  await expect(link).toHaveAttribute('href', `mailto:${address}`);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Email falls back to LinkedIn and content is readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Email' })).toHaveAttribute('href', profile.links.linkedin);
    await expect(page.locator('main h2')).toHaveText(['About', 'Experience', 'Projects']);
    await expect(page.locator('#projects .row')).toHaveCount(7);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test tests/email.spec.ts`
Expected: FAIL. There is no `ul.social` and no Email link. The raw-HTML test passes already.

- [ ] **Step 3: Write the components**

`src/components/EmailLink.astro`:
```astro
---
interface Props {
  user: string;
  domain: string;
  /** Where the link goes when JavaScript is off. */
  fallback: string;
}

const { user, domain, fallback } = Astro.props;
---

<a class="email-link" href={fallback} data-email-user={user} data-email-domain={domain}>Email</a>

<script>
  // Join the address only on intent, so it never sits whole in the HTML.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-email-user]')) {
    const arm = () => {
      link.href = `mailto:${link.dataset.emailUser}@${link.dataset.emailDomain}`;
    };
    link.addEventListener('pointerenter', arm, { once: true });
    link.addEventListener('focus', arm, { once: true });
    link.addEventListener('click', arm);
  }
</script>
```

`src/components/Social.astro`:
```astro
---
import EmailLink from './EmailLink.astro';

interface Props {
  github: string;
  linkedin: string;
  emailParts: { user: string; domain: string };
}

const { github, linkedin, emailParts } = Astro.props;
---

<ul class="social" aria-label="Contact">
  <li><a href={github} rel="me">GitHub</a></li>
  <li><a href={linkedin} rel="me">LinkedIn</a></li>
  <li><EmailLink user={emailParts.user} domain={emailParts.domain} fallback={linkedin} /></li>
</ul>
```

Append to `src/styles/home.css`:
```css
.social {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-block-start: 24px;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.social a {
  display: inline-block;
  padding-block: 4px;
  color: var(--muted);
  transition: color 0.2s;
}

.social a:hover {
  color: var(--ink);
}
```

- [ ] **Step 4: Add Social to the Home header**

`src/pages/index.astro`: full file, with the `Social` import and usage added.
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import Section from '../components/Section.astro';
import About from '../components/About.astro';
import Row from '../components/Row.astro';
import Social from '../components/Social.astro';
import { profile } from '../content/profile';
import { experience } from '../content/experience';
import { projects } from '../content/projects';
import '../styles/home.css';
---

<BaseLayout title={`${profile.name} · ${profile.title}`} description={profile.lead}>
  <div class="page">
    <header class="intro">
      <div>
        <Hero name={profile.name} title={profile.title} lead={profile.lead} />
      </div>
      <Social github={profile.links.github} linkedin={profile.links.linkedin} emailParts={profile.emailParts} />
    </header>
    <div class="content">
      <main id="main" tabindex="-1">
        <Section id="about" title="About">
          <About paragraphs={profile.about} />
        </Section>
        <Section id="experience" title="Experience">
          <ul class="rows">
            {
              experience.map((item) => (
                <Row
                  label={item.period}
                  title={item.role}
                  subtitle={item.company}
                  summary={item.summary}
                  tags={item.tags}
                  href={item.href}
                />
              ))
            }
          </ul>
          <a class="more" href="/resume.pdf" download="Mohamed-Gamal-CV.pdf">View full résumé <span aria-hidden="true">→</span></a>
        </Section>
        <Section id="projects" title="Projects">
          <ul class="rows">
            {
              projects.map((item) => (
                <Row label={item.label} title={item.title} summary={item.summary} tags={item.tags} href={item.href} />
              ))
            }
          </ul>
        </Section>
      </main>
      <footer class="foot">Designed and built by me. Case studies and Arabic articles are coming.</footer>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 5: Run all tests**

Run: `npm run check && npm run build && npx playwright test`
Expected: all pass.

Also confirm by hand that the address is not in any built file:
```bash
grep -rl "mohamedelsonny5@" dist || echo "clean"
```
Expected: `clean`.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "Add social links and scraper-safe email link

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Desktop layout, active nav and row hover

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/pages/index.astro` (full rewrite below), `src/styles/home.css` (append)
- Test: `tests/desktop.spec.ts`

**Interfaces:**
- Consumes: the page structure and classes from Tasks 2 and 3.
- Produces:
  - `Nav` props `{ items: { id: string; label: string }[] }`.
  - Links `a.nav__link[data-nav=<id>]`, with `aria-current="true"` on the active one.
  - The desktop grid at `min-width: 1024px`.

- [ ] **Step 1: Write the failing desktop tests**

`tests/desktop.spec.ts`:
```ts
import { test, expect, type Page } from '@playwright/test';

// Default project viewport is 1280×800 (desktop).

async function activeElementText(page: Page) {
  return page.evaluate(() => (document.activeElement?.textContent ?? '').trim());
}

test('two columns: intro on the start side, content on the end side', async ({ page }) => {
  await page.goto('/');
  const intro = (await page.locator('header.intro').boundingBox())!;
  const content = (await page.locator('.content').boundingBox())!;
  expect(intro.x + intro.width).toBeLessThanOrEqual(content.x);
  await expect(page.locator('nav.nav')).toBeVisible();
});

test('intro column stays put while the page scrolls', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  const intro = (await page.locator('header.intro').boundingBox())!;
  expect(Math.abs(intro.y)).toBeLessThan(1);
});

test('About is current on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-nav="about"]')).toHaveAttribute('aria-current', 'true');
});

test('clicking a nav item scrolls to its section and marks it current', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator('#projects-title')).toBeInViewport();
  await expect(page.locator('[data-nav="projects"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-nav="about"]')).not.toHaveAttribute('aria-current', 'true');
});

test('deep link to a section shows it and marks it current', async ({ page }) => {
  await page.goto('/#experience');
  await expect(page.locator('#experience-title')).toBeInViewport();
  await expect(page.locator('[data-nav="experience"]')).toHaveAttribute('aria-current', 'true');
});

test('hovering a row dims its siblings', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#projects .row');
  await rows.nth(1).hover();
  await expect(rows.nth(0)).toHaveCSS('opacity', '0.45');
  await expect(rows.nth(1)).toHaveCSS('opacity', '1');
  await expect(rows.nth(1)).toHaveCSS('background-color', 'rgba(30, 41, 59, 0.5)');
});

test('unlinked rows keep the white title on hover', async ({ page }) => {
  await page.goto('/');
  const row = page.locator('#projects .row').first();
  await row.hover();
  await expect(row.locator('.row__title')).toHaveCSS('color', 'rgb(230, 237, 248)');
});

test('keyboard: tab order and skip link', async ({ page }) => {
  await page.goto('/');
  const order: string[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    order.push(await activeElementText(page));
  }
  // textContent includes the aria-hidden arrow, so the résumé entry ends with →.
  expect(order).toEqual([
    'Skip to content',
    'About',
    'Experience',
    'Projects',
    'GitHub',
    'LinkedIn',
    'Email',
    'View full résumé →',
  ]);
});

test('keyboard: skip link moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip-link')).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('keyboard: Enter on a nav item scrolls to its section', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="experience"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#experience$/);
  await expect(page.locator('#experience-title')).toBeInViewport();
});

test('rows are not in the tab order in v1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.row a, .row [tabindex]')).toHaveCount(0);
});

test('dir="rtl" mirrors the columns without extra CSS', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const intro = (await page.locator('header.intro').boundingBox())!;
  const content = (await page.locator('.content').boundingBox())!;
  expect(content.x + content.width).toBeLessThanOrEqual(intro.x);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('nav anchors still jump to sections', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav="projects"]').click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects-title')).toBeInViewport();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test tests/desktop.spec.ts`
Expected: FAIL. There is no `nav.nav` and no grid yet.

- [ ] **Step 3: Write the Nav component**

`src/components/Nav.astro`:
```astro
---
interface Props {
  items: { id: string; label: string }[];
}

const { items } = Astro.props;
---

<nav class="nav" aria-label="Sections">
  <ul>
    {
      items.map((item, index) => (
        <li>
          <a class="nav__link" href={`#${item.id}`} data-nav={item.id} aria-current={index === 0 ? 'true' : undefined}>
            <span class="nav__line" aria-hidden="true" />
            <span class="nav__label">{item.label}</span>
          </a>
        </li>
      ))
    }
  </ul>
</nav>

<script>
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-nav]'));
  const setActive = (id: string) => {
    for (const link of links) {
      if (link.dataset.nav === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };
  const sections = links
    .map((link) => document.getElementById(link.dataset.nav ?? ''))
    .filter((section): section is HTMLElement => section !== null);

  // A section is current while it crosses a band 30%–40% down the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    },
    { rootMargin: '-30% 0px -60% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
  links.forEach((link) => link.addEventListener('click', () => setActive(link.dataset.nav ?? '')));
</script>
```

- [ ] **Step 4: Append the nav and desktop CSS**

Append to `src/styles/home.css`:
```css
.nav {
  display: none;
}

@media (min-width: 1024px) {
  .page {
    display: grid;
    grid-template-columns: 0.9fr 1.3fr;
    gap: 64px;
    padding-inline: 48px;
  }

  .intro {
    position: sticky;
    inset-block-start: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    padding-block: 96px 64px;
  }

  .nav {
    display: block;
    margin-block-start: 56px;
  }

  .nav ul {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nav__link {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding-block: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    transition: color 0.2s;
  }

  .nav__line {
    width: 32px;
    height: 1px;
    background: var(--line);
    transition:
      width 0.25s,
      background-color 0.25s;
  }

  .nav__link:hover,
  .nav__link[aria-current='true'] {
    color: var(--ink);
  }

  .nav__link:hover .nav__line,
  .nav__link[aria-current='true'] .nav__line {
    width: 64px;
    background: var(--ink);
  }

  .social {
    margin-block-start: 0;
  }

  .content {
    padding-block: 96px 64px;
  }

  .section {
    margin-block: 0 96px;
    scroll-margin-block-start: 96px;
  }

  .section__title {
    position: static;
    margin-block: 0 16px;
    margin-inline: 0;
    padding: 0;
    background: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 16px;
    margin-inline: -16px;
    padding: 16px;
  }

  .row__label {
    margin-block-end: 0;
    padding-block-start: 3px;
  }

  .more {
    margin-block-start: 16px;
  }
}

/* Hover dimming works on every row; title colour, arrow and focus only on linked rows (spec §5). */
@media (min-width: 1024px) and (hover: hover) {
  .rows:hover .row {
    opacity: 0.45;
  }

  .rows .row:hover,
  .rows .row--link:focus-within {
    opacity: 1;
    background: var(--row-hover);
    box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
  }

  .rows:has(.row--link:focus-visible) .row {
    opacity: 0.45;
  }

  .rows:has(.row--link:focus-visible) .row--link:focus-within {
    opacity: 1;
  }

  .row--link:hover .row__title,
  .row--link:focus-within .row__title,
  .row--link:hover .row__arrow,
  .row--link:focus-within .row__arrow {
    color: var(--teal);
  }

  .row--link:hover .row__arrow,
  .row--link:focus-within .row__arrow {
    transform: translate(3px, -3px);
  }
}
```

- [ ] **Step 5: Add Nav to the Home header**

`src/pages/index.astro`: full file, with `Nav` and the `sections` list added.
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import Nav from '../components/Nav.astro';
import Section from '../components/Section.astro';
import About from '../components/About.astro';
import Row from '../components/Row.astro';
import Social from '../components/Social.astro';
import { profile } from '../content/profile';
import { experience } from '../content/experience';
import { projects } from '../content/projects';
import '../styles/home.css';

const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
];
---

<BaseLayout title={`${profile.name} · ${profile.title}`} description={profile.lead}>
  <div class="page">
    <header class="intro">
      <div>
        <Hero name={profile.name} title={profile.title} lead={profile.lead} />
        <Nav items={sections} />
      </div>
      <Social github={profile.links.github} linkedin={profile.links.linkedin} emailParts={profile.emailParts} />
    </header>
    <div class="content">
      <main id="main" tabindex="-1">
        <Section id="about" title="About">
          <About paragraphs={profile.about} />
        </Section>
        <Section id="experience" title="Experience">
          <ul class="rows">
            {
              experience.map((item) => (
                <Row
                  label={item.period}
                  title={item.role}
                  subtitle={item.company}
                  summary={item.summary}
                  tags={item.tags}
                  href={item.href}
                />
              ))
            }
          </ul>
          <a class="more" href="/resume.pdf" download="Mohamed-Gamal-CV.pdf">View full résumé <span aria-hidden="true">→</span></a>
        </Section>
        <Section id="projects" title="Projects">
          <ul class="rows">
            {
              projects.map((item) => (
                <Row label={item.label} title={item.title} summary={item.summary} tags={item.tags} href={item.href} />
              ))
            }
          </ul>
        </Section>
      </main>
      <footer class="foot">Designed and built by me. Case studies and Arabic articles are coming.</footer>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 6: Run all tests**

Run: `npm run check && npm run build && npx playwright test`
Expected: all pass, including `rtl-ready`. The `translate(3px, -3px)` value is a transform, not a physical property, so the RTL check allows it.

If the 1280×800 viewport leaves the last section too short to reach the 30–40% band, add `padding-block-end: 40vh` to `.content` at desktop. Do not change the test.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "Add desktop two-column layout, active nav and row hover

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Spotlight, mobile behaviour and reduced motion

**Files:**
- Create: `src/components/Spotlight.astro`
- Modify: `src/pages/index.astro` (full rewrite below), `src/styles/home.css` (append)
- Test: `tests/mobile-motion.spec.ts`

**Interfaces:**
- Consumes: the page structure from Task 4.
- Produces:
  - The `.spotlight` layer.
  - The `html.has-spotlight` class while the pointer spotlight is active.
  - The CSS variables `--mx` / `--my` on `<html>`.

- [ ] **Step 1: Write the failing tests**

`tests/mobile-motion.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.describe('mobile 375×812', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('one column, side nav hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav.nav')).toBeHidden();
    const intro = (await page.locator('header.intro').boundingBox())!;
    const content = (await page.locator('.content').boundingBox())!;
    expect(intro.y + intro.height).toBeLessThanOrEqual(content.y + 1);
    expect(Math.abs(intro.x - content.x)).toBeLessThan(1);
  });

  test('section title sticks to the top inside its section', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const section = document.getElementById('experience')!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + 200, behavior: 'instant' });
    });
    const title = (await page.locator('#experience-title').boundingBox())!;
    expect(Math.abs(title.y)).toBeLessThan(1);
  });

  test('no pointer spotlight, static glow present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/has-spotlight/);
    await expect(page.locator('.spotlight')).toHaveCSS('background-image', /radial-gradient/);
  });
});

test.describe('320px phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});

test('1023px is mobile, 1024px is desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto('/');
  await expect(page.locator('nav.nav')).toBeHidden();
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator('nav.nav')).toBeVisible();
});

test('desktop spotlight follows the pointer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/has-spotlight/);
  await page.mouse.move(400, 300);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--mx')))
    .toBe('400px');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--my')))
    .toBe('300px');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no spotlight and no smooth scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/has-spotlight/);
    await page.mouse.move(400, 300);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--mx'))).toBe('');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test tests/mobile-motion.spec.ts`
Expected:
- The spotlight and static-glow tests FAIL (there is no `.spotlight` yet).
- The layout tests may already pass, since they guard Task 4's CSS.

- [ ] **Step 3: Write the Spotlight component**

`src/components/Spotlight.astro`:
```astro
<div class="spotlight" aria-hidden="true"></div>

<script>
  // Desktop pointer only, and never with reduced motion. Everywhere else the CSS shows a static glow.
  const query = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  );
  const root = document.documentElement;
  let frame = 0;
  let x = 0;
  let y = 0;

  const onMove = (event: PointerEvent) => {
    x = event.clientX;
    y = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      root.style.setProperty('--mx', `${x}px`);
      root.style.setProperty('--my', `${y}px`);
      frame = 0;
    });
  };

  const sync = () => {
    root.classList.toggle('has-spotlight', query.matches);
    if (query.matches) window.addEventListener('pointermove', onMove, { passive: true });
    else window.removeEventListener('pointermove', onMove);
  };

  sync();
  query.addEventListener('change', sync);
</script>
```

- [ ] **Step 4: Append spotlight and mobile press CSS**

Append to `src/styles/home.css`:
```css
/* Static glow at the top of the page (mobile, tablet, reduced motion). */
.spotlight {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 0;
  height: 640px;
  pointer-events: none;
  background: radial-gradient(400px circle at 20% 0%, var(--spot), transparent 60%);
}

/* Pointer spotlight (desktop only, toggled by Spotlight.astro). */
.has-spotlight .spotlight {
  position: fixed;
  inset: 0;
  height: auto;
  background: radial-gradient(560px circle at var(--mx, 60%) var(--my, 20%), var(--spot), transparent 62%);
}

@media (max-width: 1023.98px) {
  .row:active {
    background: var(--row-hover);
  }
}
```

- [ ] **Step 5: Add Spotlight to the Home page**

`src/pages/index.astro`: full file, with the `Spotlight` import and `<Spotlight />` before `.page`.
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Spotlight from '../components/Spotlight.astro';
import Hero from '../components/Hero.astro';
import Nav from '../components/Nav.astro';
import Section from '../components/Section.astro';
import About from '../components/About.astro';
import Row from '../components/Row.astro';
import Social from '../components/Social.astro';
import { profile } from '../content/profile';
import { experience } from '../content/experience';
import { projects } from '../content/projects';
import '../styles/home.css';

const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
];
---

<BaseLayout title={`${profile.name} · ${profile.title}`} description={profile.lead}>
  <Spotlight />
  <div class="page">
    <header class="intro">
      <div>
        <Hero name={profile.name} title={profile.title} lead={profile.lead} />
        <Nav items={sections} />
      </div>
      <Social github={profile.links.github} linkedin={profile.links.linkedin} emailParts={profile.emailParts} />
    </header>
    <div class="content">
      <main id="main" tabindex="-1">
        <Section id="about" title="About">
          <About paragraphs={profile.about} />
        </Section>
        <Section id="experience" title="Experience">
          <ul class="rows">
            {
              experience.map((item) => (
                <Row
                  label={item.period}
                  title={item.role}
                  subtitle={item.company}
                  summary={item.summary}
                  tags={item.tags}
                  href={item.href}
                />
              ))
            }
          </ul>
          <a class="more" href="/resume.pdf" download="Mohamed-Gamal-CV.pdf">View full résumé <span aria-hidden="true">→</span></a>
        </Section>
        <Section id="projects" title="Projects">
          <ul class="rows">
            {
              projects.map((item) => (
                <Row label={item.label} title={item.title} summary={item.summary} tags={item.tags} href={item.href} />
              ))
            }
          </ul>
        </Section>
      </main>
      <footer class="foot">Designed and built by me. Case studies and Arabic articles are coming.</footer>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 6: Run all tests**

Run: `npm run check && npm run build && npx playwright test`
Expected: all pass.

If `desktop spotlight follows the pointer` fails only because headless Chromium does not report `(hover: hover) and (pointer: fine)`, check with:
```ts
await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
```
Then report it to the reviewer. Do not weaken the media query.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "Add pointer spotlight, mobile press state and reduced motion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 404 page and SEO

**Files:**
- Create: `src/pages/404.astro`, `src/styles/notfound.css`, `public/favicon.svg`, `public/robots.txt`, `scripts/make-og.mjs`, `public/og.png` (generated)
- Modify: `astro.config.mjs` (sitemap), `src/layouts/BaseLayout.astro` (OG, Twitter, favicon), `src/pages/index.astro` (JSON-LD)
- Test: `tests/seo.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout` props `noindex`, `path` and `jsonLd` (Task 1).
- Produces:
  - `/404.html`, `/sitemap-index.xml`, `/robots.txt`, `/favicon.svg`, `/og.png`.
  - The npm script `og`.

- [ ] **Step 1: Write the failing SEO tests**

`tests/seo.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const SITE = 'https://mohamedelsonny.github.io';

test('home meta, canonical, Open Graph and Twitter', async ({ page }) => {
  await page.goto('/');
  const lead = 'I design and ship scalable web apps, serverless pipelines, and real-time systems.';
  const meta = (selector: string) => page.locator(selector).getAttribute('content');
  expect(await meta('meta[name="description"]')).toBe(lead);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`);
  expect(await meta('meta[property="og:title"]')).toBe('Mohamed Gamal · Senior Full Stack Engineer');
  expect(await meta('meta[property="og:description"]')).toBe(lead);
  expect(await meta('meta[property="og:type"]')).toBe('website');
  expect(await meta('meta[property="og:url"]')).toBe(`${SITE}/`);
  expect(await meta('meta[property="og:image"]')).toBe(`${SITE}/og.png`);
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toBe('/favicon.svg');
});

test('JSON-LD Person without email or phone', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? '{}');
  expect(data['@type']).toBe('Person');
  expect(data.name).toBe('Mohamed Gamal');
  expect(data.jobTitle).toBe('Senior Full Stack Engineer');
  expect(data.address.addressLocality).toBe('Cairo');
  expect(data.sameAs).toEqual(['https://github.com/mohamedElsonny', 'https://linkedin.com/in/mohamedelsonny8']);
  expect(raw).not.toMatch(/email|telephone/i);
});

test('sitemap lists home and not 404', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
  expect(sitemap).not.toContain('404');
});

test('robots.txt points at the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test('favicon is an SVG', async ({ request }) => {
  const res = await request.get('/favicon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/svg+xml');
});

test('og.png is a 1200×630 PNG', async ({ request }) => {
  const res = await request.get('/og.png');
  expect(res.status()).toBe(200);
  const png = await res.body();
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('unknown paths render the 404 page', async ({ page }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test tests/seo.spec.ts`
Expected: FAIL. There are no OG tags, JSON-LD, sitemap, robots, favicon, og.png or 404 page yet.

- [ ] **Step 3: Add sitemap, favicon, robots and the 404 page**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mohamedelsonny.github.io',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ filter: (page) => !page.includes('404') })],
});
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0c1222"/><text x="32" y="41" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" letter-spacing="-1" fill="#5eead4">MG</text></svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://mohamedelsonny.github.io/sitemap-index.xml
```

`src/styles/notfound.css`:
```css
.notfound {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 100vh;
  max-width: 36rem;
  margin-inline: auto;
  padding-inline: 24px;
}

.notfound__code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--teal);
}

.notfound__title {
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: var(--ink);
}

.notfound__back {
  margin-block-start: 12px;
  font-weight: 600;
  color: var(--ink);
  transition: color 0.2s;
}

.notfound__back:hover {
  color: var(--teal);
}
```

`src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import '../styles/notfound.css';
---

<BaseLayout title="Page not found · Mohamed Gamal" description="This page does not exist." path="/404" noindex>
  <main id="main" tabindex="-1" class="notfound">
    <p class="notfound__code">404</p>
    <h1 class="notfound__title">Page not found</h1>
    <p>The page you're looking for doesn't exist or has moved.</p>
    <a class="notfound__back" href="/"><span aria-hidden="true">←</span> Back to home</a>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Add OG, Twitter and favicon tags to `BaseLayout.astro`**

`src/layouts/BaseLayout.astro`: full file.
```astro
---
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '../styles/tokens.css';
import '../styles/global.css';
import interUrl from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';

interface Props {
  title: string;
  description: string;
  lang?: 'en' | 'ar';
  dir?: 'ltr' | 'rtl';
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const { title, description, lang = 'en', dir = 'ltr', path = '/', noindex = false, jsonLd } = Astro.props;
const canonical = new URL(path, Astro.site).href;
const ogImage = new URL('/og.png', Astro.site).href;
---

<!doctype html>
<html lang={lang} dir={dir}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="theme-color" content="#0c1222" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preload" href={interUrl} as="font" type="font/woff2" crossorigin />
    {noindex && <meta name="robots" content="noindex" />}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <slot />
  </body>
</html>
```

- [ ] **Step 5: Add JSON-LD to the Home page**

In `src/pages/index.astro`:

1. Add this block to the frontmatter, after `sections`:
   ```ts
   // No email and no phone, by spec §9.
   const jsonLd = {
     '@context': 'https://schema.org',
     '@type': 'Person',
     name: profile.name,
     jobTitle: profile.title,
     url: `${profile.siteUrl}/`,
     address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
     sameAs: [profile.links.github, profile.links.linkedin],
   };
   ```
2. Replace the opening `BaseLayout` tag with:
   ```astro
   <BaseLayout title={`${profile.name} · ${profile.title}`} description={profile.lead} jsonLd={jsonLd}>
   ```

Nothing else in the file changes.

- [ ] **Step 6: Generate `og.png`**

`scripts/make-og.mjs`:
```js
// Renders public/og.png (1200×630). Run with `npm run og` after changing the name or title.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const font = (pkg, file) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file)).toString('base64');

const inter500 = font('inter', 'inter-latin-500-normal.woff2');
const inter700 = font('inter', 'inter-latin-700-normal.woff2');
const mono400 = font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2');

const html = `<!doctype html><html><head><style>
@font-face { font-family: Inter; font-weight: 500; src: url(data:font/woff2;base64,${inter500}) format('woff2'); }
@font-face { font-family: Inter; font-weight: 700; src: url(data:font/woff2;base64,${inter700}) format('woff2'); }
@font-face { font-family: Mono; font-weight: 400; src: url(data:font/woff2;base64,${mono400}) format('woff2'); }
html, body { margin: 0; }
body { width: 1200px; height: 630px; box-sizing: border-box; padding: 96px;
  display: flex; flex-direction: column; justify-content: center;
  background: radial-gradient(700px circle at 15% 0%, rgba(56,189,248,.14), transparent 60%), #0c1222;
  font-family: Inter, sans-serif; }
h1 { margin: 0; font-size: 96px; font-weight: 700; letter-spacing: -0.03em; color: #e6edf8; line-height: 1; }
p { margin: 28px 0 0; font-size: 40px; font-weight: 500; color: #5eead4; }
small { margin-top: 64px; font-family: Mono, monospace; font-size: 26px; color: #94a3b8; }
</style></head><body>
<h1>Mohamed Gamal</h1><p>Senior Full Stack Engineer</p><small>mohamedelsonny.github.io</small>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('wrote public/og.png');
```

Run: `npm run og`
Expected: `wrote public/og.png`. Open the file and check that the name and title render in Inter, not a fallback font.

- [ ] **Step 7: Run all tests**

Run: `npm run check && npm run build && npx playwright test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add astro.config.mjs src public scripts/make-og.mjs tests
git commit -m "Add 404 page, SEO metadata, sitemap, robots, favicon and OG image

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Résumé sync and contact rules

The CV is the normal general CV from ai-cv-tailor. It includes the phone and email on purpose (spec §7). Nothing in ai-cv-tailor changes. The site's text files must never contain the phone or the whole email; the PDF is excluded from that rule.

**Files:**
- Create: `scripts/lib/contact-scan.mjs`, `scripts/lib/pdf-text.mjs`, `scripts/sync-resume.mjs`, `public/resume.pdf` (generated)
- Test: `tests/contact-scan.spec.ts`, `tests/resume.spec.ts`, `tests/content-rules.spec.ts`

**Interfaces:**
- Consumes: `textFiles`, `read` and `ROOT` from `tests/helpers/files.ts` (Task 2); `profile.emailParts` (Task 2).
- Produces:
  - `findPrivateContact(text: string): { kind: 'phone' | 'email'; index: number }[]`. It never returns the matched text.
  - `pdfText(buffer: Buffer | Uint8Array): Promise<{ text: string; pages: number }>`.
  - The npm script `sync-resume`, with env `CV_TAILOR_DIR` defaulting to `../ai-cv-tailor`.

- [ ] **Step 1: Write the failing scanner unit tests**

`tests/contact-scan.spec.ts` (all numbers are fake):
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/contact-scan.spec.ts`
Expected: FAIL, "Cannot find module '../scripts/lib/contact-scan.mjs'".

- [ ] **Step 3: Write the scanner and the PDF text helper**

`scripts/lib/contact-scan.mjs`:
```js
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
```

`scripts/lib/pdf-text.mjs`:
```js
import { extractText, getDocumentProxy } from 'unpdf';

/**
 * @param {Buffer | Uint8Array} buffer
 * @returns {Promise<{ text: string, pages: number }>}
 */
export async function pdfText(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, pages: totalPages };
}
```

- [ ] **Step 4: Run the scanner tests**

Run: `npx playwright test tests/contact-scan.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing résumé and content-rules tests**

`tests/resume.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { pdfText } from '../scripts/lib/pdf-text.mjs';

test('/resume.pdf is the general CV', async ({ request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  const { text, pages } = await pdfText(body);
  expect(pages).toBeGreaterThan(0);
  expect(text).toMatch(/mohamed gamal/i);
  expect(text).toMatch(/senior full stack/i);
  expect(text).toContain('linkedin.com/in/mohamedelsonny8');
});

test('the résumé link downloads the PDF', async ({ page }) => {
  await page.goto('/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /View full résumé/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Mohamed-Gamal-CV.pdf');
});
```

`tests/content-rules.spec.ts`:
```ts
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
```

Only `scripts/lib/contact-scan.mjs` is skipped, because its patterns contain `tel:`. If any other file is flagged, remove the contact detail from that file. Do not widen the skip list.

- [ ] **Step 6: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/resume.spec.ts tests/content-rules.spec.ts`
Expected:
- `resume.spec.ts` FAILS: `/resume.pdf` returns 404.
- `content-rules.spec.ts` PASSES; it guards against regressions.

- [ ] **Step 7: Write the sync script**

`scripts/sync-resume.mjs`:
```js
// Builds the general CV in ai-cv-tailor and copies it unchanged to public/resume.pdf.
// Run by hand when the CV changes:  npm run sync-resume   (CV_TAILOR_DIR overrides ../ai-cv-tailor)
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pdfText } from './lib/pdf-text.mjs';

const cvTailor = resolve(process.env.CV_TAILOR_DIR ?? '../ai-cv-tailor');
const builder = join(cvTailor, 'scripts', 'build_general_cv_pdf.py');
const built = join(cvTailor, 'output', 'pdf', 'Mohamed_Gamal_Senior_Full_Stack_Engineer_CV.pdf');
const target = resolve('public', 'resume.pdf');

if (!existsSync(builder)) {
  console.error(`CV builder not found: ${builder}\nSet CV_TAILOR_DIR to your ai-cv-tailor checkout.`);
  process.exit(1);
}

const run = spawnSync('uv', ['run', '--no-project', '--with', 'reportlab', 'python', builder], {
  cwd: cvTailor,
  stdio: 'inherit',
});
if (run.status !== 0) {
  console.error('CV build failed.');
  process.exit(run.status ?? 1);
}

const buffer = readFileSync(built);
if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
  console.error(`Not a PDF: ${built}`);
  process.exit(1);
}
const { pages } = await pdfText(buffer);
copyFileSync(built, target);
console.log(`Copied ${pages}-page CV to public/resume.pdf`);
```

- [ ] **Step 8: Sync the résumé and run all tests**

Run:
```bash
npm run sync-resume
npm run check && npm run build && npx playwright test
```
Expected:
- `Copied N-page CV to public/resume.pdf`.
- All tests pass, including the download test (the file now exists).
- `content-rules` still passes, because the PDF is not a text file.

- [ ] **Step 9: Commit**

```bash
git add scripts tests public/resume.pdf
git commit -m "Add résumé sync and contact-leak checks for site text files

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Quality gates

**Files:**
- Create: `lighthouserc.json`
- Test: `tests/quality.spec.ts`

**Interfaces:**
- Consumes: the whole built site (Tasks 1–7).
- Produces: the npm script `lhci` and the assertions CI relies on in Task 9.

- [ ] **Step 1: Write the quality tests**

`tests/quality.spec.ts`:
```ts
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
}

test('axe: home on desktop', async ({ page }) => {
  await page.goto('/');
  expect(await seriousViolations(page)).toEqual([]);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('axe: home on mobile', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });
});

test('axe: 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  expect(await seriousViolations(page)).toEqual([]);
});

test('internal links resolve and external links are well-formed https', async ({ page, request }) => {
  for (const path of ['/', '/does-not-exist']) {
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
  const inline = await page.$$eval('script:not([src]):not([type="application/ld+json"])', (scripts) =>
    scripts.map((s) => s.textContent ?? '').join(''),
  );
  const sources = await page.$$eval('script[src]', (scripts) => scripts.map((s) => (s as HTMLScriptElement).src));
  let total = Buffer.byteLength(inline);
  for (const src of sources) total += (await (await request.get(src)).body()).length;
  expect(total).toBeLessThan(5120);
});

test('no layout shift on load', async ({ page }) => {
  await page.goto('/');
  const cls = await page.evaluate(
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
  expect(cls).toBeLessThan(0.02);
});
```

- [ ] **Step 2: Run them**

Run: `npm run build && npx playwright test tests/quality.spec.ts`
Expected: PASS. These tests are gates over work that is already done, so a failure is a real defect.
- Fix the cause in the component or CSS.
- If axe flags `color-contrast`, raise the token in `tokens.css` and note the new value in the commit message.
- Do not disable axe rules.

- [ ] **Step 3: Add the Lighthouse config and run it**

`lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["http://localhost/index.html"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

The URL is the index only. The 404 page is `noindex`, which correctly fails the SEO category. Lighthouse runs mobile emulation by default. The canonical points at github.io while lhci serves localhost; this was checked and scores SEO 1.0.

Run: `npm run build && npm run lhci`
Expected: `All results processed!` with no assertion failures. If a category is below 0.95, open the report in `.lighthouseci/` and fix the cause.

- [ ] **Step 4: Run the full suite**

Run: `npm run verify`
Expected: check, build and every test pass.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.json tests/quality.spec.ts
git commit -m "Add axe, link, JS budget, CLS and Lighthouse gates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: CI/CD and deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the npm scripts `check`, `build`, `test` and `lhci` (Tasks 1 and 8).
- Produces: a Pages deployment on every push to `main`. Pull requests run checks only.

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run check
      - run: npm run build
      - run: npm test
      - run: npm run lhci
      - uses: actions/upload-pages-artifact@v5
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Verify locally and commit**

Run: `npm run verify`
Expected: all pass.

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions build, test and Pages deploy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: The user creates the repository** (manual, no `gh` CLI here)

The user does these on github.com:
1. Create the public repo `mohamedElsonny/mohamedElsonny.github.io`, empty, with no README.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.

- [ ] **Step 4: Push (only after the user approves in chat)**

```bash
git remote add origin https://github.com/mohamedElsonny/mohamedElsonny.github.io.git
git push -u origin main
```
Expected: the "Build and deploy" workflow runs, and both jobs go green.

- [ ] **Step 5: Verify the live site**

Run:
```bash
BASE_URL=https://mohamedelsonny.github.io npx playwright test
```
Expected: all tests pass. Tests that read local files skip themselves under `BASE_URL`.

Also open `https://mohamedelsonny.github.io/` on a phone and on desktop and compare them with the approved mockups.

---

## Self-review notes

- **Spec coverage:**
  - §1 → Tasks 2, 5, 7, 8.
  - §2 → Tasks 1, 6, 7.
  - §3 → Tasks 1, 9.
  - §4 i18n / logical CSS → Tasks 1, 2 and 4 (RTL tests).
  - §5 visuals → Tasks 2, 4, 5.
  - §6 scripts / email → Tasks 3, 4, 5, 8 (JS budget).
  - §7 copy → Task 2.
  - §8 data flow / résumé sync → Tasks 2, 7.
  - §9 SEO → Task 6.
  - §10 checks / deploy / hygiene → Tasks 7, 8, 9.
- **Phone rule:** the PDF keeps the phone and email (spec §7, updated 2026-10-09). Every other file is scanned by pattern, and hits report the kind and position only.
- **Names used across tasks:**
  - `Row`, `profile`, `experience`, `projects`.
  - `findPrivateContact`, `pdfText`.
  - `textFiles` / `read` / `ROOT`.
  - `.row*`, `.nav__link[data-nav]`, `html.has-spotlight`.
