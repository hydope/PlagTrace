// Local file text extraction. Everything runs in the browser; nothing is uploaded.
// .docx: ZIP central-directory reader -> word/document.xml -> paragraph text.
//   Why central directory, not local headers: real Word/Pages/streaming ZIP
//   writers often set the data-descriptor flag (bit 3), which leaves the
//   compressed size as 0 in the local header. Scanning local headers then
//   jumps to the wrong offset and reports "could not find document.xml"
//   for a perfectly valid file. The central directory (at the end of the
//   ZIP) always holds the true sizes and offsets, so it is authoritative.
// .pdf: best-effort extraction of Tj/TJ text operators from uncompressed and
// FlateDecode streams. Scanned-image and encrypted PDFs are NOT readable here —
// that limitation is documented in limitations.html, not hidden.
export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return extractDocx(file);
  if (name.endsWith('.pdf')) return extractPdf(file);
  return file.text();
}
async function inflate(data, raw) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream(raw ? 'deflate-raw' : 'deflate'));
  return new Response(stream).text();
}
async function decompress(data, method) {
  if (method === 0) return new TextDecoder().decode(data);
  if (method === 8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This .docx uses deflate compression, which this browser cannot decompress.');
    try { return await inflate(data, true); } catch { return await inflate(data, false); }
  }
  throw new Error('This .docx uses an unsupported compression method.');
}
function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}
export function docxXmlToText(xml) {
  // Paragraph-aware: Word splits a word across runs (e.g. a bold half-word),
  // so runs inside one paragraph join with NO space; paragraphs join with a
  // blank line. Joining every run with a space would corrupt word tokens.
  const paras = xml.split(/<\/w:p>/i);
  const out = [];
  for (const para of paras) {
    const runs = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => unescapeXml(m[1]));
    const text = runs.join('').replace(/ /g, ' ').trim();
    if (text) out.push(text);
  }
  return out.join('\n\n');
}
async function extractDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u32 = off => view.getUint32(off, true);
  const u16 = off => view.getUint16(off, true);
  const findEntry = async () => {
    // End Of Central Directory: search the last 64KB + 22 bytes for 0x06054b50.
    const tailStart = Math.max(0, buf.length - 65557);
    for (let i = buf.length - 22; i >= tailStart; i--) {
      if (u32(i) !== 0x06054b50) continue;
      const cdCount = u16(i + 10);
      const cdSize = u32(i + 12);
      const cdOff = u32(i + 16);
      if (cdOff + cdSize > buf.length || cdCount === 0) continue;
      let p = cdOff;
      for (let n = 0; n < cdCount; n++) {
        if (u32(p) !== 0x02014b50) break;
        const method = u16(p + 10);
        const compSize = u32(p + 20);
        const nameLen = u16(p + 28);
        const extraLen = u16(p + 30);
        const commentLen = u16(p + 32);
        const localOff = u32(p + 42);
        const fname = new TextDecoder().decode(buf.slice(p + 46, p + 46 + nameLen));
        if (fname.toLowerCase() === 'word/document.xml') return { method, compSize, localOff };
        p += 46 + nameLen + extraLen + commentLen;
      }
      break;
    }
    return null;
  };
  let entry = await findEntry();
  if (entry) {
    const { method, compSize, localOff } = entry;
    if (u32(localOff) !== 0x04034b50) throw new Error('This .docx file is damaged (its document part header is unreadable). Try re-saving it, or copy-paste the text instead.');
    const nameLen = u16(localOff + 26);
    const extraLen = u16(localOff + 28);
    const dataStart = localOff + 30 + nameLen + extraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    const xml = await decompress(data, method);
    const text = docxXmlToText(xml);
    if (!text) throw new Error('This .docx contains no readable text in its main document. It may be empty, or its text may be in images.');
    return text;
  }
  // Fallback: old local-header scan, for ZIPs with a broken central directory.
  // This only works when local sizes are honest (no data descriptor).
  let off = 0;
  while (off + 30 <= buf.length) {
    if (u32(off) !== 0x04034b50) break;
    const method = u16(off + 8);
    const compSize = u32(off + 18);
    const nameLen = u16(off + 26);
    const extraLen = u16(off + 28);
    const fname = new TextDecoder().decode(buf.slice(off + 30, off + 30 + nameLen));
    const dataStart = off + 30 + nameLen + extraLen;
    if (fname.toLowerCase() === 'word/document.xml') {
      const xml = await decompress(buf.slice(dataStart, dataStart + compSize), method);
      const text = docxXmlToText(xml);
      if (!text) throw new Error('This .docx contains no readable text in its main document.');
      return text;
    }
    if (compSize === 0) break; // data descriptor: local size is unknown, do not guess
    off = dataStart + compSize;
  }
  throw new Error('Could not read word/document.xml in this .docx file. The file may be damaged, or saved in an unusual format. Workaround: open it and copy-paste the text, or save it as .txt and upload that. Nothing was uploaded.');
}
async function extractPdf(file) {
  const raw = await file.arrayBuffer();
  let text = new TextDecoder('latin1').decode(raw);
  // Try to inflate FlateDecode streams so their Tj operators become visible.
  if (typeof DecompressionStream !== 'undefined') {
    const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g; let m; const parts = [];
    while ((m = re.exec(text)) !== null) {
      try {
        const bytes = new Uint8Array([...m[1]].map(c => c.charCodeAt(0)));
        const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
        parts.push(await new Response(s).text());
      } catch { /* keep going; uncompressed streams are handled below */ }
    }
    if (parts.length) text += '\n' + parts.join('\n');
  }
  const out = [];
  const tj = /\((?:\\.|[^\\()])*\)\s*Tj/g; let m;
  while ((m = tj.exec(text)) !== null) out.push(m[0].slice(1, -3).replace(/\\([()\\])/g, '$1'));
  const tja = /\[((?:[^\[\]]|\[[^\]]*\])*)\]\s*TJ/g;
  while ((m = tja.exec(text)) !== null) {
    const inner = [...m[1].matchAll(/\((?:\\.|[^\\()])*\)/g)].map(x => x[0].slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
    if (inner) out.push(inner);
  }
  if (!out.length) throw new Error('No extractable text found in this PDF (it may be scanned images or encrypted).');
  return out.join(' ');
}
