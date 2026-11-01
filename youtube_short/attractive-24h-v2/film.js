// THE FILM — the "What If" frame: plaid background, white title box, the story panel (scenes.js), a time-of-day
// tag and a live 24h countdown tag, word-synced captions, and the "Part 1" label. A pure function of t.
(function () {
  const U = globalThis.U, S = globalThis.SCORE, Studio = globalThis.Studio, WF = globalThis.WF, SCN = globalThis.SCENES;
  const { clamp, lerp, ease } = U;
  const W = S.W, H = S.H, PN = S.PANEL;
  const PW = PN.w, PH = PN.h, TAG_INSET = 100;

  // ---------- static frame: plaid + title + "Part 1" (drawn once) ----------
  let STATIC = null;
  function buildStatic() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    // plaid: tan base, two crossing bands with hatching, thin pin lines
    x.fillStyle = '#e8cca6'; x.fillRect(0, 0, W, H);
    const P = 270, B = 100;
    const hatch = (x0, y0, w, h, col) => {
      x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.strokeStyle = col; x.lineWidth = 5;
      for (let k = -h; k < w; k += 12) { x.beginPath(); x.moveTo(x0 + k, y0); x.lineTo(x0 + k + h, y0 + h); x.stroke(); }
      x.restore();
    };
    for (let y = 0; y < H; y += P) { x.fillStyle = '#d5b087'; x.fillRect(0, y, W, B); hatch(0, y, W, B, 'rgba(198,152,108,0.9)'); }
    for (let xx = 0; xx < W; xx += P) { x.fillStyle = '#d5b087'; x.fillRect(xx, 0, B, H); hatch(xx, 0, B, H, 'rgba(198,152,108,0.9)'); }
    for (let y = 0; y < H; y += P) for (let xx = 0; xx < W; xx += P) { x.fillStyle = '#a47450'; x.fillRect(xx, y, B, B); }
    x.fillStyle = 'rgba(120,80,50,0.25)';
    for (let y = 180; y < H; y += P) x.fillRect(0, y, W, 3);
    for (let xx = 180; xx < W; xx += P) x.fillRect(xx, 0, 3, H);
    // title box (inside the Shorts safe zone, just above the panel)
    const box = (text, size, cy, maxW, weight = 700) => {
      x.font = WF.font(size, weight);
      const words = text.split(' '), lines = [];
      let cur = '';
      for (const w of words) { const tt = (cur + ' ' + w).trim(); if (x.measureText(tt).width > maxW - 60 && cur) { lines.push(cur); cur = w; } else cur = tt; }
      lines.push(cur);
      const lh = size * 1.25, bw = Math.max(...lines.map((l) => x.measureText(l).width)) + 56, bh = lh * lines.length + size * 0.6;
      const top = cy - bh;
      x.save(); x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 16; x.shadowOffsetY = 4;
      WF.rr(x, (W - bw) / 2, top, bw, bh, 22, '#ffffff'); x.restore();
      lines.forEach((l, i) => WF.txt(x, l, W / 2, top + size * 0.3 + i * lh + lh / 2, size, '#0a0a0a', { weight }));
      return bh;
    };
    box(S.TITLE, 44, PN.y - 30, 960, 600);
    const bh = 54 * 1.25 + 54 * 0.6;
    box(S.PART, 54, PN.y + PH + 60 + bh, 400);
    // a thin dark frame around the panel
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, PN.y - 4, W, 4); x.fillRect(0, PN.y + PH, W, 4);
    STATIC = c;
  }

  // ---------- scene lookup ----------
  const ORDER = S.PLAN.map((p) => S.SC[p.id]);
  const sceneAt = (t) => { let k = 0; ORDER.forEach((s, i) => { if (t >= s.t0) k = i; }); return k; };

  // ---------- tags ----------
  function tag(ctx, text, x, y, size, col, alignRight = false, scale = 1) {
    ctx.font = WF.font(size, 800);
    const w = ctx.measureText(text).width + 22, h = size * 1.35;
    const x0 = alignRight ? x - w : x;
    ctx.save(); ctx.translate(x0 + w / 2, y + h / 2); ctx.scale(scale, scale);
    WF.rr(ctx, -w / 2, -h / 2, w, h, 12, 'rgba(255,255,255,0.94)');
    WF.txt(ctx, text, 0, 2, size, col);
    ctx.restore();
  }
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function timerText(sc, t) {
    if (sc.clock === null || sc.clock === undefined) return null;
    if (sc.clock === 'count') {
      const k = S.ev.countNums.filter((x) => x <= t).length; // numbers shown so far (5, 4, 3, 2, 1)
      return { text: fmt(t >= S.ev.poof ? 0 : k ? 6 - k : 5), red: true };
    }
    if (sc.id === 'wake' && t < S.ev.timerStart) return null;
    const lt = t - (sc.id === 'wake' ? S.ev.timerStart : sc.t0);
    const left = 86400 - sc.clock * 3600 - lt * 31; // the clock runs fast: hours fly by
    return { text: fmt(left), red: left < 3 * 3600 };
  }

  // ---------- captions (2-3 words, the spoken word in yellow) ----------
  const CHUNKS = [];
  for (const l of S.vo) {
    let cur = [];
    const flush = () => { if (cur.length) CHUNKS.push(cur); cur = []; };
    for (const w of l.words) {
      cur.push(w);
      const s = cur.map((x) => x.w).join(' ');
      if (cur.length >= 3 || s.length >= 14 || /[,.?!:]$/.test(w.w)) flush();
    }
    flush();
  }
  CHUNKS.forEach((c, i) => { const nx = CHUNKS[i + 1]; c.t0 = i === 0 ? 0 : c[0].t - 0.05; c.t1 = nx ? Math.min(nx[0].t - 0.05, c[c.length - 1].end + 0.35) : c[c.length - 1].end + 0.4; });
  function captions(ctx, t) {
    const c = CHUNKS.find((c) => t >= c.t0 && t < c.t1);
    if (!c) return;
    const size = 64;
    const words = c.map((w) => w.w.toUpperCase().replace(/[,.:]$/, ''));
    ctx.font = WF.font(size, 800);
    const sp = ctx.measureText(' ').width;
    const ws = words.map((w) => ctx.measureText(w).width);
    let total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    const sc = Math.min(1, 860 / total) * (0.86 + 0.14 * ease.outBack(clamp((t - c.t0) / 0.12), 2));
    ctx.save(); ctx.translate(PW / 2, PH * 0.84); ctx.scale(sc, sc);
    let x = -total / 2;
    words.forEach((w, i) => {
      const on = t >= c[i].t - 0.03;
      WF.txt(ctx, w, x + ws[i] / 2, 0, size, on && t < c[i].end + 0.1 ? '#ffe14d' : '#ffffff', { stroke: '#111', strokeW: 12 });
      x += ws[i] + sp;
    });
    ctx.restore();
  }

  // ---------- the panel ----------
  function panel(ctx, t) {
    const k = sceneAt(t), sc = ORDER[k], lt = t - sc.t0, dur = sc.t1 - sc.t0;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip();
    const fx0 = {};
    // camera: drawn into an offscreen pass so the scene can return its own camera
    const off = panel.off || (panel.off = Object.assign(document.createElement('canvas'), { width: PW, height: PH }));
    const o = off.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, PW, PH);
    const fx = SCN[sc.id](o, lt, t, sc) || fx0;
    if (fx.tint) { o.fillStyle = fx.tint; o.fillRect(0, 0, PW, PH); }
    let { z, cx, cy } = fx.cam || { z: 1.0 + 0.05 * ease.inOutQuad(clamp(lt / Math.max(1, dur))), cx: PW / 2, cy: PH / 2 };
    if (fx.shake) { cx += U.noise1(t * 30, 1) * 14 * fx.shake; cy += U.noise1(t * 30, 2) * 10 * fx.shake; }
    const cw = PW / z, ch = PH / z;
    const x0 = clamp(cx - cw / 2, 0, PW - cw), y0 = clamp(cy - ch / 2, 0, PH - ch);
    if (fx.glitch) { // horizontal tearing (rewind, record scratch)
      for (let i = 0; i < 12; i++) {
        const sy = (i / 12) * ch, sh = ch / 12, dx = U.noise1(i * 3.1 + t * 40, 5) * 60 * fx.glitch;
        ctx.drawImage(off, x0, y0 + sy, cw, sh, dx, (sy / ch) * PH, PW, PH / 12 + 1);
      }
    } else ctx.drawImage(off, x0, y0, cw, ch, 0, 0, PW, PH);
    if (fx.flash) { ctx.fillStyle = `rgba(255,255,255,${clamp(fx.flash)})`; ctx.fillRect(0, 0, PW, PH); }
    // tags
    if (sc.tod) tag(ctx, sc.tod, TAG_INSET, 16, 28, '#0a0a0a');
    const tt = timerText(sc, t);
    if (tt) {
      const drop = sc.id === 'wake' ? ease.outBack(clamp((t - S.ev.timerStart) / 0.3), 3) : 1;
      tag(ctx, '⏳ ' + tt.text, PW - TAG_INSET, 16, 30, tt.red ? '#d71e28' : '#0a0a0a', true, drop);
    }
    captions(ctx, t);
    // quick dip between scenes (not into the flash / glitch cuts)
    let fade = 1;
    if (lt < 0.1 && k > 0 && !['rewind', 'after', 'address'].includes(sc.id)) fade = lt / 0.1;
    if (sc.t1 - t < 0.06 && k < ORDER.length - 1 && !['hook', 'count'].includes(sc.id)) fade = Math.min(fade, (sc.t1 - t) / 0.06);
    if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, PW, PH); }
    ctx.restore();
  }

  Studio.film({
    init() { buildStatic(); },
    draw(ctx, t) {
      ctx.drawImage(STATIC, 0, 0);
      ctx.save(); ctx.translate(PN.x, PN.y); panel(ctx, t); ctx.restore();
    },
    post: { paper: 0, grain: 0, vignette: 0 },
    fadeOut: 0,
  });
})();
