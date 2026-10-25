import { compareDocs, compareAgainstCorpus, matchedWords, DEFAULT_STOP_SHINGLES } from './sim.js';
import { extractText } from './files.js';
import { fetchInternetSources } from './internet.js';
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => (x * 100).toFixed(1) + '%';
function highlight(text, ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start); let out = '', pos = 0;
  for (const r of sorted) { if (r.start < pos) continue; out += esc(text.slice(pos, r.start)) + '<mark>' + esc(text.slice(r.start, r.end)) + '</mark>'; pos = r.end; }
  return out + esc(text.slice(pos));
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function counts(text) { const w = text.trim() ? text.trim().split(/\s+/).length : 0; return `${w} words · ${text.length} characters`; }
function updateCounts() { $('countA').textContent = counts($('docA').value); $('countB').textContent = counts($('docB').value); }
let corpus = [];
let removedNames = [];
let savedDecisions = {};
function markStale() { const n = $('staleNote'); if (n && $('results').innerHTML.trim()) n.textContent = '⚠ These results are for the previous documents or settings — re-run to update them.'; }
function clearStale() { const n = $('staleNote'); if (n) n.textContent = ''; }
function captureDecisions() { document.querySelectorAll('.review').forEach(s => { if (s.value !== 'unreviewed' && s.dataset.key) savedDecisions[s.dataset.key] = s.value; }); }
$('docA').oninput = () => { updateCounts(); markStale(); }; $('docB').oninput = () => { updateCounts(); markStale(); };
function renderCorpus() {
  $('corpusList').innerHTML = corpus.length ? corpus.map((c, i) => `<li><label><input type="checkbox" data-i="${i}" ${c.included ? 'checked' : ''}> ${esc(c.name)}</label> ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">open source ↗</a>` : ''} <button type="button" data-rm="${i}">Remove source</button></li>`).join('') : '<li>No reference sources loaded.</li>';
  $('corpusList').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const nm = corpus[+b.dataset.rm].name; if (!removedNames.includes(nm)) removedNames.push(nm); corpus.splice(+b.dataset.rm, 1); renderCorpus(); markStale(); });
  $('corpusList').querySelectorAll('[data-i]').forEach(b => b.onchange = () => { corpus[+b.dataset.i].included = b.checked; markStale(); });
}
async function loadFile(f, target, nameEl) {
  try { const t = await extractText(f); if (target) $(target).value = t; if (nameEl) $(nameEl).textContent = `Loaded: ${f.name}`; updateCounts(); markStale(); }
  catch (e) { alert(f.name + ': ' + e.message); }
}
function wireDrop(zoneId, onFiles) {
  const z = $(zoneId);
  z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const inp = z.querySelector('input[type="file"]'); if (inp) inp.click(); } });
  ['dragover', 'dragenter'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('drag'); }));
  z.addEventListener('drop', e => onFiles([...e.dataTransfer.files]));
}
wireDrop('dropA', fs => fs[0] && loadFile(fs[0], 'docA', 'fileAName'));
wireDrop('dropB', fs => fs[0] && loadFile(fs[0], 'docB', 'fileBName'));
wireDrop('dropCorpus', async fs => { for (const f of fs) { try { corpus.push({ name: f.name, text: await extractText(f), included: true }); } catch (e) { alert(f.name + ': ' + e.message); } } renderCorpus(); });
async function pasteInto(target) {
  try { const t = await navigator.clipboard.readText(); if (t) { $(target).value = t; updateCounts(); markStale(); } else alert('Clipboard is empty or permission was denied. Paste with Ctrl+V / Cmd+V instead.'); }
  catch { alert('Clipboard access was denied by the browser. Paste with Ctrl+V / Cmd+V instead.'); }
}
$('pasteA').onclick = () => pasteInto('docA');
$('pasteB').onclick = () => pasteInto('docB');
$('fileA').onchange = e => e.target.files[0] && loadFile(e.target.files[0], 'docA', 'fileAName');
$('fileB').onchange = e => e.target.files[0] && loadFile(e.target.files[0], 'docB', 'fileBName');
$('corpus').onchange = async e => { for (const f of e.target.files) { try { corpus.push({ name: f.name, text: await extractText(f), included: true }); } catch (err) { alert(f.name + ': ' + err.message); } } renderCorpus(); markStale(); };
async function run() {
  captureDecisions();
  const a = $('docA').value, b = $('docB').value;
  const hasB = b.trim().length >= 20;
  const hasCorpus = corpus.some(c => c.included);
  if (a.trim().length < 20 || (!hasB && !hasCorpus)) { $('results').innerHTML = '<p role="alert">Paste at least 20 characters in Document A, plus either a Document B or reference / internet sources.</p>'; return; }
  clearStale();
  const runBtn = $('run'); const oldRunText = runBtn.textContent; runBtn.disabled = true; runBtn.textContent = 'Checking…';
  const settings = { k: +$('k').value, window: +$('win').value, minWords: +$('minWords').value, mode: $('mode').value, excludeQuotes: $('exQuotes').checked, excludeCitations: $('exCite').checked, excludeBoilerplate: $('exBoiler').checked, stopShingles: $('stopList').value.split('\n').map(x => x.trim().toLowerCase()).filter(Boolean) };
  const main = hasB ? compareDocs(a, b, settings) : null;
  const excludedNames = new Set(corpus.filter(c => !c.included).map(c => c.name));
  const corp = compareAgainstCorpus(a, corpus, settings, excludedNames);
  const mainWords = main ? matchedWords(a, main.matches) : 0;
  const report = { tool: 'PlagTrace', version: '0.6.2', generatedAt: new Date().toISOString(), settings, scope: hasB ? 'Document A vs Document B + supplied / internet sources. Internet sources are Wikipedia + Semantic Scholar only, not the whole web.' : 'Document A vs supplied / internet sources only (no Document B). Internet sources are Wikipedia + Semantic Scholar only, not the whole web.', inputHashes: { docA: await sha256(a), docB: hasB ? await sha256(b) : null }, mainPair: main, corpus: corp, removedSources: [...new Set([...removedNames, ...corpus.filter(c => !c.included).map(c => c.name)])], removedSourcesNote: 'Fully removed this session plus sources unticked for this run. Removal recalculates scores; it does not hide history.', reviewerDecisions: null };
  const r = main;
  const allMatches = main ? main.matches : corp.perSource.flatMap(p => p.matches);
  const allExcluded = main ? [...main.excluded.docA, ...main.excluded.docB] : [];
  const sourceCards = corp.perSource.map((p, i) => {
    const words = matchedWords(a, p.matches);
    return `<article class="sourcecard"><h4>[${i + 1}] ${esc(p.source)}</h4>
    <p><strong>${pct(p.coveredPercent)}</strong> of Document A covered · <strong>${words} words matched</strong> · ${p.matchCount} passage(s) · longest ${p.longestMatchChars} chars · band <span class="band-${p.evidenceBand}">${p.evidenceBand}</span> · ${p.flaggedForReview ? '<strong>Flagged for review</strong>' : 'Shown for context — not flagged (a single short passage alone is not enough)'} · ${p.included ? 'included' : 'removed from this run'}</p>
    ${p.matches.slice(0, 3).map(m => `<p>“${esc(m.aText.slice(0, 200))}” <button type="button" class="copycite" data-src="${i}" data-a="${m.aStart}" data-b="${m.aEnd}">Copy citation note</button></p>`).join('') || '<p>No passage met the threshold for this source.</p>'}</article>`;
  }).join('');
  $('results').innerHTML = `
  <div class="banner" role="note">This is a screening aid. Only a human reviewer may decide misconduct, after giving the student a chance to respond.</div>
  <h2>Results — ${main ? 'Document A vs Document B' : 'Document A vs reference / internet sources (no Document B)'}</h2>
  ${main ? `<div class="ring"><div><div class="ringnum">${pct(r.coveredPercent)}</div><div>matched-character coverage of Document A</div></div>
  <div><strong>${mainWords} words matched</strong> · ${r.matches.length} passage(s) · longest ${r.longestMatchChars} chars · band <span class="band-${r.evidenceBand}">${r.evidenceBand}</span> · ${r.flaggedForReview ? '<strong>Flagged for review</strong>' : '<strong>Not flagged for review</strong> — passages shown for context only'}</div></div>
  <p><strong>Read this before the number:</strong> ${pct(r.coveredPercent)} is the share of Document A covered by matched passages <em>under the settings above, against the documents you supplied</em>. It is not a misconduct score, not an AI-authorship percentage, and not a web-wide result. Wording like "no plagiarism found" is deliberately not used here: this tool can only say "no passage met the threshold in the supplied documents".</p>
  <dl class="scores"><div><dt>Jaccard (shingles)</dt><dd>${r.jaccard}</dd></div><div><dt>Containment A in B</dt><dd>${r.containmentAinB}</dd></div><div><dt>Containment B in A</dt><dd>${r.containmentBinA}</dd></div><div><dt>Winnowing overlap</dt><dd>${r.winnowingOverlap}</dd></div><div><dt>TF-IDF cosine</dt><dd>${r.tfidfCosine}</dd></div></dl>
  <p class="gloss"><strong>What these numbers mean, in plain words:</strong> Jaccard = the share of word-chunks common to both documents. Containment = the share of one document's chunks found in the other. Winnowing overlap = the share of fingerprints (a shortlist of chunks) that match. TF-IDF cosine = similarity weighted by how distinctive each word is. Band is <em>not</em> a judgement: high means the longest match is at least 200 characters or Jaccard is at least 0.5; medium means longest at least 80 characters or Jaccard at least 0.2; low means some overlap below that; inconclusive means no passage met the threshold. A high band is still not guilt.</p>
  <p>${esc(r.plainLanguage)}</p>` : `<div class="warn" role="alert"><strong>Do not submit based on this result alone.</strong> ${corp.unionCoveredPercent === 0 ? 'A 0% here does NOT mean your paper is clean. ' : ''}This check searched Wikipedia (and, when available, Semantic Scholar abstracts) only. It did NOT check journal articles, books, publisher databases, or other students' work — the sources university checkers use. A paper can score 0% here and still match a journal article. Check your cited sources yourself, and never treat this as a Turnitin result.</div><p>No Document B was supplied, so no A-vs-B score is shown. The per-source cards below — including any Wikipedia / Semantic Scholar sources fetched above — are the result. Union coverage across those sources: <strong>${pct(corp.unionCoveredPercent)}</strong>.</p>`}
  <h3>Sources — one card per source</h3>
  ${sourceCards || '<p>No reference sources loaded. Add files above to get per-source cards.</p>'}
  <p>Union coverage across included sources: <strong>${pct(corp.unionCoveredPercent)}</strong>. Removed sources (fully removed this session or unticked for this run — removal recalculates, it does not hide history): ${report.removedSources.length ? report.removedSources.map(esc).join(', ') : 'none'}.</p>
  <h3>Excluded from scoring</h3><ul>${allExcluded.map(s => `<li>${esc(s.reason)} — ${esc(s.text)}</li>`).join('') || '<li>None</li>'}</ul>
  <h3>Matched passages — human review (required before any decision)</h3>
  ${allMatches.length ? `<p>Until a reviewer records a decision, every match stays <strong>unreviewed</strong>. Decisions are stored in the exported JSON only; they never change the measured evidence. Decisions you recorded before a re-scan are kept for matches that still exist.</p>` : `<p>No matches to review.</p>`}
  ${allMatches.length ? allMatches.map((m, i) => `<details open><summary>Match ${i + 1} — ${m.charLength} chars, ${m.wordCount} words · ${esc(m.algorithm)}</summary><p>A [${m.aStart}–${m.aEnd}]: ${esc(m.aText)}</p>${main ? `<p>B [${m.bStart}–${m.bEnd}]: ${esc(m.bText)}</p>` : `<p>Source passage: ${esc(m.bText)}</p>`}<label>Reviewer decision <select class="review" data-i="${i}" data-key="${m.aStart}:${m.aEnd}"><option value="unreviewed">Unreviewed</option><option value="properly cited quote">Properly cited quote</option><option value="proper paraphrase with citation">Proper paraphrase with citation</option><option value="template / standard wording">Template / standard wording</option><option value="common knowledge / terminology">Common knowledge / terminology</option><option value="needs author response">Needs author response</option><option value="concerning — refer for human judgement">Concerning — refer for human judgement</option></select></label></details>`).join('') : '<p>No passage met the minimum-evidence threshold. Label: inconclusive.</p>'}
  <h3>How to fix a match properly (not how to hide it)</h3>
  <ul><li><strong>Verbatim words:</strong> quotation marks + citation.</li><li><strong>Someone else's idea in your words:</strong> genuine rewrite + still cite the source.</li><li><strong>Your own earlier work:</strong> cite it, or get your institution's reuse rule in writing.</li><li><strong>Do not</strong> use a paraphraser or "humanizer" to make a match disappear. That hides evidence without adding attribution.</li></ul>
  <div class="side"><section><h3>Document A (highlighted)</h3><p>${highlight(a, allMatches.map(m => ({ start: m.aStart, end: m.aEnd })))}</p></section>
  ${main ? `<section><h3>Document B (highlighted)</h3><p>${highlight(b, main.matches.map(m => ({ start: m.bStart, end: m.bEnd })))}</p></section>` : ""}</div>
  <p><button id="rescan" type="button">Re-scan with current settings</button> <button id="dlJson" type="button">Download JSON report</button> <button id="dlPrint" type="button">Print / save as PDF</button></p>`;
  let kept = 0; document.querySelectorAll('.review').forEach(s => { if (savedDecisions[s.dataset.key]) { s.value = savedDecisions[s.dataset.key]; kept++; } });
  if (kept) $('results').insertAdjacentHTML('afterbegin', `<p class="keptnote">${kept} reviewer decision(s) kept from the previous run for matches that still exist.</p>`);
  runBtn.disabled = false; runBtn.textContent = oldRunText;
  $('results').scrollIntoView({ behavior: 'smooth' });
  $('rescan').onclick = run;
  document.querySelectorAll('.copycite').forEach(btn => btn.onclick = async () => {
    const p = corp.perSource[+btn.dataset.src]; const m = p.matches.find(x => String(x.aStart) === btn.dataset.a && String(x.aEnd) === btn.dataset.b) || p.matches[0];
    const note = `Source: ${p.source}\nMatched passage in Document A (chars ${m.aStart}–${m.aEnd}): "${m.aText}"\nPlagTrace note: add the full bibliographic citation for this source yourself — this note records where the match was found, it does not invent an author or title.`;
    try { await navigator.clipboard.writeText(note); btn.textContent = 'Copied'; } catch { alert(note); }
  });
  const collect = () => [...document.querySelectorAll('.review')].map(s => s.value);
  $('dlJson').onclick = () => { report.reviewerDecisions = collect(); report.reviewerDecisionsComplete = report.reviewerDecisions.length > 0 && report.reviewerDecisions.every(v => v !== 'unreviewed'); report.reviewerDecisionsNote = report.reviewerDecisions.length === 0 ? 'No matches to review' : (report.reviewerDecisionsComplete ? 'All matches reviewed' : 'Some matches still unreviewed'); const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'plagtrace-report.json'; aEl.click(); };
  $('dlPrint').onclick = () => window.print();
}
$('netSearch').onclick = async () => {
  const a = $('docA').value;
  if (a.trim().length < 40) { $('netStatus').innerHTML = '<p role="alert">Paste at least 40 characters in Document A first — internet search needs a real sentence to search for.</p>'; return; }
  $('netSearch').disabled = true; $('netSearch').textContent = 'Searching…';
  try {
    const { sources, errors, phrases } = await fetchInternetSources(a);
    for (const s of sources) if (!corpus.some(c => c.name === s.name)) { corpus.push(s); removedNames = removedNames.filter(n => n !== s.name); }
    renderCorpus();
    $('netStatus').innerHTML = `<p>Searched phrases (these exact phrases were sent to Wikipedia / Semantic Scholar): ${phrases.map(p => `"${esc(p)}"`).join(', ') || 'none'}</p><p>Internet sources added: ${sources.length}. ${errors.length ? 'Notes: ' + errors.map(esc).join(' ') : ''}</p><p>Results below already include these sources — re-run only if you change the documents or settings.</p>`;
    if (sources.length) await run();
  } catch (e) { $('netStatus').innerHTML = `<p role="alert">Internet search failed: ${esc(e.message)}. Local check still works — this failure is not a "no match".</p>`; }
  $('netSearch').disabled = false; $('netSearch').textContent = 'Search internet sources';
};
$('run').onclick = run;
$('stopList').value = DEFAULT_STOP_SHINGLES.join('\n');
function updateSettingsBadge() {
  let changed = 0;
  if ($('mode').value !== 'text') changed++;
  if (+$('k').value !== 5) changed++;
  if (+$('win').value !== 4) changed++;
  if (+$('minWords').value !== 8) changed++;
  if (!$('exQuotes').checked) changed++;
  if (!$('exCite').checked) changed++;
  if (!$('exBoiler').checked) changed++;
  if ($('stopList').value !== DEFAULT_STOP_SHINGLES.join('\n')) changed++;
  const b = $('settingsBadge'); if (b) b.textContent = changed === 0 ? 'Defaults' : `${changed} setting(s) changed`;
}
['mode', 'k', 'win', 'minWords', 'exQuotes', 'exCite', 'exBoiler', 'stopList'].forEach(id => $(id).addEventListener('input', () => { updateSettingsBadge(); markStale(); }));
$('resetSettings').onclick = () => { $('mode').value = 'text'; $('k').value = 5; $('win').value = 4; $('minWords').value = 8; $('exQuotes').checked = true; $('exCite').checked = true; $('exBoiler').checked = true; $('stopList').value = DEFAULT_STOP_SHINGLES.join('\n'); updateSettingsBadge(); markStale(); };
updateSettingsBadge();
async function loadDemoAndRun() {
  try { $('docA').value = await (await fetch('demo/sample-a.txt')).text(); $('docB').value = await (await fetch('demo/sample-b.txt')).text(); updateCounts(); await run(); document.getElementById('results').scrollIntoView({ behavior: 'smooth' }); } catch { alert('Demo files could not be loaded.'); }
}
$('loadDemo').onclick = async () => { try { $('docA').value = await (await fetch('demo/sample-a.txt')).text(); $('docB').value = await (await fetch('demo/sample-b.txt')).text(); updateCounts(); } catch { alert('Demo files could not be loaded.'); } };
$('trySample').onclick = loadDemoAndRun;
updateCounts(); renderCorpus();
