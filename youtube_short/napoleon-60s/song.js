// THE SOUND — orchestral score + sound effects + narration, all from score.js. Run: node tools/vo_build.js && node song.js
//   Music plan (all cues are the same events the picture uses):
//   0-4 title: timpani + brass stab, snare roll into 4s     4-25 rise: low-string ostinato, timpani, snare march, brass at 19s
//   25-32 peak: brass fanfare in D major, galloping timpani 32-38.7 Russia: cold drone, heartbeat, wind, nothing warm
//   38.7-41 silence for Elba (only waves)                   41-49 return: strings swell, snare roll under his walk, brass at the hats
//   49-54.3 Waterloo: cannon, rain, dirge                   54.3-60 twist: pizzicato + bell, fades out
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { ev, DURATION, m, SC } = sc;
const { makeClock } = require('./engine/music');

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const tim = bus(), snr = bus(), str = bus(), brs = bus(), low = bus(), pz = bus(), music_fx = bus();
const sfx = bus(), waves = bus(), verb = bus();
const hash = (...a) => { let h = 2166136261; for (const x of a) { h ^= Math.round(x * 1000); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };

const SN = I.snare({ decay: 0.16, snap: 0.8, seed: 5 }), SNs = I.snare({ decay: 0.1, snap: 0.5, seed: 6 });
const addPair = (b, p, t, g) => b.addStereo(p.L, p.R, t, g);
const pad = (b, midis, t, dur, g, o = {}) => { for (const mi of midis) addPair(b, I.strings(mi, dur, o), t, g); };
const lin = (t, t0, t1, a, b) => a + (b - a) * Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));

// ------------------------------------------------------------------ stamp / hit helpers
const stamp = (t, g = 1) => {
  sfx.addMono(I.thud(75, 0.13), t, 0.85 * g);
  sfx.addMono(I.woodTick(0.7), t, 0.5 * g);
  sfx.addMono(I.noiseSweep(0.22, 3200, 300, { q: 0.8, shape: (x) => Math.exp(-x * 5) }), t, 0.35 * g);
};
const timp = (t, note, g = 1, decay = 1.1) => tim.addMono(I.timpani(m(note), { decay }), t, g);

// ------------------------------------------------------------------ 0-4 TITLE
timp(ev.title, 'D2', 1.0, 1.6); timp(ev.title, 'D3', 0.55, 1.2);
stamp(ev.title, 1.2);
{ const crash = I.crash(21); music_fx.addMono(crash, ev.title, 0.55); verb.addMono(crash, ev.title, 0.3); }
for (const mi of [m('D3'), m('F3'), m('A3'), m('D4')]) addPair(brs, I.brassNote(mi, 0.9, { bright: 1, seed: 40 }), ev.title, 0.55);
pad(str, [m('D3'), m('A3'), m('F4')], 0.2, 3.8, 0.35, { attack: 0.8, release: 0.6 });
timp(2.4, 'D2', 0.5); timp(3.0, 'A1', 0.55); timp(3.4, 'D2', 0.6);
for (let i = 0; i < 10; i++) snr.addMono(SNs, 3.0 + i * 0.1, 0.12 + 0.05 * i);
music_fx.addMono(I.noiseSweep(1.0, 400, 5000, { q: 0.9, shape: (x) => x * x, pink: true }), 3.0, 0.4);

// ------------------------------------------------------------------ 4-25 THE RISE (D minor)
{
  const c = makeClock({ bpm: 104, offset: SC.about });
  const prog = [['D', 'Dm'], ['D', 'Dm'], ['Bb', 'B'], ['F', 'F'], ['D', 'Dm'], ['D', 'Dm'], ['Bb', 'B'], ['A', 'A'], ['D', 'Dm'], ['D', 'Dm']];
  const triad = { Dm: ['D3', 'F3', 'A3', 'D4'], B: ['Bb2', 'D3', 'F3', 'Bb3'], F: ['F2', 'A2', 'C3', 'F3'], A: ['A2', 'E3', 'A3', 'C#4'] };
  const rootN = { D: 'D2', Bb: 'Bb1', F: 'F2', A: 'A1' };
  prog.forEach(([r, ch], bar) => {
    const t0 = c.T(bar), t1 = c.T(bar + 1);
    if (t0 >= SC.peak) return;
    const g = lin(t0, 4, 24, 0.22, 0.75);
    pad(str, triad[ch].map(m), t0, Math.min(t1, SC.peak) - t0, g * 0.55, { attack: 0.35, release: 0.5 });
    // low-string ostinato (8ths): X . X X X . X X
    c.eachStep(bar, bar + 1, 8, (t, b, s) => {
      if (t >= SC.peak - 0.01) return;
      if (![0, 2, 3, 4, 6, 7].includes(s)) return;
      const gg = lin(t, 5, 22, 0.25, 0.85);
      low.addMono(I.pizz(m(rootN[r]) + (s === 4 ? 7 : 12)), t, gg * 0.9);
    });
    // timpani on 1 and 3
    for (const bt of [0, 2]) { const t = c.T(bar, bt); if (t < SC.peak - 0.01) timp(t, rootN[r], lin(t, 4, 24, 0.35, 0.9), 0.9); }
    if (bar % 4 === 3) for (let k = 0; k < 8; k++) { const t = c.T(bar, 3) + k * c.BEAT / 8; if (t < SC.peak - 0.01) timp(t, rootN[r], 0.2 + k * 0.05, 0.4); }
    // snare march from 8s
    c.eachStep(bar, bar + 1, 8, (t, b, s) => {
      if (t < SC.origins || t >= SC.peak - 0.01) return;
      const gg = lin(t, 8, 24, 0.18, 0.5);
      if (s === 2 || s === 6) snr.addMono(SN, t, gg);
      else if (t > SC.toulon && s % 2 === 1) snr.addMono(SNs, t, gg * 0.4);
      else if (t > SC.toulon && s === 4) snr.addMono(SNs, t, gg * 0.6);
    });
  });
  // heroic motif in the brass from the coup (19s)
  const mot = [['D4', 0, 3], ['F4', 3, 1], ['A4', 4, 2], ['D5', 6, 2], ['C5', 8, 3], ['A4', 11, 1], ['F4', 12, 2], ['G4', 14, 2]];
  [19.1 + 0, 19.1 + 16 * 0.288].forEach((b0) => {
    for (const [n, s8, d8] of mot) { const t = b0 + s8 * 0.288; if (t < SC.peak - 0.2) { const mi = m(n); addPair(brs, I.brassNote(mi, d8 * 0.288 * 0.9, { bright: 0.9, seed: 41 }), t, 0.35); addPair(brs, I.brassNote(mi - 12, d8 * 0.288 * 0.9, { bright: 0.6, seed: 42 }), t, 0.22); } }
  });
  // coronation swell on the crown
  timp(ev.crownOn, 'D2', 0.9, 1.4);
  pad(str, [m('D4'), m('A4'), m('F5')], ev.crownOn, 1.2, 0.4, { attack: 0.05, release: 0.6 });
}

// ------------------------------------------------------------------ 25-32 THE PEAK (D major fanfare)
{
  const c = makeClock({ bpm: 120, offset: SC.peak });
  const chords = [['D3', 'F#3', 'A3', 'D4'], ['A2', 'E3', 'A3', 'C#4'], ['B2', 'D3', 'F#3', 'B3'], ['G2', 'D3', 'G3', 'B3'], ['A2', 'E3', 'A3', 'C#4']];
  const roots = ['D2', 'A1', 'B1', 'G1', 'A1'];
  const fan = [
    [['D5', 0, 3], ['D5', 3, 1], ['F#5', 4, 2], ['A5', 6, 2]],
    [['G5', 0, 3], ['F#5', 3, 1], ['E5', 4, 2], ['A4', 6, 2]],
    [['B4', 0, 2], ['D5', 2, 2], ['F#5', 4, 2], ['B5', 6, 2]],
    [['A5', 0, 4], ['G5', 4, 2], ['F#5', 6, 2]],
  ];
  for (let bar = 0; bar < 4; bar++) {
    const t0 = c.T(bar), t1 = Math.min(c.T(bar + 1), SC.russia);
    pad(str, chords[bar].map(m), t0, t1 - t0, 0.85, { attack: 0.05, release: 0.4, bright: 1.1 });
    for (const [n, s8, d8] of fan[bar]) {
      const t = t0 + s8 * c.BEAT / 2; if (t >= SC.russia) continue;
      const d = d8 * c.BEAT / 2 * 0.92;
      addPair(brs, I.brassNote(m(n), d, { bright: 1.1, seed: 43 }), t, 0.5);
      addPair(brs, I.brassNote(m(n) - 12, d, { bright: 0.7, seed: 44 }), t, 0.34);
      verb.addStereo(I.brassNote(m(n), d, { seed: 45 }).L, I.brassNote(m(n), d, { seed: 45 }).R, t, 0.1);
    }
    c.eachStep(bar, bar + 1, 8, (t, b, s) => { // galloping timpani + driving snare
      if (t >= SC.russia - 0.01) return;
      timp(t, roots[bar], s % 2 ? 0.45 : 0.8, 0.5);
      snr.addMono(s % 2 ? SNs : SN, t, s % 2 ? 0.4 : 0.55);
      low.addMono(I.bass(m(roots[bar]) + 12, 0.2), t, 0.55);
    });
  }
  music_fx.addMono(I.crash(22), SC.peak, 0.6); verb.addMono(I.crash(22), SC.peak, 0.35);
  music_fx.addMono(I.crash(23), ev.austerlitz + 0.3, 0.4);
  music_fx.addMono(I.noiseSweep(0.9, 500, 5500, { q: 0.9, shape: (x) => x * x, pink: true }), ev.flood - 0.8, 0.35);
}

// ------------------------------------------------------------------ 32-38.7 RUSSIA (cold, thin)
{
  const t0 = SC.russia;
  const { L, R } = I.padNote(m('D2'), 6.4, { cutoff: 500, attack: 1.2, release: 1.2 }); str.addStereo(L, R, t0, 0.5);
  const p2 = I.padNote(m('A2'), 6.4, { cutoff: 450, attack: 2.0, release: 1.2 }); str.addStereo(p2.L, p2.R, t0, 0.3);
  for (let t = t0 + 0.4; t < ev.elbaSilence - 0.3; t += 1.9) timp(t, 'D2', 0.45, 1.4); // a slow, cold heartbeat
  [['A5', 33.4], ['F5', 35.5], ['D5', 37.6]].forEach(([n, t]) => { const b = I.bell(m(n) ? 440 * Math.pow(2, (m(n) - 69) / 12) : 880, 1.2, 1.4); music_fx.addMono(b, t, 0.25); verb.addMono(b, t, 0.3); });
  // wind
  [32.0, 34.4, 36.6].forEach((t, i) => sfx.addMono(I.noiseSweep(3.4, i % 2 ? 500 : 1100, i % 2 ? 1400 : 380, { q: 0.7, pink: true, seed: 30 + i }), t, 0.32));
}
// ------------------------------------------------------------------ 38.7-41: silence (music gated later), waves only
for (const t of [38.4, 40.4]) waves.addMono(I.noiseSweep(2.4, 900, 160, { q: 0.6, pink: true, seed: 50 + t, shape: (x) => Math.sin(Math.PI * Math.pow(x, 0.8)) }), t, 0.5);
waves.addMono(I.noiseSweep(1.8, 300, 120, { q: 0.5, pink: true, seed: 55, shape: (x) => Math.sin(Math.PI * x) }), 39.4, 0.3);

// ------------------------------------------------------------------ 41-49 THE RETURN
{
  const c = makeClock({ bpm: 96, offset: SC.ret });
  const ch = [['D3', 'A3', 'D4', 'F4'], ['Bb2', 'F3', 'Bb3', 'D4'], ['C3', 'G3', 'C4', 'E4'], ['A2', 'E3', 'A3', 'C#4']];
  ch.forEach((n, bar) => {
    const t0 = c.T(bar);
    if (t0 >= ev.lower - 0.2) return;
    const t1 = Math.min(c.T(bar + 1), ev.lower);
    pad(str, n.map(m), t0, t1 - t0 + 0.2, lin(t0, 41, 46, 0.2, 0.9), { attack: 0.9, release: 0.5 });
  });
  low.addMono(I.bass(m('D2'), 2.6, { sub: 1 }), SC.ret, 0.6);
  for (let t = 41.6; t < ev.lower; t += 1.25) timp(t, 'D2', lin(t, 41, 47, 0.3, 0.8), 0.9);
  // snare roll building under the walk
  for (let t = ev.walk; t < ev.lower - 0.02; t += 0.1) snr.addMono(SNs, t, lin(t, ev.walk, ev.lower, 0.08, 0.7));
  // boots on gravel
  for (let t = ev.walk + 0.05; t < ev.lower - 0.1; t += 0.62) sfx.addMono(I.noiseSweep(0.1, 2600, 600, { q: 0.9, shape: (x) => Math.exp(-x * 4), seed: Math.round(t * 10) }), t, 0.22);
  // the muskets lower -> the swell breaks into a triumphant D major
  music_fx.addMono(I.crash(24), ev.lower + 0.1, 0.55); verb.addMono(I.crash(24), ev.lower + 0.1, 0.35);
  timp(ev.lower + 0.1, 'D2', 1.0, 1.4);
  pad(str, [m('D3'), m('A3'), m('F#4'), m('D5')], ev.lower + 0.1, 1.5, 1.0, { attack: 0.05, release: 0.7, bright: 1.2 });
  [['D5', 0, 1], ['F#5', 1, 1], ['A5', 2, 2]].forEach(([n, s, d]) => { const t = ev.lower + 0.15 + s * 0.3; addPair(brs, I.brassNote(m(n), d * 0.3, { bright: 1.1, seed: 46 }), t, 0.55); addPair(brs, I.brassNote(m(n) - 12, d * 0.3, { bright: 0.7, seed: 47 }), t, 0.35); });
  // cheering crowd + hats in the air
  for (let k = 0; k < 4; k++) sfx.addMono(I.noiseSweep(1.3, 1400 + 200 * k, 1900, { q: 0.5, seed: 70 + k, shape: (x) => Math.sin(Math.PI * Math.pow(x, 0.7)) }), ev.hats + k * 0.12, 0.2);
  // musket clacks (raise) and (lower)
  for (let k = 0; k < 6; k++) { sfx.addMono(I.woodTick(0.6 + 0.05 * (k % 3)), ev.alps + 0.5 + k * 0.07, 0.3); sfx.addMono(I.woodTick(0.5 + 0.04 * (k % 3)), ev.lower + k * 0.05, 0.25); }
  // the little boat
  sfx.addMono(I.noiseSweep(2.2, 800, 300, { q: 0.6, pink: true, seed: 80 }), 41.0, 0.18);
  for (const t of [41.5, 42.1]) sfx.addMono(I.noiseSweep(0.35, 1600, 400, { q: 0.8, seed: 81 }), t, 0.12);
}

// ------------------------------------------------------------------ 49-54.3 WATERLOO / SAINT HELENA
{
  const c = makeClock({ bpm: 72, offset: SC.end });
  const n = [['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3'], ['G2', 'Bb2', 'D3'], ['A2', 'E3', 'A3']];
  n.forEach((ch, bar) => { const t0 = c.T(bar); if (t0 < SC.twist) pad(str, ch.map(m), t0, c.BAR + 0.1, lin(t0, 49, 54, 0.65, 0.3), { attack: 0.5, release: 0.8, bright: 0.7 }); });
  low.addMono(I.bass(m('D2'), 4.2, { sub: 1, bright: 0.4 }), SC.end, 0.55);
  [49.2, 50.2, 51.5, 52.9].forEach((t, i) => { timp(t, i % 2 ? 'A1' : 'D2', 0.8 - i * 0.1, 1.2); });
  [49.45, 50.05, 50.7, 51.1].forEach((t, i) => { // cannon fire
    sfx.addMono(I.subBoom(1.1, 85, 32), t, 0.55); sfx.addMono(I.noiseSweep(0.6, 2200, 160, { q: 0.7, shape: (x) => Math.exp(-x * 4), seed: 90 + i }), t, 0.4);
  });
  // rain + crackle of muskets
  sfx.addMono(I.noiseSweep(5.0, 4200, 3800, { q: 0.35, pink: true, seed: 95, shape: (x) => Math.min(1, x * 6, (1 - x) * 6) }), SC.end, 0.16);
  for (let k = 0; k < 28; k++) { const t = 49.2 + hash(k, 1) * 2.6; sfx.addMono(I.rim(0.8 + hash(k, 2) * 0.6, k + 3), t, 0.12 + hash(k, 3) * 0.12); }
  // saint helena: the sea
  waves.addMono(I.noiseSweep(3.4, 800, 150, { q: 0.6, pink: true, seed: 97, shape: (x) => Math.sin(Math.PI * x) }), ev.helena + 0.2, 0.3);
}

// ------------------------------------------------------------------ 54.3-60 THE TWIST (light, a little wry)
{
  const c = makeClock({ bpm: 100, offset: SC.twist });
  const melody = [['C5', 0, 1], ['E5', 1, 1], ['G5', 2, 1], ['E5', 3, 1], ['C5', 4, 1], ['D5', 5, 1], ['G4', 6, 2]];
  for (let bar = 0; bar < 2; bar++) for (const [n, s, d] of melody) {
    const t = c.T(bar) + s * c.BEAT / 2; if (t < DURATION - 0.8) pz.addMono(I.pizz(m(n)), t, 0.55);
  }
  c.eachStep(0, 3, 4, (t, b, s) => { if (t < 59.0) low.addMono(I.pizz(m(s % 2 ? 'G2' : 'C3')), t, 0.5); });
  pad(str, [m('C3'), m('G3'), m('E4')], SC.twist, 5.5, 0.4, { attack: 0.7, release: 1.0 });
  sfx.addMono(I.tvClick ? I.tvClick() : I.woodTick(1.4), ev.measure, 0.2);
  const rb = [ev.chart + 0.3, ev.chart + 0.5, ev.chart + 0.7, ev.chart + 0.9];
  rb.forEach((t) => sfx.addMono(I.woodTick(1.3), t, 0.12));
  sfx.addMono(I.noiseSweep(0.5, 500, 2500, { q: 0.9, shape: (x) => Math.sin(Math.PI * x) }), ev.cartoon, 0.2); // the caricature pops in
  timp(ev.endCard + 0.05, 'C2', 0.5, 1.6);
  const bl = I.bell(523.25, 1.8, 1.2); music_fx.addMono(bl, ev.endCard + 0.05, 0.3); verb.addMono(bl, ev.endCard + 0.05, 0.4);
}

// ------------------------------------------------------------------ stamps (each date + the name + MYTH), SFX
stamp(ev.nameStamp, 1.0); stamp(ev.y1769, 1.0); stamp(ev.y1793, 1.0);
stamp(ev.y1799, 0.7); stamp(ev.y1804, 0.7); stamp(ev.y1812, 0.7); stamp(ev.y1815, 0.7);
stamp(ev.myth, 1.25);
timp(ev.myth, 'C2', 0.6, 0.8);
sfx.addMono(I.noiseSweep(0.35, 5500, 600, { q: 0.9, shape: (x) => Math.exp(-x * 3), seed: 33 }), ev.nameStamp + 0.02, 0.2);
// the map cracks and crumbles
sfx.addMono(I.thwack(), ev.mapCrack, 0.5);
sfx.addMono(I.noiseSweep(1.4, 700, 120, { q: 0.7, pink: true, shape: (x) => Math.exp(-x * 2.5) * Math.min(1, x * 25), seed: 34 }), ev.mapCrack + 0.05, 0.5);
sfx.addMono(I.subBoom(1.6, 60, 28), ev.mapCrack + 0.1, 0.4);
// the school cut, the mocking boys
sfx.addMono(I.paperFwip(0.9, 5), ev.school - 0.05, 0.3);
// Toulon: cannons
ev.salvo.forEach((t, i) => {
  sfx.addMono(I.subBoom(1.0, 90, 38), t, 0.6); sfx.addMono(I.thud(100, 0.12), t, 0.6);
  sfx.addMono(I.noiseSweep(0.55, 2600, 180, { q: 0.7, shape: (x) => Math.exp(-x * 5), seed: 60 + i }), t, 0.45);
});
sfx.addMono(I.paperFwip(0.8, 9), ev.officer - 0.05, 0.25);
// the epaulettes land: ding + shimmer
{ const bl = I.bell(1568, 1.4, 1.8), bl2 = I.bell(2093, 1.2, 1.6); sfx.addMono(bl, ev.epaulette, 0.35); sfx.addMono(bl2, ev.epaulette + 0.06, 0.25); verb.addMono(bl, ev.epaulette, 0.5); timp(ev.epaulette, 'D2', 0.5, 0.9); }
// coup: soldiers' boots on stone
for (let t = ev.y1799 + 0.3; t < ev.y1804 - 0.4; t += 0.32) sfx.addMono(I.thud(120 + 30 * hash(t, 1), 0.05), t, 0.2);
// coronation: crown lifted (shimmer), placed (bell)
sfx.addMono(I.noiseSweep(0.9, 1500, 4800, { q: 1.1, shape: (x) => x * x }), ev.crownLift, 0.18);
{ const bl = I.bell(1318.5, 2.0, 1.5); sfx.addMono(bl, ev.crownOn, 0.35); verb.addMono(bl, ev.crownOn, 0.5); }
// the Code Civil slams shut
sfx.addMono(I.thud(52, 0.3), ev.book, 1.0); sfx.addMono(I.subBoom(1.8, 70, 26), ev.book, 0.7);
sfx.addMono(I.noiseSweep(0.35, 5000, 700, { q: 0.8, shape: (x) => Math.exp(-x * 4), seed: 35 }), ev.book, 0.45);
sfx.addMono(I.noiseSweep(1.4, 1500, 5200, { q: 1.1, shape: (x) => x * x }), ev.book + 0.15, 0.12); // the glow
// Austerlitz: the sun breaks through
sfx.addMono(I.noiseSweep(1.6, 300, 3000, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x * 0.8) }), ev.sunBreaks - 0.3, 0.2);
// the flood of blue
sfx.addMono(I.noiseSweep(0.9, 400, 3200, { q: 0.7, shape: (x) => Math.sin(Math.PI * x) }), ev.flood, 0.28);
// Moscow burns: crackle
for (let k = 0; k < 40; k++) { const t = ev.moscow + hash(k, 5) * 2.0; sfx.addMono(I.woodTick(0.3 + hash(k, 6) * 0.7), t, 0.1 + hash(k, 7) * 0.12); }
sfx.addMono(I.noiseSweep(2.2, 900, 500, { q: 0.4, pink: true, seed: 36, shape: (x) => Math.sin(Math.PI * x) }), ev.moscow, 0.2);
// the caricature & the stamp
sfx.addMono(I.pop ? I.pop(0.9) : I.woodTick(1), ev.cartoon + 0.1, 0.3);

// ------------------------------------------------------------------ narration
const voice = MIX.loadAudio(path.join(__dirname, 'out', 'vo.wav'), { length: DURATION });
const vsend = bus();
for (let i = 0; i < N; i++) { vsend.L[i] = voice.L[i] * 0.5; vsend.R[i] = voice.R[i] * 0.5; }

// ------------------------------------------------------------------ mix
const rv = reverb(verb, { room: 0.88, damp: 0.35 });
const vrv = reverb(vsend, { room: 0.55, damp: 0.5, predelay: 0.012 });
const musicBuses = { tim, snr, str, brs, low, pz, music_fx, rv };
const MG = { tim: 0.8, snr: 0.4, str: 0.45, brs: 0.62, low: 0.55, pz: 0.8, music_fx: 0.6, rv: 0.7 };
const music = MIX.mixdown(musicBuses, MG, { stemDir: process.env.STEMS ? path.join(__dirname, 'out') : null });
// keep the loud action sections from swamping the narration
const hot = (t) => (t >= 13 && t < 19 ? 0.55 : t >= 19 && t < 32 ? 0.6 : t >= 49 && t < 54.3 ? 0.55 : 1);
music.applyGain(hot); sfx.applyGain((t) => (hot(t) < 1 ? 0.7 : 1));
MIX.gate(music, ev.elbaSilence, SC.ret - 0.1); // the music is truly silent for Elba
MIX.duck([music], voice, { depth: 0.55, attack: 0.03, release: 0.35, threshold: 0.03 }); // music under the voice
MIX.fadeOut(music, DURATION - 3.2, DURATION - 0.05);
const out = new Bus(N);
music.mixInto(out, 1);
MIX.duck([sfx], voice, { depth: 0.45, attack: 0.02, release: 0.3, threshold: 0.03 });
sfx.mixInto(out, 0.6);
MIX.duck([waves], voice, { depth: 0.3, release: 0.3, threshold: 0.03 });
waves.mixInto(out, 0.8);
if (!process.env.NOVOICE) voice.mixInto(out, 1.7);
if (!process.env.NOVOICE) vrv.mixInto(out, 0.12);
MIX.highpass(out, 24);
MIX.fadeOut(out, DURATION - 0.25, DURATION);
const M = MIX.master(out, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : (process.env.DRIVE ? null : -14) });
MIX.writeWav(path.join(__dirname, 'out', 'music.wav'), out);
console.log(`wrote out/music.wav (${DURATION}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : 'master'}, drive ${M.drive})`);
