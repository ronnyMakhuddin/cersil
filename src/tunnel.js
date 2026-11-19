// Terowongan buku: cincin-cincin konsentris dari punggung buku yang bergerak
// mendekat saat pengguna menggulir. Digambar dengan Canvas 2D.

function rand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export class Tunnel {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.target = 0; // posisi langkah tujuan
    this.pos = 0; // posisi langkah tampil (dihaluskan)
    this.time = 0;
    this.running = false;
    this.K = 1.32; // rasio jari-jari antar cincin
    this.ringCache = new Map();
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = this.c.clientWidth || innerWidth;
    const h = this.c.clientHeight || innerHeight;
    this.c.width = Math.round(w * dpr);
    this.c.height = Math.round(h * dpr);
    this.w = w; this.h = h; this.dpr = dpr;
  }

  // Data buku per cincin (deterministik per indeks absolut cincin).
  ring(idx) {
    let r = this.ringCache.get(idx);
    if (r) return r;
    const rnd = rand(idx * 7919 + 17);
    const n = 120 + Math.floor(rnd() * 30);
    const books = [];
    let a = 0;
    const dark = idx % 2 === 0;
    for (let i = 0; i < n; i++) {
      const wgt = 0.6 + rnd() * 0.9;
      books.push({
        w: wgt,
        len: 0.55 + rnd() * 0.42,
        hue: 28 + rnd() * 18,
        sat: dark ? 8 + rnd() * 10 : 22 + rnd() * 26,
        lum: dark ? 16 + rnd() * 14 : 52 + rnd() * 28,
        band: rnd() < 0.18,
      });
      a += wgt;
    }
    r = { books, total: a, dir: idx % 4 < 2 ? 1 : -1, spin: 0.004 + rnd() * 0.006, dark };
    this.ringCache.set(idx, r);
    if (this.ringCache.size > 80) this.ringCache.delete(this.ringCache.keys().next().value);
    return r;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() { this.running = false; }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.pos += (this.target - this.pos) * Math.min(1, dt * 2.4);
    this.draw();
    requestAnimationFrame(this.frame);
  }

  draw() {
    const { ctx, w, h, dpr, K } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#3a3732';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const maxR = Math.hypot(w, h) / 2 + 40;
    const R0 = Math.min(w, h) * 0.035;
    // Kemajuan terus-menerus (pelan) + lompatan per langkah gulir.
    const travel = this.time * 0.08 + this.pos * 2.2;
    const base = Math.floor(travel);
    const frac = travel - base;

    ctx.save();
    ctx.translate(cx, cy);
    for (let i = -1; i < 40; i++) {
      const r = R0 * Math.pow(K, i + frac * 1);
      if (r > maxR) break;
      const rOuter = r * K;
      if (rOuter < 4) continue;
      const idx = i - base + 1000;
      const ring = this.ring(idx);
      const depth = Math.min(1, Math.max(0, Math.log(r / R0) / Math.log(maxR / R0)));
      const fog = 1 - depth; // pusat lebih gelap
      const rot = this.time * ring.spin * ring.dir + idx * 0.37;
      const unit = (Math.PI * 2) / ring.total;
      let a = rot;
      const thick = rOuter - r;
      for (const b of ring.books) {
        const span = b.w * unit;
        const len = thick * (ring.dark ? 0.98 : b.len);
        const l = b.lum * (1 - fog * 0.55);
        ctx.fillStyle = `hsl(${b.hue} ${b.sat}% ${l}%)`;
        ctx.beginPath();
        ctx.arc(0, 0, r + len, a, a + span * 0.9);
        ctx.arc(0, 0, r, a + span * 0.9, a, true);
        ctx.closePath();
        ctx.fill();
        if (b.band && !ring.dark && span * r > 3) {
          ctx.fillStyle = `hsl(${b.hue} ${b.sat + 10}% ${l * 0.62}%)`;
          ctx.beginPath();
          ctx.arc(0, 0, r + len * 0.72, a, a + span * 0.9);
          ctx.arc(0, 0, r + len * 0.62, a + span * 0.9, a, true);
          ctx.closePath();
          ctx.fill();
        }
        a += span;
      }
    }
    // Lubang pusat.
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R0 * 2.2);
    g.addColorStop(0, '#0f0e0c');
    g.addColorStop(1, 'rgba(15,14,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R0 * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
