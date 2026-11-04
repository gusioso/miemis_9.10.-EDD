// Scenes 1-5: title, about, origins, Toulon, power. Each entry: { id, t0, t1, draw(ctx, t, u) } with u = seconds into the scene.
(function () {
  const G = globalThis.G, U = globalThis.U, A = globalThis.A, S = globalThis.SCORE;
  const { clamp, lerp, ease } = U;
  const C = A.C, H = U.hash, TAU = Math.PI * 2;
  const W = G.W, HH = G.H;
  const ev = S.ev;
  const SCN = (globalThis.SCN = globalThis.SCN || []);
  const add = (id, t0, t1, draw) => SCN.push({ id, t0, t1, draw });
  const K = (c) => A.col(c);

  const paperBg = (ctx, key, o) => ctx.drawImage(Studio.cache(key, (c) => A.paper(c, W, HH, o), { variants: 1 }), 0, 0, W, HH);
  const vignette = (ctx, a = 0.5, col = '0,0,0') => {
    const g = ctx.createRadialGradient(W / 2, HH / 2, HH * 0.28, W / 2, HH / 2, HH * 0.78);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
  };
  const glow = (ctx, x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  };
  const A2 = globalThis.A;
  A2.paperBg = paperBg; A2.vignette = vignette; A2.glow = glow;

  // ======================================================= 1. TITLE (0-4)
  add('title', 0, 4.0, (ctx, t, u) => {
    paperBg(ctx, 'paper1', { seed: 1 });
    const hit = ev.title, a = t - hit;
    // sunburst
    ctx.save(); ctx.translate(W / 2, 800); ctx.rotate(t * 0.12);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(212,165,58,0.20)' : 'rgba(212,165,58,0.07)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 24) * 1500, Math.sin(i * TAU / 24) * 1500); ctx.lineTo(Math.cos((i + 1) * TAU / 24) * 1500, Math.sin((i + 1) * TAU / 24) * 1500); ctx.fill();
    }
    ctx.restore();
    const shk = a > 0 ? 16 * Math.exp(-a * 7) : 0;
    ctx.save();
    A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1 + 0.035 * u, shakeA: shk, t });
    // ink splash behind the letters
    const sp = ease.outCubic(clamp(a / 0.16 + 0.5));
    ctx.fillStyle = C.ink; ctx.beginPath();
    for (let i = 0; i < 44; i++) {
      const ang = i / 44 * TAU, r = (i % 2 ? 330 : 470) * (0.75 + H(5, i, 1) * 0.5) * sp;
      const px = W / 2 + Math.cos(ang) * r * 1.05, py = 800 + Math.sin(ang) * r * 0.9;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { const ang = H(6, i, 1) * TAU, d = (480 + H(6, i, 2) * 300) * sp, r = 4 + H(6, i, 3) * 12; ctx.beginPath(); ctx.arc(W / 2 + Math.cos(ang) * d, 800 + Math.sin(ang) * d * 0.85, r, 0, TAU); ctx.fill(); }
    // laurel wreath draws on behind the letters
    const wr = clamp((u - 1.5) / 1.5);
    for (let i = 0; i < 20; i++) {
      const k = i / 19; if (k > wr) continue;
      const ang = lerp(Math.PI * 0.52, Math.PI * 1.5, k);
      for (const sd of [-1, 1]) {
        const px = W / 2 + sd * Math.sin(ang * 0.5 + 0.0) * 0 + sd * Math.cos(ang - Math.PI / 2 + 0.0) * 0 + sd * 430 * Math.sin((ang - Math.PI * 0.5) * 0.99 + 0.0) * 1, py = 800 - 500 * Math.cos((ang - Math.PI * 0.5) * 0.99);
        ctx.save(); ctx.translate(px, py + 120); ctx.rotate(sd * (0.4 + k * 2.6)); ctx.beginPath(); ctx.ellipse(0, 0, 40, 14, 0, 0, TAU); ctx.fillStyle = i % 2 ? C.gold : C.goldL; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
      }
    }
    // gold stamped letters
    const sc = lerp(1.32, 1, ease.outCubic(clamp((a + 0.1) / 0.2)));
    const rows = [['60', 420, 760], ['SECONDS', 138, 915], ['OF HISTORY', 104, 1030]];
    const TX = 500;
    ctx.translate(W / 2, 800); ctx.scale(sc, sc); ctx.translate(-W / 2, -800);
    for (const [str, size, y] of rows) {
      G.text(ctx, str, TX + 6, y + 12, { size, fam: 'Bungee', weight: 400, color: C.goldD, align: 'center', stroke: C.ink, strokeW: size * 0.2, boil: 0 });
      G.text(ctx, str, TX, y, { size, fam: 'Bungee', weight: 400, color: C.goldL, align: 'center', boil: 0 });
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - size, W, size * 0.52); ctx.clip();
      G.text(ctx, str, TX, y, { size, fam: 'Bungee', weight: 400, color: C.gold, align: 'center', boil: 0 }); ctx.restore();
    }
    ctx.restore();
    // tricolour band slides in at the bottom
    const bd = ease.outCubic(clamp((u - 2.2) / 0.5));
    if (bd > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 1190, W * bd, 70); ctx.clip();
      [C.blue, C.cream, C.red].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(110 + i * 287, 1190, 287, 70); });
      ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.strokeRect(110, 1190, 861, 70); ctx.restore();
    }
    vignette(ctx, 0.35, '60,40,15');
  });

  // ======================================================= 2. WHAT IT'S ABOUT (4-8): silhouette + map blue -> cracks -> crumbles
  add('about', 4.0, 8.0, (ctx, t, u) => {
    paperBg(ctx, 'paper2', { seed: 2, base: '#E2D3AB' });
    const blue = ease.inOutQuad(clamp((u - 0.35) / 2.7));
    const crack = clamp((t - ev.mapCrack) / 0.28);
    const crumble = ease.inQuad(clamp((t - ev.mapCrack - 0.12) / 0.5));
    ctx.save();
    A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1.0 + 0.02 * u, shakeA: crack > 0 && crumble < 0.8 ? 7 : 0, t });
    A.europeMap(ctx, { x: 10, y: 360, w: 1060, h: 940 }, { blue, crack, crumble, land: '#DDCBA0' });
    // the silhouette: bicorne, face-less, filling the frame
    ctx.globalAlpha = 0.97;
    A.nap(ctx, { x: W / 2, y: 1960 + (1 - ease.outCubic(clamp(u / 0.5))) * 150, s: 2.3, sil: '#1B1613', rim: '#6E8CC8', shadow: false, arms: 'vest' });
    ctx.restore();
    vignette(ctx, 0.45, '40,25,10');
  });

  // ======================================================= 3a. CORSICA (8 - school cut)
  const CORSICA = [[9.33, 43.0], [9.46, 42.88], [9.56, 42.55], [9.51, 42.16], [9.4, 41.86], [9.28, 41.5], [9.18, 41.37], [9.0, 41.4], [8.78, 41.58], [8.62, 41.9], [8.55, 42.1], [8.62, 42.26], [8.72, 42.42], [8.9, 42.56], [9.2, 42.72]];
  add('corsica', 8.0, ev.school, (ctx, t, u) => {
    paperBg(ctx, 'paper3', { seed: 3 });
    const dur = ev.school - 8.0;
    ctx.save();
    const z = lerp(1.0, 2.1, ease.inOutCubic(clamp(u / dur)));
    // map centre -> Corsica (computed from the projection)
    const box = { x: 20, y: 300, w: 1040, h: 980 };
    const map = Data.map({ region: [4.2, 38.4, 13.8, 46.0], x: box.x, y: box.y, w: box.w, h: box.h, pad: 0 });
    const cp = map.proj(9.05, 42.2);
    A.cam(ctx, { cx: lerp(W / 2, cp[0], ease.inOutCubic(clamp(u / dur))), cy: lerp(790, cp[1] + 30, ease.inOutCubic(clamp(u / dur))), zoom: z });
    ctx.fillStyle = '#B9C7CC'; ctx.fillRect(-400, -400, W + 800, HH + 800);
    A.europeMap(ctx, box, { region: [4.2, 38.4, 13.8, 46.0], blue: 0, land: '#E4D3A8', sea: null, lw: 3 });
    // sea ripples
    ctx.strokeStyle = 'rgba(60,90,110,0.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) { const x = 140 + H(9, i, 1) * 780, y = 350 + H(9, i, 2) * 880 + Math.sin(t * 2 + i) * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 22, y - 9, x + 44, y); ctx.quadraticCurveTo(x + 66, y + 9, x + 88, y); ctx.stroke(); }
    // Corsica itself, in gold
    const pts = CORSICA.map(([lo, la]) => map.proj(lo, la));
    A.shape(ctx, pts, C.gold, { lw: 5, seed: 31, hatch: { color: 'rgba(60,40,10,0.22)', gap: 8 } });
    // pulsing marker
    const pr = (u * 1.3) % 1;
    ctx.strokeStyle = `rgba(163,38,42,${1 - pr})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cp[0] + 6, cp[1] - 8, 20 + pr * 60, 0, TAU); ctx.stroke();
    A.circ(ctx, cp[0] + 6, cp[1] - 8, 11, C.red, 4);
    ctx.restore();
    // label (screen space)
    const lp = ease.outBack(clamp((u - 0.5) / 0.35), 2);
    G.text(ctx, 'CORSICA', W / 2, 1160, { size: 98 * lp, fam: 'Bungee', weight: 400, color: C.cream, align: 'center', stroke: C.ink, strokeW: 20, boil: 0 });
    vignette(ctx, 0.4, '40,25,10');
  });

  // ======================================================= 3b. MILITARY SCHOOL (school cut - 13)
  add('school', ev.school, S.SC.toulon, (ctx, t, u) => {
    // stone hall
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#9A8F7A'); g.addColorStop(1, '#6C6252'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 3;
    for (let r = 0; r < 14; r++) { const y = 230 + r * 62; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let c = 0; c < 8; c++) { const x = (c * 150 + (r % 2) * 75) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 62); ctx.stroke(); } }
    // arched window with light shaft
    ctx.fillStyle = '#EAD9A0'; ctx.beginPath(); ctx.moveTo(110, 760); ctx.lineTo(110, 460); ctx.arc(250, 460, 140, Math.PI, 0); ctx.lineTo(390, 760); ctx.closePath(); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(250, 320); ctx.lineTo(250, 760); ctx.moveTo(110, 560); ctx.lineTo(390, 560); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#FFF3C0'; ctx.beginPath(); ctx.moveTo(110, 760); ctx.lineTo(390, 760); ctx.lineTo(860, 1500); ctx.lineTo(380, 1500); ctx.closePath(); ctx.fill(); ctx.restore();
    // banner
    A.fill(ctx, [[640, 300], [900, 300], [900, 700], [770, 640], [640, 700]], C.blueD, 5);
    for (const [bx, by] of [[705, 380], [835, 380], [770, 470], [705, 560], [835, 560]]) A.circ(ctx, bx, by, 15, C.gold, 3);
    // floor
    const fg = ctx.createLinearGradient(0, 1240, 0, HH); fg.addColorStop(0, '#6E5638'); fg.addColorStop(1, '#46341F'); ctx.fillStyle = fg; ctx.fillRect(0, 1240, W, HH - 1240);
    ctx.strokeStyle = 'rgba(20,12,5,0.5)'; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 150 - 100, 1240); ctx.lineTo(i * 220 - 400, HH); ctx.stroke(); }
    ctx.save();
    A.cam(ctx, { cx: lerp(W / 2, 520, clamp(u / 2.7)), cy: lerp(HH / 2, 950, clamp(u / 2.7)), zoom: lerp(1.0, 1.22, ease.inOutQuad(clamp(u / 2.7))) });
    const mockT = ev.mock - ev.school;
    const lau = clamp((u - 0.35) / 0.4);
    const ps = (i) => Math.sin(u * 22 + i * 1.7);
    // the three bullies
    A.boy(ctx, { x: 190, y: 1330, s: 1.5, coat: '#4B5675', pose: 'point', laugh: lau, t: u + 1, hair: '#5A3A22', flip: false });
    A.boy(ctx, { x: 910, y: 1340, s: 1.55, coat: '#4B5675', pose: 'point', laugh: lau, t: u + 2, hair: '#1E1612', flip: true });
    A.boy(ctx, { x: 790, y: 1255, s: 1.15, coat: '#5B6684', pose: 'point', laugh: lau, t: u + 3, hair: '#7A5430', flip: true });
    // young Napoleon: smaller, apart, head down
    A.boy(ctx, { x: 520, y: 1370, s: 1.25, coat: C.blueD, pose: 'cower', hair: '#2D2019', skin: '#CFA079' });
    // laughter marks + speech
    for (let i = 0; i < 3; i++) {
      const px = [250, 800, 700][i], py = [905, 920, 900][i], wob = Math.sin(u * 14 + i) * 6;
      const k = ease.outBack(clamp((u - 0.3 - i * 0.12) / 0.2), 2.4);
      G.text(ctx, 'HA!', px + wob, py - 40 * (1 - k), { size: 78 * k, fam: 'Bungee', weight: 400, color: C.cream, align: 'center', stroke: C.ink, strokeW: 14, boil: 0, alpha: lau });
    }
    // a bubble full of mocking squiggles (his accent)
    const bk = ease.outBack(clamp((mockT + 0.0 - (ev.mock - ev.school) + u - mockT) / 0.3), 2);
    if (u > 0.25) {
      const bs = ease.outBack(clamp((u - 0.25) / 0.3), 2);
      ctx.save(); ctx.translate(560, 720); ctx.scale(bs, bs);
      A.fill(ctx, [[-170, -90], [170, -90], [170, 50], [60, 50], [30, 110], [10, 50], [-170, 50]], C.cream, 5);
      A.stroke(ctx, Array.from({ length: 13 }, (_, i) => [-135 + i * 22, -20 + Math.sin(i * 1.9 + u * 8) * 22]), C.ink, 6);
      ctx.restore();
    }
    ctx.restore();
    vignette(ctx, 0.55, '15,10,5');
  });
})();
