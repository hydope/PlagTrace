# Contributing to PlagTrace

- Keep everything client-side: no network calls except same-origin demo files.
- Keep `src/sim.js` pure and deterministic so Node tests can import it.
- Every new algorithm needs a ground-truth test in `tests/` and, if it changes
  scores, an updated metrics run — report the real numbers, with the set size.
- Never add a misconduct verdict, an AI-text detector, or a score presented as
  a probability of misconduct. Evidence bands only.
- Accessibility: labels for every control, visible focus, keyboard-usable,
  contrast that passes WCAG AA on the default theme.
- Run `node --test tests/sim.test.mjs` before opening a pull request.
