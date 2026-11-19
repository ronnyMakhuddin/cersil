import { apiKey, getMeta, download, exportDoc, GDOC, DOCX, send } from './_drive.js';

function htmlToText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Rapikan teks menjadi daftar paragraf.
function toParagraphs(text) {
  const norm = text.replace(/\r\n?/g, '\n').replace(/ /g, ' ');
  let paras = norm.split(/\n\s*\n/);
  // Teks hasil PDF/TXT sering berupa baris pendek tanpa baris kosong: gabungkan.
  if (paras.length < 3) {
    paras = [];
    let buf = '';
    for (const line of norm.split('\n')) {
      const l = line.trim();
      if (!l) { if (buf) paras.push(buf); buf = ''; continue; }
      buf = buf ? buf + ' ' + l : l;
      if (/[.!?"”’]$/.test(l) && buf.length > 280) { paras.push(buf); buf = ''; }
    }
    if (buf) paras.push(buf);
  }
  return paras.map((p) => p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()).filter(Boolean);
}

export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id) return send(res, 400, { error: 'id wajib diisi' });
  if (!apiKey()) return send(res, 503, { error: 'GOOGLE_API_KEY belum diatur' });
  try {
    const meta = await getMeta(id);
    const mt = meta.mimeType;
    const name = meta.name || '';
    let text = '';
    if (mt === GDOC) {
      text = await exportDoc(id, 'text/plain');
    } else if (mt === DOCX || /\.docx$/i.test(name)) {
      const buf = Buffer.from(await (await download(id)).arrayBuffer());
      const mammoth = await import('mammoth');
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else if (mt === 'application/pdf' || /\.pdf$/i.test(name)) {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(await (await download(id)).arrayBuffer()));
      const { text: pages } = await extractText(pdf, { mergePages: false });
      text = pages.join('\n\n');
    } else if (mt === 'text/html' || /\.html?$/i.test(name)) {
      text = htmlToText(await (await download(id)).text());
    } else {
      const buf = Buffer.from(await (await download(id)).arrayBuffer());
      text = buf.toString('utf8');
      if (text.includes('�')) text = buf.toString('latin1');
    }
    send(res, 200, { id, name, paragraphs: toParagraphs(text) }, 86400);
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
}
