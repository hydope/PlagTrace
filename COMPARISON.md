# Top-10 comparison — and where PlagTrace honestly stands

Scope note: "best in the world" is not a measurable claim unless the dimension
is named. Below, each tool is judged on the dimensions a student-facing,
career-risk decision actually needs: (1) does it show per-source evidence you
can read, (2) does it keep your document private, (3) does it force a human
review step, (4) does it avoid an unsafe AI-authorship percentage, (5) is it
free and inspectable. On database size alone, Turnitin/iThenticate win and
PlagTrace cannot — it has no web database by design, because it never
uploads your text. That trade-off is stated, not hidden.

Prices below are as reported in the comparison sources consulted 2026-10-24
and will change; check the vendor page before buying. Where a cell says
"unverified", the search run did not confirm it.

## The 10 (from the 2026 comparison lists consulted)

| # | Tool | Best for (per lists) | What it does well | Career-risk weakness | Privacy / cost (as reported) |
|---|---|---|---|---|---|
| 1 | Turnitin | Universities, institutional | Largest academic database, LMS workflow, per-sentence AI indicator | AI indicator is a vendor-tuned percentage; see AI-DETECTION-NOTE.md. Not sold to individuals. | Institutional licence only; papers added to institutional database (per comparison lists) |
| 2 | Scribbr | Individual high-stakes work | Closest accessible alternative to Turnitin for individuals; does not store your document (per one list: deletes after 7 days — unverified here, check policy) | Per-check pricing; AI add-on inherits detector risk | $19.95–$39.95 per check (as reported) |
| 3 | Copyleaks | Enterprise, multilingual, API | Similarity + AI in one report, multilingual | AI score in the same report invites treating it as a verdict | From ~$13.99/mo annual (as reported) |
| 4 | QuillBot | Writers needing citation support | Citation help built into detection workflow | Primarily a writing tool, not an academic-grade database | Subscription (as reported) |
| 5 | Originality.ai | Content agencies, publishers | AI + similarity together, built for publishers | Independent benchmarks show higher false positives than vendor claims; ESL bias reported | From $12.95/mo (as reported) |
| 6 | iThenticate | Journal editors, publishers | Researcher standard, large scholarly database | $125 per manuscript (as reported); no free tier; credits expire (per one list) | $125 per manuscript |
| 7 | Grammarly | Writers inside an editor | Integrated writing + similarity workflow | Described in lists as "integrated, not academic-grade" | Pro from $12/mo annual (as reported) |
| 8 | Copyscape | Web publishers, SEO | Web duplication, cheap per-search | URL/web only; misses paraphrase and academic sources (per lists) | From 3¢/search (as reported) |
| 9 | Quetext | Students, low cost | Free spot checks, colour-coded reports | Small free plan; one list reports it flags proper citations and misses real matches | Free 1,000 words; from $9.99/mo (as reported) |
| 10 | GPTZero | AI detection as primary capability | Dedicated AI detector, free tier | AI-only (no source matching); detector disagreement and false positives — see AI note | 10,000 words/mo free; from ~$10/mo (as reported) |

Sources for the list order and the "best for" labels: the 2026 comparison
lists consulted (bestwriting.com top-15 list; phrasly.ai Turnitin-alternatives
table; rankite.com 9-tool comparison). Those lists are marketing-adjacent
secondary sources — they are evidence for "what the market claims", not for
measured accuracy. No independent accuracy ranking is claimed here.

## Inspiration taken from the top tools (GitHub / open-source side)

- Turnitin/Scribbr: per-source click-through — copied as PlagTrace's
  per-source table with coverage, Jaccard, longest match, and band per source.
- JPlag/Dolos/copydetect/jscpd: token/winnowing evidence, local running,
  side-by-side views — copied as the core engine and highlighted passages.
- Copyleaks/Quetext: colour-coded, readable reports — copied as highlighted
  passages with offsets, not just a number.
- GPTZero: per-sentence breakdown idea — adapted, but for *similarity*
  passages only, never for AI authorship.

## What PlagTrace does that none of the 10 combine

1. **Per-source coverage % with the formula shown** (union of matched
   intervals ÷ Document A length), recomputed live when a source is removed.
2. **Source removal with an audit trail**: removed sources are named in the
   report; export before/after and the change is visible.
3. **Mandatory reviewer decision per match** before export is marked
   complete (unreviewed / cited quote / paraphrase+citation / template /
   common knowledge / needs author response / refer for human judgement).
4. **No AI-authorship percentage at all** — the one feature whose false
   positives most directly threaten a student's career.
5. **Zero upload, zero cost, fully inspectable code** — the algorithm file
   is ~300 lines and the tests import it directly.

## What PlagTrace cannot do (so it cannot honestly be "best" overall)

- Search the web, Turnitin's database, or any publisher database. If the
  matching source is not in the documents you supply, it will not be found.
- Detect heavy paraphrase, translation, or restructuring (see limitations).
- Prove authorship, intent, or misconduct. No tool in the table can; the
  ones that print a single percentage make that limitation easiest to forget.
