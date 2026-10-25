// PlagTrace internet sources (opt-in only).
// The local check never leaves the browser. This module is the ONE exception,
// and only when the user clicks "Search internet sources":
//   * search phrases taken from Document A are sent to Wikipedia's public API
//     (CORS: Access-Control-Allow-Origin: *, verified 2026-10-24) and, best
//     effort, to Semantic Scholar (which rate-limited this shared network
//     with 429 on 2026-10-24 without a key — a 429 is reported, never read
//     as "no match").
//   * returned article text is compared LOCALLY with the existing engine.
//   * this is Wikipedia + scholarly search only. It is NOT Google, NOT the
//     whole web, NOT Turnitin's database, and NOT a publisher database.
//     A "no match" here means "no match in the Wikipedia articles fetched".
export function searchPhrases(text, maxPhrases = 3) {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length >= 40);
  const scored = sentences.map(s => {
    const words = s.split(' ').filter(Boolean);
    const longWords = words.filter(w => w.replace(/[^A-Za-z]/g, '').length >= 7).length;
    return { sentence: s, score: longWords * 2 + Math.min(words.length, 25) };
  }).sort((a, b) => b.score - a.score);
  const out = [];
  for (const s of scored) {
    const q = s.sentence.split(' ').slice(0, 12).join(' ').replace(/[^\w\s-]/g, '');
    if (q && !out.includes(q)) out.push(q);
    if (out.length >= maxPhrases) break;
  }
  return out;
}
const WIKI = 'https://en.wikipedia.org/w/api.php';
async function wikiSearch(phrase) {
  const r = await fetch(`${WIKI}?action=query&list=search&srsearch=${encodeURIComponent(phrase)}&srlimit=3&format=json&origin=*`);
  if (!r.ok) throw new Error(`Wikipedia search HTTP ${r.status}`);
  const j = await r.json();
  return (j.query?.search || []).map(s => s.title);
}
async function wikiExtract(title) {
  const r = await fetch(`${WIKI}?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(title)}&format=json&origin=*`);
  if (!r.ok) throw new Error(`Wikipedia extract HTTP ${r.status}`);
  const j = await r.json();
  const pages = j.query?.pages || {};
  const p = Object.values(pages)[0];
  return p?.extract ? p.extract.slice(0, 20000) : '';
}
// Returns { sources: [{name, text, url}], errors: [strings] }
export async function fetchInternetSources(text) {
  const phrases = searchPhrases(text);
  const errors = [];
  const seen = new Set();
  const sources = [];
  for (const phrase of phrases) {
    let titles = [];
    try { titles = await wikiSearch(phrase); } catch (e) { errors.push(`Wikipedia search failed for "${phrase}": ${e.message}`); continue; }
    for (const title of titles) {
      if (seen.has(title) || sources.length >= 6) continue;
      seen.add(title);
      try {
        const body = await wikiExtract(title);
        if (body.length > 200) sources.push({ name: `Wikipedia: ${title}`, text: body, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, included: true });
      } catch (e) { errors.push(`Wikipedia extract failed for ${title}: ${e.message}`); }
    }
  }
  // Semantic Scholar, best effort only: a 429 / failure is an error, never a negative.
  try {
    const q = phrases[0] || '';
    if (q) {
      const r = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&fields=title,abstract,url&limit=3`);
      if (r.status === 429) errors.push('Semantic Scholar: rate-limited (HTTP 429) from this network without an API key — skipped, not a "no match".');
      else if (r.ok) {
        const j = await r.json();
        for (const p of (j.data || [])) if (p.abstract) sources.push({ name: `Semantic Scholar: ${p.title}`, text: `${p.title}. ${p.abstract}`, url: p.url || '', included: true });
      } else errors.push(`Semantic Scholar HTTP ${r.status} — skipped, not a "no match".`);
    }
  } catch (e) { errors.push(`Semantic Scholar unreachable (network or browser block, not a rate limit — the request never reached a server response): ${e.message} — skipped, not a "no match". If you see this repeatedly, try again later; Wikipedia results above are unaffected.`); }
  return { sources, errors, phrases };
}
