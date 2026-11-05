// ART — palette, figures and props for "60 Seconds of History". Everything is a pure function of its arguments and t.
// Palette: French blue, deep red, gold, cream, smoky grey + ink. A.drain (0..1) bleeds all colour to grey (the Russian winter).
(function () {
  const G = globalThis.G, U = globalThis.U;
  const { clamp, lerp, ease } = U;
  const A = (globalThis.A = {});
  const TAU = Math.PI * 2;

  A.C = {
    blue: '#2B4A8B', blueD: '#1E3566', blueL: '#5E7FBF', red: '#A3262A', redD: '#741A1F', gold: '#D4A53A', goldL: '#EBCB6E', goldD: '#9A7421',
    cream: '#F3E8CB', parch: '#E8D9B3', parchD: '#CDB88A', grey: '#7D7A75', greyD: '#4B4946', greyL: '#BDB8AD', ink: '#211A16', skin: '#D7A57C', skinD: '#B3805A',
    night: '#141B3A', sea: '#2F4A63', fire: '#E6762B',
  };
  const C = A.C;
  A.drain = 0;
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const toHex = (r) => '#' + r.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  A.mix = (a, b, k) => { const x = hex(a), y = hex(b); return toHex([lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k)]); };
  A.col = (c, keep) => {
    if (A.drain <= 0.001 || keep) return c;
    const x = hex(c), l = 0.3 * x[0] + 0.59 * x[1] + 0.11 * x[2];
    return A.mix(c, toHex([l * 0.98, l * 1.0, l * 1.04]), A.drain);
  };
  const K = (c) => A.col(c);
  const H = U.hash;

  // ---------- cheap inked shapes (crowds) ----------
  A.fill = (ctx, pts, fill, lw = 3, stroke = C.ink) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  A.circ = (ctx, x, y, r, fill, lw = 3) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); } };
  A.stroke = (ctx, pts, col, lw) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  // hand-drawn big shape (wobbling line, hatching)
  A.shape = (ctx, pts, fill, o = {}) => G.shape(ctx, pts, Object.assign({ fill, lw: 4.5, seed: 3, amp: 1.2, hatch: o.hatch === false ? null : { color: 'rgba(30,20,10,0.13)', gap: 10 } }, o));
  A.hatchTone = 'rgba(30,20,10,0.13)';

  // ---------- paper ----------
  A.paper = (ctx, w, h, { base = C.parch, edge = C.parchD, seed = 1 } = {}) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.1, w / 2, h / 2, h * 0.75);
    g.addColorStop(0, base); g.addColorStop(1, edge);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { // age stains
      const x = H(seed, i, 1) * w, y = H(seed, i, 2) * h, r = 60 + H(seed, i, 3) * 220;
      const s = ctx.createRadialGradient(x, y, 0, x, y, r);
      s.addColorStop(0, 'rgba(120,85,40,0.07)'); s.addColorStop(1, 'rgba(120,85,40,0)');
      ctx.fillStyle = s; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 260; i++) { // fibres
      const x = H(seed, i, 4) * w, y = H(seed, i, 5) * h, l = 6 + H(seed, i, 6) * 22, a = H(seed, i, 7) * TAU;
      ctx.strokeStyle = 'rgba(110,80,40,0.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
  };
  // the engraved frame that holds every scene
  A.frame = (ctx, W, H2) => {
    const m = 30;
    ctx.save();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.strokeRect(m, m, W - 2 * m, H2 - 2 * m);
    ctx.lineWidth = 2; ctx.strokeRect(m + 14, m + 14, W - 2 * m - 28, H2 - 2 * m - 28);
    ctx.fillStyle = C.gold;
    for (const [x, y] of [[m + 7, m + 7], [W - m - 7, m + 7], [m + 7, H2 - m - 7], [W - m - 7, H2 - m - 7]]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.restore();
  };

  // ---------- text ----------
  A.big = (ctx, str, x, y, { size = 100, color = C.cream, stroke = C.ink, sw, align = 'center', alpha = 1, fam = 'Bungee' } = {}) =>
    G.text(ctx, str, x, y, { size, fam, weight: 400, color, align, alpha, stroke, strokeW: sw ?? size * 0.16, boil: 0 });

  // ---------- date / name stamps ----------
  // slams in at t0 (scale 1.9 -> 1), ink drops fly out, fades after `hold`
  A.stamp = (ctx, t, t0, text, { x, y, rot = -0.05, size = 150, color = C.red, hold = 2.0, w, sub } = {}) => {
    const a = t - t0;
    if (a < -0.0 || a > hold + 0.3) return;
    const fadeOut = 1 - clamp((a - hold) / 0.3);
    const u = clamp(a / 0.13);
    const sc = lerp(1.9, 1, ease.outCubic(u)) + 0.04 * Math.sin(a * 40) * Math.exp(-a * 9);
    ctx.save();
    ctx.globalAlpha *= clamp(a / 0.04 + 0.2) * fadeOut;
    // impact ring + ink drops
    if (a < 0.45) {
      const r = a * 900;
      ctx.strokeStyle = 'rgba(33,26,22,' + (0.35 * (1 - a / 0.45)) + ')'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = G.font(size, 'Bungee', 400);
    const lines = String(text).split('\n');
    const tw = w || Math.max(...lines.map((l) => G.measure(ctx, l, size, 'Bungee', 400))) + size * 0.7;
    const th = size * (0.35 + 1.0 * lines.length);
    ctx.fillStyle = A.mix(color, '#F3E8CB', 0.0);
    ctx.globalAlpha *= 0.94;
    ctx.beginPath(); ctx.roundRect(-tw / 2, -th / 2, tw, th, 14); ctx.fill();
    ctx.globalAlpha /= 0.94;
    ctx.strokeStyle = C.cream; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-tw / 2 + 12, -th / 2 + 12, tw - 24, th - 24, 8); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-tw / 2, -th / 2, tw, th, 14); ctx.stroke();
    lines.forEach((l, i) => G.text(ctx, l, 0, size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.0, { size, fam: 'Bungee', weight: 400, color: C.cream, align: 'center', boil: 0 }));
    if (sub) G.text(ctx, sub, 0, th / 2 + 52, { size: 40, fam: 'Bungee', weight: 400, color: C.ink, align: 'center', boil: 0 });
    ctx.restore();
    if (a < 0.5) { // ink splatter
      ctx.save(); ctx.globalAlpha *= (1 - a / 0.5) * fadeOut; ctx.fillStyle = color;
      for (let i = 0; i < 16; i++) {
        const ang = H(t0 * 7, i, 1) * TAU, d = (40 + H(t0 * 7, i, 2) * 260) * ease.outCubic(clamp(a / 0.4)) + (w || size * 2) * 0.25, r = 3 + H(t0 * 7, i, 3) * 9;
        ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.7, r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  };

  // ---------- Napoleon ----------
  // origin = feet, ~ -690 is the top of the hat at s = 1. o: { x, y, s, flip, sil (flat ink colour), view: 'front'|'back', hat, ep (epaulettes 0..1),
  // arms: 'vest'|'down'|'behind'|'up'|'out', headRot, mouth 0..1, walk (phase), kid, coat, lean }
  A.nap = (ctx, o) => {
    const { x, y, s = 1, flip = false, sil = null, view = 'front', hat = true, ep = 1, arms = 'vest', headRot = 0, mouth = 0, walk = null, kid = false, coat = C.blue, shadow = true, look = 0, crown = null } = o;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s);
    const F = (c) => sil || K(c);
    const rim = sil && o.rim; const lw = sil ? (rim ? 5 : 0) : 4;
    const fill = (pts, c, w = lw) => A.fill(ctx, pts, F(c), sil ? lw : w, rim || C.ink);
    if (shadow) { ctx.fillStyle = 'rgba(30,20,10,0.22)'; ctx.beginPath(); ctx.ellipse(0, 4, 120, 16, 0, 0, TAU); ctx.fill(); }
    const sw = walk === null ? 0 : Math.sin(walk);
    // legs & boots (white breeches, tall black boots)
    for (const sd of [-1, 1]) {
      const dx = sw * 20 * sd, lift = walk === null ? 0 : Math.max(0, Math.sin(walk + (sd > 0 ? 0 : Math.PI))) * 16;
      fill([[sd * 50 + dx * 0.3, -262], [sd * 6 + dx * 0.3, -262], [sd * 9 + dx * 0.8, -150 - lift * 0.6], [sd * 47 + dx * 0.8, -150 - lift * 0.6]], C.cream);
      fill([[48, -162], [8, -162], [7, -30], [-6, -6], [58, -6], [54, -28]].map((p) => [p[0] * sd + dx, p[1] - lift]), '#1D1816', sil ? 0 : 4);
      if (!sil) A.stroke(ctx, [[sd * 47 + dx, -160 - lift], [sd * 9 + dx, -160 - lift]], K(C.gold), 4);
    }
    // back view: coat tails
    const body = [[-72, -524], [72, -524], [86, -444], [80, -310], [96, -204], [14, -216], [0, -300], [-14, -216], [-96, -204], [-80, -310], [-86, -444]];
    if (view === 'back') {
      fill(body, coat);
      if (!sil) { A.stroke(ctx, [[0, -520], [0, -230]], K(C.blueD), 4); for (const yy of [-330, -300]) { A.circ(ctx, -14, yy, 6, K(C.gold), 2); A.circ(ctx, 14, yy, 6, K(C.gold), 2); } }
    } else {
      fill(body, coat);
      if (!sil) {
        fill([[-26, -524], [26, -524], [32, -420], [26, -306], [-26, -306], [-32, -420]], C.cream, 3);
        fill([[-30, -524], [-62, -500], [-44, -430], [-36, -300], [-26, -306], [-32, -420]], C.blueD, 3);
        fill([[30, -524], [62, -500], [44, -430], [36, -300], [26, -306], [32, -420]], C.blueD, 3);
        fill([[-80, -330], [80, -330], [78, -300], [-78, -300]], C.red, 3); // sash
        for (let i = 0; i < 4; i++) { A.circ(ctx, -42 + (i % 2) * 2, -490 + i * 38, 5.5, K(C.gold), 2); A.circ(ctx, 42 - (i % 2) * 2, -490 + i * 38, 5.5, K(C.gold), 2); }
        fill([[8, -300], [26, -300], [30, -250], [4, -250]], C.gold, 2.5); // sash tassel
      }
    }
    // arms
    const armCol = F(coat);
    const limb = (pts, w, c) => { A.stroke(ctx, pts, sil ? sil : K(C.ink), w + (sil ? 0 : 8)); if (!sil) A.stroke(ctx, pts, c, w); };
    const shL = [-70, -508], shR = [70, -508];
    if (arms === 'vest' && view === 'front') {
      limb([shL, [-100, -404], [-96, -296]], 42, armCol);
      if (!sil) { A.circ(ctx, -96, -280, 20, K(C.cream), 3); fill([[-112, -318], [-80, -318], [-80, -300], [-112, -300]], C.red, 3); }
      limb([shR, [108, -420], [26, -414]], 42, armCol);
      if (!sil) { fill([[16, -428], [34, -428], [34, -402], [14, -402]], C.skin, 2.5); }
    } else if (arms === 'behind') {
      limb([shL, [-92, -400], [-30, -330]], 40, armCol); limb([shR, [92, -400], [30, -330]], 40, armCol);
      if (!sil && view === 'back') { A.circ(ctx, 0, -320, 18, K(C.cream), 3); }
    } else if (arms === 'up') {
      limb([shL, [-104, -600], [-60, -700]], 40, armCol); limb([shR, [104, -600], [60, -700]], 40, armCol);
      if (!sil) { A.circ(ctx, -58, -708, 17, K(C.cream), 3); A.circ(ctx, 58, -708, 17, K(C.cream), 3); }
    } else if (arms === 'wide') {
      limb([shL, [-132, -472], [-198, -420]], 40, armCol); limb([shR, [132, -472], [198, -420]], 40, armCol);
      if (!sil) { A.circ(ctx, -210, -414, 18, K(C.cream), 3); A.circ(ctx, 210, -414, 18, K(C.cream), 3); }
    } else if (arms === 'out') {
      limb([shL, [-110, -440], [-70, -330]], 40, armCol);
      limb([shR, [130, -500], [190, -470]], 40, armCol);
      if (!sil) { A.circ(ctx, -70, -318, 18, K(C.cream), 3); A.circ(ctx, 204, -466, 18, K(C.cream), 3); }
    } else {
      limb([shL, [-100, -404], [-96, -296]], 42, armCol); limb([shR, [100, -404], [96, -296]], 42, armCol);
      if (!sil) { A.circ(ctx, -96, -280, 20, K(C.cream), 3); A.circ(ctx, 96, -280, 20, K(C.cream), 3); }
    }
    // epaulettes
    if (ep > 0 && !sil) {
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(sd * 84, -516 - (1 - ep) * 260); ctx.rotate(sd * 0.25); ctx.globalAlpha *= clamp(ep * 3);
        fill([[-30, -8], [30, -8], [34, 14], [-34, 14]], C.gold, 3);
        fill([[-30, 14], [30, 14], [26, 46], [-26, 46]], C.goldL, 3);
        for (let i = -2; i <= 2; i++) A.stroke(ctx, [[i * 11, 18], [i * 11, 46]], K(C.goldD), 2.5);
        ctx.restore();
      }
    }
    // neck, head
    const hc = [0, -590];
    ctx.save();
    ctx.translate(hc[0], hc[1] + 50); ctx.rotate(headRot); ctx.translate(0, -50);
    const kidS = kid ? 1.25 : 1;
    ctx.scale(kidS, kidS); ctx.translate(0, kid ? 12 : 0);
    if (view === 'back') {
      A.circ(ctx, 0, 2, 38, sil || '#2A1E18', sil ? 0 : 4);
      if (!sil) { A.circ(ctx, -37, 8, 8, K(C.skinD), 2.5); A.circ(ctx, 37, 8, 8, K(C.skinD), 2.5); A.fill(ctx, [[-16, 30], [16, 30], [20, 58], [-20, 58]], C.skinD, 3); A.fill(ctx, [[-30, 50], [30, 50], [34, 64], [-34, 64]], C.cream, 3); }
    } else {
      // neck + stock
      fill([[-16, 24], [16, 24], [18, 56], [-18, 56]], C.skinD, sil ? 0 : 3);
      A.shape(ctx, G.ellPts(0, 0, 36, 46), sil || K(C.skin), { hatch: false, lw: sil ? 0 : 4.5, seed: 11 });
      if (!sil) {
        fill([[-36, -10], [-34, -34], [-20, -44], [20, -44], [34, -34], [36, -10], [30, -18], [14, -22], [-4, -26], [-24, -20]], '#2D2019', 0); // hair + fringe
        A.circ(ctx, -37, 6, 8, K(C.skinD), 2.5); A.circ(ctx, 37, 6, 8, K(C.skinD), 2.5);
        const lx = look * 3;
        // brows, eyes, nose, mouth: stern
        A.stroke(ctx, [[-25, -6], [-8, -2]], '#2D2019', 4.5); A.stroke(ctx, [[25, -6], [8, -2]], '#2D2019', 4.5);
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 15 + lx, 6, 8, 5, 0, 0, TAU); ctx.fillStyle = '#F4EFE3'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke(); A.circ(ctx, sd * 15 + lx * 2, 6, 3.4, '#1E1713', 0); }
        A.stroke(ctx, [[2, 10], [8, 26], [-1, 29]], K(C.skinD), 3.5);
        if (mouth > 0.05) { ctx.beginPath(); ctx.ellipse(0, 36, 11, 2 + 8 * mouth, 0, 0, TAU); ctx.fillStyle = '#4A1A18'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke(); }
        else A.stroke(ctx, [[-11, 36], [0, 37], [11, 35]], '#6B3328', 3.5);
        A.stroke(ctx, [[-22, 30], [-14, 42]], 'rgba(120,70,40,0.4)', 3); A.stroke(ctx, [[22, 30], [14, 42]], 'rgba(120,70,40,0.4)', 3);
      }
      fill([[-30, 50], [30, 50], [34, 64], [-34, 64]], C.cream, sil ? 0 : 3); // cravat
      if (!sil) fill([[-30, 62], [30, 62], [30, 74], [-30, 74]], C.red, 3);
    }
    // hat
    if (hat) {
      const hp = [[-112, -40], [-96, -70], [-62, -102], [-20, -118], [20, -118], [62, -102], [96, -70], [112, -40], [86, -30], [40, -24], [0, -22], [-40, -24], [-86, -30]].map((p) => [p[0], p[1] + 8]);
      fill(hp, '#25201E', sil ? 0 : 4);
      if (!sil) {
        A.stroke(ctx, hp.slice(0, 8).map((p) => [p[0], p[1] + 3]), K(C.gold), 5);
        if (view === 'front') { A.circ(ctx, 58, -62, 16, K(C.blue), 2.5); A.circ(ctx, 58, -62, 10.5, K(C.cream), 0); A.circ(ctx, 58, -62, 5, K(C.red), 0); }
      }
    }
    ctx.restore();
    // crown (held up / on head)
    if (crown) A.crown(ctx, crown.x, crown.y, crown.s || 1);
    ctx.restore();
  };

  A.crown = (ctx, x, y, s = 1) => { // gold laurel crown
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = -5; i <= 5; i++) {
      const a = i * 0.22; ctx.save(); ctx.translate(Math.sin(a) * 58, -Math.cos(a) * 14 + Math.abs(i) * 3); ctx.rotate(a * 1.2 - 0.6);
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.5, 0, 0, TAU); ctx.fillStyle = K(i % 2 ? C.gold : C.goldL); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
    }
    A.stroke(ctx, [[-60, 4], [0, 12], [60, 4]], K(C.goldD), 5);
    ctx.restore();
  };

  // ---------- young cadet / schoolboy ----------
  A.boy = (ctx, o) => {
    const { x, y, s = 1, coat = C.greyD, hair = '#2D2019', skin = C.skin, pose = 'stand', laugh = 0, t = 0, flip = false, head = 1 } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s);
    ctx.fillStyle = 'rgba(30,20,10,0.2)'; ctx.beginPath(); ctx.ellipse(0, 3, 62, 10, 0, 0, TAU); ctx.fill();
    A.fill(ctx, [[-26, -150], [-6, -150], [-8, -12], [-30, -12]], K(C.cream), 3.5); A.fill(ctx, [[6, -150], [26, -150], [30, -12], [8, -12]], K(C.cream), 3.5);
    A.fill(ctx, [[-36, -18], [-6, -18], [-4, -2], [-42, -2]], '#1D1816', 3); A.fill(ctx, [[6, -18], [36, -18], [42, -2], [4, -2]], '#1D1816', 3);
    A.fill(ctx, [[-40, -300], [40, -300], [46, -150], [-46, -150]], K(coat), 4);
    A.fill(ctx, [[-14, -300], [14, -300], [10, -170], [-10, -170]], K(C.cream), 2.5);
    for (let i = 0; i < 3; i++) { A.circ(ctx, -22, -270 + i * 36, 4.5, K(C.gold), 2); A.circ(ctx, 22, -270 + i * 36, 4.5, K(C.gold), 2); }
    A.fill(ctx, [[-40, -300], [-20, -300], [-20, -284], [-40, -284]], C.red, 2.5);
    // arms
    const arm = (pts, w) => { A.stroke(ctx, pts, C.ink, w + 7); A.stroke(ctx, pts, K(coat), w); };
    if (pose === 'point') { arm([[-36, -288], [-76, -260], [-92, -236]], 28); arm([[36, -288], [96, -300], [150, -306]], 26); A.circ(ctx, 158, -306, 12, K(skin), 3); A.stroke(ctx, [[160, -308], [196, -316]], K(skin), 9); }
    else if (pose === 'cower') { arm([[-36, -288], [-62, -230], [-18, -216]], 26); arm([[36, -288], [62, -230], [18, -216]], 26); }
    else { arm([[-36, -288], [-58, -230], [-50, -170]], 28); arm([[36, -288], [58, -230], [50, -170]], 28); A.circ(ctx, -50, -162, 12, K(skin), 3); A.circ(ctx, 50, -162, 12, K(skin), 3); }
    // head
    ctx.save(); ctx.translate(0, -352); ctx.scale(head, head);
    if (pose === 'cower') ctx.rotate(0.18);
    A.shape(ctx, G.ellPts(0, 0, 40, 46), K(skin), { hatch: false, lw: 4, seed: 21 });
    A.fill(ctx, [[-42, -4], [-40, -34], [-20, -50], [10, -52], [34, -40], [42, -8], [30, -22], [8, -28], [-12, -22], [-30, -12]].map((p) => [p[0], p[1] + 4]), hair, 0);
    if (pose === 'cower') { A.stroke(ctx, [[-24, -6], [-8, -12]], hair, 4); A.stroke(ctx, [[24, -6], [8, -12]], hair, 4); A.circ(ctx, -14, 6, 4, '#1E1713', 0); A.circ(ctx, 14, 6, 4, '#1E1713', 0); A.stroke(ctx, [[-10, 32], [0, 28], [10, 32]], '#6B3328', 3.5); A.circ(ctx, 38, 8, 4.5, '#9CC3E0', 1.5); }
    else if (laugh > 0) { A.stroke(ctx, [[-24, 2], [-14, -6], [-4, 2]], C.ink, 4); A.stroke(ctx, [[4, 2], [14, -6], [24, 2]], C.ink, 4); ctx.beginPath(); ctx.ellipse(0, 26, 17, 8 + 9 * laugh * (0.5 + 0.5 * Math.sin(t * 22)), 0, 0, TAU); ctx.fillStyle = '#4A1A18'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke(); }
    else { A.stroke(ctx, [[-24, -8], [-8, -4]], hair, 4); A.stroke(ctx, [[24, -8], [8, -4]], hair, 4); A.circ(ctx, -14, 6, 4, '#1E1713', 0); A.circ(ctx, 14, 6, 4, '#1E1713', 0); A.stroke(ctx, [[-12, 32], [0, 33], [12, 30]], '#6B3328', 3.5); }
    A.circ(ctx, -42, 6, 7, K(skin), 2.5); A.circ(ctx, 42, 6, 7, K(skin), 2.5);
    ctx.restore();
    ctx.restore();
  };

  // ---------- soldiers (cheap, drawn in crowds) ----------
  // pose: march | aim | charge | cheer | hunch | fall | stand ; ph = walk phase; hat:false = no shako (thrown in the air)
  A.soldier = (ctx, o) => {
    const { x, y, s = 1, pose = 'march', ph = 0, face = 1, coat = C.blue, hat = true, plume = C.red, fade = 1, lw = 3, v = 0 } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    if (fade < 1) ctx.globalAlpha *= fade;
    const hunch = pose === 'hunch';
    const cc = hunch ? A.mix(C.greyD, coat, 0.25) : coat;
    if (pose === 'fall') ctx.rotate(-1.35 * clamp(ph));
    const sw = Math.sin(ph * 6.2832) * (pose === 'charge' ? 20 : 12);
    ctx.fillStyle = 'rgba(30,20,10,0.2)'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 5, 0, 0, TAU); ctx.fill();
    // legs
    A.stroke(ctx, [[-7, -78], [-7 - sw * 0.5, -40], [-7 - sw, -4]], '#E8E1CD', 12); A.stroke(ctx, [[7, -78], [7 + sw * 0.5, -40], [7 + sw, -4]], '#E8E1CD', 12);
    A.fill(ctx, [[-14 - sw, -10], [-2 - sw, -10], [2 - sw, 2], [-18 - sw, 2]], '#1D1816', 2); A.fill(ctx, [[2 + sw, -10], [14 + sw, -10], [18 + sw, 2], [-2 + sw, 2]], '#1D1816', 2);
    // coat
    const lean = pose === 'charge' ? 10 : hunch ? 14 : 0;
    A.fill(ctx, [[-20 + lean, -128], [20 + lean, -128], [23, -70], [-23, -70]], K(cc), lw);
    if (!hunch) {
      A.stroke(ctx, [[-16 + lean, -126], [17, -76]], '#EFE8D3', 5); A.stroke(ctx, [[16 + lean, -126], [-17, -76]], '#EFE8D3', 5);
      A.fill(ctx, [[-22 + lean, -130], [-10 + lean, -130], [-10 + lean, -122], [-22 + lean, -122]], C.red, 1.5); A.fill(ctx, [[10 + lean, -130], [22 + lean, -130], [22 + lean, -122], [10 + lean, -122]], C.red, 1.5);
    } else A.stroke(ctx, [[-14 + lean, -128], [-2 + lean, -118], [12 + lean, -128]], K(C.greyL), 6);
    // head
    const hx = lean * 1.1, hy = hunch ? -134 : -142;
    A.circ(ctx, hx, hy, 11, K(C.skin), lw - 0.5);
    if (hat) {
      if (hunch) A.fill(ctx, [[hx - 14, hy - 4], [hx + 14, hy - 4], [hx + 12, hy - 20], [hx - 12, hy - 20]], A.mix(C.greyD, '#222', 0.4), 2.5);
      else { A.fill(ctx, [[hx - 11, hy - 8], [hx + 11, hy - 8], [hx + 13, hy - 38], [hx - 13, hy - 38]], '#211B18', lw - 0.5); A.fill(ctx, [[hx - 11, hy - 10], [hx + 11, hy - 10], [hx + 11, hy - 15], [hx - 11, hy - 15]], K(C.gold), 1.5); A.circ(ctx, hx, hy - 42, 4.5, K(plume), 1.5); }
    }
    // musket
    const musket = (a, b, bay) => { A.stroke(ctx, [a, b], '#6B4A2E', 5); A.stroke(ctx, [b, bay], '#C8C8C8', 3); };
    if (pose === 'march' || pose === 'stand') { A.stroke(ctx, [[18, -118], [28, -100], [20, -92]], K(cc), 9); musket([22, -70], [26, -170], [26, -200]); }
    else if (pose === 'aim') { A.stroke(ctx, [[18, -118], [38, -112], [50, -112]], K(cc), 9); musket([-12, -104], [64, -116], [100, -120]); A.stroke(ctx, [[-14, -110], [8, -108]], K(cc), 9); }
    else if (pose === 'charge') { A.stroke(ctx, [[18, -116], [40, -92], [54, -86]], K(cc), 9); musket([-14, -76], [66, -96], [104, -108]); }
    else if (pose === 'cheer') { const w = Math.sin(v * 9) * 8; A.stroke(ctx, [[-18, -118], [-34, -150 - w], [-30, -184 - w]], K(cc), 9); A.stroke(ctx, [[18, -118], [34, -150 + w], [30, -184 + w]], K(cc), 9); A.circ(ctx, -30, -188 - w, 6, K(C.skin), 2); A.circ(ctx, 30, -188 + w, 6, K(C.skin), 2); }
    else if (pose === 'hunch') { A.stroke(ctx, [[16, -116], [24, -96], [18, -82]], K(cc), 9); A.stroke(ctx, [[20, -82], [24, -2]], '#6B4A2E', 5); }
    ctx.restore();
  };

  A.flag = (ctx, x, y, h, t, { w = 120, hh = 80, tri = true } = {}) => { // tricolour on a pole
    A.stroke(ctx, [[x, y], [x, y - h]], '#5B3F26', 7);
    A.circ(ctx, x, y - h - 6, 8, K(C.gold), 2.5);
    const bands = [C.blue, C.cream, C.red];
    bands.forEach((c, k) => {
      const x0 = x + 4 + (w * k) / 3, x1 = x + 4 + (w * (k + 1)) / 3;
      const f = (xx) => Math.sin(t * 7 - ((xx - x) / w) * 5) * 9 * ((xx - x) / w);
      A.fill(ctx, [[x0, y - h + 8 + f(x0)], [x1, y - h + 8 + f(x1)], [x1, y - h + 8 + hh + f(x1)], [x0, y - h + 8 + hh + f(x0)]], K(c), 2.5);
    });
  };

  A.cannon = (ctx, o) => {
    const { x, y, s = 1, recoil = 0, sil = null, angle = -0.22, face = 1 } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    const F = (c) => sil || K(c);
    ctx.save(); ctx.translate(-recoil, 0);
    ctx.save(); ctx.translate(0, -78); ctx.rotate(angle);
    A.fill(ctx, [[-120, -26], [96, -17], [108, -22], [112, 0], [108, 22], [96, 17], [-120, 30]], F('#5E4B2A'), sil ? 0 : 4);
    if (!sil) { A.fill(ctx, [[-120, -26], [96, -17], [96, -9], [-120, -16]], C.goldL, 0); A.stroke(ctx, [[-40, -24], [-40, 26]], K(C.goldD), 6); A.stroke(ctx, [[30, -20], [30, 20]], K(C.goldD), 6); A.circ(ctx, -122, 2, 10, F('#5E4B2A'), 3); }
    ctx.restore();
    A.fill(ctx, [[-110, -62], [60, -80], [60, -40], [-110, -30]], F('#6B4A2E'), sil ? 0 : 4);
    ctx.restore();
    // wheel
    ctx.beginPath(); ctx.arc(-20, -50, 50, 0, TAU); ctx.fillStyle = F('#6B4A2E'); ctx.fill(); if (!sil) { ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.beginPath(); ctx.arc(-20, -50, 37, 0, TAU); ctx.fillStyle = F('#8A6840'); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); for (let i = 0; i < 8; i++) A.stroke(ctx, [[-20, -50], [-20 + Math.cos(i * 0.785) * 44, -50 + Math.sin(i * 0.785) * 44]], C.ink, 4); A.circ(ctx, -20, -50, 8, K(C.goldD), 2.5); }
    ctx.restore();
  };

  A.ship = (ctx, o) => {
    const { x, y, s = 1, col = '#0E1226', sails = '#C9BFA5', lit = 0 } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    A.fill(ctx, [[-150, -30], [150, -30], [118, 18], [-120, 18]], col, 2.5);
    for (const mx of [-70, 0, 70]) {
      A.stroke(ctx, [[mx, -30], [mx, -230]], col, 6);
      A.fill(ctx, [[mx - 46, -210], [mx + 46, -210], [mx + 38, -104], [mx - 38, -104]], A.mix(sails, col, 0.35 - lit * 0.3), 2);
      A.fill(ctx, [[mx - 52, -96], [mx + 52, -96], [mx + 44, -38], [mx - 44, -38]], A.mix(sails, col, 0.45 - lit * 0.3), 2);
    }
    ctx.restore();
  };

  // ---------- camera ----------
  A.cam = (ctx, { cx, cy, zoom = 1, rot = 0, shakeA = 0, t = 0 }) => {
    const W = G.W, Hh = G.H;
    const sx = shakeA ? U.noise1(t * 35, 1) * shakeA : 0, sy = shakeA ? U.noise1(t * 35, 2) * shakeA : 0;
    ctx.translate(W / 2 + sx, Hh / 2 + sy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
  };

  // ---------- Europe ----------
  const FRANCE = [2.5, 46.5];
  const EUROPE = ['Portugal', 'Spain', 'France', 'Italy', 'Switzerland', 'Belgium', 'Netherlands', 'Germany', 'Austria', 'Poland', 'Denmark', 'Czechia', 'Slovakia', 'Hungary', 'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Albania', 'Macedonia', 'Kosovo', 'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Russia', 'Sweden', 'Norway', 'Finland', 'United Kingdom', 'Ireland', 'Iceland', 'Turkey', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Cyprus'];
  const NEVER = new Set(['United Kingdom', 'Ireland', 'Iceland', 'Russia', 'Turkey', 'Sweden', 'Norway', 'Finland', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Cyprus', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Moldova']);
  const centroid = (r) => { let sx = 0, sy = 0, n = r.length / 2; for (let i = 0; i < r.length; i += 2) { sx += r[i]; sy += r[i + 1]; } return [sx / n, sy / n]; };
  let EU = null;
  A.europeMap = (ctx, box, o = {}) => {
    const { blue = 0, shrink = 0, crumble = 0, crack = 0, land = C.parch, sea = null, lw = 2.5, region = 'Europe', fillFor = null } = o;
    const map = Data.map({ region, x: box.x, y: box.y, w: box.w, h: box.h, pad: 0.0 });
    if (!EU) {
      EU = [];
      for (const name of EUROPE) {
        const rings = GEO.world[name]; if (!rings) continue;
        const cs = centroid(rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0]));
        const d = Math.hypot(cs[0] - FRANCE[0], (cs[1] - FRANCE[1]) * 1.3);
        EU.push({ name, rings, c: cs, d });
      }
    }
    if (sea) { ctx.fillStyle = sea; ctx.fillRect(box.x, box.y, box.w, box.h); }
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); if (!crumble) ctx.clip(); else { ctx.restore(); ctx.save(); }
    const maxD = 26;
    for (const c of EU) {
      // how blue: spreads outward from France over `blue` 0..1 ; shrink pulls it back to France only
      let k = NEVER.has(c.name) ? 0 : clamp((blue * 1.25 - c.d / maxD) * 3);
      if (c.name === 'France') k = Math.max(k, clamp(blue * 6));
      if (shrink > 0 && c.name !== 'France') k = Math.min(k, clamp((1 - shrink) * 1.3 - c.d / maxD * 0.9 + 0.1));
      const fillC = fillFor ? fillFor(c.name, k) : A.mix(land, C.blue, k);
      const hsh = H(c.name.length, c.d * 3, 5);
      const pc = map.proj(c.c[0], c.c[1]);
      for (const r0 of c.rings) {
        ctx.save();
        if (crumble > 0) {
          const dl = hsh * 0.35, cu = clamp((crumble - dl) / (1 - dl));
          ctx.translate(pc[0], pc[1] + cu * cu * 1500 * (0.6 + hsh)); ctx.rotate((hsh - 0.5) * 2.2 * cu); ctx.translate(-pc[0], -pc[1]);
          ctx.globalAlpha *= 1 - clamp(cu * 1.1 - 0.35);
        }
        ctx.beginPath();
        for (let q = 0; q < r0.length; q += 2) { const p = map.proj(r0[q], r0[q + 1]); if (q === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
        ctx.closePath(); ctx.fillStyle = fillC; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.restore();
      }
    }
    // cracks
    if (crack > 0) {
      const lines = [[[0.52, 0], [0.47, 0.14], [0.56, 0.28], [0.44, 0.44], [0.55, 0.6], [0.46, 0.78], [0.52, 1]], [[0.1, 0.35], [0.3, 0.42], [0.42, 0.5], [0.58, 0.46], [0.75, 0.55], [0.92, 0.5]], [[0.7, 0.05], [0.66, 0.2], [0.74, 0.34], [0.62, 0.5]], [[0.3, 0.6], [0.25, 0.75], [0.33, 0.9]]];
      lines.forEach((ln, i) => {
        const n = Math.max(2, Math.ceil(ln.length * clamp(crack * 1.4 - i * 0.12)));
        if (crack * 1.4 - i * 0.12 <= 0) return;
        const pts = ln.slice(0, n).map((p) => [box.x + p[0] * box.w, box.y + p[1] * box.h]);
        A.stroke(ctx, pts, 'rgba(240,230,205,0.9)', 11); A.stroke(ctx, pts, C.ink, 5);
      });
    }
    ctx.restore();
    return map;
  };
})();
