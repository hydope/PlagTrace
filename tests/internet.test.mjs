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
test('searchPhrases drops title page, headings, and references, and prefers distinctive cited sentences', () => {
  const text = `Stakeholder Theory of the Firm

Hussain Ali

University of the Cumberlands

Course: Signature Assessment

Abstract

The ethical foundations of the theory are examined in this essay along with its connections to corporate social responsibility and sustainability reporting and environmental performance.

Donaldson and Preston (1995) describe three aspects of stakeholder theory: how businesses interact with stakeholders, how these relationships affect performance, and why stakeholders deserve fair and ethical treatment in organisations.

Companies must also protect privacy, prevent unfair treatment, and maintain proper oversight in their daily business operations and management decisions.

References

Donaldson, T., & Preston, L. E. (1995). The stakeholder theory of the corporation. Academy of Management Review, 20(1), 65-91.`;
  const q = searchPhrases(text);
  assert.ok(q.length >= 1 && q.length <= 3);
  assert.ok(!q.join(' ').includes('Hussain'), 'title/author must not become a search phrase');
  assert.ok(!q.join(' ').includes('Cumberlands'), 'university must not become a search phrase');
  assert.ok(q[0].includes('Donaldson'), 'most distinctive cited sentence should rank first, got: ' + q.join(' | '));
});
