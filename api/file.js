import { Readable } from 'node:stream';
import { apiKey, getMeta } from './_drive.js';

// Proksi file mentah dari Drive: gambar sampul dan PDF.
// Header Range diteruskan agar pdf.js bisa memuat PDF besar sepotong-sepotong
// (batas ukuran respons fungsi Vercel tidak terlampaui).
export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id || !apiKey()) { res.statusCode = 404; return res.end(); }
  try {
    const meta = await getMeta(id);
    const mt = meta.mimeType || '';
    const isPdf = mt === 'application/pdf' || /\.pdf$/i.test(meta.name || '');
    if (!mt.startsWith('image/') && !isPdf) { res.statusCode = 415; return res.end(); }
    const headers = {};
    if (req.headers.range) headers.Range = req.headers.range;
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey()}&supportsAllDrives=true`,
      { headers }
    );
    if (!r.ok && r.status !== 206) { res.statusCode = r.status; return res.end(); }
    res.statusCode = r.status;
    res.setHeader('Content-Type', isPdf ? 'application/pdf' : mt);
    res.setHeader('Accept-Ranges', 'bytes');
    for (const h of ['content-length', 'content-range']) {
      const v = r.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader('Cache-Control', 'public, s-maxage=604800, max-age=86400');
    if (req.method === 'HEAD') return res.end();
    Readable.fromWeb(r.body).pipe(res);
  } catch {
    res.statusCode = 502;
    res.end();
  }
}
