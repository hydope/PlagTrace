# PlagTrace

Privacy-first similarity screening that runs entirely in your browser.
Paste or drop two or more documents, get **per-source** similarity evidence
with highlighted passages, character offsets, matched-character coverage %,
and the algorithm that flagged each match.
Nothing is uploaded to any server. There is no account, no backend, no paid API.

**Screening aid only.** Every result carries this banner:

> This is a screening aid. Only a human reviewer may decide misconduct, after giving the student a chance to respond.

PlagTrace reports similarity evidence only. It never issues a misconduct verdict,
and it contains no AI-text detection, by design.

## Why this name

PlagTrace = *plag* (plagiarism, stated plainly) + *trace* (follow a copied
passage back to its source). History: Simelune → SourceEcho → PlagTrace,
all 2026-10-24, all local-only renames before any publication.

## Name verification for PlagTrace (2026-10-24, checked live)

- **GitHub, hydope namespace:** `gh api repos/hydope/PlagTrace` returned
  **HTTP 404 Not Found** — free at check time. Login verified as `hydope`.
- **GitHub, global search:** `gh search repos PlagTrace` returned **0 results**.
  Variants: `plag-trace` returned only unrelated repos
  (traces-of-historical-plagues; student-assignment-plagiarism-tracer);
  `plagtrace` returned 0 results.
- **Web search:** exact "PlagTrace" found no software product. Nearest
  name is **PlagTracker**, an existing plagiarism checker — a real
  near-name confusion risk in the same field, disclosed here, not hidden.
  It is not the same name, but a user hearing "PlagTrace" could mishear it.
- **npm / PyPI web search:** no `plagtrace` package found; only generic
  plagiarism packages nearby.
- **Domain:** `plagtrace.com` search surfaced PlagTracker, not a PlagTrace
  site — domain ownership itself is **unverified**, as with all names in
  this project.
- **Not claimed:** trademark clearance, and Pages slug
  `hydope.github.io/PlagTrace` (which follows automatically if the repo is
  created under that name). A check is not a reservation — anyone could
  take the name between this check and creation, so re-check at creation.
Pronounceable, non-generic, and it contains none of the banned generic words.

## Step 1 — Name checks (2026-10-24, web search, exact-match queries)

Method: one web search per name with the name in quotes plus GitHub/npm/PyPI.
A web search is **not** a registry authority: a zero here means no exact match
surfaced, not a legal guarantee. The registry 404 check must be re-run at repo
creation time, before publishing. No GitHub repo was created in this build.

| Name | Exact-match web result | Verdict |
|---|---|---|
| Simelune | No exact match; nearest were `simlin` (Jupyter widget) and `siglume` | **First pick, later superseded by PlagTrace (see Name verification above)** |
| Vorlune | No exact relevant match; only unrelated supply-chain news pages | Clean on search, weaker rationale |
| Quillora | No exact match; nearest `quilla`, `pyquil` | Clean on search |
| Textlume | No exact match; nearest `textllm`, `lume` | Clean on search |
| Verquill | No exact match; nearest `pyquil` | Clean on search |
| Lextwin | No exact match; nearest `Levenshtein`, `lex2` | Clean on search |
| Mirrora | Multiple apps: AI clothes changer, TV mirroring app, mirrora.io, mirrora.app | Rejected — collision |
| Synora | GitHub `KnpLabs/synora`, `synora.live` streaming SDK, npm `@synora/*` | Rejected — collision |
| Echolex | Devpost hackathon project "Echolex — learn a new word every day" | Rejected — collision |
| Inkvera | Behance font duo "Inkvera" | Rejected — collision |

Intended Pages slug: `hydope.github.io/PlagTrace` (a project page under the
`PlagTrace` repo). That slug follows automatically when the repo is created
under that name — it is verified live after creation, not claimed in advance.

## How it works

1. **Tokenise** prose into words (with character offsets) or code into tokens.
   Code mode maps identifiers to `ID` and literals to `LIT`, keeping keywords,
   operators, and structure — so renaming variables does not hide a match.
2. **Shingle**: consecutive k-grams (default k=5) of the token sequence.
3. **Winnow** (Schleimer et al., 2003): in each window of w hashes, keep the
   rightmost minimum. This gives a compact fingerprint with a detection
   guarantee for matches longer than the threshold and a noise floor below k.
4. **Score**: Jaccard on shingle sets, containment both ways, winnowing
   fingerprint overlap, and TF-IDF cosine (smoothed IDF, so identical
   documents score 1, not 0).
5. **Evidence**: consecutive matching shingles are merged into passages with
   start/end offsets in both documents, length, and algorithm name.
6. **Determinism**: same inputs + same settings = byte-identical JSON
   (except the report timestamp). No randomness, no network, no clock in scoring.

## Anti-false-accusation safeguards

- No verdict word or verdict field anywhere in results or reports.
- Auto-exclusion (toggleable, shown in the report): quoted text, the
  citations/bibliography section, and adjustable stop-shingles for boilerplate
  and common phrases. Excluded spans are listed, not silently dropped.
- Plain-language explanation on every result: a match can be a shared
  template, standard terminology, a properly cited quote, or a short match
  too common to be distinctive.
- Confidence band (`inconclusive` / `low` / `medium` / `high`) and a
  minimum-evidence threshold (default: 8 words and 40 characters). Below it,
  the label is `inconclusive`, never a flag.
- No AI-text detection. A similarity score must never be read as one.
- Full limitations page: `limitations.html`.

## Step 2 — Prior work (reimplemented, not copied)

No code was copied from these projects. Algorithms were reimplemented from
their published descriptions. Licenses marked `unverified` were not confirmed
in the searches run for this build — check the project's own LICENSE file
before reusing anything from it.

| Project | Algorithm (as described in sources) | Strengths | Weaknesses | License |
|---|---|---|---|---|
| MOSS (Stanford) | Winnowing fingerprints over normalised token sequences | Long-running, language breadth, ignores names/formatting | Submissions go to a hosted server; results expire; restructured code can score low | Not open source; free academic service — https://theory.stanford.edu/~aiken/moss/ |
| Winnowing paper (Schleimer, Wilkerson, Aiken, SIGMOD 2003) | k-grams hashed, rightmost minimum per window | Compact fingerprints, detection guarantee above threshold | Misses matches below k; heavy paraphrase invisible | Paper: http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf |
| JPlag | Greedy string tiling over token sequences | Runs locally, strong on code, report viewer | Needs Java/CLI setup; mainly code, not prose | GPL-3.0 per LinuxLinks directory — https://www.linuxlinks.com/jplag-detect-source-code-plagiarism/ ; repo: https://github.com/jplag/JPlag |
| Dolos (Ghent) | Tree-sitter concrete syntax trees, identifiers/strings/comments masked, then string matching | Broad language support via Tree-sitter; graphs and side-by-side views | Parser availability varies by language; hosted option uploads code | unverified — paper: https://arxiv.org/pdf/2402.10853 ; languages: https://dolos.ugent.be/about/languages.html |
| copydetect | Winnowing (MOSS-style), Pygments tokenisation, NumPy fingerprints, HTML report | Fast, 500+ languages via Pygments, local | Python/CLI only; no prose safeguards like PlagTrace's | unverified — PyPI: https://pypi.org/project/copydetect/0.2.0/ |
| Sherlock (Warwick, academic tool) | unverified in this build's searches | Historically used for student code/text comparison | unverified | unverified |
| SIM (Dick Grune's similarity tester) | unverified in this build's searches | Long-standing, local, language-agnostic token comparison (per its historical description) | unverified | unverified |
| jscpd | Tokenisation + Rabin-Karp matching, configurable minimum tokens/lines, HTML reports | Very broad language coverage, CI-friendly | Token-based only; no prose/citation safeguards | MIT — https://github.com/kucherenko/jscpd |

What PlagTrace adds that none of the above combine: fully static, in-browser
only, prose + code in one page, quote/citation/boilerplate exclusion shown in
the report, evidence bands with an `inconclusive` floor, and a report that
records SHA-256 hashes, settings, version, and timestamp for reproducibility.

## On the AI percentage the user asked for — a refusal, with evidence

PlagTrace deliberately shows **no AI-authorship percentage**. See
`AI-DETECTION-NOTE.md` for the full case, in short: Liang et al. (Patterns,
2023) found a 61.3% average false-positive rate on non-native English
writers' essays across seven detectors; Turnitin's own <1% figure applies
only above 20% AI text and trades off missing ~15% of AI text; independent
benchmarks give the same tools false-positive rates varying by an order of
magnitude; detectors disagree with each other on identical text; and
edited/humanised text collapses detection. A single "% AI" printed to a
reviewer is exactly the kind of output that could end a student's career
on a false positive. What PlagTrace shows instead is a defined,
reproducible **similarity coverage % per source** — matched characters ÷
Document A characters under stated settings — with every passage readable.
That is the Turnitin-style similarity % done honestly, not an AI verdict.

## Top-10 comparison

See `COMPARISON.md` for the full table (Turnitin, Scribbr, Copyleaks,
QuillBot, Originality.ai, iThenticate, Grammarly, Copyscape, Quetext,
GPTZero) and an honest statement of where PlagTrace cannot win: database
size. It has no web database by design. Where it does lead is per-source
evidence + source removal with audit trail + mandatory reviewer decisions
+ no AI % + zero upload + inspectable code. "Best in the world" is claimed
only on that named, verifiable dimension — not overall.

## Measured quality — read the caveat

Run: `node --test tests/sim.test.mjs` and `node tests/metrics.mjs`.

- Unit tests: **12 passed, 0 failed** (previous 10 plus coverage-union
  and per-source removal tests).
- Generated ground-truth set (`tests/metrics.mjs`, 10 pairs, decision rule
  fixed in the file before scoring): **precision 1.0, recall 1.0,
  false-positive rate 0.0** (TP 5, FP 0, FN 0, TN 5).

**Caveat, stated plainly:** 10 hand-made pairs are not a benchmark. These
numbers describe this tiny generated set only. They do **not** generalise to
real student work, and no PAN corpus numbers are claimed — PAN was not
downloaded or run in this build. A real evaluation needs a larger, independent
set (including heavy paraphrase and translation, which this method is known
to miss — see `limitations.html`). Anyone quoting the 1.0/1.0 figures without
the 10-pair caveat is misrepresenting this project.

## Run it

```sh
# No build step. Serve the folder statically, e.g.:
python3 -m http.server 8000
# open http://localhost:8000
# Tests need Node 18+ only (no dependencies):
node --test tests/sim.test.mjs
node tests/metrics.mjs
```

Demo: click "Load demo pair" in the app, or open `demo/sample-a.txt` and
`demo/sample-b.txt`.

## New in v0.3.0 — upload options, better UI, screenshot-driven features

- **Upload options:** paste, Paste-from-clipboard buttons, drag & drop
  onto each document card, file picker, and a multi-file reference
  corpus. Accepted: .txt, .md, .docx, .pdf (text layer), code files.
  Live word/character counts on both documents.
- **Better UI (mobile-first):** hero with scope stated up front, card
  layout, large primary check button, coverage summary, numbered
  source cards with words matched, Copy Citation notes (never invented
  bibliographic details), Re-scan button, and side-by-side highlighting.
  See `FEATURE-COMPARISON.md` for what was adopted from the five
  competitor screenshots the user supplied (T-Checker, GPTZero,
  Grammarly, Scribbr) and what was refused — AI verdicts, "risk: High"
  labels, "no plagiarism found" absolutes, and humanizers.
- **On "100% better / 100% accurate":** not claimed, because it cannot
  be evidenced. No tool in the comparison is 100% accurate, and
  PlagTrace loses on web-database recall by design. It is better on the
  verifiable safety dimensions (privacy, transparency, reviewer
  workflow, no AI %, no verdict) and honest about the rest.

## New in v0.2.0 — per-source, source removal, human review

- **Per-source table:** coverage %, Jaccard, longest match, match count,
  and evidence band for each reference source, plus union coverage.
- **Remove a source:** untick or remove it; the next run recalculates and
  the removed sources are named in the report. Export before/after and the
  change is auditable — removal never silently hides the original run.
- **Human-review workflow:** every match gets a reviewer decision
  (cited quote / paraphrase+citation / template / common knowledge /
  needs author response / refer for human judgement). Export is marked
  incomplete until every match is reviewed. The author must get a chance
  to respond before any decision.
- **Fix-it guidance (legitimate only):** quote + cite, paraphrase + cite,
  cite your own prior work. Paraphrasers/humanizers that hide a match
  without attribution are explicitly warned against, not offered.

## File formats

- `.txt`, `.md`, source code: read directly in the browser.
- `.docx`: minimal local ZIP reader → `word/document.xml` → text nodes.
- `.pdf`: best-effort extraction of Tj/TJ operators from uncompressed and
  FlateDecode streams. Scanned-image and encrypted PDFs are not readable;
  that is a documented limitation, not a silent failure.

## Export

JSON report contains: tool, version, timestamp, settings, SHA-256 hashes of
both inputs, all pair results, matches with offsets, and excluded spans.
Print / save-as-PDF uses the browser's print function (no PDF library, no
server round-trip).

## Repo structure

```
index.html limitations.html styles.css
src/sim.js      # pure algorithms (also imported by Node tests)
src/app.js      # browser UI, highlighting, JSON/print export
src/files.js    # local .docx/.pdf text extraction
tests/sim.test.mjs tests/metrics.mjs
demo/sample-a.txt demo/sample-b.txt
.github/workflows/ci.yml .github/workflows/pages.yml
```

## Self-audit (claims vs evidence)

- "Nothing leaves the browser" — evidence: no `fetch` to any API in
  `src/` except loading local demo files; no backend code in the repo.
  (Demo loading uses same-origin fetch only.)
- "Deterministic" — evidence: determinism unit test passes.
- "10/10 tests, precision/recall 1.0" — evidence: commands above, on the
  10-pair generated set only; PAN not claimed.
- "Name is free" — **not claimed**. Web search evidence is in the table
  above; registry/Pages confirmation is pending at creation time.
- "Top in the world" — **not claimed**. This is a focused, honest,
  privacy-first tool with documented blind spots (paraphrase, translation,
  restructuring, scanned PDFs). Its advantage is verifiable: local-only,
  evidence-first, no verdicts, reproducible reports.

## License

MIT — see `LICENSE`. Contributions: see `CONTRIBUTING.md`.
Security issues: see `SECURITY.md` (do not open a public issue for a
vulnerability; the app processes untrusted local files in the browser, so
file-parser bugs are in scope).
