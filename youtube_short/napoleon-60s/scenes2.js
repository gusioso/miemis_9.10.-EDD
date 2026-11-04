// Scenes 4-5: Toulon (night battery, the officer's map, the epaulettes) and the rise to power (the coup, the coronation).
(function () {
  const G = globalThis.G, U = globalThis.U, A = globalThis.A, S = globalThis.SCORE;
  const { clamp, lerp, ease } = U;
  const C = A.C, H = U.hash, TAU = Math.PI * 2;
  const W = G.W, HH = G.H, ev = S.ev;
  const SCN = (globalThis.SCN = globalThis.SCN || []);
  const add = (id, t0, t1, draw) => SCN.push({ id, t0, t1, draw });
  const { vignette, glow } = A;
  const star4 = (ctx, x, y, r, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.22 : r; const a = (i / 8) * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  A.star4 = star4;
  const burst = (ctx, x, y, r, col1, col2, spikes = 14, seed = 1) => {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) { const a = (i / (spikes * 2)) * TAU, rr = (i % 2 ? r * 0.45 : r) * (0.8 + H(seed, i, 1) * 0.4); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col1; ctx.fill();
    ctx.beginPath(); for (let i = 0; i < spikes * 2; i++) { const a = (i / (spikes * 2)) * TAU, rr = (i % 2 ? r * 0.25 : r * 0.6); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = col2; ctx.fill();
  };
  A.burst = burst;
  const smoke = (ctx, x, y, a, r0, col = '90,88,92') => { // a puff cloud expanding & drifting up
    for (let i = 0; i < 7; i++) { const k = H(3, i, 1), rr = r0 * (0.5 + k) * (0.6 + a * 1.6); ctx.beginPath(); ctx.arc(x + (k - 0.5) * 160 * a - a * 60, y - a * 130 - k * 40, rr, 0, TAU); ctx.fillStyle = `rgba(${col},${0.55 * (1 - a)})`; ctx.fill(); }
  };
  A.smoke = smoke;

  // ======================================================= 4a. SIEGE OF TOULON, NIGHT (13 - officer)
  add('toulon', S.SC.toulon, ev.officer, (ctx, t, u) => {
    const g = ctx.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#080B22'); g.addColorStop(0.7, '#2A2650'); g.addColorStop(1, '#5A3B55'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1000);
    for (let i = 0; i < 70; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,240,200,${0.3 + 0.5 * tw * H(2, i, 3)})`; ctx.beginPath(); ctx.arc(H(2, i, 1) * W, H(2, i, 2) * 820, 1.5 + H(2, i, 4) * 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#EFE6C8'; ctx.beginPath(); ctx.arc(860, 330, 46, 0, TAU); ctx.fill(); ctx.fillStyle = '#2A2650'; ctx.beginPath(); ctx.arc(878, 322, 42, 0, TAU); ctx.fill();
    // sea
    const sg = ctx.createLinearGradient(0, 930, 0, HH); sg.addColorStop(0, '#2B3A5A'); sg.addColorStop(1, '#0B1428'); ctx.fillStyle = sg; ctx.fillRect(0, 930, W, HH - 930);
    ctx.strokeStyle = 'rgba(140,170,220,0.22)'; ctx.lineWidth = 3;
    for (let i = 0; i < 22; i++) { const y = 960 + i * 24 + Math.sin(t * 1.5 + i) * 3, x0 = (i * 173) % W - 60; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + 30, y - 7, x0 + 60, y); ctx.quadraticCurveTo(x0 + 90, y + 7, x0 + 120, y); ctx.stroke(); }
    // far town + fort
    ctx.fillStyle = '#0C0F20'; ctx.beginPath(); ctx.moveTo(0, 930); for (let i = 0; i <= 14; i++) ctx.lineTo(i * 80, 930 - 40 - H(4, i, 1) * 70 - (i > 3 && i < 8 ? 40 : 0)); ctx.lineTo(W, 930); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 18; i++) { ctx.fillStyle = H(5, i, 1) > 0.5 ? '#E9B24A' : '#0C0F20'; ctx.fillRect(40 + i * 54, 885 - H(5, i, 2) * 40, 8, 10); }
    // ships at anchor
    const hits = ev.salvo.map((s) => s + 0.28);
    const shipHit = (i) => hits.some((h) => t >= h && t < h + 0.25 && (i === Math.floor(hits.indexOf(h)) % 3));
    A.ship(ctx, { x: 250, y: 1010, s: 0.9, lit: shipHit(0) ? 1 : 0 }); A.ship(ctx, { x: 520, y: 1000, s: 0.65, lit: shipHit(1) ? 1 : 0 }); A.ship(ctx, { x: 760, y: 1015, s: 0.8, lit: shipHit(2) ? 1 : 0 });
    // fire reflections
    const fl = ev.salvo.reduce((a, s) => Math.max(a, t >= s ? Math.exp(-(t - s) * 5) : 0), 0);
    glow(ctx, 640, 1100, 700, '255,150,60', 0.35 * fl);
    // the hill + battery
    ctx.fillStyle = '#0A0B14'; ctx.beginPath(); ctx.moveTo(180, HH); ctx.lineTo(180, 1470); ctx.quadraticCurveTo(600, 1250, W, 1300); ctx.lineTo(W, HH); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 7; i++) A.fill(ctx, [[400 + i * 90, 1330 - i * 4], [430 + i * 90, 1300 - i * 4], [460 + i * 90, 1330 - i * 4]], '#14151F', 0); // sandbag-ish
    let rec = 0, flash = 0, sm = -1;
    ev.salvo.forEach((s) => { if (t >= s) { rec = Math.max(rec, 38 * Math.exp(-(t - s) * 9)); flash = Math.max(flash, Math.exp(-(t - s) * 12)); if (t - s < 1.2) sm = Math.max(sm, (t - s) / 1.2); } });
    const cx = 730, cy = 1440, cs = 2.4, mx = cx - 109 * cs - 10, my = cy - 103 * cs;
    A.cannon(ctx, { x: cx, y: cy, s: cs, recoil: -rec, sil: '#2A2D45', face: -1 });
    A.stroke(ctx, [[cx - 100 * cs + rec, cy - 150 * cs]], '#000', 0);
    // crew silhouettes
    A.soldier(ctx, { x: 980, y: 1440, s: 1.9, pose: 'stand', coat: '#1C2036', face: -1 }); A.soldier(ctx, { x: 330, y: 1520, s: 1.7, pose: 'charge', coat: '#1C2036', face: 1, ph: 0.2 });
    // muzzle flash, smoke, the ball streaking to the ships
    ev.salvo.forEach((s, i) => {
      const a = t - s; if (a < 0) return;
      if (a < 0.14) { burst(ctx, mx - 20, my + 10, 150 * (0.6 + a * 5), '#FFB347', '#FFF3C4', 12, i + 1); }
      if (a < 1.3) smoke(ctx, mx - 30, my, a / 1.3, 55);
      if (a < 0.3) { const p = a / 0.3; A.stroke(ctx, [[mx - 20 - 420 * Math.max(0, p - 0.25), my + 10 + 180 * Math.max(0, p - 0.25)], [mx - 20 - 420 * p, my + 10 + 180 * p]], '#FFE6A8', 6); }
      const ha = a - 0.28; // impact on a ship
      if (ha > 0 && ha < 0.4) { const sx = [250, 520, 760][i % 3], sy = [840, 900, 860][i % 3]; burst(ctx, sx, sy, 120 * (0.4 + ha * 3), '#FF8A2A', '#FFE69A', 12, i + 9); }
    });
    // light flash over the whole harbour
    ctx.fillStyle = `rgba(255,190,110,${0.22 * flash})`; ctx.fillRect(0, 0, W, HH);
    vignette(ctx, 0.55, '0,0,10');
  });
  // camera shake wrapper for Toulon: re-registered below via post-scale (director applies none) -> shake inside draw using translation
  const toulon = SCN.find((s) => s.id === 'toulon'); const toulonDraw = toulon.draw;
  toulon.draw = (ctx, t, u) => { const sh = ev.salvo.reduce((a, s) => Math.max(a, t >= s ? 16 * Math.exp(-(t - s) * 8) : 0), 0); ctx.save(); A.cam(ctx, { cx: lerp(W / 2, 600, u / 2.65), cy: HH / 2, zoom: 1 + 0.06 * (u / 2.65), shakeA: sh, t }); toulonDraw(ctx, t, u); ctx.restore(); };

  // ======================================================= 4b. THE OFFICER STUDIES THE MAP (officer - epaulette)
  add('officer', ev.officer, ev.epaulette, (ctx, t, u) => {
    const bg = ctx.createRadialGradient(540, 700, 80, 540, 900, 1200); bg.addColorStop(0, '#6B4A2A'); bg.addColorStop(1, '#120C08'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, HH);
    // curtain + window behind
    ctx.fillStyle = '#2A1810'; ctx.fillRect(0, 240, 200, 1000); ctx.fillRect(880, 240, 200, 1000);
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2 + 40, zoom: 1.05 + 0.1 * (u / 1.4), t });
    A.nap(ctx, { x: 540, y: 1700, s: 1.5, hat: true, ep: 0, arms: 'vest', headRot: 0.12 + 0.03 * Math.sin(u * 3), look: 0, shadow: false });
    // table + map
    ctx.fillStyle = '#4A2E18'; ctx.fillRect(-100, 1180, W + 200, 600); ctx.fillStyle = '#2E1A0D'; ctx.fillRect(-100, 1180, W + 200, 16);
    A.fill(ctx, [[120, 1250], [960, 1250], [1040, 1480], [40, 1480]], '#E6D6A8', 4);
    ctx.strokeStyle = 'rgba(80,55,25,0.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(150 + i * 140, 1262); ctx.lineTo(80 + i * 170, 1470); ctx.stroke(); }
    // coastline + harbour on the map, a red plan being drawn
    A.stroke(ctx, [[160, 1330], [260, 1300], [360, 1340], [420, 1300], [520, 1360], [600, 1330]], '#5A4A2A', 6);
    const pl = clamp(u / 1.0); const planPts = [[300, 1440], [420, 1400], [520, 1380], [620, 1330], [760, 1310]];
    A.stroke(ctx, planPts.slice(0, 1 + Math.ceil(pl * 4)), C.red, 7);
    for (const [px, py] of planPts.slice(0, 1 + Math.floor(pl * 4))) A.circ(ctx, px, py, 11, C.red, 3);
    // candle
    const fl = 1 + 0.12 * Math.sin(t * 31) + 0.08 * Math.sin(t * 17);
    A.fill(ctx, [[880, 1290], [925, 1290], [920, 1180], [885, 1180]], '#F1E6C6', 4);
    ctx.fillStyle = '#FFC24A'; ctx.beginPath(); ctx.ellipse(903, 1148, 14 * fl, 30 * fl, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF4C8'; ctx.beginPath(); ctx.ellipse(903, 1156, 6, 14, 0, 0, TAU); ctx.fill();
    ctx.restore();
    glow(ctx, 903, 1150, 900 * fl, '255,170,70', 0.38);
    vignette(ctx, 0.7, '10,5,0');
  });

  // ======================================================= 4c. THE EPAULETTES (epaulette - 19)
  add('epaulette', ev.epaulette, S.SC.power, (ctx, t, u) => {
    const bg = ctx.createLinearGradient(0, 0, 0, HH); bg.addColorStop(0, '#2C2A3A'); bg.addColorStop(1, '#14121C'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, HH);
    // heavy drape
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? 'rgba(120,30,35,0.55)' : 'rgba(90,20,25,0.55)'; ctx.fillRect(i * 160 - 20, 220, 150, 1100); }
    const ep = ease.outBack(clamp((u - 0.05) / 0.28), 2.2);
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: 900, zoom: 1.0 + 0.1 * (u / 1.98), t });
    A.nap(ctx, { x: 540, y: 1980, s: 2.1, hat: true, ep, arms: 'vest', shadow: false });
    ctx.restore();
    // clang: burst + sparkles where the epaulettes seat
    const a = u - 0.1;
    if (a > 0 && a < 0.3) { for (const sd of [-1, 1]) burst(ctx, 540 + sd * 185, 905, 60 * (0.5 + a * 3), 'rgba(255,214,102,0.75)', 'rgba(255,248,220,0.9)', 10, 4); }
    for (let i = 0; i < 14; i++) { const p = ((u * 1.2 + H(8, i, 1)) % 1); const sd = i % 2 ? 1 : -1; star4(ctx, 540 + sd * (140 + H(8, i, 2) * 90), 800 + H(8, i, 3) * 160 - p * 40, 10 + H(8, i, 4) * 16 * (1 - Math.abs(p - 0.5)), `rgba(255,236,160,${Math.sin(p * Math.PI)})`); }
    vignette(ctx, 0.6, '5,5,15');
  });

  // ======================================================= 5a. 1799 THE COUP: soldiers enter the hall (19 - 1804)
  const hall = (ctx, vx, vy) => {
    // back wall + doors
    ctx.fillStyle = '#8C8470'; ctx.fillRect(0, 230, W, HH);
    const fg = ctx.createLinearGradient(0, vy, 0, HH); fg.addColorStop(0, '#9C8A6A'); fg.addColorStop(1, '#4C3E2C'); ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(0, HH); ctx.lineTo(W, HH); ctx.lineTo(W * 0.66, vy + 120); ctx.lineTo(W * 0.34, vy + 120); ctx.closePath(); ctx.fill();
    // chequered floor lines
    ctx.strokeStyle = 'rgba(30,20,10,0.4)'; ctx.lineWidth = 3;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(vx + i * 40, vy + 120); ctx.lineTo(vx + i * 330, HH); ctx.stroke(); }
    for (let k = 1; k < 9; k++) { const y = vy + 120 + (HH - vy - 120) * Math.pow(k / 9, 1.7); const x = (y - vy - 120) / (HH - vy - 120); ctx.beginPath(); ctx.moveTo(vx - 190 - 350 * x, y); ctx.lineTo(vx + 190 + 350 * x, y); ctx.stroke(); }
    // columns left & right
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) {
      const z = k / 4, x = vx + sd * (130 + 260 * z * z * 1.6 + z * 120), w = 30 + 60 * z * 1.4, top = vy - 330 - 330 * z, bot = vy + 140 + 360 * z * 1.1;
      const gg = ctx.createLinearGradient(x - w, 0, x + w, 0); gg.addColorStop(0, '#9E9886'); gg.addColorStop(0.5, '#E9E2CC'); gg.addColorStop(1, '#8B846F');
      ctx.fillStyle = gg; ctx.fillRect(x - w / 2, top, w, bot - top); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeRect(x - w / 2, top, w, bot - top);
    }
    // grand doorway, bright
    A.fill(ctx, [[vx - 150, vy + 130], [vx - 150, vy - 160], [vx - 90, vy - 230], [vx + 90, vy - 230], [vx + 150, vy - 160], [vx + 150, vy + 130]], '#FFF3C8', 6);
    glow(ctx, vx, vy - 30, 520, '255,230,150', 0.5);
  };
  add('coup', ev.y1799 - 0.2, ev.y1804 - 0.05, (ctx, t, u) => {
    // (this scene starts at the stamp; scene 'power' lead-in handled by the previous entry's end)
    drawCoup(ctx, t, u + (ev.y1799 - 0.2 - S.SC.power));
  });
  // leading second of scene 5 (19.0 -> 18.8 start of coup) is covered by 'epaulette' ending at SC.power; make coup start exactly at SC.power
  SCN.find((s) => s.id === 'coup').t0 = S.SC.power;
  function drawCoup(ctx, t, uu) {
    const u = t - S.SC.power;
    const vx = 540, vy = 760;
    ctx.save(); A.cam(ctx, { cx: W / 2, cy: HH / 2, zoom: 1 + 0.07 * (u / 2.8), t });
    hall(ctx, vx, vy);
    // deputies on the benches (dark silhouettes), they rise as the soldiers arrive
    for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const x = vx + sd * (210 + i * 46 + r * 60), y = vy + 190 + r * 120 + i * 14, sc = 0.9 + r * 0.25;
      const rise = clamp((u - 0.6 - H(r, i, sd) * 0.8) / 0.3) * 24;
      ctx.fillStyle = '#17120F'; ctx.beginPath(); ctx.arc(x, y - 60 * sc - rise, 14 * sc, 0, TAU); ctx.fill(); ctx.fillRect(x - 20 * sc, y - 46 * sc - rise, 40 * sc, 48 * sc + rise);
    }
    // soldiers pour in through the doors, four ranks
    const draws = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const z = clamp((u - 0.15 - r * 0.38) / 1.9); if (z <= 0) continue;
      const zz = ease.inQuad(z), x = vx + (c - 2) * lerp(30, 190, zz), y = lerp(vy + 130, 1620, zz), s = lerp(0.45, 2.1, zz);
      draws.push({ x, y, s, c, r, z: zz });
    }
    draws.sort((a, b) => a.y - b.y).forEach((d) => A.soldier(ctx, { x: d.x, y: d.y, s: d.s, pose: 'march', ph: u * 1.7 + d.c * 0.13, lw: 2.5 + d.s }));
    A.flag(ctx, vx - 330, 1640, 520, t, { w: 170, hh: 110 });
    ctx.restore();
    vignette(ctx, 0.5, '15,8,0');
  }
  SCN.find((s) => s.id === 'coup').draw = (ctx, t) => drawCoup(ctx, t, 0);

  // ======================================================= 5b. 1804: NOTRE-DAME, THE CROWN (1804 - 25)
  add('coronation', ev.y1804 - 0.05, ev.book - 0.3, (ctx, t, u) => {
    const bg = ctx.createLinearGradient(0, 0, 0, HH); bg.addColorStop(0, '#1A1B3A'); bg.addColorStop(0.6, '#4B3A52'); bg.addColorStop(1, '#2A1E22'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, HH);
    // rose window
    const rx = 540, ry = 470;
    for (let i = 0; i < 12; i++) { ctx.fillStyle = [C.blue, C.red, C.gold, '#5E8F6A'][i % 4]; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.arc(rx, ry, 230, i * TAU / 12, (i + 1) * TAU / 12); ctx.closePath(); ctx.fill(); }
    ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(rx, ry, 230, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(rx, ry, 120, 0, TAU); ctx.stroke(); for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(i * TAU / 12) * 230, ry + Math.sin(i * TAU / 12) * 230); ctx.stroke(); }
    glow(ctx, rx, ry, 600, '255,220,150', 0.35);
    // gothic pillars + pointed arches
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = 540 + sd * (330 + k * 120), w = 70 - k * 12, top = 180 + k * 100;
      const gg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gg.addColorStop(0, '#6A6254'); gg.addColorStop(0.5, '#B8AE98'); gg.addColorStop(1, '#5A5346');
      ctx.fillStyle = gg; ctx.fillRect(x - w / 2, top, w, 1500 - top - k * 80); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeRect(x - w / 2, top, w, 1500 - top - k * 80);
      const nx = 540 + sd * (330 + (k + 1) * 120);
      ctx.beginPath(); ctx.moveTo(x, top + 20); ctx.quadraticCurveTo((x + nx) / 2, top - 130, nx, top + 100); ctx.lineWidth = 12; ctx.strokeStyle = '#8A8170'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
    }
    // red carpet + steps
    ctx.fillStyle = '#5B1A1E'; ctx.beginPath(); ctx.moveTo(500, 1000); ctx.lineTo(580, 1000); ctx.lineTo(900, HH); ctx.lineTo(180, HH); ctx.closePath(); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.gold; ctx.stroke();
    for (let k = 0; k < 4; k++) { const y = 1060 + k * 90; ctx.fillStyle = k % 2 ? '#4E1519' : '#6A2127'; ctx.fillRect(540 - (110 + k * 80), y, 220 + k * 160, 90); }
    // crowd silhouettes in the nave
    for (const sd of [-1, 1]) for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
      const x = 540 + sd * (170 + i * 58 + r * 36), y = 960 + r * 100 + i * 8, sc = 0.8 + r * 0.22, bob = Math.sin(t * 3 + i + r) * 2;
      ctx.fillStyle = r % 2 ? '#241A20' : '#1A1218'; ctx.beginPath(); ctx.arc(x, y - 56 * sc + bob, 16 * sc, 0, TAU); ctx.fill(); ctx.fillRect(x - 22 * sc, y - 40 * sc + bob, 44 * sc, 80 * sc);
    }
    // the Pope, seated and watching
    ctx.save(); ctx.translate(190, 1330); ctx.scale(1.0, 1.0);
    A.fill(ctx, [[-70, -330], [70, -330], [76, 40], [-76, 40]], C.gold, 5); A.fill(ctx, [[-52, -170], [52, -170], [60, 20], [-60, 20]], '#EFE8D5', 4);
    A.fill(ctx, [[-44, -150], [44, -150], [60, -30], [-60, -30]], '#F6F0E0', 4);
    A.stroke(ctx, [[-30, -150], [-40, -80]], '#CFC6AC', 4);
    A.circ(ctx, 6, -210, 34, C.skin, 4);
    A.fill(ctx, [[-30, -228], [42, -228], [26, -300], [0, -330], [-16, -300]], '#F6F0E0', 4); A.stroke(ctx, [[-30, -240], [42, -240]], C.gold, 5);
    A.circ(ctx, 20, -214, 3, '#1E1713', 0); A.stroke(ctx, [[12, -196], [26, -196]], '#6B3328', 3);
    ctx.restore();
    // Napoleon seen from behind, in the red coronation mantle, lifting the crown
    const lift = ease.inOutCubic(clamp((t - ev.crownLift) / 0.55)), place = ease.inCubic(clamp((t - ev.crownOn + 0.08) / 0.1));
    const crowned = t >= ev.crownOn;
    ctx.save(); ctx.translate(0, 0);
    const nx = 540, ny = 1520, ns = 1.12;
    A.nap(ctx, { x: nx, y: ny, s: ns, view: 'back', hat: false, arms: t < ev.crownLift - 0.2 ? 'behind' : crowned && t > ev.crownOn + 0.25 ? 'down' : 'up', shadow: true });
    ctx.save(); ctx.translate(nx, ny); ctx.scale(ns, ns);
    A.fill(ctx, [[-84, -526], [84, -526], [126, -120], [172, 6], [-172, 6], [-126, -120]], '#8A1D24', 5);
    A.fill(ctx, [[-84, -526], [-60, -526], [-106, -120], [-172, 6], [-150, 6], [-126, -120]], '#F3EFE3', 3);
    A.fill(ctx, [[84, -526], [60, -526], [106, -120], [172, 6], [150, 6], [126, -120]], '#F3EFE3', 3);
    A.fill(ctx, [[-172, -22], [172, -22], [172, 6], [-172, 6]], '#F3EFE3', 3);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-150 + i * 37.5, -9, 3.5, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 6; i++) { A.circ(ctx, -60 + (i % 3) * 60, -380 + Math.floor(i / 3) * 140, 9, C.gold, 2); }
    // the crown: rises in his hands, then settles on his head
    const cy2 = lerp(-470, -770, lift) + (crowned ? lerp(0, 122, place) : 0);
    if (t >= ev.crownLift - 0.1) A.crown(ctx, 0, cy2, 1.25);
    ctx.restore(); ctx.restore();
    // the moment it lands: gold light + sparks
    const a = t - ev.crownOn;
    if (a > 0 && a < 0.7) { burst(ctx, nx, ny - 640 * ns, 360 * (0.3 + a * 1.3), `rgba(255,214,110,${0.55 * (1 - a / 0.7)})`, `rgba(255,248,220,${0.8 * (1 - a / 0.7)})`, 16, 7); }
    if (a > 0) for (let i = 0; i < 18; i++) { const p = H(9, i, 1), ang = p * TAU, d = 100 + 300 * ease.outCubic(clamp(a / 0.9)) * (0.5 + H(9, i, 2)); star4(ctx, nx + Math.cos(ang) * d, ny - 640 * ns + Math.sin(ang) * d * 0.7, 9 + H(9, i, 3) * 15, `rgba(255,236,160,${1 - clamp(a / 1.2)})`); }
    vignette(ctx, 0.5, '10,5,15');
  });
})();
