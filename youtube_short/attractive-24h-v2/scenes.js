// The scenes, drawn inside the 1080 x 690 story panel. Each is scene(ctx, lt, t, sc) -> fx, where lt is the
// time since the scene started, t the film time, sc = SCORE.SC[id]. fx can ask for a camera {z, cx, cy},
// a white flash, a shake, or a colour tint. All hit times come from SCORE.ev.
(function () {
  const U = globalThis.U, S = globalThis.SCORE, WF = globalThis.WF;
  const { clamp, lerp, ease } = U;
  const ev = S.ev, SC = S.SC;
  const PW = S.PANEL.w, PH = S.PANEL.h, FL = 640;
  const P = WF.person;
  const ORANGE = '#ec8a2e', PINK = '#e8709a', GREEN = '#4fa36a', GREY = '#5c6274', RED = '#d7343c';
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const after = (t, t0) => t >= t0;

  // ---------- cached static backgrounds ----------
  const cache = {};
  function bg(ctx, name, fn) {
    if (!cache[name]) { const c = document.createElement('canvas'); c.width = PW; c.height = PH; fn(c.getContext('2d')); cache[name] = c; }
    ctx.drawImage(cache[name], 0, 0);
  }
  const vgrad = (c, top, bot, y0 = 0, y1 = PH) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); return g; };
  const floor = (c, col, y = FL - 20) => { c.fillStyle = col; c.fillRect(0, y, PW, PH - y); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, PW, 6); };

  // ================= the room at night (hook, rewind, hiding) =================
  const WIN = { x: 90, y: 70, w: 640, h: 420 };
  function roomNight(ctx, lt, t, { duck = 0, hot = 1, face = false, nervous = true, flashes = ev.flashes, crowdLoud = 1 }) {
    bg(ctx, 'roomNight', (c) => {
      c.fillStyle = vgrad(c, '#252a4d', '#1b1f3a'); c.fillRect(0, 0, PW, PH);
      floor(c, '#3a2c2a');
      // lamp
      c.fillStyle = '#4a4f78'; c.fillRect(940, 300, 10, 320);
      WF.poly(c, [[900, 300], [990, 300], [970, 240], [920, 240]], '#f2d48a');
    });
    // outside: street + crowd (behind the glass)
    ctx.save();
    ctx.beginPath(); ctx.rect(WIN.x, WIN.y, WIN.w, WIN.h); ctx.clip();
    ctx.fillStyle = vgrad(ctx, '#0f1330', '#272b52', WIN.y, WIN.y + WIN.h); ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    WF.circ(ctx, WIN.x + 520, WIN.y + 70, 28, '#f3efd8'); // moon
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const sx = WIN.x - 20 + i * 82 + (row % 2) * 40 + U.hash(i, row) * 20;
        const by = WIN.y + 260 + row * 70 + Math.sin(t * 3 + i * 1.7 + row) * 6 * crowdLoud;
        const r = 30 - row * -3;
        const col = ['#3d4170', '#34385f', '#2c2f50'][row];
        WF.circ(ctx, sx, by - 40, r, col);
        WF.rr(ctx, sx - r * 1.4, by - 12, r * 2.8, 120, 30, col);
        if ((i + row) % 3 === 0) { // a raised phone with a glowing screen
          const px = sx + 22, py = by - 74 + Math.sin(t * 2 + i) * 4;
          WF.rr(ctx, px - 11, py - 18, 22, 34, 4, '#9fe8ff');
        }
      }
    }
    // camera flashes from the crowd
    for (const [i, ft] of flashes.entries()) {
      const a = t - ft;
      if (a < 0 || a > 0.35) continue;
      const fx = WIN.x + 80 + U.hash(i, 7) * (WIN.w - 160), fy = WIN.y + 150 + U.hash(i, 9) * 120;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 260);
      g.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - a / 0.35)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    }
    ctx.restore();
    // window frame + blinds half down
    ctx.strokeStyle = '#e9e2d0'; ctx.lineWidth = 14; ctx.strokeRect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(WIN.x + WIN.w / 2, WIN.y); ctx.lineTo(WIN.x + WIN.w / 2, WIN.y + WIN.h); ctx.stroke();
    for (let k = 0; k < 5; k++) WF.rr(ctx, WIN.x + 4, WIN.y + 6 + k * 22, WIN.w - 8, 14, 3, 'rgba(225,218,200,0.9)');
    WF.rr(ctx, WIN.x - 20, WIN.y + WIN.h, WIN.w + 40, 18, 4, '#e9e2d0');
    // flash light spilling into the room
    let spill = 0;
    for (const ft of flashes) { const a = t - ft; if (a >= 0 && a < 0.3) spill = Math.max(spill, 1 - a / 0.3); }
    // the hero, pressed against the wall beside the window
    const hx = 860, look = face ? 0 : -1;
    if (duck > 0) {
      const y = FL + 2;
      P(ctx, { x: lerp(860, 600, ease.inOutQuad(duck)), y, s: 1, pose: 'sit', dy: -40 * (1 - duck), hot, t, expr: 'nervous', look: -0.6, lookY: -0.6, armL: 'face', armR: 'face', shake: duck > 0.9 ? 1.5 : 0 });
    } else {
      P(ctx, { x: hx, y: FL, s: 1.05, hot, t, facing: -1, expr: face ? 'shock' : nervous ? 'nervous' : 'neutral', look: face ? 0 : 1, lookY: 0, armL: 'down', armR: face ? 'face' : 'hold' });
    }
    return spill > 0 ? { flash: spill * 0.25 } : {};
  }

  // ================= bathroom (wake, after) =================
  const MIR = { x: 610, y: 90, w: 300, h: 380 };
  function bathroomBg(ctx) {
    bg(ctx, 'bath', (c) => {
      c.fillStyle = vgrad(c, '#efe7da', '#e2d8c8'); c.fillRect(0, 0, PW, PH);
      c.fillStyle = '#d9e6ea'; c.fillRect(0, 360, PW, FL - 380);
      c.strokeStyle = 'rgba(120,140,150,0.25)'; c.lineWidth = 2;
      for (let x = 0; x < PW; x += 60) { c.beginPath(); c.moveTo(x, 360); c.lineTo(x, FL - 20); c.stroke(); }
      for (let y = 360; y < FL - 20; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(PW, y); c.stroke(); }
      floor(c, '#b9a68c');
      // window with morning sky
      c.fillStyle = vgrad(c, '#ffd9a8', '#fff1d9', 90, 300); c.fillRect(110, 90, 220, 210);
      c.strokeStyle = '#ffffff'; c.lineWidth = 12; c.strokeRect(110, 90, 220, 210);
      c.beginPath(); c.moveTo(220, 90); c.lineTo(220, 300); c.stroke();
      // sink
      WF.rr(c, MIR.x + 40, 470, MIR.w - 80, 40, 12, '#ffffff');
      c.fillStyle = '#cfd6dc'; c.fillRect(MIR.x + MIR.w / 2 - 14, 505, 28, FL - 525);
      // towel
      WF.rr(c, 960, 260, 70, 160, 10, '#5fb3c9');
    });
    // mirror frame
    WF.rr(ctx, MIR.x - 16, MIR.y - 16, MIR.w + 32, MIR.h + 32, 22, '#c99a4b');
  }
  function mirror(ctx, t, o) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(MIR.x, MIR.y, MIR.w, MIR.h, 10); ctx.clip();
    ctx.fillStyle = vgrad(ctx, '#cfe3ea', '#b5d0db', MIR.y, MIR.y + MIR.h); ctx.fillRect(MIR.x, MIR.y, MIR.w, MIR.h);
    P(ctx, { ...o, x: MIR.x + MIR.w / 2 + 10, y: MIR.y + MIR.h + 150, s: 0.95, facing: -1 });
    ctx.globalAlpha = 0.18;
    for (let k = 0; k < 3; k++) WF.poly(ctx, [[MIR.x + 40 + k * 90, MIR.y], [MIR.x + 80 + k * 90, MIR.y], [MIR.x + k * 90 - 40, MIR.y + MIR.h], [MIR.x + k * 90 - 80, MIR.y + MIR.h]], '#ffffff');
    ctx.restore();
  }

  function wake(ctx, lt, t, sc) {
    bathroomBg(ctx);
    const walkEnd = 1.3;
    const k = ease.inOutQuad(prog(lt, 0, walkEnd));
    const x = lerp(160, 420, k);
    const reveal = ev.mirrorReveal;
    const hot = clamp((t - reveal + 0.15) / 0.5);
    let expr = 'tired';
    if (t > reveal - 0.1) expr = 'shock';
    if (t > ev.timerStart - 0.2) expr = 'smug';
    const o = { hot, t, expr, hair: t > reveal ? 'quiff' : 'messy', look: 0 };
    mirror(ctx, t, o);
    P(ctx, { ...o, x, y: FL, s: 1.05, walk: lt < walkEnd ? lt * 9 : null, look: lt < walkEnd ? 0.3 : 1, armR: t > ev.timerStart ? 'face' : 'down' });
    // sparkle burst on "attractive"
    const a = t - reveal;
    if (a > 0 && a < 1.2) for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2, r = 60 + a * 260;
      WF.star4(ctx, MIR.x + MIR.w / 2 + Math.cos(ang) * r, MIR.y + 170 + Math.sin(ang) * r * 0.8, 22 * (1 - a / 1.2), '#ffe28a', a * 4 + i);
    }
    // camera: push into the mirror for the reveal, then back out
    const zin = clamp((t - reveal + 0.25) / 0.35) * (1 - clamp((t - ev.timerStart + 0.3) / 0.5));
    return { cam: { z: 1.03 + 0.45 * ease.inOutQuad(zin), cx: lerp(PW / 2, MIR.x + MIR.w / 2, zin), cy: lerp(PH / 2, MIR.y + 200, zin) } };
  }

  function afterScene(ctx, lt, t, sc) {
    bathroomBg(ctx);
    const o = { hot: 0, t, expr: t > SC.after.lines[0].words[3].t ? 'happy' : 'shock', hair: 'messy' };
    if (t > ev.pizza) o.expr = 'laugh';
    mirror(ctx, t, o);
    P(ctx, { ...o, x: 420, y: FL, s: 1.05, look: t < ev.text ? 1 : 0.4, lookY: t > ev.text ? 0.6 : 0, armR: t > ev.text - 0.2 ? 'phone' : 'face', prop: t > ev.text - 0.2 ? 'phone' : null });
    WF.card(ctx, 540, 120, t, ev.text, { sender: 'Best friend', text: 'pizza? like normal? 🍕', emoji: '🍕', w: 620 });
    const fl = (1 - (SC.count.t1 - ev.poof) / 0.8) * (1 - lt / 0.5); // the POOF's flash carries over the cut
    return fl > 0 ? { flash: fl } : {};
  }

  // ================= bus =================
  function bus(ctx, lt, t, sc) {
    // city scrolling past the windows
    ctx.fillStyle = vgrad(ctx, '#bcd6e8', '#e4ebe8'); ctx.fillRect(0, 0, PW, PH);
    const off = (t * 300) % 1200;
    for (let rep = -1; rep < 3; rep++) {
      let x = rep * 1200 - off, i = 0;
      while (x < rep * 1200 - off + 1200) {
        const bw = 70 + U.hash(i, 3) * 90, bh = 110 + U.hash(i, 5) * 200;
        ctx.fillStyle = `rgb(${150 + U.hash(i, 8) * 40 | 0},${158 + U.hash(i, 8) * 40 | 0},${178 + U.hash(i, 8) * 30 | 0})`;
        ctx.fillRect(x, 330 - bh, bw, bh); x += bw + 8; i++;
      }
    }
    bg(ctx, 'bus', (c) => {
      c.fillStyle = '#e8e3d6';
      c.fillRect(0, 0, PW, 70); c.fillRect(0, 330, PW, PH - 330);
      for (const px of [0, 340, 690, 1040]) c.fillRect(px - 14, 0, 40, 340);
      c.fillStyle = '#c9c2b0'; c.fillRect(0, 60, PW, 12);
      c.fillStyle = '#9aa0a8'; c.fillRect(0, 40, PW, 8); // hand rail
      floor(c, '#7d8590', FL - 10);
    });
    const look = clamp((lt - 0.3) / 0.3);
    const turned = look > 0.5;
    const bob = Math.sin(t * 9) * 3;
    // seats
    for (const sx of [200, 540, 880]) { WF.rr(ctx, sx - 95, 410 + bob, 190, 150, 26, '#4a77b0'); WF.rr(ctx, sx - 105, 545 + bob, 210, 40, 16, '#3c6399'); }
    P(ctx, { x: 200, y: FL + bob, s: 0.92, pose: 'sit', shirt: PINK, hair: 'long', hairCol: '#e3b85a', hood: false, t, seed: 2, expr: turned ? 'love' : 'neutral', look: turned ? 1 : 0, lookY: turned ? 0 : 0.7, armR: 'phone', prop: 'phone' });
    P(ctx, { x: 540, y: FL + bob, s: 1, pose: 'sit', hot: 1, t, seed: 1, expr: t > ev.snap + 0.2 ? 'nervous' : 'neutral', look: t > ev.snap ? 0.9 : 0 });
    P(ctx, { x: 880, y: FL + bob, s: 0.92, pose: 'sit', shirt: GREEN, hair: 'cap', capCol: '#2b2b33', t, seed: 5, facing: -1, expr: turned ? 'shock' : 'neutral', look: turned ? 1 : 0, lookY: turned ? 0 : 0.7, armL: 'phone', propL: 'phone', hood: false });
    // the stranger with the phone
    const photo = t > ev.snap - 0.9 && t < ev.snap + 1.3;
    P(ctx, { x: 730, y: FL, s: 1, shirt: ORANGE, hair: 'short', hairCol: '#2a1d14', t, seed: 7, facing: -1, expr: turned ? (photo ? 'focus' : 'love') : 'neutral', look: 1, armR: photo ? 'photo' : 'hold', prop: 'phone' });
    const a = t - ev.snap;
    return a >= 0 && a < 0.3 ? { flash: 0.85 * (1 - a / 0.3) } : {};
  }

  // ================= the phone (views, address) =================
  function neonBg(ctx, red = false) {
    ctx.fillStyle = red ? '#2a0b10' : '#0b2a33'; ctx.fillRect(0, 0, PW, PH);
    ctx.strokeStyle = red ? 'rgba(255,80,90,0.12)' : 'rgba(95,235,220,0.10)'; ctx.lineWidth = 2;
    for (let x = 0; x < PW; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PH); ctx.stroke(); }
    for (let y = 0; y < PH; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PW, y); ctx.stroke(); }
  }
  function phoneBody(ctx, cx, cy, w, h, col, glow) {
    ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 40;
    WF.rr(ctx, cx - w / 2, cy - h / 2, w, h, 44, '#0d1418', col, 8);
    ctx.restore();
    WF.rr(ctx, cx - 50, cy - h / 2 + 18, 100, 16, 8, col);
  }
  const VIEWS = [12, 480, 9300, 61000, 240000, 720000, 1300000, 2000000];
  function views(ctx, lt, t, sc) {
    neonBg(ctx);
    const cx = 540, cy = 350;
    const jit = t < ev.viewsDone ? Math.sin(t * 90) * 4 : 0;
    phoneBody(ctx, cx + jit, cy, 330, 560, '#5febdc', '#5febdc');
    // the photo on screen
    WF.rr(ctx, cx - 135 + jit, cy - 200, 270, 230, 20, '#cfe3ea');
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 135 + jit, cy - 200, 270, 230); ctx.clip();
    P(ctx, { x: cx + jit, y: cy + 230, s: 0.85, hot: 1, t, expr: 'nervous', look: 0.6, seed: 1 });
    ctx.restore();
    let n = 0;
    for (const [i, vt] of ev.views.entries()) if (t >= vt) n = VIEWS[i];
    WF.txt(ctx, n.toLocaleString('en-US'), cx + jit, cy + 90, 62, '#ffffff', { maxW: 290 });
    WF.txt(ctx, 'views', cx + jit, cy + 140, 30, '#5febdc', { weight: 700 });
    const last = ev.views.filter((v) => v <= t).pop();
    if (last !== undefined) { const k = 1 - clamp((t - last) / 0.15); if (k > 0) WF.txt(ctx, n.toLocaleString('en-US'), cx + jit, cy + 90, 62 * (1 + 0.25 * k), `rgba(255,240,150,${k})`, { maxW: 360 }); }
    // reactions floating up from the phone
    for (let i = 0; i < 16; i++) {
      const t0 = SC.views.t0 + 0.1 + i * 0.13, a = t - t0;
      if (a < 0 || a > 1.6) continue;
      const side = i % 2 ? 1 : -1;
      WF.emoji(ctx, ['😍', '🔥', '❤️', '😳'][i % 4], cx + side * (230 + U.hash(i) * 150), cy + 200 - a * 260, 54, { alpha: 1 - a / 1.6, scale: WF.pop(t, t0, 0.2) });
    }
    const k = WF.pop(t, ev.viewsDone, 0.3);
    if (k > 0) {
      ctx.save(); ctx.translate(cx, 70); ctx.scale(k, k); ctx.rotate(-0.04);
      WF.rr(ctx, -170, -34, 340, 68, 34, '#ff3b5c'); WF.txt(ctx, '🔥 TRENDING #1', 0, 2, 36, '#ffffff');
      ctx.restore();
    }
    return {};
  }

  function address(ctx, lt, t, sc) {
    neonBg(ctx, true);
    const cx = 540, cy = 350;
    const shake = t > ev.pin ? Math.exp(-(t - ev.pin) * 6) : 0;
    phoneBody(ctx, cx, cy, 330, 560, '#ff5a64', '#ff3a48');
    // a little map on screen
    ctx.save(); ctx.beginPath(); ctx.roundRect(cx - 135, cy - 200, 270, 330, 18); ctx.clip();
    ctx.fillStyle = '#e8eef0'; ctx.fillRect(cx - 135, cy - 200, 270, 330);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 16;
    for (const yy of [-120, 10]) { ctx.beginPath(); ctx.moveTo(cx - 140, cy + yy); ctx.lineTo(cx + 140, cy + yy + 30); ctx.stroke(); }
    for (const xx of [-60, 70]) { ctx.beginPath(); ctx.moveTo(cx + xx, cy - 200); ctx.lineTo(cx + xx - 20, cy + 130); ctx.stroke(); }
    ctx.fillStyle = '#b8dcb0'; ctx.fillRect(cx - 40, cy - 100, 90, 90);
    ctx.restore();
    // the pin slams down
    const pk = t < ev.pin ? 0 : 1;
    const drop = ease.outBounce(clamp((t - ev.pin + 0.25) / 0.45));
    if (t > ev.pin - 0.25) WF.emoji(ctx, '📍', cx + 5, lerp(cy - 420, cy - 70, drop), 120);
    const line = SC.address.lines[0];
    WF.card(ctx, 255, 120, t, line.words[1].t, { sender: 'Posted publicly', text: 'found where he lives 👀', emoji: '⚠️', w: 440, theme: 'dark' });
    WF.card(ctx, 860, 330, t, ev.pin + 0.3, { sender: 'Shared by', text: '18,402 people', emoji: '🔁', w: 330, theme: 'dark' });
    const pulse = 0.12 + 0.1 * Math.sin(t * 10);
    // a scratch-stop glitch on the first frames
    const g = t - ev.scratch;
    return { tint: `rgba(255,30,40,${pulse})`, shake: shake * 1.2 + (g >= 0 && g < 0.15 ? 1 : 0), glitch: g >= 0 && g < 0.2 ? 1 - g / 0.2 : 0 };
  }

  // ================= office =================
  function office(ctx, lt, t, sc) {
    bg(ctx, 'office', (c) => {
      c.fillStyle = vgrad(c, '#dfeee6', '#cfe3d8'); c.fillRect(0, 0, PW, PH);
      floor(c, '#9c8b78');
      c.fillStyle = '#ffffff'; c.fillRect(640, 80, 300, 220); c.fillStyle = '#bcdcf0'; c.fillRect(652, 92, 276, 196);
      c.fillStyle = '#9ab7c9'; for (let i = 0; i < 6; i++) c.fillRect(660 + i * 45, 288 - 40 - (i * 37 % 90), 36, 40 + (i * 37 % 90));
      c.strokeStyle = '#333'; c.lineWidth = 6; c.beginPath(); c.arc(160, 140, 46, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(160, 140); c.lineTo(160, 108); c.moveTo(160, 140); c.lineTo(182, 150); c.stroke();
      WF.rr(c, 330, 120, 150, 110, 8, '#f6f2e6'); c.fillStyle = '#e45d5d'; c.fillRect(350, 140, 110, 12); c.fillStyle = '#c9c2b0'; c.fillRect(350, 165, 90, 8); c.fillRect(350, 182, 100, 8);
    });
    const laughing = t > ev.haha[0] - 0.2;
    P(ctx, { x: 830, y: FL, s: 1.02, shirt: GREY, hair: 'bald', hood: false, tie: RED, t, seed: 4, facing: -1, expr: laughing ? 'laugh' : 'happy', look: 1, armL: laughing ? 'belly' : 'down', armR: laughing ? 'belly' : 'down' });
    WF.bubble(ctx, 'HAHA! You\'re hilarious!', 780, 120, t, ev.haha[0], ev.coffee + 0.3, { tail: 'right', size: 32 });
    // coworker walks in with a free coffee
    const ck = ease.inOutQuad(prog(t, ev.coffee - 0.9, ev.coffee));
    if (t > ev.coffee - 0.9) P(ctx, { x: lerp(-120, 260, ck), y: FL, s: 0.98, shirt: GREEN, hair: 'bun', hairCol: '#3b2516', hood: false, t, seed: 6, walk: ck < 1 ? t * 9 : null, expr: ck < 1 ? 'happy' : 'love', look: 1, armR: 'coffee', prop: 'cup' });
    P(ctx, { x: 520, y: FL, s: 1.05, hot: 1, t, seed: 1, expr: t > ev.noLines ? 'smug' : 'happy', look: t > ev.coffee - 0.3 ? -0.8 : 0.8 });
    // stamps
    for (const [i, [et, label, e]] of [[ev.coffee, 'FREE COFFEE', '☕'], [ev.noLines, 'SKIP THE LINE', '✅']].entries()) {
      const k = WF.pop(t, et, 0.25);
      if (k <= 0) continue;
      ctx.save(); ctx.translate(250 + i * 10, 260 + i * 86); ctx.rotate(-0.06 + i * 0.05); ctx.scale(k, k);
      WF.rr(ctx, -170, -36, 340, 72, 18, '#ffffff', RED, 6);
      WF.txt(ctx, `${e} ${label}`, 0, 2, 34, RED, { maxW: 310 });
      ctx.restore();
    }
    return {};
  }

  // ================= the halo effect =================
  function halo(ctx, lt, t, sc) {
    neonBg(ctx);
    const hx = 290;
    const tk = WF.pop(t, SC.halo.t0 + 0.05, 0.3);
    if (tk > 0) { ctx.save(); ctx.translate(PW / 2 + 120, 112); ctx.scale(tk, tk); WF.txt(ctx, 'THE HALO EFFECT', 0, 0, 52, '#ffffff', { stroke: '#0b2a33', strokeW: 6 }); ctx.restore(); }
    P(ctx, { x: hx, y: FL - 10, s: 1.05, hot: 1, t, seed: 1, expr: t > ev.halo ? 'smug' : 'happy', look: 0.5 });
    // the halo drops onto his head
    const d = ease.outBounce(clamp((t - ev.halo + 0.35) / 0.5));
    if (t > ev.halo - 0.35) {
      const y = lerp(-60, FL - 10 - 302 * 1.05 - 80, d);
      ctx.save(); ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.ellipse(hx, y, 74, 18, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 12; ctx.stroke();
      ctx.restore();
    }
    const labels = ['SMARTER', 'KINDER', 'MORE TRUSTED'];
    labels.forEach((lab, i) => {
      const t0 = ev.bars[i];
      if (t < t0 - 0.05) return;
      const v = ease.outCubic(clamp((t - t0) / 0.45));
      const y = 215 + i * 118, x0 = 540;
      WF.txt(ctx, lab, x0, y, 40, '#e6fffb', { align: 'left' });
      WF.rr(ctx, x0, y + 28, 400, 36, 18, null, 'rgba(95,235,220,0.35)', 4);
      WF.rr(ctx, x0, y + 28, Math.max(36, 400 * 0.86 * v), 36, 18, '#5febdc');
      WF.txt(ctx, '▲', x0 + 430, y + 46, 34, '#6dff8c');
    });
    const fk = WF.fade(t, ev.bars[2] + 0.4, 0.3);
    if (fk > 0) WF.txt(ctx, '(even when it\'s not true)', 740, 590, 28, `rgba(230,255,250,${0.8 * fk})`, { weight: 700 });
    return {};
  }

  // ================= 400 messages =================
  function msgs(ctx, lt, t, sc) {
    bg(ctx, 'bedroom', (c) => {
      c.fillStyle = vgrad(c, '#1b1d33', '#12142a'); c.fillRect(0, 0, PW, PH);
      floor(c, '#231f2a');
      c.fillStyle = '#2b3158'; c.fillRect(700, 90, 260, 250); c.strokeStyle = '#4a4f78'; c.lineWidth = 10; c.strokeRect(700, 90, 260, 250);
      WF.rr(c, 160, 470, 620, 90, 20, '#3a3f68'); WF.rr(c, 160, 440, 200, 60, 24, '#d8d8e8'); // bed + pillow
      c.fillStyle = '#2a2e50'; c.fillRect(170, 555, 30, FL - 575); c.fillRect(740, 555, 30, FL - 575);
    });
    // rain on the window
    ctx.save(); ctx.beginPath(); ctx.rect(705, 95, 250, 240); ctx.clip();
    for (let i = 0; i < 40; i++) { const x = 705 + U.hash(i, 1) * 250, y = 95 + ((U.hash(i, 2) * 240 + t * 520) % 260); WF.stroke(ctx, [[x, y], [x - 6, y + 26]], 'rgba(150,170,230,0.55)', 3); }
    ctx.restore();
    const sad = t > SC.msgs.lines[0].words[1].end;
    // phone glow on his face
    const g = ctx.createRadialGradient(470, 330, 10, 470, 330, 220); g.addColorStop(0, 'rgba(140,220,255,0.30)'); g.addColorStop(1, 'rgba(140,220,255,0)');
    ctx.fillStyle = g; ctx.fillRect(250, 110, 440, 440);
    P(ctx, { x: 470, y: 560, s: 1, pose: 'sit', hot: 0.5, t, seed: 1, expr: sad ? 'sad' : 'tired', lookY: 0.8, armR: 'phone', armL: 'phone', prop: 'phoneLit' });
    // the unread badge counts up
    const n = Math.round(400 * ease.outCubic(clamp((t - ev.badge) / 1.0)));
    const bk = WF.pop(t, ev.badge, 0.3);
    if (bk > 0) { ctx.save(); ctx.translate(690, 150); ctx.scale(bk, bk); WF.rr(ctx, -100, -42, 200, 84, 42, '#e63b52'); WF.txt(ctx, `💬 ${n}`, 0, 2, 44, '#ffffff'); ctx.restore(); }
    // the messages: none of them ask how he is
    const texts = [['u single?? 😍', 210, 150], ['collab? 💸', 330, 240], ['send a selfie', 160, 330], ['are you even real', 300, 420]];
    texts.forEach(([s, x, y], i) => {
      const t0 = SC.msgs.t0 + 0.25 + i * 0.28;
      const fade = sad ? 1 - clamp((t - SC.msgs.lines[0].words[1].end - i * 0.1) / 0.5) * 0.65 : 1;
      if (t < t0) return;
      ctx.save(); ctx.globalAlpha = fade; WF.bubble(ctx, s, x, y, t, t0, 1e9, { size: 26, tail: 'left' }); ctx.restore();
    });
    return { tint: 'rgba(0,0,30,0.12)' };
  }

  // ================= the final countdown =================
  function count(ctx, lt, t, sc) {
    const nums = ev.countNums;
    const k = nums.filter((x) => x <= t).length; // how many numbers shown
    const n = k ? 6 - k : null;
    const beatPh = k ? (t - nums[k - 1]) / S.BEAT : 0;
    const pulse = k ? Math.exp(-beatPh * 3) : 0.2;
    ctx.fillStyle = '#1a0a10'; ctx.fillRect(0, 0, PW, PH);
    const g = ctx.createRadialGradient(760, 330, 20, 760, 330, 420);
    g.addColorStop(0, `rgba(255,50,70,${0.35 + 0.35 * pulse})`); g.addColorStop(1, 'rgba(255,50,70,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
    floor(ctx, '#2a1218');
    const poofed = t >= ev.poof;
    const hot = poofed ? 0 : (k ? (6 - k) / 5 : 1) * (0.6 + 0.4 * Math.abs(Math.sin(t * 23)));
    P(ctx, { x: 300, y: FL, s: 1.08, hot, t, seed: 1, hair: poofed ? 'messy' : 'quiff', expr: poofed ? 'shock' : k > 2 ? 'nervous' : 'focus', look: poofed ? 0 : 1, shake: poofed ? 0 : 1 + k * 0.6, armL: poofed ? 'shrug' : 'down', armR: poofed ? 'shrug' : 'down' });
    if (n && !poofed) {
      const sk = 1 + 0.5 * (1 - ease.outBack(clamp(beatPh / 0.45)));
      ctx.save(); ctx.translate(760, 340); ctx.scale(sk, sk);
      WF.txt(ctx, String(n), 0, 0, 330, '#ff4655', { stroke: '#ffffff', strokeW: 10 });
      ctx.restore();
    }
    if (poofed) { // the puff of smoke
      const a = t - ev.poof;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2, r = 40 + a * 520 * (0.7 + 0.3 * U.hash(i));
        WF.circ(ctx, 300 + Math.cos(ang) * r, 380 + Math.sin(ang) * r * 0.6, 70 * Math.max(0, 1 - a * 1.6), 'rgba(240,240,245,0.9)');
      }
    }
    const a = t - ev.poof;
    if (a < 0 && a >= -S.HALF) return { tint: 'rgba(0,0,0,0.88)' }; // the held breath: lights out, silence
    return { shake: poofed ? Math.exp(-a * 8) * 2 : 0.25 * k * Math.exp(-beatPh * 6), flash: a >= 0 ? Math.max(0, 1 - a / 0.8) : 0 };
  }

  // ================= the ending: pizza, then the question =================
  function flex(ctx, lt, t, sc) {
    const split = t >= SC.flex.lines[0].words[10].t - 0.15; // "Would ..."
    if (!split) {
      bg(ctx, 'pizza', (c) => {
        c.fillStyle = vgrad(c, '#f5d9a8', '#eec58c'); c.fillRect(0, 0, PW, PH); floor(c, '#9b6b47');
        for (let i = 0; i < 4; i++) { WF.circ(c, 160 + i * 260, 70, 22, '#ffefb0'); c.fillStyle = '#7a5130'; c.fillRect(158 + i * 260, 0, 4, 50); }
      });
      // table
      ctx.fillStyle = '#ffffff'; ctx.fillRect(360, 470, 360, 36);
      for (let i = 0; i < 12; i++) if (i % 2 === 0) { ctx.fillStyle = '#d64545'; ctx.fillRect(360 + i * 30, 470, 30, 36); }
      ctx.fillStyle = '#6a4630'; ctx.fillRect(525, 506, 30, FL - 526);
      const laughA = (t % 2.0) < 1.0;
      P(ctx, { x: 270, y: FL, s: 1, pose: 'sit', hair: 'messy', t, seed: 1, expr: laughA ? 'laugh' : 'happy', look: 1, armR: 'hold', prop: 'pizza' });
      P(ctx, { x: 810, y: FL, s: 0.98, pose: 'sit', shirt: ORANGE, hair: 'cap', capCol: '#2b2b33', hood: false, t, seed: 8, facing: -1, expr: laughA ? 'happy' : 'laugh', look: 1, armL: 'belly', armR: 'belly' });
      WF.emoji(ctx, '🍕', 540, 440, 90);
      const fk = WF.pop(t, ev.flex - 0.1, 0.3);
      if (fk > 0) { ctx.save(); ctx.translate(540, 110); ctx.scale(fk, fk); ctx.rotate(-0.03); WF.rr(ctx, -250, -46, 500, 92, 24, '#ffffff'); WF.txt(ctx, 'the REAL flex ✨', 0, 2, 50, WF.INK); ctx.restore(); }
      return {};
    }
    // split screen: 24h of fame vs real life
    ctx.fillStyle = '#141a3a'; ctx.fillRect(0, 0, PW / 2, PH);
    ctx.fillStyle = '#efc07a'; ctx.fillRect(PW / 2, 0, PW / 2, PH);
    WF.circ(ctx, PW * 0.75, 300, 230, '#ffd99a');
    for (let i = 0; i < 5; i++) { const a = t - SC.flex.t0 - i * 0.37; WF.star4(ctx, 60 + U.hash(i, 4) * 420, 160 + U.hash(i, 6) * 260, 16 * Math.abs(Math.sin(a * 3)), '#ffe28a'); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(PW / 2 - 4, 0, 8, PH);
    P(ctx, { x: 270, y: FL, s: 1, hot: 1, t, seed: 1, expr: 'smug' });
    P(ctx, { x: 700, y: FL, s: 1, hair: 'messy', t, seed: 3, expr: 'happy', armL: 'wave' });
    P(ctx, { x: 930, y: FL, s: 0.96, shirt: ORANGE, hair: 'cap', capCol: '#2b2b33', hood: false, t, seed: 8, facing: -1, expr: 'laugh', look: 1 });
    for (const [x, lab, col] of [[270, '24H OF FAME 😎', '#141a3a'], [810, 'REAL LIFE 🍕', '#8a5a2c']]) {
      WF.rr(ctx, x - 205, 52, 410, 80, 22, '#ffffff'); WF.txt(ctx, lab, x, 94, 38, col, { maxW: 380 });
    }
    for (const [x, et, lab, col] of [[270, ev.ctaYes, 'YES', '#2bb673'], [810, ev.ctaNo, 'NO', '#e5484d']]) {
      const k = WF.pop(t, et, 0.3);
      if (k <= 0) continue;
      ctx.save(); ctx.translate(x, 205); ctx.scale(k, k); ctx.rotate(x < 540 ? -0.05 : 0.05);
      WF.rr(ctx, -95, -40, 190, 80, 40, col); WF.txt(ctx, lab, 0, 3, 50, '#ffffff');
      ctx.restore();
    }
    const ck = WF.pop(t, SC.flex.lines[0].end + 0.25, 0.3);
    if (ck > 0) { ctx.save(); ctx.translate(PW / 2, 585); ctx.scale(ck, ck); WF.rr(ctx, -210, -42, 420, 84, 42, '#ffffff'); WF.txt(ctx, 'COMMENT 👇', 0, 3, 48, WF.INK); ctx.restore(); }
    return {};
  }

  // ================= rewind: the hook plays backwards, VHS style =================
  function rewind(ctx, lt, t, sc) {
    const back = SC.hook.t1 - lt * 3; // the hook, running backwards fast
    const fx = roomNight(ctx, 0, back, { hot: 1, face: true });
    ctx.fillStyle = 'rgba(20,30,90,0.35)'; ctx.fillRect(0, 0, PW, PH);
    for (let y = 0; y < PH; y += 6) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y, PW, 2); }
    const band = (lt * 900) % (PH + 120) - 60;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, band, PW, 40);
    WF.txt(ctx, '◀◀ REWIND', 110, 60, 40, '#ffffff', { align: 'left', stroke: '#000', strokeW: 6 });
    const k = WF.pop(t, ev.stamp, 0.22);
    if (k > 0) {
      ctx.save(); ctx.translate(PW / 2, PH / 2 - 20); ctx.rotate(-0.05); ctx.scale(1 + (1 - k) * 1.5, 1 + (1 - k) * 1.5); ctx.globalAlpha = clamp(k * 2);
      WF.rr(ctx, -330, -70, 660, 140, 20, '#ffffff'); WF.txt(ctx, '12 HOURS EARLIER', 0, 4, 64, WF.INK, { maxW: 610 });
      ctx.restore();
    }
    return { glitch: lt < 0.2 ? 1 - lt / 0.2 : 0 };
  }

  function hook(ctx, lt, t, sc) {
    const faceT = SC.hook.lines[0].words.find((w) => /^face/.test(w.w)).t - 0.25;
    const fx = roomNight(ctx, lt, t, { hot: 1, face: t > faceT });
    // punch in on his face on "face"
    // open punched-in on the window + him, ease back to reveal the crowd, then punch in on his face
    const open = ease.outCubic(clamp(lt / 1.4));
    let z = lerp(1.3, 1.05, open), cx = lerp(640, PW / 2, open), cy = lerp(330, PH / 2, open);
    if (t > faceT) { const k = ease.outCubic(clamp((t - faceT) / 0.25)); z = lerp(z, 1.45, k); cx = lerp(cx, 860, k); cy = lerp(cy, 300, k); }
    return { ...fx, cam: { z, cx, cy } };
  }
  function hiding(ctx, lt, t, sc) {
    const duck = ease.inOutQuad(clamp((t - ev.hideDuck + 0.1) / 0.35));
    const fl = [0.2, 0.7, 1.1, 1.6, 2.1, 2.5].map((x) => SC.hiding.t0 + x);
    const fx = roomNight(ctx, lt, t, { hot: 1, duck, flashes: fl, crowdLoud: 1.5 });
    return { ...fx, cam: { z: 1.04 + 0.25 * duck, cx: lerp(PW / 2, 620, duck), cy: lerp(PH / 2, 420, duck) } };
  }

  globalThis.SCENES = { hook, rewind, wake, bus, views, office, halo, address, hiding, msgs, count, after: afterScene, flex };
})();
