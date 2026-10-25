// HELD-OUT SET — written 2026-10-24 AFTER the flagging rule in src/sim.js
// was fixed (2 matches, or >=150 chars, or >=90 matched chars covering
// >=50% of Document A). This set was NOT used to choose that rule, and the
// rule must not be changed again in response to these results without
// saying so here and in accuracy.html. Same counting as metrics.mjs:
// unit is the pair, flagged = flaggedForReview, defaults unless noted.
// Topics are deliberately different from metrics.mjs (cooking, sport,
// astronomy, medicine, law, music, gardening, aviation, geology, film).
import { compareDocs } from '../src/sim.js';
function wilson(k, n) {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + z * z / n;
  const c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [+((c - m) / d).toFixed(4), +((c + m) / d).toFixed(4)];
}
const pairs = [
  ['ho-verbatim-1', 'verbatim', 'Baking bread at home requires strong flour, warm water, yeast, and patience while the dough rises slowly overnight in a cool kitchen', 'Baking bread at home requires strong flour, warm water, yeast, and patience while the dough rises slowly overnight in a cool kitchen', true, {}],
  ['ho-verbatim-2', 'verbatim', 'The marathon runner trained for six months, running five days each week and gradually increasing the longest run every Sunday morning', 'The marathon runner trained for six months, running five days each week and gradually increasing the longest run every Sunday morning', true, {}],
  ['ho-verbatim-3', 'verbatim', 'Jupiter is the largest planet in the solar system, with a mass more than twice that of all the other planets combined', 'Jupiter is the largest planet in the solar system, with a mass more than twice that of all the other planets combined', true, {}],
  ['ho-verbatim-4', 'verbatim', 'The patient was advised to rest, drink fluids, and return to the clinic if the fever lasted longer than three days', 'The patient was advised to rest, drink fluids, and return to the clinic if the fever lasted longer than three days', true, {}],
  ['ho-verbatim-5', 'verbatim', 'A contract is formed when one party makes an offer, another accepts it, and both sides provide something of value in exchange', 'A contract is formed when one party makes an offer, another accepts it, and both sides provide something of value in exchange', true, {}],
  ['ho-light-1', 'light-edit', 'The orchestra performed Beethoven symphonies in the concert hall on Friday evening before a large and appreciative audience', 'The orchestra performed Beethoven symphonies in the concert hall on Friday evening before a large and enthusiastic audience in the city', true, {}],
  ['ho-light-2', 'light-edit', 'Gardeners should prune roses in late winter, removing dead wood and shaping the plant before new growth begins in spring', 'Gardeners should prune roses in late winter, removing dead wood and shaping the plant before new growth begins in springtime', true, {}],
  ['ho-light-3', 'light-edit', 'The pilot checked fuel, weather, and navigation charts before departing the small airfield at dawn on Tuesday morning', 'The pilot checked fuel, weather, and navigation charts before departing the small airfield at dawn on Tuesday morning for the coast', true, {}],
  ['ho-light-4', 'light-edit', 'Volcanoes form where tectonic plates move apart or collide, allowing molten rock to rise through cracks in the crust', 'Volcanoes form where tectonic plates move apart or collide, allowing molten rock to rise through cracks in the earth crust', true, {}],
  ['ho-light-5', 'light-edit', 'The film director chose black and white cinematography to emphasise shadows, contrast, and the mood of the postwar city', 'The film director chose black and white cinematography to emphasise shadows, contrast, and the mood of the postwar city streets', true, {}],
  ['ho-reordered-1', 'reordered', 'The committee approved the budget in January. Construction began in March. The building opened to the public in September.', 'Construction began in March. The building opened to the public in September. The committee approved the budget in January.', true, {}],
  ['ho-reordered-2', 'reordered', 'She practised scales every morning. She rehearsed with the quartet every afternoon. She performed solo on Saturday evening.', 'She performed solo on Saturday evening. She practised scales every morning. She rehearsed with the quartet every afternoon.', true, {}],
  ['ho-paraphrase-1', 'paraphrase', 'Baking bread at home requires strong flour, warm water, yeast, and patience while the dough rises slowly overnight in a cool kitchen', 'To make bread yourself you need good flour, lukewarm water, yeast, and time, letting the dough prove slowly somewhere cool overnight.', true, {}],
  ['ho-paraphrase-2', 'paraphrase', 'Jupiter is the largest planet in the solar system, with a mass more than twice that of all the other planets combined', 'No other planet comes close to Jupiter in size; it outweighs every other planet put together by more than double.', true, {}],
  ['ho-paraphrase-3', 'paraphrase', 'A contract is formed when one party makes an offer, another accepts it, and both sides provide something of value in exchange', 'For a deal to count as a contract, someone must offer terms, the other side must agree, and each must give up something valuable.', true, {}],
  ['ho-unrelated-1', 'negative', 'Baking bread at home requires strong flour, warm water, yeast, and patience while the dough rises slowly overnight', 'The telescope revealed distant galaxies, nebulae, and star clusters far beyond the edge of the Milky Way', false, {}],
  ['ho-unrelated-2', 'negative', 'The marathon runner trained for six months, running five days each week and gradually increasing the longest run', 'Ancient pottery shards were discovered beneath the floor of a Roman villa during excavation work last summer', false, {}],
  ['ho-unrelated-3', 'negative', 'Jupiter is the largest planet in the solar system, with a mass more than twice that of all the other planets combined', 'Local farmers markets sell cheese, honey, vegetables, and handmade soap every Saturday morning in the town square', false, {}],
  ['ho-unrelated-4', 'negative', 'The patient was advised to rest, drink fluids, and return to the clinic if the fever lasted longer than three days', 'The new railway line will connect the coastal towns with the capital, reducing journey times by almost half', false, {}],
  ['ho-unrelated-5', 'negative', 'A contract is formed when one party makes an offer, another accepts it, and both sides provide something of value', 'Penguins breed in large colonies on Antarctic ice, returning each year to the same nesting sites', false, {}],
  ['ho-unrelated-6', 'negative', 'The orchestra performed Beethoven symphonies in the concert hall on Friday evening before a large audience', 'Solar panels installed on rooftops generate electricity during daylight and feed surplus power back to the grid', false, {}],
  ['ho-unrelated-7', 'negative', 'Gardeners should prune roses in late winter, removing dead wood and shaping the plant before new growth begins', 'The harbour festival featured boat races, seafood stalls, live music, and fireworks over the water at night', false, {}],
  ['ho-unrelated-8', 'negative', 'The pilot checked fuel, weather, and navigation charts before departing the small airfield at dawn', 'Bees pollinate flowering plants by carrying pollen between blossoms as they collect nectar during warm months', false, {}],
  ['ho-unrelated-9', 'negative', 'Volcanoes form where tectonic plates move apart or collide, allowing molten rock to rise through cracks', 'The library digitised thousands of manuscripts, maps, and photographs to make them available online for researchers', false, {}],
  ['ho-unrelated-10', 'negative', 'The film director chose black and white cinematography to emphasise shadows, contrast, and mood', 'Cyclists in the city use dedicated lanes, shared paths, and traffic signals to travel safely during rush hour', false, {}],
  ['ho-citation-1', 'negative', 'As the report states, "the river level rose rapidly after heavy rain" and our team measured the same rise the following week.', 'the river level rose rapidly after heavy rain', false, {}],
  ['ho-template-1', 'negative', 'This thesis is submitted in fulfilment of the requirements for the award of the degree of Master of Science', 'This thesis is submitted in fulfilment of the requirements for the award of the degree of Master of Arts', false, {}],
  ['ho-common-1', 'negative', 'The earth revolves around the sun once every three hundred and sixty five days approximately', 'The earth revolves around the sun once every three hundred and sixty five days approximately each year', false, {}],
  ['ho-short-1', 'negative', 'in conclusion the results show', 'in conclusion the results show a clear pattern', false, {}],
  ['ho-short-2', 'negative', 'further research is needed', 'further research is needed in this area', false, {}],
];
let tp = 0, fp = 0, fn = 0, tn = 0;
const byCat = {};
for (const [name, cat, a, b, expected, opts] of pairs) {
  const r = compareDocs(a, b, opts);
  const flagged = r.flaggedForReview;
  console.log(`${name} [${cat}]: flagged=${flagged} expected=${expected} longest=${r.longestMatchChars}`);
  byCat[cat] = byCat[cat] || { total: 0, flagged: 0, expected: 0 };
  byCat[cat].total++; if (flagged) byCat[cat].flagged++; if (expected) byCat[cat].expected++;
  if (flagged && expected) tp++; else if (flagged && !expected) fp++; else if (!flagged && expected) fn++; else tn++;
}
console.log('HELDOUT_BY_CATEGORY', JSON.stringify(byCat, null, 2));
console.log(JSON.stringify({ pairs: pairs.length, tp, fp, fn, tn, precision: +(tp / (tp + fp || 1)).toFixed(4), precisionWilson95: wilson(tp, tp + fp), recall: +(tp / (tp + fn || 1)).toFixed(4), recallWilson95: wilson(tp, tp + fn), falsePositiveRate: +(fp / (fp + tn || 1)).toFixed(4), falsePositiveRateWilson95: wilson(fp, fp + tn) }, null, 2));
