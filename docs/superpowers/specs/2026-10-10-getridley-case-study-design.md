# Getridley case study — design

Date: 2026-10-10. Status: written, waiting for the user's review.

This is the first case study on the portfolio. It follows the rules in `2026-10-09-portfolio-design.md` §2 and §11: one case study per brainstorm → spec → plan cycle, an article-style page with animated interactive explainers, in English and Arabic.

## 1. Goal and audience

A hiring manager or senior engineer reads one real system end to end and comes away knowing three things: how an inbound email becomes a real-time inbox message, why large attachments never travel through the queue, and how the pipeline stays reliable (retries, dead-letter queue, duplicates, alerts). The page must feel like part of the same site as Home, and it must read well without JavaScript.

## 2. Content rules

- Every claim comes from a verified Career Vault fact. The vault IDs for each section are listed in §5 and are copied into source comments next to the copy, the same way `src/content/projects.ts` does it.
- No numbers that the vault does not hold: no SQS size limit, no retry count, no traffic volume, no latency.
- "Natural ideas that are wrong here" (Base64 in the queue, chunking) are written as ideas someone might reasonably have and why they don't fit. They are never described as options that were compared at the time.
- FIFO appears only as "strict ordering was never needed". It is not presented as an alternative that was weighed.
- Left out on purpose: the CDK → Terraform WebSocket fix, and how each SES verdict (PASS, FAIL, GRAY, PROCESSING_FAILED) was handled (the vault records that it is not recalled).
- The phone number never appears anywhere on the page, in metadata, in JSON-LD, or in source files. The email address is not shown on this page.
- English and Arabic carry the same content. The Arabic is simplified Fusha (فصحى مبسطة). Technical terms stay in English (glossary in §6).

## 3. Routes and files

| Route | Source |
|---|---|
| `/case-studies/getridley` | `src/content/case-studies/en/getridley.mdx` |
| `/ar/case-studies/getridley` | `src/content/case-studies/ar/getridley.mdx` |

New and changed files:

```
src/content.config.ts                      content collection `caseStudies` (glob loader over src/content/case-studies/**/*.mdx)
src/content/case-studies/en/getridley.mdx
src/content/case-studies/ar/getridley.mdx
src/pages/case-studies/[slug].astro        English entries only
src/pages/ar/case-studies/[slug].astro     Arabic entries only
src/layouts/CaseStudyLayout.astro          header, language switcher, footer, spotlight
src/layouts/BaseLayout.astro               + `alternates` prop (hreflang), + Arabic font loading when lang is 'ar'
src/components/case-study/PipelineScrolly.astro
src/components/case-study/ClaimCheckExplainer.astro
src/components/case-study/pipeline.ts      node and edge data shared by the scrolly diagram (and its RTL mirroring)
src/styles/case-study.css
src/content/projects.ts                    Getridley row gets href '/case-studies/getridley'
lighthouserc.json                          + both case-study URLs
tests/case-study-*.spec.ts                 see §9
```

Collection schema (`zod` via `astro:content`):

```ts
{
  title: string,          // H1 and <title> prefix
  description: string,    // meta description, og:description
  lang: 'en' | 'ar',
  translationOf: string,  // shared slug, 'getridley'
  label: string,          // kicker, e.g. 'Real estate'
  tags: string[],
}
```

The page slug is `translationOf`, so both languages share `getridley`.

New dependencies, pinned exactly like the existing ones:

- `@astrojs/mdx` `8.0.2` (8.0.3 is less than two weeks old; 8.0.2 has the same peer range `astro ^7.2.10`).
- `@fontsource/readex-pro` `5.3.0` (Arabic subset files `arabic-400.css`, `arabic-500.css`, `arabic-600.css`).

## 4. Page layout

Layout C, "scrollytelling", approved on the prototype (`.superpowers/brainstorm/589-1791584624/content/scrolly-prototype.html`).

### Header

- A back link to Home: "← Mohamed Gamal" in English, "→ محمد جمال" in Arabic. Both go to `/` (there is no Arabic Home yet).
- An `EN / عربي` switcher in the top corner (inline-end). The current language is plain text with `aria-current="page"`; the other is a link to the same case study in that language.
- Kicker `Case study · Real estate` / `دراسة حالة · عقارات`, in the same teal uppercase style as Home section titles.
- H1, lead paragraph, tags (the same `Tags` component Home uses).

### Body

1. **Context**: normal article column (max ~720px).
2. **The pipeline**: full-width grid, `minmax(0,5fr) minmax(0,7fr)`. Steps on the inline-start side, the sticky SVG diagram on the inline-end side. Each step is `min-height: 62vh`, and the active one is fully opaque.
3. **Why a claim check**, **What it cost**, **Reliability**, **Delivery**: back to the article column. The claim-check explainer sits inside "Why a claim check".
4. Footer: the site footer text "Designed and built by me." and the back link again.

Section titles use the same sticky, blurred style as Home's section titles. The spotlight from Home is used here too. Tokens, fonts and the tag style are the existing ones in `src/styles/tokens.css`.

### Mobile (below 1024px, the same breakpoint as Home)

One column. The diagram sticks at the top (height 240px, page background behind it, under the section title) and the steps scroll under it. The explainer's SVG scales to the column width, and its scenario buttons wrap.

## 5. Copy (English) and sources

Arabic copy is in §6. Fact IDs below are vault IDs (achievements `A:`, decision facts `F:`).

**Meta.** Title: "A real-time inbox for property sellers · Mohamed Gamal". Description: "How I built Getridley's serverless seller inbox with SES, S3, SQS, Lambda, DynamoDB and WebSockets, and why large attachments never travel through the queue."

**H1.** A real-time inbox for property sellers

**Lead.** Getridley sellers used to get buyer inquiries in their personal email. I built a serverless pipeline that receives every inquiry in code, keeps large attachments out of the queue, and puts the message in a Gmail-style inbox the moment it arrives.
Sources: A:51697763, A:9e6a4a8c, A:0c92c89f, F:1de76cfa.

**Tags.** AWS SES, S3, SQS, Lambda, DynamoDB, WebSockets.

### Context

Property listings on Getridley already had a "Contact seller" button. It emailed the buyer's message straight to the seller's personal address, so every conversation lived in the seller's own inbox. The goal was an inbox inside the app that updates in real time, without taking away the email sellers were used to.
Sources: A:51697763 (context), A:9577edf2, A:0c92c89f.

### The pipeline (six scrolly steps)

1. **The entry point already existed.** Listings had a "Contact seller" button that emailed the seller directly. I rerouted it to a custom mail server at `inbox.getridley.com`, so every inquiry is received in code instead of disappearing into a personal inbox. (A:51697763, A:9577edf2)
2. **SES receives the mail.** Amazon SES accepts the message with its managed spam and virus scanning turned on. The application handles the verdicts; there is no custom antivirus engine to maintain. (F:e4e94791, F:df0de13e)
3. **The raw message goes to S3.** Buyers attach ownership contracts and high-resolution property photos. The full raw message and its attachments are stored in S3, not passed around. (F:b9f5b694, F:1de76cfa)
4. **Only a reference enters the queue.** SQS carries a small object reference and routing metadata, never the attachment itself. Messages that keep failing are moved to a dead-letter queue instead of retrying forever. (F:1de76cfa, F:16f362d2)
5. **Lambda does the work.** A Lambda function reads the message from S3, opens a buyer–seller conversation containing it, and stores searchable metadata in DynamoDB. (A:51697763, decision 31ae17de implementation)
6. **The seller sees it instantly.** API Gateway WebSockets push the new message to the seller's dashboard in real time. The same Lambda function also sends the seller a copy through SES, so nothing about their old habit breaks. (A:0c92c89f, F:fc706c71, new fact "processing Lambda also sent the seller a copy through SES", recorded 2026-10-10)

### Why a claim check

Buyers don't only send questions. They attach ownership contracts and high-resolution photos of the property. The queue is there to coordinate work and retry it safely, not to carry files. So the file goes to S3, and the queue only carries a claim ticket: a small reference to where the message is stored.
Sources: F:b9f5b694, F:14989da7, F:1de76cfa.

Then the explainer (§7.2), with these captions:

- **A short question.** SES stores the raw message in S3 and puts a small reference on the queue. Lambda takes the reference, reads the message from S3, and opens the buyer–seller conversation in DynamoDB.
- **A large attachment.** The contract and photos go into S3 with the raw message. The queue message is the same small reference as before, so the queue never sees how big the email was, and a retry only moves a few bytes.
- **A large attachment, switch on ("What if the file went in the queue instead?").** A natural first idea is to Base64 the file into the queue message. But SQS messages have a size limit that a contract plus a set of photos can exceed, and every retry would move the whole file again. Splitting it into chunks only trades that for ordering, reassembly, partial failures and cleanup. (decision 31ae17de alternatives, F:1d55d7d7)
- **Parsing fails.** Lambda can't parse the message, so it goes back to the queue and is retried. After repeated failures, the dead-letter queue takes it instead of retrying forever, and CloudWatch sends an email alert. The original is still in S3, so it can be processed again after a fix. (F:16f362d2, A:15674748, F:9361e234)
- **It arrives twice.** A standard queue delivers at least once, so the same message can arrive twice. The SES message ID is the conversation's key, written with a conditional write: the second write is rejected, and the seller still sees one conversation. (F:c36a8ea8, F:5e83a966, new fact "deduplicated on the SES message ID with a conditional write", recorded 2026-10-10)

### What it cost

A claim check is not free. Each email now has state in two places, the object in S3 and its metadata in DynamoDB, and processing is asynchronous, so the two have to be kept consistent. Keeping the original message is what makes reprocessing possible after a parser failure, but it also means the raw messages need a deliberate retention and cleanup policy.
Sources: F:219c8540, F:9361e234. Written as costs of the design, not as a claim that a specific cleanup policy was built.

### Reliability

The queue is an SQS standard queue, not FIFO. Strict ordering was never needed: each inquiry is independent, and a conversation orders its messages by the time each one was received, not by queue order. (F:c36a8ea8, F:7f098636)

A standard queue delivers at least once, so duplicates are expected, and the conditional write on the SES message ID turns a second delivery into a no-op. (F:5e83a966, new dedup fact)

A message that keeps failing is moved to a dead-letter queue by a redrive policy instead of retrying forever, and CloudWatch alarms send an email when something fails, so problems are noticed rather than discovered later. (F:16f362d2, A:15674748)

At the edge, SES's managed spam and virus scanning is on and the application acts on its verdicts. There is no custom antivirus engine and no separate malware-scanning pipeline to maintain. (F:e4e94791, F:df0de13e)

### Delivery

The first scope had a one-month deadline. The core was done in the first two weeks, and the other two went to testing, bug fixes and UI polish before handoff. The engagement then continued for another month, in which I delivered a new onboarding flow and a new dashboard.
Sources: A:c128753c, A:638205f3.

## 6. Arabic copy

Glossary: these stay in English inside Arabic text: Amazon SES / SES, S3, SQS, Lambda, DynamoDB, API Gateway, WebSockets, CloudWatch, queue, dead-letter queue, redrive policy, claim check, retry, conditional write, message ID, metadata, Base64, FIFO, standard queue, dashboard, Contact seller, spam. Everything else is Arabic.

**Meta.** Title: "صندوق بريد لحظي لبائعي العقارات · محمد جمال". Description: "كيف بنيت صندوق بريد البائعين في Getridley بـ SES وS3 وSQS وLambda وDynamoDB وWebSockets، ولماذا لا تمر المرفقات الكبيرة عبر الـ queue أبدًا."

**H1.** صندوق بريد لحظي لبائعي العقارات

**Lead.** كانت استفسارات المشترين تصل إلى بائعي Getridley في بريدهم الشخصي. بنيتُ مسارًا serverless يستقبل كل استفسار داخل الكود، ويُبقي المرفقات الكبيرة خارج الـ queue، ويضع الرسالة في صندوق بريد يشبه Gmail لحظة وصولها.

### السياق

كان في صفحات العقارات على Getridley زر "Contact seller"، يرسل رسالة المشتري مباشرةً إلى البريد الشخصي للبائع، فكانت كل محادثة تعيش في صندوق البائع الخاص. كان الهدف صندوق بريد داخل التطبيق يتحدّث لحظيًا، دون أن يفقد البائعون البريد الذي اعتادوا عليه.

### مسار الرسالة

1. **نقطة البداية كانت موجودة.** كان في صفحات العقارات زر "Contact seller" يرسل البريد إلى البائع مباشرةً. حوّلتُه إلى خادم بريد مخصص على `inbox.getridley.com`، فصار كل استفسار يُستقبل داخل الكود بدلًا من أن يضيع في بريد شخصي.
2. **SES يستقبل البريد.** يستقبل Amazon SES الرسالة مع تفعيل فحص الـ spam والفيروسات المُدار. يتعامل التطبيق مع نتائج الفحص، ولا يوجد محرك antivirus خاص يحتاج إلى صيانة.
3. **الرسالة الخام تذهب إلى S3.** يرفق المشترون عقود الملكية وصورًا عالية الدقة للعقار. تُخزَّن الرسالة الخام كاملةً بمرفقاتها في S3، ولا تُمرَّر من مكان إلى آخر.
4. **مرجع فقط يدخل الـ queue.** يحمل SQS مرجعًا صغيرًا للملف وبيانات التوجيه، ولا يحمل المرفق نفسه أبدًا. والرسائل التي يتكرر فشلها تنتقل إلى dead-letter queue بدلًا من إعادة المحاولة إلى ما لا نهاية.
5. **Lambda تقوم بالعمل.** تقرأ دالة Lambda الرسالة من S3، وتفتح محادثة بين المشتري والبائع تحتوي عليها، وتحفظ metadata قابلة للبحث في DynamoDB.
6. **البائع يراها فورًا.** تدفع API Gateway WebSockets الرسالة الجديدة إلى الـ dashboard الخاصة بالبائع لحظيًا. وترسل دالة Lambda نفسها نسخةً إلى البائع عبر SES، فلا يتغير شيء في عادته القديمة.

### لماذا claim check

المشترون لا يرسلون أسئلة فقط، بل يرفقون عقود الملكية وصورًا عالية الدقة للعقار. وظيفة الـ queue تنسيق العمل وإعادة محاولته بأمان، لا نقل الملفات. لذلك يذهب الملف إلى S3، ولا يحمل الـ queue سوى "إيصال استلام": مرجع صغير لمكان تخزين الرسالة.

Explainer captions:

- **سؤال قصير.** يخزّن SES الرسالة الخام في S3 ويضع مرجعًا صغيرًا في الـ queue. تأخذ Lambda المرجع، وتقرأ الرسالة من S3، وتفتح محادثة المشتري والبائع في DynamoDB.
- **مرفق كبير.** يذهب العقد والصور إلى S3 مع الرسالة الخام. أما رسالة الـ queue فهي المرجع الصغير نفسه، فلا يعرف الـ queue حجم البريد أصلًا، وأي retry لا ينقل سوى بضعة bytes.
- **مرفق كبير، مع تشغيل المفتاح ("ماذا لو وُضع الملف في الـ queue؟").** الفكرة الأولى الطبيعية هي تحويل الملف إلى Base64 ووضعه في رسالة الـ queue. لكن لرسائل SQS حدًّا أقصى للحجم قد يتجاوزه عقد مع مجموعة صور، وكل retry سينقل الملف كاملًا من جديد. وتقسيمه إلى أجزاء لا يحل المشكلة، بل يستبدل بها مشكلات الترتيب وإعادة التجميع والفشل الجزئي والتنظيف.
- **فشل التحليل.** لا تستطيع Lambda تحليل الرسالة، فتعود إلى الـ queue ويُعاد تنفيذها. وبعد تكرار الفشل تنتقل إلى الـ dead-letter queue بدلًا من إعادة المحاولة إلى ما لا نهاية، ويرسل CloudWatch تنبيهًا بالبريد. والرسالة الأصلية ما زالت في S3، فيمكن معالجتها من جديد بعد الإصلاح.
- **وصلت مرتين.** الـ standard queue يسلّم الرسالة مرة واحدة على الأقل، فقد تصل الرسالة نفسها مرتين. الـ SES message ID هو مفتاح المحادثة، ويُكتب بـ conditional write: تُرفض الكتابة الثانية، ويرى البائع محادثة واحدة فقط.

### ماذا كلّف هذا التصميم

الـ claim check ليس مجانيًا. صار لكل بريد حالة في مكانين، الملف في S3 والـ metadata في DynamoDB، والمعالجة غير متزامنة، فلا بد من الحفاظ على اتساقهما. والاحتفاظ بالرسالة الأصلية هو ما يجعل إعادة المعالجة ممكنة بعد فشل التحليل، لكنه يعني أيضًا أن الرسائل الخام تحتاج إلى سياسة واضحة للاحتفاظ بها وتنظيفها.

### الاعتمادية

الـ queue هنا SQS standard queue وليس FIFO. لم يكن الترتيب الصارم مطلوبًا أصلًا: كل استفسار مستقل عن غيره، والمحادثة ترتّب رسائلها حسب وقت استلام كل رسالة، لا حسب ترتيبها في الـ queue.

الـ standard queue يسلّم الرسالة مرة واحدة على الأقل، فالتكرار متوقع، والـ conditional write على الـ SES message ID يجعل التسليم الثاني بلا أثر.

الرسالة التي يتكرر فشلها تنتقل إلى dead-letter queue عبر redrive policy بدلًا من إعادة المحاولة إلى ما لا نهاية، وترسل تنبيهات CloudWatch بريدًا عند حدوث أي فشل، فتُكتشف المشكلات فور حدوثها لا بعد فوات الأوان.

وعند نقطة الدخول، فحص الـ spam والفيروسات المُدار في SES مفعّل، والتطبيق يتصرف بناءً على نتائجه. لا يوجد محرك antivirus خاص ولا مسار منفصل لفحص الملفات الضارة يحتاج إلى صيانة.

### التسليم

كان للنطاق الأول موعد تسليم مدته شهر. انتهى الجزء الأساسي في أول أسبوعين، وذهب الأسبوعان الآخران إلى الاختبار وإصلاح الأخطاء وتحسين الواجهة قبل التسليم. ثم استمر العمل شهرًا إضافيًا، سلّمتُ فيه onboarding flow جديدًا وdashboard جديدة.

## 7. Interactive components

Both components take all visible text as props, so one component serves both languages. Neither depends on a framework. Each has its own small inline script.

### 7.1 `PipelineScrolly`

- Props: `steps: { title: string; body: string }[]` (six, in order), `labels` (node labels and sub-labels), `dir: 'ltr' | 'rtl'`. Step bodies can contain inline `<code>`, so they are passed as HTML strings that come only from the MDX file, never from user input.
- Diagram: the SVG from the prototype (viewBox `0 0 620 330`). Node and edge data live in `pipeline.ts`:

  | Node | x, y, width | Lit in steps |
  |---|---|---|
  | Buyer | 16, 140, 88 | 1 |
  | SES | 134, 140, 88 | 1, 2 |
  | S3 | 252, 40, 88 | 3, 5 |
  | SQS | 252, 140, 88 | 4 |
  | DLQ (dashed) | 252, 240, 88 | 4 |
  | Lambda | 370, 140, 88 | 5 |
  | DynamoDB | 370, 240, 88 | 5 |
  | WebSocket | 370, 40, 88 | 6 |
  | Seller inbox | 500, 40, 104 | 6 |

  Edges and the step that lights them: `e1 M104 162 H134` (1), `e2 M222 152 C238 152 236 62 252 62` (3), `e3 M222 162 H252` (4), `e4 M296 184 V240` dashed (4), `e5 M340 162 H370` (5), `e6 M370 152 C354 152 356 62 340 62` dashed (5), `e7 M414 184 V240` (5), `e8 M414 140 V84` (6), `e9 M458 62 H500` (6). The packet follows `e1, e1, e2, e3, e5, e9` for steps 1–6.
- Node labels. English sub-labels: Contact seller, spam + virus, raw message, reference only, parse + thread, metadata, API Gateway, real time. Main labels Buyer / Seller inbox in English; المشتري / صندوق البائع in Arabic. Service names stay in English. Arabic sub-labels: زر التواصل، فحص spam وفيروسات، الرسالة الخام، مرجع فقط، تحليل + محادثة، metadata، API Gateway، لحظيًا.
- RTL: rectangles, edges and the packet sit in a group with `transform="matrix(-1 0 0 1 620 0)"`. Text is not inside that group. Its x is computed in `pipeline.ts` as `620 - (x + width / 2)`, so Buyer ends up on the right and every label still reads normally.
- Behaviour: an IntersectionObserver with `rootMargin: '-45% 0px -45% 0px'` marks the step crossing the middle of the viewport as active, lights the nodes and edges for that step, and moves the packet. The step list is the accessible content. The SVG is `aria-hidden="true"`.
- Without JavaScript: every step is fully opaque, the diagram shows all nodes in their idle state, and no packet is drawn. Step dimming and highlighting turn on only after the script adds a class to the component root.
- Reduced motion: no packet, no transitions. Highlighting still follows the scroll (it is a state change, not motion).

### 7.2 `ClaimCheckExplainer`

The approved mockup is `.superpowers/brainstorm/589-1791584624/content/claimcheck-explainer.html`. The component reproduces it.

- Props: `title`, `scenarios: { id: 'normal' | 'large' | 'fail' | 'dup'; label: string; caption: string }[]`, `alt: { label: string; caption: string }` (the switch), `svgLabels` (the in-diagram strings listed below).
- Diagram (viewBox `0 0 600 236`): SES, S3, SQS, DLQ, Lambda and DynamoDB, plus CloudWatch in the failure scenario. Scenario-only overlays:
  - Large: the contract and photo icons next to S3, and a big packet on the SES → S3 edge while the SQS packet stays small.
  - Switch on: SQS turns rose with "over size limit", a big packet goes into SQS, and a retry loop shows "every retry moves the whole file".
  - Fail: an amber retry loop between Lambda and SQS, an amber DLQ, a CloudWatch node with "email alert", and "still here ✓" under S3.
  - Duplicate: two packets go to DynamoDB, the second turns back, with the labels "1 conversation", "2nd write rejected ✕" and "key: SES message ID".
- In-diagram strings in Arabic: عقد + صور، تجاوز الحد، كل retry ينقل الملف كاملًا، ما زالت هنا ✓، retry، تنبيه بالبريد، محادثة واحدة، رُفضت الكتابة الثانية ✕، المفتاح: SES message ID. The explainer title in Arabic is "جرّب: ماذا يحدث عندما".
- Controls: scenario buttons in a `role="group"` with `aria-pressed`. The switch is a `<button role="switch" aria-checked>`, visible only in the "large" scenario, and it resets when another scenario is chosen. The caption area is `aria-live="polite"`. Buttons and the switch work with the keyboard and show the site's focus ring.
- RTL: the same mirroring as 7.1, with text kept out of the mirrored group.
- Without JavaScript: the controls are hidden, the diagram shows the "short question" state, and all five captions are listed under it, each with its scenario label as a heading.
- Reduced motion: no packets, and overlays appear without transitions.

## 8. Arabic, fonts, SEO and Home

- `BaseLayout` with `lang="ar"` imports `@fontsource/readex-pro/arabic-400.css`, `arabic-500.css` and `arabic-600.css`, and preloads the 400 woff2. Arabic pages use `font-family: 'Readex Pro', 'Inter', system-ui, sans-serif`. These are Arabic-subset files (with a `unicode-range`), so Latin words inside Arabic text are drawn with Inter. English pages never load Readex Pro.
- All new CSS uses logical properties (the existing `rtl-ready` test enforces this). The back-link arrow is part of the copy (← in English, → in Arabic).
- `BaseLayout` gets an `alternates` prop: `{ lang: string; path: string }[]`. Each case-study page emits `<link rel="alternate" hreflang>` for `en`, `ar` and `x-default` (→ English), and a canonical pointing to itself.
- JSON-LD `TechArticle`: `headline`, `description`, `inLanguage`, `author: { "@type": "Person", "name": "Mohamed Gamal", "url": "https://mohamedelsonny.github.io/" }`, `url`. No email and no phone.
- The OG image is the existing `/og.png`. Both pages are in the sitemap (the existing integration picks them up).
- Home: the Getridley row in `projects.ts` gets `href: '/case-studies/getridley'`, so `Row` renders the link, the arrow and the hover. No other Home change.

## 9. Testing

All tests are Playwright tests against the built site, like the existing ones.

- Both routes return 200 and have the right `lang` and `dir`, H1, hreflang alternates (en, ar, x-default), canonical, and JSON-LD `TechArticle` without email or phone.
- The language switcher links to the other language, and the current language has `aria-current="page"`.
- Home: the Getridley row is a link to `/case-studies/getridley`, and the link resolves.
- Scrolly: scrolling step 4 into the middle of the viewport makes it the only active step and lights SQS and DLQ. Step 6 lights WebSocket and Seller inbox.
- Explainer: each scenario button sets `aria-pressed` and shows only its caption. The switch is visible only in "large", turns on the "queue it" caption, and resets when another scenario is chosen. Everything works with the keyboard.
- No-JS (`javaScriptEnabled: false`): every step's text is visible and fully opaque, all five explainer captions are visible, and the explainer controls are hidden.
- Reduced motion (`reducedMotion: 'reduce'`): no packet elements are visible on either component.
- RTL: on the Arabic page, the Buyer node's rendered box is to the right of the SES node's box, and the label text is not mirrored (its `transform` contains no negative scale).
- Arabic font: the Arabic page requests a Readex Pro woff2, and the English page does not.
- axe: zero serious or critical violations on both pages, on desktop and at 375px.
- The internal-link check covers both pages.
- JavaScript budget: each case-study page ships under 8KB of JavaScript.
- CLS under 0.02 on both pages.
- The existing contact-leak scans already cover the new work: `contact-scan.spec.ts` over `dist/`, and `content-rules.spec.ts` over `src/` (which includes the MDX files and `pipeline.ts`). No new scanner is needed.
- Lighthouse CI: add `http://localhost/case-studies/getridley/index.html` and `http://localhost/ar/case-studies/getridley/index.html` to `ci.collect.url` in `lighthouserc.json`, with the same ≥ 0.95 thresholds.
- JavaScript budget is measured the same way as the existing Home budget in `quality.spec.ts` (sum of script bytes the page loads, inline and external).

## 10. Out of scope

- An Arabic Home page and Arabic versions of other pages.
- A case-study index page (`/case-studies`). The Home "Case studies" row link is the entry point.
- A "next case study" link. It is added when a second case study ships.
- Any other case study.
