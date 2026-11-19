import './style.css';
import { Tunnel } from './tunnel.js';
import { Reader, getProgress } from './reader.js';
import { SAMPLE_NOVELS } from './sample.js';
import { icon } from './icons.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

const NARRATION = [
  ['Cerita silat pernah hidup di lapak-lapak sewa buku, berpindah dari tangan ke tangan, jilid demi jilid.', ''],
  ['Sejak 1950-an, kisah para pendekar menyeberang ke Nusantara lewat terjemahan dan saduran.', 'Koran dan penerbit kecil memuatnya bersambung, dan pembaca menunggu jilid berikutnya setiap pekan.'],
  ['Para pengarang lalu menulis pendekar mereka sendiri.', 'Latar ceritanya pun berpindah, dari lembah-lembah di Tiongkok ke gunung, hutan, dan kerajaan di Jawa.'],
  ['Setiap jilid adalah perjalanan: perguruan, dendam lama, kitab rahasia, dan jurus yang diwariskan diam-diam.', ''],
  ['Ribuan halaman itu kini dikumpulkan kembali, siap dibuka satu per satu.', ''],
];
const SECTIONS = [
  ['intro', 'Pengantar'],
  ['koleksi', 'Koleksi'],
  ['grid', 'Tampilan Grid'],
  ['semesta', 'Semesta Cerita'],
];

const app = document.getElementById('app');
app.innerHTML = `
  <section class="view" id="intro">
    <canvas></canvas>
    <div class="intro-vignette"></div>
    <div class="narration">${NARRATION.map(([a, b]) => `<p>${esc(a)}${b ? `<small>${esc(b)}</small>` : ''}</p>`).join('')}</div>
    <div class="portal"><button class="btn-accent" data-go="koleksi">Jelajahi koleksi</button></div>
    <div class="scroll-hint"><div><div class="mouse"></div>Gulir untuk<br>menjelajah</div></div>
  </section>
  <section class="view dots" id="koleksi">
    <div class="stage"></div>
    <div class="koleksi-head"><h2>Rak Para Pendekar</h2><p>Pilih sebuah sampul untuk mulai membaca</p></div>
  </section>
  <section class="view dots" id="grid">
    <div class="grid-wrap">
      <div class="grid-top">
        <div><h2>Koleksi Buku</h2><p class="grid-count"></p></div>
        <label class="search">${icon('search')}<input type="search" placeholder="Cari judul, seri, atau pengarang…" aria-label="Cari buku"></label>
      </div>
      <div class="cats"></div>
      <div class="grid-body"></div>
    </div>
  </section>
  <section class="view dots" id="semesta">
    <div class="mosaic"></div>
    <div class="semesta-hint">Seret untuk menjelajah · ketuk sampul untuk membaca</div>
  </section>
  <section class="view dots" id="reader"></section>

  <div class="brand"><span class="seal">武</span>Pustaka Cersil <span class="source-badge"></span></div>
  <div class="top-right" id="chrome-close"><button class="icon-btn" data-go="koleksi" aria-label="Lewati pengantar">${icon('x')}</button></div>
  <div class="progress"><i></i></div>
  <nav class="chapters">${SECTIONS.map(([id, label], i) => `<button class="pill" data-go="${id}"><span class="n">${i + 1} •</span> ${label}</button>`).join('')}</nav>
  <div class="toast"></div>
`;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- State ----------
let novels = [];
let source = 'sample';
let current = null;
let step = 0;
const STEPS = NARRATION.length + 1; // langkah terakhir = portal
const tunnel = new Tunnel($('#intro canvas'));
const chapterCache = new Map();

function toast(msg, ms = 6000) {
  const t = $('.toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), ms);
}

// ---------- Data ----------
async function loadNovels() {
  try {
    const r = await fetch('/api/novels');
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Error('API tidak tersedia');
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.statusText);
    if (j.source === 'drive' && j.novels.length) { source = 'drive'; return j.novels; }
    if (j.source === 'drive') toast('Folder Google Drive terbaca, tetapi belum ada file buku yang dikenali (PDF, Google Docs, DOCX, TXT). Menampilkan novel contoh.');
    if (j.source === 'drive') toast('Folder Google Drive terbaca, tetapi belum ada file novel yang dikenali (Google Docs, PDF, DOCX, TXT). Menampilkan novel contoh.');
    else toast('Mode contoh: atur GOOGLE_API_KEY di Vercel agar novel dari Google Drive tampil.');
  } catch (e) {
    toast('Mode contoh: data Google Drive belum terhubung (' + e.message + ').');
  }
  source = 'sample';
  return SAMPLE_NOVELS;
}

async function loadChapter(novel, ch) {
  const c = novel.chapters[ch];
  if (c.paragraphs) return c.paragraphs;
  if (chapterCache.has(c.id)) return chapterCache.get(c.id);
  const r = await fetch('/api/chapter?id=' + encodeURIComponent(c.id));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
  if (j.pdf) { chapterCache.set(c.id, { pdf: j.pdf }); return { pdf: j.pdf }; }
  if (!j.paragraphs?.length) throw new Error('File ini tidak berisi teks yang bisa dibaca.');
  chapterCache.set(c.id, j.paragraphs);
  return j.paragraphs;
}

// ---------- Covers ----------
function coverHtml(n, { dark = false } = {}) {
  const h = 18 + (hash(n.id) % 40);
  const img = n.cover ? `<img src="${esc(n.cover)}" alt="" loading="lazy" onerror="this.parentElement.classList.remove('has-img');this.remove()">` : '';
  return `<div class="cover ${dark ? 'dark' : ''} ${img ? 'has-img' : ''}" style="--h:${h}">${img}<div class="frame"></div><div class="ttl">${esc(n.title)}</div><div class="auth">${esc(n.author || '')}</div><div class="stamp"></div></div>`;
}

// ---------- Koleksi 3D ----------
function buildKoleksi() {
  const stage = $('#koleksi .stage');
  const mobile = innerWidth < 761;
  const cols = mobile ? 5 : 9, rows = mobile ? 7 : 5;
  const cw = mobile ? 92 : 150, gapX = mobile ? 24 : 70, gapY = mobile ? 34 : 60;
  const ch = cw * 1.5;
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  // Urutkan sel dari tengah ke luar agar novel nyata berada di tengah.
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c, d: Math.hypot(c - (cols - 1) / 2, (r - (rows - 1) / 2) * 1.4) });
  cells.sort((a, b) => a.d - b.d);
  const shown = novels.slice(0, cells.length);
  let html = '';
  cells.forEach((cell, k) => {
    const x = (cell.c - (cols - 1) / 2) * (cw + gapX) + (rnd() - 0.5) * 30;
    const y = (cell.r - (rows - 1) / 2) * (ch + gapY) + (rnd() - 0.5) * 30;
    const n0 = shown[k];
    const z = n0 ? 40 - rnd() * 80 : -200 - rnd() * 260;
    const ry = (rnd() - 0.5) * 70, rx = (rnd() - 0.5) * 16;
    const n = shown[k];
    const tf = `translate3d(${x - cw / 2}px, ${y - ch / 2}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    if (n) html += `<div class="slab book" data-id="${esc(n.id)}" style="width:${cw}px;height:${ch}px;transform:${tf}" data-tf="${tf}">${coverHtml(n)}<div class="label">${esc(n.title)}</div></div>`;
    else html += `<div class="slab shadow" style="width:${cw}px;height:${ch}px;transform:${tf}"></div>`;
  });
  stage.innerHTML = html;
  $$('.slab.book', stage).forEach((el) => {
    el.addEventListener('mouseenter', () => { el.style.transform = el.dataset.tf.replace(/rotateY\([^)]*\) rotateX\([^)]*\)/, 'rotateY(0deg) rotateX(0deg)') + ' translateZ(160px)'; });
    el.addEventListener('mouseleave', () => { el.style.transform = el.dataset.tf; });
  });
}
$('#koleksi').addEventListener('mousemove', (e) => {
  const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
  $('#koleksi .stage').style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
});

// ---------- Grid (dikelompokkan per kategori/pengarang) ----------
let activeCat = '';
function bookCard(n) {
  const p = getProgress(n.id);
  const pct = p ? Math.max(3, Math.round(((p.ch + (p.pages ? (p.para + 1) / p.pages : 0)) / n.chapters.length) * 100)) : 0;
  return `<button class="card" data-id="${esc(n.id)}">${coverHtml(n)}<h3>${esc(n.title)}</h3>
    <div class="meta"><span>${n.chapters.length > 1 ? `${n.chapters.length} jilid` : '1 jilid'}${n.edition ? ' · ' + esc(n.edition) : ''}</span></div>
    ${p ? `<div class="bar" title="Terakhir dibaca: jilid ${p ? p.ch + 1 : ''}"><i style="width:${pct}%"></i></div>` : ''}</button>`;
}
function buildGrid(q = '') {
  const wrap = $('#grid .grid-body');
  const terms = q.toLowerCase().trim();
  const cats = [...new Set(novels.map((n) => n.category || n.author || 'Lainnya'))];
  $('#grid .cats').innerHTML = cats.length > 1
    ? [['', 'Semua'], ...cats.map((c) => [c, c])].map(([v, l]) =>
        `<button class="chip ${v === activeCat ? 'on' : ''}" data-cat="${esc(v)}">${esc(l)} <span>${v ? novels.filter((n) => (n.category || n.author || 'Lainnya') === v).length : novels.length}</span></button>`).join('')
    : '';
  const list = novels.filter((n) =>
    (!activeCat || (n.category || n.author || 'Lainnya') === activeCat) &&
    (!terms || [n.title, n.author, n.series, n.category].join(' ').toLowerCase().includes(terms)));
  $('#grid .grid-count').textContent = `${novels.length} buku · ${cats.length} pengarang${source === 'sample' ? ' (contoh)' : ''}${terms || activeCat ? ` · ${list.length} ditampilkan` : ''}`;
  if (!list.length) { wrap.innerHTML = `<div class="empty">Tidak ada buku yang cocok${q ? ` dengan “${esc(q)}”` : ''}.</div>`; return; }
  const groups = new Map();
  for (const n of list) {
    const c = n.category || n.author || 'Lainnya';
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(n);
  }
  wrap.innerHTML = [...groups].map(([c, items]) =>
    `<section class="cat-group"><h3 class="cat-title"><span class="seal-sm"></span>${esc(c)} <small>${items.length} buku</small></h3>
      <div class="grid">${items.map(bookCard).join('')}</div></section>`).join('');
}
$('#grid input').addEventListener('input', (e) => buildGrid(e.target.value));
$('#grid .cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  activeCat = b.dataset.cat;
  buildGrid($('#grid input').value);
});

// ---------- Semesta (mosaik) ----------
let pan = { x: 0, y: 0 };
function buildSemesta() {
  const m = $('#semesta .mosaic');
  const mobile = innerWidth < 761;
  const colW = mobile ? 56 : 72, gap = 6;
  const cols = Math.ceil((innerWidth * 2.2) / (colW + gap));
  const heightTarget = innerHeight * 2.2;
  const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  let html = '', k = 0;
  for (let c = 0; c < cols; c++) {
    let y = rnd() * -60;
    while (y < heightTarget) {
      const n = novels[k++ % novels.length];
      const h = colW * (1.3 + rnd() * 0.4);
      html += `<button class="tile" data-id="${esc(n.id)}" style="left:${c * (colW + gap)}px;top:${y}px;width:${colW}px;height:${h}px" title="${esc(n.title)}">${coverHtml(n, { dark: rnd() < 0.35 })}</button>`;
      y += h + gap;
    }
  }
  m.innerHTML = html;
  m.style.width = cols * (colW + gap) + 'px';
  m.style.height = heightTarget + 'px';
  pan = { x: -(cols * (colW + gap) - innerWidth) / 2, y: -(heightTarget - innerHeight) / 2 };
  applyPan();
}
function applyPan() {
  const m = $('#semesta .mosaic');
  const maxX = 0, minX = innerWidth - m.offsetWidth, maxY = 0, minY = innerHeight - m.offsetHeight;
  pan.x = Math.min(maxX, Math.max(minX, pan.x));
  pan.y = Math.min(maxY, Math.max(minY, pan.y));
  m.style.transform = `translate(${pan.x}px, ${pan.y}px)`;
}
{
  const el = $('#semesta');
  let drag = null;
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }; });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) { drag.moved = true; el.classList.add('drag'); }
    pan.x = drag.px + dx; pan.y = drag.py + dy; applyPan();
  });
  addEventListener('pointerup', () => { if (drag) { el.dataset.moved = drag.moved ? '1' : ''; drag = null; el.classList.remove('drag'); } });
  el.addEventListener('wheel', (e) => { pan.x -= e.deltaX; pan.y -= e.deltaY; applyPan(); }, { passive: true });
}

// ---------- Reader ----------
const reader = new Reader($('#reader'), {
  loadChapter,
  onNextBook: (id) => openNovel(id, 0),
  onClose: () => show(lastSection === 'intro' ? 'koleksi' : lastSection),
});

function openNovel(id, ch = null) {
  const n = novels.find((x) => String(x.id) === String(id));
  if (!n) return;
  show('reader');
  reader.open(n, ch);
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) return show(go.dataset.go);
  const book = e.target.closest('.slab.book, .card, .tile');
  if (book) {
    if (book.classList.contains('tile') && $('#semesta').dataset.moved) return;
    openNovel(book.dataset.id);
  }
});

// ---------- Navigasi antar bagian ----------
let lastSection = 'intro';
function show(id) {
  current = id;
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === id));
  const inReader = id === 'reader';
  $('.chapters').style.display = inReader ? 'none' : '';
  $('.progress').style.display = inReader ? 'none' : '';
  $('.brand').style.display = inReader ? 'none' : '';
  $('#chrome-close').style.display = id === 'intro' ? '' : 'none';
  $('.chapters').classList.toggle('dim', id !== 'intro');
  if (!inReader) {
    lastSection = id;
    $$('.chapters .pill').forEach((p) => p.classList.toggle('active', p.dataset.go === id));
    if (id === 'intro') { tunnel.start(); setStep(step); } else tunnel.stop();
    if (id === 'grid') buildGrid($('#grid input').value);
    if (id === 'koleksi') {
      const st = $('#koleksi .stage');
      st.style.transition = 'none';
      st.style.transform = 'translateZ(-900px) rotateX(20deg)';
      requestAnimationFrame(() => requestAnimationFrame(() => { st.style.transition = ''; st.style.transform = ''; }));
    }
    updateProgressBar();
    if (location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id);
  }
}

function updateProgressBar() {
  const idx = SECTIONS.findIndex(([s]) => s === current);
  const p = current === 'intro' ? (step / (STEPS - 1)) * 0.25 : 0.25 + (idx / (SECTIONS.length - 1)) * 0.75;
  const i = $('.progress i');
  i.style.top = p * 100 + '%';
  i.style.setProperty('--p', p * 100 + '%');
}

function setStep(s) {
  step = Math.max(0, Math.min(STEPS - 1, s));
  tunnel.target = step;
  $$('.narration p').forEach((p, i) => p.classList.toggle('on', i === step));
  $('.portal').classList.toggle('open', step === STEPS - 1);
  $('.scroll-hint').style.opacity = step < STEPS - 1 ? 1 : 0;
  updateProgressBar();
}

// Gulir / sentuh / keyboard memajukan narasi satu langkah sekali gerak.
let lock = 0;
function nudge(dir) {
  const now = Date.now();
  if (now < lock) return;
  lock = now + 850;
  if (current === 'intro') {
    if (dir > 0 && step === STEPS - 1) return show('koleksi');
    setStep(step + dir);
  }
}
$('#intro').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > 8) nudge(Math.sign(e.deltaY)); }, { passive: true });
{
  let ty = null;
  $('#intro').addEventListener('touchstart', (e) => (ty = e.touches[0].clientY), { passive: true });
  $('#intro').addEventListener('touchend', (e) => {
    if (ty == null) return;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) nudge(Math.sign(dy));
    ty = null;
  }, { passive: true });
}
addEventListener('keydown', (e) => {
  if (current !== 'intro') return;
  if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); nudge(1); }
  if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); nudge(-1); }
});

let rz;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { buildKoleksi(); buildSemesta(); }, 250);
});

// ---------- Mulai ----------
const initialHash = location.hash;
function route() {
  const h = decodeURIComponent(initialHash.replace(/^#\/?/, ''));
  const m = h.match(/^baca\/(.+)\/(\d+)$/);
  if (m && novels.find((n) => String(n.id) === m[1])) { lastSection = 'koleksi'; return openNovel(m[1], +m[2] - 1); }
  const sec = SECTIONS.find(([s]) => s === h);
  show(sec ? sec[0] : 'intro');
}

show('intro');
setStep(0);
(async () => {
  novels = await loadNovels();
  $('.source-badge').textContent = source === 'drive' ? 'Google Drive' : 'Mode contoh';
  buildKoleksi();
  buildSemesta();
  route();
})();
