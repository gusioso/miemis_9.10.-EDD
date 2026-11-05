// Exports the shared timeline (events, scene cuts, narration word times) and the Europe map outlines for the 3D version.
const fs = require('fs'); const path = require('path');
const S = require('../score.js');
const out = path.join(__dirname, '..', '..', 'napoleon-3d');
const words = []; S.VOT.lines.forEach((l) => l.words.forEach((w) => words.push({ w: w.w, t: w.t, end: w.end, line: l.id })));
fs.writeFileSync(path.join(out, 'src/timeline.json'), JSON.stringify({ ev: S.ev, SC: S.SC, words, lines: S.VOT.lines.map((l) => ({ id: l.id, t: l.t, end: l.end })) }, null, 1));
const src = fs.readFileSync(path.join(__dirname, '..', 'engine/data/geo.js'), 'utf8');
const GEO = new Function('globalThis', src + ';return globalThis.GEO')({});
const names = ['Portugal','Spain','France','Italy','Switzerland','Belgium','Netherlands','Germany','Austria','Poland','Denmark','Czechia','Slovakia','Hungary','Slovenia','Croatia','Bosnia and Herz.','Serbia','Montenegro','Albania','Macedonia','Kosovo','Greece','Bulgaria','Romania','Moldova','Ukraine','Belarus','Lithuania','Latvia','Estonia','Russia','Sweden','Norway','Finland','United Kingdom','Ireland','Iceland','Turkey','Morocco','Algeria','Tunisia','Libya','Cyprus'];
const g = {}; for (const n of names) if (GEO.world[n]) g[n] = GEO.world[n].map((r) => r.map((v) => +v.toFixed(2)));
fs.writeFileSync(path.join(out, 'src/geo.json'), JSON.stringify(g));
require('child_process').execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(__dirname, '..', 'out/music.wav'), '-c:a', 'libmp3lame', '-b:a', '192k', path.join(out, 'public/soundtrack.mp3')]);
console.log('exported', Object.keys(g).length, 'countries,', words.length, 'words');
