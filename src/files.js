// Local file text extraction. Everything runs in the browser; nothing is uploaded.
// .docx: minimal ZIP reader (stored + deflate entries) -> word/document.xml -> <w:t> text.
// .pdf: best-effort extraction of Tj/TJ text operators from uncompressed and
// FlateDecode streams. Scanned-image and encrypted PDFs are NOT readable here —
// that limitation is documented in limitations.html, not hidden.
export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return extractDocx(file);
  if (name.endsWith('.pdf')) return extractPdf(file);
  return file.text();
}
async function extractDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);
  // Scan local file headers for word/document.xml
  let off = 0;
  while (off + 30 <= buf.length) {
    if (view.getUint32(off, true) !== 0x04034b50) break;
    const method = view.getUint16(off + 8, true);
    const compSize = view.getUint32(off + 18, true);
    const nameLen = view.getUint16(off + 26, true);
    const extraLen = view.getUint16(off + 28, true);
    const fname = new TextDecoder().decode(buf.slice(off + 30, off + 30 + nameLen));
    const dataStart = off + 30 + nameLen + extraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    if (fname === 'word/document.xml') {
      let xml;
      if (method === 0) xml = new TextDecoder().decode(data);
      else if (method === 8 && typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        xml = await new Response(stream).text();
      } else throw new Error('This .docx uses an unsupported compression method.');
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      return [...doc.getElementsByTagName('w:t')].map(e => e.textContent).join(' ');
    }
    off = dataStart + compSize;
  }
  throw new Error('Could not find word/document.xml in this .docx file.');
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
