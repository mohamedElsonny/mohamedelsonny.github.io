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
