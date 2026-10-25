// Generated ground-truth set (not PAN — see README: PAN was not downloaded or run
// in this build, so no PAN numbers are claimed). Decision rule, fixed before scoring:
// flagged = flaggedForReview from compareDocs with default settings (text mode
// unless noted). Positives: identical / near-identical / renamed code.
// Negatives: unrelated / citation-only / boilerplate-only / short-phrase.
import { compareDocs } from '../src/sim.js';
const pairs = [
  ['identical-1', 'The mitochondria is the powerhouse of the cell and generates most of the chemical energy needed to power biochemical reactions in the cell', 'The mitochondria is the powerhouse of the cell and generates most of the chemical energy needed to power biochemical reactions in the cell', true, {}],
  ['identical-2', 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts in the leaves of green plants', 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts in the leaves of green plants', true, {}],
  ['near-identical', 'The river valley was formed by erosion over thousands of years as water carved through layers of rock and sediment', 'The river valley was formed by erosion over thousands of years as water carved through layers of rock and sediment and deposited silt downstream', true, {}],
  ['paraphrase-shared', 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise', 'The quick brown fox leaps over the lazy dog near the river bank every morning at sunrise while birds sing overhead', true, {}],
  ['renamed-code', 'function total(items) { let sum = 0; for (let i = 0; i < items.length; i++) { sum += items[i]; } return sum; }', 'function compute(values) { let result = 0; for (let j = 0; j < values.length; j++) { result += values[j]; } return result; }', true, { mode: 'code' }],
  ['unrelated-1', 'The quick brown fox jumps over the lazy dog near the river bank', 'Quantum computing uses qubits and superposition to perform calculations in laboratory conditions', false, {}],
  ['unrelated-2', 'Photosynthesis converts sunlight into chemical energy in chloroplasts', 'The stock market rose on Tuesday after central banks signalled lower interest rates for the coming quarter', false, {}],
  ['citation-only', 'As noted, "the quick brown fox jumps over the lazy dog" (Smith, 2020). Our method uses new field observations and a different sampling design.', 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise', false, {}],
  ['boilerplate-only', 'In this paper we present a study of river fish migration patterns in northern watersheds', 'In this paper we present a study of desert birds nesting behaviour in southern arid regions', false, {}],
  ['short-phrase', 'in this paper we present results', 'in this paper we present results and discussion of methods', false, {}],
];
let tp = 0, fp = 0, fn = 0, tn = 0;
for (const [name, a, b, expected, opts] of pairs) {
  const r = compareDocs(a, b, opts);
  const flagged = r.flaggedForReview;
  console.log(`${name}: flagged=${flagged} expected=${expected} jaccard=${r.jaccard} longest=${r.longestMatchChars} band=${r.evidenceBand}`);
  if (flagged && expected) tp++; else if (flagged && !expected) fp++; else if (!flagged && expected) fn++; else tn++;
}
const precision = tp / (tp + fp || 1), recall = tp / (tp + fn || 1), fpr = fp / (fp + tn || 1);
console.log(JSON.stringify({ pairs: pairs.length, tp, fp, fn, tn, precision: +precision.toFixed(4), recall: +recall.toFixed(4), falsePositiveRate: +fpr.toFixed(4) }, null, 2));
