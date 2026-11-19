// Helper Google Drive API v3 (dipakai oleh fungsi serverless Vercel).
// File berawalan "_" tidak dijadikan endpoint oleh Vercel.

export const ROOT_FOLDER_ID =
  process.env.DRIVE_FOLDER_ID || '1-EMcpVgJpofRhz2WisJIww04hodY_uKt';

const API = 'https://www.googleapis.com/drive/v3';

export function apiKey() {
  return process.env.GOOGLE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY || '';
}

export const FOLDER = 'application/vnd.google-apps.folder';
export const GDOC = 'application/vnd.google-apps.document';
export const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const READABLE = new Set([
  GDOC,
  DOCX,
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/rtf',
]);

export function isReadable(f) {
  if (READABLE.has(f.mimeType)) return true;
  return /\.(txt|md|html?|pdf|docx)$/i.test(f.name || '');
}

export function isImage(f) {
  return (f.mimeType || '').startsWith('image/');
}

export async function listChildren(folderId) {
  const key = apiKey();
  const out = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url =
      `${API}/files?q=${q}&key=${key}&pageSize=1000` +
      `&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink)` +
      `&supportsAllDrives=true&includeItemsFromAllDrives=true` +
      (pageToken ? `&pageToken=${pageToken}` : '');
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
    const j = await r.json();
    out.push(...(j.files || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

export async function getMeta(id) {
  const r = await fetch(
    `${API}/files/${id}?key=${apiKey()}&fields=id,name,mimeType,size&supportsAllDrives=true`
  );
  if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
  return r.json();
}

export async function download(id) {
  const r = await fetch(`${API}/files/${id}?alt=media&key=${apiKey()}&supportsAllDrives=true`);
  if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
  return r;
}

export async function exportDoc(id, mime = 'text/plain') {
  const r = await fetch(
    `${API}/files/${id}/export?mimeType=${encodeURIComponent(mime)}&key=${apiKey()}`
  );
  if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
  return r.text();
}

const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });
export const byName = (a, b) => collator.compare(a.name, b.name);

export function cleanTitle(name) {
  return name
    .replace(/\.(txt|md|html?|pdf|docx?|epub|rtf)$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "Judul - Pengarang" atau "Pengarang - Judul"? Konvensi umum di arsip cersil: "Judul - Pengarang".
export function splitTitleAuthor(name) {
  const t = cleanTitle(name);
  const m = t.match(/^(.*?)\s+[-–—]\s+(.+)$/);
  if (m && m[2].length <= 40) return { title: m[1].trim(), author: m[2].trim() };
  return { title: t, author: '' };
}

export function send(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (cacheSeconds)
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`);
  res.end(JSON.stringify(body));
}
