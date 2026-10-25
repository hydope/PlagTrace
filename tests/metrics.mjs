// Ground-truth set. Decision rule, fixed before scoring (except the
// flagging-rule change documented in src/sim.js, 2026-10-24, which was made
// AFTER this set's first run — so this set is no longer held-out; see
// tests/heldout.mjs for the set written after that change).
// flagged = flaggedForReview from compareDocs with default settings
// (text mode unless noted). Unit counted here is the PAIR, not the passage:
// precision = flagged pairs that were true copies / all flagged pairs.
// Categories: verbatim, light-edit, reordered, paraphrase, negative.
// Paraphrase pairs are true copies in meaning, rewritten so no long
// verbatim passage remains — the verbatim engine is expected to miss them,
// and that miss is counted, not hidden.
import { compareDocs } from '../src/sim.js';
const pairs = [
  ['identical-1', 'verbatim', 'The mitochondria is the powerhouse of the cell and generates most of the chemical energy needed to power biochemical reactions in the cell', 'The mitochondria is the powerhouse of the cell and generates most of the chemical energy needed to power biochemical reactions in the cell', true, {}],
  ['identical-2', 'verbatim', 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts in the leaves of green plants', 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts in the leaves of green plants', true, {}],
  ['identical-3', 'verbatim', 'Ocean tides are caused by the gravitational pull of the moon and the sun acting on the waters of the earth over each day', 'Ocean tides are caused by the gravitational pull of the moon and the sun acting on the waters of the earth over each day', true, {}],
  ['near-identical', 'light-edit', 'The river valley was formed by erosion over thousands of years as water carved through layers of rock and sediment', 'The river valley was formed by erosion over thousands of years as water carved through layers of rock and sediment and deposited silt downstream', true, {}],
  ['near-identical-swap', 'light-edit', 'The library committee approved the new reading list for first year students after reviewing recommendations from faculty members', 'The library committee approved the new reading list for first year students after reviewing suggestions from faculty members in May', true, {}],
  ['paraphrase-shared', 'light-edit', 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise', 'The quick brown fox leaps over the lazy dog near the river bank every morning at sunrise while birds sing overhead', true, {}],
  ['paraphrase-shared-2', 'light-edit', 'Climate change increases the frequency of extreme heat events in cities across southern Europe during summer months', 'Climate change increases the frequency of extreme heat events in cities across southern Europe during summer months according to recent studies', true, {}],
  ['renamed-code', 'light-edit', 'function total(items) { let sum = 0; for (let i = 0; i < items.length; i++) { sum += items[i]; } return sum; }', 'function compute(values) { let result = 0; for (let j = 0; j < values.length; j++) { result += values[j]; } return result; }', true, { mode: 'code' }],
  ['renamed-code-2', 'light-edit', 'def average(numbers): total = 0\nfor n in numbers: total += n\nreturn total / len(numbers)', 'def mean(values): result = 0\nfor v in values: result += v\nreturn result / len(values)', true, { mode: 'code' }],
  ['reordered-1', 'reordered', 'The museum opened a new wing in spring. Visitors queued for hours to see the ancient pottery collection on display.', 'Visitors queued for hours to see the ancient pottery collection on display. The museum opened a new wing in spring.', true, {}],
  ['reordered-2', 'reordered', 'Rain fell steadily through the night. The river rose by morning. Farmers moved livestock to higher ground before dawn.', 'Farmers moved livestock to higher ground before dawn. Rain fell steadily through the night. The river rose by morning.', true, {}],
  ['paraphrase-1', 'paraphrase', 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts in the leaves of green plants', 'Green plants make their own food from light energy. They take in a gas from the air and give off the gas animals breathe, storing energy as sugar.', true, {}],
  ['paraphrase-2', 'paraphrase', 'Ocean tides are caused by the gravitational pull of the moon and the sun acting on the waters of the earth over each day', 'The daily rise and fall of sea level happens because the moon and sun tug on the oceans as the earth turns.', true, {}],
  ['paraphrase-3', 'paraphrase', 'The Roman Empire expanded across Europe through military conquest and trade networks over several centuries', 'Rome grew into a huge empire over hundreds of years, winning wars and building trading routes across the continent.', true, {}],
  ['unrelated-1', 'negative', 'The quick brown fox jumps over the lazy dog near the river bank', 'Quantum computing uses qubits and superposition to perform calculations in laboratory conditions', false, {}],
  ['unrelated-2', 'negative', 'Photosynthesis converts sunlight into chemical energy in chloroplasts', 'The stock market rose on Tuesday after central banks signalled lower interest rates for the coming quarter', false, {}],
  ['unrelated-code', 'negative', 'function total(items) { let sum = 0; for (let i = 0; i < items.length; i++) { sum += items[i]; } return sum; }', 'The committee met on Tuesday to discuss funding for the new community centre and library renovation project', false, { mode: 'code' }],
  ['unrelated-history', 'negative', 'The Roman Empire expanded across Europe through military conquest and trade networks over several centuries', 'Modern electric vehicles use lithium batteries and regenerative braking to improve efficiency on long journeys', false, {}],
  ['citation-only', 'negative', 'As noted, "the quick brown fox jumps over the lazy dog" (Smith, 2020). Our method uses new field observations and a different sampling design.', 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise', false, {}],
  ['bibliography-only', 'negative', 'References\nSmith, J. (2020). River ecology and fish migration. Journal of Ecology, 12(3), 45-60.', 'River ecology and fish migration', false, {}],
  ['quoted-only', 'negative', 'As the author wrote, "the river flows gently through the valley in spring" and our survey followed that same route in summer.', 'the river flows gently through the valley in spring', false, {}],
  ['boilerplate-only', 'negative', 'In this paper we present a study of river fish migration patterns in northern watersheds', 'In this paper we present a study of desert birds nesting behaviour in southern arid regions', false, {}],
  ['short-phrase', 'negative', 'in this paper we present results', 'in this paper we present results and discussion of methods', false, {}],
  ['common-knowledge', 'negative', 'Water boils at one hundred degrees Celsius at standard atmospheric pressure on earth', 'Water boils at one hundred degrees Celsius at standard atmospheric pressure on earth according to textbooks', false, {}],
  ['template-only', 'negative', 'This assignment was submitted in partial fulfilment of the requirements for the degree', 'This assignment was submitted in partial fulfilment of the requirements for the degree in history', false, {}],
];
// Wilson score interval, 95% (z = 1.96). With n = 9 or 11, intervals are wide
// — that width is the point, and it must be published with the point estimate.
export function wilson(k, n) {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + z * z / n;
  const c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [+((c - m) / d).toFixed(4), +((c + m) / d).toFixed(4)];
}
let tp = 0, fp = 0, fn = 0, tn = 0;
const byCat = {};
for (const [name, cat, a, b, expected, opts] of pairs) {
  const r = compareDocs(a, b, opts);
  const flagged = r.flaggedForReview;
  console.log(`${name} [${cat}]: flagged=${flagged} expected=${expected} longest=${r.longestMatchChars} band=${r.evidenceBand}`);
  byCat[cat] = byCat[cat] || { total: 0, flagged: 0, expected: 0 };
  byCat[cat].total++; if (flagged) byCat[cat].flagged++; if (expected) byCat[cat].expected++;
  if (flagged && expected) tp++; else if (flagged && !expected) fp++; else if (!flagged && expected) fn++; else tn++;
}
const precision = tp / (tp + fp || 1), recall = tp / (tp + fn || 1), fpr = fp / (fp + tn || 1);
console.log('BY_CATEGORY', JSON.stringify(byCat, null, 2));
console.log(JSON.stringify({ pairs: pairs.length, tp, fp, fn, tn, precision: +precision.toFixed(4), precisionWilson95: wilson(tp, tp + fp), recall: +recall.toFixed(4), recallWilson95: wilson(tp, tp + fn), falsePositiveRate: +fpr.toFixed(4), falsePositiveRateWilson95: wilson(fp, fp + tn) }, null, 2));
