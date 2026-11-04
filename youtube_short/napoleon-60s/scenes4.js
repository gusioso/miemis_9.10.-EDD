// Scenes 8-11: Elba, the return, Waterloo + Saint Helena, and the twist (the height chart and the caricature).
(function () {
  const G = globalThis.G, U = globalThis.U, A = globalThis.A, S = globalThis.SCORE;
  const { clamp, lerp, ease } = U;
  const C = A.C, H = U.hash, TAU = Math.PI * 2;
  const W = G.W, HH = G.H, ev = S.ev;
  const SCN = (globalThis.SCN = globalThis.SCN || []);
  const add = (id, t0, t1, draw) => SCN.push({ id, t0, t1, draw });
  const { vignette, glow, burst, star4 } = A;
  const tag = (ctx, str, x, y, size = 54, a = 1) => G.text(ctx, str, x, y, { size, fam: 'Bungee', weight: 400, color: C.cream, align: 'center', stroke: C.ink, strokeW: size * 0.22, boil: 0, alpha: a });

  // ======================================================= 8. ELBA: alone, silence, waves
  add('elba', S.SC.elba, S.SC.ret, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#7C8DA3'); g.addColorStop(0.7, '#C8CAC6'); g.addColorStop(1, '#E9D2B0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
    ctx.fillStyle = '#F0DDB5'; ctx.beginPath(); ctx.arc(780, 760, 70, 0, TAU); ctx.fill(); glow(ctx, 780, 760, 340, '255,220,160', 0.35);
    const sg = ctx.createLinearGradient(0, 850, 0, 1320); sg.addColorStop(0, '#7F9DB0'); sg.addColorStop(1, '#3E6178'); ctx.fillStyle = sg; ctx.fillRect(0, 850, W, 470);
    ctx.strokeStyle = 'rgba(235,245,250,0.4)'; ctx.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const y = 880 + i * 17 + Math.sin(t * 1.2 + i) * 3, x0 = (i * 211 + t * 12 * (1 + i % 3)) % (W + 100) - 80; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + 26, y - 6, x0 + 52, y); ctx.stroke(); }
    // the beach
    const sand = ctx.createLinearGradient(0, 1260, 0, HH); sand.addColorStop(0, '#DCC590'); sand.addColorStop(1, '#B89B66'); ctx.fillStyle = sand;
    ctx.beginPath(); ctx.moveTo(0, 1290); ctx.bezierCurveTo(260, 1240, 640, 1330, W, 1270); ctx.lineTo(W, HH); ctx.lineTo(0, HH); ctx.fill();
    // waves lapping
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.45 + k / 3) % 1), y = 1262 + ph * 70; ctx.strokeStyle = `rgba(250,252,255,${0.85 * (1 - ph)})`; ctx.lineWidth = 6 - ph * 3; ctx.beginPath(); ctx.moveTo(0, y + 22); ctx.bezierCurveTo(260, y - 28, 640, y + 36, W, y - 6); ctx.stroke(); }
    // far island hint
    ctx.fillStyle = '#8E9AA0'; ctx.beginPath(); ctx.moveTo(0, 870); ctx.quadraticCurveTo(160, 790, 360, 870); ctx.fill();
    // Napoleon, small and alone, looking out to sea (from behind)
    A.nap(ctx, { x: 420, y: 1300, s: 0.6, sil: '#1B1C26', view: 'back', arms: 'behind', shadow: false });
    ctx.fillStyle = 'rgba(40,30,20,0.25)'; ctx.beginPath(); ctx.ellipse(500, 1312, 190, 14, 0, 0, TAU); ctx.fill();
    // one gull
    const gx = 700 - u * 40, gy = 560 + Math.sin(u * 2) * 20, fl = Math.sin(t * 7) * 14; A.stroke(ctx, [[gx - 30, gy - fl], [gx, gy], [gx + 30, gy - fl]], '#2A2A30', 5);
    tag(ctx, 'ELBA', 540, 420, 76, ease.outCubic(clamp(u / 0.5)));
    vignette(ctx, 0.4, '20,25,35');
  });
  SCN.find((s) => s.id === 'elba').draw = ((d) => (ctx, t, u) => { ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1 + 0.06 * (u / 2), t }); d(ctx, t, u); ctx.restore(); })(SCN.find((s) => s.id === 'elba').draw);

  // ======================================================= 9a. THE ESCAPE BY BOAT
  add('boat', S.SC.ret, ev.alps, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#0A1030'); g.addColorStop(0.55, '#2B3F6E'); g.addColorStop(1, '#0E1A33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,245,210,${0.3 + 0.5 * H(3, i, 1)})`; ctx.beginPath(); ctx.arc(H(3, i, 2) * W, H(3, i, 3) * 800, 1.5 + 2 * H(3, i, 4), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#F2EBCB'; ctx.beginPath(); ctx.arc(250, 380, 80, 0, TAU); ctx.fill(); glow(ctx, 250, 380, 460, '240,235,200', 0.3);
    ctx.strokeStyle = 'rgba(200,220,255,0.18)'; ctx.lineWidth = 3; for (let i = 0; i < 24; i++) { const y = 940 + i * 28, x0 = (i * 157 - t * 60) % (W + 100); ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + 30, y - 8, x0 + 60, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,245,200,0.12)'; ctx.beginPath(); ctx.moveTo(200, 960); ctx.lineTo(300, 960); ctx.lineTo(430, HH); ctx.lineTo(80, HH); ctx.fill();
    ctx.save(); ctx.translate(560, 1180); ctx.rotate(Math.sin(t * 2.4) * 0.05 + 0.02); ctx.translate(-560, -1180 + Math.sin(t * 3) * 8);
    A.fill(ctx, [[280, 1120], [860, 1120], [790, 1230], [350, 1240]], '#3A2A1C', 5);
    A.stroke(ctx, [[560, 1120], [560, 560]], '#3A2A1C', 10);
    A.fill(ctx, [[570, 580], [800, 1090], [570, 1090]], '#EDE3C6', 5); A.fill(ctx, [[550, 620], [360, 1090], [550, 1090]], '#E0D4B2', 5);
    A.nap(ctx, { x: 400, y: 1122, s: 0.34, sil: '#12131C', view: 'front', arms: 'vest', shadow: false });
    ctx.restore();
    for (let i = 0; i < 5; i++) { const p = (t * 0.6 + i * 0.2) % 1; ctx.strokeStyle = `rgba(240,248,255,${0.7 * (1 - p)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(260 + i * 130, 1260 + p * 30); ctx.quadraticCurveTo(300 + i * 130, 1236, 340 + i * 130, 1260 + p * 30); ctx.stroke(); }
    vignette(ctx, 0.5, '0,0,15');
  });

  // ======================================================= 9b-e. THE ALPS: the line of muskets, the walk, "here I am", the hats
  const alpsBg = (ctx, sky = ['#7E94B8', '#DDE4EC'], snow = '#F2F5F8') => {
    const g = ctx.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    const peak = (x, y, w, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w, 1100); ctx.lineTo(x - w * 0.15, y + 60); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.2, y + 70); ctx.lineTo(x + w, 1100); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(x - w * 0.3, y + 160); ctx.lineTo(x - w * 0.15, y + 60); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.2, y + 70); ctx.lineTo(x + w * 0.34, y + 190); ctx.lineTo(x + w * 0.1, y + 150); ctx.lineTo(x - w * 0.1, y + 200); ctx.closePath(); ctx.fill(); };
    peak(160, 560, 420, '#6F7F96'); peak(880, 520, 460, '#5F6E88'); peak(520, 640, 380, '#7C8BA2');
    const gr = ctx.createLinearGradient(0, 1050, 0, HH); gr.addColorStop(0, '#F3F5F7'); gr.addColorStop(1, '#C9CED6'); ctx.fillStyle = gr; ctx.fillRect(0, 1060, W, HH);
    ctx.fillStyle = '#B9A98C'; ctx.beginPath(); ctx.moveTo(440, 1060); ctx.lineTo(640, 1060); ctx.lineTo(1000, HH); ctx.lineTo(80, HH); ctx.closePath(); ctx.fill(); // the road
  };
  add('alps', ev.alps, ev.walk, (ctx, t, u) => {
    alpsBg(ctx);
    ctx.save(); A.cam(ctx, { cx: lerp(560, 600, u / 1.8), cy: HH / 2, zoom: 1 + 0.04 * (u / 1.8), t });
    // the line of soldiers, muskets rising to aim, stretched across the road at the right
    for (let i = 0; i < 9; i++) { const x = 600 + (i % 3) * 120 + Math.floor(i / 3) * 40, y = 1180 + Math.floor(i / 3) * 110, rise = clamp((t - ev.alps - 0.2 - i * 0.04) / 0.35); A.soldier(ctx, { x, y, s: 0.9 + Math.floor(i / 3) * 0.2, pose: rise > 0.5 ? 'aim' : 'march', face: -1, ph: 0.3, lw: 3 }); }
    A.flag(ctx, 940, 1290, 360, t, { w: 120, hh: 80 });
    // Napoleon, alone, small, on the road, walking toward them
    A.nap(ctx, { x: 250, y: 1330, s: 0.52, arms: 'vest', walk: (t - ev.alps) * 4.0, shadow: true });
    vignette(ctx, 0.3, '20,25,40');
    ctx.restore();
  });
  add('walk', ev.walk, 45.15, (ctx, t, u) => {
    alpsBg(ctx, ['#6F86AC', '#CED8E4']);
    ctx.save(); A.cam(ctx, { cx: lerp(380, 560, u / 1.4), cy: HH / 2, zoom: 1.12, t });
    for (let i = 0; i < 6; i++) A.soldier(ctx, { x: 760 + (i % 2) * 160 + (i >> 1) * 40, y: 1260 + (i >> 1) * 110, s: 1.35 + (i >> 1) * 0.18, pose: 'aim', face: -1, ph: 0.3, lw: 3.5 });
    A.nap(ctx, { x: 300 + u * 90, y: 1400, s: 1.0, arms: 'vest', walk: (t - ev.walk) * 5.0, mouth: 0 });
    vignette(ctx, 0.3, '20,25,40');
    ctx.restore();
  });
  add('here', 45.15, ev.lower, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#2B3550'); g.addColorStop(1, '#8794AD'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#46536F', '#566581', '#6C7C98'][i]; ctx.beginPath(); ctx.moveTo(-50 + i * 300, 1100); ctx.lineTo(200 + i * 300, 640 - i * 40); ctx.lineTo(480 + i * 300, 1100); ctx.fill(); }
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: 1000, zoom: lerp(1.0, 1.1, u / 2.3), t });
    glow(ctx, 540, 1000, 700, '255,235,190', 0.22);
    // musket barrels and bayonets pointing at him from both sides
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const x0 = 540 + sd * (560 + k * 40), y0 = 1500 + k * 90, x1 = 540 + sd * (200 + k * 55), y1 = 1050 + k * 55; A.stroke(ctx, [[x0, y0], [x1 + sd * 90, y1 + 40]], '#6B4A2E', 18); A.stroke(ctx, [[x1 + sd * 90, y1 + 40], [x1, y1]], '#DADADA', 9); }
    A.nap(ctx, { x: 540, y: 1900, s: 1.7, arms: 'wide', mouth: clamp(A.mouthAt(t) * 1.6), shadow: false });
    ctx.restore();
    vignette(ctx, 0.55, '5,8,20');
  });
  const hatsAt = (ctx, cx, cy, t) => { // shakos and hats flying up
    const a = t - ev.hats; if (a < 0) return;
    for (let i = 0; i < 26; i++) {
      const x0 = 70 + H(2, i, 1) * 940, y0 = 1180 + H(2, i, 2) * 200, vx = (H(2, i, 3) - 0.5) * 380, vy = -(620 + 520 * H(2, i, 4)), tt = Math.max(0, a - H(2, i, 5) * 0.15);
      const x = x0 + vx * tt, y = y0 + vy * tt + 900 * tt * tt, rot = (H(2, i, 6) - 0.5) * 12 * tt;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      if (i % 3 === 0) { A.fill(ctx, [[-44, 0], [-20, -24], [0, -30], [20, -24], [44, 0], [24, 8], [-24, 8]], '#25201E', 3); A.circ(ctx, 18, -12, 7, C.red, 2); }
      else { A.fill(ctx, [[-14, 0], [14, 0], [16, -42], [-16, -42]], '#211B18', 3); A.fill(ctx, [[-14, -4], [14, -4], [14, -10], [-14, -10]], C.gold, 1.5); A.circ(ctx, 0, -48, 5, C.red, 2); }
      ctx.restore();
    }
  };
  add('hats', ev.lower, S.SC.end, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#6E8AC0'); g.addColorStop(1, '#E9E1C8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    const sun = clamp(u / 0.5);
    ctx.save(); ctx.translate(540, 850); ctx.rotate(t * 0.15); for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,230,150,${0.25 * sun})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 20) * 1400, Math.sin(i * TAU / 20) * 1400); ctx.lineTo(Math.cos((i + 0.5) * TAU / 20) * 1400, Math.sin((i + 0.5) * TAU / 20) * 1400); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#F3F5F7'; ctx.fillRect(0, 1180, W, HH); 
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1, shakeA: 0, t });
    const cheer = t >= ev.hats;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const x = 80 + i * 175 + (r % 2) * 80 + (i > 2 ? 0 : 0), y = 1260 + r * 120;
      if (Math.abs(x - 540) < 110 && r === 0) continue;
      A.soldier(ctx, { x, y, s: 1.2 + r * 0.14, pose: cheer ? 'cheer' : 'stand', hat: !cheer, v: t * 1.0 + i, ph: 0.1, lw: 3.2 });
    }
    A.nap(ctx, { x: 540, y: 1390, s: 0.95, arms: 'vest', shadow: true });
    hatsAt(ctx, 0, 0, t);
    ctx.restore();
    vignette(ctx, 0.25, '40,40,50');
  });

  // ======================================================= 10a. WATERLOO (1815): rain, smoke, the line breaks
  add('waterloo', S.SC.end, ev.helena, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#3C423F'); g.addColorStop(0.55, '#7C8176'); g.addColorStop(1, '#4A4636'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.fillStyle = '#4C4A3A'; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.quadraticCurveTo(540, 940, W, 1010); ctx.lineTo(W, HH); ctx.lineTo(0, HH); ctx.fill();
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1 + 0.05 * (u / 2.7), shakeA: u > 0.9 && u < 1.4 ? 6 : 0, t });
    // the French line, firing, then breaking
    const rows = [[1230, 0.95, 8], [1380, 1.2, 7]];
    rows.forEach(([y, sc, n], r) => {
      for (let i = 0; i < n; i++) {
        const x = 90 + i * (900 / (n - 1)) + (r % 2) * 20, brk = clamp((t - 50.15 - H(r, i, 1) * 0.9) / 0.5);
        if (brk <= 0) A.soldier(ctx, { x, y, s: sc, pose: 'aim', face: -1, ph: 0.2, lw: 3 });
        else if (i % 3 === 0) A.soldier(ctx, { x, y, s: sc, pose: 'fall', ph: brk, face: -1, lw: 3 });
        else A.soldier(ctx, { x: x + brk * 380 * (i % 2 ? 1 : 0.6), y: y + 10, s: sc, pose: 'hunch', face: 1, ph: t * 1.5 + i, lw: 3 });
      }
    });
    A.flag(ctx, 520, 1330, 420, t, { w: 150, hh: 100 });
    // flashes from the enemy line and smoke banks
    for (let i = 0; i < 9; i++) { const ft = 49.2 + i * 0.31, a = t - ft; if (a > 0 && a < 0.16) burst(ctx, 60 + H(5, i, 1) * 300, 1010 + H(5, i, 2) * 60, 70 * (0.6 + a * 4), '#FFB347', '#FFF3C4', 10, i); }
    for (let i = 0; i < 10; i++) { const p = (t * 0.12 + H(6, i, 1)) % 1; ctx.fillStyle = `rgba(70,70,72,${0.4})`; ctx.beginPath(); ctx.arc(((H(6, i, 2) * 1300 - t * 40) % 1300 + 1300) % 1300 - 100, 960 + H(6, i, 3) * 330, 90 + 80 * H(6, i, 4), 0, TAU); ctx.fill(); }
    ctx.restore();
    // rain
    ctx.strokeStyle = 'rgba(215,225,235,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 130; i++) { const x = ((H(9, i, 1) * (W + 300) - t * 500) % (W + 300) + W + 300) % (W + 300), y = (H(9, i, 2) * HH + t * 1500 * (0.7 + H(9, i, 3))) % HH; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 62); ctx.stroke(); }
    vignette(ctx, 0.55, '10,10,10');
  });

  // ======================================================= 10b. SAINT HELENA: a tiny rock in a huge ocean
  add('helena', ev.helena, S.SC.twist, (ctx, t, u) => {
    const dur = S.SC.twist - ev.helena, z = lerp(1.0, 3.4, ease.inOutCubic(clamp((u - 0.35) / (dur - 0.5))));
    const g = ctx.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#2D3550'); g.addColorStop(0.7, '#B27A66'); g.addColorStop(1, '#F0B070'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    const rock = [540, 1050];
    ctx.save(); A.cam(ctx, { cx: lerp(540, rock[0], ease.inOutCubic(clamp(u / dur))), cy: lerp(960, rock[1] - 40, ease.inOutCubic(clamp(u / dur))), zoom: z, t });
    ctx.fillStyle = '#F6D58C'; ctx.beginPath(); ctx.arc(540, 960, 90, 0, TAU); ctx.fill(); glow(ctx, 540, 960, 500, '255,200,120', 0.4);
    const sg = ctx.createLinearGradient(0, 1000, 0, 2400); sg.addColorStop(0, '#4A6A86'); sg.addColorStop(1, '#122338'); ctx.fillStyle = sg; ctx.fillRect(-1200, 1000, W + 2400, 1800);
    ctx.fillStyle = 'rgba(255,200,130,0.35)'; ctx.fillRect(500, 1000, 80, 600);
    for (let i = 0; i < 60; i++) { const y = 1020 + i * 16 + (i * i % 5) * 3, x0 = ((i * 137 + t * 14 * (1 + i % 3)) % (W + 400)) - 200; ctx.strokeStyle = 'rgba(225,235,245,0.35)'; ctx.lineWidth = 2 / Math.min(2, z * 0.7); ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + 14, y - 4, x0 + 28, y); ctx.stroke(); }
    // the rock
    ctx.fillStyle = '#3B3A3A'; ctx.beginPath(); ctx.moveTo(rock[0] - 120, rock[1] + 12); ctx.lineTo(rock[0] - 80, rock[1] - 20); ctx.lineTo(rock[0] - 40, rock[1] - 30); ctx.lineTo(rock[0] + 10, rock[1] - 52); ctx.lineTo(rock[0] + 60, rock[1] - 38); ctx.lineTo(rock[0] + 100, rock[1] - 18); ctx.lineTo(rock[0] + 130, rock[1] + 12); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = '#4F7A44'; ctx.beginPath(); ctx.moveTo(rock[0] - 60, rock[1] - 26); ctx.lineTo(rock[0] + 10, rock[1] - 52); ctx.lineTo(rock[0] + 60, rock[1] - 38); ctx.lineTo(rock[0] + 10, rock[1] - 36); ctx.fill();
    ctx.strokeStyle = 'rgba(245,250,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rock[0] - 150, rock[1] + 16); ctx.quadraticCurveTo(rock[0], rock[1] + 30 + Math.sin(t * 2) * 4, rock[0] + 160, rock[1] + 16); ctx.stroke();
    // Napoleon at the cliff edge, looking out to sea
    A.nap(ctx, { x: rock[0] + 12, y: rock[1] - 52, s: 0.09, sil: '#14141C', view: 'back', arms: 'behind', shadow: false });
    ctx.restore();
    const lt = ease.outBack(clamp((u - 0.6) / 0.35), 2);
    tag(ctx, 'SAINT HELENA', 540, 470, 66 * lt, 1);
    vignette(ctx, 0.45, '10,10,25');
  });

  // ======================================================= 11. THE TWIST: the height chart and the caricature
  const caricature = (ctx, t, a) => { // a tiny, furious Napoleon, old-print style
    const bob = Math.sin(t * 14) * 4, stomp = Math.max(0, Math.sin(t * 7)) * 22;
    ctx.save(); ctx.translate(0, bob);
    const ink = '#3A2A1C';
    A.fill(ctx, [[-62, 150], [-14, 150], [-10, 210], [-70, 214]], '#5A4A3A', 3.5); A.fill(ctx, [[10, 150 - stomp], [62, 150 - stomp], [74, 212 - stomp], [14, 208 - stomp]], '#5A4A3A', 3.5);
    A.fill(ctx, [[-72, 44], [72, 44], [86, 154], [-86, 154]], '#7A8CB0', 4);
    A.stroke(ctx, [[-60, 60], [-110, 10], [-124, -40]], '#7A8CB0', 24); A.stroke(ctx, [[60, 60], [112, 4], [118, -48]], '#7A8CB0', 24);
    A.circ(ctx, -126, -50, 15, '#E8B8A0', 3); A.circ(ctx, 120, -58, 15, '#E8B8A0', 3);
    A.stroke(ctx, [[84, 120], [150, 210]], '#8A8A8A', 7);
    A.shape(ctx, G.ellPts(0, -10, 64, 58), '#E89A88', { hatch: false, lw: 4, seed: 71 });
    A.stroke(ctx, [[-44, -34], [-14, -22]], ink, 8); A.stroke(ctx, [[44, -34], [14, -22]], ink, 8);
    A.circ(ctx, -24, -12, 8, '#fff', 3); A.circ(ctx, 24, -12, 8, '#fff', 3); A.circ(ctx, -22, -10, 3.5, ink, 0); A.circ(ctx, 22, -10, 3.5, ink, 0);
    ctx.beginPath(); ctx.ellipse(0, 28, 22, 9 + 9 * Math.abs(Math.sin(t * 9)), 0, 0, TAU); ctx.fillStyle = '#6A1A1A'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
    A.fill(ctx, [[-170, -46], [-120, -102], [-50, -146], [0, -156], [50, -146], [120, -102], [170, -46], [110, -62], [0, -70], [-110, -62]], '#2A2320', 4);
    A.stroke(ctx, [[-168, -46], [-120, -102], [-50, -146], [0, -156], [50, -146], [120, -102], [168, -46]], '#8E7430', 4);
    for (let i = 0; i < 3; i++) { const p = ((t * 1.3 + i / 3) % 1); A.circ(ctx, -80 + i * 80, -150 - p * 100, 10 + p * 18, `rgba(255,255,255,${0.8 * (1 - p)})`, 0); }
    ctx.restore();
  };
  add('twist', S.SC.twist, 60.01, (ctx, t, u) => {
    A.paperBg(ctx, 'paper11', { seed: 11, base: '#F0E4C4' });
    const FLOOR = 1290, PX = 500; // 500 px per metre
    // the wall chart (left)
    A.fill(ctx, [[70, 230], [270, 230], [270, FLOOR + 10], [70, FLOOR + 10]], '#E4D3A6', 5);
    for (let i = 0; i <= 20; i++) { const y = FLOOR - i * 0.1 * PX, major = i % 5 === 0; A.stroke(ctx, [[270, y], [270 - (major ? 90 : 50), y]], C.ink, major ? 5 : 3); if (major) G.text(ctx, ['0', '0.5', '1 m', '1.5', '2 m'][i / 5], 90, y + 12, { size: 34, fam: 'Bungee', weight: 400, color: C.ink, boil: 0 }); }
    ctx.fillStyle = '#B9A67A'; ctx.fillRect(0, FLOOR, W, HH - FLOOR); ctx.fillStyle = C.ink; ctx.fillRect(0, FLOOR, W, 7);
    // Napoleon beside the chart: realistic, hat in hand, standing straight
    const sN = 1.33, nx = 470;
    const mAt = clamp((t - ev.measure) / 0.35);
    A.nap(ctx, { x: nx, y: FLOOR, s: sN, hat: false, arms: 'down', shadow: true });
    // the measuring line (1.69 m)
    const yH = FLOOR - 1.69 * PX;
    if (mAt > 0) {
      const xe = lerp(270, 900, ease.outCubic(mAt));
      A.stroke(ctx, [[270, yH], [xe, yH]], C.red, 8); A.fill(ctx, [[270, yH - 14], [262, yH], [270, yH + 14]], C.red, 0);
      G.text(ctx, '1.69 m', 900 - 5, yH - 52, { size: 60, fam: 'Bungee', weight: 400, color: C.red, align: 'right', stroke: C.cream, strokeW: 14, boil: 0, alpha: mAt });
      G.text(ctx, "5'7\"", 900 - 5, yH + 70, { size: 60, fam: 'Bungee', weight: 400, color: C.red, align: 'right', stroke: C.cream, strokeW: 14, boil: 0, alpha: mAt });
    }
    // the caricature print slides in from the right
    const cp = ease.outBack(clamp((t - ev.cartoon) / 0.4), 1.6);
    if (cp > 0) {
      const cx = 790, cy = 880, rot = 0.07 + Math.sin(t * 5) * 0.015 * (t < ev.myth ? 1 : 0.3);
      ctx.save(); ctx.translate(lerp(1300, cx, cp), cy); ctx.rotate(rot * cp); ctx.scale(0.95, 0.95);
      ctx.fillStyle = 'rgba(40,25,10,0.3)'; ctx.fillRect(-170, -250, 380, 540);
      A.fill(ctx, [[-190, -270], [190, -270], [190, 280], [-190, 280]], '#EDE1BD', 6);
      A.fill(ctx, [[-168, -246], [168, -246], [168, 256], [-168, 256]], '#E4D3A0', 3);
      ctx.save(); ctx.beginPath(); ctx.rect(-166, -244, 332, 498); ctx.clip(); ctx.translate(0, 20); ctx.scale(0.95, 0.95); caricature(ctx, t, 1); ctx.restore();
      ctx.strokeStyle = 'rgba(90,60,30,0.28)'; ctx.lineWidth = 2; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.moveTo(-166, -244 + i * 17); ctx.lineTo(166, -210 + i * 17); ctx.stroke(); }
      ctx.restore();
    }
    vignette(ctx, 0.3, '60,40,15');
  });
  // the MYTH stamp is drawn above the caricature (in the director's stamp layer)
})();
