# PlagTrace — Top plan to fix everything, v0.6 → v1.0

Status: PLAN ONLY, 2026-10-24. Nothing in this plan is committed or
published until Syed approves each phase. The live browser test
(browser-task:c055613c) was still running when this plan was written;
its findings go into Phase 0 triage before Phase 1 starts, and any
new browser finding that contradicts this plan overrides it.

## 0. Baseline (what is true right now, not what we wish)

- Live: v0.5.0, tag v0.5.0, commit 635f950, https://hydope.github.io/PlagTrace/
- Engine: k-gram shingling + Winnowing, Jaccard, containment, TF-IDF
  cosine, identifier-normalised code tokens. Verbatim + light edit
  strong, paraphrase 0/3, reordered short sentences partly missed.
- Measured (accuracy.html, Wilson 95%):
  - Main 25 pairs: precision 1.00 [0.68–1.00], recall 0.57 [0.33–0.79],
    FPR 0.00 [0.00–0.26]. By type: verbatim 3/3, light edit 4/6,
    reordered 1/2, paraphrase 0/3, negative 0/11.
  - Held-out 30 pairs (written after the flagging fix, not used to
    tune it): precision 0.83 [0.55–0.95], recall 0.67 [0.42–0.85],
    FPR 0.13 [0.04–0.38]. By type: verbatim 5/5, light edit 5/5,
    reordered 0/2, paraphrase 0/3, negative 2/15.
  - Combined 55 pairs: precision 0.90, recall 0.62, FPR 0.08.
  - Base rate at 2% prevalence (held-out numbers): ~91% of flags
    would be innocent. That is why there is no verdict, ever.
- No PAN benchmark run. No web database. No AI %, no humanizer,
  no verdict — by design, and that does not change in any phase.

## 1. Non-negotiable principles (a phase that breaks one is rejected)

1. Evidence only. Every number traces to a visible passage, source,
   offsets, and settings. No verdict, no "risk: High", no AI %.
2. Privacy by default. Local check sends nothing. Internet check
   sends only short search phrases, only on an explicit click, and
   shows exactly what was sent.
3. No fake proof. No invented stats, no PAN claim unless PAN is
   actually run, no "best in the world" claim without a named,
   reproducible comparison.
4. A human decides. Reviewer decisions are never overwritten
   silently, and an unflagged passage is shown as context, not hidden.
5. Fix forward, never hide a failure. A rate limit, a missed
   paraphrase, a false flag — all are printed, not smoothed over.

## 2. Phase 0 — Triage and freeze (do first, hours, v0.5.1)

Goal: stop shipping known false statements and broken flows.

| # | Task | Files | Acceptance test |
|---|---|---|---|
| 0.1 | Limitations page: replace "no web search" with the true v0.4+ scope (opt-in Wikipedia/Semantic Scholar, not whole web, not Turnitin). Rebuild it with the same header/nav/footer/version as every other doc page. | limitations.html | Grep: no "no web search" claim remains; page loads with full nav, footer, version. |
| 0.2 | Browser test completed 2026-10-24 (live site v0.5.0): sample check works (80.2%, 57 words, 2 passages, highlighted correctly); unrelated texts correctly inconclusive 0.0%; Wikipedia fetch works (3 sources, exact phrase shown); no verdict word, no AI %, no humanizer link, no "no plagiarism found" found. | — | See 0.4–0.9 for the breaks it found. |
| 0.4 | STALE RESULTS (browser P0): editing Document A/B or removing a source leaves the old result on screen until the next run. Fix: clear/mark results as outdated on any input, corpus, or settings change ("Results are for the previous documents — re-run to update"), and never let a screenshot quote the wrong run. | src/app.js | Edit A after a run → results show outdated banner; run again → banner clears. |
| 0.5 | REMOVED SOURCES NOT NAMED ON SCREEN (browser P0): removing all Wikipedia sources then re-running showed "Removed sources: none." Fix: track removed source names in a session list (not just unticked corpus entries) and show them in results, not only in JSON export. Clarify the claim: unticked vs fully removed are different, and both must be named. | src/app.js, src/sim.js | Remove a source, re-run → results list that source by name as removed. |
| 0.6 | SEARCH-THEN-CHECK CONTRADICTION: internet search already displays full results, then tells the user to "run the local check below". Fix: change the message to "Results below already include internet sources — re-run only if you change settings or documents." No extra step. | src/app.js | After internet search, no instruction to run an unnecessary second check. |
| 0.7 | SEMANTIC SCHOLAR FAILURE VAGUE: browser run showed "Failed to fetch", not the HTTP 429 documented from testing. Fix: distinguish fetch failure (network/CORS) from HTTP 429 (rate limit) from HTTP 5xx in the message, and keep "not a no match" in all cases. | src/internet.js | Each failure type shows its own wording in UI and in the report. |
| 0.8 | JARGON + UNDEFINED BANDS: results show Jaccard, Winnowing, TF-IDF, "band high/low" with no plain-language gloss on the panel. Fix: one-line gloss under each metric + band definition ("high = long/large overlap, not guilt"), linked to the glossary (Phase 4). | src/app.js, styles.css | A non-technical reader can explain every number on the results panel in their own words. |
| 0.9 | UNTESTED BUTTONS: browser did NOT test Download JSON, Print/PDF, Copy citation, Paste from clipboard. Add all four to the Phase 0 manual test list before v0.6 ships. | manual test | Each button exercised in a real browser, result recorded. |
| 0.3 | Freeze scope: no new feature starts until 0.1 + browser P0s are green. No version bump for words alone. | — | CI green, Pages green, live page matches repo HEAD. |

Exit gate: limitations.html is true, browser P0s are fixed or
explicitly deferred by Syed in writing, CI + Pages green.

## 3. Phase 1 — Safety-critical UX fixes (v0.6, days)

These are the interim critic's ranked flaws 2–5, 7, 8, 10.

### 1.1 Step order — internet before check
- Problem: order is Add → Check → Internet, but the no-Document-B
  user needs Internet before Check.
- Fix: reorder sections to 1. Your text → 2. Sources (Document B
  optional OR Internet search OR reference files) → 3. Check →
  4. Advanced (collapsed). The Check button stays in one place;
  Internet search moves above it and, after fetching, scrolls to
  results (see 1.4).
- Files: index.html, src/app.js (section order only, no engine change).
- Test: a user with only Document A can reach Internet search
  without scrolling past Check; a user with Document B never sees
  Internet as a required step.

### 1.2 Preserve reviewer decisions across Re-scan
- Problem: Re-scan rebuilds results and wipes decisions.
- Fix: before re-running, capture decisions keyed by match
  (aStart, aEnd, source name); after re-running, re-apply decisions
  where the same match still exists; show "3 decisions kept,
  1 match no longer present" in the results header. Decisions are
  still stored only in the exported JSON, never used to change scores.
- Files: src/app.js.
- Test: record 2 decisions, change a setting, Re-scan, decisions
  survive for unchanged matches; export contains them.

### 1.3 Settings-changed indicator
- Problem: Advanced settings hide, and nothing shows they changed.
- Fix: a badge next to "Advanced settings" — "Defaults" vs
  "2 settings changed" — computed by comparing current values to
  defaults (k=5, window=4, minWords=8, all exclusions on, default
  stop list). Reset button clears the badge. The exported report
  already records settings; this only surfaces them.
- Files: index.html, src/app.js, styles.css.
- Test: change k to 7 → badge reads "1 setting changed"; Reset →
  badge reads "Defaults".

### 1.4 Scroll + loading state
- Fix: after Internet search completes and after Check completes,
  scroll results into view (already done for sample check; extend
  to both). Add a visible "Checking…" state that disables the
  Check button while a run is in progress, so a long document does
  not look frozen and double-clicks do not queue two runs.
- Longer term (Phase 4): move comparison to a Web Worker so the
  tab does not freeze on long documents. Phase 1 loading state is
  the honest interim, not a claim of background processing.
- Files: src/app.js, styles.css.
- Test: large demo (5,000 words, repeated + real text) shows
  "Checking…", button disabled, results appear, no duplicate run.

### 1.5 Print stylesheet
- Fix: `@media print` in styles.css: hide header, hero, inputs,
  settings, buttons; print only the banner, summary, source cards,
  matched passages, excluded list, and reviewer decisions, with
  the report's settings/version/date in the print header.
- Test: browser print preview shows report only, fits A4, no
  input boxes, no cut-off source cards.

### 1.6 Keyboard + focus accessibility (WCAG AA, first pass)
- Fix: dropzone cards — Enter/Space opens the file picker (the
  handler lost in the v0.3 rewrite). All interactive elements
  reachable by Tab in logical order; visible focus outline already
  exists — verify it on every button, select, and details element.
  Every input has a label (audit: 14 labels on index, check each
  maps to an input id).
- Test: keyboard-only run: Tab → paste → Check → results →
  reviewer decision → export, with no mouse. Screen-reader spot
  check: results region announced via aria-live, source cards
  have headings in order.

### 1.7 Export edge case
- Fix: with zero matches, exported JSON must say
  `reviewerDecisionsComplete: false` with a note "no matches to
  review", not `true` from an empty `every()`. Same for the UI:
  "No matches to review" instead of a completion tick.
- Files: src/app.js.
- Test: empty-vs-empty and unrelated-vs-unrelated exports both
  show the corrected field.

Exit gate (v0.6): all 1.1–1.7 tests pass in CI + a manual
keyboard-only pass + a print-preview pass, recorded in the
changelog. No engine change in this phase, so metrics must be
unchanged (main + held-out numbers identical) — if they move,
something broke.

## 4. Phase 2 — Evidence upgrade (v0.7, the phase that earns trust)

Goal: intervals narrow, tuning bias removed, and a public benchmark
attempted honestly.

### 2.1 Independent held-out set #2 — 50+ pairs, not written by the author
- Recruit: one independent writer (not the engine author, not Syed
  alone) writes 50 pairs from a written brief: 15 verbatim, 10 light
  edit, 5 reordered, 10 true paraphrase, 10 negative (unrelated,
  quoted, cited, template, common knowledge, short phrase).
  The writer does not see the flagging thresholds.
- Scoring: run once, publish once, in accuracy.html as "Held-out #2
  (independent, n=50+)". Do NOT adjust any threshold in response
  to #2 without labelling the set as tuned afterwards and writing
  a #3.
- Target (gate, not promise): report whatever it is. If FPR > 0.20
  or recall on verbatim < 0.80, Phase 3 detection work is mandatory
  before v1.0, not optional.

### 2.2 PAN attempt — attempt, report, do not fake
- Try to obtain a public PAN plagiarism corpus subset (e.g. PAN
  2011/2012/2013 text-alignment data, if licensing and download
  allow a small, documented subset). If it downloads and runs,
  publish PAN numbers with the exact subset, version, and settings.
  If it does not (licence, size, format, time), publish that
  attempt and its reason in accuracy.html, and keep the "No PAN"
  statement. Never convert a PAN paper's numbers into PlagTrace's.
- Effort cap: if PAN is not running within one focused work
  session, stop and document — do not let it block v1.0.

### 2.3 Accuracy page v2
- Lead with the worst number across all sets, not the best.
- One table per set (main, held-out #1, held-out #2, PAN if run),
  each with n, counts, Wilson intervals, per-category breakdown,
  version + git tag, and the exact command to reproduce.
- Base-rate illustration updated with held-out #2 numbers.
- A "What changed since last accuracy page" note, so a reader
  can see whether numbers moved because the engine changed or
  because the test changed.

Exit gate (v0.7): held-out #2 published with intervals, PAN
attempt documented (run or honestly failed), accuracy page shows
all sets side by side, no set silently replaced.

## 5. Phase 3 — Detection power (v0.8, the hardest phase, highest risk)

Goal: catch more true paraphrase and reordered copies WITHOUT
raising the false-positive rate and WITHOUT becoming a verdict tool.
This phase is allowed to fail and be rolled back — see 5.4.

### 3.1 Sentence-level bag-of-words paraphrase signal (new, separate)
- Idea: for each sentence in Document A, compute content-word
  overlap (lowercased, stopwords removed, stemming by simple
  suffix strip only — no external model, no network) against each
  sentence in a source. If overlap ≥ 0.70 and the sentence is
  ≥ 12 content words, show it as a NEW kind of match:
  "Possible paraphrase — shared content words, wording differs.
  Human review required. Lower confidence than a verbatim match."
- It must NEVER be merged into the verbatim coverage % or the
  flagged-for-review count on its own. It gets its own section,
  its own band ("possible-paraphrase"), and its own reviewer
  decisions. A verbatim match and a paraphrase signal for the same
  passage are shown as two rows, not one inflated number.
- Files: src/sim.js (new `sentenceParaphrase` function, pure,
  tested), src/app.js (new section), tests (unit + metrics
  category: paraphrase detection rate reported separately).
- Test: paraphrase pairs from main + held-out must move from
  0/3 and 0/3 to a reported rate (target: ≥ 2/3 on each set, but
  the gate is the rate is published, not that it hits the target);
  negative pairs must not gain paraphrase flags at a rate above
  the verbatim FPR — if they do, raise the overlap threshold to
  0.80 and re-run, once, and document the change.

### 3.2 Reordered-sentence fix
- Problem: short sentences (< 40 chars) are filtered by minChars
  before matching, so a reordered document of short sentences
  shows only 1 match.
- Fix: evaluate matches per sentence for the reordered case:
  if Document A has ≥ 3 sentences and ≥ 2 of them match a source
  (even short ones, ≥ 8 words), flag the pair as "reordered
  passages" with each sentence shown. This is a sentence-count
  rule, not a length rule, and it is documented as such.
- Test: reordered pairs in main (1/2) and held-out (0/2) must
  improve, without negative pairs gaining flags.

### 3.3 What is NOT built in this phase
- No neural embedding model, no paid API, no server, no
  "semantic similarity score" presented as a single number.
  If a future phase wants embeddings, it needs its own plan,
  its own privacy review (model download ≠ document upload, but
  it is a new dependency), and its own evidence set. Not here.
- No translation detection. Stated as out of scope in
  limitations.html, not as a coming feature.

### 3.4 Rollback rule
- If Phase 3 raises the held-out false-positive rate above the
  Phase 2 rate, or if paraphrase signals are confused with
  verbatim matches in user testing, Phase 3 ships DISABLED by
  default (toggle in Advanced, off, labelled experimental) and
  v1.0 ships with the v0.7 engine. A worse detector is not a
  feature.

Exit gate (v0.8): paraphrase detection rate published per set,
separate from verbatim metrics; held-out FPR not worse than
Phase 2; rollback decision recorded in the changelog either way.

## 6. Phase 4 — Polish, accessibility, performance (v0.9)

- Web Worker for comparison (no UI freeze on long documents),
  with a fallback to main-thread if Workers are unavailable,
  and a progress message ("Comparing…") in both paths.
- WCAG AA audit, second pass: colour contrast check for every
  text/background pair in styles.css (including band colours),
  focus order, heading order, alt text (no decorative images
  currently — verify), and a screen-reader pass on results.
- Mobile pass: test on a real small phone viewport (not just
  a resized desktop window): hero, inputs, source cards, results
  table, and print. Fix any horizontal scroll, any button that
  is too small to tap, any table that overflows.
- Favicon, Open Graph tags, sitemap for the Pages site, and a
  404 page — small, but a site without them looks unfinished
  to a critic, and they cost almost nothing.
- Plain-language glossary page: "shingle", "Winnowing",
  "Jaccard", "containment", "coverage" in one sentence each,
  linked from Advanced settings. This is the answer to "settings
  jargon" that does not hide the terms — it explains them.
- English-only UI: state it plainly on the security/contact
  page ("UI is English only; documents in any language can be
  compared, but the interface is not translated"). Do NOT claim
  a translation that does not exist. A real translation is a
  separate, Syed-approved phase, not a Phase 4 stretch goal.

Exit gate (v0.9): keyboard-only + screen-reader + mobile +
print passes recorded; Worker fallback tested; no horizontal
scroll at 360px width; glossary live.

## 7. Phase 5 — Trust, distribution, and v1.0 definition (v1.0)

- v1.0 is NOT a marketing label. It ships only when ALL of
  these are true:
  1. Phases 0–2 complete, Phase 3 shipped or explicitly
     disabled with a reason, Phase 4 passes recorded.
  2. Accuracy page shows main + held-out #1 + held-out #2
     (+ PAN if run), all with intervals, all reproducible
     from a git tag.
  3. No known P0/P1 bug open (limitations error, step order,
     decision loss, print, keyboard) — P2 polish may remain
     and must be listed as known issues.
  4. Changelog, security, contact, and limitations pages
     all current, all HTML, all linked, no stale claim.
  5. A second, independent critic (not the author, not the
     previous critics) scores the live v1.0 page and the
     report is published in the repo, including any score
     below 9 — not cherry-picked.
- Distribution (only after v1.0 gates pass, and only with
  Syed's explicit approval per item): repo topics on GitHub
  (plagiarism-checker, similarity, privacy, etc.), README
  "Live demo" link, and a launch note that states the
  limitations in the first paragraph. No paid ads, no fake
  stars, no "best in the world" headline without the
  accuracy page linked beside it.
- Human-only items for Syed (exact, time-costed):
  - Approve each phase's publish (1 tap each, as before).
  - Recruit or approve the independent held-out #2 writer
    (~30 minutes to brief, writer does the rest).
  - Approve the independent v1.0 critic (who, and whether
    their name is published).
  - Nothing else. No account creation, no payment, no
    social post is required for v1.0.

## 8. Timeline and effort (estimates, not promises)

- Phase 0: hours (same day).
- Phase 1: 2–4 focused work sessions. No engine change, so
  risk is low.
- Phase 2: 1–2 weeks elapsed (writer time dominates, not
  coding time). PAN attempt capped at one session.
- Phase 3: 1–2 weeks, with a hard rollback checkpoint at
  the halfway point (if paraphrase FPR rises, stop and
  ship disabled).
- Phase 4: 1 week.
- Phase 5: days for gates + critic time, which Syed controls.
- Total elapsed: roughly 4–6 weeks if phases run in order
  with no waiting on Syed; faster if held-out writing and
  Phase 1 run in parallel (they can — Phase 2 writing does
  not depend on Phase 1 code).

## 9. Risks, and what kills this plan

| Risk | Mitigation |
|---|---|
| Paraphrase signal raises false positives | Separate section, own band, rollback rule (3.4), never merged into coverage %. |
| Held-out #2 is worse than #1 | Publish it. Do not tune, do not replace #1, do not hide it. Worse numbers are still progress if they are honest. |
| PAN cannot be obtained | Document the attempt, keep "No PAN", ship v1.0 without it. PAN is a nice-to-have, not a gate. |
| Browser test (still running) finds a P0 not in this plan | Phase 0 absorbs it; Phase 1 dates move, Phase 1 scope does not shrink to hide it. |
| Scope creep (translation, embeddings, web database) | Each is a separate plan with its own privacy + evidence review. None is smuggled into v1.0. |
| "Top in the world" pressure | The plan's definition of top is: most honest, most auditable, safest for students — not biggest database, not highest claimed %. Any headline that contradicts that is rejected. |

## 10. How success is measured (after v1.0, not before)

- Accuracy page: all sets published, intervals present, no
  set hidden, no number without a command to reproduce it.
- Live site: no stale claim (grep limitations + all pages
  for "no web search", "no plagiarism found", "AI %", "best"),
  keyboard-only run passes, print preview is clean, mobile
  has no horizontal scroll.
- Independent critic score published in full, whatever it is.
- Zero fake engagement: no stars, posts, or reviews bought
  or manufactured at any point. If the score is 8.5 again,
  that is the score — the plan does not promise 10/10.
