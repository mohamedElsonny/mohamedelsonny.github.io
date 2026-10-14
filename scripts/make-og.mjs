// Renders the Open Graph images (1200×630): public/og.png for Home, and public/og/[ar/]<slug>.png
// for each case study, with the case study's own diagram taken from the built page.
// Run `npm run build` first, then `npm run og` after changing a name, title, label or diagram.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';

const font = (pkg, file) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file)).toString('base64');

const fontFaces = [
  ['Inter', 500, font('inter', 'inter-latin-500-normal.woff2')],
  ['Inter', 700, font('inter', 'inter-latin-700-normal.woff2')],
  ['Mono', 400, font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')],
  ['Readex', 500, font('readex-pro', 'readex-pro-arabic-500-normal.woff2')],
  ['Readex', 600, font('readex-pro', 'readex-pro-arabic-600-normal.woff2')],
  ['Readex', 500, font('readex-pro', 'readex-pro-latin-500-normal.woff2')],
  ['Readex', 600, font('readex-pro', 'readex-pro-latin-600-normal.woff2')],
]
  .map(([family, weight, data]) => `@font-face { font-family: ${family}; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }`)
  .join('\n');

const base = `${fontFaces}
html, body { margin: 0; }
body { width: 1200px; height: 630px; box-sizing: border-box;
  background: radial-gradient(700px circle at 15% 0%, rgba(56,189,248,.14), transparent 60%), #0c1222;
  font-family: Inter, sans-serif; }`;

const homeHtml = `<!doctype html><html><head><style>${base}
body { padding: 96px; display: flex; flex-direction: column; justify-content: center; }
h1 { margin: 0; font-size: 96px; font-weight: 700; letter-spacing: -0.03em; color: #e6edf8; line-height: 1; }
p { margin: 28px 0 0; font-size: 40px; font-weight: 500; color: #5eead4; }
small { margin-top: 64px; font-family: Mono, monospace; font-size: 26px; color: #94a3b8; }
</style></head><body>
<h1>Mohamed Gamal</h1><p>Senior Full Stack Engineer</p><small>mohamedelsonny.github.io</small>
</body></html>`;

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const UI = {
  en: { kicker: 'Case study', name: 'Mohamed Gamal' },
  ar: { kicker: 'دراسة حالة', name: 'محمد جمال' },
};

/** A case-study card: kicker and title on top, the diagram below, name and site in the corner. */
function caseStudyHtml({ lang, title, label, diagram }) {
  const ui = UI[lang];
  const ar = lang === 'ar';
  return `<!doctype html><html lang="${lang}" dir="${ar ? 'rtl' : 'ltr'}"><head><style>${base}
body { padding: 64px 72px; display: flex; flex-direction: column; ${ar ? 'font-family: Readex, Inter, sans-serif;' : ''} }
.kicker { margin: 0; font-family: Mono, ${ar ? 'Readex, ' : ''}monospace; font-size: 24px; color: #5eead4;
  ${ar ? '' : 'text-transform: uppercase; letter-spacing: 0.12em;'} }
h1 { margin: 20px 0 0; max-width: 1000px; font-size: ${ar ? 58 : 60}px; font-weight: ${ar ? 600 : 700};
  line-height: ${ar ? 1.35 : 1.1}; letter-spacing: ${ar ? 0 : '-0.02em'}; color: #e6edf8; }
.foot { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
.who { display: flex; flex-direction: column; gap: 10px; padding-block-end: 8px; }
.who b { font-size: 28px; font-weight: ${ar ? 600 : 700}; color: #e6edf8; }
.who span { font-family: Mono, monospace; font-size: 20px; color: #94a3b8; direction: ltr; text-align: start; }
.foot img { display: block; width: auto; height: auto; max-width: 660px; max-height: 290px; }
</style></head><body>
<p class="kicker">${escape(ui.kicker)} · ${escape(label)}</p>
<h1>${escape(title)}</h1>
<div class="foot">
  <div class="who"><b>${escape(ui.name)}</b><span>mohamedelsonny.github.io</span></div>
  <img src="${diagram}" alt="">
</div>
</body></html>`;
}

/** Reads title, label and slug from a case study's frontmatter. */
function frontmatter(file) {
  const head = readFileSync(file, 'utf8').split('---')[1];
  const field = (key) => JSON.parse(head.match(new RegExp(`^${key}: (.*)$`, 'm'))[1].trim().replace(/^([^"].*)$/, '"$1"'));
  return { title: field('title'), label: field('label'), lang: field('lang'), slug: field('translationOf') };
}

/** Serves dist/ so the diagrams render exactly as on the site. */
function serve() {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = createServer((req, res) => {
    let file = join('dist', decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

/** Shows each case study's whole pipeline, lit, and returns the diagram as a transparent PNG data URL. */
const DIAGRAMS = {
  // The last chapter's stage holds every piece of the pipeline.
  mynt: {
    selector: '.story__stage svg.dg',
    // The site keeps finished stages grey; on a small card that reads as faded, so light the whole pipeline.
    css: `.dg .dg-node, .dg .dg-chip, .dg .dg-edge { stroke: #5eead4; } .dg .dg-bell { fill: #5eead4; }
      .dg .dg-label .dg-main, .dg .dg-label.is-new .dg-main { fill: #e6edf8; } .dg .dg-label .dg-sub { fill: #5eead4; }`,
    async show(page) {
      await page.evaluate(() => {
        const chapter = document.querySelector('[data-chapter="backpressure"]');
        window.scrollTo(0, chapter.getBoundingClientRect().top + scrollY - innerHeight / 3);
      });
      await page.waitForFunction(() => document.querySelector('.story__stage svg.dg')?.getAttribute('data-stage') === '7');
    },
  },
  getridley: {
    selector: '.scrolly__stage svg',
    async show(page) {
      await page.evaluate(() => {
        for (const part of document.querySelectorAll('.scrolly__stage [data-s]')) part.classList.add('is-on');
      });
      await page.locator('.scrolly__stage svg').scrollIntoViewIfNeeded();
    },
  },
};

async function diagramOf(page, origin, { lang, slug }) {
  const recipe = DIAGRAMS[slug];
  if (!recipe) throw new Error(`No diagram recipe for case study "${slug}"`);
  await page.goto(`${origin}${lang === 'ar' ? '/ar' : ''}/case-studies/${slug}/`);
  await page.addStyleTag({
    content: `html, body { background: transparent !important; } .spotlight { display: none !important; }
      .scrolly__pkt, .dg-dot { display: none !important; } * { animation: none !important; transition: none !important; }
      ${recipe.css ?? ''}`,
  });
  await recipe.show(page);
  await page.waitForTimeout(300);
  // Crop to what is drawn, not the SVG box, which has room around the pipeline.
  const clip = await page.locator(recipe.selector).evaluate((svg) => {
    const boxes = [...svg.querySelectorAll('rect, path, line, circle, text')]
      .filter((el) => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width || r.height);
    const pad = 6;
    const x = Math.min(...boxes.map((r) => r.left)) - pad;
    const y = Math.min(...boxes.map((r) => r.top)) - pad;
    return {
      x, y,
      width: Math.max(...boxes.map((r) => r.right)) + pad - x,
      height: Math.max(...boxes.map((r) => r.bottom)) + pad - y,
    };
  });
  const png = await page.screenshot({ clip, omitBackground: true });
  return `data:image/png;base64,${png.toString('base64')}`;
}

const browser = await chromium.launch();
const card = await browser.newPage({ viewport: { width: 1200, height: 630 } });

async function render(html, path) {
  mkdirSync(dirname(path), { recursive: true });
  await card.setContent(html);
  await card.evaluate(() => document.fonts.ready);
  await card.screenshot({ path });
  console.log(`wrote ${path}`);
}

await render(homeHtml, 'public/og.png');

if (!existsSync('dist/index.html')) throw new Error('Run `npm run build` first: the case-study diagrams come from dist/.');
const server = await serve();
const origin = `http://localhost:${server.address().port}`;
const site = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
for (const lang of ['en', 'ar']) {
  const dir = join('src', 'content', 'case-studies', lang);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const study = frontmatter(join(dir, file));
    const diagram = await diagramOf(site, origin, study);
    await render(caseStudyHtml({ ...study, diagram }), join('public', 'og', lang === 'ar' ? 'ar' : '', `${study.slug}.png`));
  }
}
server.close();
await browser.close();
