import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPhrases } from '../src/internet.js';
test('searchPhrases returns up to 3 distinct 12-word queries from long sentences', () => {
  const text = 'Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into oxygen and glucose for growth. The light-dependent reactions take place in the thylakoid membranes of chloroplasts in plant cells. Short one.';
  const q = searchPhrases(text);
  assert.ok(q.length >= 1 && q.length <= 3);
  assert.ok(q.every(s => s.split(' ').length <= 12));
  assert.equal(new Set(q).size, q.length);
});
test('searchPhrases returns empty for short text', () => {
  assert.deepEqual(searchPhrases('Too short.'), []);
});
