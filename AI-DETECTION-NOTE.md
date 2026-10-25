# Why PlagTrace shows no AI-authorship percentage

This is a deliberate refusal, not a missing feature. The user asked for "the
best AI %". The evidence says a single AI % is the least safe number this
tool could print, precisely because one wrong output can end a student's
career.

## The evidence

1. **Liang et al., Patterns (Cell Press), 2023** — seven widely used GPT
   detectors run over 91 TOEFL essays by non-native English writers:
   average false-positive rate **61.3%**, vs near-zero on native-speaker
   essays. Rewriting the same essays with richer vocabulary dropped the
   false-positive rate to ~11.6% — the detectors were measuring vocabulary
   simplicity, not authorship. The paper argues these tools should not be
   used in evaluative or educational settings.
2. **Turnitin's own figures, with their own caveats** — Turnitin states a
   <1% false-positive rate, but only for documents with >20% AI-generated
   text, and it says it likely misses ~15% of AI text to keep that rate low.
   Its AI percentage "does not necessarily correlate to the amount of text
   highlighted" and does not cover poetry, scripts, code, bullet points, or
   tables. A vendor figure measured in its own lab is not an independent
   measurement.
3. **Independent benchmarks disagree wildly with vendor claims** — one
   2026 benchmark summary puts GPTZero at ~95.7% catch rate with ~6–8%
   false positives (vs a 0.24% vendor claim), Originality.ai at ~85%
   average, and Turnitin at ~85% after its intentional 15% skip. Other
   2026 summaries give GPTZero false-positive rates from 3.2% to 13–20%
   depending on the sample. When the same tool's false-positive rate varies
   by an order of magnitude across benchmarks, printing one clean "% AI"
   to a student is misleading.
4. **Detectors disagree with each other on identical text** — reported
   false-positive rates on identical human inputs ranged from 0% (Turnitin)
   to 50% (GPTZero) across 14 tools in one cited comparison. A student
   cleared by one tool can be flagged by another, with no way to know which
   is right from the percentage alone.
5. **Edited/humanised text collapses detection** — one head-to-head summary
   reports humanised-AI detection rates of ~5–22% across the major tools,
   vs 85–98% on raw AI text. So the percentage is simultaneously too harsh
   on honest human writers (point 1) and too weak on edited AI text.
6. **OpenAI discontinued its own classifier** in July 2023 for low accuracy
   (~26% of AI text correctly identified as "likely AI", ~9% of human text
   mislabelled in its own testing).

## What PlagTrace shows instead

- **Similarity coverage % per source** — a defined, reproducible fraction
  (matched characters ÷ Document A characters, under stated settings),
  with every matched passage readable and every source named.
- **A human-review step** — no match is "complete" until a reviewer records
  cited / paraphrased / template / common-knowledge / needs-response, and
  the author gets a chance to respond.
- **A fixing guide that does not teach evasion** — quote + cite, paraphrase
  + cite, cite your own prior work. Paraphrasers/humanizers that hide a
  match without adding attribution are explicitly not recommended.

If an institution requires an AI-authorship check, that decision must use
its own process evidence (draft history, oral defence, process capture) —
not a percentage from this tool, and not a percentage from any single
detector. That is the career-safe position, and it is the reason this tool
will not add an AI % even if competitors do.
