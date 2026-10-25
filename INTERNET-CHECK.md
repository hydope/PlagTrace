# Internet check — what it is, and what it is not

## The problem

PlagTrace v0.3.0 could only compare documents you supplied. If you had
no second document, you had no check at all. That was the most common
real-world case, and it made the tool useless for a lone student draft.

## What v0.4.0 adds (opt-in only)

1. Paste Document A, click **Search internet sources**.
2. PlagTrace takes up to 3 distinctive sentences from Document A,
   truncates each to 12 words, and sends **only those phrases** to:
   - Wikipedia's public API (`en.wikipedia.org/w/api.php`, CORS
     `Access-Control-Allow-Origin: *`, verified live 2026-10-24), then
     fetches the full text of up to 6 matching articles;
   - Semantic Scholar's paper search, best effort, for abstracts.
3. Fetched articles are added as reference sources, with a link to each
   source, and compared **locally** with the same engine (shingling +
   Winnowing, Jaccard, containment, TF-IDF cosine). No Document B is
   required; the A-vs-B score is simply not shown in that mode.
4. The exact phrases sent are shown in the results status box, so the
   privacy cost is auditable.

## What it is NOT

- **Not the whole web.** No Google/Bing index, no Turnitin database,
  no publisher paywalled database, no CourseHero, no Chegg. If a match
  lives only there, PlagTrace will not find it.
- **Not a server upload.** Full documents are never sent. Only short
  search phrases leave the browser, and only after an explicit click.
  The local check (no internet button) still sends nothing at all.
- **Not a negative proof.** "No match" here means "no match in the
  Wikipedia articles fetched (plus any Semantic Scholar abstracts
  returned)". It must never be reported as "no plagiarism anywhere".
- **Not rate-limit-proof.** Semantic Scholar returned HTTP 429 from
  this shared network on 2026-10-24 without an API key, and OpenAlex
  did the same; arXiv returned HTTP 503 in the same test run.
  Those failures are reported in the UI and in the
  report — they are never read as a clean result. Wikipedia worked
  with no key and no rate-limit hit in the same test.

## Inspiration from the GitHub topic you linked

https://github.com/topics/plagiarism-checker — 148 public repos at
check time (2026-10-24). Star counts from `gh search` the same day:

| Repo | Stars | What PlagTrace took from it |
|---|---|---|
| jplag/JPlag | 1,987 | Token-based code comparison, greedy matching over tokens — already in PlagTrace's code mode; the topic's #1 repo is code-only, which is why PlagTrace keeps prose + code modes separate. |
| dodona-edu/dolos | 355 | Identifier/string/comment masking in code tokens — already in PlagTrace's code mode. |
| NoplagLabs/noplag-engine | 87 | **The closest model, and the honest precedent:** sentence-window chunks → Winnowing fingerprints → candidate retrieval by fingerprint overlap → exact character ranges, with "honest coverage accounting" (no double-counting). Its README says verbatim/near-verbatim only, paraphrase/semantic/AI on a public roadmap "not pretended-present", and — crucially — its open-source engine matches a local corpus only; only its hosted product searches the live web. PlagTrace v0.4.0 follows the same split: local engine + an opt-in, openly-limited internet fetch, instead of pretending to be a web search engine. |
| Wazzabeee/copy-spotter | 58 | Similar sentences highlighted side by side — already PlagTrace's side-by-side view. |
| JonathanReeve/text-matcher | 140 | Simple text-reuse CLI — the reminder that a readable, auditable tool beats a black box. |
| josemmo/plagpatrol | 42 | Tamper detection — noted, not built: detecting deliberate evasion is a different product and would need its own evidence base. |

Refused from the wider search (not the topic page itself): the
6,447-star Turnitout-Humanizer, whose pitch is bypassing Turnitin /
iThenticate / GPTZero. Star count does not make evasion legitimate,
and building it would directly endanger students who use it.

## Bottom line for a student

With no second document, v0.4.0 gives you a real, checkable result
against Wikipedia and scholarly abstracts — with every source named
and linked, every match shown with offsets, and every limit printed
next to the result. What it cannot give you is Turnitin's database.
If your institution will run Turnitin, run PlagTrace first to fix
attribution, then expect Turnitin to still find sources PlagTrace
could not see. That gap is a property of the data, not a bug to hide.
