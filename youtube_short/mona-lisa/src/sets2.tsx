import React from "react";
import { Easing } from "remotion";
import { INK, shade } from "./Stick";
import { H, W, ip, pop, tf } from "./kit";
import { Cloud, Rooftops, Sky, Tower } from "./sets";

// Sets for "The Man Who Stole the Mona Lisa": the Louvre, the painting, the apartment, newspapers, the police board,
// the maps and Florence. World = the story window, 2160 x 1240.

const rnd = (i: number, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/** The Mona Lisa, simplified: a seated woman, folded hands, dark dress, a hazy landscape behind. (x, y) = top-left of the frame. */
export const MonaLisa: React.FC<{ x: number; y: number; w: number; frame?: boolean; op?: number; glow?: number }> = ({ x, y, w, frame = true, op = 1, glow = 0 }) => {
  const h = w * 1.45;
  const f = frame ? w * 0.09 : 0;
  const cx = x + f, cy = y + f, cw = w - 2 * f, ch = h - 2 * f;
  const id = `ml${Math.round(x)}_${Math.round(y)}_${Math.round(w)}`;
  const P = (fx: number, fy: number) => `${cx + fx * cw},${cy + fy * ch}`;
  return (
    <g opacity={op}>
      {glow > 0 && <rect x={x - w * 0.3} y={y - w * 0.3} width={w * 1.6} height={h + w * 0.6} rx={w * 0.4} fill="#ffe7a0" opacity={0.35 * glow} filter="url(#soft)" />}
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fa392" /><stop offset="0.45" stopColor="#6f7f5a" /><stop offset="1" stopColor="#4a3f28" /></linearGradient>
        <clipPath id={`${id}c`}><rect x={cx} y={cy} width={cw} height={ch} /></clipPath>
      </defs>
      <rect x={x + w * 0.05} y={y + w * 0.07} width={w} height={h} fill="#000" opacity={0.3} />
      {frame && (
        <>
          <rect x={x} y={y} width={w} height={h} fill="#b9892e" stroke={INK} strokeWidth={Math.max(3, w * 0.014)} />
          <rect x={x + f * 0.3} y={y + f * 0.3} width={w - f * 0.6} height={h - f * 0.6} fill="none" stroke="#f0cf6a" strokeWidth={f * 0.25} />
          <rect x={x + f * 0.75} y={y + f * 0.75} width={w - f * 1.5} height={h - f * 1.5} fill="none" stroke="#7a5a1a" strokeWidth={f * 0.15} />
        </>
      )}
      <g clipPath={`url(#${id}c)`}>
        <rect x={cx} y={cy} width={cw} height={ch} fill={`url(#${id}bg)`} />
        {/* hazy hills, winding road, a river */}
        <path d={`M ${P(0, 0.38)} Q ${P(0.2, 0.3)} ${P(0.35, 0.36)} L ${P(0.35, 0.5)} L ${P(0, 0.5)} Z`} fill="#7c8f78" opacity={0.8} />
        <path d={`M ${P(0.65, 0.34)} Q ${P(0.85, 0.28)} ${P(1, 0.33)} L ${P(1, 0.5)} L ${P(0.65, 0.5)} Z`} fill="#7c8f78" opacity={0.8} />
        <path d={`M ${P(0.05, 0.47)} Q ${P(0.15, 0.42)} ${P(0.22, 0.45)}`} fill="none" stroke="#c9a86a" strokeWidth={cw * 0.02} opacity={0.7} />
        <path d={`M ${P(0.8, 0.44)} Q ${P(0.9, 0.5)} ${P(0.98, 0.46)}`} fill="none" stroke="#a8b8b0" strokeWidth={cw * 0.025} opacity={0.7} />
        {/* the sitter: dark hair falling to the shoulders, veil, dark dress, folded hands */}
        <path d={`M ${P(0.33, 0.25)} Q ${P(0.5, 0.06)} ${P(0.67, 0.25)} L ${P(0.71, 0.5)} L ${P(0.29, 0.5)} Z`} fill="#2e2216" />
        <path d={`M ${P(0.08, 1)} Q ${P(0.14, 0.58)} ${P(0.36, 0.5)} L ${P(0.64, 0.5)} Q ${P(0.86, 0.58)} ${P(0.92, 1)} Z`} fill="#3a2a1a" />
        <path d={`M ${P(0.4, 0.5)} Q ${P(0.5, 0.6)} ${P(0.6, 0.5)}`} fill="#d9b585" />
        <ellipse cx={cx + 0.5 * cw} cy={cy + 0.32 * ch} rx={cw * 0.13} ry={ch * 0.11} fill="#ddb787" />
        <path d={`M ${P(0.37, 0.28)} Q ${P(0.5, 0.18)} ${P(0.63, 0.28)} L ${P(0.62, 0.24)} Q ${P(0.5, 0.17)} ${P(0.38, 0.24)} Z`} fill="#2e2216" />
        <ellipse cx={cx + 0.45 * cw} cy={cy + 0.315 * ch} rx={cw * 0.02} ry={ch * 0.008} fill="#3a2a1a" />
        <ellipse cx={cx + 0.555 * cw} cy={cy + 0.315 * ch} rx={cw * 0.02} ry={ch * 0.008} fill="#3a2a1a" />
        <path d={`M ${P(0.455, 0.375)} Q ${P(0.5, 0.388)} ${P(0.545, 0.374)}`} fill="none" stroke="#8a5a3a" strokeWidth={cw * 0.008} />
        <ellipse cx={cx + 0.46 * cw} cy={cy + 0.82 * ch} rx={cw * 0.12} ry={ch * 0.045} fill="#d9b585" />
        <ellipse cx={cx + 0.56 * cw} cy={cy + 0.8 * ch} rx={cw * 0.11} ry={ch * 0.04} fill="#e3c08f" />
        <rect x={cx} y={cy} width={cw} height={ch} fill="#5a4a20" opacity={0.18} />
      </g>
    </g>
  );
};

/** The four iron hooks and the pale patch left on the wall. */
export const EmptySpot: React.FC<{ x: number; y: number; w: number; op?: number }> = ({ x, y, w, op = 1 }) => {
  const h = w * 1.45;
  return (
    <g opacity={op}>
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="#c9665a" opacity={0.9} /><rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke="#5a1a18" strokeWidth={4} strokeDasharray="14 10" opacity={0.6} />
      {[[0.15, 0.06], [0.85, 0.06], [0.15, 0.94], [0.85, 0.94]].map(([fx, fy], i) => (
        <g key={i}>
          <rect x={x + fx * w - 11} y={y + fy * h - 24} width={22} height={48} rx={5} fill="#1a1a1a" />
          <circle cx={x + fx * w} cy={y + fy * h - 28} r={10} fill="#6a6a6a" stroke="#1a1a1a" strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

const GoldFrame: React.FC<{ x: number; y: number; w: number; h: number; art: string; seed: number }> = ({ x, y, w, h, art, seed }) => (
  <g>
    <rect x={x + 8} y={y + 12} width={w} height={h} fill="#000" opacity={0.28} />
    <rect x={x} y={y} width={w} height={h} fill="#c09038" stroke={INK} strokeWidth={4} />
    <rect x={x + w * 0.07} y={y + w * 0.07} width={w * 0.86} height={h - w * 0.14} fill={art} />
    <path d={`M ${x + w * 0.07} ${y + h * (0.55 + rnd(seed) * 0.15)} Q ${x + w * 0.5} ${y + h * (0.4 + rnd(seed, 2) * 0.2)} ${x + w * 0.93} ${y + h * 0.6} L ${x + w * 0.93} ${y + h - w * 0.07} L ${x + w * 0.07} ${y + h - w * 0.07} Z`} fill={shade(art, 0.7)} />
    {rnd(seed, 3) > 0.4 && <circle cx={x + w * (0.3 + rnd(seed, 4) * 0.4)} cy={y + h * 0.35} r={w * 0.1} fill={shade(art, 1.5)} opacity={0.7} />}
  </g>
);

/** A grand Louvre gallery: deep red walls hung with gilded paintings, a glass skylight, marble floor, sunbeams. */
export const Gallery: React.FC<{ t: number; mona?: number; spot?: number; monaX?: number; beams?: number }> = ({ t, mona = 1, spot = 0, monaX = 1080, beams = 1 }) => {
  const mw = 260, mx = monaX - mw / 2, my = 330;
  return (
    <g>
      <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#7a2a26" />
      <rect x={-400} y={-200} width={W + 800} height={300} fill="#d9c79c" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-400 + i * 260} y={-200} width={200} height={260} fill="#eef2f4" opacity={0.55} stroke="#b59a5a" strokeWidth={6} />)}
      <rect x={-400} y={90} width={W + 800} height={40} fill="#c9a24a" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={-400 + i * 75} cy={110} r={10} fill="#f0cf6a" />)}
      {/* salon-style hang */}
      {[[-260, 190, 300, 220], [120, 170, 220, 300], [420, 210, 300, 210], [1500, 170, 240, 320], [1800, 200, 320, 230], [2160, 180, 260, 300],
        [-200, 520, 220, 280], [500, 560, 280, 200], [1560, 560, 260, 220], [1880, 520, 240, 300]].map(([x, y, w, h], i) => (
        <GoldFrame key={i} x={x} y={y} w={w} h={h} seed={i + 3} art={["#5a6a4a", "#7a5a3a", "#3f4f6a", "#8a6a42", "#4a3a2a"][i % 5]} />
      ))}
      {/* the place of honour */}
      <EmptySpot x={mx} y={my} w={mw} op={spot} />
      {mona > 0.01 && <MonaLisa x={mx} y={my} w={mw} op={mona} />}
      <rect x={-400} y={880} width={W + 800} height={24} fill="#4a1a18" />
      <rect x={-400} y={904} width={W + 800} height={500} fill="#e9e2d2" />
      {Array.from({ length: 22 }).map((_, i) => <polygon key={i} points={`${-400 + i * 150},904 ${-325 + i * 150},904 ${-520 + i * 220},1400 ${-630 + i * 220},1400`} fill="#cfc4ad" opacity={i % 2 ? 0.75 : 0.2} />)}
      {beams > 0 && [0, 1, 2].map((i) => <polygon key={i} points={`${300 + i * 600},-100 ${460 + i * 600},-100 ${760 + i * 600},1240 ${520 + i * 600},1240`} fill="#fff4c8" opacity={(0.1 + 0.03 * Math.sin(t * 0.8 + i)) * beams} />)}
      <rect x={760} y={860} width={640} height={30} rx={10} fill="#6a1a1a" opacity={0.8} />
      {[780, 1380].map((x) => <rect key={x} x={x - 6} y={800} width={12} height={90} fill="#c9a24a" />)}
      <path d="M 780 812 Q 1080 860 1380 812" fill="none" stroke="#8a1d24" strokeWidth={12} />
    </g>
  );
};

/** The Louvre from its courtyard: long wings, a pavilion with a tall slate roof. */
export const Louvre: React.FC<{ t: number; crowd?: number }> = ({ t }) => (
  <g>
    <Sky id="lvSky" top="#7fb0de" bot="#eadfc6" />
    {[[300, 140, 1.3], [1400, 120, 1.1], [1950, 220, 0.9]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 12) % 300)} y={y} s={s} />)}
    {/* wings */}
    {[[-300, 1000], [1260, 1300]].map(([x, w], k) => (
      <g key={k}>
        <rect x={x} y={420} width={w} height={520} fill="#e7dcc2" stroke={INK} strokeWidth={5} />
        <path d={`M ${x - 10} 420 L ${x + 30} 330 L ${x + w - 30} 330 L ${x + w + 10} 420 Z`} fill="#6f7b8c" stroke={INK} strokeWidth={5} />
        {Array.from({ length: Math.floor(w / 110) }).map((_, i) => (
          <g key={i}>
            <path d={`M ${x + 30 + i * 110} 900 L ${x + 30 + i * 110} 760 Q ${x + 70 + i * 110} 710 ${x + 110 + i * 110} 760 L ${x + 110 + i * 110} 900 Z`} fill="#4b5566" stroke={INK} strokeWidth={3} />
            <rect x={x + 40 + i * 110} y={480} width={60} height={160} rx={30} fill="#4b5566" stroke={INK} strokeWidth={3} />
            <rect x={x + 20 + i * 110} y={460} width={14} height={440} fill="#f2ead6" />
          </g>
        ))}
      </g>
    ))}
    {/* central pavilion */}
    <rect x={720} y={300} width={720} height={640} fill="#efe5cc" stroke={INK} strokeWidth={6} />
    <path d="M 700 300 L 760 120 L 1400 120 L 1460 300 Z" fill="#5d6878" stroke={INK} strokeWidth={6} />
    <rect x={1040} y={60} width={80} height={60} fill="#5d6878" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={780 + i * 170} y={360} width={50} height={540} fill="#f8f1de" stroke={INK} strokeWidth={4} />)}
    {[0, 1, 2].map((i) => <path key={i} d={`M ${850 + i * 170} 900 L ${850 + i * 170} 700 Q ${905 + i * 170} 640 ${960 + i * 170} 700 L ${960 + i * 170} 900 Z`} fill="#4b5566" stroke={INK} strokeWidth={4} />)}
    <path d="M 900 300 Q 1080 220 1260 300 Z" fill="#e2d6b8" stroke={INK} strokeWidth={4} />
    <rect x={-400} y={940} width={W + 800} height={500} fill="#cfc3a6" />
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-400 + i * 100} y={980 + (i % 3) * 60} width={70} height={14} fill="#b9ad90" />)}
  </g>
);

/** Paris from above, 1911: the Seine, the long Louvre on its bank, roofs, the Eiffel Tower far away. */
export const ParisLouvre: React.FC<{ t: number; id: string }> = ({ t, id }) => (
  <g>
    <Sky id={id} top="#7fb0de" bot="#f4dcb0" />
    {[[300, 180, 1.4], [1500, 140, 1.2], [1950, 260, 0.9]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 14 + i * 50) % 260)} y={y} s={s} o={0.85} />)}
    <Rooftops y={760} s={0.55} seed={5} col="#e4d3b2" />
    <Tower x={1900} yb={740} h={380} col="#7a5a46" />
    <Rooftops y={860} s={0.75} seed={3} col="#e7d8b9" />
    <path d="M -400 900 Q 600 860 1200 930 T 2600 900 L 2600 1060 Q 1600 1030 1100 1060 T -400 1040 Z" fill="#5f8fb8" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={((i * 260 + t * 30) % 2800) - 300} y={950 + (i % 3) * 25} width={80} height={6} rx={3} fill="#a9c8e6" />)}
    {/* the Louvre: a long palace along the river */}
    <rect x={200} y={1060} width={1700} height={120} fill="#efe2c6" stroke={INK} strokeWidth={4} />
    <path d="M 190 1060 L 220 1020 L 1880 1020 L 1910 1060 Z" fill="#6f7b8c" stroke={INK} strokeWidth={4} />
    {[300, 900, 1500].map((x) => <g key={x}><rect x={x} y={1000} width={160} height={180} fill="#efe2c6" stroke={INK} strokeWidth={4} /><path d={`M ${x - 6} 1000 L ${x + 14} 940 L ${x + 146} 940 L ${x + 166} 1000 Z`} fill="#5d6878" stroke={INK} strokeWidth={4} /></g>)}
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={230 + i * 56} y={1090} width={22} height={40} rx={10} fill="#4b5566" />)}
    <Rooftops y={1300} s={1.1} seed={14} col="#efe2c6" />
  </g>
);

/** Peruggia's small room: faded wallpaper, a window, a table, a door, and the hidden painting under a cloth. */
export const Apartment: React.FC<{ t: number; door?: number; night?: number; season?: number; hidden?: number; glowK?: number }> = ({ t, door = 0, night = 1, season = 0, hidden = 1, glowK = 0 }) => {
  const sky = night > 0.5 ? "#1c2340" : ["#a9c8e6", "#cfe0ea", "#9cc0e0", "#d9b48a"][Math.floor(season) % 4];
  return (
    <g>
      <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#5d6a55" />
      {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={-400 + i * 140} y={-200} width={60} height={1200} fill="#566249" />)}
      {Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={-300 + (i % 15) * 180} cy={60 + Math.floor(i / 15) * 220} r={10} fill="#6c7a62" />)}
      {/* window */}
      <rect x={1380} y={180} width={460} height={480} fill={sky} stroke="#3a2a1c" strokeWidth={16} />
      {night > 0.5 ? Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={1400 + rnd(i) * 420} cy={200 + rnd(i, 2) * 200} r={3} fill="#fff4c8" />) : null}
      <Rooftops y={640} s={0.45} x0={1380} x1={1840} seed={8} dark={night} />
      {Math.floor(season) % 4 === 1 && night < 0.5 && Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={1390 + rnd(i, 3) * 440} cy={190 + ((rnd(i, 4) * 460 + t * 60) % 460)} r={5} fill="#fff" />)}
      {Math.floor(season) % 4 === 3 && night < 0.5 && Array.from({ length: 10 }).map((_, i) => <ellipse key={i} cx={1390 + rnd(i, 5) * 440} cy={190 + ((rnd(i, 6) * 460 + t * 40) % 460)} rx={9} ry={5} fill="#c0602a" />)}
      <rect x={1604} y={180} width={12} height={480} fill="#3a2a1c" /><rect x={1380} y={410} width={460} height={12} fill="#3a2a1c" />
      {/* door */}
      <rect x={140} y={300} width={360} height={700} fill="#2a1d14" />
      <g transform={`translate(${140} 0) scale(${1 - door * 0.75} 1) translate(${-140} 0)`}>
        <rect x={140} y={300} width={360} height={700} fill="#6a4426" stroke={INK} strokeWidth={6} />
        {[0, 1].map((r) => <rect key={r} x={180} y={340 + r * 320} width={280} height={280} rx={8} fill="none" stroke="#4a2e18" strokeWidth={6} />)}
        <circle cx={460} cy={660} r={14} fill="#c9a24a" />
      </g>
      {/* floor, table, chair */}
      <rect x={-400} y={1000} width={W + 800} height={400} fill="#5a3a22" />
      {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={-400 + i * 180} y1={1000} x2={-600 + i * 230} y2={1400} stroke="#3e2816" strokeWidth={4} />)}
      {/* the hidden painting, under a cloth, against the wall */}
      <g opacity={hidden}>
        {glowK > 0 && <ellipse cx={1900} cy={830} rx={260} ry={240} fill="#ffe08a" opacity={0.35 * glowK} filter="url(#soft)" />}
        <path d="M 1760 1000 L 1790 640 Q 1900 600 2010 640 L 2050 1000 Z" fill="#cfc5ae" stroke={INK} strokeWidth={6} />
        <path d="M 1800 700 Q 1880 760 1830 1000 M 1950 660 Q 1990 800 1960 1000" fill="none" stroke="#a79c84" strokeWidth={6} />
      </g>
      <rect x={760} y={760} width={560} height={30} rx={6} fill="#7a4a26" stroke={INK} strokeWidth={5} />
      {[800, 1270].map((x) => <rect key={x} x={x} y={790} width={22} height={210} fill="#5e3618" />)}
      <rect x={1100} y={730} width={70} height={30} fill="#f3ead2" stroke={INK} strokeWidth={3} />
      <g>
        <rect x={880} y={700} width={16} height={60} fill="#e8dcc0" />
        <ellipse cx={888} cy={692} rx={8} ry={16} fill="#ffd25a" />
        <circle cx={888} cy={700} r={130} fill="#ffcf7a" opacity={0.2 + 0.05 * Math.sin(t * 9)} filter="url(#soft)" />
      </g>
    </g>
  );
};

export const Press: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#4a4036" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-400 + i * 260} y={-200} width={12} height={1200} fill="#3e352c" />)}
    <rect x={-400} y={960} width={W + 800} height={400} fill="#2e2822" />
    <rect x={500} y={360} width={1160} height={600} rx={20} fill="#2c3036" stroke={INK} strokeWidth={8} />
    {[640, 900, 1160, 1420].map((x, i) => (
      <g key={x} transform={`rotate(${t * 300 * (i % 2 ? -1 : 1)} ${x} 560)`}>
        <circle cx={x} cy={560} r={100} fill="#5a6068" stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3].map((k) => <line key={k} x1={x} y1={560} x2={x + Math.cos(k * 1.57) * 90} y2={560 + Math.sin(k * 1.57) * 90} stroke="#2a2e34" strokeWidth={10} />)}
      </g>
    ))}
    <rect x={540} y={720} width={1080} height={60} fill="#f2ecd9" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 7 }).map((_, i) => {
      const ph = (t * 1.4 + i / 7) % 1;
      return <rect key={i} x={1660 + ph * 600} y={720 - ph * 380 + Math.sin(ph * 6 + i) * 40} width={190} height={130} fill="#f2ecd9" stroke={INK} strokeWidth={4} transform={`rotate(${ph * 140 - 20} ${1755 + ph * 600} ${785 - ph * 380})`} />;
    })}
  </g>
);

/** Simple Europe for the map shots: France, Italy, Spain, Britain, the rest as one landmass. */
const EUROPE_LAND = "M 300 1240 L 300 760 L 420 700 L 560 690 L 640 600 L 720 520 L 820 470 L 1000 430 L 1200 380 L 1500 360 L 1900 330 L 2300 320 L 2300 1240 Z";
const FRANCE = "M 640 600 L 760 560 L 880 590 L 960 640 L 940 740 L 980 840 L 900 900 L 780 900 L 720 980 L 640 940 L 600 840 L 560 760 L 600 680 Z";
const ITALY = "M 960 740 L 1040 720 L 1100 780 L 1080 860 L 1140 940 L 1220 1010 L 1260 1080 L 1210 1110 L 1150 1060 L 1090 990 L 1030 910 L 980 840 Z";
const SPAIN = "M 300 900 L 560 880 L 640 940 L 620 1100 L 460 1160 L 300 1120 Z";
const UK = "M 520 300 L 600 260 L 640 360 L 620 460 L 560 520 L 500 470 L 520 400 Z";
export const EuropeMap: React.FC<{ t: number; route?: number; news?: number; from?: [number, number] }> = ({ t, route = 0, news = 0 }) => {
  const paris: [number, number] = [790, 650], florence: [number, number] = [1080, 860];
  const cities: [number, number][] = [[580, 380], [1300, 520], [1700, 420], [430, 1000], [1500, 700], [1900, 640], [1180, 1040]];
  const rp = (k: number): [number, number] => [paris[0] + (florence[0] - paris[0]) * k, paris[1] + (florence[1] - paris[1]) * k - Math.sin(k * Math.PI) * 120];
  return (
    <g>
      <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#9fbfd2" />
      {Array.from({ length: 14 }).map((_, i) => <line key={i} x1={-400} y1={i * 100} x2={2600} y2={i * 100} stroke="#b4cfdd" strokeWidth={3} />)}
      <path d={EUROPE_LAND} fill="#e6d8b4" stroke={INK} strokeWidth={6} />
      <path d={UK} fill="#e6d8b4" stroke={INK} strokeWidth={6} />
      <path d={SPAIN} fill="#dccb9e" stroke={INK} strokeWidth={5} />
      <path d={FRANCE} fill="#c9d6ec" stroke={INK} strokeWidth={6} />
      <path d={ITALY} fill="#cfe3c2" stroke={INK} strokeWidth={6} />
      <text x={700} y={780} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#2b4a8b" opacity={0.7}>FRANCE</text>
      <text x={1150} y={960} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#2f6a3a" opacity={0.7} transform="rotate(50 1150 960)">ITALY</text>
      <circle cx={paris[0]} cy={paris[1]} r={16} fill="#b02a2e" stroke={INK} strokeWidth={4} />
      <text x={paris[0] + 26} y={paris[1] - 14} fontFamily="Inter" fontWeight={900} fontSize={42} fill={INK}>PARIS</text>
      {route > 0 && (
        <>
          <polyline points={Array.from({ length: 41 }).map((_, i) => rp((i / 40) * route).join(",")).join(" ")} fill="none" stroke="#b02a2e" strokeWidth={10} strokeDasharray="26 18" />
          <circle cx={florence[0]} cy={florence[1]} r={16} fill={route > 0.98 ? "#b02a2e" : "#fff"} stroke={INK} strokeWidth={4} />
          <text x={florence[0] + 26} y={florence[1] + 50} fontFamily="Inter" fontWeight={900} fontSize={42} fill={INK}>FLORENCE</text>
          {route < 1 && (() => { const [tx, ty] = rp(route); return <g transform={`translate(${tx} ${ty})`}><rect x={-56} y={-40} width={112} height={54} rx={10} fill="#1d1e22" stroke={INK} strokeWidth={4} /><rect x={20} y={-70} width={22} height={30} fill="#1d1e22" /><circle cx={-30} cy={20} r={14} fill="#9e2a2a" stroke={INK} strokeWidth={3} /><circle cx={30} cy={20} r={14} fill="#9e2a2a" stroke={INK} strokeWidth={3} /><circle cx={38} cy={-90 - ((t * 60) % 40)} r={14 + ((t * 60) % 40) * 0.4} fill="#eee" opacity={0.6} /></g>; })()}
        </>
      )}
      {news > 0 && cities.map(([cx, cy], i) => {
        const k = Math.min(1, Math.max(0, news * 1.6 - i * 0.1));
        if (k <= 0) return null;
        const x = paris[0] + (cx - paris[0]) * k, y = paris[1] + (cy - paris[1]) * k - Math.sin(k * Math.PI) * 140;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${(1 - k) * 200 + i * 9})`}><rect x={-60} y={-44} width={120} height={88} fill="#f2ecd9" stroke={INK} strokeWidth={4} /><rect x={-48} y={-32} width={96} height={14} fill="#2a2a2a" />{[0, 1, 2].map((r) => <rect key={r} x={-48} y={-10 + r * 14} width={96} height={6} fill="#9a958a" />)}</g>;
      })}
    </g>
  );
};

/** The investigators' board: photos, pins, red string. k = how much of the string is drawn. */
export const SuspectBoard: React.FC<{ x: number; y: number; k: number; t: number }> = ({ x, y, k }) => {
  const cards: [number, number][] = [[140, 120], [520, 90], [880, 150], [220, 430], [760, 440], [500, 300]];
  const links: [number, number][] = [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [0, 3], [1, 2]];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={1100} height={640} rx={14} fill="#b98a5a" stroke="#5e3b20" strokeWidth={18} />
      {Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={30 + rnd(i) * 1040} cy={30 + rnd(i, 2) * 580} r={4} fill="#a0744a" />)}
      {links.map(([a, b], i) => {
        const p = Math.min(1, Math.max(0, k * links.length - i));
        if (p <= 0) return null;
        const [ax, ay] = cards[a], [bx, by] = cards[b];
        return <line key={i} x1={ax + 70} y1={ay + 20} x2={ax + 70 + (bx - ax) * p} y2={ay + 20 + (by - ay) * p} stroke="#c41e2a" strokeWidth={6} />;
      })}
      {cards.map(([cx, cy], i) => (
        <g key={i} transform={`rotate(${(rnd(i, 7) - 0.5) * 10} ${cx + 70} ${cy + 80})`}>
          <rect x={cx} y={cy} width={140} height={170} fill="#f7f2e2" stroke={INK} strokeWidth={4} />
          {i === 5 ? (
            <><rect x={cx + 26} y={cy + 18} width={88} height={120} fill="none" stroke="#c9a24a" strokeWidth={8} /><text x={cx + 70} y={cy + 80} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#c41e2a" textAnchor="middle" dominantBaseline="central">?</text></>
          ) : (
            <><rect x={cx + 14} y={cy + 14} width={112} height={110} fill="#8f8a80" /><circle cx={cx + 70} cy={cy + 62} r={30} fill="#141419" /><rect x={cx + 40} y={cy + 94} width={60} height={30} rx={14} fill="#141419" /><text x={cx + 70} y={cy + 148} fontFamily="Inter" fontWeight={900} fontSize={26} fill={INK} textAnchor="middle">?</text></>
          )}
          <circle cx={cx + 70} cy={cy + 8} r={11} fill="#c41e2a" stroke={INK} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

/** Florence: terracotta roofs, the cathedral dome, the tower of the Palazzo Vecchio, a narrow street. */
export const Florence: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Sky id="flSky" top="#8fbbe0" bot="#f3dcb4" />
    {[[400, 150, 1.2], [1600, 120, 1.0]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 10) % 200)} y={y} s={s} />)}
    {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={-300 + i * 180} y={600 + rnd(i) * 80} width={170} height={500} fill={["#e8c99a", "#e2b98a", "#efd6ac"][i % 3]} stroke={INK} strokeWidth={3} />)}
    {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M ${-310 + i * 180} ${600 + rnd(i) * 80} L ${-215 + i * 180} ${560 + rnd(i) * 80} L ${-120 + i * 180} ${600 + rnd(i) * 80} Z`} fill="#b5522e" stroke={INK} strokeWidth={3} />)}
    {/* the dome */}
    <rect x={820} y={430} width={520} height={250} fill="#efe5cf" stroke={INK} strokeWidth={6} />
    <path d="M 860 430 Q 870 150 1080 120 Q 1290 150 1300 430 Z" fill="#c0603a" stroke={INK} strokeWidth={6} />
    {[-160, -80, 0, 80, 160].map((d) => <path key={d} d={`M ${1080 + d * 1.35} 430 Q ${1080 + d * 0.8} 220 1080 124`} fill="none" stroke="#f4efe2" strokeWidth={8} />)}
    <rect x={1050} y={60} width={60} height={70} fill="#f4efe2" stroke={INK} strokeWidth={5} />
    <path d="M 1050 60 L 1080 20 L 1110 60 Z" fill="#c9a24a" stroke={INK} strokeWidth={4} />
    {/* the tower */}
    <rect x={1620} y={240} width={110} height={500} fill="#d9c3a0" stroke={INK} strokeWidth={6} />
    <rect x={1600} y={200} width={150} height={60} fill="#cdb48e" stroke={INK} strokeWidth={5} />
    <rect x={1645} y={110} width={60} height={90} fill="#d9c3a0" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={1604 + i * 24} y={180} width={14} height={22} fill="#cdb48e" stroke={INK} strokeWidth={2} />)}
    {/* street */}
    <rect x={-400} y={980} width={W + 800} height={500} fill="#b8a88a" />
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-400 + i * 100 + (i % 2) * 40} y={1010 + (i % 4) * 50} width={80} height={20} rx={6} fill="#a8987a" />)}
  </g>
);

export const Telephone: React.FC<{ x: number; y: number; s?: number; lift?: number }> = ({ x, y, s = 1, lift = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={60} ry={14} fill="#1d1e22" />
    <rect x={-10} y={-180} width={20} height={180} fill="#1d1e22" />
    <path d="M -34 -210 Q 0 -240 34 -210 L 24 -180 L -24 -180 Z" fill="#1d1e22" />
    <g transform={`translate(${-60 - lift * 40} ${-120 - lift * 120})`}>
      <rect x={-14} y={-50} width={28} height={100} rx={10} fill="#1d1e22" />
      <ellipse cx={0} cy={-56} rx={22} ry={14} fill="#1d1e22" />
    </g>
  </g>
);

/** VHS rewind: horizontal streaks and a ⏪ icon over the frame (k = 0..1 strength). */
export const Rewind: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0.001) return null;
  return (
    <g opacity={k}>
      <rect x={0} y={0} width={W} height={H} fill="#10131c" opacity={0.25} />
      {Array.from({ length: 18 }).map((_, i) => <rect key={i} x={0} y={((i * 97 + t * 900) % (H + 100)) - 50} width={W} height={4 + (i % 4) * 4} fill="#ffffff" opacity={0.25 + (i % 3) * 0.12} />)}
      <polygon points="150,80 110,110 150,140" fill="#fff" /><polygon points="200,80 160,110 200,140" fill="#fff" />
    </g>
  );
};

/** Colour mood + vignette for a shot. */
export const Mood: React.FC<{ col: string; a: number; vig?: number }> = ({ col, a, vig = 0.5 }) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={col} opacity={a} style={{ mixBlendMode: "multiply" }} />
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={vig} /></radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#vig)" />
  </g>
);

/** Handwritten lines that write themselves (no real words: scribbles). */
export const Scribble: React.FC<{ x: number; y: number; w: number; lines: number; k: number; col?: string; gap?: number }> = ({ x, y, w, lines, k, col = "#2a2a6a", gap = 70 }) => (
  <g>
    {Array.from({ length: lines }).map((_, i) => {
      const p = Math.min(1, Math.max(0, k * lines - i));
      if (p <= 0) return null;
      const n = 22, ww = w * (i === lines - 1 ? 0.6 : 1) * p;
      const pts = Array.from({ length: n + 1 }).map((_, j) => `${x + (ww * j) / n},${y + i * gap + Math.sin(j * 1.7 + i) * 10 + (j % 3 === 0 ? -8 : 0)}`).join(" ");
      return <polyline key={i} points={pts} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />;
    })}
  </g>
);

export const Spotlight: React.FC<{ x: number; y: number; r: number; col?: string; a?: number }> = ({ x, y, r, col = "#ffd98a", a = 0.5 }) => (
  <ellipse cx={x} cy={y} rx={r} ry={r * 1.1} fill={col} opacity={a} filter="url(#soft)" />
);

export const Crowd: React.FC<{ t: number; y: number; n: number; x0: number; x1: number; Person: React.FC<{ x: number; i: number }> }> = ({ y, n, x0, x1, Person }) => (
  <g>{Array.from({ length: n }).map((_, i) => <Person key={i} x={x0 + ((x1 - x0) * (i + 0.5)) / n + (rnd(i, 9) - 0.5) * 60} i={i} />)}</g>
);

export { ip, pop, tf, Easing };
