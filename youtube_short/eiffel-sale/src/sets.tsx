import React from "react";
import { Easing } from "remotion";
import { INK, shade } from "./Stick";
import { H, W, ip, pop, tf } from "./kit";

// Illustrated sets for "The Man Who Sold the Eiffel Tower". World = the story window, 2160 x 1240.
// Environments are more detailed than the characters: clean vector shapes, soft shadows, 1920s Paris.

const rnd = (i: number, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

export const Sky: React.FC<{ id: string; top: string; bot: string; h?: number }> = ({ id, top, bot, h = H }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
    </defs>
    <rect x={-2000} y={-2000} width={W + 4000} height={h + 2000} fill={`url(#${id})`} />
  </>
);

export const Cloud: React.FC<{ x: number; y: number; s?: number; o?: number; col?: string }> = ({ x, y, s = 1, o = 0.9, col = "#ffffff" }) => (
  <g opacity={o} transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={120} ry={46} fill={col} />
    <ellipse cx={-70} cy={8} rx={70} ry={34} fill={col} />
    <ellipse cx={80} cy={6} rx={84} ry={38} fill={col} />
    <ellipse cx={10} cy={-30} rx={70} ry={42} fill={col} />
  </g>
);

/** The Eiffel Tower. (x, yb) = centre of the base; h = height. Wrought-iron lattice, two platforms, the spire. */
export const Tower: React.FC<{ x: number; yb: number; h: number; col?: string; light?: string; glow?: number; sketch?: boolean; split?: number }> = ({
  x, yb, h, col = "#6a4c3b", light = "#93705a", glow = 0, sketch = false, split = 0,
}) => {
  const P = (fx: number, fy: number): [number, number] => [x + fx * h, yb - fy * h];
  // outline (left side, base -> top); mirrored for the right
  const L: [number, number][] = [[-0.31, 0], [-0.25, 0.08], [-0.2, 0.185], [-0.14, 0.215], [-0.115, 0.36], [-0.08, 0.425], [-0.06, 0.45], [-0.045, 0.62], [-0.03, 0.8], [-0.018, 0.92], [-0.012, 0.96]];
  const pts = [...L.map(([a, b]) => P(a, b)), P(0, 1.0), ...[...L].reverse().map(([a, b]) => P(-a, b))];
  const stroke = sketch ? "#e8f3ff" : INK;
  const fill = sketch ? "none" : col;
  const sw = Math.max(2, h * 0.006);
  // the four sections used by the "dismantle" sketch drift apart by `split`
  const parts = [
    { y0: 0, y1: 0.215, d: [-1, 1] },
    { y0: 0.215, y1: 0.45, d: [1, -0.5] },
    { y0: 0.45, y1: 0.8, d: [-0.7, -1] },
    { y0: 0.8, y1: 1.02, d: [0.8, -1.4] },
  ];
  const lattice = (y0: number, y1: number) => {
    const out: React.ReactNode[] = [];
    const steps = Math.max(3, Math.round((y1 - y0) * 26));
    for (let i = 0; i < steps; i++) {
      const a = y0 + ((y1 - y0) * i) / steps, b = y0 + ((y1 - y0) * (i + 1)) / steps;
      const wa = halfW(a), wb = halfW(b);
      out.push(<line key={`a${i}`} x1={x - wa * h} y1={yb - a * h} x2={x + wb * h} y2={yb - b * h} stroke={sketch ? "#bcd6f2" : light} strokeWidth={sw * 0.6} opacity={0.85} />);
      out.push(<line key={`b${i}`} x1={x + wa * h} y1={yb - a * h} x2={x - wb * h} y2={yb - b * h} stroke={sketch ? "#bcd6f2" : light} strokeWidth={sw * 0.6} opacity={0.85} />);
    }
    return out;
  };
  const clipId = `tw${Math.round(x)}_${Math.round(h)}_${sketch ? 1 : 0}`;
  const outline = `M ${pts.map((p) => p.join(" ")).join(" L ")} Z M ${x - 0.215 * h} ${yb} Q ${x} ${yb - 0.27 * h} ${x + 0.215 * h} ${yb} Z`;
  const body = (
    <g>
      <defs><clipPath id={clipId}><path d={outline} clipRule="evenodd" /></clipPath></defs>
      <path d={outline} fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth={sw * 1.4} strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>{lattice(0, 1)}</g>
      {/* platforms */}
      {[[0.185, 0.24], [0.425, 0.11], [0.8, 0.05]].map(([fy, fw], i) => (
        <rect key={i} x={x - fw * h} y={yb - fy * h - h * 0.018} width={fw * 2 * h} height={h * 0.03} fill={sketch ? "none" : shade(col, 0.75)} stroke={stroke} strokeWidth={sw} />
      ))}
      <line x1={x} y1={yb - h} x2={x} y2={yb - h * 1.05} stroke={stroke} strokeWidth={sw * 1.2} />
    </g>
  );
  if (split > 0) {
    return (
      <g>
        {parts.map((pt, i) => (
          <g key={i} transform={`translate(${pt.d[0] * split * h * 0.18} ${pt.d[1] * split * h * 0.08}) rotate(${pt.d[0] * split * 8} ${x} ${yb - ((pt.y0 + pt.y1) / 2) * h})`}>
            <defs><clipPath id={`${clipId}p${i}`}><rect x={x - h} y={yb - pt.y1 * h} width={h * 2} height={(pt.y1 - pt.y0) * h + 1} /></clipPath></defs>
            <g clipPath={`url(#${clipId}p${i})`}>{body}</g>
          </g>
        ))}
      </g>
    );
  }
  return (
    <g>
      {glow > 0 && <ellipse cx={x} cy={yb - h * 0.5} rx={h * 0.35} ry={h * 0.6} fill="#ffd98a" opacity={0.18 * glow} filter="url(#soft)" />}
      {body}
    </g>
  );
};
const halfW = (fy: number) => {
  const L: [number, number][] = [[0.31, 0], [0.25, 0.08], [0.2, 0.185], [0.14, 0.215], [0.115, 0.36], [0.08, 0.425], [0.06, 0.45], [0.045, 0.62], [0.03, 0.8], [0.018, 0.92], [0.012, 0.96], [0, 1]];
  for (let i = 0; i < L.length - 1; i++) if (fy <= L[i + 1][1]) { const k = (fy - L[i][1]) / (L[i + 1][1] - L[i][1]); return L[i][0] + (L[i + 1][0] - L[i][0]) * k; }
  return 0;
};

/** Rows of Paris roofs: zinc mansards, chimneys, cream stone. */
export const Rooftops: React.FC<{ y: number; seed?: number; s?: number; col?: string; roof?: string; x0?: number; x1?: number; dark?: number }> = ({
  y, seed = 1, s = 1, col = "#e9dcc1", roof = "#7d8796", x0 = -400, x1 = W + 400, dark = 0,
}) => {
  const out: React.ReactNode[] = [];
  let x = x0, i = 0;
  while (x < x1) {
    const w = (160 + rnd(i, seed) * 140) * s, h = (120 + rnd(i, seed + 1) * 110) * s;
    const c = shade(col, 1 - dark * 0.5 - rnd(i, seed + 2) * 0.08), r = shade(roof, 1 - dark * 0.5);
    out.push(
      <g key={i}>
        <rect x={x} y={y - h} width={w} height={h + 600} fill={c} stroke={INK} strokeWidth={3 * s} />
        <path d={`M ${x - 6 * s} ${y - h} L ${x + 16 * s} ${y - h - 46 * s} L ${x + w - 16 * s} ${y - h - 46 * s} L ${x + w + 6 * s} ${y - h} Z`} fill={r} stroke={INK} strokeWidth={3 * s} />
        {rnd(i, seed + 3) > 0.4 && <rect x={x + w * 0.7} y={y - h - 76 * s} width={18 * s} height={34 * s} fill={shade(col, 0.7)} stroke={INK} strokeWidth={2 * s} />}
        {Array.from({ length: Math.floor(w / (46 * s)) }).map((_, j) => (
          <React.Fragment key={j}>
            <rect x={x + 18 * s + j * 46 * s} y={y - h + 26 * s} width={18 * s} height={30 * s} fill={dark > 0.5 && rnd(i * 7 + j, seed) > 0.5 ? "#ffd27a" : "#5a6474"} />
            <rect x={x + 18 * s + j * 46 * s} y={y - h + 78 * s} width={18 * s} height={30 * s} fill={dark > 0.5 && rnd(i * 5 + j, seed) > 0.6 ? "#ffd27a" : "#5a6474"} />
          </React.Fragment>
        ))}
      </g>,
    );
    x += w + 4 * s;
    i++;
  }
  return <g>{out}</g>;
};

/** A Haussmann apartment front: cream stone, iron balconies, a mansard roof and a shop at street level. */
export const Facade: React.FC<{ x: number; w: number; yb: number; floors?: number; col?: string; seed?: number; shop?: string; awning?: string }> = ({
  x, w, yb, floors = 5, col = "#eadcbf", seed = 1, shop, awning = "#7d2f3a",
}) => {
  const fh = 150;
  const top = yb - floors * fh - 40;
  const cols = Math.max(2, Math.floor(w / 120));
  const cw = w / cols;
  return (
    <g>
      <rect x={x} y={top} width={w} height={yb - top} fill={col} stroke={INK} strokeWidth={4} />
      <path d={`M ${x - 10} ${top} L ${x + 30} ${top - 110} L ${x + w - 30} ${top - 110} L ${x + w + 10} ${top} Z`} fill="#6f7b8c" stroke={INK} strokeWidth={4} />
      {Array.from({ length: cols }).map((_, j) => <rect key={j} x={x + j * cw + cw * 0.32} y={top - 86} width={cw * 0.36} height={56} rx={22} fill="#e6dcc4" stroke={INK} strokeWidth={3} />)}
      {Array.from({ length: floors - 1 }).map((_, f) => {
        const fy = top + 60 + f * fh;
        return (
          <g key={f}>
            <rect x={x} y={fy + 112} width={w} height={8} fill={shade(col, 0.85)} />
            {Array.from({ length: cols }).map((_, j) => (
              <g key={j}>
                <rect x={x + j * cw + cw * 0.25} y={fy} width={cw * 0.5} height={96} rx={6} fill={rnd(f * 9 + j, seed) > 0.7 ? "#8fa2b8" : "#4b5566"} stroke={INK} strokeWidth={3} />
                <line x1={x + j * cw + cw * 0.5} y1={fy} x2={x + j * cw + cw * 0.5} y2={fy + 96} stroke={INK} strokeWidth={2} />
                {(f === 0 || f === 3) && <rect x={x + j * cw + cw * 0.18} y={fy + 78} width={cw * 0.64} height={20} fill="none" stroke={INK} strokeWidth={4} />}
              </g>
            ))}
          </g>
        );
      })}
      {/* ground floor shop */}
      <rect x={x + 16} y={yb - 190} width={w - 32} height={190} fill={shade(col, 0.72)} stroke={INK} strokeWidth={4} />
      {shop && (
        <>
          <path d={`M ${x + 6} ${yb - 196} L ${x + w - 6} ${yb - 196} L ${x + w - 30} ${yb - 140} L ${x + 30} ${yb - 140} Z`} fill={awning} stroke={INK} strokeWidth={4} />
          {Array.from({ length: Math.floor(w / 60) }).map((_, j) => <rect key={j} x={x + 30 + j * 60} y={yb - 196} width={30} height={56} fill="#f3e9cf" opacity={0.35} />)}
          <rect x={x + w * 0.2} y={yb - 250} width={w * 0.6} height={50} fill="#1d2430" stroke={INK} strokeWidth={3} />
          <text x={x + w / 2} y={yb - 224} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#e8c56a" textAnchor="middle" dominantBaseline="central" letterSpacing={3}>{shop}</text>
          <rect x={x + 40} y={yb - 130} width={w * 0.46} height={110} fill="#2e3846" stroke={INK} strokeWidth={3} />
          <rect x={x + w * 0.62} y={yb - 150} width={w * 0.24} height={150} fill="#4a3324" stroke={INK} strokeWidth={3} />
        </>
      )}
    </g>
  );
};

export const Lamp: React.FC<{ x: number; yb: number; h?: number; on?: number }> = ({ x, yb, h = 460, on = 0 }) => (
  <g>
    {on > 0 && <circle cx={x} cy={yb - h} r={90} fill="#ffd98a" opacity={0.35 * on} filter="url(#soft)" />}
    <rect x={x - 9} y={yb - h + 20} width={18} height={h - 20} fill="#22262d" />
    <rect x={x - 26} y={yb - 30} width={52} height={30} rx={6} fill="#22262d" />
    <path d={`M ${x - 30} ${yb - h + 30} L ${x + 30} ${yb - h + 30} L ${x + 22} ${yb - h - 40} L ${x - 22} ${yb - h - 40} Z`} fill={on > 0 ? "#ffe6a0" : "#cfd6dc"} stroke="#22262d" strokeWidth={6} />
    <path d={`M ${x - 32} ${yb - h - 40} L ${x} ${yb - h - 66} L ${x + 32} ${yb - h - 40} Z`} fill="#22262d" />
  </g>
);

/** A 1920s motor car (boxy body, spoked wheels, running board, round lamps). dir = 1 faces right. */
export const Car: React.FC<{ x: number; yb: number; s?: number; col?: string; dir?: 1 | -1; t?: number; spin?: number; door?: number }> = ({
  x, yb, s = 1, col = "#1f2a3a", dir = 1, t = 0, spin = 0, door = 0,
}) => {
  const wheel = (cx: number) => (
    <g transform={`rotate(${spin * 57} ${cx} ${yb - 52})`}>
      <circle cx={cx} cy={yb - 52} r={52} fill="#15161a" stroke={INK} strokeWidth={4} />
      <circle cx={cx} cy={yb - 52} r={34} fill="#d8cdb4" stroke={INK} strokeWidth={3} />
      {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={cx} y1={yb - 52} x2={cx + Math.cos(i * 0.785) * 32} y2={yb - 52 + Math.sin(i * 0.785) * 32} stroke="#5a4a3a" strokeWidth={4} />)}
      <circle cx={cx} cy={yb - 52} r={9} fill="#5a4a3a" />
    </g>
  );
  return (
    <g transform={`translate(${x} 0) scale(${dir * s} ${s}) translate(${-x} 0)`} style={{}}>
      <g transform={`translate(0 ${(1 - s) * yb / s})`}>
        <ellipse cx={x} cy={yb + 4} rx={300} ry={18} fill="#000" opacity={0.2} />
        <path d={`M ${x - 300} ${yb - 70} L ${x - 300} ${yb - 160} Q ${x - 300} ${yb - 180} ${x - 280} ${yb - 180} L ${x - 140} ${yb - 180} L ${x - 120} ${yb - 300} L ${x + 60} ${yb - 300} L ${x + 80} ${yb - 180} L ${x + 250} ${yb - 170} Q ${x + 300} ${yb - 160} ${x + 300} ${yb - 120} L ${x + 300} ${yb - 70} Z`} fill={col} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${x - 108} ${yb - 288} L ${x - 30} ${yb - 288} L ${x - 30} ${yb - 196} L ${x - 124} ${yb - 196} Z`} fill="#a9c1d6" stroke={INK} strokeWidth={4} />
        <path d={`M ${x - 18} ${yb - 288} L ${x + 50} ${yb - 288} L ${x + 64} ${yb - 196} L ${x - 18} ${yb - 196} Z`} fill="#a9c1d6" stroke={INK} strokeWidth={4} />
        {door > 0 && <path d={`M ${x - 124} ${yb - 196} L ${x - 30} ${yb - 196} L ${x - 30} ${yb - 80} L ${x - 124} ${yb - 80} Z`} fill={shade(col, 0.6)} transform={`translate(${-door * 60} 0) skewY(${-door * 8})`} stroke={INK} strokeWidth={4} />}
        <rect x={x + 160} y={yb - 210} width={150} height={40} rx={10} fill={shade(col, 1.3)} stroke={INK} strokeWidth={4} />
        <circle cx={x + 300} cy={yb - 150} r={22} fill="#ffe9a8" stroke={INK} strokeWidth={4} />
        <rect x={x - 250} y={yb - 70} width={500} height={14} rx={6} fill="#2b2b2b" />
        {wheel(x - 190)}
        {wheel(x + 190)}
        <path d={`M ${x - 270} ${yb - 100} Q ${x - 190} ${yb - 170} ${x - 110} ${yb - 100}`} fill="none" stroke={INK} strokeWidth={8} />
        <path d={`M ${x + 110} ${yb - 100} Q ${x + 190} ${yb - 170} ${x + 270} ${yb - 100}`} fill="none" stroke={INK} strokeWidth={8} />
        {t > 0 && <circle cx={x - 320} cy={yb - 80 - ((t * 60) % 40)} r={14 + ((t * 60) % 40) * 0.5} fill="#cfcfcf" opacity={0.4 - ((t * 60) % 40) / 120} />}
      </g>
    </g>
  );
};

export const Cobbles: React.FC<{ y: number; h?: number; col?: string }> = ({ y, h = 400, col = "#8a8378" }) => (
  <g>
    <rect x={-2000} y={y} width={W + 4000} height={h} fill={col} />
    {Array.from({ length: 6 }).map((_, r) => (
      <g key={r}>
        {Array.from({ length: 40 }).map((_, i) => <rect key={i} x={-600 + i * 110 + (r % 2) * 55} y={y + 20 + r * 34} width={92} height={22} rx={8} fill={shade(col, 0.9 + rnd(i, r) * 0.15)} />)}
      </g>
    ))}
  </g>
);

/** Parisians strolling (x moves with time). */
export const Strollers: React.FC<{ t: number; yb: number; u?: number; n?: number; seed?: number; Person: React.FC<{ x: number; i: number; walk: number; dir: 1 | -1 }>; span?: number }> = ({ t, yb, n = 5, seed = 1, Person, span = 3200 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const dir = (rnd(i, seed) > 0.5 ? 1 : -1) as 1 | -1;
      const sp = 90 + rnd(i, seed + 2) * 50;
      const x = ((rnd(i, seed + 1) * span + dir * t * sp) % span + span) % span - 500;
      return <Person key={i} x={x} i={i} walk={t * 5.5 + i} dir={dir} />;
    })}
  </g>
);

// ---------------------------------------------------------------- the luxury hotel
export const Lobby: React.FC<{ t: number; win?: boolean }> = ({ t, win = true }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c49a" />
    {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={-400 + i * 210} y={-200} width={10} height={1180} fill="#c4ab7c" />)}
    <rect x={-400} y={160} width={W + 800} height={16} fill="#b08f5a" />
    {/* tall window onto the city, with the tower */}
    {win && (
      <g>
        <rect x={1330} y={180} width={560} height={720} rx={8} fill="#a9c8e6" stroke="#5a4528" strokeWidth={14} />
        <Rooftops y={820} s={0.6} x0={1330} x1={1890} seed={4} />
        <Tower x={1700} yb={820} h={560} col="#6a4c3b" />
        <rect x={1606} y={180} width={10} height={720} fill="#5a4528" />
        <rect x={1330} y={520} width={560} height={10} fill="#5a4528" />
        <path d={`M 1300 170 Q 1350 520 1280 920 L 1250 920 L 1250 170 Z`} fill="#8e2330" stroke={INK} strokeWidth={4} />
        <path d={`M 1920 170 Q 1870 520 1940 920 L 1970 920 L 1970 170 Z`} fill="#8e2330" stroke={INK} strokeWidth={4} />
      </g>
    )}
    {/* chandelier */}
    <g transform={`rotate(${Math.sin(t * 0.6) * 0.6} 620 0)`}>
      <line x1={620} y1={-50} x2={620} y2={120} stroke="#8a6a2a" strokeWidth={6} />
      <ellipse cx={620} cy={150} rx={150} ry={36} fill="#e8c56a" stroke={INK} strokeWidth={5} />
      {[-120, -60, 0, 60, 120].map((d) => <circle key={d} cx={620 + d} cy={186} r={16} fill="#fff2c4" stroke={INK} strokeWidth={3} />)}
      <circle cx={620} cy={170} r={180} fill="#ffe7a0" opacity={0.25} filter="url(#soft)" />
    </g>
    {/* marble floor */}
    <rect x={-400} y={980} width={W + 800} height={400} fill="#efe6d4" />
    {Array.from({ length: 24 }).map((_, i) => <polygon key={i} points={`${-400 + i * 140},980 ${-300 + i * 140},980 ${-520 + i * 200},1400 ${-640 + i * 200},1400`} fill="#d5c8ae" opacity={i % 2 ? 0.7 : 0.25} />)}
    <rect x={-400} y={970} width={W + 800} height={14} fill="#a3895a" />
    {/* palm */}
    <g>
      <path d="M 180 980 L 150 860 L 250 860 L 220 980 Z" fill="#7a3f24" stroke={INK} strokeWidth={4} />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((a, i) => <path key={i} d={`M 200 860 Q ${200 + Math.sin(a) * 160} ${700 - Math.cos(a) * 60} ${200 + Math.sin(a) * 260} ${760 + Math.abs(a) * 60}`} fill="none" stroke="#3f7a3a" strokeWidth={26} strokeLinecap="round" />)}
    </g>
  </g>
);

export const Crillon: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Sky id="crSky" top="#7fb0de" bot="#dfeaf2" />
    {[[300, 160, 1.3], [1500, 120, 1.1], [2000, 220, 0.9]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 12) % 300)} y={y} s={s} o={0.9} />)}
    {/* the long neoclassical front with its colonnade */}
    <rect x={120} y={260} width={1920} height={700} fill="#ece2cc" stroke={INK} strokeWidth={6} />
    <rect x={120} y={230} width={1920} height={40} fill="#ddd0b2" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={130 + i * 74} y={200} width={40} height={34} fill="#ddd0b2" stroke={INK} strokeWidth={3} />)}
    <rect x={120} y={620} width={1920} height={30} fill="#d8caa8" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 12 }).map((_, i) => (
      <g key={i}>
        <rect x={380 + i * 120} y={300} width={44} height={320} fill="#f6efde" stroke={INK} strokeWidth={4} />
        <rect x={370 + i * 120} y={296} width={64} height={18} fill="#e2d6b8" stroke={INK} strokeWidth={3} />
        <rect x={370 + i * 120} y={604} width={64} height={18} fill="#e2d6b8" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    {Array.from({ length: 11 }).map((_, i) => <rect key={i} x={436 + i * 120} y={360} width={52} height={200} rx={26} fill="#4b5566" stroke={INK} strokeWidth={3} />)}
    {[180, 1860].map((x) => (
      <g key={x}>
        {[0, 1].map((r) => <rect key={r} x={x} y={330 + r * 140} width={120} height={100} fill="#4b5566" stroke={INK} strokeWidth={3} />)}
      </g>
    ))}
    {/* arcade at street level */}
    {Array.from({ length: 13 }).map((_, i) => <path key={i} d={`M ${170 + i * 140} 960 L ${170 + i * 140} 760 Q ${230 + i * 140} 690 ${290 + i * 140} 760 L ${290 + i * 140} 960 Z`} fill="#5a5040" stroke={INK} strokeWidth={4} />)}
    {/* flags */}
    {[700, 1460].map((x) => (
      <g key={x}>
        <line x1={x} y1={300} x2={x - 60} y2={200} stroke="#3a3a3a" strokeWidth={6} />
        {["#2b4a8b", "#f4f1ea", "#b02a2e"].map((c, i) => <rect key={i} x={x - 60 - 86 + i * 30 + Math.sin(t * 4 + i) * 2} y={150 + i * 0} width={30} height={60} fill={c} transform={`rotate(-12 ${x - 60} 200)`} />)}
      </g>
    ))}
    <rect x={-400} y={960} width={W + 800} height={400} fill="#b9b0a0" />
    <Cobbles y={1000} col="#9c9486" />
    <Lamp x={110} yb={1060} h={520} />
    <Lamp x={2060} yb={1060} h={520} />
  </g>
);

export const Meeting: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#6e4a2e" />
    {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={-200 + i * 300} y={120} width={240} height={560} rx={10} fill="#7d5636" stroke="#4a2f1c" strokeWidth={8} />)}
    <rect x={-400} y={680} width={W + 800} height={30} fill="#4a2f1c" />
    {/* gilded painting + drapes + window */}
    <rect x={180} y={170} width={380} height={260} fill="#c9a25a" stroke={INK} strokeWidth={6} />
    <rect x={210} y={200} width={320} height={200} fill="#5f7a8a" />
    <path d="M 210 400 L 300 290 L 380 360 L 450 300 L 530 400 Z" fill="#4a6a4a" />
    <rect x={1600} y={140} width={420} height={560} fill="#9cc0e0" stroke="#4a2f1c" strokeWidth={14} />
    <Tower x={1840} yb={690} h={430} col="#6a4c3b" />
    <rect x={1560} y={120} width={80} height={600} fill="#8e2330" stroke={INK} strokeWidth={4} />
    <rect x={1980} y={120} width={80} height={600} fill="#8e2330" stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${Math.sin(t * 0.5) * 0.5} 1080 0)`}>
      <line x1={1080} y1={-40} x2={1080} y2={70} stroke="#8a6a2a" strokeWidth={6} />
      <ellipse cx={1080} cy={96} rx={130} ry={30} fill="#e8c56a" stroke={INK} strokeWidth={5} />
      <circle cx={1080} cy={110} r={160} fill="#ffe7a0" opacity={0.22} filter="url(#soft)" />
    </g>
    <rect x={-400} y={710} width={W + 800} height={600} fill="#5a3a22" />
    <rect x={-400} y={710} width={W + 800} height={600} fill="#3d2616" opacity={0.25} />
  </g>
);
/** The polished table, drawn in front of seated people. */
export const MeetingTable: React.FC<{ y?: number; papers?: boolean }> = ({ y = 880, papers = true }) => (
  <g>
    <ellipse cx={1080} cy={y + 30} rx={980} ry={150} fill="#000" opacity={0.25} />
    <ellipse cx={1080} cy={y} rx={960} ry={140} fill="#7a3e1e" stroke={INK} strokeWidth={7} />
    <ellipse cx={1060} cy={y - 30} rx={700} ry={70} fill="#9a5630" opacity={0.6} />
    <rect x={120} y={y} width={1920} height={400} fill="#5e2e15" />
    {papers && [[620, -20], [1000, 10], [1420, -10]].map(([x, d], i) => <rect key={i} x={x} y={y - 60 + d} width={120} height={70} rx={4} fill="#fbf8ee" stroke={INK} strokeWidth={3} transform={`rotate(${(i - 1) * 8} ${x + 60} ${y - 25})`} />)}
  </g>
);

export const Office: React.FC<{ t: number; night?: number }> = ({ t, night = 0 }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#8a7a5e" />
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-400 + i * 100} y={-200} width={50} height={1100} fill="#7e6f55" />)}
    <rect x={1300} y={160} width={620} height={560} fill={night > 0.5 ? "#2a3550" : "#a9c6de"} stroke="#4a3a24" strokeWidth={14} />
    <Rooftops y={700} s={0.55} x0={1300} x1={1920} seed={7} dark={night} />
    <Tower x={1690} yb={700} h={380} col="#6a4c3b" />
    <rect x={1604} y={160} width={10} height={560} fill="#4a3a24" />
    {/* wall clock */}
    <circle cx={520} cy={260} r={90} fill="#f4efe2" stroke={INK} strokeWidth={8} />
    <line x1={520} y1={260} x2={520 + Math.sin(t * 0.4) * 60} y2={260 - Math.cos(t * 0.4) * 60} stroke={INK} strokeWidth={6} />
    <line x1={520} y1={260} x2={560} y2={260} stroke={INK} strokeWidth={8} />
    {/* filing cabinet */}
    <rect x={120} y={540} width={260} height={440} fill="#5d6b5a" stroke={INK} strokeWidth={5} />
    {[0, 1, 2].map((r) => <rect key={r} x={150} y={570 + r * 140} width={200} height={110} rx={6} fill="#6e7d6a" stroke={INK} strokeWidth={3} />)}
    <rect x={-400} y={980} width={W + 800} height={400} fill="#5a4630" />
  </g>
);
export const Desk: React.FC<{ y?: number; lamp?: boolean; t?: number }> = ({ y = 860, lamp = true }) => (
  <g>
    <rect x={460} y={y} width={1240} height={60} rx={8} fill="#7a4a26" stroke={INK} strokeWidth={6} />
    <rect x={500} y={y + 60} width={1160} height={340} fill="#5e3618" stroke={INK} strokeWidth={6} />
    {lamp && (
      <g>
        <rect x={1460} y={y - 14} width={90} height={14} fill="#2f4a3a" />
        <line x1={1505} y1={y - 14} x2={1505} y2={y - 150} stroke="#2f4a3a" strokeWidth={10} />
        <path d={`M 1440 ${y - 140} L 1570 ${y - 140} L 1545 ${y - 200} L 1465 ${y - 200} Z`} fill="#2f7a4a" stroke={INK} strokeWidth={5} />
        <ellipse cx={1505} cy={y - 60} rx={140} ry={70} fill="#ffe7a0" opacity={0.25} filter="url(#soft)" />
      </g>
    )}
  </g>
);

// ---------------------------------------------------------------- the station and the locomotive
export const Station: React.FC<{ t: number }> = () => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#c7cfd4" />
    {/* iron and glass roof */}
    {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M ${-300 + i * 620} 700 Q ${10 + i * 620} -40 ${320 + i * 620} 700`} fill="none" stroke="#4a4f57" strokeWidth={18} />)}
    {Array.from({ length: 30 }).map((_, i) => <line key={i} x1={-300 + i * 100} y1={60} x2={-300 + i * 100} y2={700} stroke="#7b838c" strokeWidth={4} opacity={0.5} />)}
    <rect x={-400} y={620} width={W + 800} height={30} fill="#4a4f57" />
    <rect x={-400} y={940} width={W + 800} height={40} fill="#d8d1c1" stroke={INK} strokeWidth={5} />
    <rect x={-400} y={980} width={W + 800} height={400} fill="#8d8579" />
    {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={-400 + i * 160} y={1080} width={100} height={18} fill="#5a4a3a" />)}
    <rect x={-400} y={1060} width={W + 800} height={10} fill="#6a6a6a" />
    <rect x={-400} y={1110} width={W + 800} height={10} fill="#6a6a6a" />
    {/* platform clock */}
    <line x1={1700} y1={650} x2={1700} y2={700} stroke="#2a2a2a" strokeWidth={8} />
    <circle cx={1700} cy={750} r={56} fill="#f4efe2" stroke={INK} strokeWidth={7} />
    <line x1={1700} y1={750} x2={1700} y2={712} stroke={INK} strokeWidth={5} /><line x1={1700} y1={750} x2={1728} y2={760} stroke={INK} strokeWidth={5} />
  </g>
);
export const Locomotive: React.FC<{ x: number; yb: number; t: number; s?: number; carriages?: number }> = ({ x, yb, t, s = 1, carriages = 2 }) => (
  <g transform={`translate(${x} ${yb}) scale(${s})`}>
    {Array.from({ length: carriages }).map((_, c) => (
      <g key={c} transform={`translate(${-760 * (c + 1)} 0)`}>
        <rect x={-340} y={-330} width={680} height={260} rx={14} fill="#5b2a2a" stroke={INK} strokeWidth={6} />
        <rect x={-350} y={-350} width={700} height={30} rx={10} fill="#3a1a1a" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={-300 + i * 104} y={-290} width={70} height={90} rx={6} fill="#e8d9a8" stroke={INK} strokeWidth={4} />)}
        {[-220, 220].map((wx) => <circle key={wx} cx={wx} cy={-50} r={46} fill="#2a2a2a" stroke={INK} strokeWidth={4} />)}
      </g>
    ))}
    <rect x={-360} y={-80} width={760} height={24} fill="#2a2a2a" />
    <rect x={-330} y={-420} width={260} height={340} rx={10} fill="#1d1e22" stroke={INK} strokeWidth={6} />
    <rect x={-300} y={-380} width={90} height={100} fill="#e8d9a8" stroke={INK} strokeWidth={4} />
    <rect x={-80} y={-300} width={440} height={220} rx={90} fill="#232428" stroke={INK} strokeWidth={6} />
    <rect x={260} y={-470} width={70} height={190} fill="#232428" stroke={INK} strokeWidth={6} />
    <rect x={244} y={-490} width={102} height={30} rx={8} fill="#232428" stroke={INK} strokeWidth={5} />
    <rect x={80} y={-350} width={70} height={60} rx={20} fill="#c9a24a" stroke={INK} strokeWidth={5} />
    <circle cx={360} cy={-190} r={40} fill="#ffe9a8" stroke={INK} strokeWidth={5} />
    {[-220, -40, 140, 300].map((wx, i) => (
      <g key={i} transform={`rotate(${t * 140} ${wx} -60)`}>
        <circle cx={wx} cy={-60} r={i === 0 ? 50 : 66} fill="#9e2a2a" stroke={INK} strokeWidth={5} />
        <line x1={wx - 50} y1={-60} x2={wx + 50} y2={-60} stroke={INK} strokeWidth={6} />
        <line x1={wx} y1={-110} x2={wx} y2={-10} stroke={INK} strokeWidth={6} />
      </g>
    ))}
    <line x1={-40 + Math.cos(t * 2.4) * 20} y1={-60 + Math.sin(t * 2.4) * 20} x2={300 + Math.cos(t * 2.4) * 20} y2={-60 + Math.sin(t * 2.4) * 20} stroke="#bcbcbc" strokeWidth={10} />
  </g>
);
export const Steam: React.FC<{ x: number; y: number; t: number; k?: number; n?: number }> = ({ x, y, t, k = 1, n = 8 }) => (
  <g opacity={k}>
    {Array.from({ length: n }).map((_, i) => {
      const ph = (t * 0.55 + i / n) % 1;
      return <circle key={i} cx={x - ph * 260 + Math.sin(i * 3) * 30} cy={y - ph * 380} r={40 + ph * 120} fill="#f4f4f4" opacity={0.75 * (1 - ph)} />;
    })}
  </g>
);

// ---------------------------------------------------------------- maps (stylised outlines on parchment)
const FRANCE = "M 1120 380 L 1220 350 L 1320 400 L 1410 380 L 1440 450 L 1410 540 L 1440 600 L 1400 680 L 1430 760 L 1360 800 L 1260 790 L 1200 840 L 1110 800 L 1080 700 L 1020 640 L 980 560 L 1040 520 L 1000 470 L 1080 450 Z";
const USA = "M 300 360 L 520 340 L 760 350 L 900 380 L 960 360 L 1000 420 L 1060 400 L 1080 470 L 1050 540 L 1000 600 L 960 700 L 880 720 L 800 690 L 720 720 L 640 780 L 560 720 L 460 700 L 380 640 L 320 560 L 290 460 Z";
export const MapCard: React.FC<{ t: number; which: "france" | "usa" | "both"; route?: number; pin?: [number, number] | null }> = ({ which, route = 0 }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#9fbfd2" />
    <rect x={140} y={140} width={1880} height={960} rx={20} fill="#efe3c4" stroke="#8a6a3a" strokeWidth={10} />
    {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={140} y1={240 + i * 100} x2={2020} y2={240 + i * 100} stroke="#d9c9a2" strokeWidth={3} />)}
    {Array.from({ length: 18 }).map((_, i) => <line key={i} x1={240 + i * 100} y1={140} x2={240 + i * 100} y2={1100} stroke="#d9c9a2" strokeWidth={3} />)}
    {(which === "usa" || which === "both") && <path d={USA} fill="#c9d8a8" stroke={INK} strokeWidth={6} />}
    {(which === "france" || which === "both") && <path d={which === "both" ? FRANCE.replace(/(\d+) (\d+)/g, (_, a, b) => `${Number(a) + 560} ${b}`) : FRANCE} fill="#e8c9a0" stroke={INK} strokeWidth={6} />}
    {which === "both" && route > 0 && (
      <path d="M 1620 540 Q 1300 300 900 520" fill="none" stroke="#b02a2e" strokeWidth={12} strokeDasharray="30 22" pathLength={1} strokeDashoffset={0} opacity={1}
        style={{ strokeDasharray: `${route} 1` }} />
    )}
    {which === "both" && <><circle cx={1620} cy={540} r={16} fill="#b02a2e" stroke={INK} strokeWidth={4} /><text x={1660} y={520} fontFamily="Inter" fontWeight={900} fontSize={46} fill={INK}>PARIS</text></>}
    {which === "both" && route > 0.95 && <circle cx={900} cy={520} r={16} fill="#b02a2e" stroke={INK} strokeWidth={4} />}
    {which === "both" && <text x={560} y={860} fontFamily="Inter" fontWeight={900} fontSize={60} fill={INK} textAnchor="middle" opacity={0.75}>UNITED STATES</text>}
    {which === "france" && <><circle cx={1220} cy={470} r={16} fill="#b02a2e" stroke={INK} strokeWidth={4} /><text x={1260} y={450} fontFamily="Inter" fontWeight={900} fontSize={46} fill={INK}>PARIS</text></>}
  </g>
);

// ---------------------------------------------------------------- America, 1930s
export const CityUS: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Sky id="usSky" top="#9fb6cc" bot="#e8dcc6" />
    {[[200, 900, 320, 560], [520, 900, 260, 720], [800, 900, 300, 840], [1120, 900, 360, 1000], [1500, 900, 280, 760], [1800, 900, 330, 620]].map(([x, yb, w, h], i) => (
      <g key={i}>
        <rect x={x} y={yb - h} width={w} height={h + 400} fill={shade("#a39a8a", 0.85 + (i % 3) * 0.08)} stroke={INK} strokeWidth={5} />
        <rect x={x + w * 0.15} y={yb - h - 80} width={w * 0.7} height={80} fill={shade("#a39a8a", 0.8)} stroke={INK} strokeWidth={4} />
        <rect x={x + w * 0.32} y={yb - h - 150} width={w * 0.36} height={70} fill={shade("#a39a8a", 0.75)} stroke={INK} strokeWidth={4} />
        {i === 3 && <line x1={x + w / 2} y1={yb - h - 150} x2={x + w / 2} y2={yb - h - 300} stroke={INK} strokeWidth={10} />}
        {Array.from({ length: Math.floor(h / 70) }).map((_, r) => Array.from({ length: Math.floor(w / 60) }).map((_, c) => (
          <rect key={`${r}-${c}`} x={x + 20 + c * 60} y={yb - h + 30 + r * 70} width={26} height={38} fill={rnd(r * 13 + c, i) > 0.8 ? "#f2e2a8" : "#59606c"} />
        )))}
      </g>
    ))}
    <rect x={-400} y={900} width={W + 800} height={500} fill="#6f6a62" />
    <rect x={-400} y={900} width={W + 800} height={70} fill="#b7ae9c" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-200 + i * 220 - ((t * 60) % 220)} y={1120} width={110} height={14} fill="#e8e1cd" />)}
  </g>
);

export const Court: React.FC<{ t: number }> = () => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#7a5a3a" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-200 + i * 220} y={100} width={180} height={720} rx={8} fill="#86643f" stroke="#54391f" strokeWidth={6} />)}
    {/* US flag on a pole */}
    <g>
      <line x1={1720} y1={180} x2={1720} y2={900} stroke="#c9a24a" strokeWidth={12} />
      {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={1730} y={200 + i * 34} width={300} height={34} fill={i % 2 ? "#f4f1ea" : "#b02a2e"} />)}
      <rect x={1730} y={200} width={130} height={136} fill="#2b4a8b" />
    </g>
    <rect x={-400} y={980} width={W + 800} height={400} fill="#4e3620" />
  </g>
);
/** The judge's bench (drawn in front of the judge). */
export const Bench: React.FC = () => (
  <g>
    <rect x={640} y={640} width={880} height={360} fill="#5e3a1c" stroke={INK} strokeWidth={7} />
    <rect x={620} y={620} width={920} height={40} fill="#7a4e26" stroke={INK} strokeWidth={6} />
    <circle cx={1080} cy={780} r={70} fill="#c9a24a" stroke={INK} strokeWidth={6} />
    <circle cx={1080} cy={780} r={44} fill="#e4c46a" />
  </g>
);

export const Alcatraz: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Sky id="alSky" top="#6f8097" bot="#cdd3d6" />
    {[[400, 200, 1.6], [1400, 160, 1.4], [1900, 260, 1.1]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 8) % 200)} y={y} s={s} o={0.6} col="#e9edf0" />)}
    <rect x={-400} y={760} width={W + 800} height={700} fill="#3f5a6e" />
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={((i * 233 + t * 30) % 2600) - 300} y={800 + (i % 8) * 50} width={90} height={6} rx={3} fill="#8aa2b2" opacity={0.6} />)}
    <path d="M 420 780 Q 600 560 900 560 L 1300 560 Q 1600 580 1760 780 Z" fill="#5d5a52" stroke={INK} strokeWidth={6} />
    <rect x={720} y={420} width={620} height={160} fill="#d9d2c2" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={740 + i * 50} y={460} width={22} height={70} fill="#4a4f57" />)}
    <rect x={1380} y={300} width={50} height={280} fill="#e6e0d2" stroke={INK} strokeWidth={5} />
    <rect x={1366} y={280} width={78} height={30} fill="#4a4f57" />
    <circle cx={1405} cy={270} r={60} fill="#fff2b0" opacity={0.3 + 0.2 * Math.sin(t * 2)} filter="url(#soft)" />
    {[0, 1, 2].map((i) => { const gx = ((t * 90 + i * 700) % 2600) - 200; const gy = 300 + i * 60 + Math.sin(t * 3 + i) * 20; return <path key={i} d={`M ${gx - 30} ${gy} Q ${gx - 15} ${gy - 16} ${gx} ${gy} Q ${gx + 15} ${gy - 16} ${gx + 30} ${gy}`} fill="none" stroke="#2a2a2a" strokeWidth={5} />; })}
  </g>
);

// ---------------------------------------------------------------- props + overlays
export const Paper: React.FC<{ x: number; y: number; w: number; h: number; head?: string; sub?: string; r?: number; img?: boolean }> = ({ x, y, w, h, head, sub, r = 0, img = true }) => (
  <g transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x + 10} y={y + 14} width={w} height={h} fill="#000" opacity={0.2} />
    <rect x={x} y={y} width={w} height={h} fill="#f2ecd9" stroke={INK} strokeWidth={6} />
    {head && <text x={x + w / 2} y={y + h * 0.14} fontFamily="Inter" fontWeight={900} fontSize={w * 0.075} fill="#1a1a1a" textAnchor="middle" dominantBaseline="central">{head}</text>}
    {sub && <text x={x + w / 2} y={y + h * 0.25} fontFamily="Inter" fontWeight={800} fontSize={w * 0.045} fill="#3a3a3a" textAnchor="middle" dominantBaseline="central">{sub}</text>}
    <line x1={x + 20} y1={y + h * 0.32} x2={x + w - 20} y2={y + h * 0.32} stroke="#1a1a1a" strokeWidth={4} />
    {img && <><rect x={x + 24} y={y + h * 0.36} width={w * 0.42} height={h * 0.4} fill="#cfc6b0" stroke={INK} strokeWidth={3} /><Tower x={x + 24 + w * 0.21} yb={y + h * 0.75} h={h * 0.36} col="#5a5040" /></>}
    {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={img ? x + w * 0.5 : x + 24} y={y + h * 0.37 + i * h * 0.06} width={img ? w * 0.45 : w - 48} height={h * 0.025} fill="#9a958a" />)}
  </g>
);

/** Big red ink stamp that slams in at t0. */
export const Stamp: React.FC<{ x: number; y: number; text: string; t: number; t0: number; size?: number; rot?: number; t1?: number; col?: string }> = ({
  x, y, text, t, t0, size = 150, rot = -8, t1 = 1e9, col = "#c41e2a",
}) => {
  if (t < t0 || t > t1 + 0.3) return null;
  const a = t - t0;
  const sc = ip(a, 0, 0.16, 2.0, 1, Easing.in(Easing.quad));
  const op = Math.min(1, a / 0.06) * (1 - ip(t, t1, t1 + 0.3));
  const w = text.length * size * 0.66 + size * 0.8;
  const h = size * 1.45;
  return (
    <g opacity={op} transform={`${tf(x, y, sc, rot)}`}>
      {a < 0.5 && <circle cx={x} cy={y} r={w * 0.45 + a * 600} fill="none" stroke={col} strokeWidth={10 * (1 - a / 0.5)} opacity={0.6} />}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill="rgba(255,255,255,0.08)" stroke={col} strokeWidth={size * 0.1} />
      <rect x={x - w / 2 + size * 0.16} y={y - h / 2 + size * 0.16} width={w - size * 0.32} height={h - size * 0.32} rx={10} fill="none" stroke={col} strokeWidth={size * 0.035} />
      <text x={x} y={y + size * 0.04} fontFamily="Inter" fontWeight={900} fontSize={size} fill={col} textAnchor="middle" dominantBaseline="central" letterSpacing={size * 0.06}>{text}</text>
    </g>
  );
};

export const Label: React.FC<{ x: number; y: number; text: string; t: number; t0: number; t1?: number; size?: number; bg?: string; fg?: string }> = ({
  x, y, text, t, t0, t1 = 1e9, size = 64, bg = "#141419", fg = "#ffffff",
}) => {
  if (t < t0 || t > t1 + 0.25) return null;
  const w = text.length * size * 0.64 + size * 1.2;
  const h = size * 1.55;
  const op = Math.min(1, (t - t0) / 0.12) * (1 - ip(t, t1, t1 + 0.25));
  return (
    <g opacity={op} transform={tf(x, y, pop(t, t0, 0.3))}>
      <rect x={x - w / 2 + 6} y={y - h / 2 + 10} width={w} height={h} rx={h / 2} fill="#000" opacity={0.25} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke="#fff" strokeWidth={5} />
      <text x={x} y={y + 2} fontFamily="Inter" fontWeight={900} fontSize={size} fill={fg} textAnchor="middle" dominantBaseline="central" letterSpacing={2}>{text}</text>
    </g>
  );
};

/** A thought cloud with children drawn inside (centre cx, cy). */
export const Thought: React.FC<{ x: number; y: number; w: number; h: number; t: number; t0: number; t1?: number; tail: [number, number]; children: React.ReactNode; dashed?: boolean; tint?: string }> = ({
  x, y, w, h, t, t0, t1 = 1e9, tail, children, dashed = false, tint = "#fffffb",
}) => {
  if (t < t0 || t > t1 + 0.3) return null;
  const sc = pop(t, t0, 0.4);
  const op = Math.min(1, (t - t0) / 0.15) * (1 - ip(t, t1, t1 + 0.3));
  const clip = `th${Math.round(x)}${Math.round(y)}`;
  return (
    <g opacity={op} transform={tf(x, y, sc)}>
      <circle cx={tail[0]} cy={tail[1]} r={16} fill={tint} stroke={INK} strokeWidth={5} />
      <circle cx={(tail[0] * 2 + x) / 3} cy={(tail[1] * 2 + y + h / 2) / 3} r={26} fill={tint} stroke={INK} strokeWidth={5} />
      <rect x={x - w / 2 + 10} y={y - h / 2 + 14} width={w} height={h} rx={80} fill="#000" opacity={0.18} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={80} fill={tint} stroke={INK} strokeWidth={6} strokeDasharray={dashed ? "28 18" : undefined} />
      <defs><clipPath id={clip}><rect x={x - w / 2 + 6} y={y - h / 2 + 6} width={w - 12} height={h - 12} rx={74} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>{children}</g>
    </g>
  );
};

export const Envelope: React.FC<{ x: number; y: number; s?: number; r?: number }> = ({ x, y, s = 1, r = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-120} y={-76} width={240} height={152} rx={8} fill="#f3e9cf" stroke={INK} strokeWidth={7} />
    <polyline points="-120,-76 0,10 120,-76" fill="none" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={10} r={18} fill="#9e1b2d" stroke={INK} strokeWidth={4} />
  </g>
);

export const Calendar: React.FC<{ x: number; y: number; t: number; t0: number; flips?: number; final?: string; s?: number }> = ({ x, y, t, t0, flips = 6, final, s = 1 }) => {
  const a = Math.max(0, t - t0);
  const k = Math.min(flips, Math.floor(a / 0.22));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-200} y={-240} width={400} height={480} rx={20} fill="#fbf8ee" stroke={INK} strokeWidth={8} />
      <rect x={-200} y={-240} width={400} height={110} rx={20} fill="#b02a2e" stroke={INK} strokeWidth={8} />
      {[-110, 110].map((r) => <rect key={r} x={r - 12} y={-270} width={24} height={60} rx={10} fill="#5a5a5a" />)}
      {final && k >= flips ? (
        <text x={0} y={50} fontFamily="Inter" fontWeight={900} fontSize={140} fill={INK} textAnchor="middle" dominantBaseline="central">{final}</text>
      ) : (
        Array.from({ length: 4 }).map((_, r) => Array.from({ length: 5 }).map((_, c) => <rect key={`${r}${c}`} x={-160 + c * 66} y={-90 + r * 70} width={44} height={44} rx={6} fill={(r * 5 + c + k) % 7 === 0 ? "#e0b0b0" : "#e6e0d0"} />))
      )}
      {a > 0 && k < flips && (
        <g transform={`translate(0 ${-130}) scale(1 ${1 - ((a / 0.22) % 1)})`}>
          <rect x={-200} y={0} width={400} height={360} fill="#f4f0e2" stroke={INK} strokeWidth={6} opacity={0.95} />
        </g>
      )}
    </g>
  );
};

export const Liner: React.FC<{ x: number; yb: number; s?: number; t: number }> = ({ x, yb, s = 1, t }) => (
  <g transform={`translate(${x} ${yb}) scale(${s})`}>
    <path d="M -520 -40 L 560 -40 L 480 90 L -460 90 Z" fill="#1d1e22" stroke={INK} strokeWidth={7} />
    <rect x={-460} y={-40} width={1000} height={26} fill="#b02a2e" />
    <rect x={-380} y={-180} width={820} height={140} fill="#f4f0e6" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 16 }).map((_, i) => <circle key={i} cx={-340 + i * 50} cy={-110} r={12} fill="#4a5566" />)}
    {[-200, 40, 280].map((fx, i) => (
      <g key={i}>
        <rect x={fx - 50} y={-380} width={100} height={200} fill="#c9a24a" stroke={INK} strokeWidth={6} />
        <rect x={fx - 50} y={-380} width={100} height={40} fill="#1d1e22" />
        <circle cx={fx - 20 - ((t * 40 + i * 20) % 60)} cy={-420 - ((t * 40 + i * 20) % 60) * 1.5} r={30 + ((t * 40 + i * 20) % 60) * 0.6} fill="#d8d8d8" opacity={0.5} />
      </g>
    ))}
  </g>
);
