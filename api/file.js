import { apiKey, download, getMeta } from './_drive.js';

// Proksi file mentah (dipakai untuk gambar sampul).
export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id || !apiKey()) { res.statusCode = 404; return res.end(); }
  try {
    const meta = await getMeta(id);
    if (!(meta.mimeType || '').startsWith('image/')) { res.statusCode = 415; return res.end(); }
    const r = await download(id);
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader('Cache-Control', 'public, s-maxage=604800, max-age=86400');
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.statusCode = 502;
    res.end();
  }
}
