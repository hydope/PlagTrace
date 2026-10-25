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
const STOPWORDS = new Set('the and for with that this from have were which their will would should there about into through during before after above below between under again further then once here when where why how all any both each few more most other some such only own same than too very can just don should now also one two first second third new old good bad great well much many made make take takes taken part parts way ways use used using based upon per via etc'.split(' '));
export function searchPhrases(text, maxPhrases = 3) {
  // Cut the References/Bibliography section: searching reference lines
  // finds the cited papers' titles, not the student's own prose.
  let body = text;
  const refMatch = body.match(/(^|\n)\s*(References|Bibliography|Works Cited)\s*(\n|$)/i);
  if (refMatch) body = body.slice(0, refMatch.index);
  // Split by paragraph first, so a heading or title line (no sentence
  // punctuation) does not merge with the next paragraph into a fake
  // "sentence". Headings, title pages, author/university lines are dropped.
  const sentences = [];
  for (const para of body.split(/\n\s*\n/)) {
    const p = para.replace(/\s+/g, ' ').trim();
    if (!p) continue;
    if (!/[.!?]/.test(p) && p.length < 200) continue;
    for (const s of p.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 40)) sentences.push(s);
  }
  if (!sentences.length) return [];
  // Score by distinctiveness, not by length: a sentence is a good search
  // query if it contains content words that appear in few other sentences
  // in this document. Generic academic filler ("business leaders should",
  // "companies must also") repeats everywhere and scores low; a sentence
  // naming a specific author, theory, or study scores high. Citation
  // sentences get a bonus: they point at the work most likely to be a source.
  const sentWords = sentences.map(s => {
    const words = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w));
    return [...new Set(words)];
  });
  const df = new Map();
  for (const words of sentWords) for (const w of words) df.set(w, (df.get(w) || 0) + 1);
  const scored = sentences.map((s, i) => {
    const rare = sentWords[i].filter(w => df.get(w) <= 2).length;
    const longWords = s.split(' ').filter(w => w.replace(/[^A-Za-z]/g, '').length >= 7).length;
    const citation = /\(\s*(19|20)\d\d/.test(s) ? 10 : 0;
    return { sentence: s, score: rare * 3 + longWords + citation };
  }).sort((a, b) => b.score - a.score);
  const out = [];
  for (const s of scored) {
    let words = s.sentence.split(' ');
    // Strip a citation lead-in ("Widyaningsih et al. (2026) explore ...")
    // so the search phrase starts with content words, not an author/year.
    if (words[1] && words[1].toLowerCase().replace(/[^a-z]/g, '') === 'et') words = words.slice(4);
    while (words.length && (/^(19|20)\d\d$/.test(words[0].replace(/[^0-9]/g, '')) || words[0].toLowerCase().replace(/[^a-z]/g, '') === 'et' || words[0].toLowerCase().replace(/[^a-z]/g, '') === 'al')) words = words.slice(1);
    const q = words.slice(0, 12).join(' ').replace(/[^\w\s-]/g, '');
    if (q && !out.includes(q)) out.push(q);
    if (out.length >= maxPhrases) break;
  }
  return out;
}
// References section, parsed for the NOT-CHECKED list. Evidence only:
// each entry is a line from the document's own References section that
// contains a year; no source is claimed checked unless its full text was
// actually compared. Returns [] when there is no References section.
export function extractReferences(text) {
  const m = text.match(/\n\s*(References|Bibliography|Works Cited)\s*\n/i);
  if (!m) return [];
  const tail = text.slice(m.index + m[0].length);
  const entries = [];
  for (const line of tail.split(/\n+/)) {
    const t = line.replace(/\s+/g, ' ').trim();
    if (t.length >= 30 && /\b(19|20)\d\d\b/.test(t)) entries.push(t.slice(0, 220));
    if (entries.length >= 50) break;
  }
  return entries;
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
export function invertAbstract(idx) {
  if (!idx) return '';
  const words = [];
  for (const [w, pos] of Object.entries(idx)) for (const p of pos) words[p] = w;
  return words.filter(Boolean).join(' ');
}
async function doajSearch(phrase) {
  // DOAJ treats a long phrase as AND of all terms and returns nothing;
  // use the first 6 words so a real academic abstract can actually match.
  const q = phrase.split(' ').slice(0, 6).join(' ');
  const r = await fetch(`https://doaj.org/api/search/articles/${encodeURIComponent(q)}?pageSize=3`);
  if (!r.ok) throw new Error(`DOAJ HTTP ${r.status}`);
  const j = await r.json();
  return (j.results || []).filter(x => x.bibjson?.abstract).map(x => {
    const fulltext = (x.bibjson.link || []).find(l => l.type === 'fulltext')?.url || '';
    const doi = (x.bibjson.identifier || []).find(i => i.type === 'DOI')?.id || '';
    return { name: `DOAJ: ${x.bibjson.title || 'Untitled'}`, text: `${x.bibjson.title || ''}. ${x.bibjson.abstract}`, url: fulltext || (doi ? `https://doi.org/${doi}` : ''), included: true };
  });
}
async function openAlexSearch(phrase) {
  const q = phrase.split(' ').slice(0, 6).join(' ');
  const r = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=3`);
  if (r.status === 429) throw new Error('OpenAlex rate-limited (HTTP 429) from this network without an API key');
  if (!r.ok) throw new Error(`OpenAlex HTTP ${r.status}`);
  const j = await r.json();
  return (j.results || []).filter(x => x.abstract_inverted_index).map(x => ({ name: `OpenAlex: ${x.title || 'Untitled'}`, text: `${x.title || ''}. ${invertAbstract(x.abstract_inverted_index)}`, url: x.doi || x.id || '', included: true }));
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
  // DOAJ (open-access journals, abstracts, CORS *) — best effort, like the others.
  for (const phrase of phrases) {
    if (sources.length >= 12) break;
    try {
      for (const src of await doajSearch(phrase)) { if (sources.length < 12 && !sources.some(x => x.name === src.name)) sources.push(src); }
    } catch (e) { errors.push(`DOAJ search failed for "${phrase}": ${e.message} — skipped, not a "no match".`); break; }
  }
  // OpenAlex (inverted-index abstracts, CORS *) — best effort, rate-limited without a key.
  for (const phrase of phrases) {
    if (sources.length >= 12) break;
    try {
      for (const src of await openAlexSearch(phrase)) { if (sources.length < 12 && !sources.some(x => x.name === src.name)) sources.push(src); }
    } catch (e) { errors.push(`OpenAlex: ${e.message} — skipped, not a "no match".`); break; }
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

// Unpaywall DOI lookup: returns open-access locations, NOT text to compare.
// Requires a real email address (Unpaywall's rule); without one it returns
// an error, never a silent empty result. Each entry is {doi, url, note}.
export async function findOpenCopies(text, email) {
  if (!email || !email.includes('@') || email.endsWith('@example.com')) throw new Error('Enter a real email address for Unpaywall — it requires one, and example.com addresses are rejected.');
  const dois = [...new Set([...text.matchAll(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi)].map(m => m[0].replace(/[.,;]+$/, '')))].slice(0, 20);
  const out = [];
  for (const doi of dois) {
    try {
      const r = await fetch(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`);
      if (!r.ok) { out.push({ doi, url: '', note: `Unpaywall HTTP ${r.status}` }); continue; }
      const j = await r.json();
      const loc = j.best_oa_location;
      out.push({ doi, url: loc?.url_for_pdf || loc?.url || '', note: loc ? (j.is_oa ? 'Open-access copy found' : 'Location found, access unclear') : 'No open-access copy found' });
    } catch (e) { out.push({ doi, url: '', note: `Lookup failed: ${e.message}` }); }
  }
  return out;
}

// Check cited sources by DOI: for each DOI in the document, fetch its
// abstract via OpenAlex (works endpoint, CORS *, verified 12/12 for the
// real paper on 2026-10-25) with a DOAJ fallback. Returns sources to
// compare locally PLUS a per-DOI status list, so a failed fetch is never
// reported as "no match" and never as 0%. Abstracts only — full text is
// behind publisher paywalls / CORS blocks in a browser, and that limit is
// stated per source, not hidden.
export async function fetchCitedSources(text) {
  const dois = [...new Set([...text.matchAll(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi)].map(m => m[0].replace(/[.,;]+$/, '')))].slice(0, 30);
  const sources = [], statuses = [];
  for (const doi of dois) {
    let got = false;
    try {
      const r = await fetch(`https://api.openalex.org/works/https://doi.org/${doi}`);
      if (r.ok) {
        const j = await r.json();
        if (j.abstract_inverted_index) {
          sources.push({ name: `Cited: ${j.title || doi}`, text: `${j.title || ''}. ${invertAbstract(j.abstract_inverted_index)}`, url: `https://doi.org/${doi}`, included: true });
          statuses.push({ doi, title: j.title || '', status: 'Abstract fetched via OpenAlex' }); got = true;
        }
      } else statuses.push({ doi, title: '', status: `OpenAlex HTTP ${r.status}` });
    } catch (e) { statuses.push({ doi, title: '', status: `OpenAlex fetch failed: ${e.message}` }); }
    if (got) continue;
    try {
      const r = await fetch(`https://doaj.org/api/search/articles/doi:${encodeURIComponent(doi)}`);
      if (r.ok) {
        const j = await r.json();
        const hit = (j.results || []).find(x => x.bibjson?.abstract);
        if (hit) {
          const fulltext = (hit.bibjson.link || []).find(l => l.type === 'fulltext')?.url || '';
          sources.push({ name: `Cited: ${hit.bibjson.title || doi}`, text: `${hit.bibjson.title || ''}. ${hit.bibjson.abstract}`, url: fulltext || `https://doi.org/${doi}`, included: true });
          statuses.push({ doi, title: hit.bibjson.title || '', status: 'Abstract fetched via DOAJ' }); got = true;
        }
      }
    } catch (e) { /* DOAJ fallback failure is already covered by the OpenAlex status */ }
    if (!got) statuses.push({ doi, title: '', status: 'No abstract fetched — full text not accessible from a browser (publisher / CORS / paywall). Upload the full text to check it.' });
  }
  return { sources, statuses, dois };
}
