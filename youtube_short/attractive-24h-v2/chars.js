// The "What If" cast: black round heads with big white eyes, coloured hoodies, dark pants. Plus small drawing
// helpers (rounded boxes, text, emoji, hearts, sparkles, speech bubbles, message cards) used by the scenes.
// Everything is a pure function of its arguments (and t), so any frame can be drawn by any worker.
(function () {
  const U = globalThis.U;
  const WF = (globalThis.WF = {});
  const INK = (WF.INK = '#16161c');
  WF.BLUE = '#2860de';
  const BROW = '#d6d6d6';

  // ---------- primitives ----------
  WF.rr = (ctx, x, y, w, h, r, fill, stroke, lw = 4) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };
  WF.circ = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  WF.ell = (ctx, x, y, rx, ry, fill, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  WF.poly = (ctx, pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  WF.stroke = (ctx, pts, col, lw, cap = 'round') => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke();
  };
  WF.font = (size, weight = 800) => `${weight} ${size}px "Inter", "Noto Color Emoji", sans-serif`;
  WF.txt = (ctx, str, x, y, size, color, { weight = 800, align = 'center', baseline = 'middle', stroke, strokeW = 8, alpha = 1, maxW } = {}) => {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.font = WF.font(size, weight); ctx.textAlign = align; ctx.textBaseline = baseline;
    if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { ctx.font = WF.font(size * maxW / w, weight); } }
    if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
    ctx.restore();
  };
  WF.measure = (ctx, str, size, weight = 800) => { ctx.save(); ctx.font = WF.font(size, weight); const w = ctx.measureText(str).width; ctx.restore(); return w; };
  WF.emoji = (ctx, e, x, y, size, { alpha = 1, rot = 0, scale = 1 } = {}) => {
    if (scale <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
    ctx.font = `${size}px "Noto Color Emoji"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, size * 0.06);
    ctx.restore();
  };
  WF.heart = (ctx, x, y, r, col) => {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.45);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
    ctx.fillStyle = col; ctx.fill();
  };
  WF.star4 = (ctx, x, y, r, col, rot = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  };
  // pop-in scale: 0 before t0, overshoot, 1
  WF.pop = (t, t0, d = 0.28) => (t < t0 ? 0 : U.ease.outBack(Math.min(1, (t - t0) / d), 2.4));
  WF.fade = (t, t0, d = 0.2) => U.clamp((t - t0) / d);

  // speech bubble: white rounded box with a tail, popping in at t0 and out at t1
  WF.bubble = (ctx, text, x, y, t, t0, t1 = 1e9, { tail = 'left', size = 34, maxW = 520, col = '#fff', ink = INK } = {}) => {
    if (t < t0 || t > t1 + 0.15) return;
    const k = Math.min(WF.pop(t, t0, 0.25), t > t1 ? 1 - (t - t1) / 0.15 : 1);
    const w = Math.min(maxW, WF.measure(ctx, text, size, 700)) + 44, h = size * 1.7;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    WF.rr(ctx, -w / 2, -h / 2, w, h, h / 2, col);
    const tx = tail === 'left' ? -w * 0.25 : w * 0.25;
    WF.poly(ctx, [[tx - 16, h / 2 - 4], [tx + 16, h / 2 - 4], [tx + (tail === 'left' ? -22 : 22), h / 2 + 26]], col);
    ctx.shadowColor = 'transparent';
    WF.txt(ctx, text, 0, 2, size, ink, { weight: 700, maxW });
    ctx.restore();
  };

  // notification / message card: [emoji] Sender / text
  WF.card = (ctx, x, y, t, t0, { sender, text, emoji, w = 560, theme = 'light', t1 = 1e9 } = {}) => {
    if (t < t0 || t > t1 + 0.2) return;
    const k = Math.min(WF.pop(t, t0, 0.3), t > t1 ? 1 - (t - t1) / 0.2 : 1);
    const h = 108, dark = theme === 'dark';
    ctx.save(); ctx.translate(x, y + (1 - k) * 30); ctx.globalAlpha *= U.clamp(k * 1.5);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    WF.rr(ctx, -w / 2, -h / 2, w, h, 26, dark ? '#1d2630' : '#ffffff');
    ctx.shadowColor = 'transparent';
    WF.rr(ctx, -w / 2 + 16, -h / 2 + 16, 76, 76, 20, dark ? '#2c3a48' : '#eef1f6');
    WF.emoji(ctx, emoji, -w / 2 + 54, 0, 46);
    WF.txt(ctx, sender, -w / 2 + 110, -18, 24, dark ? '#8fe9dc' : '#6b7280', { align: 'left', weight: 700 });
    WF.txt(ctx, text, -w / 2 + 110, 18, 30, dark ? '#ffffff' : INK, { align: 'left', weight: 800, maxW: w - 130 });
    ctx.restore();
  };

  // ---------- the person ----------
  // simple 2-bone IK: shoulder S -> hand P, upper/lower length a, b; bend = +1 elbow down/out
  function ik(S, P, a, b, bend) {
    let dx = P[0] - S[0], dy = P[1] - S[1];
    let d = Math.hypot(dx, dy);
    const dd = Math.min(d, a + b - 0.01);
    const ang = Math.atan2(dy, dx);
    const c = U.clamp((a * a + dd * dd - b * b) / (2 * a * dd), -1, 1);
    const e = ang + bend * Math.acos(c);
    return [S[0] + Math.cos(e) * a, S[1] + Math.sin(e) * a];
  }

  // hand targets for the +x arm (local coords, feet at 0,0; mirrored for the -x arm)
  const ARMS = {
    down: [60, -126], hip: [78, -150], phone: [20, -196], photo: [70, -318], point: [160, -238], up: [86, -360],
    wave: [100, -330], coffee: [58, -178], belly: [26, -152], face: [34, -296], eat: [30, -268], shrug: [104, -250],
    hold: [40, -190],
  };

  WF.person = (ctx, o) => {
    const {
      x, y, s = 1, facing = 1, pose = 'stand', expr = 'neutral', look = 0, lookY = 0, hair = 'quiff', hairCol = '#6b4428',
      shirt = WF.BLUE, pants = '#24242f', hot = 0, armL = 'down', armR = 'down', walk = null, t = 0, seed = 1,
      hood = true, tie = null, talk = false, prop = null, propL = null, alpha = 1, dy: lift = 0, shake = 0,
    } = o;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x + (shake ? Math.sin(t * 70 + seed) * shake : 0), y);
    // ground shadow
    WF.ell(ctx, 0, 4, 78 * s, 13 * s, 'rgba(0,0,0,0.16)');
    ctx.translate(0, -lift);
    ctx.scale(s * facing, s);
    const sit = pose === 'sit';
    const bob = walk !== null ? -Math.abs(Math.sin(walk)) * 7 : sit ? 0 : Math.sin(t * 2.2 + seed) * 1.5;
    const dy = (sit ? 22 : 0) + bob;

    // hot = golden aura behind everything
    if (hot > 0) {
      const g = ctx.createRadialGradient(0, -280 + dy, 10, 0, -280 + dy, 190);
      g.addColorStop(0, `rgba(255,214,110,${0.55 * hot})`); g.addColorStop(1, 'rgba(255,214,110,0)');
      ctx.fillStyle = g; ctx.fillRect(-200, -480 + dy, 400, 400);
    }

    // long hair hangs behind the head
    const hy = -302 + dy;
    if (hair === 'long') { WF.rr(ctx, -60, hy - 30, 120, 120, 40, hairCol); }

    // ---- legs ----
    const shoe = '#0e0e12';
    if (sit) {
      for (const sx of [-1, 1]) {
        WF.stroke(ctx, [[sx * 22, -112 + dy], [sx * 36, -64], [sx * 38, -8]], pants, 30);
        WF.ell(ctx, sx * 44, -4, 22, 11, shoe);
      }
    } else {
      for (const sx of [-1, 1]) {
        const ph = walk !== null ? Math.sin(walk + (sx > 0 ? Math.PI : 0)) : 0;
        const fx = sx * 22 + ph * 30, fy = walk !== null ? -Math.max(0, -Math.cos(walk + (sx > 0 ? Math.PI : 0))) * 16 : 0;
        WF.stroke(ctx, [[sx * 20, -126 + dy], [sx * 21 + ph * 14, -62 + fy / 2], [fx, -8 + fy]], pants, 30);
        WF.ell(ctx, fx + 8, -4 + fy, 23, 11, shoe);
      }
    }

    // ---- torso (hoodie) ----
    const top = -246 + dy, bot = -112 + dy;
    ctx.beginPath();
    ctx.moveTo(-50, top + 8); ctx.quadraticCurveTo(-56, top, -40, top - 4); ctx.lineTo(40, top - 4); ctx.quadraticCurveTo(56, top, 50, top + 8);
    ctx.lineTo(60, bot - 8); ctx.quadraticCurveTo(60, bot, 50, bot); ctx.lineTo(-50, bot); ctx.quadraticCurveTo(-60, bot, -60, bot - 8); ctx.closePath();
    ctx.fillStyle = shirt; ctx.fill();
    const dark = U && G && G.tint ? G.tint(shirt, -0.22) : shirt;
    if (hood) {
      WF.ell(ctx, 0, top + 2, 46, 16, dark); // the hood bunched behind the neck
      WF.stroke(ctx, [[-12, top + 14], [-14, top + 58]], '#f2f2f2', 4); WF.stroke(ctx, [[12, top + 14], [14, top + 58]], '#f2f2f2', 4);
      WF.rr(ctx, -36, bot - 50, 72, 36, 12, dark); // kangaroo pocket
      WF.rr(ctx, -60, bot - 12, 120, 12, 6, dark); // waistband
    } else {
      // shirt + collar (+ tie)
      WF.poly(ctx, [[-22, top - 2], [0, top + 24], [22, top - 2]], '#f5f5f5');
      if (tie) WF.poly(ctx, [[-8, top + 12], [8, top + 12], [12, top + 80], [0, top + 96], [-12, top + 80]], tie);
    }

    // ---- head ----
    WF.ell(ctx, 0, top + 2, 16, 12, INK); // neck
    if (hot > 0) { ctx.save(); ctx.shadowColor = `rgba(255,200,80,${hot})`; ctx.shadowBlur = 30 * hot; WF.circ(ctx, 0, hy, 54, INK); ctx.restore(); }
    WF.circ(ctx, 0, hy, 54, INK);
    WF.face(ctx, 0, hy, { expr, look, lookY, t, seed, talk, hot });
    WF.hair(ctx, 0, hy, hair, hairCol, hot, o.capCol);

    // ---- arms (after torso so they read in front) ----
    for (const [side, name] of [[-1, armL], [1, armR]]) {
      let tgt = ARMS[name] || ARMS.down;
      let hx = tgt[0], hyy = tgt[1];
      if (name === 'wave') hyy += Math.sin(t * 12) * 10, hx += Math.sin(t * 12) * 18;
      if (name === 'belly') hyy += Math.sin(t * 18) * 6;
      const S = [side * 50, top + 14];
      const P = [side * hx, hyy + dy];
      const E = ik(S, P, 72, 72, side > 0 ? 1 : -1);
      WF.stroke(ctx, [S, E, P], shirt, 26);
      WF.circ(ctx, P[0], P[1], 13, INK);
      const pr = side > 0 ? prop : propL;
      if (pr) WF.prop(ctx, pr, P[0], P[1], side, t);
    }

    // hot sparkles around the head
    if (hot > 0.05) {
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.9 + i / 6) % 1;
        const a = U.hash(seed, i) * Math.PI * 2 + t * 0.4;
        const r = 80 + 30 * U.hash(seed, i, 2);
        const k = Math.sin(ph * Math.PI);
        WF.star4(ctx, Math.cos(a) * r, hy + Math.sin(a) * r * 0.9, 14 * k * hot, '#ffe9a6', t * 2 + i);
      }
    }
    ctx.restore();
  };

  WF.prop = (ctx, kind, x, y, side, t) => {
    if (kind === 'phone') {
      WF.rr(ctx, x - 16, y - 34, 32, 56, 7, '#22252b'); WF.rr(ctx, x - 12, y - 29, 24, 44, 4, '#8fe3ff');
    } else if (kind === 'phoneLit') {
      ctx.save(); ctx.shadowColor = '#9fe8ff'; ctx.shadowBlur = 40; WF.rr(ctx, x - 16, y - 34, 32, 56, 7, '#22252b'); ctx.restore();
      WF.rr(ctx, x - 12, y - 29, 24, 44, 4, '#c8f3ff');
    } else if (kind === 'cup') {
      WF.poly(ctx, [[x - 16, y - 40], [x + 16, y - 40], [x + 12, y + 4], [x - 12, y + 4]], '#ffffff');
      WF.rr(ctx, x - 18, y - 46, 36, 9, 4, '#8a5a3c');
    } else if (kind === 'pizza') {
      WF.poly(ctx, [[x - 4, y + 6], [x + 46, y - 30], [x + 34, y - 46]], '#f4c25a');
      WF.circ(ctx, x + 30, y - 32, 5, '#d0453a');
    }
  };

  // the face on a black head: white eyes, light brows, light mouth
  WF.face = (ctx, cx, cy, { expr = 'neutral', look = 0, lookY = 0, t = 0, seed = 1, talk = false } = {}) => {
    const fx = cx + look * 9, ey = cy - 6;
    const blink = ((t + seed * 0.77) % 3.3) < 0.11 && !['happy', 'laugh', 'love'].includes(expr);
    const W = '#fafafa';
    const eyes = (rx, ry, pr, py = 0) => {
      for (const sx of [-1, 1]) {
        const ex = fx + sx * 20;
        if (blink) { WF.stroke(ctx, [[ex - rx, ey], [ex + rx, ey]], W, 4); continue; }
        WF.ell(ctx, ex, ey, rx, ry, W);
        WF.circ(ctx, ex + look * 5, ey + lookY * (ry - pr - 2) + py, pr, INK);
        WF.circ(ctx, ex + look * 5 + pr * 0.35, ey + lookY * (ry - pr - 2) + py - pr * 0.35, pr * 0.3, W);
      }
    };
    const brows = (lift, tilt) => { // tilt > 0: angry (inner down), < 0: worried (inner up)
      for (const sx of [-1, 1]) {
        const bx = fx + sx * 20, by = ey - 30 - lift;
        WF.stroke(ctx, [[bx - sx * 14, by + tilt * 7 * 1], [bx + sx * 12, by - tilt * 7]], BROW, 5);
      }
    };
    const my = cy + 28;
    const mouthLine = (pts, col = W, lw = 4) => WF.stroke(ctx, pts.map(([a, b]) => [fx + a, my + b]), col, lw);
    const openMouth = (w, h) => { WF.ell(ctx, fx, my + 2, w, h, '#a8323a'); WF.ell(ctx, fx, my - h * 0.55, w * 0.8, h * 0.32, W); };
    switch (expr) {
      case 'shock': eyes(16, 22, 5); brows(10, 0); openMouth(9, 11); break;
      case 'smug':
        eyes(15, 18, 7, 2);
        for (const sx of [-1, 1]) WF.rr(ctx, fx + sx * 20 - 17, ey - 22, 34, 18, 4, INK); // half-closed lids
        WF.stroke(ctx, [[fx - 34, ey - 22], [fx - 8, ey - 26]], BROW, 5); WF.stroke(ctx, [[fx + 8, ey - 34], [fx + 34, ey - 30]], BROW, 5);
        mouthLine([[-12, 2], [4, 4], [16, -4]]); break;
      case 'happy': eyes(14, 18, 7); brows(4, -0.2); mouthLine([[-14, -2], [0, 8], [14, -2]]); break;
      case 'laugh':
        for (const sx of [-1, 1]) WF.stroke(ctx, [[fx + sx * 20 - 12, ey + 4], [fx + sx * 20, ey - 8], [fx + sx * 20 + 12, ey + 4]], W, 5);
        brows(8, -0.2); openMouth(14, 10 + 3 * Math.abs(Math.sin(t * 16))); break;
      case 'love':
        for (const sx of [-1, 1]) WF.heart(ctx, fx + sx * 20, ey, 15 * (1 + 0.12 * Math.sin(t * 10)), '#ff4d6d');
        mouthLine([[-14, -2], [0, 8], [14, -2]]); break;
      case 'sad': eyes(14, 17, 6, 4); brows(2, -1); mouthLine([[-12, 6], [0, -1], [12, 6]]); break;
      case 'nervous':
        eyes(15, 19, 5); brows(6, -0.8);
        mouthLine([[-14, 2], [-7, -2], [0, 2], [7, -2], [14, 2]]);
        WF.ell(ctx, cx + 46, cy - 26, 7, 11, '#8fd3ff'); break;
      case 'angry': eyes(14, 15, 6); brows(-2, 1.1); mouthLine([[-12, 4], [0, 0], [12, 4]]); break;
      case 'tired':
        eyes(14, 16, 6, 3); for (const sx of [-1, 1]) WF.rr(ctx, fx + sx * 20 - 16, ey - 20, 32, 16, 3, INK);
        mouthLine([[-8, 2], [8, 2]]); break;
      case 'focus': eyes(14, 17, 7); brows(0, 0.5); mouthLine([[-8, 2], [8, 2]]); break;
      default: eyes(14, 18, 7); brows(4, 0); mouthLine([[-8, 3], [8, 3]]);
    }
    if (talk && !['shock', 'laugh'].includes(expr)) { const k = Math.abs(Math.sin(t * 17)); if (k > 0.3) openMouth(8, 3 + 6 * k); }
  };

  WF.hair = (ctx, cx, cy, kind, col, hot = 0, capCol = '#c0392b') => {
    ctx.save(); ctx.translate(cx, cy);
    if (kind === 'quiff') {
      ctx.beginPath();
      ctx.moveTo(-54, -4); ctx.bezierCurveTo(-60, -50, -30, -66, 0, -64);
      ctx.bezierCurveTo(30, -92, 66, -76, 62, -40); // the swept front quiff
      ctx.bezierCurveTo(70, -30, 58, -14, 54, -6);
      ctx.bezierCurveTo(40, -34, 10, -40, -22, -32); ctx.bezierCurveTo(-40, -28, -50, -18, -54, -4);
      ctx.fillStyle = col; ctx.fill();
      if (hot > 0) { ctx.globalAlpha = 0.55 * hot; WF.stroke(ctx, [[-20, -54], [10, -66], [40, -72]], '#f6d38a', 6); }
    } else if (kind === 'messy') {
      const pts = [[-56, -4]];
      for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; const r = i % 2 ? 64 : 76; pts.push([Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.92 - 4]); }
      pts.push([56, -4], [36, -26], [0, -32], [-36, -26]);
      WF.poly(ctx, pts, col);
    } else if (kind === 'long') {
      ctx.beginPath(); ctx.arc(0, -4, 58, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(10, -40, -56, -6); ctx.fillStyle = col; ctx.fill();
    } else if (kind === 'bun') {
      WF.circ(ctx, 0, -66, 24, col);
      ctx.beginPath(); ctx.arc(0, -4, 57, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, -36, -55, -8); ctx.fillStyle = col; ctx.fill();
    } else if (kind === 'cap') {
      ctx.beginPath(); ctx.arc(0, -10, 56, Math.PI, 0); ctx.closePath(); ctx.fillStyle = capCol; ctx.fill();
      WF.rr(ctx, 10, -18, 80, 14, 7, G.tint(capCol, -0.2));
    } else if (kind === 'short') {
      ctx.beginPath(); ctx.arc(0, -2, 56, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, -42, -53, -14); ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  };
})();
