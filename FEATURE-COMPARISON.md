# What your screenshots taught us — adopted, improved, or refused

Source: five screenshots supplied by the user on 2026-10-24, not web research.
Tool names and figures below are what those screenshots *show*, not
independently verified product claims. Where a screenshot blurs a number,
that number is not quoted here.

## 1. T-Checker (turnitindetector.ai) — "Free Plagiarism Checker"

Shown: a simple paste box, "Paste Text" button, live character count,
a big "Check Plagiarism" button, and bottom tabs for AI Detector,
AI Humanizer, Plagiarism Checker, Grammar Checker.

- **Adopted:** the simple flow — paste, count, one big check button.
  PlagTrace now has Paste-from-clipboard buttons, live word/character
  counts, and a single primary "Check similarity locally" button.
- **Improved:** T-Checker's box is one document only in the screenshot.
  PlagTrace keeps two documents plus a multi-file reference corpus, so a
  match can be traced to a specific source.
- **Refused:** the AI Detector tab and especially the AI Humanizer tab
  sitting next to it. That pairing — flag a text as AI, then sell a tool
  to hide the flag — is exactly the evasion loop this project will not
  build. See AI-DETECTION-NOTE.md.

## 2. T-Checker AI Detector — "very likely AI-generated, 86% AI"

Shown: a verdict sentence, a donut with 86% AI / 8% human-written /
6% mixed, a "Go to Humanizer" button, and "cross-checked with" Writer,
GPTZero, ZeroGPT, Crossplag, Copyleaks, Originality AI (all marked ✗).

- **Refused, entirely:** a verdict sentence + a single AI percentage is
  the most career-dangerous pattern in the set. The cross-check list
  does not make it safer — detectors disagree with each other on
  identical text (see AI-DETECTION-NOTE.md), so listing six names next
  to one percentage is false precision, not evidence.
- **What PlagTrace shows instead:** no AI figure at all, and every
  similarity figure is defined (matched characters ÷ Document A) with
  its settings and its source list printed beside it.

## 3. GPTZero (app.gptzero.me) — "7% was found online, 106 words matched"

Shown: a top-line percentage, total words matched, then numbered source
cards: a source snippet, "17 words matched" / "15 words matched", and a
"Copy Citation" button, plus a "Re-scan" button.

- **Adopted, and this is now PlagTrace's best UI pattern:** numbered
  source cards with words matched and a Copy Citation button, plus a
  Re-scan button. PlagTrace's cards show, per source: coverage %,
  words matched (counted from visible passages, never double-counted),
  passage count, longest match, and evidence band.
- **Improved:** GPTZero's top line in the screenshot is a web-wide
  claim ("found online"). PlagTrace's top line is labelled with its
  scope — supplied documents only — so the same visual pattern cannot
  be misread as a web search.
- **Copy Citation, honestly:** PlagTrace's button copies a note with
  the source filename, the matched passage, and its character offsets,
  and says in plain text that the user must add the full bibliographic
  citation themselves. It never invents an author, title, or URL for a
  local file — inventing one would be a fabricated citation, which is
  itself an academic-integrity failure.

## 4. Grammarly — "No plagiarism found", 19 writing issues

Shown: a results checklist (No plagiarism found ✓, Grammar ✓,
Spelling ✓, Punctuation 1, Conciseness ✓, Readability ✓, Word choice ✓,
Additional issues 18) and a warning: "The first 1,500 words were scanned."

- **Adopted:** the checklist idea — a readable summary, not just a
  number. PlagTrace's results now open with a summary block (coverage,
  words matched, passages, longest match, band) before any detail.
- **Improved / refused:** Grammarly's headline is an absolute claim
  ("No plagiarism found") qualified only by a small note that only the
  first 1,500 words were scanned. PlagTrace never prints an absolute
  negative. Its equivalent sentence is: "No passage met the
  minimum-evidence threshold in the supplied documents." That is the
  same information, without the career-risk overclaim.
- **Not copied:** grammar/spelling/style checking is out of scope.
  PlagTrace does similarity only; adding a half-built grammar checker
  would be a worse product, not a bigger one.

## 5. Scribbr (app.scribbr.com) — "Plagiarism risk: High", "AI content 78%"

Shown: three cards — Plagiarism risk: High, AI content 78%, Writing
report: 11 issues — then a "Plagiarism score" donut (number blurred in
the screenshot) with "several similarities with content in our
databases", and a per-source list (mpra.ub.uni-muenchen.de,
coursehero.com, …).

- **Adopted:** the per-source list with a percentage per source.
  PlagTrace's per-source cards do the same, with the formula stated.
- **Refused:** "Plagiarism risk: High" is a verdict dressed as a risk
  label, and "AI content 78%" sits beside it as if the two numbers
  corroborate each other. They do not — they are different, unreliable
  measurements presented as one judgement. PlagTrace prints no risk
  label and no AI figure.
- **Honest gap:** Scribbr's per-source list comes from its databases.
  PlagTrace's comes only from files you supply. If the matching source
  is not supplied, PlagTrace will not list it. That gap is printed on
  the home page, not buried in a footnote.

## Scorecard: where PlagTrace is better, and where it is not

Better (verifiable in this repo, today):
- Privacy: zero upload vs server upload in all five screenshots' tools.
- Transparency: every figure has a formula, settings, and visible
  passages; no verdict, no risk label, no AI %.
- Safety workflow: per-match reviewer decisions, author-response step,
  excluded passages listed, removed sources named in the report.
- Upload options: paste, drag & drop, file picker, multi-file corpus,
  .txt/.md/.docx/.pdf/code — in one free, local page.
- Cost: free, no account, no per-check price (Scribbr's screenshot
  shows a $19.95 "Proof" price point).

Not better (stated, not hidden):
- Database: no web, academic, or publisher database. On web-wide
  recall, GPTZero/Scribbr/Turnitin-style tools win by construction.
- Paraphrase/translation: heavy rewording and translation are blind
  spots (see limitations.html).
- "100% accurate": no tool in this set is, and PlagTrace does not
  claim it. Its measured accuracy is only the 10-pair generated set
  in tests/metrics.mjs (precision/recall 1.0, FPR 0) — a tiny set, not
  a benchmark, and it is labelled as such in the README.

That is what "better" means here: better on the dimensions that
protect a student from a wrong, unappealable output, and honest about
the one dimension where it loses.
