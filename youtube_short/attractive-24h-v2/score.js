// THE SCORE — the single source of truth for music AND picture.
// The ElevenLabs narration (vo-data.js, made by tts.js) sets the pace: every line is placed on the 100 BPM
// half-beat grid, every scene starts on a line, and every sound effect / visual hit is an event below.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const VO = node ? require('./vo-data') : globalThis.VODATA;
  const LINES = node ? require('./lines') : globalThis.LINES;
  const { m, makeClock, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const STYLE = 'flat';
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = makeClock({ bpm: 100, offset: 0 }); // 1 beat = 0.6 s, 1 bar = 2.4 s
  const { T, BEAT } = clock;
  const HALF = BEAT / 2;
  const snap = (t) => Math.ceil(t / HALF - 1e-6) * HALF; // next 8th note

  // ---------- layout of the "What If" frame ----------
  const PANEL = { x: 0, y: 560, w: 1080, h: 690 }; // the story panel
  const TITLE = 'What If You Were The Most Attractive Man In The World For 24 Hours?';
  const PART = 'Part 1';

  // ---------- scenes: [id, lines, extra seconds after the last line, scene options] ----------
  // tod = time-of-day tag, clock = hours since 7:00 AM when the scene starts (drives the 24h countdown)
  const PLAN = [
    { id: 'hook', lines: ['hook'], pre: 0.15, post: 0.35, tod: '9:00 PM', clock: 14 },
    { id: 'rewind', lines: [], post: 1.2, tod: null },
    { id: 'wake', lines: ['wake'], post: 0.7, tod: '7:00 AM', clock: 0 },
    { id: 'bus', lines: ['bus'], post: 0.35, tod: '8:15 AM', clock: 1.25 },
    { id: 'views', lines: ['views'], post: 0.55, tod: '9:00 AM', clock: 2 },
    { id: 'office', lines: ['office'], post: 0.4, tod: '10:30 AM', clock: 3.5 },
    { id: 'halo', lines: ['halo'], post: 1.5, tod: '1:00 PM', clock: 6 },
    { id: 'address', lines: ['address'], pre: 0.3, post: 0.9, tod: '5:00 PM', clock: 10 },
    { id: 'hiding', lines: ['hiding'], post: 0.6, tod: '9:00 PM', clock: 14 },
    { id: 'msgs', lines: ['msgs'], post: 0.8, tod: '11:30 PM', clock: 16.5 },
    { id: 'count', lines: [], post: 4.2, tod: '6:59 AM', clock: 'count' },
    { id: 'after', lines: ['after'], pre: 0.3, post: 0.6, tod: 'NEXT MORNING', clock: null },
    { id: 'flex', lines: ['flex'], post: 2.4, tod: null, clock: null },
  ];

  const byId = Object.fromEntries(LINES.map((l) => [l.id, l]));
  const SC = {}; // id -> {t0, t1, lines: [{id, at, end, words}]}
  const vo = []; // every placed line
  let t = 0;
  for (const p of PLAN) {
    const t0 = t;
    const ls = [];
    let c = t0 + (p.pre || 0);
    for (const id of p.lines) {
      const d = VO[id];
      const at = +c.toFixed(3);
      const line = { id, at, end: +(at + d.dur).toFixed(3), t0: d.t0, cap: byId[id].cap,
        words: d.words.map((w) => ({ w: w.w, t: +(at + w.t).toFixed(3), end: +(at + w.end).toFixed(3) })) };
      ls.push(line); vo.push(line);
      c = line.end + 0.35;
    }
    const t1 = snap(Math.max(c - 0.35, t0) + (p.post || 0));
    SC[p.id] = { ...p, t0, t1, lines: ls };
    t = t1;
  }
  const DURATION = +(t + 0.2).toFixed(3);

  // ---------- helpers to find a spoken word's time ----------
  const word = (sid, k, li = 0) => SC[sid].lines[li].words[k].t;
  const wordIs = (sid, re, li = 0) => SC[sid].lines[li].words.find((w) => re.test(w.w)).t;

  // ---------- events (sound + picture) ----------
  const ev = {
    // hook: camera flashes from the crowd, a phone shutter each
    flashes: [0.25, 0.9, 1.45, 1.7, 2.4, 2.75, 3.15].map((x) => SC.hook.t0 + x),
    rewind: SC.rewind.t0, // tape rewind whoosh + "14 HOURS EARLIER" stamp
    stamp: SC.rewind.t0 + 0.45,
    mirrorReveal: wordIs('wake', /^attractive/), // sparkle burst + shimmer
    timerStart: wordIs('wake', /^24/), // the countdown tag drops in with a ding
    snap: wordIs('bus', /^snaps/), // phone shutter + white flash
    views: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => SC.views.t0 + 0.15 + i * HALF / 2), // the counter jumps, a ping each
    viewsDone: SC.views.t0 + 0.15 + 8 * HALF / 2,
    haha: [word('office', 1), word('office', 2) + 0.15], // boss: HA! HA!
    coffee: wordIs('office', /^coffee/),
    noLines: wordIs('office', /^lines/),
    halo: wordIs('halo', /^halo/), // the halo drops onto his head: ding
    bars: [0, 1, 2].map((i) => SC.halo.lines[0].end + 0.05 + i * HALF), // SMARTER / KINDER / MORE TRUSTED, a note each
    scratch: SC.address.t0, // record scratch: the fun stops
    pin: wordIs('address', /^address/), // map pin slams down
    hideDuck: wordIs('hiding', /^Hiding/), // he ducks below the window
    badge: SC.msgs.t0 + 0.1,
    countNums: [0, 1, 2, 3, 4].map((i) => SC.count.t0 + 0.6 + i * BEAT), // 5, 4, 3, 2, 1
    poof: SC.count.t0 + 0.6 + 5 * BEAT + HALF, // an 8th of held breath, then POOF
    text: wordIs('after', /^texts/) + 0.25, // the best friend's text pops in
    pizza: wordIs('after', /^pizza/),
    flex: wordIs('flex', /^flex/),
    ctaYes: wordIs('flex', /^take/),
    ctaNo: wordIs('flex', /^hours/) + 0.05,
  };

  const S = { // sections for engine/tools/levels.js
    hook: [SC.hook.t0, SC.rewind.t1], day: [SC.wake.t0, SC.halo.t1], dark: [SC.address.t0, SC.msgs.t1],
    count: [SC.count.t0, SC.count.t1], end: [SC.after.t0, DURATION],
  };

  // ---------- harmony for the day groove and the ending ----------
  const { chords, chordAt } = makeChords(clock, {
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' }, C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' }, Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
  }, Array.from({ length: 30 }, (_, b) => [b, 0, 4, ['F', 'C', 'Dm', 'Bb'][b % 4]]));

  const markers = {
    hook: SC.hook.t0 + 0.5,
    rewind: { t: ev.rewind, sync: 'av' },
    stamp: ev.stamp,
    reveal: ev.mirrorReveal,
    timer: ev.timerStart,
    snap: { t: ev.snap, sync: 'av' },
    views: SC.views.t0 + 1,
    office: SC.office.t0 + 1.5,
    halo: ev.halo + 0.4,
    scratch: { t: ev.scratch, sync: 'av' },
    pin: ev.pin + 0.2,
    hiding: ev.hideDuck + 0.3,
    msgs: SC.msgs.t0 + 1.5,
    count3: ev.countNums[2] + 0.1,
    poof: { t: ev.poof, sync: 'av' },
    after: ev.text + 0.6,
    cta: ev.ctaNo + 0.8,
  };

  const SCORE = { FPS, FORMAT, STYLE, W, H, SAFE, DURATION, clock, T, BEAT, HALF, S, m, chords, chordAt,
    PANEL, TITLE, PART, PLAN, SC, vo, ev, markers };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
