// Scenes 6-7: the peak (Code Civil, Austerlitz, Europe turns blue) and Russia (the march east, Moscow burns, the winter retreat).
(function () {
  const G = globalThis.G, U = globalThis.U, A = globalThis.A, S = globalThis.SCORE;
  const { clamp, lerp, ease } = U;
  const C = A.C, H = U.hash, TAU = Math.PI * 2;
  const W = G.W, HH = G.H, ev = S.ev;
  const SCN = (globalThis.SCN = globalThis.SCN || []);
  const add = (id, t0, t1, draw) => SCN.push({ id, t0, t1, draw });
  const { vignette, glow, burst, star4 } = A;
  const K = (c, keep) => A.col(c, keep);

  // ======================================================= 6a. THE CODE CIVIL SLAMS SHUT
  add('book', ev.book - 0.3, ev.austerlitz, (ctx, t, u) => {
    A.paperBg(ctx, 'paper6', { seed: 6, base: '#EBDDB8' });
    const a = t - ev.book; // 0 = slam
    // rays + glow after the slam
    const ra = clamp(a / 0.4);
    if (ra > 0) {
      ctx.save(); ctx.translate(540, 820); ctx.rotate(t * 0.25);
      for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(212,165,58,${0.28 * ra})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 18) * 1300, Math.sin(i * TAU / 18) * 1300); ctx.lineTo(Math.cos((i + 0.5) * TAU / 18) * 1300, Math.sin((i + 0.5) * TAU / 18) * 1300); ctx.fill(); }
      ctx.restore();
      glow(ctx, 540, 820, 700, '255,214,110', 0.55 * ra * (0.85 + 0.15 * Math.sin(t * 6)));
    }
    const close = ease.inCubic(clamp((t - (ev.book - 0.3)) / 0.3)); // 0 open -> 1 closed
    const bounce = a > 0 ? 1 + 0.09 * Math.exp(-a * 9) * Math.cos(a * 30) : 1;
    ctx.save(); ctx.translate(540, 840); ctx.scale(bounce, 2 - bounce); ctx.translate(-540, -840);
    // shadow
    ctx.fillStyle = 'rgba(40,25,10,0.3)'; ctx.beginPath(); ctx.ellipse(540, 1240, 360, 40, 0, 0, TAU); ctx.fill();
    const hw = lerp(500, 270, close);
    if (close < 0.97) {
      A.fill(ctx, [[540 - hw - 20, 480], [540 + hw + 20, 480], [540 + hw + 20, 1190], [540 - hw - 20, 1190]], '#7C1A20', 6);
      for (const sd of [-1, 1]) {
        A.fill(ctx, [[540, 500], [540 + sd * hw, 500 - 14 * (1 - close)], [540 + sd * hw, 1170], [540, 1170]], C.cream, 4);
        for (let i = 0; i < 12; i++) A.stroke(ctx, [[540 + sd * 40, 560 + i * 48], [540 + sd * (hw - 50) * (0.6 + 0.4 * H(sd + 2, i, 1)), 560 + i * 48]], 'rgba(60,40,20,0.55)', 5);
      }
    } else {
      A.fill(ctx, [[540 - 290, 470], [540 + 290, 470], [540 + 290, 1200], [540 - 290, 1200]], '#8A1D24', 7);
      A.fill(ctx, [[540 - 290, 470], [540 - 262, 470], [540 - 262, 1200], [540 - 290, 1200]], '#5E1217', 0);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 7; ctx.strokeRect(540 - 252, 508, 504, 656); ctx.lineWidth = 3; ctx.strokeRect(540 - 236, 524, 472, 624);
      G.text(ctx, 'CODE', 540, 760, { size: 126, fam: 'Bungee', weight: 400, color: C.goldL, align: 'center', stroke: C.ink, strokeW: 16, boil: 0 });
      G.text(ctx, 'CIVIL', 540, 900, { size: 126, fam: 'Bungee', weight: 400, color: C.goldL, align: 'center', stroke: C.ink, strokeW: 16, boil: 0 });
      A.stroke(ctx, [[360, 960], [720, 960]], C.gold, 6);
      for (let i = 0; i < 5; i++) A.circ(ctx, 540 + (i - 2) * 56, 1040, 12, C.gold, 3);
    }
    ctx.restore();
    // shock lines, dust ring
    if (a > 0 && a < 0.6) {
      ctx.strokeStyle = `rgba(33,26,22,${0.55 * (1 - a / 0.6)})`; ctx.lineWidth = 8;
      for (let i = 0; i < 16; i++) { const ang = i * TAU / 16, r0 = 420 + a * 500, r1 = r0 + 110; ctx.beginPath(); ctx.moveTo(540 + Math.cos(ang) * r0, 840 + Math.sin(ang) * r0 * 0.9); ctx.lineTo(540 + Math.cos(ang) * r1, 840 + Math.sin(ang) * r1 * 0.9); ctx.stroke(); }
      for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(120,100,70,${0.6 * (1 - a / 0.6)})`; ctx.beginPath(); ctx.arc(540 + sd * (280 + a * 420 + i * 24), 1220 - i * 12 * a * 4, 26 + i * 6 + a * 40, 0, TAU); ctx.fill(); }
    }
    if (a > 0) for (let i = 0; i < 16; i++) star4(ctx, 540 + Math.cos(i * 2.4) * (230 + 190 * H(4, i, 1)), 820 + Math.sin(i * 2.4) * (260 + 120 * H(4, i, 2)) - ((t * 60 + i * 20) % 80), 12 + H(4, i, 3) * 16, `rgba(255,232,150,${0.9 * (0.5 + 0.5 * Math.sin(t * 5 + i))})`);
    vignette(ctx, 0.35, '60,40,15');
  });

  // ======================================================= 6b. AUSTERLITZ (fog, the sun, the charge up the hill)
  add('austerlitz', ev.austerlitz, ev.flood, (ctx, t, u) => {
    const sb = clamp((t - ev.sunBreaks + 0.3) / 1.2); // sun breaks through
    const g = ctx.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, A.mix('#8C9CB4', '#F2C97A', sb * 0.7)); g.addColorStop(1, A.mix('#CBC8BC', '#F7E2A8', sb)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    // sun
    const sx = 820, sy = 520;
    for (let i = 0; i < 20 && sb > 0; i++) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(i * TAU / 20 + t * 0.05); ctx.fillStyle = `rgba(255,236,170,${0.22 * sb})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -60); ctx.lineTo(1500, 60); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = A.mix('#E8E1CC', '#FFE49A', sb); ctx.beginPath(); ctx.arc(sx, sy, 90 + 20 * sb, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    // distant hills
    ctx.fillStyle = A.mix('#8E9484', '#7D8A5A', sb); ctx.beginPath(); ctx.moveTo(0, 900); ctx.quadraticCurveTo(300, 760, 620, 860); ctx.quadraticCurveTo(900, 930, W, 800); ctx.lineTo(W, 1300); ctx.lineTo(0, 1300); ctx.fill();
    // the slope the army climbs (left-low to right-high)
    const slopeY = (x) => 1520 - (x / W) * 520;
    const gg = ctx.createLinearGradient(0, 900, 0, HH); gg.addColorStop(0, A.mix('#7A8460', '#6E8A46', sb)); gg.addColorStop(1, A.mix('#4A5A36', '#3F6A2F', sb));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, slopeY(0)); ctx.lineTo(W, slopeY(W)); ctx.lineTo(W, HH); ctx.lineTo(0, HH); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    // enemy lines fleeing along the crest (grey-green, small), cannon smoke
    for (let i = 0; i < 12; i++) { const ex = 700 + i * 30 + (t - ev.austerlitz) * 18 * (i % 2 ? 1 : 0.6), ey = slopeY(ex) - 4 + (i % 3) * 8; if (ex < W + 30) A.soldier(ctx, { x: ex, y: ey, s: 0.5, pose: 'hunch', coat: '#9A9784', face: 1, ph: t * 1.4 + i * 0.2, lw: 2 }); }
    A.smoke(ctx, 880, slopeY(880) - 70, ((t * 0.6) % 1), 50, '200,196,186');
    // the French charge: three ranks surge up the hill
    const surge = (t - ev.austerlitz);
    const rows = [[0.0, 7, 0.78], [0.32, 8, 1.0], [0.62, 7, 1.35]];
    const all = [];
    rows.forEach(([off, n, sc], r) => { for (let i = 0; i < n; i++) { const p = clamp(((surge * 0.28 + off * 0.0) + i * 0.0)); const x = 90 + i * 118 + r * 28 + surge * 60 * (1 + r * 0.2), y = slopeY(x) + 120 + r * 85; all.push({ x, y, s: sc, i, r }); } });
    all.sort((a, b) => a.y - b.y).forEach((d) => A.soldier(ctx, { x: d.x, y: d.y, s: d.s * 1.1, pose: 'charge', ph: t * 2.3 + d.i * 0.17 + d.r * 0.3, lw: 3 }));
    A.flag(ctx, 250, slopeY(250) + 205, 330, t, { w: 150, hh: 100 });
    // golden eagle standard
    A.stroke(ctx, [[460, slopeY(460) + 262], [460, slopeY(460) - 130]], '#5B3F26', 8);
    A.fill(ctx, [[420, slopeY(460) - 120], [460, slopeY(460) - 150], [500, slopeY(460) - 120], [470, slopeY(460) - 134], [460, slopeY(460) - 100], [450, slopeY(460) - 134]], C.gold, 3.5);
    // fog bands slide away when the sun breaks
    for (let i = 0; i < 4; i++) {
      const away = ease.inOutQuad(clamp((t - ev.sunBreaks + 0.2 - i * 0.12) / 1.2)); const y = 780 + i * 130;
      ctx.fillStyle = `rgba(232,228,216,${0.72 * (1 - away * 0.9)})`; ctx.beginPath(); ctx.ellipse(540 + (i % 2 ? 1 : -1) * away * 700 + Math.sin(t * 0.7 + i) * 40, y, 760, 70, 0, 0, TAU); ctx.fill();
    }
    vignette(ctx, 0.3, '40,30,10');
  });

  // ======================================================= 6c. THE MAP OF EUROPE FLOODS BLUE
  add('flood', ev.flood, S.SC.russia, (ctx, t, u) => {
    A.paperBg(ctx, 'paper6c', { seed: 9, base: '#E8DAB5' });
    const blue = ease.inOutQuad(clamp(u / 1.1));
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1 + 0.05 * u, t });
    A.europeMap(ctx, { x: 10, y: 360, w: 1060, h: 940 }, { blue, land: '#DDCBA0', lw: 3 });
    ctx.restore();
    // ink wave along the edge of the flood
    vignette(ctx, 0.35, '40,25,10');
  });

  // ======================================================= 7a. THE ARMY MARCHES EAST (colours drain)
  const march = (ctx, t, u, camX) => {
    const dr = ease.inOutQuad(clamp((u - 0.2) / 2.4)); A.drain = dr;
    const sky = ctx.createLinearGradient(0, 0, 0, 1000); sky.addColorStop(0, K('#9DB4D6')); sky.addColorStop(1, K('#EAD9B0')); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HH);
    ctx.fillStyle = K('#D9C38A'); ctx.beginPath(); ctx.moveTo(0, 940); for (let i = 0; i <= 10; i++) ctx.lineTo(i * 110, 900 - 40 * Math.sin(i * 0.9 + camX * 0.002)); ctx.lineTo(W, HH); ctx.lineTo(0, HH); ctx.fill();
    const fg = ctx.createLinearGradient(0, 940, 0, HH); fg.addColorStop(0, K('#B89A52')); fg.addColorStop(1, K('#7A6232')); ctx.fillStyle = fg; ctx.fillRect(0, 960, W, HH);
    ctx.strokeStyle = 'rgba(30,20,10,0.25)'; ctx.lineWidth = 3; for (let i = 0; i < 20; i++) { const x = ((i * 130 - camX * 1.5) % (W + 130) + W + 130) % (W + 130) - 65; ctx.beginPath(); ctx.moveTo(x, 1000 + (i % 5) * 80); ctx.lineTo(x + 40, 1000 + (i % 5) * 80); ctx.stroke(); }
    // three layers of the column, walking right
    const layers = [[1060, 0.62, 16, 78], [1200, 0.95, 10, 120], [1420, 1.4, 6, 190]];
    layers.forEach(([y, sc, n, gap], li) => {
      for (let i = 0; i < n + 2; i++) {
        const x = ((i * gap + (u * (30 + li * 18)) ) % (n * gap)) - gap * 0.5 + li * 20;
        A.soldier(ctx, { x, y: y + Math.sin(i * 2.1) * 8, s: sc, pose: 'march', ph: u * 1.6 + i * 0.31, lw: 2.5 + li * 0.6, face: 1 });
      }
    });
    A.flag(ctx, 350, 1330, 330, t, { w: 140, hh: 92 });
    // marching dust
    for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(${A.drain > 0.5 ? '170,168,164' : '190,160,110'},${0.2 + 0.1 * H(1, i, 1)})`; ctx.beginPath(); ctx.arc((i * 83 + u * 25) % W, 1120 + (i % 4) * 90, 24 + (i % 3) * 8, 0, TAU); ctx.fill(); }
    vignette(ctx, 0.35 + 0.2 * dr, '30,30,34');
  };
  add('march', S.SC.russia, ev.moscow, (ctx, t, u) => march(ctx, t, u, u * 60));

  // ======================================================= 7b. MOSCOW BURNS
  add('moscow', ev.moscow, ev.winter, (ctx, t, u) => {
    A.drain = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, 1300); sky.addColorStop(0, '#2A1210'); sky.addColorStop(0.55, '#B8461C'); sky.addColorStop(1, '#F29A3A'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HH);
    glow(ctx, 540, 1050, 900, '255,170,60', 0.5 + 0.1 * Math.sin(t * 9));
    ctx.save(); A.cam(ctx, { cx: lerp(500, 580, u / 1.9), cy: HH / 2, zoom: 1 + 0.06 * (u / 1.9), t });
    // smoke columns
    for (let i = 0; i < 6; i++) for (let k = 0; k < 9; k++) { const p = ((t * 0.35 + k * 0.11 + i * 0.07) % 1); ctx.fillStyle = `rgba(30,18,16,${0.55 * (1 - p)})`; ctx.beginPath(); ctx.arc(190 + i * 140 + Math.sin(p * 6 + i) * 40 + p * 90, 1000 - p * 760, 50 + p * 90, 0, TAU); ctx.fill(); }
    // skyline: towers + onion domes
    ctx.fillStyle = '#120A0A';
    const tower = (x, w, h, dome) => { ctx.fillRect(x - w / 2, 1100 - h, w, h + 400); if (dome) { ctx.beginPath(); ctx.moveTo(x - w * 0.62, 1100 - h); ctx.bezierCurveTo(x - w * 0.9, 1100 - h - w * 0.9, x - 4, 1100 - h - w * 0.9, x, 1100 - h - w * 1.5); ctx.bezierCurveTo(x + 4, 1100 - h - w * 0.9, x + w * 0.9, 1100 - h - w * 0.9, x + w * 0.62, 1100 - h); ctx.fill(); ctx.fillRect(x - 2, 1100 - h - w * 1.9, 4, w * 0.5); } else { ctx.beginPath(); ctx.moveTo(x - w / 2, 1100 - h); ctx.lineTo(x, 1100 - h - w); ctx.lineTo(x + w / 2, 1100 - h); ctx.fill(); } };
    [[110, 90, 260, 1], [260, 70, 190, 0], [400, 110, 330, 1], [560, 60, 220, 0], [690, 100, 300, 1], [830, 80, 210, 1], [960, 70, 260, 0], [1040, 90, 180, 1]].forEach(([x, w, h, d]) => tower(x, w, h, d));
    ctx.fillRect(-50, 1100, W + 100, 420);
    // flames leaping up from behind the roofs
    for (let i = 0; i < 26; i++) {
      const x = 40 + i * 42 + Math.sin(t * 4 + i) * 6, h = 110 + 150 * H(3, i, 1) * (0.7 + 0.3 * Math.sin(t * 11 + i * 2)), base = 1110;
      ctx.fillStyle = i % 2 ? '#F58A1F' : '#E0541A'; ctx.beginPath(); ctx.moveTo(x - 28, base); ctx.quadraticCurveTo(x - 22, base - h * 0.5, x + Math.sin(t * 9 + i) * 10, base - h); ctx.quadraticCurveTo(x + 22, base - h * 0.5, x + 28, base); ctx.fill();
      ctx.fillStyle = '#FFD25A'; ctx.beginPath(); ctx.moveTo(x - 12, base); ctx.quadraticCurveTo(x - 8, base - h * 0.3, x, base - h * 0.55); ctx.quadraticCurveTo(x + 8, base - h * 0.3, x + 12, base); ctx.fill();
    }
    for (let i = 0; i < 40; i++) { const p = ((t * 0.9 + H(6, i, 1)) % 1); ctx.fillStyle = `rgba(255,210,100,${1 - p})`; ctx.fillRect(H(6, i, 2) * W + Math.sin(p * 8 + i) * 30, 1080 - p * 800, 4, 4); }
    // the army, in grey silhouette, watching from the plain
    for (let i = 0; i < 12; i++) A.soldier(ctx, { x: 60 + i * 95 + (i % 2) * 20, y: 1500 + (i % 3) * 40, s: 1.25 + (i % 3) * 0.15, pose: 'stand', coat: '#171112', hat: true, plume: '#171112', lw: 2 });
    ctx.restore();
    vignette(ctx, 0.6, '10,0,0');
  });

  // ======================================================= 7c. THE WINTER RETREAT
  add('retreat', ev.winter, S.SC.elba, (ctx, t, u) => {
    A.drain = 1;
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#9AA2AA'); g.addColorStop(1, '#D6DADC'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.fillStyle = '#C9CED1'; ctx.beginPath(); ctx.moveTo(0, 1000); for (let i = 0; i <= 8; i++) ctx.lineTo(i * 140, 960 + 40 * Math.sin(i * 1.3)); ctx.lineTo(W, HH); ctx.lineTo(0, HH); ctx.fill();
    ctx.fillStyle = '#E9ECEE'; ctx.fillRect(0, 1060, W, HH);
    // bare trees
    for (let i = 0; i < 6; i++) { const x = 90 + i * 190, h = 280 + 90 * H(2, i, 1); A.stroke(ctx, [[x, 1070], [x, 1070 - h]], '#3E3E40', 10); for (let b = 0; b < 4; b++) A.stroke(ctx, [[x, 1070 - h * (0.4 + b * 0.15)], [x + (b % 2 ? 60 : -60), 1070 - h * (0.5 + b * 0.15) - 40]], '#3E3E40', 6); }
    // the retreating column, hunched, walking west (left)
    const ex = (t - ev.winter);
    for (let i = 0; i < 9; i++) { const x = ((i * 135 - ex * 42) % 1300 + 1300) % 1300 - 100 + 60; A.soldier(ctx, { x, y: 1300 + (i % 3) * 70, s: 1.35 + (i % 3) * 0.2, pose: 'hunch', ph: t * 0.9 + i * 0.4, face: -1, coat: '#62636A', lw: 3 }); }
    // the fallen, half-buried
    for (let i = 0; i < 3; i++) { const x = 220 + i * 330, y = 1500 + (i % 2) * 60; A.soldier(ctx, { x, y, s: 1.4, pose: 'fall', ph: 1, coat: '#62636A', lw: 3 }); ctx.fillStyle = 'rgba(240,244,246,0.9)'; ctx.beginPath(); ctx.ellipse(x + 40, y - 4, 90, 24, 0, 0, TAU); ctx.fill(); }
    A.flag(ctx, 800, 1600, 300, t * 0.5, { w: 120, hh: 80 });
    // blizzard
    for (let i = 0; i < 160; i++) { const sp = 160 + 240 * H(8, i, 1), x = ((H(8, i, 2) * (W + 400) - t * 380 * (0.6 + H(8, i, 3)) ) % (W + 400) + W + 400) % (W + 400) - 100, y = ((H(8, i, 4) * HH + t * sp) % HH); ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * H(8, i, 5)})`; ctx.beginPath(); ctx.arc(x, y, 2 + 4 * H(8, i, 6), 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(235,240,244,0.22)'; ctx.fillRect(0, 0, W, HH);
    // inset: the blue on the map shrinks back
    const sh = ease.inOutQuad(clamp((t - ev.winter - 0.2) / 2.0));
    ctx.save(); ctx.translate(60, 262); A.paper; ctx.fillStyle = 'rgba(240,226,190,0.95)'; ctx.fillRect(0, 0, 420, 380); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.strokeRect(0, 0, 420, 380); ctx.restore();
    A.drain = 0;
    A.europeMap(ctx, { x: 66, y: 268, w: 408, h: 368 }, { blue: 1, shrink: sh, land: '#D6C39A', lw: 1.6 });
    vignette(ctx, 0.4, '30,35,40');
  });
})();
