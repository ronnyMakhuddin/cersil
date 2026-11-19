import {
  ROOT_FOLDER_ID, apiKey, listChildren, FOLDER, isReadable, isImage,
  byName, cleanTitle, send,
} from './_drive.js';

// Struktur Drive "Dataset Cersil":
//   Dataset Cersil/
//   └── KARYA_DJATILAKSANA/                 → kategori: pengarang
//       ├── 1. Sawer Wulung_Ejaan Lama/     → satu buku (judul)
//       │   ├── sawer-wulung-01.pdf         → jilid 1
//       │   └── sawer-wulung-02.pdf         → jilid 2
//       └── Judul Lepas.pdf                 → buku satu jilid
// Gambar di dalam folder buku dipakai sebagai sampul.

const titleCase = (t) => (t === t.toUpperCase() || t === t.toLowerCase()
  ? t.toLowerCase().replace(/(^|[\s(])(\p{L})/gu, (m, a, c) => a + c.toUpperCase())
  : t);
const tidy = (name) => cleanTitle(name).replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
const authorName = (n) => titleCase(tidy(n).replace(/^(karya|koleksi)\s+/i, '')) || tidy(n);
const bookTitle = (n) => {
  const t = tidy(n).replace(/^\d+\s*[.)-]\s*/, '');
  const m = t.match(/^(.*?)\s+(Ejaan\s+(?:Lama|Baru))$/i);
  return { title: titleCase(m ? m[1] : t), edition: m ? titleCase(m[2]) : '' };
};
const volName = (n) => {
  const t = tidy(n).replace(/[-]+/g, ' ');
  const m = t.match(/(?:jilid|jld|vol|bagian|buku)?\s*0*(\d+)\s*$/i);
  return m ? `Jilid ${+m[1]}` : titleCase(t);
};

// Kumpulkan semua file bacaan di folder buku (termasuk subfolder).
async function collect(folderId, depth = 0) {
  const items = (await listChildren(folderId)).sort(byName);
  const vols = [];
  let cover = null;
  for (const f of items) {
    if (f.mimeType === FOLDER && depth < 2) {
      const sub = await collect(f.id, depth + 1);
      vols.push(...sub.vols);
      cover = cover || sub.cover;
    } else if (isReadable(f)) {
      vols.push({ id: f.id, name: volName(f.name), mimeType: f.mimeType });
    } else if (isImage(f) && !cover) {
      cover = `/api/file?id=${f.id}`;
    }
  }
  return { vols, cover };
}

async function authorBooks(folder, author) {
  const items = (await listChildren(folder.id)).sort(byName);
  const books = [];
  const folders = items.filter((f) => f.mimeType === FOLDER);
  const res = await Promise.all(folders.map((f) => collect(f.id)));
  folders.forEach((f, i) => {
    if (!res[i].vols.length) return;
    const { title, edition } = bookTitle(f.name);
    books.push({ id: f.id, title, edition, author, category: author, cover: res[i].cover, chapters: res[i].vols });
  });
  for (const f of items) {
    if (f.mimeType === FOLDER || !isReadable(f)) continue;
    const { title, edition } = bookTitle(f.name);
    books.push({ id: f.id, title, edition, author, category: author, cover: null,
      chapters: [{ id: f.id, name: title, mimeType: f.mimeType }] });
  }
  return books;
}

export default async function handler(req, res) {
  if (!apiKey()) return send(res, 200, { source: 'sample', novels: [] });
  try {
    const rootId = req.query?.folder || ROOT_FOLDER_ID;
    const root = (await listChildren(rootId)).sort(byName);
    const authors = root.filter((f) => f.mimeType === FOLDER);
    const groups = await Promise.all(authors.map((f) => authorBooks(f, authorName(f.name))));
    const novels = groups.flat();
    for (const f of root) {
      if (f.mimeType === FOLDER || !isReadable(f)) continue;
      const { title, edition } = bookTitle(f.name);
      novels.push({ id: f.id, title, edition, author: '', category: 'Lainnya', cover: null,
        chapters: [{ id: f.id, name: title, mimeType: f.mimeType }] });
    }
    const categories = [...new Set(novels.map((n) => n.category))];
    send(res, 200, { source: 'drive', categories, novels }, 600);
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
}
