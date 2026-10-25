// PlagTrace core — pure, deterministic, no DOM, no network, no randomness.
// Re-implementation (from the published algorithm descriptions, not copied code)
// of: k-gram shingling + Winnowing (Schleimer et al., SIGMOD 2003),
// Jaccard, containment, TF-IDF cosine, and identifier-normalised code tokens.
// This module never produces a misconduct verdict. It reports similarity
// evidence only; a human reviewer decides anything further.
export const VERSION = '0.6.0';

// Words in `text` that fall inside at least one matched interval in Document A.
// Counts whole words, never double-counting an overlapping word. Used for the
// "N words matched" figure on source cards — the same figure GPTZero-style
// reports show, but here it is computed from visible passages, not a server.
export function matchedWords(text, matches) {
  const toks = wordTokens(text);
  return toks.filter(t => matches.some(m => t.start >= m.aStart && t.end <= m.aEnd)).length;
}

// FNV-1a 32-bit: deterministic across runs and platforms for the same input.
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const WORD_RE = /[A-Za-z0-9_']+/g;
// Token with character offsets in the ORIGINAL text.
export function wordTokens(text) {
  const out = [];
  let m;
  while ((m = WORD_RE.exec(text)) !== null) out.push({ word: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  return out;
}

// Quoted spans: "..." and “...”. Also returns the References/Bibliography tail.
export function excludedSpans(text, opts) {
  const spans = [];
  if (opts.excludeQuotes) {
    const re = /"([^"]{3,})"|“([^”]{3,})”/g;
    let m; while ((m = re.exec(text)) !== null) spans.push({ start: m.index, end: m.index + m[0].length, reason: 'quoted text', text: m[0].slice(0, 120) });
  }
  if (opts.excludeCitations) {
    const m = text.match(/\n\s*(references|bibliography|works cited)\s*\n/i);
    if (m) spans.push({ start: m.index, end: text.length, reason: 'citations / bibliography section', text: text.slice(m.index, m.index + 120) });
    // Bracket citations like [12] or (Smith, 2020) are handled as tokens below.
  }
  return spans;
}
function inSpans(spans, start, end) { return spans.some(s => start >= s.start && end <= s.end); }

export const DEFAULT_STOP_SHINGLES = [
  'in this paper we', 'the results show that', 'it is important to note', 'in conclusion the study',
  'the purpose of this study', 'previous research has shown', 'as shown in figure', 'in this section we',
];

function containsStopPhrase(words, stopPhrases) {
  for (const phrase of stopPhrases) {
    const pw = phrase.split(' ');
    for (let i = 0; i + pw.length <= words.length; i++) if (pw.every((w, j) => w === words[i + j])) return true;
  }
  return false;
}
export function shingles(tokens, k, spans, stopSet) {
  const out = [];
  const stopPhrases = [...stopSet];
  for (let i = 0; i + k <= tokens.length; i++) {
    const slice = tokens.slice(i, i + k);
    const key = slice.map(t => t.word).join(' ');
    if (containsStopPhrase(slice.map(t => t.word), stopPhrases)) continue;
    if (spans.length && slice.every(t => inSpans(spans, t.start, t.end))) continue;
    out.push({ key, hash: hashString(key), start: slice[0].start, end: slice[slice.length - 1].end, words: slice.map(t => t.word) });
  }
  return out;
}

// Winnowing: in every window of w consecutive hashes, keep the rightmost minimum.
// Guarantees (paper): any match of length >= t is detected, matches < k are not.
export function winnow(hashes, w) {
  if (!hashes.length) return [];
  if (w <= 1) return hashes.map((h, i) => ({ hash: h, index: i }));
  const out = []; let last = -1;
  for (let i = 0; i + w <= hashes.length; i++) {
    let min = Infinity, minIdx = -1;
    for (let j = i; j < i + w; j++) if (hashes[j] <= min) { min = hashes[j]; minIdx = j; }
    if (minIdx !== last) { out.push({ hash: min, index: minIdx }); last = minIdx; }
  }
  if (!out.length) out.push({ hash: hashes[0], index: 0 });
  return out;
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
export function containment(a, b) { // |A ∩ B| / |A| ; b is the reference
  if (!a.size) return 0; let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / a.size;
}

export function tfidfCosine(tokensA, tokensB) {
  const df = new Map(); const docs = [tokensA, tokensB];
  for (const d of docs) { const seen = new Set(d.map(t => t.word)); for (const w of seen) df.set(w, (df.get(w) || 0) + 1); }
  // Smoothed IDF log(1 + N/df): identical documents must score 1, not 0
  // (plain log(N/df) gives IDF 0 for every word shared by both documents).
  const vec = (d) => { const tf = new Map(); for (const t of d) tf.set(t.word, (tf.get(t.word) || 0) + 1); const v = new Map(); for (const [w, c] of tf) v.set(w, c * Math.log(1 + 2 / df.get(w))); return v; };
  const va = vec(tokensA), vb = vec(tokensB);
  let dot = 0, na = 0, nb = 0;
  for (const [w, x] of va) { na += x * x; if (vb.has(w)) dot += x * vb.get(w); }
  for (const x of vb.values()) nb += x * x;
  if (!na || !nb) return 0; return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---- Code tokens: keywords/operators/structure kept, identifiers -> ID, literals -> LIT.
// Renaming every variable therefore leaves the token sequence (mostly) unchanged.
const KEYWORDS = new Set('if else for while return function const let var class def import from try except finally new break continue switch case do int float string bool void public private static async await yield print'.split(' '));
export function codeTokens(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/#[^\n]*/g, ' ');
  const re = /[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|"[^"\n]*"|'[^'\n]*'|[{}()\[\];,.+\-*\/%=<>!&|:]+/g;
  const out = []; let m;
  while ((m = re.exec(stripped)) !== null) {
    const raw = m[0];
    let norm;
    if (KEYWORDS.has(raw)) norm = raw;
    else if (/^[A-Za-z_]/.test(raw)) norm = 'ID';
    else if (/^\d/.test(raw) || /^["']/.test(raw)) norm = 'LIT';
    else norm = raw;
    out.push({ word: norm, raw, start: m.index, end: m.index + raw.length });
  }
  return out;
}

// Merge consecutive matching shingles (in both docs) into passages.
function mergeMatches(aSh, bByKey) {
  const usedB = new Set();
  const raw = [];
  for (let i = 0; i < aSh.length; i++) {
    const hits = bByKey.get(aSh[i].key) || [];
    for (const j of hits) {
      if (usedB.has(j)) continue;
      // Extend forward while both sequences continue to match.
      let len = 0;
      while (i + len < aSh.length && j + len < (bByKey._len || 0) && aSh[i + len].key === bByKey._seq[j + len].key) len++;
      if (len > 0) { raw.push({ aStartSh: i, bStartSh: j, shingleCount: len }); usedB.add(j); }
      break;
    }
  }
  // Merge overlapping/adjacent raw matches in doc A.
  raw.sort((x, y) => x.aStartSh - y.aStartSh);
  const merged = [];
  for (const r of raw) {
    const last = merged[merged.length - 1];
    if (last && r.aStartSh <= last.aStartSh + last.shingleCount) {
      const end = Math.max(last.aStartSh + last.shingleCount, r.aStartSh + r.shingleCount);
      last.shingleCount = end - last.aStartSh;
    } else merged.push({ ...r });
  }
  return merged;
}

export function compareDocs(textA, textB, settings = {}) {
  const s = { k: 5, window: 4, minWords: 8, minChars: 40, excludeQuotes: true, excludeCitations: true, excludeBoilerplate: true, mode: 'text', stopShingles: DEFAULT_STOP_SHINGLES, ...settings };
  const stopSet = new Set((s.excludeBoilerplate ? s.stopShingles : []).map(x => x.toLowerCase()));
  const spansA = excludedSpans(textA, s), spansB = excludedSpans(textB, s);
  const tokA = s.mode === 'code' ? codeTokens(textA) : wordTokens(textA);
  const tokB = s.mode === 'code' ? codeTokens(textB) : wordTokens(textB);
  const shA = shingles(tokA, s.k, spansA, stopSet);
  const shB = shingles(tokB, s.k, spansB, stopSet);
  const setA = new Set(shA.map(x => x.key)), setB = new Set(shB.map(x => x.key));
  const winA = winnow(shA.map(x => x.hash), s.window), winB = winnow(shB.map(x => x.hash), s.window);
  const winSetA = new Set(winA.map(x => x.hash)), winSetB = new Set(winB.map(x => x.hash));
  const bByKey = new Map(); shB.forEach((x, i) => { if (!bByKey.has(x.key)) bByKey.set(x.key, []); bByKey.get(x.key).push(i); });
  bByKey._seq = shB; bByKey._len = shB.length;
  const merged = mergeMatches(shA, bByKey);
  const matches = merged.map(m => {
    const aFirst = shA[m.aStartSh], aLast = shA[m.aStartSh + m.shingleCount - 1];
    const bFirst = shB[m.bStartSh], bLast = shB[m.bStartSh + m.shingleCount - 1];
    const wordCount = m.shingleCount + s.k - 1;
    return {
      algorithm: s.mode === 'code' ? 'token shingling + winnowing (identifier-normalised)' : 'k-gram shingling + winnowing',
      aStart: aFirst.start, aEnd: aLast.end, bStart: bFirst.start, bEnd: bLast.end,
      aText: textA.slice(aFirst.start, aLast.end), bText: textB.slice(bFirst.start, bLast.end),
      charLength: aLast.end - aFirst.start, wordCount,
    };
  }).filter(m => m.wordCount >= s.minWords && m.charLength >= s.minChars);
  const longest = matches.reduce((m, x) => Math.max(m, x.charLength), 0);
  const coverage = coveredChars(matches, textA.length);
  const result = {
    version: VERSION, mode: s.mode, settings: { k: s.k, window: s.window, minWords: s.minWords, minChars: s.minChars, excludeQuotes: s.excludeQuotes, excludeCitations: s.excludeCitations, excludeBoilerplate: s.excludeBoilerplate },
    counts: { tokensA: tokA.length, tokensB: tokB.length, shinglesA: shA.length, shinglesB: shB.length, fingerprintsA: winA.length, fingerprintsB: winB.length },
    jaccard: round(jaccard(setA, setB)),
    containmentAinB: round(containment(setA, setB)),
    containmentBinA: round(containment(setB, setA)),
    winnowingOverlap: round(jaccard(winSetA, winSetB)),
    tfidfCosine: round(tfidfCosine(tokA, tokB)),
    matches, longestMatchChars: longest,
    coveredChars: coverage.chars, coveredPercent: coverage.percent,
    excluded: { docA: spansA, docB: spansB },
  };
  // Evidence band — NOT a misconduct judgement. Thresholds are visible and adjustable.
  const evidence = matches.length > 0 && longest >= s.minChars;
  result.evidenceBand = !evidence ? 'inconclusive' : longest >= 200 || result.jaccard >= 0.5 ? 'high' : longest >= 80 || result.jaccard >= 0.2 ? 'medium' : 'low';
  // Flagging rule (changed 2026-10-24 after the first 20-pair run, see
  // accuracy.html): a single short passage is NOT enough to flag, even if
  // it covers a short document. Flag only if there are at least 2 distinct
  // matches, OR one match of at least 150 characters, OR at least 90 matched
  // characters covering at least half of Document A. 90 characters is about
  // 15 words — one ordinary sentence. This is a principled floor, not a
  // dataset-tuned constant: the held-out set in tests/heldout.mjs was
  // written after this rule was fixed and was not used to choose it.
  const totalMatched = matches.reduce((sum, m) => sum + m.charLength, 0);
  result.flaggedForReview = evidence && (matches.length >= 2 || longest >= 150 || (totalMatched >= 90 && coverage.percent >= 0.5));
  result.plainLanguage = evidence
    ? 'Shared passages were found. This can also happen with a shared template, standard terminology, a properly cited quote that was not excluded, or two writers describing the same procedure. Check the highlighted passages, not just the score.'
    : 'No passage met the minimum-evidence threshold. That does not prove two texts are unrelated — short, heavily reworded, or translated overlap can fall below it.';
  return result;
}
function round(x) { return Math.round(x * 10000) / 10000; }

// Matched-character coverage: union of matched intervals in Document A.
// This is a reproducible, auditable percentage — the share of A's characters
// covered by at least one matched passage. It is NOT a misconduct score and
// NOT an AI-authorship percentage. Two different tools can legitimately give
// different coverage figures for the same pair because k, window, exclusions,
// and the reference set differ; the report records all of them.
export function coveredChars(matches, textLength) {
  if (!textLength) return { chars: 0, percent: 0 };
  const iv = matches.map(m => [m.aStart, m.aEnd]).sort((a, b) => a[0] - b[0]);
  let chars = 0, cur = null;
  for (const [s, e] of iv) {
    if (!cur) { cur = [s, e]; continue; }
    if (s <= cur[1]) cur[1] = Math.max(cur[1], e);
    else { chars += cur[1] - cur[0]; cur = [s, e]; }
  }
  if (cur) chars += cur[1] - cur[0];
  return { chars, percent: round(chars / textLength) };
}

// Per-source comparison. `sources` is [{name, text}]; `excludedNames` is a
// Set of source names the reviewer removed from this run. Removed sources
// are reported separately (see app.js) so a recalculation never silently
// hides the original comparison.
export function compareAgainstCorpus(textA, sources, settings = {}, excludedNames = new Set()) {
  const perSource = [];
  for (const src of sources) {
    if (!src.text) continue;
    const r = compareDocs(textA, src.text, settings);
    const cov = coveredChars(r.matches, textA.length);
    perSource.push({
      source: src.name, url: src.url || '', included: !excludedNames.has(src.name),
      jaccard: r.jaccard, containmentAinB: r.containmentAinB, tfidfCosine: r.tfidfCosine,
      longestMatchChars: r.longestMatchChars, matchCount: r.matches.length,
      coveredChars: cov.chars, coveredPercent: cov.percent, evidenceBand: r.evidenceBand,
      flaggedForReview: r.flaggedForReview,
      matches: r.matches,
    });
  }
  const included = perSource.filter(p => p.included);
  const unionMatches = included.flatMap(p => p.matches);
  const union = coveredChars(unionMatches, textA.length);
  return { perSource, unionCoveredChars: union.chars, unionCoveredPercent: union.percent, includedCount: included.length, excludedCount: perSource.length - included.length };
}
