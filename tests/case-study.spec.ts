import { test, expect } from '@playwright/test';

const SITE = 'https://mohamedelsonny.github.io';

const PAGES = [
  {
    slug: 'getridley',
    lang: 'en',
    dir: 'ltr',
    path: '/case-studies/getridley/',
    title: 'A real-time inbox for property sellers · Mohamed Gamal',
    h1: 'A real-time inbox for property sellers',
    description:
      "How I built Getridley's serverless seller inbox with SES, S3, SQS, Lambda, DynamoDB and WebSockets, and why large attachments never travel through the queue.",
    kicker: 'Case study · Real estate',
    tags: ['AWS SES', 'S3', 'SQS', 'Lambda', 'DynamoDB', 'WebSockets'],
    sections: ['Context', 'The pipeline', 'Why a claim check', 'What it cost', 'Reliability', 'Delivery'],
    current: 'EN',
    other: { text: 'عربي', href: '/ar/case-studies/getridley/' },
    back: 'Mohamed Gamal',
    foot: 'Designed and built by me.',
  },
  {
    slug: 'getridley',
    lang: 'ar',
    dir: 'rtl',
    path: '/ar/case-studies/getridley/',
    title: 'صندوق بريد لحظي لبائعي العقارات · محمد جمال',
    h1: 'صندوق بريد لحظي لبائعي العقارات',
    description:
      'كيف بنيت صندوق بريد البائعين في Getridley بـ SES وS3 وSQS وLambda وDynamoDB وWebSockets، ولماذا لا تمر المرفقات الكبيرة عبر الـ queue أبدًا.',
    kicker: 'دراسة حالة · عقارات',
    tags: ['AWS SES', 'S3', 'SQS', 'Lambda', 'DynamoDB', 'WebSockets'],
    sections: ['السياق', 'مسار الرسالة', 'لماذا claim check', 'ماذا كلّف هذا التصميم', 'الاعتمادية', 'التسليم'],
    current: 'عربي',
    other: { text: 'EN', href: '/case-studies/getridley/' },
    back: 'محمد جمال',
    foot: 'صمّمتُه وبنيتُه بنفسي.',
  },
  {
    slug: 'mynt',
    lang: 'en',
    dir: 'ltr',
    path: '/case-studies/mynt/',
    title: 'Keeping scheduled ingestion alive when upstreams fail · Mohamed Gamal',
    h1: 'Keeping scheduled ingestion alive when upstreams fail',
    description:
      "Mynt's scheduled ingestion from 5+ blockchains and 3+ APIs, one problem at a time: RabbitMQ, acks after the write, jittered retries, idempotent consumers, a parking-lot DLQ, circuit breakers and backpressure, and what each fix cost.",
    kicker: 'Case study · Web3 & NFTs',
    tags: ['RabbitMQ', 'Cron', 'Retries', 'Dead-letter queue', 'Circuit Breaker', 'Idempotency'],
    sections: [
      'The setup', 'The naive cron', 'Ack at the right time', 'Retries', 'What actually went wrong',
      'Poison messages', 'The provider that is down', 'Backpressure', 'Takeaways',
    ],
    current: 'EN',
    other: { text: 'عربي', href: '/ar/case-studies/mynt/' },
    back: 'Mohamed Gamal',
    foot: 'Designed and built by me.',
  },
  {
    slug: 'mynt',
    lang: 'ar',
    dir: 'rtl',
    path: '/ar/case-studies/mynt/',
    title: 'جمع بيانات مجدول يصمد حين تتعطل المصادر · محمد جمال',
    h1: 'جمع بيانات مجدول يصمد حين تتعطل المصادر',
    description:
      'جمع Mynt المجدول للبيانات من خمس شبكات blockchain أو أكثر وثلاث APIs أو أكثر، مشكلةً بعد مشكلة: RabbitMQ، والـ ack بعد الكتابة، وretries مع jitter، وconsumers من نوع idempotent، وparking-lot DLQ، وcircuit breakers، وbackpressure، وثمن كل حل.',
    kicker: 'دراسة حالة · Web3 وNFTs',
    tags: ['RabbitMQ', 'Cron', 'Retries', 'Dead-letter queue', 'Circuit Breaker', 'Idempotency'],
    sections: [
      'السياق', 'الـ cron الساذج', 'الـ ack في الوقت الصحيح', 'الـ retries', 'ما الذي حدث خطأً فعلًا',
      'رسائل poison', 'المصدر المتوقف', 'الـ backpressure', 'الخلاصة',
    ],
    current: 'عربي',
    other: { text: 'EN', href: '/case-studies/mynt/' },
    back: 'محمد جمال',
    foot: 'صمّمتُه وبنيتُه بنفسي.',
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
      await expect(page.locator('.cs__head .tag')).toHaveText(p.tags);
      await expect(page.locator('.cs .section__title')).toHaveText(p.sections);
    });

    test('canonical and hreflang alternates', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${p.path}`);
      const alternates = await page.$$eval('link[rel="alternate"][hreflang]', (links) =>
        links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]),
      );
      const en = `${SITE}/case-studies/${p.slug}/`;
      const ar = `${SITE}/ar/case-studies/${p.slug}/`;
      expect(alternates).toEqual([['en', en], ['ar', ar], ['x-default', en]]);
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

const NEXT = [
  { path: '/case-studies/mynt/', href: '/case-studies/getridley/', name: 'Next case study · Real estate A real-time inbox for property sellers' },
  { path: '/case-studies/getridley/', href: '/case-studies/mynt/', name: 'Next case study · Web3 & NFTs Keeping scheduled ingestion alive when upstreams fail' },
  { path: '/ar/case-studies/mynt/', href: '/ar/case-studies/getridley/', name: 'دراسة الحالة التالية · عقارات صندوق بريد لحظي لبائعي العقارات' },
  { path: '/ar/case-studies/getridley/', href: '/ar/case-studies/mynt/', name: 'دراسة الحالة التالية · Web3 وNFTs جمع بيانات مجدول يصمد حين تتعطل المصادر' },
];

for (const n of NEXT) {
  test(`links the next case study, wrapping at the end: ${n.path}`, async ({ page }) => {
    await page.goto(n.path);
    const link = page.locator('nav.cs__next a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', n.href);
    await expect(link).toHaveAccessibleName(n.name);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${n.href}$`));
  });
}

for (const slug of ['getridley', 'mynt']) {
  const en = `/case-studies/${slug}/`;
  const ar = `/ar/case-studies/${slug}/`;

  test(`${slug}: the Arabic page loads Readex Pro and the English page does not`, async ({ page }) => {
    const fonts: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('readex-pro')) fonts.push(req.url());
    });
    await page.goto(en);
    await page.waitForLoadState('networkidle');
    expect(fonts).toEqual([]);
    await page.goto(ar);
    await page.waitForLoadState('networkidle');
    expect(fonts.some((url) => /readex-pro-arabic-400-normal.*\.woff2$/.test(url))).toBe(true);
  });

  test(`${slug}: Arabic text uses Readex Pro first`, async ({ page }) => {
    await page.goto(ar);
    await expect(page.locator('body')).toHaveCSS('font-family', /^"Readex Pro"/);
  });

  test(`${slug}: the Arabic skip link is translated`, async ({ page }) => {
    await page.goto(ar);
    await expect(page.locator('a.skip-link')).toHaveText('انتقل إلى المحتوى');
  });
}
