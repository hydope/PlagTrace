// Tests for .docx extraction, including the bug that broke Syed's Plag.docx
// on iOS: a valid ZIP whose local headers use the data-descriptor flag
// (bit 3, compressed size 0 locally). The old local-header scan jumped to
// the wrong offset and reported "could not find word/document.xml".
// The fix reads the central directory, which always holds true sizes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { extractText, docxXmlToText } from '../src/files.js';

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function buildDocx(entries, useDescriptor) {
  // entries: [[name, Buffer]]; returns a Buffer ZIP
  const locals = []; const centrals = []; let off = 0;
  for (const [name, data] of entries) {
    const cdata = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const flag = useDescriptor ? 0x08 : 0x00;
    const hdr = Buffer.alloc(30);
    hdr.writeUInt32LE(0x04034b50, 0); hdr.writeUInt16LE(20, 4); hdr.writeUInt16LE(flag, 6);
    hdr.writeUInt16LE(8, 8); hdr.writeUInt16LE(0, 10); hdr.writeUInt16LE(0, 12);
    hdr.writeUInt32LE(useDescriptor ? 0 : crc, 14); hdr.writeUInt32LE(useDescriptor ? 0 : cdata.length, 18);
    hdr.writeUInt32LE(useDescriptor ? 0 : data.length, 22); hdr.writeUInt16LE(name.length, 26); hdr.writeUInt16LE(0, 28);
    let local = Buffer.concat([hdr, Buffer.from(name), cdata]);
    if (useDescriptor) { const desc = Buffer.alloc(16); desc.writeUInt32LE(0x08074b50, 0); desc.writeUInt32LE(crc, 4); desc.writeUInt32LE(cdata.length, 8); desc.writeUInt32LE(data.length, 12); local = Buffer.concat([local, desc]); }
    locals.push(local);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(flag, 8);
    cen.writeUInt16LE(8, 10); cen.writeUInt16LE(0, 12); cen.writeUInt16LE(0, 14); cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(cdata.length, 20); cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(0, 30); cen.writeUInt16LE(0, 32); cen.writeUInt16LE(0, 34); cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38); cen.writeUInt32LE(off, 42);
    centrals.push(Buffer.concat([cen, Buffer.from(name)]));
    off += local.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, cd, eocd]);
}
const XML = Buffer.from('<?xml version="1.0"?><w:document xmlns:w="urn:x"><w:body><w:p><w:r><w:t>Photo</w:t></w:r><w:r><w:t>synthesis is real.</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph here.</w:t></w:r></w:p></w:body></w:document>');
const fakeFile = (buf) => ({ name: 'Plag.docx', arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });

test('paragraph-aware text: run-split word joins without a space, paragraphs split', () => {
  assert.equal(docxXmlToText(XML.toString()), 'Photosynthesis is real.\n\nSecond paragraph here.');
});

test('normal docx (no data descriptor, document.xml not first) extracts', async () => {
  const zip = buildDocx([['word/styles.xml', Buffer.from('<styles/>')], ['word/document.xml', XML]], false);
  assert.equal(await extractText(fakeFile(zip)), 'Photosynthesis is real.\n\nSecond paragraph here.');
});

test('data-descriptor docx (the Plag.docx bug) extracts', async () => {
  const zip = buildDocx([['word/styles.xml', Buffer.from('<styles/>')], ['word/document.xml', XML]], true);
  assert.equal(await extractText(fakeFile(zip)), 'Photosynthesis is real.\n\nSecond paragraph here.');
});

test('docx without document.xml gives a helpful error, not a cryptic one', async () => {
  const zip = buildDocx([['word/styles.xml', Buffer.from('<styles/>')]], false);
  await assert.rejects(() => extractText(fakeFile(zip)), /copy-paste|save it as \.txt/);
});

test('plain text passthrough still works', async () => {
  const f = { name: 'a.txt', text: async () => 'hello world' };
  assert.equal(await extractText(f), 'hello world');
});
