// Pembaca buku: memecah paragraf menjadi halaman sesuai ukuran layar,
// menampilkan dua halaman (desktop) atau satu halaman (ponsel), dan efek balik halaman.

import { icon } from './icons.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export function getProgress(novelId) { return store.get('cersil:prog:' + novelId, null); }

export class Reader {
  constructor(root, { loadChapter, onClose, onNextBook }) {
    this.onNextBook = onNextBook;
    this.root = root;
    this.loadChapter = loadChapter;
    this.onClose = onClose;
    this.fs = store.get('cersil:fs', 17);
    this.root.innerHTML = `
      <div class="top-right"><button class="icon-btn" data-act="close" aria-label="Tutup">${icon('x')}</button></div>
      <div class="reader-top"><select class="chapter-select" aria-label="Pilih bagian"></select></div>
      <div class="reader-title"></div>
      <div class="book-area">
        <div class="book">
          <div class="page left"><div class="body"></div><div class="folio"></div></div>
          <div class="page right"><div class="body"></div><div class="folio"></div></div>
        </div>
      </div>
      <button class="icon-btn nav-prev" data-act="prev" aria-label="Halaman sebelumnya">${icon('chevron-left')}</button>
      <button class="icon-btn nav-next" data-act="next" aria-label="Halaman berikutnya">${icon('chevron-right')}</button>
      <div class="folio-count"><b>1</b><i>/</i><span>1</span></div>
      <div class="reader-bottom"><button class="btn-accent" data-act="close">Kembali</button></div>
      <div class="reader-tools">
        <button class="icon-btn" data-act="smaller" aria-label="Perkecil huruf">A−</button>
        <button class="icon-btn" data-act="bigger" aria-label="Perbesar huruf">A+</button>
      </div>`;
    this.book = root.querySelector('.book');
    this.leftEl = root.querySelector('.page.left');
    this.rightEl = root.querySelector('.page.right');
    this.select = root.querySelector('.chapter-select');
    this.titleEl = root.querySelector('.reader-title');
    this.countEl = root.querySelector('.folio-count');
    this.prevBtn = root.querySelector('.nav-prev');
    this.nextBtn = root.querySelector('.nav-next');
    this.pages = [];
    this.i = 0;
    this.busy = false;

    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') this.close();
      else if (act === 'prev') this.prev();
      else if (act === 'next') this.next();
      else if (act === 'bigger') this.setFont(this.fs + 1);
      else if (act === 'smaller') this.setFont(this.fs - 1);
      else if (act === 'next-chapter') this.openChapter(this.ch + 1, 0);
      else if (act === 'next-book' && this.novel.next) this.onNextBook?.(this.novel.next.id);
    });
    this.select.addEventListener('change', () => this.openChapter(+this.select.value, 0));
    addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); this.next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); this.prev(); }
      else if (e.key === 'Escape') this.close();
    });
    let tx = 0, ty = 0;
    root.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? this.next() : this.prev();
    }, { passive: true });
    let rt;
    addEventListener('resize', () => {
      if (!this.isOpen) return;
      clearTimeout(rt);
      rt = setTimeout(() => this.repaginate(), 200);
    });
  }

  get spread() { return matchMedia('(min-width: 761px)').matches ? 2 : 1; }

  async open(novel, ch = null, para = null) {
    this.novel = novel;
    this.isOpen = true;
    const p = getProgress(novel.id);
    if (ch == null) { ch = p?.ch ?? 0; para = p?.para ?? 0; }
    this.select.innerHTML = novel.chapters.length === 1 ? `<option>${esc(novel.title)}</option>` : novel.chapters.map((c, i) => `<option value="${i}">${esc(c.name)}</option>`).join('');
    this.titleEl.textContent = [novel.title, novel.edition, novel.author].filter(Boolean).join(' · ');
    this.select.disabled = novel.chapters.length === 1;
    this.book.classList.add('entering');
    requestAnimationFrame(() => requestAnimationFrame(() => this.book.classList.remove('entering')));
    await this.openChapter(Math.min(ch, novel.chapters.length - 1), para || 0);
  }

  close() {
    this.isOpen = false;
    this.onClose?.();
  }

  setFont(v) {
    this.fs = Math.max(14, Math.min(24, v));
    store.set('cersil:fs', this.fs);
    this.repaginate();
  }

  async openChapter(ch, para = 0, atEnd = false) {
    if (ch < 0 || ch >= this.novel.chapters.length) return;
    this.ch = ch;
    this.select.value = String(ch);
    this.paras = null;
    this.closePdf();
    this.showLoading();
    const token = (this.token = {});
    let paras;
    try {
      paras = await this.loadChapter(this.novel, ch);
    } catch (e) {
      if (token !== this.token) return;
      this.pages = [{ html: `<div class="loading">Gagal memuat bagian ini.<br><small>${esc(e.message || e)}</small></div>`, para: 0 }];
      this.i = 0;
      return this.render();
    }
    if (token !== this.token) return;
    if (paras && paras.pdf) {
      try {
        await this.openPdf(paras.pdf, token);
      } catch (e) {
        if (token !== this.token) return;
        this.pages = [{ html: `<div class="loading">Gagal membuka PDF.<br><small>${esc(e.message || e)}</small></div>`, para: 0 }];
        this.i = 0;
        return this.render();
      }
      if (token !== this.token) return;
    } else {
      this.paras = paras;
      this.paginate();
    }
    if (atEnd) this.i = this.alignIndex(this.pages.length - 1);
    else this.goToPara(para);
    this.render();
    this.saveProgress();
    history.replaceState(null, '', `#/baca/${encodeURIComponent(this.novel.id)}/${ch + 1}`);
  }

  showLoading() {
    this.pages = [{ html: `<div class="loading">Membuka lembaran…</div>`, para: 0 }];
    this.i = 0;
    this.render();
  }

  endHtml() {
    const nc = this.ch < this.novel.chapters.length - 1 ? this.novel.chapters[this.ch + 1] : null;
    const nb = !nc && this.novel.next;
    const btn = nc ? `<button class="btn-accent" data-act="next-chapter">Lanjut: ${esc(nc.name)}</button>`
      : nb ? `<button class="btn-accent" data-act="next-book">Buku berikutnya: ${esc(nb.title)}</button>`
      : '<small>Akhir dari buku ini.</small>';
    return `<div class="end">— Tamat —<br>${btn}</div>`;
  }

  // ---- Mode PDF (hasil scan): tiap halaman PDF = satu halaman buku, dirender jadi gambar ----
  async openPdf(url, token) {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const task = pdfjs.getDocument({ url, rangeChunkSize: 1 << 20, disableAutoFetch: true, disableStream: true });
    const doc = await task.promise;
    if (token !== this.token) return task.destroy?.();
    this.pdfTask = task;
    this.pdfDoc = doc;
    this.pdfCache = new Map();
    const hasNext = this.ch < this.novel.chapters.length - 1;
    this.pages = Array.from({ length: doc.numPages }, (_, k) => ({ pdf: k + 1, para: k }));
    this.pages.push({
      para: doc.numPages, end: true,
      html: `<div style="display:grid;place-items:center;height:100%">${this.endHtml()}</div>`,
    });
  }

  closePdf() {
    if (!this.pdfDoc) return;
    for (const u of this.pdfCache.values()) Promise.resolve(u).then((x) => x && URL.revokeObjectURL(x));
    try { this.pdfTask?.destroy?.(); } catch {}
    this.pdfDoc = null;
  }

  pdfImage(n) {
    if (this.pdfCache.has(n)) return this.pdfCache.get(n);
    const doc = this.pdfDoc;
    const p = (async () => {
      const page = await doc.getPage(n);
      const w = (this.rightEl.clientWidth || 600) * Math.min(devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: w / page.getViewport({ scale: 1 }).width });
      const c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      await page.render({ canvas: c, canvasContext: c.getContext('2d'), viewport: vp }).promise;
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
      return URL.createObjectURL(blob);
    })().catch(() => null);
    this.pdfCache.set(n, p);
    if (this.pdfCache.size > 40) {
      const [k, v] = this.pdfCache.entries().next().value;
      this.pdfCache.delete(k);
      v.then((x) => x && URL.revokeObjectURL(x));
    }
    return p;
  }

  repaginate() {
    if (this.pdfDoc) { for (const v of this.pdfCache.values()) v.then((x) => x && URL.revokeObjectURL(x)); this.pdfCache.clear(); return this.render(); }
    if (!this.paras) return;
    const anchor = this.pages[this.i]?.para ?? 0;
    this.paginate();
    this.goToPara(anchor);
    this.render();
  }

  alignIndex(i) { return this.spread === 2 ? i - (i % 2) : i; }

  goToPara(para) {
    let idx = 0;
    for (let k = 0; k < this.pages.length; k++) if (this.pages[k].para <= para) idx = k;
    this.i = this.alignIndex(idx);
  }

  // Pecah paragraf ke halaman dengan mengukur di elemen tersembunyi seukuran halaman.
  paginate() {
    const ref = this.rightEl;
    const W = ref.clientWidth, H = ref.clientHeight;
    const m = document.createElement('div');
    m.className = 'page right measure';
    const rcs = getComputedStyle(ref);
    m.style.cssText = `width:${W}px;height:${H}px;--fs:${this.fs}px;padding:${rcs.paddingTop} ${rcs.paddingRight} ${rcs.paddingBottom} ${rcs.paddingLeft}`;
    m.innerHTML = '<div class="body"></div>';
    document.body.appendChild(m);
    const body = m.querySelector('.body');
    const cs = getComputedStyle(m);
    const limit = H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const fits = () => body.scrollHeight <= limit;

    const chap = this.novel.chapters[this.ch];
    const pages = [];
    let cur = `<div class="ornament">❖ ❖ ❖</div><h2>${esc(this.novel.title)}</h2><div class="chap-sub">${esc(chap.name)}</div>`;
    let curPara = 0;
    body.innerHTML = cur;
    const flush = (nextPara) => { pages.push({ html: cur, para: curPara }); cur = ''; curPara = nextPara; body.innerHTML = ''; };

    this.paras.forEach((text, pi) => {
      const pHtml = (cls) => `<p${cls ? ' class="cont"' : ''}>`;
      body.innerHTML = cur + pHtml(false) + esc(text) + '</p>';
      if (fits()) { cur = body.innerHTML; return; }
      // Paragraf tidak muat: pecah per kata.
      const words = text.split(/\s+/);
      let start = 0;
      let cont = false;
      while (start < words.length) {
        let lo = start + 1, hi = words.length, best = start;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          body.innerHTML = cur + pHtml(cont) + esc(words.slice(start, mid).join(' ')) + '</p>';
          if (fits()) { best = mid; lo = mid + 1; } else hi = mid - 1;
        }
        if (best === start) {
          if (!cur) best = start + 1; // halaman kosong tapi kata tetap tak muat: paksa
          else { flush(pi); continue; }
        }
        cur = cur + pHtml(cont) + esc(words.slice(start, best).join(' ')) + '</p>';
        start = best;
        cont = true;
        if (start < words.length) flush(pi);
      }
      body.innerHTML = cur;
    });
    const hasNext = this.ch < this.novel.chapters.length - 1;
    const end = this.endHtml();
    body.innerHTML = cur + end;
    if (fits()) cur += end;
    else { pages.push({ html: cur, para: curPara }); cur = end; }
    pages.push({ html: cur, para: curPara, end: true });
    m.remove();
    this.pages = pages;
  }

  pageHtml(k) {
    const p = this.pages[k];
    if (!p) return { html: '', folio: '' };
    return { html: p.html, folio: String(k + 1) };
  }

  fill(el, k) {
    const pg = this.pages[k];
    el.classList.toggle('pdf', !!pg?.pdf);
    if (pg?.pdf) {
      const body = el.querySelector('.body');
      body.innerHTML = '<div class="loading">Memuat halaman…</div>';
      el.querySelector('.folio').textContent = '';
      el.classList.remove('blank');
      el.dataset.k = k;
      this.pdfImage(pg.pdf).then((url) => {
        if (el.dataset.k != k) return;
        body.innerHTML = url ? `<img class="pdf-img" src="${url}" alt="Halaman ${pg.pdf}">` : '<div class="loading">Halaman gagal dimuat.</div>';
      });
      // Muat lebih dulu halaman-halaman berikutnya.
      for (let d = 1; d <= 3; d++) if (this.pages[k + d]?.pdf) this.pdfImage(this.pages[k + d].pdf);
      return;
    }
    el.dataset.k = k;
    const { html, folio } = this.pageHtml(k);
    el.style.setProperty('--fs', this.fs + 'px');
    el.querySelector('.body').innerHTML = html;
    el.querySelector('.folio').textContent = folio;
    el.classList.toggle('blank', !html);
  }

  render() {
    if (this.spread === 2) { this.fill(this.leftEl, this.i); this.fill(this.rightEl, this.i + 1); }
    else this.fill(this.rightEl, this.i);
    this.updateChrome();
  }

  updateChrome() {
    this.root.querySelector('.reader-tools').style.visibility = this.pdfDoc ? 'hidden' : '';
    const total = this.pages.length;
    const shown = Math.min(total, this.i + 1);
    this.countEl.querySelector('b').textContent = shown;
    this.countEl.querySelector('span').textContent = total;
    const lastI = this.alignIndex(total - 1);
    this.prevBtn.disabled = this.i === 0 && this.ch === 0;
    this.nextBtn.disabled = this.i >= lastI && this.ch >= this.novel.chapters.length - 1;
  }

  saveProgress() {
    if (!this.novel || !this.pages.length) return;
    store.set('cersil:prog:' + this.novel.id, {
      ch: this.ch, para: this.pages[this.i]?.para ?? 0, pages: this.pdfDoc ? this.pdfDoc.numPages : (this.paras?.length || 0),
      chapters: this.novel.chapters.length, t: Date.now(),
    });
  }

  makeLeaf(cls, front, back) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf ' + cls;
    const mk = (k, side) => {
      const d = document.createElement('div');
      d.className = `page ${side}`;
      d.innerHTML = '<div class="body"></div><div class="folio"></div>';
      this.fill(d, k);
      return d;
    };
    const f = mk(front, cls === 'back-flip' ? 'left' : 'right');
    const b = mk(back, cls === 'back-flip' ? 'right backside' : 'left backside');
    leaf.append(f, b);
    this.book.appendChild(leaf);
    return leaf;
  }

  async flip(dir) {
    if (this.busy || (!this.paras && !this.pdfDoc)) return;
    const step = this.spread;
    const lastI = this.alignIndex(this.pages.length - 1);
    if (dir > 0 && this.i >= lastI) return this.openChapter(this.ch + 1, 0);
    if (dir < 0 && this.i === 0) return this.ch > 0 && this.openChapter(this.ch - 1, 0, true);
    this.busy = true;
    const from = this.i, to = this.i + dir * step;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      let leaf;
      if (step === 2 && dir > 0) {
        this.fill(this.rightEl, to + 1);
        leaf = this.makeLeaf('', from + 1, to);
      } else if (step === 2) {
        this.fill(this.leftEl, to);
        leaf = this.makeLeaf('back-flip', from, to + 1);
      } else {
        this.fill(this.rightEl, to);
        leaf = this.makeLeaf(dir > 0 ? '' : 'back-flip', from, to);
        if (dir < 0) { leaf.style.left = '0'; leaf.style.width = '100%'; leaf.style.transformOrigin = 'left center'; leaf.style.transform = 'rotateY(-100deg)'; leaf.style.opacity = '0'; leaf.firstChild.className = 'page right'; this.fill(leaf.firstChild, to); }
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (step === 1 && dir < 0) { leaf.style.transform = 'rotateY(0deg)'; leaf.style.opacity = '1'; leaf.style.transition += ', opacity .4s'; }
      else leaf.style.transform = `rotateY(${dir > 0 ? -180 : 180}deg)`;
      await new Promise((r) => setTimeout(r, 760));
      leaf.remove();
    }
    this.i = to;
    this.render();
    this.saveProgress();
    this.busy = false;
  }

  next() { this.flip(1); }
  prev() { this.flip(-1); }
}
