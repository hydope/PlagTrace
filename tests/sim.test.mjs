import test from 'node:test';
import assert from 'node:assert/strict';
import { compareDocs, compareAgainstCorpus, coveredChars, matchedWords, winnow, hashString } from '../src/sim.js';
const T = (s) => s;
const identical = 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise';
const paraphrase = 'The quick brown fox leaps over the lazy dog near the river bank every morning at sunrise while birds sing in the trees above the water';
const unrelated = 'Quantum computing uses qubits and superposition to perform certain calculations faster than classical machines in specific laboratory conditions';
const citedA = 'As noted, "the quick brown fox jumps over the lazy dog" (Smith, 2020). Our own analysis of river ecology follows a different method entirely with new field observations.';
const citedB = 'The quick brown fox jumps over the lazy dog near the river bank every morning at sunrise and the field team recorded water temperature daily.';
const codeA = 'function total(items) { let sum = 0; for (let i = 0; i < items.length; i++) { sum += items[i]; } return sum; }';
const codeB = 'function compute(values) { let result = 0; for (let j = 0; j < values.length; j++) { result += values[j]; } return result; }';

test('identical texts score 1 on jaccard and cosine', () => {
  const r = compareDocs(identical, identical);
  assert.equal(r.jaccard, 1); assert.equal(r.tfidfCosine, 1); assert.ok(r.matches.length > 0);
});
test('paraphrased text scores between unrelated and identical', () => {
  const p = compareDocs(identical, paraphrase), u = compareDocs(identical, unrelated);
  assert.ok(p.jaccard > u.jaccard && p.jaccard < 1, `paraphrase ${p.jaccard} unrelated ${u.jaccard}`);
});
test('unrelated texts are inconclusive', () => {
  const r = compareDocs(identical, unrelated);
  assert.equal(r.evidenceBand, 'inconclusive'); assert.equal(r.flaggedForReview, false);
});
test('quoted text is excluded from matches', () => {
  const withQ = compareDocs(citedA, citedB), withoutQ = compareDocs(citedA, citedB, { excludeQuotes: false });
  assert.ok(withQ.matches.length <= withoutQ.matches.length);
  assert.ok(withQ.excluded.docA.length >= 1);
});
test('renamed-variable code still matches strongly', () => {
  const r = compareDocs(codeA, codeB, { mode: 'code' });
  assert.ok(r.jaccard >= 0.8, `code jaccard ${r.jaccard}`); assert.ok(r.matches.length > 0);
});
test('deterministic: same inputs and settings give identical results', () => {
  const a = compareDocs(identical, paraphrase), b = compareDocs(identical, paraphrase);
  assert.deepEqual(a, b);
});
test('winnowing is deterministic and selects a subset', () => {
  const hashes = [9, 3, 7, 3, 8, 1, 4, 1, 9];
  assert.deepEqual(winnow(hashes, 3), winnow(hashes, 3));
  assert.ok(winnow(hashes, 3).length <= hashes.length);
});
test('hash is stable', () => { assert.equal(hashString('hello world'), hashString('hello world')); });
test('results use only evidence bands, never a misconduct verdict', () => {
  const r = compareDocs(identical, identical);
  assert.ok(['inconclusive', 'low', 'medium', 'high'].includes(r.evidenceBand));
  assert.ok(!('verdict' in r));
});
test('coveredChars unions overlapping intervals without double-counting', () => {
  const c = coveredChars([{ aStart: 0, aEnd: 10 }, { aStart: 5, aEnd: 15 }, { aStart: 20, aEnd: 25 }], 100);
  assert.equal(c.chars, 20); assert.equal(c.percent, 0.2);
});
test('per-source breakdown: removing a source drops union coverage', () => {
  const doc = 'Photosynthesis converts sunlight water and carbon dioxide into oxygen and glucose inside chloroplasts';
  const src = [{ name: 'source.txt', text: doc }, { name: 'other.txt', text: 'Quantum computing uses qubits in laboratory conditions' }];
  const all = compareAgainstCorpus(doc, src, {}, new Set());
  const removed = compareAgainstCorpus(doc, src, {}, new Set(['source.txt']));
  assert.ok(all.unionCoveredPercent > removed.unionCoveredPercent);
  assert.equal(removed.excludedCount, 1);
  assert.equal(all.perSource.find(p => p.source === 'source.txt').coveredPercent, 1);
});
test('matchedWords counts whole words inside matches once', () => {
  const r = compareDocs('Alpha beta gamma delta epsilon zeta', 'Alpha beta gamma delta epsilon zeta', { minWords: 3, minChars: 10 });
  assert.equal(matchedWords('Alpha beta gamma delta epsilon zeta', r.matches), 6);
});
test('short common phrase alone is inconclusive', () => {
  const r = compareDocs('in this paper we present results', 'in this paper we present results and discussion');
  assert.equal(r.evidenceBand, 'inconclusive');
});

import { paraphraseSignals } from '../src/sim.js';
test('paraphraseSignals finds reordered sentences, not unrelated text', () => {
  const sig = paraphraseSignals('The cat sat on the mat. The dog barked at the mailman. The bird sang in the morning tree.', 'The bird sang in the morning tree. The dog barked at the mailman. The cat sat on the mat.');
  assert.ok(sig.length >= 3, JSON.stringify(sig));
  assert.equal(paraphraseSignals('Quantum computers use qubits and superposition to solve certain problems faster.', 'Medieval castles were built from stone with thick walls, towers, and moats to defend.').length, 0);
});
test('paraphraseSignals finds light edits, misses full synonym rewrites', () => {
  const light = paraphraseSignals('Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into oxygen and glucose.', 'Photosynthesis is the method by which green plants transform sunlight, water, and carbon dioxide into oxygen and glucose for growth.');
  assert.ok(light.length >= 1);
  const full = paraphraseSignals('Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into oxygen and glucose.', 'Plants make their own food using light energy, water and air, producing sugar and releasing oxygen as a byproduct.');
  assert.equal(full.length, 0);
});
