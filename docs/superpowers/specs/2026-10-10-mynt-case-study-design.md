# Mynt.la case study — design

Date: 2026-10-10. Status: approved 2026-10-10.

This is the second case study on the portfolio. It follows the rules in `2026-10-09-portfolio-design.md` §2, §7 and §11, and it reuses everything the Getridley case study built (`2026-10-10-getridley-case-study-design.md`): the content collection, both routes, `CaseStudyLayout`, `BaseLayout` with hreflang alternates, `Tags`, `Section`, the case-study CSS, Readex Pro on Arabic pages, and the test helpers.

## 1. Goal and audience

**First audience: a senior or mid-level engineer.** They read one real ingestion pipeline, chapter by chapter, and leave with lessons they can apply to their own systems: when to ack, how to retry without making an outage worse, why consumers must be idempotent, what a dead-letter queue is for, and what a circuit breaker is for. Each lesson comes with the price it costs.

**Second audience: a hiring manager.** The page must show that these lessons come from real production work on Mynt.la, including the part that went wrong (duplicate processing) and how it was fixed.

The story shape is **"every fix has a price"**. Each chapter has the same four parts: **the problem → what Mynt did → the price → try it**. The key lesson is stated explicitly: **retries and a dead-letter queue are for a bad message; a circuit breaker is for a dependency that is down. Don't mix them.**

The page must feel like part of the same site as Home and Getridley, and it must read completely without JavaScript.

## 2. Content rules

- **The only source of truth about Mynt** is the Career Vault export `mynt-facts.md` (2026-10-10). Every claim about what Mynt did, had or suffered cites a fact ID from it (`A:`, `F:`, `M:` prefixes) or the source `user (2026-10-10)` for the clarifications recorded at the end of that file. §5 lists the sources next to every paragraph, and the same IDs go into MDX source comments next to the copy, as in the Getridley MDX files.
- **General teaching is allowed and encouraged** (what at-least-once delivery means, what half-open means, why jitter helps, why durable queues matter). It is always written as general knowledge: present tense, with no "Mynt" or "I" as the subject. §5 marks these paragraphs `general`.
- **Tense and subject.** Mynt facts are written in the past tense with the system as the subject ("Mynt's consumers acked…"). First person is used only where a fact supports it: "I built its backend" (A:0d663337) and "I owned the architectural decision (to decouple that collection through RabbitMQ) and its tradeoff analysis" (F:aaef9a06, decision a8366407). Ownership is never upgraded: no "led", "designed and built the pipeline" or "I implemented".
- **Numbers.** The only Mynt numbers are the metrics: "5+ blockchains", "3+ external APIs", and "an estimated hundreds of updates a day, up to about 1,000, with occasional higher peaks". The word "estimated" stays, per the site rule. No latency, retry count, TTL, prefetch value, throughput or duration is claimed for Mynt.
- **Chains.** Always "5+ blockchains" (Arabic: "خمس شبكات blockchain أو أكثر"), never an exact count. Examples appear only after "including" (Arabic: "منها"). The page names Ethereum, Solana and Polygon (all three are in M:4cb09610).
- **Duplicates.** The vault says duplicate processing happened "in practice" (F:fc2483ec) and "was observed" (F:6f488b9a). The copy uses exactly that wording and does not say "in production".
- **Mechanisms the vault does not record are not described.** In particular:
  - how jitter was combined with fixed-delay TTL queues, or how Retry-After was turned into a delay (only that both happened, F:458a5969);
  - which component moved an exhausted message to the parking lot (only that it was moved, F:e0097a0a);
  - the alert channel (only "alerting", F:e0097a0a);
  - whether delivery-limit messages also triggered the alert (only that they were dead-lettered, F:3ab2f064);
  - queue topology: how many queues, exchanges or consumers, or whether there was one breaker or one queue per provider;
  - half-open, cool-down and trial calls (described only as general circuit-breaker behaviour, never as a Mynt claim);
  - the recovery workflow for the parking lot (only that one was needed, F:5dae6600).
- **Demos are scripted and labelled.** Every demo shows a visible note that it is scripted and that its numbers and data are illustrative, not Mynt's real settings. Demo numbers (8 workers, delays of 1 s, 2 s and 4 s, a limit of 6, Retry-After 5 s, 3 attempts, prefetch 1–8, event IDs `evt_3f9a` and `evt_7c21`, NFT numbers) exist only inside the demos.
- **The rejected baseline** (doing the whole fetch inside cron, F:811392e6) is presented as the baseline the design is measured against, not as something Mynt ran.
- **Privacy.** The phone number never appears on the page, in metadata, in JSON-LD or in any source file. The email address is not shown on this page (the same as Getridley).
- **Languages.** English and Arabic carry the same content. The Arabic is simplified Fusha (فصحى مبسطة), and technical terms stay in English (glossary in §6).

## 3. Routes and files

| Route | Source |
|---|---|
| `/case-studies/mynt/` | `src/content/case-studies/en/mynt.mdx` |
| `/ar/case-studies/mynt/` | `src/content/case-studies/ar/mynt.mdx` |

The slug `mynt` is the same as the `slug` of the Mynt.la row in `src/content/projects.ts`.

New and changed files:

```text
src/content/case-studies/en/mynt.mdx            new
src/content/case-studies/ar/mynt.mdx            new
src/components/case-study/ingestion.ts          new: diagram geometry, stages, base state, scenario scripts, chart and prefetch demo data
src/components/case-study/IngestionStory.astro  new: the two-column story grid, the sticky diagram, the one shared script
src/components/case-study/IngestionDiagram.astro new: one SVG of the pipeline, at one stage or at all stages
src/components/case-study/StoryChapter.astro    new: one chapter (Section + mobile figure + demo slot)
src/components/case-study/ScenarioDemo.astro    new: buttons, optional switch, step lists and live log for one chapter
src/components/case-study/DedupTable.astro      new: the chapter 4 demo table
src/components/case-study/RetryChart.astro      new: the chapter 3 chart (own tiny script)
src/components/case-study/PrefetchDemo.astro    new: the chapter 7 slider (own tiny script)
src/styles/case-study.css                       + "Ingestion story" section (§4, §7)
src/content/projects.ts                         Mynt.la row gets href '/case-studies/mynt/'
lighthouserc.json                               + both Mynt URLs
tests/...                                       see §9
```

Unchanged and reused as they are: `src/content.config.ts` (the schema already fits), `src/pages/case-studies/[slug].astro`, `src/pages/ar/case-studies/[slug].astro`, `src/layouts/CaseStudyLayout.astro`, `src/layouts/BaseLayout.astro`, `src/components/Section.astro`, `src/components/Tags.astro`, `src/components/Row.astro`, `PipelineScrolly`, `ClaimCheckExplainer`, `pipeline.ts`.

Frontmatter (the existing schema):

```yaml
# en/mynt.mdx
title: "Keeping scheduled ingestion alive when upstreams fail"
description: "Mynt's scheduled ingestion from 5+ blockchains and 3+ APIs, one problem at a time: RabbitMQ, acks after the write, jittered retries, idempotent consumers, a parking-lot DLQ, circuit breakers and backpressure, and what each fix cost."
lead: "Mynt.la was an NFT marketplace that collected transactions, NFTs and analytics from 5+ blockchains and 3+ external APIs, including OpenSea. I built its backend and owned the architectural decision to decouple that collection through RabbitMQ. This is how the pipeline was made to survive failing upstreams, one problem at a time. Every fix had a price, and one of those prices became the next problem."
lang: en
translationOf: mynt
label: "Web3 & NFTs"
tags: ["RabbitMQ", "Cron", "Retries", "Dead-letter queue", "Circuit Breaker", "Idempotency"]
```

The Arabic file has the same keys with the Arabic values from §6, `lang: ar`, `label: "Web3 وNFTs"` and the same English tags (Getridley also keeps tags in English).

**No new dependencies.** Everything uses Astro, the MDX integration and the fonts already installed.

## 4. Page layout

Layout A: **one diagram that grows with the story.**

### Header and footer

These are exactly the same as Getridley, from `CaseStudyLayout`: back link, `EN / عربي` switcher, kicker `Case study · Web3 & NFTs` / `دراسة حالة · Web3 وNFTs`, H1, lead, tags, footer "Designed and built by me." and the back link again.

### Body

1. **The story** (`IngestionStory`): chapters 0–7 (Setup → Backpressure). Each chapter is a `Section` with the existing sticky, blurred section title.
2. **Takeaways**: a normal `Section` in the article column (max ~720px), after the story. It has no diagram.

### How the page tells JS from no-JS

The layout and every "shown only with / without JavaScript" rule are keyed on the CSS media feature `@media (scripting: enabled)` / `(scripting: none)`, **not** on a class added by the script. The first paint already has its final layout, so the switch from one column to two cannot shift content after load (CLS < 0.02 stays unchanged). The script adds `is-live` to `.story` only for the things that need a running script: the moving dot, the appear animation and `is-seen`. Browsers that don't support the `scripting` media feature match neither query and get the no-JS layout. The content is still complete there; only the demos are unavailable.

The sticky diagram is rendered at stage 0 (`data-stage="0"`, later pieces carry `is-off` in the HTML), so its first paint is already correct for the top of the page.

### Desktop (≥ 1024px, with JavaScript)

- `.story` is a direct child of the article body (`.cs__body`), not of a `Section`, so it spans the full content width of `.cs`. That is 1104px at most (1200px max width minus 2 × 48px padding), which makes each column 524px and the sticky SVG about 247px tall at 1280px.
- `.story` becomes a grid: `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`, `gap: 56px`. The chapters are in column 1 (inline-start), and the sticky diagram `.story__stage` is in column 2 (inline-end), `grid-row: 1`, `align-self: start`, `position: sticky`, `inset-block-start: calc(50vh - 130px)`.
- Each section title spans only the text column. Chapter prose, demos, the chart, the table and the slider all sit in the text column.
- **The active chapter** is the last chapter whose top has passed the middle of the viewport (the first chapter before that), measured on page load, on the first animation frame after a scroll or resize, and when a run's stage lock is released. This is the same rule as `PipelineScrolly`. The sticky diagram shows the active chapter's stage.
- Changing stage: pieces from later stages are hidden, and pieces of the current stage are highlighted in teal and play the appear animation (§7.3). Earlier pieces stay in their normal colours.
- Per-chapter figures are hidden (they exist for mobile and for no-JS).

### Mobile and tablet (< 1024px)

- One column. The sticky stage is hidden.
- Each chapter shows its own copy of the diagram at that chapter's stage (`.chapter__figure`). It is placed **after the chapter's prose and before its demo**, so the figure and the controls that animate it are on screen together. Chapter 0 has no demo, so its figure simply ends the chapter.
- The new pieces of that stage play the appear animation once, when the figure first scrolls into view.
- The diagram scales to the column width. Below 1024px, node names grow, and sub-labels, chip text and state notes are hidden, the same way as in Getridley. On mobile, state is shown by colour, and the log under the demo says what happened.

### Without JavaScript

- `.story` is a single article column at every width (no grid). The sticky stage is hidden. Every chapter shows its own figure at its stage, with that stage's new pieces already highlighted in teal and no animation.
- All prose is present. Demo controls (buttons, switches, slider) are hidden.
- Every scenario's steps are listed under its heading, as an ordered list. This is the same approach as Getridley, which lists all explainer captions without JavaScript. The chapter 3 chart shows its default state, with all four captions listed under their headings. The chapter 4 table and the chapter 7 readouts are hidden, because they only show demo output.

### Reduced motion (`prefers-reduced-motion: reduce`)

- Message dots do not travel. On each hop, the dot is placed straight at the end of the edge, so it jumps step by step. Step timing and the log are unchanged.
- The appear animation is off. New pieces are simply shown, highlighted in teal.
- Stage changes and state colours still happen. They are state changes, not motion.

### Diagram caption

Under the sticky stage and under every chapter figure there is one muted line:

- EN: "Simplified: one queue, one consumer and one provider stand for many."
- AR: "رسم مبسّط: queue واحد وconsumer واحد ومصدر واحد تمثل الكثير."

The diagram does not claim Mynt's real topology (§2), and this line says so.

## 5. Copy (English) and sources

The Arabic copy is in §6. Source notation: fact IDs from `mynt-facts.md`; `user (2026-10-10)` for the confirmed clarifications in that file; `general` for general teaching that makes no claim about Mynt. Paragraphs are listed in page order.

**Meta.** Title (from the layout): "Keeping scheduled ingestion alive when upstreams fail · Mohamed Gamal". Description: "Mynt's scheduled ingestion from 5+ blockchains and 3+ APIs, one problem at a time: RabbitMQ, acks after the write, jittered retries, idempotent consumers, a parking-lot DLQ, circuit breakers and backpressure, and what each fix cost."
Sources: A:b65205f0, M:4cb09610, M:1158cefb, F:6b12dd22, F:1e727868, F:458a5969, F:6f488b9a, F:e0097a0a, F:1708f3e4, F:229e151d; "what each fix cost": F:ca32d0b6, F:1d7094e5, F:1f28435f, F:bcbf9d80, F:5dae6600, F:41a46d68, F:0168395d.

**H1.** Keeping scheduled ingestion alive when upstreams fail

**Lead.** Mynt.la was an NFT marketplace that collected transactions, NFTs and analytics from 5+ blockchains and 3+ external APIs, including OpenSea. I built its backend and owned the architectural decision to decouple that collection through RabbitMQ. This is how the pipeline was made to survive failing upstreams, one problem at a time. Every fix had a price, and one of those prices became the next problem.
Sources: project 5afd6a66 ("Web3 & NFT Marketplace"), F:d1e7f7cb, A:b65205f0, M:1158cefb, A:0d663337, F:aaef9a06 with decision a8366407 ("Decouple scheduled multi-source ingestion with RabbitMQ…"), F:1e7d027a. "One of those prices became the next problem": F:1f28435f (redelivery on purpose) → F:fc2483ec (duplicates).

**Tags.** RabbitMQ (F:6b12dd22), Cron (F:7f5f0068), Retries (F:43c6ae32), Dead-letter queue (F:e0097a0a), Circuit Breaker (F:1708f3e4), Idempotency (F:6f488b9a).

### 0. The setup (`#setup`, stage 0)

Mynt was a Web3 and NFT marketplace. Its backend surfaced wallet assets and on-chain transactions, and it integrated with OpenSea. To do that, it collected transactions, NFTs and analytics from 5+ blockchains, including Ethereum, Solana and Polygon, and from 3+ external APIs, including OpenSea, then stored the data and presented it.
Sources: project 5afd6a66, A:0d663337, F:d1e7f7cb, F:72e6ffe3, M:4cb09610, M:1158cefb, A:b65205f0.

That came to an estimated hundreds of updates a day, up to about 1,000, with occasional higher peaks. The problem was running that collection on a schedule, across many external sources, without losing work, while those sources failed: some briefly, some again and again. Any external source can be slow, rate-limited or down, on its own schedule.
Sources: M:44245385, F:e3f47f28, F:089001ad, F:35c3c185. Last sentence: general.

I owned the architectural decision and its tradeoff analysis. The rest of this page walks through that design one problem at a time. Each chapter has the same four parts: the problem, what Mynt did, the price, and a small demo you can run. The demos are scripted, and their numbers are illustrative, not Mynt's real settings.
Sources: F:aaef9a06. The rest: a description of the page.

### 1. The naive cron (`#cron`, stage 1)

The simplest design does everything inside the cron job: wake up, call every provider, write the results, exit. It is easy to operate. But it ties the whole collection to one process finishing one run. If that process crashes halfway, or a burst of work makes it run long or time out, whatever it had not reached is simply not collected, and nothing records that the work was owed. Looking back, this is the baseline the real design is measured against, not something Mynt ran.
Sources: F:811392e6 (rejected option, retrospective baseline: "simpler to operate… couples successful collection to one scheduler process and handles bursts and failures poorly"). The crash walkthrough is general.

Mynt separated scheduling from processing. Cron jobs only published collection work to RabbitMQ. Consumers took that work from the queue, collected transactions, NFTs and analytics across the chains and APIs, and stored them. Once a job is in the queue, it lives outside the cron process, so a crashed cron run no longer erases it.
Sources: F:d8e2ce10, F:7f5f0068, F:4040a84b, F:36c923f3, F:35c3c185, F:1e7d027a.

A general caveat: a queue protects work only if the queue itself survives. In RabbitMQ that means durable queues and persistent messages; otherwise a broker restart loses what a cron crash could not.
Sources: general (no claim about Mynt's queue settings).

The price came in two parts. Data was no longer fresh the moment cron ran: it could lag while work waited in the queue or retried. And there was now a broker to operate, with connections, durability and monitoring that a cron job never needed.
Sources: F:ca32d0b6, F:1d7094e5.

Demo: §7.4, chapter `cron`.

### 2. Ack at the right time (`#ack`, stage 2)

A queue keeps a message safe only until a consumer says it is done with it. In RabbitMQ that signal is the acknowledgement, or ack. If a consumer acks a message as soon as it receives it, or uses automatic acks, and then crashes before saving, the broker has already deleted the message. Nothing fails loudly. The data is just missing.
Sources: general.

Mynt's consumers used manual acks and acked a message only after it was processed and written to the database. A message that failed was rejected without being requeued, so it took the retry path in the next chapter instead of bouncing straight back into the queue.
Sources: F:1e727868, F:2547d802, user (2026-10-10) (retry path).

Acking late closes the silent-loss hole, but it opens another one on purpose. If a worker crashes after the write and before the ack, RabbitMQ delivers the same message again. Hold on to that second delivery: it comes back in "What actually went wrong".
Sources: F:1f28435f. The crash-after-write case is general.

Demo: §7.4, chapter `ack`.

### 3. Retries (`#retries`, stage 3)

Most upstream failures are temporary: a timeout, a dropped connection, an HTTP 429 that means "too many requests, slow down". The message is fine; the moment was bad, so it deserves another try. But retrying immediately, in a tight loop, hammers a provider that is already struggling.
Sources: general.

Mynt's retries ran through RabbitMQ itself. A consumer that hit a failure rejected the message without requeue. The queue's dead-letter exchange (DLX) routed it to a retry queue whose TTL set the delay, with one retry queue per delay. When the TTL ran out, the message came back to be processed again. The x-death header, which RabbitMQ updates each time a message is dead-lettered, capped the number of attempts. Backoff had jitter, and on an HTTP 429 the wait honored the provider's Retry-After header.
Sources: F:8cb66993, F:2547d802, F:43c6ae32, F:458a5969, user (2026-10-10) (the flow: reject → DLX → per-delay TTL retry queues → back; x-death cap). "Which RabbitMQ updates each time…": general.

Why jitter matters: when many workers fail at the same moment and all wait the same delay, they also retry at the same moment. The provider sees silence, then a spike, again and again. Adding a random amount to each wait spreads those retries out. And Retry-After is the provider saying exactly how long to wait; honoring it beats guessing.
Sources: general.

Every retry adds latency. Bounded attempts and backoff were used to keep retries from making an upstream outage worse, at the cost of slower recovery for each message that failed.
Sources: F:bcbf9d80.

Demo: §7.5 (chart).

### 4. What actually went wrong (`#duplicates`, stage 4)

So far, this is the design working as planned. Here is what it did in practice: retries and redelivery caused duplicate processing. The same message was processed more than once.
Sources: F:fc2483ec, F:6f488b9a.

That is not a RabbitMQ bug. It is the deal. Acking after the write and retrying on failure give you at-least-once delivery: the broker promises not to lose a message, and in exchange it may hand you the same message twice. Exactly-once delivery is not something you can rely on a broker for. What you can build is an exactly-once effect: a consumer that, given the same message twice, leaves the data as if it had seen it once. That property is called idempotency.
Sources: general.

After the duplicates were observed, Mynt's consumers were made idempotent in code. They deduplicated messages by event ID, so a retry or a redelivery no longer duplicated stored data.
Sources: F:6f488b9a, F:fc4a772e, F:a6eff09b.

The lesson: acking late and retrying are both right, and together they make duplicates a matter of when, not if. Make consumers idempotent before the first duplicate shows up, not after.
Sources: the order of events is F:6f488b9a ("after duplicate processing was observed"). The advice is general.

Idempotency has a price too: every message needs a stable ID, and every write has to respect it.
Sources: general.

Demo: §7.4, chapter `duplicates`, with the table from §7.6. **This is the heart of the page:** the chapter is not shortened, and its demo is the only one with two outputs (diagram and table).

### 5. Poison messages (`#poison`, stage 5)

Some messages will never succeed: a payload the parser can't read, data that breaks an assumption in the code. Retrying does not help. With unlimited retries, they cycle forever, burn capacity and bury real errors in noise.
Sources: general.

Mynt's attempts were bounded. A message that used up its retries was moved to a parking-lot dead-letter queue, and an alert went out.
Sources: F:bcbf9d80, F:8cb66993, F:e0097a0a, F:43c6ae32, user (2026-10-10).

Some messages fail harder: they crash the worker itself. The consumer never gets to reject them, so the x-death count never moves, and RabbitMQ simply redelivers them to the next worker. For those, Mynt's quorum queues had a delivery limit: once a message had been redelivered too many times, the queue dead-lettered it.
Sources: F:3ab2f064, user (2026-10-10) ("the quorum queue's delivery limit caught messages that were redelivered because they crashed the worker itself"). Why x-death does not move: general.

Parking a message stops the loop; it does not fix the message. Someone has to look at the parking lot, fix the cause, then replay or drop what is there, so a dead-letter queue needs a recovery workflow.
Sources: F:5dae6600. What a recovery workflow involves: general.

Demo: §7.4, chapter `poison`.

### 6. The provider that is down (`#breaker`, stage 6)

Retries assume the failure is brief. When a provider is fully down, every message for it fails, every retry fails too, and the retries pile load onto a service that is trying to recover. Bounded retries then end in the dead-letter queue, which is worse: the parking lot fills with healthy messages whose only problem was timing, and each one has to be replayed by hand.
Sources: general (F:36c923f3 records the rationale "stop repeated calls when an upstream source was persistently unhealthy").

Mynt put circuit breakers around upstream processing. When a provider kept failing, a breaker opened and consumption from that provider paused. Its messages were not sent to the dead-letter queue; they waited in the queue until the provider was healthy again.
Sources: F:d8e2ce10, F:1708f3e4, F:36c923f3, user (2026-10-10) ("consumption from that provider paused and the messages waited in the queue. They were NOT sent to the DLQ").

A circuit breaker has three states. Closed: calls go through as normal. Open: after too many failures, calls stop at once, without touching the provider. Half-open: after a cool-down, a trial call goes through. If it succeeds, the breaker closes; if it fails, the breaker opens again.
Sources: general.

**Key lesson** (a callout, `<aside class="story__lesson">`, styled with a teal inline-start border):
> Retries and a dead-letter queue are for a bad message. A circuit breaker is for a dependency that is down. Don't mix them.
Sources: general lesson, drawn from F:1708f3e4, F:e0097a0a and user (2026-10-10).

While a circuit is open, data from that provider is stale or incomplete.
Sources: F:41a46d68.

Demo: §7.4, chapter `breaker`.

### 7. Backpressure (`#backpressure`, stage 7)

Peaks are where pipelines tip over. A consumer that takes every message it can holds hundreds of unacked messages in memory and fires calls at providers as fast as it can, and the providers answer with 429s.
Sources: general.

Mynt's consumers had a prefetch limit and concurrency limits. Prefetch caps how many unacked messages a consumer holds at once; the broker stops sending more until it acks some. Together, these limits gave backpressure to the workers and to the external APIs.
Sources: F:229e151d, F:2547d802. What prefetch does: general.

Tuned conservatively, those limits also cap peak throughput: at a peak, work waits in the queue a little longer.
Sources: F:0168395d. "Work waits… longer": general consequence, consistent with F:ca32d0b6.

Demo: §7.7.

### 8. Takeaways (`#takeaways`, article column, no stage)

If you are building scheduled ingestion over upstreams you don't control, here is a checklist to take with you. Every item has a price. Pay it on purpose.
Sources: framing.

An ordered list, `<ol class="takeaways">`. Each item has a bold lead sentence, optional body text, and a separate price line, `<p class="takeaways__price"><strong>Price:</strong> …</p>`:

1. **Separate scheduling from processing.** Cron publishes work; consumers do it. Price: data can lag, and you now run a broker. (F:36c923f3, F:d8e2ce10, F:ca32d0b6, F:1d7094e5)
2. **Ack after the write, never on receipt.** Price: a crash after the write means the message comes again. (F:1e727868, F:1f28435f)
3. **Retry transient failures with bounded attempts, jittered backoff and Retry-After.** Price: more latency for every message that fails. (F:bcbf9d80, F:458a5969, F:8cb66993)
4. **Make every consumer idempotent from day one.** Mynt added it after duplicates appeared; you don't have to wait for that. Price: a stable ID on every message and a check on every write. (F:6f488b9a, F:fc4a772e; the price is general)
5. **Park bad messages; break the circuit on a dead dependency.** Retries and a dead-letter queue are for a bad message; a circuit breaker is for a dependency that is down. Price: a recovery workflow for the parking lot, and stale data while a circuit is open. (F:e0097a0a, F:5dae6600, F:1708f3e4, F:41a46d68)
6. **Limit prefetch and concurrency.** Price: lower throughput at peaks. (F:229e151d, F:0168395d)

With these in place, Mynt's collection work was preserved for processing, and ingestion tolerated upstream failures without depending on one synchronous run.
Sources: F:1e7d027a.

### Demo copy (English)

Shared strings:

- Demo note, under every scenario demo title: "Scripted demo. Numbers and data are illustrative, not Mynt's real settings."
- Idle line, before the first run: "Pick a scenario to run it."
- Price label in Takeaways: "Price:"

Per chapter:

| Chapter | Demo title | Buttons (`run` / `alt`) | Switch |
|---|---|---|---|
| `cron` | Try it: crash the cron | "Crash the naive cron" (`naive-crash`), "Crash the cron + queue" (`queued-crash`) | none |
| `ack` | Try it: crash the worker | "Crash before save" (`crash-before-save`), "Crash after save" (`crash-after-save`) | none |
| `duplicates` | Try it: the same message, twice | "Deliver the message again" (`redeliver` / `redeliver-dedup`) | "Dedup by event ID", default off |
| `poison` | Try it: a message that always fails | "Send a poison message" (`poison`) | none |
| `breaker` | Try it: a provider goes down | "Take the provider down" (`provider-down` / `provider-down-dlq`) | "What if failures went to the DLQ instead?", default off |

When the switch is on, the button runs its `alt` scenario.

Run headings (used for the no-JS lists and as each list's accessible name):

| Scenario | Heading |
|---|---|
| `naive-crash` | Crash the naive cron |
| `queued-crash` | Crash the cron + queue |
| `crash-before-save` | Crash before save |
| `crash-after-save` | Crash after save |
| `redeliver` | Deliver the message again, without dedup |
| `redeliver-dedup` | Deliver the message again, with dedup by event ID |
| `poison` | Send a poison message |
| `provider-down` | Take the provider down |
| `provider-down-dlq` | Take the provider down, with failures sent to the DLQ |

The step log lines for each scenario are in §7.4, next to their scripts, in English and Arabic.

## 6. Arabic copy

**Glossary.** These stay in English inside Arabic text: Mynt, Mynt.la, Web3, NFT/NFTs, OpenSea, Ethereum, Solana, Polygon, blockchain, API/APIs, backend, RabbitMQ, broker, cron, queue, durable queues, persistent messages, durability, exchange, dead-letter exchange (DLX), dead-letter queue, DLQ, dead-lettering, parking lot, parking-lot dead-letter queue, consumer/consumers, worker/workers, ack, acknowledgement, manual acks, automatic acks, requeue, retry/retries, retry queue, TTL, x-death, header, backoff, jitter, Retry-After, HTTP 429, timeout, rate limit, payload, parser, poison, idempotent, idempotency, dedup, event ID, ID, at-least-once delivery, exactly-once, quorum queues, delivery limit, recovery workflow, circuit breaker/breaker, closed, open, half-open, prefetch, concurrency, backpressure, tradeoffs, evt_... IDs. Everything else is Arabic. Digits are Western (0-9).

**Meta.** Title: "جمع بيانات مجدول يصمد حين تتعطل المصادر · محمد جمال". Description: "جمع Mynt المجدول للبيانات من خمس شبكات blockchain أو أكثر وثلاث APIs أو أكثر، مشكلةً بعد مشكلة: RabbitMQ، والـ ack بعد الكتابة، وretries مع jitter، وconsumers من نوع idempotent، وparking-lot DLQ، وcircuit breakers، وbackpressure، وثمن كل حل."

**H1.** جمع بيانات مجدول يصمد حين تتعطل المصادر

**Lead.** كانت Mynt.la سوق NFT يجمع المعاملات والـ NFTs والتحليلات من خمس شبكات blockchain أو أكثر، ومن ثلاث APIs خارجية أو أكثر، منها OpenSea. بنيتُ الـ backend الخاص بها، وكنتُ صاحب القرار المعماري بفصل هذا الجمع عبر RabbitMQ. هذه قصة كيف صار هذا المسار يصمد أمام تعطل المصادر، مشكلةً بعد مشكلة. لكل حل ثمن، وأحد هذه الأثمان صار المشكلة التالية.

**Kicker label.** Web3 وNFTs

### السياق (`#setup`)

كانت Mynt سوق Web3 وNFT. كان الـ backend الخاص بها يعرض أصول المحافظ والمعاملات على الشبكة، ويتكامل مع OpenSea. ولكي يفعل ذلك، كان يجمع المعاملات والـ NFTs والتحليلات من خمس شبكات blockchain أو أكثر، منها Ethereum وSolana وPolygon، ومن ثلاث APIs خارجية أو أكثر، منها OpenSea، ثم يخزّن البيانات ويعرضها.

وصل ذلك إلى ما يُقدَّر بمئات إلى نحو 1000 تحديث يوميًا، مع ذروات أعلى أحيانًا. وكانت المشكلة تشغيل هذا الجمع وفق جدول زمني، عبر مصادر خارجية كثيرة، دون أن يضيع أي عمل، بينما تتعطل هذه المصادر: بعضها لحظةً، وبعضها مرةً بعد مرة. فأي مصدر خارجي قد يبطئ، أو يفرض rate limit، أو يتوقف، وفق توقيته الخاص.

كنتُ صاحب القرار المعماري وتحليل الـ tradeoffs الخاص به. وتتتبع بقية الصفحة هذا التصميم مشكلةً بعد مشكلة. لكل فصل الأجزاء الأربعة نفسها: المشكلة، وما فعلته Mynt، والثمن، وعرض صغير يمكنك تشغيله. العروض مُعدّة مسبقًا، وأرقامها للتوضيح فقط، وليست إعدادات Mynt الحقيقية.

### الـ cron الساذج (`#cron`)

أبسط تصميم يفعل كل شيء داخل مهمة الـ cron: يستيقظ، ويستدعي كل مصدر، ويكتب النتائج، ثم ينتهي. تشغيله سهل. لكنه يربط الجمع كله بعملية واحدة يجب أن تُكمل تشغيلًا واحدًا. فإذا تعطلت هذه العملية في المنتصف، أو جعلتها دفعة كبيرة من العمل تطول أو تتجاوز الـ timeout، فكل ما لم تصل إليه لا يُجمع ببساطة، ولا يسجّل شيء أن هذا العمل كان مستحقًا. وبالنظر إلى الوراء، هذا هو خط الأساس الذي يُقاس عليه التصميم الحقيقي، وليس شيئًا شغّلته Mynt.

فصلت Mynt الجدولة عن المعالجة. صارت مهام الـ cron تنشر عمل الجمع إلى RabbitMQ فقط. وكانت الـ consumers تأخذ هذا العمل من الـ queue، وتجمع المعاملات والـ NFTs والتحليلات عبر الشبكات والـ APIs، ثم تخزّنها. وما إن تدخل المهمة إلى الـ queue حتى تعيش خارج عملية الـ cron، فلا يمحوها تعطل الـ cron بعد ذلك.

ملاحظة عامة: الـ queue لا يحمي العمل إلا إذا بقي هو نفسه سليمًا. وفي RabbitMQ يعني ذلك durable queues وpersistent messages، وإلا فإن إعادة تشغيل الـ broker تُضيّع ما لم يستطع تعطل الـ cron أن يُضيّعه.

جاء الثمن في جزأين. لم تعد البيانات حديثة لحظة تشغيل الـ cron، بل قد تتأخر بينما ينتظر العمل في الـ queue أو تُعاد محاولته. وصار هناك broker يجب تشغيله، باتصالاته والـ durability ومراقبته، وهي أمور لم تحتجها مهمة cron قط.

### الـ ack في الوقت الصحيح (`#ack`)

الـ queue يحفظ الرسالة فقط حتى يعلن الـ consumer أنه انتهى منها. وفي RabbitMQ تُسمى هذه الإشارة acknowledgement، أو ack. فإذا أرسل الـ consumer الـ ack فور استلام الرسالة، أو استخدم automatic acks، ثم تعطل قبل الحفظ، فإن الـ broker يكون قد حذف الرسالة بالفعل. لا شيء يفشل بصوت مسموع؛ البيانات ببساطة غير موجودة.

استخدمت consumers في Mynt الـ manual acks، ولم ترسل ack للرسالة إلا بعد معالجتها وكتابتها في قاعدة البيانات. والرسالة التي تفشل كانت تُرفض دون requeue، فتسلك مسار الـ retry في الفصل التالي بدلًا من أن ترتد مباشرةً إلى الـ queue.

تأخير الـ ack يسدّ ثغرة الضياع الصامت، لكنه يفتح ثغرة أخرى عن قصد. فإذا تعطل الـ worker بعد الكتابة وقبل الـ ack، يسلّم RabbitMQ الرسالة نفسها مرة أخرى. احتفظ بهذا التسليم الثاني في ذهنك، فهو يعود في فصل «ما الذي حدث خطأً فعلًا».

### الـ retries (`#retries`)

معظم أعطال المصادر مؤقتة: timeout، أو اتصال انقطع، أو HTTP 429 يعني «طلبات كثيرة، تمهّل». الرسالة سليمة، لكن التوقيت كان سيئًا، فهي تستحق محاولة أخرى. غير أن إعادة المحاولة فورًا وفي حلقة سريعة تُثقل مصدرًا يعاني أصلًا.

كانت الـ retries في Mynt تمر عبر RabbitMQ نفسه. الـ consumer الذي يواجه فشلًا يرفض الرسالة دون requeue. فيوجّهها الـ dead-letter exchange (DLX) الخاص بالـ queue إلى retry queue يحدد الـ TTL فيه مدة الانتظار، مع retry queue لكل مدة. وحين ينتهي الـ TTL تعود الرسالة لتُعالَج من جديد. وكان الـ header المسمى x-death، الذي يحدّثه RabbitMQ في كل مرة تمر فيها الرسالة بالـ dead-lettering، يضع حدًا أقصى لعدد المحاولات. وكان الـ backoff يتضمن jitter، وعند HTTP 429 كان الانتظار يحترم الـ header المسمى Retry-After الذي يرسله المصدر.

لماذا الـ jitter مهم: حين تفشل workers كثيرة في اللحظة نفسها وتنتظر كلها المدة نفسها، فإنها تعيد المحاولة في اللحظة نفسها أيضًا. يرى المصدر صمتًا ثم ذروة، مرةً بعد مرة. وإضافة مقدار عشوائي إلى كل انتظار تنشر هذه المحاولات. أما Retry-After فهو المصدر يخبرك بالضبط كم تنتظر، واحترامه أفضل من التخمين.

كل retry يضيف تأخيرًا. واستُخدمت المحاولات المحدودة والـ backoff لمنع الـ retries من تضخيم تعطل المصدر، مقابل تعافٍ أبطأ لكل رسالة فشلت.

### ما الذي حدث خطأً فعلًا (`#duplicates`)

حتى الآن، هذا هو التصميم يعمل كما خُطط له. وهذا ما حدث عمليًا: سبّبت الـ retries وإعادة التسليم معالجةً مكررة. فقد عولجت الرسالة نفسها أكثر من مرة.

هذا ليس خطأً في RabbitMQ، بل هذا هو الثمن المتفق عليه. فالـ ack بعد الكتابة والـ retry عند الفشل يعطيانك at-least-once delivery: يعدك الـ broker بألا يضيّع رسالة، ومقابل ذلك قد يسلّمك الرسالة نفسها مرتين. ولا يمكنك الاعتماد على broker ليقدّم لك exactly-once delivery. ما يمكنك بناؤه هو أثر exactly-once: consumer إذا تلقى الرسالة نفسها مرتين، ترك البيانات كما لو أنه رآها مرة واحدة. وتُسمى هذه الخاصية idempotency.

بعد ملاحظة التكرار، جُعلت consumers في Mynt من نوع idempotent داخل الكود. صارت تزيل التكرار بالـ event ID، فلم تعد الـ retries أو إعادة التسليم تكرر البيانات المخزنة.

الدرس: تأخير الـ ack وإعادة المحاولة كلاهما صحيح، ومعًا يجعلان التكرار مسألة وقت لا أكثر. اجعل الـ consumers من نوع idempotent قبل أن يظهر أول تكرار، لا بعده.

وللـ idempotency ثمن أيضًا: تحتاج كل رسالة إلى ID ثابت، ويجب أن تحترمه كل عملية كتابة.

### رسائل poison (`#poison`)

بعض الرسائل لن تنجح أبدًا: payload لا يستطيع الـ parser قراءته، أو بيانات تكسر افتراضًا في الكود. إعادة المحاولة لا تفيد هنا. ومع retries بلا حد، تدور هذه الرسائل إلى الأبد، وتستهلك السعة، وتدفن الأخطاء الحقيقية في الضجيج.

كانت المحاولات في Mynt محدودة. والرسالة التي تستنفد محاولاتها كانت تنتقل إلى parking-lot dead-letter queue، ويصدر تنبيه.

وبعض الرسائل تفشل بشكل أعنف: تُسقط الـ worker نفسه. فلا يصل الـ consumer أبدًا إلى رفضها، ولا يتحرك عدّاد x-death، ويعيد RabbitMQ تسليمها ببساطة إلى الـ worker التالي. ولهذه الحالات كان لـ quorum queues في Mynt حدّ للتسليم، أي delivery limit: فإذا أُعيد تسليم الرسالة مرات كثيرة، طبّق عليها الـ queue الـ dead-lettering.

إيقاف الرسالة في الـ parking lot يوقف الحلقة، لكنه لا يصلح الرسالة. يجب أن ينظر أحد في الـ parking lot، ويصلح السبب، ثم يعيد تشغيل ما فيه أو يحذفه. لذلك يحتاج الـ dead-letter queue إلى recovery workflow.

### المصدر المتوقف (`#breaker`)

تفترض الـ retries أن العطل قصير. فحين يتوقف مصدر تمامًا، تفشل كل رسالة موجهة إليه، وتفشل كل retry أيضًا، وتضيف الـ retries حملًا على خدمة تحاول التعافي. ثم تنتهي الـ retries المحدودة في الـ dead-letter queue، وهذا أسوأ: يمتلئ الـ parking lot برسائل سليمة مشكلتها الوحيدة هي التوقيت، ويجب إعادة تشغيل كل واحدة منها يدويًا.

وضعت Mynt circuit breakers حول معالجة المصادر. فحين يتكرر فشل مصدر، يصبح الـ breaker في حالة open، ويتوقف الاستهلاك من هذا المصدر مؤقتًا. لم تكن رسائله تُرسَل إلى الـ dead-letter queue، بل كانت تنتظر في الـ queue حتى يتعافى المصدر.

للـ circuit breaker ثلاث حالات. closed: تمر الاستدعاءات كالمعتاد. open: بعد فشل متكرر، تتوقف الاستدعاءات فورًا دون الوصول إلى المصدر. half-open: بعد فترة تهدئة، يمر استدعاء تجريبي؛ فإن نجح عاد الـ breaker إلى closed، وإن فشل عاد إلى open.

**الدرس الأساسي** (the same callout):
> الـ retries والـ dead-letter queue لرسالة سيئة. والـ circuit breaker لخدمة تعتمد عليها وقد توقفت. لا تخلط بينهما.

ما دامت الدائرة open، تكون بيانات هذا المصدر قديمة أو ناقصة.

### الـ backpressure (`#backpressure`)

في الذروات تنهار المسارات. فالـ consumer الذي يأخذ كل رسالة يستطيع أخذها يحمل في الذاكرة مئات الرسائل التي لم يُرسل لها ack، ويطلق الاستدعاءات نحو المصادر بأسرع ما يمكن، فترد المصادر بـ 429.

كان لـ consumers في Mynt حدٌّ للـ prefetch وحدود للـ concurrency. يحدد الـ prefetch عدد الرسائل التي لم يُرسل لها ack ويحملها الـ consumer في وقت واحد، فيتوقف الـ broker عن إرسال المزيد حتى يرسل الـ consumer ack لبعضها. ومعًا وفّرت هذه الحدود backpressure للـ workers وللـ APIs الخارجية.

وحين تُضبط هذه الحدود بتحفّظ، فإنها تحدّ أيضًا من أقصى معدل للمعالجة: ففي الذروة ينتظر العمل في الـ queue وقتًا أطول قليلًا.

### الخلاصة (`#takeaways`)

إذا كنت تبني جمعًا مجدولًا للبيانات من مصادر لا تتحكم فيها، فهذه قائمة تأخذها معك. لكل بند ثمن، فادفعه عن قصد.

1. **افصل الجدولة عن المعالجة.** ينشر الـ cron العمل، وتنفّذه الـ consumers. الثمن: قد تتأخر البيانات، وصار لديك broker تديره.
2. **أرسل الـ ack بعد الكتابة، لا عند الاستلام أبدًا.** الثمن: التعطل بعد الكتابة يعني أن الرسالة ستصل مرة أخرى.
3. **أعد محاولة الأعطال المؤقتة بمحاولات محدودة، وbackoff مع jitter، واحترام Retry-After.** الثمن: تأخير أكبر لكل رسالة تفشل.
4. **اجعل كل consumer من نوع idempotent من اليوم الأول.** أضافتها Mynt بعد ظهور التكرار، ولست مضطرًا لانتظار ذلك. الثمن: ID ثابت لكل رسالة، وفحص عند كل كتابة.
5. **أوقف الرسائل السيئة في الـ parking lot، واقطع الدائرة حين تتوقف خدمة تعتمد عليها.** الـ retries والـ dead-letter queue لرسالة سيئة، والـ circuit breaker لخدمة تعتمد عليها وقد توقفت. الثمن: recovery workflow للـ parking lot، وبيانات قديمة ما دامت الدائرة open.
6. **ضع حدودًا للـ prefetch والـ concurrency.** الثمن: معدل معالجة أقل في الذروات.

Price label: "الثمن:".

بهذه الأنماط مجتمعة، حُفظ عمل الجمع في Mynt حتى يُعالَج، وصار مسار الجمع يتحمل أعطال المصادر دون الاعتماد على تشغيل متزامن واحد.

### Demo copy (Arabic)

- Demo note: "عرض توضيحي مُعَدّ مسبقًا. الأرقام والبيانات للتوضيح فقط، وليست إعدادات Mynt الحقيقية."
- Idle line: "اختر سيناريو لتشغيله."

| Chapter | Demo title | Buttons | Switch |
|---|---|---|---|
| `cron` | جرّب: أسقِط الـ cron | "أسقِط الـ cron الساذج"، "أسقِط الـ cron مع الـ queue" | — |
| `ack` | جرّب: أسقِط الـ worker | "تعطّل قبل الحفظ"، "تعطّل بعد الحفظ" | — |
| `duplicates` | جرّب: الرسالة نفسها مرتين | "سلّم الرسالة مرة أخرى" | "Dedup بالـ event ID" |
| `poison` | جرّب: رسالة تفشل دائمًا | "أرسل رسالة poison" | — |
| `breaker` | جرّب: مصدر يتوقف | "أوقِف المصدر" | "ماذا لو ذهبت الأعطال إلى الـ DLQ بدلًا من ذلك؟" |

Run headings:

| Scenario | Heading |
|---|---|
| `naive-crash` | أسقِط الـ cron الساذج |
| `queued-crash` | أسقِط الـ cron مع الـ queue |
| `crash-before-save` | تعطّل قبل الحفظ |
| `crash-after-save` | تعطّل بعد الحفظ |
| `redeliver` | سلّم الرسالة مرة أخرى، بدون dedup |
| `redeliver-dedup` | سلّم الرسالة مرة أخرى، مع dedup بالـ event ID |
| `poison` | أرسل رسالة poison |
| `provider-down` | أوقِف المصدر |
| `provider-down-dlq` | أوقِف المصدر، مع إرسال الأعطال إلى الـ DLQ |

## 7. Interactive components

All visible text reaches the components through props from the MDX file, so one component serves both languages. There is no client framework. Two rules exist because of the existing 8KB JavaScript budget test (§9), which counts **every** inline script except JSON-LD:

1. Scenario scripts, geometry and demo data are rendered into HTML (elements and `data-*` attributes) at build time. They are never shipped as JavaScript or as `<script type="application/json">`.
2. Client scripts import nothing from `ingestion.ts` except the two timing constants `HOP_MS` and `HOLD_MS`.

Expected JavaScript on the page: Spotlight (~0.5KB), the story script (≤ 4KB), RetryChart (≤ 0.5KB) and PrefetchDemo (≤ 0.7KB). That stays under the unchanged 8KB budget.

### 7.1 `ingestion.ts` (data, build time only)

```ts
export const VIEW_W = 680;
export const VIEW_H = 320;
export const HOP_MS = 700;   // one dot travelling one edge
export const HOLD_MS = 1200; // pause after a step's movement, before the next step

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type NodeId = 'providers' | 'db' | 'cron' | 'exchange' | 'queue' | 'consumer' | 'retry' | 'parking';
export type EdgeId =
  | 'cronEx' | 'exQ' | 'qCon' | 'conProv' | 'conDb' | 'ack' | 'qRetry' | 'retryEx' | 'qPark'
  | 'naiveProv' | 'naiveDb';
export type ChipId = 'dedup' | 'breaker' | 'prefetch';
export type Hop = EdgeId | `-${EdgeId}`; // a leading '-' means the dot travels the edge backwards
export type Tone = 'teal' | 'amber' | 'rose';

export interface DiagramNode { id: NodeId; x: number; y: number; w: number; h: number; stage: Stage; dashed?: boolean }
export interface DiagramEdge { id: EdgeId; d: string; stage: Stage; naive?: boolean; dashed?: boolean }
export interface DiagramChip { id: ChipId; x: number; y: number; w: number; h: number; stage: Stage }

/** Every key is rendered as data-<key> on the diagram root and on the chapter element. */
export interface DiagramState {
  naive: 'yes' | 'no';
  queue: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  rows: '0' | '1' | '2' | '3';
  dup: 'yes' | 'no';
  parking: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  down: 'none' | 'cron' | 'consumer' | 'providers';
  breaker: 'closed' | 'open' | 'half-open' | 'off';
  bell: 'yes' | 'no';
  lost: 'yes' | 'no';
  stale: 'yes' | 'no';
  dedup: 'on' | 'off' | 'hit';
  prefetch: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
}

export const BASE_STATE: DiagramState = {
  naive: 'no', queue: '2', rows: '1', dup: 'no', parking: '0', down: 'none',
  breaker: 'closed', bell: 'no', lost: 'no', stale: 'no', dedup: 'on', prefetch: '3',
};

export interface ScenarioStep {
  move?: Hop[];                    // travelled in order, HOP_MS each
  tone?: Tone;                     // dot colour; default teal
  pre?: Partial<DiagramState>;     // applied when the step starts
  set?: Partial<DiagramState>;     // applied when the movement ends
}
export type ScenarioId =
  | 'naive-crash' | 'queued-crash' | 'crash-before-save' | 'crash-after-save'
  | 'redeliver' | 'redeliver-dedup' | 'poison' | 'provider-down' | 'provider-down-dlq';
export interface Scenario { stage: Stage; initial: Partial<DiagramState>; steps: ScenarioStep[] }
export const SCENARIOS: Record<ScenarioId, Scenario>; // the scripts in §7.4

/** State as the string written into data-base / data-pre / data-set: "queue:2 rows:1". */
export function stateAttr(state: Partial<DiagramState>): string;
/** Labels are drawn outside the mirrored group, so in RTL their x is mirrored by hand. */
export function mx(x: number, rtl: boolean): number; // rtl ? VIEW_W - x : x
export type ChartSeries = 'plain' | 'jitter' | 'plain429' | 'jitter429';
/** 20 one-second buckets per series; the values are in §7.5. */
export const RETRY_CHART: { limit: 6; retryAfter: 5; series: Record<ChartSeries, number[]> };
/** p = 1…8; the rule is in §7.7. */
export const PREFETCH_DEMO: { limit: 6; rows: { p: number; calls: number; throughput: number; over: boolean }[] };
```

**Nodes** (viewBox `0 0 680 320`):

| Node | x, y, w, h | Stage | Notes |
|---|---|---|---|
| providers | 560, 48, 108, 44 | 0 | |
| db | 560, 232, 108, 44 | 0 | three row bars inside (below) |
| cron | 12, 140, 84, 44 | 1 | |
| exchange | 124, 140, 92, 44 | 1 | |
| queue | 244, 140, 92, 44 | 1 | six waiting-message slots inside (below) |
| consumer | 400, 140, 92, 44 | 1 | |
| retry | 240, 256, 100, 40 | 3 | dashed |
| parking | 396, 256, 100, 40 | 5 | dashed; six slots inside and a bell icon |

**Edges:**

| Edge | Path | Stage | Notes |
|---|---|---|---|
| cronEx | `M96 162 H124` | 1 | |
| exQ | `M216 162 H244` | 1 | |
| qCon | `M336 162 H400` | 1 | |
| conProv | `M492 152 C526 152 526 70 560 70` | 1 | the breaker chip sits on it |
| conDb | `M492 172 C526 172 526 254 560 254` | 1 | the dedup chip sits on it |
| naiveProv | `M54 140 V70 H560` | 1 | `naive`: shown only when `data-naive="yes"` |
| naiveDb | `M54 184 V254 H560` | 1 | `naive`: shown only when `data-naive="yes"` |
| ack | `M446 140 C446 108 290 108 290 140` | 2 | dashed; consumer → queue |
| qRetry | `M290 184 V256` | 3 | |
| retryEx | `M240 276 H170 V184` | 3 | dashed |
| qPark | `M336 176 C366 176 366 276 396 276` | 5 | |

**Chips** (small rounded rects, `rx 9`, centred on their edge's midpoint):

| Chip | x, y, w, h | Stage | On edge |
|---|---|---|---|
| prefetch | 338, 153, 60, 18 | 7 | qCon |
| breaker | 494, 102, 64, 18 | 6 | conProv |
| dedup | 498, 204, 56, 18 | 4 | conDb |

**Small parts** (all inside the mirrored group, all belonging to their node's stage):

- Queue slots: six circles, `r 3`, `cy 172`, `cx` 265, 275, 285, 295, 305, 315.
- Parking slots: six circles, `r 3`, `cy 285`, `cx` 421, 431, 441, 451, 461, 471.
- Bell: a 12 × 12 bell path with its top-start corner at (480, 250), stage 5.
- DB row bars: three rects, 22 × 5, `y 262`, `x` 577, 603, 629.
- Message dot: one `circle.dg-dot`, `r 5`, hidden unless a run is in progress.

**Text** (all outside the mirrored group, with x passed through `mx`):

- Node main label: at `x + w/2`, `y + 17` when the node has a sub-label, `y + 16` for queue and db, `y + 14` for parking, otherwise the middle of the node. Sub-label: at `y + 32`.
- State notes (rose or amber, hidden below 1024px): "crashed" for cron and consumer and "down" for providers, each replacing that node's sub-label; "work lost ✕" at (180, 166), in the area that is empty in naive mode (at (54, 204) it would sit on the `naiveDb` edge); "stale" at (614, 292) under db.
- The `ack` label at (368, 102). Chip text is centred in each chip.

### 7.2 Labels (props from MDX)

```ts
export interface DiagramLabels {
  nodes: Record<NodeId, { main: string; sub?: string }>;
  ack: string;
  dedup: { on: string; off: string; hit: string };
  breaker: { closed: string; open: string; 'half-open': string; off: string };
  prefetch: string;           // the number is appended: "prefetch 3"
  crashed: string; down: string; lost: string; stale: string;
  caption: string;            // the "Simplified: …" line (§4)
}
```

| Key | English | Arabic |
|---|---|---|
| providers | Providers / chains + APIs | المصادر / شبكات + APIs |
| db | Database | قاعدة البيانات |
| cron | Cron / schedules | Cron / يجدول العمل |
| exchange | Exchange / RabbitMQ | Exchange / RabbitMQ |
| queue | Queue | Queue |
| consumer | Consumer / fetch + save | Consumer / جلب + حفظ |
| retry | Retry / TTL queues | Retry / TTL queues |
| parking | Parking lot | Parking lot |
| ack | ack after save | ack بعد الحفظ |
| dedup | dedup · no dedup · dedup ✓ | dedup · بلا dedup · dedup ✓ |
| breaker | closed · open · half-open · no breaker | closed · open · half-open · بلا breaker |
| prefetch | prefetch | prefetch |
| crashed / down | crashed / down | تعطّل / متوقف |
| lost / stale | work lost ✕ / stale | ضاع العمل ✕ / قديمة |

### 7.3 `IngestionDiagram.astro`

- Props: `stage: Stage | 'all'`, `uid: string`, `labels: DiagramLabels`, `dir: 'ltr' | 'rtl'`.
- Renders `<svg class="dg" viewBox="0 0 680 320" aria-hidden="true" focusable="false">` with `data-*` set from `BASE_STATE`. Every node, edge, chip, slot, bar, icon and label carries `data-from="<stage>"`, the stage it first appears in.
- `stage: n` (chapter figures): renders only pieces with `from ≤ n`, and adds `is-new` to pieces with `from === n`. `stage: 'all'` (the sticky diagram): renders every piece, with `data-stage="0"`, `is-off` on pieces with `from > 0` and `is-new` on stage-0 pieces; the script then toggles `is-off` (`from > current`) and `is-new` (`from === current`).
- **Ids are unique per instance:** edge paths get `id="dg-<uid>-<edgeId>"`. The page has 9 diagram instances (the sticky one with `uid="s"` and one per chapter with `uid` = the chapter id), so fixed ids as in `pipeline.ts` would collide.
- **RTL:** shapes, edges, chips, slots, bars, the bell and the dot sit in `<g transform="matrix(-1 0 0 1 680 0)">`. Text is outside that group, with x mirrored through `mx`. This is the same technique as `PipelineScrolly`.
- **State → drawing.** CSS only, keyed on the root's `data-*` attributes:

| State | Drawing |
|---|---|
| `naive="yes"` | every piece except cron, providers, db (with its row bars), their labels and the two naive edges is hidden; the `naiveProv` and `naiveDb` edges are shown. With `naive="no"` the naive edges are hidden |
| `queue="n"` | the first n queue slots are shown (selectors `[data-queue="1"] .dg-qslot:nth-of-type(-n+1)` … `-n+6`) |
| `parking="n"` | the same for parking slots |
| `rows="n"`, `dup` | the first n DB bars are shown; with `dup="yes"` the last shown bar is rose |
| `down="x"` | node x gets a rose stroke and its state note replaces its sub-label |
| `breaker` | chip colour: closed teal, open rose, half-open amber, off muted with a dashed stroke; the chip shows the matching text |
| `bell="yes"` | the bell turns amber |
| `lost="yes"` | the "work lost ✕" note is shown |
| `stale="yes"` | the "stale" note is shown and the db stroke turns amber |
| `dedup` | chip text and colour: on teal, off muted, hit teal fill |
| `prefetch="n"` | chip text "prefetch n" (the script sets the text node; the static value is 3) |

- **Appear animation** (`dg-in`, 450ms): nodes and chips fade and scale in from 0.92; edges draw in with `stroke-dashoffset`. It runs on `.is-new` when the sticky diagram changes stage, and on `.dg.is-seen .is-new` for chapter figures (the script adds `is-seen` the first time a figure is 40% visible). It does not run without JavaScript or with reduced motion.
- **Mobile (< 1024px):** main labels 15px; sub-labels, chip text, the ack label and state notes hidden. The same rule as Getridley: names that sat above a sub-label move to the middle of their box.
- Under the SVG: `<p class="dg__caption">` with `labels.caption`.

### 7.4 `ScenarioDemo.astro` and the scenario player

**Props:**

```ts
interface Props {
  chapter: string;                  // the chapter id
  title: string; note: string; idle: string;
  buttons: { label: string; run: ScenarioId; alt?: ScenarioId }[];
  toggle?: { label: string };       // when on, buttons run their `alt`
  runs: { id: ScenarioId; heading: string; steps: string[] }[]; // every run reachable from the buttons
}
```

At build time the component throws if a run's `steps.length` differs from `SCENARIOS[id].steps.length`, or if a button refers to a run that is missing from `runs`. That way a copy edit can't silently desync the log from the script.

**Markup:**

```html
<div class="scn" data-demo>
  <p class="scn__title">Try it: …</p>
  <p class="scn__note">Scripted demo. …</p>
  <div class="scn__btns" role="group" aria-labelledby="…title">
    <button type="button" data-run="crash-before-save" aria-pressed="false">…</button>
  </div>
  <div class="scn__alt"><button role="switch" aria-checked="false" aria-labelledby="…"></button><span>…</span></div>
  <p class="scn__idle">Pick a scenario to run it.</p>
  <div class="scn__runs">
    <div class="scn__run" role="group" data-scn="crash-before-save" data-initial="queue:2 rows:1" aria-labelledby="…">
      <h3 class="scn__run-title">Crash before save</h3>
      <ol class="scn__steps">
        <li data-move="qCon" data-pre="queue:1" data-set="" data-tone="teal">A consumer takes a message. …</li>
      </ol>
    </div>
  </div>
  <p class="cs-sr" aria-live="polite" data-live></p>
</div>
```

`.cs-sr` is a new visually-hidden utility in `case-study.css`. It uses only logical properties: `position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`.

**Visibility** (keyed on `@media (scripting: …)`, §4):

- `scripting: none`: the buttons, the switch, the idle line and the live region are hidden. Every `.scn__run` is shown with its heading and all steps.
- `scripting: enabled`, idle: the idle line is shown and every run is hidden.
- `scripting: enabled`, running or finished: only the current run is shown, its heading is visually hidden, and steps not reached yet have `visibility: hidden`. They keep their space, so revealing them causes no layout shift.

**Story script** (one `<script>` in `IngestionStory.astro`, bundled once):

1. Adds `is-live` to `.story`. Reads `data-base` (from `stateAttr(BASE_STATE)`) from `.story`.
   - **Every state change** (base, a run's initial state, `data-pre`, `data-set`, the slider value) is written to **both** the target diagram and the chapter element (`[data-chapter]`). The diagram draws from it, and the chapter-4 table reads `data-rows` and `data-dup` from the chapter element.
   - **A chapter's idle state** is base plus the `data-initial` of the run its buttons currently select. That is the button's `run` when the switch is off and its `alt` when it is on, so at idle the chapter-4 chip already shows "no dedup" while the switch is off. Chapters without a switch idle at base. The idle state is applied to each chapter figure on load, and to the sticky diagram by `setStage`.
2. **Stage following (desktop only):** the active-chapter rule from §4, measured on load, after `scroll` or `resize`, and when a stage lock is released. When the active chapter changes and no run is locked, it calls `setStage(n)`. `setStage(n)` sets `data-stage`, toggles `is-off` and `is-new`, applies chapter n's idle state to the sticky diagram (at stage 7 it adds `prefetch:<value>`, read from the chapter-7 slider's `input.value`), and resets every chapter demo that is not chapter n to idle.
3. **Figures (mobile):** an IntersectionObserver (threshold 0.4) adds `is-seen` to each chapter figure once.
4. **Target diagram:** the sticky diagram when `(min-width: 1024px)` matches, otherwise the chapter's own figure.
5. **Run(id):** cancels any current run. On desktop it calls `setStage(chapter stage)` and locks the stage. It applies base + the run's `data-initial`. It shows the run, sets `aria-pressed` on the pressed button only, and sets `data-run="<id>"` on the chapter element. Then for each step in order: reveal the `<li>`, write its text into `[data-live]`, apply `data-pre`, travel each hop, apply `data-set`, and wait `HOLD_MS`. At the end it removes `data-run`, sets `data-done="<id>"`, hides the dot and unlocks the stage (which re-measures the active chapter). The final state stays visible.
6. **Hop:** sets the dot's tone class and shows it. The dot owns one `<animateMotion begin="indefinite" dur="0.7s" fill="freeze" calcMode="linear">` with an `<mpath>`. The script points `mpath` at `#dg-<uid>-<edge>`, sets `keyPoints` to `0;1`, or `1;0` for a `-edge` hop, with `keyTimes="0;1"`, and calls `beginElement()`. Each hop takes `HOP_MS`. **Reduced motion:** on start the script removes the `animateMotion` element. Each hop instead places the dot at the hop's end point (`getPointAtLength`) and still waits `HOP_MS`.
7. **Cancelling** happens when another run starts, the switch changes, the breakpoint changes, or the chapter's `[data-demo]` leaves the viewport (an IntersectionObserver, threshold 0). Cancelling stops pending timers (a run token is checked after every await), hides the dot, applies the chapter's idle state, returns the demo to idle and unlocks the stage.
8. **Switch:** toggles `aria-checked`, cancels any run, and applies the chapter's new idle state. Turning the chapter-4 switch on shows `dedup:on`, and turning it off shows `dedup:off`.

Every chapter demo uses the same player. Chapter 3 and chapter 7 have no scenarios (§7.5, §7.7).

**Scenario scripts and log lines.** `move` hops are separated by spaces. `pre` and `set` use the `stateAttr` format. Tone is teal unless given.

`naive-crash` — stage 1, initial `naive:yes queue:0 rows:0`

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | naiveProv | | | Cron starts the run and calls the first provider. | يبدأ الـ cron التشغيل ويستدعي المصدر الأول. |
| 2 | naiveDb | | rows:1 | It writes that provider's data to the database. | يكتب بيانات هذا المصدر في قاعدة البيانات. |
| 3 | | down:cron | | The cron process crashes halfway through the run. | تتعطل عملية الـ cron في منتصف التشغيل. |
| 4 | | lost:yes | | Every provider it had not reached is skipped. Nothing recorded that work, so it waits for the next scheduled run. | كل مصدر لم تصل إليه يُتخطّى. لم يُسجَّل هذا العمل في أي مكان، فينتظر التشغيل المجدول التالي. |

`queued-crash` — stage 1, initial `queue:0 rows:0`

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | cronEx exQ | | queue:4 | Cron publishes the run's jobs to RabbitMQ. They wait in the queue. | ينشر الـ cron مهام التشغيل إلى RabbitMQ، فتنتظر في الـ queue. |
| 2 | | down:cron | | The cron process crashes. | تتعطل عملية الـ cron. |
| 3 | qCon conProv | queue:3 | | A consumer takes the next job and calls the provider. The crash never touched it. | يأخذ consumer المهمة التالية ويستدعي المصدر. لم يمسّها التعطل أصلًا. |
| 4 | conDb | | rows:1 | The result is saved. | تُحفظ النتيجة. |
| 5 | | | | Nothing was lost. The remaining jobs wait in the queue, outside the cron process, and the consumers keep going. | لم يضع شيء. المهام المتبقية تنتظر في الـ queue خارج عملية الـ cron، والـ consumers مستمرة في العمل. |

`crash-before-save` — stage 2, initial `queue:2 rows:1`

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | qCon | queue:1 | | A consumer takes a message. It has not acked it yet. | يأخذ consumer رسالة، ولم يرسل لها ack بعد. |
| 2 | conProv | | | It fetches the data from the provider. | يجلب البيانات من المصدر. |
| 3 | | down:consumer | | The worker crashes before saving. | يتعطل الـ worker قبل الحفظ. |
| 4 | -qCon | | queue:2 | The message was never acked, so RabbitMQ puts it back in the queue. With an ack on receipt, it would be gone, and nobody would know. | لم يصل ack لهذه الرسالة، فيعيدها RabbitMQ إلى الـ queue. ولو أُرسل الـ ack عند الاستلام لضاعت الرسالة دون أن يعلم أحد. |
| 5 | qCon conProv conDb | down:none queue:1 | rows:2 | A worker takes it again, fetches the data and saves it. | يأخذها worker من جديد، ويجلب البيانات ويحفظها. |
| 6 | ack | | | Only now does the worker ack it. Nothing was lost. | الآن فقط يرسل الـ worker الـ ack. لم يضع شيء. |

`crash-after-save` — stage 2, initial `queue:2 rows:1`

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | qCon | queue:1 | | A consumer takes a message. | يأخذ consumer رسالة. |
| 2 | conProv conDb | | rows:2 | It fetches the data and saves the row. | يجلب البيانات ويحفظ الصف. |
| 3 | | down:consumer | | The worker crashes after saving, before it can ack. | يتعطل الـ worker بعد الحفظ وقبل أن يرسل الـ ack. |
| 4 | -qCon | | queue:2 | The message was never acked, so RabbitMQ delivers it again. This redelivery is on purpose. | لم يصل ack لهذه الرسالة، فيسلّمها RabbitMQ مرة أخرى. وهذه الإعادة مقصودة. |
| 5 | qCon conProv conDb | down:none queue:1 | rows:3 dup:yes | A worker processes it again and saves the same row a second time. | يعالجها worker من جديد ويحفظ الصف نفسه مرة ثانية. |
| 6 | ack | | | Now it is acked, and the database holds a duplicate. Remember that second row. | الآن وصل الـ ack، وفي قاعدة البيانات صف مكرر. تذكّر هذا الصف الثاني. |

`redeliver` — stage 4, initial `queue:2 rows:1 dedup:off`

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | qCon conProv conDb | queue:1 | rows:2 | Message evt_7c21 arrives. The consumer fetches the data and saves the row. | تصل الرسالة evt_7c21. يجلب الـ consumer البيانات ويحفظ الصف. |
| 2 | | down:consumer | | The worker crashes before it can ack. | يتعطل الـ worker قبل أن يرسل الـ ack. |
| 3 | -qCon | | queue:2 | RabbitMQ delivers evt_7c21 again. | يسلّم RabbitMQ الرسالة evt_7c21 مرة أخرى. |
| 4 | qCon conProv conDb | down:none queue:1 | rows:3 dup:yes | Without dedup, the consumer saves it again. One event, two rows. | بدون dedup، يحفظها الـ consumer مرة أخرى: حدث واحد وصفّان. |
| 5 | ack | | | It acks. The pipeline did exactly what it was told, and the data is wrong. | يرسل الـ ack. نفّذ المسار ما طُلب منه بالضبط، والبيانات خاطئة. |

`redeliver-dedup` — stage 4, initial `queue:2 rows:1 dedup:on`. Steps 1–3 are the same as `redeliver`, with the same text.

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 4 | qCon conDb | down:none queue:1 dedup:hit | | With dedup by event ID, evt_7c21 is already stored, so the second delivery changes nothing. Still one row for that event. | مع الـ dedup بالـ event ID، الرسالة evt_7c21 محفوظة بالفعل، فلا يغيّر التسليم الثاني شيئًا. ما زال لهذا الحدث صف واحد. |
| 5 | ack | dedup:on | | It acks, and the redelivery is harmless. | يرسل الـ ack، والتسليم المكرر لا يضر. |

`poison` — stage 5, initial `queue:2 rows:1 parking:0`. Steps 2–6 are amber, and step 7 is rose.

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | qCon | queue:1 | | A message arrives that can never succeed: say, a payload the parser can't read. | تصل رسالة لن تنجح أبدًا، مثل payload لا يستطيع الـ parser قراءته. |
| 2 | -qCon qRetry | | | Attempt 1 fails. The consumer rejects it without requeue, and the dead-letter exchange routes it to a retry queue. | تفشل المحاولة 1. يرفضها الـ consumer دون requeue، فيوجّهها الـ dead-letter exchange إلى retry queue. |
| 3 | retryEx exQ | | queue:2 | Its TTL runs out, and it comes back to the queue. | ينتهي الـ TTL، فتعود إلى الـ queue. |
| 4 | qCon -qCon qRetry | queue:1 | | Attempt 2 fails. Each trip through the dead-letter exchange adds to its x-death count. | تفشل المحاولة 2. كل مرور عبر الـ dead-letter exchange يرفع عدّاد x-death. |
| 5 | retryEx exQ | | queue:2 | It comes back again. | تعود مرة أخرى. |
| 6 | qCon | queue:1 | | Attempt 3 fails. The count has reached the cap: 3 attempts in this demo. | تفشل المحاولة 3. وصل العدّاد إلى الحد الأقصى: 3 محاولات في هذا العرض. |
| 7 | -qCon qPark | | parking:1 bell:yes | It is moved to the parking lot, and the alert fires. The rest of the queue keeps moving. | تنتقل إلى الـ parking lot، ويصدر التنبيه. وبقية الـ queue يواصل الحركة. |

In step 7 the queue count does not go up: the message passes the queue on its way to the parking lot only because the `qPark` edge starts there. The edge is schematic, and the vault does not record which component moved the message (§2).

`provider-down` — stage 6, initial `queue:1 rows:1 breaker:closed`. Step 2 is rose.

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | | down:providers | | The provider goes down. | يتوقف المصدر عن العمل. |
| 2 | conProv -conProv | | | Calls to it fail. | تفشل الاستدعاءات إليه. |
| 3 | | breaker:open | | After repeated failures, the breaker opens. Consumption from this provider pauses. | بعد تكرار الفشل يصبح الـ breaker في حالة open، ويتوقف الاستهلاك من هذا المصدر مؤقتًا. |
| 4 | cronEx exQ | | queue:3 | Cron keeps publishing. New work waits in the queue: nothing is consumed, and nothing goes to the DLQ. | يواصل الـ cron النشر، وينتظر العمل الجديد في الـ queue: لا شيء يُستهلك، ولا شيء يذهب إلى الـ DLQ. |
| 5 | | stale:yes | | While the circuit is open, this provider's data goes stale. | ما دامت الدائرة open، تصبح بيانات هذا المصدر قديمة. |
| 6 | | down:none breaker:half-open | | The provider recovers. A typical breaker waits out a cool-down, then goes half-open. | يعود المصدر للعمل. والـ breaker المعتاد ينتظر فترة تهدئة، ثم يصبح في حالة half-open. |
| 7 | qCon conProv conDb | queue:2 | rows:2 | One trial call goes through, and it succeeds. | يمر استدعاء تجريبي واحد، وينجح. |
| 8 | qCon conProv conDb | breaker:closed stale:no queue:0 | rows:3 | The breaker closes, and the consumers drain the queue. Nothing was lost; it was only late. | يعود الـ breaker إلى closed، وتُفرغ الـ consumers الـ queue. لم يضع شيء، بل تأخر فقط. |

`provider-down-dlq` — stage 6, initial `queue:2 rows:1 breaker:off parking:0`. Steps 2–5 are rose. The counts are compressed: one dot stands for the messages the log line describes.

| # | move | pre | set | English | Arabic |
|---|---|---|---|---|---|
| 1 | | down:providers | | The provider goes down. This time there is no breaker. | يتوقف المصدر عن العمل، وهذه المرة لا يوجد breaker. |
| 2 | qCon conProv -conProv | queue:0 | | Every call fails, and every retry fails too, adding load to a provider that is trying to recover. | يفشل كل استدعاء، وتفشل كل retry أيضًا، فتزيد الحمل على مصدر يحاول التعافي. |
| 3 | -qCon qPark | | parking:2 bell:yes | Messages run out of attempts and land in the parking lot. The alert fires. | تستنفد الرسائل محاولاتها وتنتهي في الـ parking lot، ويصدر التنبيه. |
| 4 | cronEx exQ qPark | | parking:4 | New work keeps arriving, fails the same way, and ends up there too. | يواصل العمل الجديد الوصول، ويفشل بالطريقة نفسها، وينتهي هناك أيضًا. |
| 5 | cronEx exQ qPark | | parking:6 | The parking lot is now full of healthy messages. Their only problem was timing. | امتلأ الـ parking lot برسائل سليمة، مشكلتها الوحيدة هي التوقيت. |
| 6 | | down:none | | The provider is back, but nothing flows by itself: every parked message has to be replayed by hand. | عاد المصدر، لكن لا شيء يتحرك من تلقاء نفسه: يجب إعادة تشغيل كل رسالة في الـ parking lot يدويًا. |

These logs are demo narration in the present tense. Where a step describes Mynt's real mechanism (manual acks, reject without requeue, DLX and TTL retry queues, x-death cap, parking lot with an alert, pausing consumption with the breaker open, messages waiting in the queue), it follows the facts cited in §5 for that chapter. Cool-down, half-open and trial calls are general (step 6 says "a typical breaker"); "3 attempts in this demo" is illustrative; the DLQ variant is counterfactual (the switch asks "What if…?").

### 7.5 `RetryChart.astro` (chapter 3)

- Props: `title` ("Try it: retry storms" / "جرّب: عاصفة الـ retries"); `note`; `jitterLabel`; `r429Label`; `axis: { x, y }`; `limitLabel`; `retryAfterLabel`; `firstLabel`; `captions: Record<'plain' | 'jitter' | 'plain429' | 'jitter429', { heading: string; text: string }>`.
- Markup: a `.rchart` panel with the title, the note, two `<button role="switch">` switches, an `<svg viewBox="0 0 480 220" aria-hidden="true">` and an `aria-live="polite"` caption area. The root carries `data-jitter="off|on"` and `data-r429="off|on"`. The script only flips these two attributes and `aria-checked`, which is a few hundred bytes.
- Plot: x from 40 to 470, 20 one-second buckets (t0–t19), bar width 14. y from 180 (0) to 20 (8), so 20px per request. Axis ticks at t = 0, 5, 10, 15. A dashed rate-limit line at 6, labelled `limitLabel`. The t0 bar is muted and labelled `firstLabel`. In the 429 series, t1–t4 are shaded with an amber band labelled `retryAfterLabel`.
- **Data** (`RETRY_CHART`, requests per one-second bucket; the demo rule is "8 workers fail together at t0 and retry 3 times; delays 1 s, 2 s, 4 s; jitter adds a random extra between 0 and the delay; a 429 replaces the first delay with Retry-After = 5 s, and jitter then adds 0–2 s to that first wait"; the jitter values are fixed in the data, so the chart is deterministic):

  | Series | Non-zero buckets |
  |---|---|
  | plain | t0 8, t1 8, t3 8, t7 8 |
  | jitter | t0 8, t1 4, t2 4, t3 2, t4 2, t5 2, t6 2, t7–t14 1 each |
  | plain429 | t0 8, t5 8, t7 8, t11 8 |
  | jitter429 | t0 8, t5 3, t6 3, t7 2, t8 2, t9 2, t10 2, t11 2, t12–t19 1 each |

  Each series sums to 8 + 24. In the plain series every retry bar is above the limit; in the jitter series every retry bar is below it. Each bar carries `data-t` and `data-v` for tests.
- **RTL:** the chart is **not** mirrored. Its `<svg>` has `direction: ltr`, and time runs left to right on the Arabic page too, because the axis numbers and the left-to-right time axis read as one unit. Labels inside the chart are Arabic.
- Without JS: the switches are hidden, the chart shows `plain`, and all four captions are listed with their headings. Reduced motion: bars change without transitions.

Chart copy:

| Key | English | Arabic |
|---|---|---|
| note | Scripted demo: 8 workers fail at the same moment and retry 3 times, after 1 s, 2 s and 4 s. The provider's rate limit is 6 requests per second. Illustrative numbers, not Mynt's settings. | عرض توضيحي مُعَدّ مسبقًا: 8 workers تفشل في اللحظة نفسها وتعيد المحاولة 3 مرات، بعد 1 ث و2 ث و4 ث. والـ rate limit للمصدر 6 طلبات في الثانية. الأرقام للتوضيح، وليست إعدادات Mynt. |
| jitterLabel | Jitter | Jitter |
| r429Label | Provider answers 429 with Retry-After: 5 s | المصدر يرد بـ 429 مع Retry-After: 5 ث |
| axis.y / axis.x | requests per second / seconds | الطلبات في الثانية / الثواني |
| limitLabel | rate limit | rate limit |
| retryAfterLabel | Retry-After | Retry-After |
| firstLabel | first attempts | المحاولات الأولى |
| plain | **No jitter.** The 8 workers that failed together retry together. The provider sees silence, then a spike above its limit, three times over. | **بدون jitter.** الـ workers الثمانية التي فشلت معًا تعيد المحاولة معًا. يرى المصدر صمتًا ثم ذروة فوق حده، ثلاث مرات متتالية. |
| jitter | **With jitter.** Each worker adds a random amount to each wait. The same 24 retries spread out and stay under the limit. | **مع jitter.** يضيف كل worker مقدارًا عشوائيًا إلى كل انتظار، فتنتشر المحاولات الـ 24 نفسها وتبقى تحت الحد. |
| plain429 | **429, no jitter.** The provider answered 429 with Retry-After: 5 s. Nobody retries before then, but without jitter they all come back in the same second. | **429 بدون jitter.** رد المصدر بـ 429 مع Retry-After: 5 ث. لا أحد يعيد المحاولة قبل ذلك، لكن بدون jitter يعود الجميع في الثانية نفسها. |
| jitter429 | **429 with jitter.** Retry-After honored and jitter added: nothing before 5 s, then the retries spread out under the limit. | **429 مع jitter.** احترام Retry-After مع إضافة jitter: لا شيء قبل 5 ث، ثم تنتشر الـ retries تحت الحد. |

### 7.6 `DedupTable.astro` (chapter 4)

- Props: `caption` ("Demo table: one row per stored event" / "جدول توضيحي: صف لكل حدث مخزّن"), `columns` (`event_id`, `type`, `nft` in both languages, shown as code).
- Rows (demo data, the same in both languages): `evt_3f9a · transfer · NFT #1182`, `evt_7c21 · sale · NFT #0457`, `evt_7c21 · sale · NFT #0457`.
- A real `<table>` with a `<caption>`, placed in the chapter's demo slot after `ScenarioDemo`. Row n is shown when the chapter element's `data-rows ≥ n`, through the same CSS pattern as the slots. With `data-dup="yes"`, row 3 gets a rose background and a visually hidden "(duplicate)" / "(مكرر)" suffix, so the duplicate is not shown by colour alone.
- Hidden without JS (§4). `dir="ltr"` on the code cells only.

### 7.7 `PrefetchDemo.astro` (chapter 7)

- Props: `title` ("Try it: tune prefetch" / "جرّب: اضبط الـ prefetch"); `note`; `label` ("Prefetch"); `explain`; `readouts: { throughput, calls, limit }`; `under`; `over`.
- Markup: `<input type="range" min="1" max="8" step="1" value="3">` with a `<label>`, the current value, and two readout rows. Each row has a label, a bar whose length is set by `--v` (`inline-size: calc(var(--v) / 8 * 100%)`) and an `<output>` with the number. The calls row has a dashed marker at 6, labelled `readouts.limit`. Under the rows is a status line `<p aria-live="polite">`.
- **Data** (`PREFETCH_DEMO`): for p = 1…8, `calls = p`, `throughput = min(p, 6)`, `over = p > 6`.
- The script, on `input`: updates `--v` and the outputs, sets `aria-valuetext` to "prefetch p", switches the status between `under` and `over`, and writes `prefetch:p` into the target diagram (the sticky one on desktop, the chapter figure on mobile). The sticky diagram's chip shows "prefetch p".
- Without JS: the slider and the readouts are hidden.

| Key | English | Arabic |
|---|---|---|
| note | Scripted demo with one consumer and a provider limit of 6 calls at once. Illustrative numbers, not Mynt's settings. | عرض توضيحي فيه consumer واحد، وحد المصدر 6 استدعاءات في الوقت نفسه. الأرقام للتوضيح، وليست إعدادات Mynt. |
| explain | In this demo the consumer works on every message it holds at once, so prefetch is also the number of calls in flight. | في هذا العرض يعالج الـ consumer كل رسالة يحملها في الوقت نفسه، فيكون الـ prefetch هو أيضًا عدد الاستدعاءات الجارية. |
| throughput | Messages per second | الرسائل في الثانية |
| calls | Calls to the provider at once | الاستدعاءات إلى المصدر في الوقت نفسه |
| limit | limit | الحد |
| under | Under the provider's limit. Raise prefetch and throughput rises with it. | تحت حد المصدر. ارفع الـ prefetch فيرتفع معدل المعالجة معه. |
| over | Over the limit: the provider answers 429, and throughput stops rising. | فوق الحد: يرد المصدر بـ 429، ويتوقف معدل المعالجة عن الارتفاع. |

### 7.8 `StoryChapter.astro` and `IngestionStory.astro`

- `IngestionStory` props: `labels: DiagramLabels`, `dir`. It renders:

  ```html
  <div class="story" data-story data-base="…">
    <div class="story__chapters"><slot /></div>
    <div class="story__stage"><IngestionDiagram stage="all" uid="s" …/></div>
  </div>
  ```

  It also holds the one story script (§7.4).
- `StoryChapter` props: `id`, `title`, `stage: Stage`, `labels`, `dir`. It renders `<Section id title>` with `data-chapter={id}`, `data-stage={stage}` and the base state attributes. Inside: the default slot (prose), then `<figure class="chapter__figure"><IngestionDiagram stage={stage} uid={id} …/></figure>`, then `<slot name="demo" />`.
- The MDX (each language):

  ```mdx
  <IngestionStory labels={diagramLabels} dir="ltr">
    <StoryChapter id="setup" title="The setup" stage={0} labels={diagramLabels} dir="ltr">
      …prose…
    </StoryChapter>
    <StoryChapter id="cron" title="The naive cron" stage={1} labels={diagramLabels} dir="ltr">
      …prose…
      <ScenarioDemo slot="demo" chapter="cron" {...demos.cron} />
    </StoryChapter>
    …
  </IngestionStory>
  <Section id="takeaways" title="Takeaways">…</Section>
  ```

  `diagramLabels`, `demos` and the chart and prefetch props are `export const` objects at the top of the MDX file, as Getridley does with `steps` and `explainer`. Source comments sit next to each prose block, as in `getridley.mdx`.
- Chapter `id`, title, stage and Arabic title:

  | id | English title | Arabic title | Stage |
  |---|---|---|---|
  | setup | The setup | السياق | 0 |
  | cron | The naive cron | الـ cron الساذج | 1 |
  | ack | Ack at the right time | الـ ack في الوقت الصحيح | 2 |
  | retries | Retries | الـ retries | 3 |
  | duplicates | What actually went wrong | ما الذي حدث خطأً فعلًا | 4 |
  | poison | Poison messages | رسائل poison | 5 |
  | breaker | The provider that is down | المصدر المتوقف | 6 |
  | backpressure | Backpressure | الـ backpressure | 7 |
  | takeaways | Takeaways | الخلاصة | — |

### 7.9 CSS (`case-study.css`, new "Ingestion story" section)

- Logical properties only (the `rtl-ready` test enforces this). New prefixes: `story`, `chapter`, `dg`, `scn`, `rchart`, `pf`, `takeaways`, `cs-sr`.
- Reuses tokens: `--teal`, `--line`, `--muted`, `--ink`, `--bg`, `--title-bg`, plus amber `#fbbf24` and rose `#fb7185` exactly as the claim-check explainer uses them. Demo buttons and switches reuse the look of the claim-check explainer: the new selectors (`.scn__btns button`, `.scn__alt [role="switch"]`, `.rchart [role="switch"]`) are added to the existing `.ex__btns button` and `.ex__switch` rule lists, so the Getridley page renders exactly as before.
- Arabic: no letter-spacing on uppercase-styled titles, `font-family: inherit` for mono sub-labels, and `direction: ltr; unicode-bidi: isolate` for `code` and the `evt_…` IDs, as Getridley does.
- `@media (prefers-reduced-motion: reduce)`: no `dg-in` animation, no transitions on `.dg *`, `.pf` bars or `.rchart` bars.

## 8. Arabic, fonts, SEO and Home

- **Arabic and fonts:** unchanged from Getridley. The Arabic route already imports and preloads Readex Pro, and the English route never loads it. Latin words inside Arabic text are drawn with Inter.
- **SEO:** unchanged mechanisms. Each page gets a canonical URL pointing to itself, hreflang alternates for `en`, `ar` and `x-default` (→ English), JSON-LD `TechArticle` without email or phone (from `CaseStudyLayout`), the existing `/og.png`, and a sitemap entry (the existing integration picks both pages up).
- **Home:** in `src/content/projects.ts` the Mynt.la row gets `href: '/case-studies/mynt/'`, with a source comment pointing to this spec. `Row` then renders the link, the ↗ arrow, the teal hover, keyboard focus, and the visible "Read the case study →" line. Nothing else on Home changes: the summary, label and tags stay as they are.
- **Lighthouse:** add `http://localhost/case-studies/mynt/index.html` and `http://localhost/ar/case-studies/mynt/index.html` to `ci.collect.url` in `lighthouserc.json`. The ≥ 0.95 thresholds stay unchanged.

## 9. Testing

All tests are Playwright tests against the built site, like the existing ones. No threshold changes: 8KB of JavaScript per case-study page, CLS < 0.02, axe with zero serious or critical violations, Lighthouse ≥ 0.95.

### Existing tests that must change

- `tests/home-content.spec.ts`
  - "projects appear in the spec order": titles become `'Syft App', 'Mynt.la↗', 'Getridley↗', …`.
  - "only the Getridley row links to its case study" becomes **"the Mynt.la and Getridley rows link to their case studies"**: `.row a` count 2, hrefs `['/case-studies/mynt/', '/case-studies/getridley/']` in that order, `.row__arrow` count 2.
  - "the Getridley row shows a visible case-study call to action" becomes **"linked rows show a visible case-study call to action"**: `.row__cta` count 2, both visible, both with the text "Read the case study →" and the teal colour, both inside `.row--link`.
- `tests/desktop.spec.ts`
  - "only the Getridley row is in the tab order" becomes **"only the linked rows are in the tab order"**: `.row a` count 2, `.row [tabindex]` count 0.
  - "the linked Getridley row turns teal on hover" loops over both `.row--link` rows (the current single locator would hit two elements and fail in strict mode).
- `tests/case-study.spec.ts`: the `PAGES` table gets the two Mynt entries (lang, dir, path, title, H1, description, kicker, section titles in §7.8 order, switcher, back link, footer). The tags move into each entry, because the two case studies have different tags. The Readex Pro and Arabic skip-link tests run for both slugs.
- `tests/quality.spec.ts`
  - `CASE_STUDIES` adds `/case-studies/mynt/` and `/ar/case-studies/mynt/`. That puts both pages under axe (desktop and 375px), the internal-link check, the 8KB JavaScript budget and the CLS check.
  - The 375px overflow test keeps its generic page check for all four pages. Its `[data-ex]` panel checks run only for the Getridley paths. For the Mynt paths it checks instead that every `[data-demo]`, `.rchart svg` and `.chapter__figure svg` fits inside its chapter's column, and that `.scn__btns` does not overflow its panel.
- `tests/case-study-scrolly.spec.ts` and `tests/case-study-explainer.spec.ts` stay Getridley-only and unchanged.

### New `tests/case-study-story.spec.ts` (Mynt page)

Scroll tests do not install the fake clock. Scenario tests call `page.clock.install()` before `goto`, then `page.clock.runFor(60_000)` after clicking. Run state is read from `data-run` and `data-done` on the chapter element, and from the `data-*` state on the target diagram.

1. **Stage follows scroll (desktop 1280 × 800).** Centring chapter `retries` sets the sticky `.dg` to `data-stage="3"`: the retry node is visible and `is-new`, and the parking node is hidden. Centring `breaker` gives stage 6, with the breaker chip visible and `is-new`. Exactly one stage is shown at a time. Reloading in the middle of the page restores the matching stage.
2. **Sticky geometry.** At 1024px wide, `.story__stage` is `position: sticky` and its top is `calc(50vh - 130px)` (270px at 800px tall). At 1023px it is hidden, and every `.chapter__figure` is visible.
3. **Mobile figures (375 × 812).** Each chapter figure renders exactly its stage's pieces. For example, the `retries` figure has a retry node and no parking node, the `poison` figure has both, and the `setup` figure has only providers and db.
4. **`crash-after-save`** (desktop and 375px): click it, run the clock, and expect `data-done="crash-after-save"`. The target diagram has `data-rows="3"` and `data-dup="yes"`. All 6 log lines are visible. `[data-live]` holds the last line. Only that button has `aria-pressed="true"`.
5. **`naive-crash`** ends with `data-naive="yes"` and `data-lost="yes"`, and the queue node is hidden. **`queued-crash`** ends with `data-down="cron"` and `data-rows="1"`, and the queue node is visible.
6. **Dedup switch.** Switch off: `redeliver` ends with `data-dup="yes"` and 3 visible table rows, row 3 marked "(duplicate)". Switch on: `redeliver-dedup` ends with `data-dup="no"`, `data-dedup="on"` and 2 visible rows. Turning the switch on immediately sets `data-dedup="on"`, and turning it off sets `"off"`.
7. **`poison`** ends with `data-parking="1"` and `data-bell="yes"`.
8. **Breaker.** `provider-down` ends with `data-breaker="closed"`, `data-queue="0"` and `data-stale="no"`, and `data-parking` is "0" at every step. While it runs, the clock is advanced step by step and the breaker goes `closed → open → half-open → closed`. With the switch on, `provider-down-dlq` ends with `data-parking="6"`, `data-bell="yes"` and `data-breaker="off"`.
9. **Cancel.** Start `crash-before-save`, advance 1s, then click `crash-after-save`: only the new run's list is shown, and its first line is the only one revealed. Start a run, then scroll its chapter out of view: `data-run` is removed and the demo shows the idle line.
10. **Stage lock (desktop).** Start a chapter-2 run and scroll until chapter 3's top passes the middle while the chapter-2 demo is still in view: `data-stage` stays "2" until `data-done`, then follows the scroll.
11. **Script and copy stay in step.** For every scenario, the number of `<li>` in `ol` inside `[data-scn="<id>"]` equals `SCENARIOS[id].steps.length` (imported from `src/components/case-study/ingestion.ts`), on both pages.
12. **Chart.** By default the `plain` series is visible. Jitter on shows `jitter`; 429 on shows `plain429`; both show `jitter429`. Each change updates the caption and `aria-checked`. Data check: in `plain`, the bars at t1, t3 and t7 have `data-v` > 6; in `jitter`, every bar with t > 0 has `data-v` ≤ 6; in both 429 series, t1–t4 are 0.
13. **Prefetch.** Setting the slider to 8 makes the chip read "prefetch 8", the calls output 8, the throughput output 6, and the status the `over` text. Setting it to 3 shows the `under` text. ArrowRight and ArrowLeft change the value.
14. **Keyboard.** Tab reaches every demo button, switch and the slider. Enter and Space run scenarios and flip switches. Focus is visible (the site focus ring).
15. **No JS** (`javaScriptEnabled: false`, which makes `@media (scripting: none)` match). The sticky stage is hidden. Every chapter figure is visible at its stage, with no grid at 1280px. `.scn__btns`, switches, the slider and the table are hidden. Every scenario list is visible with its heading, and all its lines are visible. The chart shows `plain`, with all four captions and headings.
16. **Reduced motion** (`reducedMotion: 'reduce'`). After a run starts, no `.dg-dot animateMotion` exists, and the dot's position after a hop equals that edge's end point (within 1px). The computed `animation-name` of `.is-new` is `none`.
17. **RTL** (the Arabic page, desktop and 375px). The cron box is to the right of the exchange box. Node labels are not mirrored (`getCTM().a > 0`) and read in Arabic where §7.2 says so (for example "قاعدة البيانات"). The chart is not mirrored: the t0 bar is to the left of the t19 bar.
18. **Labels fit.** At 1280px and 375px, on both pages, every node's main-label box lies inside its node's box.
19. **Demo labels.** Every `[data-demo]`, `.rchart` and `.pf` shows its note, and each note matches `/illustrative/i` (EN) or contains "للتوضيح" (AR).
20. **Truth guards on built text.** The EN page contains "5+ blockchains" and does not match `/\b(six|6)\s+(block)?chains\b/i`. The AR page contains "خمس شبكات blockchain أو أكثر" and does not contain "ست شبكات". Neither page contains "TBD" or "TODO".

### Unchanged scanners that already cover the new work

- `contact-scan.spec.ts` and `content-rules.spec.ts` scan `dist/` and `src/`, which includes the new MDX files and `ingestion.ts`, for the phone number and the email address.
- `rtl-ready.spec.ts` scans the new CSS and `.astro` files for physical properties.

## 10. Out of scope

- A "next case study" link between Getridley and Mynt. Deferred to a follow-up change.
- A case-study index page (`/case-studies`), an Arabic Home page, and Arabic versions of other pages.
- Any change to the Getridley page. The only shared edit is adding new selectors to the existing button and switch rules (§7.9); Getridley must render identically, and its tests stay unchanged.
- A real simulation. Every demo is scripted and deterministic.
- Changes to Home beyond the Mynt.la `href`.
- New dependencies.
