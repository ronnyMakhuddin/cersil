import {
  ROOT_FOLDER_ID, apiKey, listChildren, FOLDER, isReadable, isImage,
  byName, splitTitleAuthor, cleanTitle, send,
} from './_drive.js';

// Kumpulkan file bacaan dalam satu folder novel (termasuk subfolder, mis. "Jilid 1").
async function collect(folderId, prefix = '', depth = 0) {
  const items = (await listChildren(folderId)).sort(byName);
  const chapters = [];
  let cover = null;
  for (const f of items) {
    if (f.mimeType === FOLDER && depth < 2) {
      const sub = await collect(f.id, prefix + cleanTitle(f.name) + ' · ', depth + 1);
      chapters.push(...sub.chapters);
      cover = cover || sub.cover;
    } else if (isReadable(f)) {
      chapters.push({ id: f.id, name: prefix + cleanTitle(f.name), mimeType: f.mimeType });
    } else if (isImage(f) && !cover) {
      cover = `/api/file?id=${f.id}`;
    }
  }
  return { chapters, cover };
}

export default async function handler(req, res) {
  if (!apiKey()) return send(res, 200, { source: 'sample', novels: [] });
  try {
    const root = (await listChildren(req.query?.folder || ROOT_FOLDER_ID)).sort(byName);
    const novels = [];
    const folders = root.filter((f) => f.mimeType === FOLDER);
    const results = await Promise.all(folders.map((f) => collect(f.id)));
    folders.forEach((f, i) => {
      const { title, author } = splitTitleAuthor(f.name);
      if (results[i].chapters.length)
        novels.push({ id: f.id, title, author, cover: results[i].cover, chapters: results[i].chapters });
    });
    for (const f of root) {
      if (f.mimeType === FOLDER || !isReadable(f)) continue;
      const { title, author } = splitTitleAuthor(f.name);
      novels.push({
        id: f.id, title, author, cover: null,
        chapters: [{ id: f.id, name: title, mimeType: f.mimeType }],
      });
    }
    novels.sort((a, b) => byName({ name: a.title }, { name: b.title }));
    send(res, 200, { source: 'drive', novels }, 600);
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
}
