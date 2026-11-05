// THE SCORE — "60 Seconds of History: Napoleon".
// One timeline for picture AND sound. Scene cuts are fixed times; everything inside a scene is keyed to the
// narration's word times (assets/vo/timing.js, made by tools/vo_build.js), so the picture follows the voice.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const VOT = node ? require('./assets/vo/timing.js') : globalThis.VOT;
  const { m, makeClock } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const DURATION = 60;
  const clock = makeClock({ bpm: 120, offset: 0 });
  const { T, BEAT } = clock;
  const STYLE = 'paper';

  // ---------- narration lookups ----------
  const line = (id) => VOT.lines.find((l) => l.id === id);
  const wt = (id, i) => line(id).words[i].t; // start of word i
  const we = (id, i) => line(id).words[i].end;
  const wi = (id, re) => { const k = line(id).words.findIndex((w) => re.test(w.w)); if (k < 0) throw new Error(`no word ${re} in ${id}`); return k; };

  // ---------- scenes (fixed cuts) ----------
  const SC = { title: 0, about: 4.0, origins: 8.0, toulon: 13.0, power: 19.0, peak: 25.0, russia: 32.0, elba: 39.0, ret: 41.0, end: 49.0, twist: 54.3, finish: 60 };
  const S = {
    title: [SC.title, SC.about], about: [SC.about, SC.origins], origins: [SC.origins, SC.toulon], toulon: [SC.toulon, SC.power],
    power: [SC.power, SC.peak], peak: [SC.peak, SC.russia], russia: [SC.russia, SC.elba], elba: [SC.elba, SC.ret],
    return: [SC.ret, SC.end], theend: [SC.end, SC.twist], twist: [SC.twist, SC.finish],
  };

  // ---------- events (each one is also a sound in song.js) ----------
  const ev = {
    title: 0.10, // gold title stamp + drum hit
    nameStamp: wt('L02', 1) - 0.2, // NAPOLEON BONAPARTE
    mapCrack: wt('L02', wi('L02', /^lost/)) - 0.15, // the map cracks on "lost it all"
    y1769: SC.origins,
    school: wt('L03', wi('L03', /^At$/)) - 0.2, // Corsica -> military school
    mock: wt('L03', wi('L03', /^mock/)),
    y1793: SC.toulon,
    salvo: [13.75, 14.42, 15.02, 15.55], // cannon flashes over the harbour ("his cannons win...")
    officer: wt('L04', wi('L04', /^Toulon/)) + 0.05,
    epaulette: wt('L04', wi('L04', /^general/)), // gold epaulettes land on "general"
    y1799: wt('L05', 0) - 0.25,
    y1804: wt('L05', wi('L05', /^Eighteen-oh/)) - 0.25,
    crownLift: wt('L05', wi('L05', /^crowns/)),
    crownOn: wt('L05', wi('L05', /^emperor/)) - 0.1,
    book: SC.peak, // the Code Civil slams shut
    austerlitz: wt('L06', wi('L06', /^Austerlitz/)) - 0.35,
    sunBreaks: wt('L06', wi('L06', /^crushes/)),
    flood: wt('L06', wi('L06', /^single/)) - 0.1,
    y1812: wt('L07', 1) - 0.25,
    moscow: wt('L07', wi('L07', /^Russia/)) - 0.3,
    winter: wt('L07', wi('L07', /^Winter/)) - 0.15,
    elbaSilence: 38.7, // the music stops
    boat: SC.ret,
    alps: wt('L09', wi('L09', /^Troops/)) - 0.15,
    walk: wt('L09', wi('L09', /^walks/)) - 0.2,
    lower: wt('L09', wi('L09', /^They/)) - 0.25, // muskets lower
    hats: wt('L09', wi('L09', /^join/)) - 0.05, // hats in the air
    y1815: wt('L10', 1) - 0.25,
    helena: wt('L10', wi('L10', /^He$/)) - 0.25,
    chart: SC.twist,
    measure: wt('L11', wi('L11', /^five-foot/)) - 0.1,
    cartoon: wt('L11', wi('L11', /^Average/)) + 0.55,
    myth: wt('L11', wi('L11', /^myth/)) - 0.05,
    endCard: wt('L11', wi('L11', /^British/)) - 0.2,
  };

  // ---------- named moments (storyboard frames; sync = measured by `render.js verify`) ----------
  const markers = {
    title: { t: ev.title, sync: 'av' },
    napoleon: ev.nameStamp + 0.4,
    mapCracks: ev.mapCrack + 0.2,
    y1769: { t: ev.y1769, sync: 'av' },
    school: ev.school + 0.8,
    y1793: { t: ev.y1793, sync: 'av' },
    toulonFire: ev.salvo[1] + 0.12,
    epaulette: ev.epaulette + 0.35,
    y1799: ev.y1799 + 0.35,
    coronation: ev.crownOn + 0.15,
    book: { t: ev.book, sync: 'av' },
    austerlitz: ev.sunBreaks + 0.4,
    flood: ev.flood + 0.5,
    y1812: ev.y1812 + 0.35,
    moscow: ev.moscow + 1.3,
    retreat: ev.winter + 1.2,
    elba: 40.0,
    boat: 41.8,
    standoff: ev.walk + 1.2,
    hats: ev.hats + 0.5,
    waterloo: ev.y1815 + 0.6,
    helena: ev.helena + 1.8,
    height: ev.measure + 0.9,
    myth: ev.myth + 0.3,
    endcard: 59.3,
  };

  // ---------- captions: 2-3 word chunks from the narration's word times ----------
  const captions = [];
  for (const l of VOT.lines) {
    let chunk = [];
    const flush = () => { if (chunk.length) { captions.push({ words: chunk, t: chunk[0].t, text: chunk.map((w) => w.w).join(' ') }); chunk = []; } };
    l.words.forEach((w) => {
      chunk.push(w);
      if (chunk.length >= 3 || /[.?!:]$/.test(w.w) || (chunk.length >= 2 && /[,]$/.test(w.w))) flush();
    });
    flush();
  }
  captions.forEach((c, i) => { const nx = captions[i + 1]; c.end = Math.min(c.words[c.words.length - 1].end + 0.35, nx ? nx.t : DURATION); });

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, DURATION, STYLE, clock, T, BEAT, S, SC, m, ev, markers, captions, VOT, wt, we, wi, line };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
