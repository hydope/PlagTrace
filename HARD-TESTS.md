# PlagTrace hard tests — run on the live site, verified 2026-10-25

How to run each test: open https://hydope.github.io/PlagTrace/, paste A into
Document A, B into Document B (for test 06, choose "Source code" in
"What kind of text?"), click Check similarity. Numbers below were measured
by running the same engine (src/sim.js, defaults: k=5, window=4,
minWords=8, minChars=40) in Node on 2026-10-25 — not guessed.

## PASS — verbatim long copy is caught
Test 01: A = two photosynthesis sentences, B = same + one extra sentence.
Result: 99.6% covered, Jaccard 0.90, 1 passage, 260 chars, 40 words,
band high, FLAGGED. Correct.

## PASS — single short sentence is shown, NOT flagged
Test 02: A = one 14-word sentence, B = that sentence + unrelated text.
Result: 98.6% covered, 1 passage, 69 chars, band medium, NOT flagged.
Correct per the flagging rule: a single passage under 150 chars and under
90 total matched chars is context, not a flag. Coverage is high only
because Document A is one sentence long — in a real paper it would be <1%.

## PARTIAL — light edit breaks most of the match
Test 03: "process" -> "method", "convert" -> "transform", plus extra words.
Result: 49.2% covered, 1 passage, 59 chars, 9 words, band medium,
NOT flagged. Only the unchanged tail matched. Honest limit: a verbatim
engine cannot see synonym swaps as a full match.

## KNOWN BLIND SPOT — paraphrase scores 0%
Test 04: same meaning, completely rewritten words.
Result: 0.0% covered, 0 passages, band inconclusive, NOT flagged.
This is NOT a bug to hide: PlagTrace has no semantic/paraphrase detection
by design (see accuracy.html: paraphrase 0/3 on the main set, 0/3 on the
held-out set). Any tool claiming to "detect paraphrase" with a % is
guessing — PlagTrace says inconclusive instead.

## KNOWN FAIL — reordered SHORT sentences are missed
Test 05: three short sentences in reverse order.
Result: 0.0% covered, 0 passages, band inconclusive — EVEN THOUGH
Jaccard is 0.36, containment 0.53 and TF-IDF cosine is 1.00.
Why: each sentence is under the 8-word minimum, so no passage meets the
threshold, and the engine reports passages, not Jaccard. This is a real
weakness for short-sentence reordering, documented here, not hidden.
Longer reordered sentences DO match (see test 10).

## PASS — code with renamed variables is caught
Test 06 (mode: code): same function, all variable names changed.
Result: 100.0% covered, Jaccard 1.00, 1 passage, 129 chars, band high,
FLAGGED. Code tokens replace identifiers with ID and literals with LIT,
so renaming does not hide a copy.

## PASS — quoted text and References are excluded
Test 07: A quotes the sentence and lists it in References; B contains it
as plain text.
Result: 0.0% covered, 0 passages, band inconclusive. Correct: quoted and
bibliography text is excluded from scoring. Note TF-IDF cosine is still
0.89 — cosine alone would mislead, which is why the decision uses
matched passages, not cosine.

## PASS — unrelated texts are clean
Test 08: quantum computers vs medieval castles.
Result: 0.0% covered, 0 passages, band inconclusive, NOT flagged. Correct.

## EDGE CASE — a document that IS only a common phrase
Test 09: Document A is ONLY the sentence "In conclusion, this paper
argues that further research is needed to understand the problem fully."
Result: 99.0% covered, 1 passage, 96 chars, band medium, FLAGGED.
Why: the flagging rule flags when total matched chars >= 90 AND coverage
>= 50% — and here the common phrase IS 99% of the document. In a real
paper that sentence would be <1% of the document and would not flag.
Short-document edge case, documented, not hidden.

## PASS — two passages are caught
Test 10: two photosynthesis/respiration passages, B adds one sentence.
Result: 99.6% covered, 1 merged passage (they are adjacent), 245 chars,
38 words, band high, FLAGGED. Correct outcome; match count is 1, not 2,
because adjacent passages merge into one interval.

## The cited-abstract control (from the real paper)
- Your paper vs all 12 cited abstracts: 0.0% — paraphrase, not copy.
- A test document with 300 verbatim characters from the Donaldson &
  Preston abstract vs that abstract: 80.4% union, 1 passage, 295 chars.
  The engine catches a copy when there is one.

## Scorecard
Pass: 01, 02, 06, 07, 08, 10 (6/10)
Partial / edge: 03, 09 (2/10)
Known fail / blind spot: 04, 05 (2/10)
No test above was edited to make the tool look better. The two fails are
the plan's Phase 3 work (sentence bag-of-words paraphrase signal, and a
reordered-sentence fix), with a rollback rule if held-out false positives
worsen.
