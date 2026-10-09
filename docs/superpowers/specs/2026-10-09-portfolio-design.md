# Portfolio v1: Design Spec

- **Date:** 2026-10-09
- **Status:** awaiting user review
- **Owner:** Mohamed Gamal
- **Workflow:** after this spec and the plan are approved, pi implements each task and Claude reviews it against this spec.

## 1. Goal

A very professional personal portfolio for personal branding. It is the public home for Mohamed's work, and it will later host case studies and articles in English and Arabic.

**Success for v1:**
- The Home page is live at `https://mohamedelsonny.github.io/`, in English.
- It matches the approved desktop and mobile mockups (navy palette, spotlight, card hover).
- Every claim on the page traces back to a verified fact in the Career Vault.
- Lighthouse scores ≥ 95 in every category on mobile.
- The email cannot be scraped from the HTML, and the phone number appears nowhere.

## 2. Scope

**In v1:**
- `/`: the English Home page.
- `/resume.pdf`: a downloadable PDF CV.
- `404`: a custom not-found page in the same style.
- The i18n routing and RTL-ready layout that later pages will use.
- SEO basics, CI, and deploy to GitHub Pages.

**Out of v1 (each gets its own design cycle later):**
- **Case studies.** Each case study is designed together with the user, one at a time, in its own brainstorm → spec → plan cycle. Each one is an article-style page with animated, interactive explainers, in both English and Arabic. The interactive RabbitMQ explainer in the brainstorm mockup `merged-v1.html` (scenario buttons, SVG animation) is the reference for that style.
- **Articles (`/writing`).** Same: designed later, English and Arabic.
- **An Arabic Home page (`/ar`).** Possible later; not planned yet.
- **A custom domain.** Later. v1 uses the free GitHub Pages subdomain.

v1 only prepares for these. It does not build their layouts or components.

## 3. Stack and hosting

- **Astro**, static output, TypeScript strict. No client framework; only small inline scripts.
- **Hosting:** GitHub Pages from the repo `mohamedElsonny/mohamedElsonny.github.io`, served at `https://mohamedelsonny.github.io/`.
- **Deploy:** GitHub Actions (see §10).
- **Fonts:** Inter and JetBrains Mono, self-hosted through `@fontsource`. The Arabic font is chosen with the first Arabic page.

## 4. Site structure

### Routes

| Route | v1 | Notes |
|---|---|---|
| `/` | yes | English Home |
| `/resume.pdf` | yes | static file in `public/` |
| `/404` | yes | custom page |
| `/case-studies/<slug>` and `/ar/case-studies/<slug>` | later | same slug in both languages |
| `/writing/<slug>` and `/ar/writing/<slug>` | later | same slug in both languages |

### i18n

- Astro built-in i18n: `defaultLocale: 'en'`, `locales: ['en', 'ar']`. English has no prefix; Arabic lives under `/ar`.
- `BaseLayout` takes `lang` and `dir` props and sets them on `<html>`.
- All CSS uses logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-start`, `text-align: start`, and so on), so an Arabic page flips to RTL without extra CSS.
- When a page exists in both languages, it gets `hreflang` alternates and an EN / عربي switcher. v1 has no bilingual page, so v1 has no switcher.
- Content collections (with `lang` and `translationOf` fields) and MDX are added with the first case study, not in v1.

### Repo layout

```
src/
  layouts/BaseLayout.astro
  components/
    Hero.astro
    Nav.astro
    Section.astro
    ExperienceRow.astro
    ProjectRow.astro
    Tags.astro
    Social.astro
    Spotlight.astro
  content/
    profile.ts
    experience.ts
    projects.ts
  pages/
    index.astro
    404.astro
  styles/tokens.css
public/
  resume.pdf
  og.png
  favicon.svg
  robots.txt
scripts/
  sync-resume.(sh|ps1)
tests/
  *.spec.ts
```

Each component has one job. Components receive their data as props and never import content files directly; only `pages/index.astro` imports from `src/content/`.

## 5. Visual design

The approved mockups are `home-v1.html` (desktop) and `home-mobile-v1.html` (mobile) in `.superpowers/brainstorm/1784-1791466931/content/`. They are the visual reference. Their copy is outdated; the copy in §7 replaces it.

### Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0c1222` | page background |
| `--ink` | `#e6edf8` | headings, emphasis |
| `--body` | `#94a3b8` | body text |
| `--muted` | `#64748b` | dates, labels, nav. Raise it if it fails WCAG AA on `--bg`. |
| `--teal` | `#5eead4` | hover title, tags |
| `--tag-bg` | `rgba(45,212,191,.1)` | tag pill background |
| `--spot` | `rgba(56,189,248,.09)` | spotlight colour |
| `--row-hover` | `rgba(30,41,59,.5)` | hovered card background |

### Desktop (≥ 1024px)

- Two columns, grid `0.9fr 1.3fr`, centred with a max width.
- **Left column, sticky at full viewport height:**
  - Name (h1), title, one-line lead.
  - Nav: ABOUT / EXPERIENCE / PROJECTS. Each item has a line before it that grows and brightens when the item is active or hovered.
  - Social links at the bottom: GitHub, LinkedIn, Email.
- **Right column:** About, Experience, Projects, footer.
- **Spotlight:** a `radial-gradient` (about 560px) behind the content, following the mouse. A `mousemove` handler writes `--mx` / `--my` through `requestAnimationFrame`.
- **Active nav:** an `IntersectionObserver` marks the section currently in view. Clicking a nav item scrolls smoothly to its section.
- **Card hover:** while the pointer is over a list, the other rows dim to `opacity .45`. The hovered row gets `--row-hover`, its title turns teal, and its arrow moves `translate(3px, -3px)`. The same happens on `:focus-visible` for keyboard users.
- **Row layout:** a 110px label column (date or domain) plus the content column.

### Mobile and tablet (< 1024px)

- One column. The left column becomes a header at the top that scrolls away with the page.
- No side nav. Each section title is sticky at the top while its section is in view, with `background: rgba(12,18,34,.78)` and `backdrop-filter: blur(10px)`.
- No spotlight that follows the pointer. A faint static glow sits at the top of the page.
- No hover dimming. Tapping a row gives a light press highlight (`:active`).
- The date or domain label moves above the title.

### Accessibility

- `prefers-reduced-motion: reduce` turns off the spotlight, smooth scroll and transitions.
- WCAG AA contrast for all text.
- A skip link to the main content.
- Semantic HTML: `header`, `nav`, `main`, `section` with headings, `footer`, lists for rows.
- The hover dimming and highlight work on every row on desktop, linked or not. The ↗ arrow, the teal title and keyboard focus appear only on rows that link somewhere. In v1 no row links anywhere, so v1 rows show no arrow (unlike the mockups) and are not in the tab order.

## 6. Interactions and scripts

All client JavaScript is small inline scripts, under 5KB total on the Home page:

1. **Spotlight** (desktop only, skipped with reduced motion).
2. **Active nav** (`IntersectionObserver`) and smooth scroll.
3. **Email assembly** (see below).

### Email protection

- The address never appears whole in the HTML or in any built file.
- The Email link carries the address split across `data-*` attributes (for example user and domain separately). A script joins them into a `mailto:` link on click.
- Without JavaScript, the link points to LinkedIn instead.
- The address is the profile email in the vault.

## 7. Content

### Rules

- Only verified Career Vault facts (`usable_*` views) or statements the user made in this design conversation and that were then recorded in the vault as verified.
- No phone number anywhere: not in the page, the JSON-LD, the PDF metadata, or the repo.
- Estimated figures say "estimated".
- Ownership levels are respected: "led" and "owned" only where the vault says so.
- No "open to work" banner.
- Every sentence in `src/content/*.ts` has a source comment: the vault record ID, or `source: user (2026-10-09)` plus the vault record that now holds it.

### Hero

- **Name:** Mohamed Gamal
- **Title:** Senior Full Stack Engineer
- **Lead:** I design and ship scalable web apps, serverless pipelines, and real-time systems.

### Social links

- GitHub: `https://github.com/mohamedElsonny`
- LinkedIn: `https://linkedin.com/in/mohamedelsonny8`
- Email: protected (see §6)

### About

> I'm a full stack engineer based in Cairo with **7+ years** of designing and shipping production systems. On the frontend I work in **React and Next.js**; on the backend in **Node.js, Go, and PostgreSQL**, running on **AWS, GCP, and Kubernetes**.
>
> I've built across influencer marketing, FinTech and NFTs, real estate, industrial logistics, AgriTech, and AI reading platforms. Lately I've been building as an independent engineer for clients.

### Experience

1. **Independent Software Engineer**, 2024 — Present
   - Contract work for clients: a serverless email inbox on AWS for a real estate platform, a steel-tracking barcoding system in Go and PostgreSQL, and an AI-assisted digital reading library.
   - Tags: AWS Lambda, SQS, DynamoDB, Go, Next.js, Firebase
2. **Backend Engineer · Mozare3**, 2023 — 2024
   - Moved operational workflows off Kissflow into microservices on AWS ECS, including XML reporting for SAP.
   - Tags: AWS ECS, Microservices, SAP integration
3. **Software Engineer · Syft**, 2018 — 2023
   - Nearly five years on an influencer marketing platform with a 20+ engineer team, directly leading 4 backend engineers. Built GraphQL APIs, social data pipelines, Stripe payments, and CI/CD to GKE.
   - Tags: NestJS, GraphQL, Prisma, Redis, Pub/Sub, GKE

Below the list: **View full résumé →**, linking to `/resume.pdf`.

### Projects (in this order)

| # | Label | Title | Description | Tags |
|---|---|---|---|---|
| 1 | Influencer marketing | Syft App | Owned cross-stack architecture and technology standards for a 20+ engineer team. Built data pipelines across six social platforms, Stripe payments, and Redis caching that cut page-load latency by an estimated 50%+. | NestJS, GraphQL, Stripe, Redis |
| 2 | Web3 & NFTs | Mynt.la | Built the backend for an NFT marketplace with OpenSea integration. Decoupled ingestion from 5+ blockchains and 3+ APIs through RabbitMQ, with retries and circuit breakers. | RabbitMQ, Circuit Breaker, Retries, OpenSea |
| 3 | Real estate | Getridley | A serverless Gmail-style inbox: SES → SQS → Lambda → DynamoDB, with real-time updates over WebSockets. Core scope delivered in 2 weeks of a 4-week deadline. | AWS SES, AWS Lambda, DynamoDB, WebSockets |
| 4 | AgriTech | Mozare3 | Led the migration of the company's core system from Kissflow (no-code) to microservices on AWS ECS, plus scheduled SAP reporting over XML web services. | AWS ECS, Microservices, SAP integration |
| 5 | Digital library | Yoga Digital Library | A Firebase digital library with client-side PDF encryption for offline reading, text-to-speech, and a Gemini-powered reading assistant on Vertex AI. | Firebase, React, Vertex AI, Gemini |
| 6 | Influencer bios | Meenda.com | Built scraping scripts that collected public information about celebrities and turned it into published biographies. The job was deliberately a one-time run rather than a continuous sync pipeline. Added an admin panel so editors could review and correct the data. | Node.js, GraphQL, Supabase, Web Scraping |
| 7 | EdTech | RandomMath | Architected a quiz management system with role-based access for teachers, students, and parents, self-hosted on DigitalOcean. | Next.js, PostgreSQL, Docker, DigitalOcean |

- Excluded from Projects: STSX, CheckSammy, Brokeboyz, DevOps work. STSX is still mentioned in the Independent experience row.
- In v1 no project row is a link. A row becomes a link to `/case-studies/<slug>` when that case study ships.
- Labels come from the project descriptions in the vault (Mozare3 from its experience record and the AgriTech domain in the profile summary). Tags come from verified project skills or from verified achievement text (RabbitMQ, Circuit Breaker, Retries for Mynt.la; the Mozare3 tags from its experience record).

### Footer

> Designed and built by me. Case studies and Arabic articles are coming.

### Sources

- Experience, About, Syft, Mynt.la, Getridley, Mozare3, Yoga Digital Library and RandomMath: verified records in `usable_achievements`, `usable_experiences`, `usable_projects` and the project skills tables.
- Meenda.com: the user's own statement on 2026-10-09, recorded as verified by `ai-cv-tailor/scripts/record_meenda_scraping_admin.py` (achievements `meenda-one-time-scraping` and `meenda-admin-panel`, skill Web Scraping).

## 8. Data flow

- The site does **not** read the vault database at build time. The vault is local and is not available in CI.
- Content lives in typed TypeScript files in `src/content/`, with types for profile, experience rows and project rows. A typo or a missing field fails `astro check`.
- **Résumé sync:** `scripts/sync-resume` runs `ai-cv-tailor/scripts/build_general_cv_pdf.py`, copies the output to `public/resume.pdf`, and the PDF is committed. It is run by hand whenever the CV changes. The sync script checks that the PDF text contains no phone number before copying it.

## 9. SEO and metadata

- `<title>`: "Mohamed Gamal · Senior Full Stack Engineer"
- Meta description based on the hero lead.
- Canonical URL.
- Open Graph and Twitter card with a static `og.png` (1200×630, the name and title on the navy background).
- JSON-LD `Person`: name, job title, location (Cairo), `sameAs` GitHub and LinkedIn. No email, no phone.
- `sitemap.xml` (`@astrojs/sitemap`) and `robots.txt`.
- An "MG" monogram favicon (SVG).

## 10. Quality, testing and deploy

### Performance budget

- Lighthouse ≥ 95 in Performance, Accessibility, Best Practices and SEO on mobile.
- Home page client JavaScript under 5KB.
- Fonts preloaded and subset to Latin; no layout shift (CLS ≈ 0).

### Checks

- `astro check` with TypeScript strict. Any type error fails the build.
- **Playwright smoke tests** against the built site:
  - The Home page loads, and About, Experience and Projects are present.
  - Projects appear in the order in §7.
  - Clicking a nav item scrolls to its section.
  - The full email address is not in the raw HTML, and clicking Email produces the correct `mailto:` link.
  - The phone number does not appear anywhere in `dist/` (an explicit test that searches every built file, including the PDF text).
  - `/resume.pdf` returns a PDF.
  - At mobile width the page is one column and the side nav is hidden.
  - The 404 page renders.
- **Accessibility:** an `axe` scan inside the Playwright run, with zero serious or critical violations.
- **Links:** a check that no internal link is broken and that the external profile links are well-formed.

### Deploy

- GitHub Actions on every push to `main`: install, `astro check`, build, tests. Deploy to GitHub Pages only if every step passes.
- Pull requests run the same checks without deploying.

### Repo hygiene

- `.superpowers/` is in `.gitignore`.
- Nothing personal beyond what the site itself shows goes into the repo: no phone, no raw vault exports, no other CVs.

## 11. Future case studies (not v1)

Recorded here so v1 does not block them:

- Each case study is its own design cycle with the user: agree the story and copy, design the animated explainers, choose the article layout, write English and Arabic.
- They will use MDX in a content collection, so a case study is an article with interactive components placed anywhere in it.
- Each explainer is an Astro island with its own small script, so a page with many animations stays fast.
- Explainer text comes in through props, so one component works in both languages and both directions.
- Each explainer has a reduced-motion version and works without the animation.
