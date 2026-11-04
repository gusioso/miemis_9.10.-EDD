// THE FILM — director. Scenes live in scenes1.js / scenes2.js; this file cuts between them and draws the stamps, captions and end card.
(function () {
  const G = globalThis.G, U = globalThis.U, A = globalThis.A, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { clamp, lerp, ease } = U;
  const C = A.C;
  const W = G.W, H = G.H;
  const ev = S.ev;
  let VO = null;
  A.mouthAt = (t) => { // how open the narrator's mouth is (from the voice track): used when Napoleon speaks
    if (!VO || !VO.mouth) return 0;
    const f = Math.max(0, Math.round(t * VO.mouth.fps));
    return VO.mouth.open[f] || 0;
  };

  // ---------- date stamps / name stamp (drawn above the scenes) ----------
  const STAMPS = [
    { t0: ev.nameStamp, text: 'NAPOLEON\nBONAPARTE', x: 500, y: 1010, size: 84, rot: -0.04, hold: 3.0 },
    { t0: ev.y1769, text: '1769', x: 360, y: 360, size: 150, rot: -0.06, hold: 2.1 },
    { t0: ev.y1793, text: '1793', x: 360, y: 360, size: 150, rot: -0.06, hold: 1.9 },
    { t0: ev.y1799, text: '1799', x: 360, y: 360, size: 150, rot: -0.06, hold: 2.3 },
    { t0: ev.y1804, text: '1804', x: 360, y: 360, size: 150, rot: 0.05, hold: 2.3 },
    { t0: ev.y1812, text: '1812', x: 360, y: 360, size: 150, rot: -0.06, hold: 2.3 },
    { t0: ev.y1815, text: '1815', x: 360, y: 360, size: 150, rot: -0.06, hold: 1.7 },
    { t0: ev.myth, text: 'MYTH', x: 790, y: 1040, size: 124, rot: -0.28, hold: 3.6, color: '#A3262A' },
  ];

  // ---------- captions: 2-3 word chunks, current word in gold ----------
  const SA = S.SAFE;
  function captions(ctx, t) {
    const c = S.captions.find((q) => t >= q.t - 0.02 && t < q.end);
    if (!c) return;
    const a = t - c.t;
    const size = 80;
    const gap = 22;
    const widths = c.words.map((w) => G.measure(ctx, w.w, size, 'Bungee', 400));
    let total = widths.reduce((p, q) => p + q, 0) + gap * (c.words.length - 1);
    const maxW = SA.w * 0.96;
    const k = Math.min(1, maxW / total);
    const cx = SA.x + SA.w / 2, y = 1360;
    const pop = a < 0.12 ? 0.82 + 0.18 * ease.outBack(a / 0.12, 2) : 1;
    ctx.save();
    ctx.translate(cx, y - size * 0.3); ctx.scale(k * pop, k * pop); ctx.translate(-cx, -(y - size * 0.3));
    let x = cx - total / 2;
    c.words.forEach((w, i) => {
      const cur = t >= w.t && (i === c.words.length - 1 || t < c.words[i + 1].t);
      G.text(ctx, w.w, x, y, { size, fam: 'Bungee', weight: 400, color: cur ? C.goldL : C.cream, stroke: C.ink, strokeW: 17, boil: 0, alpha: clamp((t - c.t + 0.02) / 0.04) * (1 - clamp((t - (c.end - 0.1)) / 0.1)) });
      x += widths[i] + gap;
    });
    ctx.restore();
  }

  // ---------- ink wipe between scenes ----------
  function wipe(ctx, t, tc, half = 0.1) {
    const d = t - tc;
    if (d < -half || d > half) return;
    const p = (d + half) / (2 * half);
    const cx = lerp(-0.75 * W, 1.75 * W, p), hw = 0.85 * W, sk = 0.35 * H;
    ctx.fillStyle = '#1B1511';
    ctx.beginPath(); ctx.moveTo(cx - hw + sk, 0); ctx.lineTo(cx + hw + sk, 0); ctx.lineTo(cx + hw - sk, H); ctx.lineTo(cx - hw - sk, H); ctx.closePath(); ctx.fill();
  }

  // ---------- end card ----------
  function endCard(ctx, t) {
    const a = clamp((t - ev.endCard) / 0.35);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    G.text(ctx, '60 SECONDS OF HISTORY', S.SAFE.x + S.SAFE.w / 2, 1462, { size: 38, fam: 'Bungee', weight: 400, color: C.goldL, align: 'center', stroke: C.ink, strokeW: 10, boil: 0 });
    ctx.restore();
  }

  Studio.film({
    duration: 60,
    fadeOut: 0,
    init: async () => { try { VO = await Studio.loadJSON('out/voice.json'); } catch (e) { VO = null; } },
    draw(ctx, t) {
      A.drain = 0;
      const sc = globalThis.SCN.find((s) => t >= s.t0 && t < s.t1) || globalThis.SCN[globalThis.SCN.length - 1];
      ctx.save();
      sc.draw(ctx, t, t - sc.t0);
      ctx.restore();
      // parchment texture over everything (multiply keeps the ink lines)
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5;
      ctx.drawImage(Studio.cache('paperTex', (c) => A.paper(c, W, H, { seed: 7, base: '#F6EEDA', edge: '#D9C79B' }), { variants: 1 }), 0, 0, W, H);
      ctx.restore();
      A.frame(ctx, W, H);
      // legibility band under the captions
      const bg = ctx.createLinearGradient(0, 1210, 0, 1500); bg.addColorStop(0, 'rgba(15,10,6,0)'); bg.addColorStop(0.55, 'rgba(15,10,6,0.2)'); bg.addColorStop(1, 'rgba(15,10,6,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 1210, W, 290);
      for (const s of STAMPS) A.stamp(ctx, t, s.t0, s.text, s);
      captions(ctx, t);
      endCard(ctx, t);
      for (const s of globalThis.SCN) if (s.t0 > 0.01) wipe(ctx, t, s.t0);
    },
    post: { paper: 0.35, vignette: 0.25, grain: 0.05 },
  });
})();
