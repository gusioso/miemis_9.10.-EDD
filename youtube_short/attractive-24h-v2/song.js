// THE SONG — the ElevenLabs narration (assets/vo/, made by tts.js) on top of a soundtrack synthesized from
// the score: every sound effect sits on an event in score.js, so it lands on the frame that shows it.
//   node song.js              -> out/music.wav (+ out/voice.json for the captions)
//   STEMS=1 node song.js      also writes out/stem-*.wav     LUFS=-14 node song.js  masters to -14 LUFS
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong, OnePole } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, HALF, DURATION, m, ev, clock, SC } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), pad = bus(), keys = bus(), amb = bus(), fx = bus(), voice = bus();
const verb = bus(), dly = bus();
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });

// ---------- small sound helpers ----------
const rngs = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; }; };
function noise(len, seed, lp = 20000, hp = 20) { // filtered white noise
  const r = rngs(seed), a = new OnePole(), b = new OnePole(), x = new Float32Array(Math.round(len * SR));
  for (let i = 0; i < x.length; i++) x[i] = b.hp(a.lp(r(), lp), hp);
  return x;
}
function env(x, att, rel) { // fade a buffer in / out (seconds)
  const n = x.length, A = att * SR, R = rel * SR;
  for (let i = 0; i < n; i++) x[i] *= Math.min(1, i / A, (n - i) / R);
  return x;
}
function shutter(seed) { // phone camera: two short clicks
  const x = new Float32Array(Math.round(0.16 * SR));
  const n = noise(0.16, seed, 9000, 1500);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = n[i] * (Math.exp(-t * 90) + (t > 0.075 ? 0.8 * Math.exp(-(t - 0.075) * 110) : 0)); }
  return x;
}
function sine(f, len, dec) {
  const x = new Float32Array(Math.round(len * SR));
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * dec) * Math.min(1, t / 0.004); }
  return x;
}
const inRange = (t, a, b) => t >= a && t < b;

// ---------- sections ----------
const DAY = [SC.wake.t0, SC.address.t0]; // the bouncy groove
const END = [SC.after.t0, DURATION - 1.2]; // the warm groove comes back
const DARK = [SC.address.t0, SC.count.t0];

// ---------- the hook: a crowd outside, heartbeat, camera flashes ----------
const crowdBed = (t0, t1, g, seed) => {
  const len = t1 - t0, x = env(noise(len, seed, 1400, 250), 0.3, 0.5);
  // murmur: amplitude wobble at syllable rate
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= 0.6 + 0.4 * Math.sin(2 * Math.PI * (3.1 * t + Math.sin(t * 1.7))); }
  amb.addMono(x, t0, g, -0.2);
  amb.addMono(env(noise(len, seed + 1, 1100, 300), 0.3, 0.5), t0, g * 0.7, 0.3);
};
crowdBed(0, SC.hook.t1, 0.5, 11);
for (let t = 0.05; t < SC.hook.t1 - 0.2; t += BEAT) drums.addMono(I.heartbeat(), t, 0.9);
for (const [i, t] of ev.flashes.entries()) fx.addMono(shutter(40 + i), t, 0.55, i % 2 ? 0.35 : -0.35);
for (const n of ['D2', 'A2', 'D3']) { const p = I.padNote(m(n), SC.hook.t1 + 0.4, { cutoff: 500, attack: 0.05, release: 0.4 }); pad.addStereo(p.L, p.R, 0, 0.12); }

// ---------- rewind: tape rewind + stamp ----------
fx.addMono(I.noiseSweep(1.0, 6000, 300, { q: 2.5, shape: (x) => Math.sin(Math.PI * Math.min(1, x * 1.3)) }), ev.rewind, 0.35);
for (let i = 0; i < 14; i++) fx.addMono(I.woodTick(2.2 - i * 0.05), ev.rewind + 0.02 + i * 0.03, 0.18, 0.2);
fx.addMono(I.tvClick(), ev.rewind, 0.9); // the tape clunks into rewind
fx.addMono(I.pop(2600, 5), ev.rewind, 0.6);
fx.addMono(I.thwack(), ev.stamp, 0.5);
fx.addMono(I.thud(70, 0.12), ev.stamp, 0.6);

// ---------- the day groove: 100 BPM, F C Dm Bb ----------
const K = I.kick(), CL = I.clap(), HC = [I.hat(false, 11), I.hat(false, 12)], SH = I.shaker(1, 15), CR = I.crash(18);
const kicks = [];
const grooveOn = (t) => inRange(t, DAY[0] + 0.25, DAY[1]) || inRange(t, END[0] + T(1) * 0, END[1]);
clock.eachStep(0, 30, 8, (t, b, s) => {
  if (!grooveOn(t)) return;
  const soft = t >= END[0];
  if (s === 0 || s === 4 || (!soft && s === 7 && b % 2)) { drums.addMono(K, t, soft ? 0.5 : 0.85); kicks.push(t); }
  if (s === 2 || s === 6) { drums.addMono(CL, t, soft ? 0.25 : 0.5); verb.addMono(CL, t, 0.2); }
  drums.addMono(soft ? SH : HC[s % 2], t, s % 2 ? 0.16 : 0.1, 0.3);
  const c = sc.chordAt(t);
  if (!c) return;
  if (!soft && (s === 0 || s === 3 || s === 4 || s === 6)) bass.addMono(I.bass(c.bass + 12 + (s === 6 ? 7 : 0), HALF * 0.9), t, 0.5);
  if (soft && s === 0) bass.addMono(I.bass(c.bass + 12, BEAT * 3.6, { sub: 0.9 }), t, 0.4);
  if (!soft && (s === 1 || s === 5)) for (const n of c.notes) { const p = I.pluck(n + 12, { decay: 0.18 }); keys.addMono(p, t, 0.1, 0.25); }
  if (soft && (s === 0 || s === 3 || s === 6)) for (const n of c.notes) { const e = I.epiano(n + 12, BEAT * 1.2); keys.addMono(e, t, 0.12); verb.addMono(e, t, 0.06); }
});
drums.addMono(CR, kicks.find((t) => t >= DAY[0]), 0.25);
// a cheeky marimba hook over the day (one 8th-note phrase per bar)
const HOOK = [[0, 'C6'], [1, 'A5'], [3, 'C6'], [4, 'F6'], [6, 'E6'], [7, 'C6']];
clock.eachStep(0, 30, 8, (t, b, s) => {
  if (!inRange(t, SC.bus.t0, SC.halo.t0) || b % 2) return;
  const h = HOOK.find((x) => x[0] === s);
  if (h) { const x = I.marimba(m(h[1]) - (b % 4 === 2 ? 2 : 0), { thock: 0.2 }); keys.addMono(x, t, 0.22, -0.2); dly.addMono(x, t, 0.06); }
});

// ---------- day sync hits ----------
// mirror reveal: a rising sparkle arpeggio
['C6', 'F6', 'A6', 'C7', 'F7'].forEach((n, i) => { const x = I.musicBox(m(n)); fx.addMono(x, ev.mirrorReveal + i * 0.06, 0.22, -0.4 + i * 0.2); verb.addMono(x, ev.mirrorReveal + i * 0.06, 0.15); });
fx.addMono(I.ting(m('A6')), ev.timerStart, 0.35); // the countdown tag drops in
fx.addMono(shutter(77), ev.snap, 1.2); // the stranger's photo
fx.addMono(I.pop(3200, 6), ev.snap, 0.8);
ev.views.forEach((t, i) => fx.addMono(I.ting(m('C6') + [0, 2, 4, 5, 7, 9, 11, 12][i], { gap: 0.05 }), t, 0.22, (i % 2 ? 0.3 : -0.3)));
fx.addMono(I.bell(1568, 0.5), ev.viewsDone, 0.25);
fx.addMono(I.pop(1200), ev.coffee, 0.35);
fx.addMono(I.noiseSweep(0.35, 400, 5000, { q: 1 }), ev.noLines - 0.1, 0.25); // the line of people swooshes away
// halo: a bright bell, then a rising note per bar
fx.addMono(I.bell(2093, 0.9, 1.4, 2), ev.halo, 0.3); verb.addMono(I.bell(2093, 0.9, 1.4, 2), ev.halo, 0.3);
ev.bars.forEach((t, i) => { const x = I.marimba(m(['C5', 'E5', 'G5'][i]) + 12); fx.addMono(x, t, 0.4); });

// ---------- the turn: record scratch, the fun stops ----------
fx.addMono(I.thud(90, 0.06), ev.scratch, 0.9); // needle hits the record...
fx.addMono(I.pop(1800, 7), ev.scratch, 0.6);
fx.addMono(I.scratch(0.4), ev.scratch, 0.7);
for (const n of ['D2', 'F2', 'A2']) { const p = I.padNote(m(n), DARK[1] - DARK[0] - 0.4, { cutoff: 600, attack: 0.8, release: 0.6 }); pad.addStereo(p.L, p.R, DARK[0] + 0.35, 0.13); }
for (let t = ev.scratch + 0.6; t < SC.address.t1 - 0.1; t += BEAT) fx.addMono(sine(880, 0.18, 6), t, 0.06, 0.4); // a quiet alarm pulse
fx.addMono(I.thud(60, 0.2), ev.pin, 0.8);
fx.addMono(I.subBoom(1.2, 70, 35), ev.pin, 0.45);
// hiding: back outside the window
crowdBed(SC.hiding.t0, SC.hiding.t1 + 0.4, 0.45, 21);
for (let t = SC.hiding.t0 + 0.05; t < SC.hiding.t1; t += BEAT) drums.addMono(I.heartbeat(), t, 0.8);
fx.addMono(I.noiseSweep(0.3, 2500, 300, { q: 1 }), ev.hideDuck - 0.05, 0.25);
// 400 messages: rain + a lonely music box
amb.addMono(env(noise(SC.msgs.t1 - SC.msgs.t0, 31, 3500, 600), 0.4, 0.4), SC.msgs.t0, 0.18, 0.1);
fx.addMono(I.ting(m('E6')), ev.badge, 0.25);
[['A5', 0], ['F5', 2], ['E5', 4], ['D5', 6], ['A4', 10]].forEach(([n, k]) => {
  const x = I.musicBox(m(n)); keys.addMono(x, SC.msgs.t0 + 0.6 + k * HALF, 0.22); verb.addMono(x, SC.msgs.t0 + 0.6 + k * HALF, 0.25);
});

// ---------- the final countdown: tick per number, a riser, an 8th of silence, POOF ----------
ev.countNums.forEach((t, i) => {
  fx.addMono(I.woodTick(1.4), t, 0.6);
  fx.addMono(sine(m('A4') ? 440 * Math.pow(2, i * 2 / 12) : 440, 0.3, 9), t, 0.18);
});
fx.addMono(I.noiseSweep(ev.poof - HALF - ev.countNums[0], 300, 7000, { q: 0.8, shape: (x) => x * x, pink: true }), ev.countNums[0], 0.35);
fx.addMono(I.subBoom(2.0), ev.poof, 0.8);
fx.addMono(env(noise(0.9, 91, 3000, 80), 0.002, 0.85), ev.poof, 0.5);
fx.addMono(I.crash(19), ev.poof, 0.25);

// ---------- the ending ----------
fx.addMono(I.ting(m('G6')), ev.text, 0.3);
fx.addMono(I.marimba(m('C6'), { thock: 0 }), ev.pizza, 0.3);
fx.addMono(I.pop(1600, 3), ev.ctaYes, 0.35, -0.35);
fx.addMono(I.pop(1100, 4), ev.ctaNo, 0.35, 0.35);
for (const n of ['F3', 'A3', 'C4', 'E4']) { const p = I.padNote(m(n), DURATION - END[1] + 0.2, { cutoff: 1800, attack: 0.05, release: 1.2 }); pad.addStereo(p.L, p.R, END[1], 0.1); }
for (const n of ['F5', 'C6']) { const x = I.musicBox(m(n)); keys.addMono(x, END[1], 0.2); verb.addMono(x, END[1], 0.2); }

// ---------- the narration (ElevenLabs, from assets/vo) ----------
const vjson = { engine: 'elevenlabs', lines: [], mouth: null };
for (const l of sc.vo) {
  const b = MIX.loadAudio(path.join(__dirname, 'assets', 'vo', l.id + '.mp3'), { at: l.at - l.t0 });
  // level every line to the same speech loudness, then a gentle high-pass
  let s = 0, c = 0;
  const a = Math.round(l.at * SR), e = Math.min(b.n, Math.round((l.end + 0.15) * SR));
  for (let i = a; i < e; i++) { const x = (b.L[i] + b.R[i]) / 2; if (Math.abs(x) > 0.01) { s += x * x; c++; } }
  const g = c ? Math.min(4, 0.11 / Math.sqrt(s / c)) : 1;
  const hp = new OnePole();
  const fadeEnd = Math.round((l.end + 0.12) * SR);
  for (let i = Math.max(0, a - Math.round(0.03 * SR)); i < Math.min(b.n, fadeEnd, N); i++) {
    const tail = Math.min(1, (fadeEnd - i) / (0.06 * SR));
    const x = hp.hp((b.L[i] + b.R[i]) / 2 * g * tail, 80);
    voice.L[i] += x; voice.R[i] += x;
  }
  vjson.lines.push({ t: l.at, end: l.end, text: l.cap, words: l.words });
}

// ---------- mix ----------
MIX.sidechain([bass, pad], kicks, { depth: 0.35 });
MIX.duck([drums, bass, pad, keys, amb], voice, { depth: 0.6, release: 0.3, threshold: 0.03 });
MIX.duck([fx], voice, { depth: 0.35, release: 0.2, threshold: 0.03 }); // hits stay audible, a little under the words
const stems = {
  voice, drums, bass, pad, keys, amb, fx,
  verb: reverb(verb, { room: 0.8, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.3, 3500),
};
const GAIN = { voice: 1.0, drums: 0.18, bass: 0.28, pad: 1.1, keys: 0.45, amb: 0.5, fx: 0.42, verb: 0.6, dly: 0.8 };
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 25);
MIX.gate(mix, ev.poof - HALF, ev.poof); // an 8th of held breath before the POOF
MIX.gate(mix, ev.rewind - HALF, ev.rewind); // and before the tape rewinds
MIX.fadeOut(mix, DURATION - 1.0, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), 0.76, /* ~-2.4 dBTP: headroom for AAC overshoot */ { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
const { mouthTrack } = require('./engine/audio/voice');
vjson.mouth = mouthTrack(voice, 30);
fs.writeFileSync(path.join(out, 'voice.json'), JSON.stringify(vjson));
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M && M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
