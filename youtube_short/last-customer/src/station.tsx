import React from "react";
import { INK, Stick } from "./Stick";
import { H, W } from "./kit";

// The gas station. One fixed layout used by every interior shot (and the CCTV view), so nothing moves between scenes
// unless the story moves it. World coords 2160 x 1240, floor line at FLOOR.
export const FLOOR = 1040;
export const DOOR_X = 300; // centre of the glass door (left wall)
export const SPOT_X = 640; // where the stranger always stops
export const KAI_X = 1790; // Kai behind the counter
export const COUNTER_X0 = 1420;
export const CLOCK = { x: 1790, y: 300 };
export const MONITOR = { x: 1520, y: FLOOR - 430 };
export const RADIO = { x: 2030, y: 610 };

const hash = (i: number, s = 1) => {
  const v = Math.sin(i * 127.1 * s + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const KAI = { outfit: "hoodie", color: "#2f6fe0", hair: "bald", shoes: "#fbfbf8" } as const;

/** Rain streaks inside a rectangle (outside the glass, or the whole exterior). */
export const Rain: React.FC<{ t: number; x: number; y: number; w: number; h: number; n?: number; op?: number; seed?: number }> = ({ t, x, y, w, h, n = 120, op = 0.5, seed = 1 }) => (
  <g opacity={op}>
    {Array.from({ length: n }).map((_, i) => {
      const xx = x + hash(i, seed) * w;
      const sp = 1500 + hash(i, seed + 2) * 700;
      const yy = y + ((hash(i, seed + 5) * h + t * sp) % h);
      const L = 30 + hash(i, seed + 7) * 40;
      return <line key={i} x1={xx} y1={yy} x2={xx - L * 0.15} y2={yy - L} stroke="#c9d8ec" strokeWidth={3} strokeLinecap="round" opacity={0.4 + 0.4 * hash(i, seed + 9)} />;
    })}
  </g>
);

/** The digital wall clock, red LED digits. */
export const LedClock: React.FC<{ x: number; y: number; text: string; s?: number; glow?: number }> = ({ x, y, text, s = 1, glow = 1 }) => {
  const w = (text.length * 36 + 80) * s;
  return (
    <g>
      <rect x={x - w / 2 - 10 * s} y={y - 62 * s} width={w + 20 * s} height={124 * s} rx={14 * s} fill="#111216" stroke="#3a3d46" strokeWidth={6 * s} />
      <rect x={x - w / 2} y={y - 50 * s} width={w} height={100 * s} rx={8 * s} fill="#1a0507" />
      <text x={x} y={y + 4 * s} fontFamily="Inter" fontWeight={900} fontSize={70 * s} fill="#ff3a3a" textAnchor="middle" dominantBaseline="central"
        style={{ fontVariantNumeric: "tabular-nums" }} filter={glow > 0.5 ? "url(#glow)" : undefined} opacity={0.35 + 0.65 * glow}>{text}</text>
    </g>
  );
};

export type StrangerProps = { x: number; yf?: number; u?: number; look?: number; eyes?: number; walk?: number | null; lean?: number; op?: number };
/** Tall, thin, unnaturally still. Dark charcoal raincoat with the hood up, small pale eyes. No breathing, no blinking. */
export const Stranger: React.FC<StrangerProps> = ({ x, yf = FLOOR + 20, u = 1.14, look = 0, eyes = 0, walk = null, lean = 0, op = 1 }) => {
  if (op <= 0.01) return null;
  const hy = yf - 508 * u; // head centre (matches Stick)
  const hr = 80 * u;
  const ex = look * 14 * u;
  const ry = (6 + eyes * 4) * u;
  return (
    <g opacity={op} transform={`rotate(${lean} ${x} ${yf})`}>
      <Stick t={0} x={x} yf={yf} u={u} outfit="coat" color="#33363d" hair="bald" shoes="#16161a" arms={["down", "down"]} walk={walk} seed={1} expr="neutral" />
      {/* hood: covers the head, a dark opening for the face */}
      <path d={`M ${x - hr * 1.18} ${hy + hr * 0.95} Q ${x - hr * 1.35} ${hy - hr * 1.25} ${x} ${hy - hr * 1.32} Q ${x + hr * 1.35} ${hy - hr * 1.25} ${x + hr * 1.18} ${hy + hr * 0.95} Z`}
        fill="#26282e" stroke={INK} strokeWidth={6 * u} />
      <ellipse cx={x + ex * 0.5} cy={hy + hr * 0.08} rx={hr * 0.82} ry={hr * 0.86} fill="#0b0b0e" />
      {[-1, 1].map((s) => <ellipse key={s} cx={x + ex + s * 24 * u} cy={hy + 4 * u} rx={9 * u + eyes * 2 * u} ry={ry} fill="#e6eaee" opacity={0.92} />)}
      <path d={`M ${x - hr * 0.95} ${hy - hr * 0.55} Q ${x} ${hy - hr * 1.05} ${x + hr * 0.95} ${hy - hr * 0.55}`} fill="none" stroke="#3b3e46" strokeWidth={5 * u} />
    </g>
  );
};

/** Wet footprints from the door to the stranger's spot (progress 0..1). */
export const Footprints: React.FC<{ k: number; op?: number }> = ({ k, op = 1 }) => (
  <g opacity={op}>
    {Array.from({ length: 7 }).map((_, i) => {
      const f = (i + 1) / 7;
      if (f > k) return null;
      const x = DOOR_X + 60 + (SPOT_X - DOOR_X - 60) * f;
      return <ellipse key={i} cx={x} cy={FLOOR + 40 + (i % 2 ? 22 : -6)} rx={26} ry={9} fill="#5d6f86" opacity={0.35 * (0.6 + 0.4 * f)} />;
    })}
  </g>
);

export type InteriorProps = {
  t: number;
  clock: string;
  lights?: number; // 0 = blackout, 1 = normal
  radio?: boolean;
  stand?: number; // 0 = in place, 1 = pushed aside by Kai
  locked?: boolean;
  cctv?: boolean;
  recordings?: number; // tiles on the security monitor
  children?: React.ReactNode; // people, drawn between the room and the counter front
  front?: React.ReactNode; // drawn in front of the counter (e.g. the stranger near the counter)
};

const Fridges: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={560} y={230} width={800} height={FLOOR - 230} fill="#20262f" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 4 }).map((_, i) => {
      const x = 580 + i * 196;
      return (
        <g key={i}>
          <rect x={x} y={250} width={180} height={FLOOR - 270} rx={6} fill="#0f2a33" stroke="#5d6b78" strokeWidth={6} />
          <rect x={x + 8} y={258} width={164} height={FLOOR - 286} fill="#9fe3ff" opacity={0.18 + 0.03 * Math.sin(t * 3 + i)} />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              <rect x={x + 10} y={330 + r * 130} width={160} height={8} fill="#7a8a99" />
              {Array.from({ length: 5 }).map((_, j) => (
                <rect key={j} x={x + 16 + j * 31} y={330 + r * 130 - 70 + (j % 2) * 8} width={22} height={70 - (j % 2) * 8} rx={6}
                  fill={["#e0463c", "#3fae6a", "#f2c84b", "#3f7fd6", "#ff7fb0", "#f08a24"][(i * 5 + j + r) % 6]} opacity={0.85} />
              ))}
            </g>
          ))}
          <rect x={x + 150} y={500} width={10} height={160} rx={5} fill="#c9d3e3" />
        </g>
      );
    })}
    <rect x={560} y={200} width={800} height={40} fill="#111" />
    <text x={960} y={228} fontFamily="Inter" fontWeight={900} fontSize={26} fill="#9fe3ff" textAnchor="middle" letterSpacing={6}>COLD DRINKS</text>
  </g>
);

const Gondola: React.FC<{ x: number; w: number; seed: number }> = ({ x, w, seed }) => (
  <g>
    <rect x={x} y={FLOOR - 300} width={w} height={300} fill="#c9ccd2" stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((r) => (
      <g key={r}>
        <rect x={x + 6} y={FLOOR - 290 + r * 96} width={w - 12} height={10} fill="#8f949c" />
        {Array.from({ length: Math.floor(w / 46) }).map((_, j) => (
          <rect key={j} x={x + 12 + j * 46} y={FLOOR - 352 + r * 96 + 72 - 54} width={38} height={54} rx={5}
            fill={["#e0463c", "#f2c84b", "#3f7fd6", "#3fae6a", "#ff7fb0", "#8e5bd0", "#f08a24"][(j * 3 + r + seed) % 7]} stroke={INK} strokeWidth={3} />
        ))}
      </g>
    ))}
  </g>
);

/** The chips display stand Kai moves in the "testing" scene. */
const Stand: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <rect x={x - 70} y={FLOOR - 380} width={140} height={380} rx={8} fill="#e0463c" stroke={INK} strokeWidth={6} />
    <text x={x} y={FLOOR - 340} fontFamily="Inter" fontWeight={900} fontSize={30} fill="#fff" textAnchor="middle">CHIPS</text>
    {[0, 1, 2, 3].map((r) => <rect key={r} x={x - 56} y={FLOOR - 310 + r * 72} width={112} height={56} rx={6} fill={["#f2c84b", "#3fae6a", "#3f7fd6", "#f08a24"][r]} stroke={INK} strokeWidth={3} />)}
  </g>
);

const Entrance: React.FC<{ t: number; locked: boolean }> = ({ t, locked }) => (
  <g>
    {/* the night outside the glass: pumps under the canopy, the road, the forest */}
    <rect x={0} y={180} width={540} height={FLOOR - 180} fill="#070b16" />
    <rect x={0} y={180} width={540} height={70} fill="#e9eef5" opacity={0.25} />
    {[120, 420].map((x) => (
      <g key={x}>
        <rect x={x - 40} y={FLOOR - 330} width={80} height={250} rx={10} fill="#c0392b" opacity={0.6} />
        <rect x={x - 28} y={FLOOR - 300} width={56} height={46} fill="#0b2233" opacity={0.7} />
      </g>
    ))}
    <rect x={0} y={FLOOR - 80} width={540} height={80} fill="#151a26" />
    <Rain t={t} x={0} y={180} w={540} h={FLOOR - 180} n={70} op={0.6} seed={3} />
    {/* glass + frames */}
    <rect x={0} y={180} width={540} height={FLOOR - 180} fill="#9fc4e8" opacity={0.08} />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M ${40 + i * 130 + Math.sin(t + i) * 6} ${260 + ((t * 40 + i * 90) % 500)} q 6 40 0 90`} fill="none" stroke="#dfeaf7" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
    ))}
    <rect x={0} y={170} width={560} height={20} fill="#9aa0aa" stroke={INK} strokeWidth={4} />
    <rect x={540} y={170} width={22} height={FLOOR - 170} fill="#9aa0aa" stroke={INK} strokeWidth={4} />
    <rect x={DOOR_X - 140} y={300} width={280} height={FLOOR - 300} fill="none" stroke="#b9bfc9" strokeWidth={16} />
    <rect x={DOOR_X + 90} y={620} width={14} height={120} rx={6} fill="#d9dee6" stroke={INK} strokeWidth={3} />
    <text x={DOOR_X} y={560} fontFamily="Inter" fontWeight={900} fontSize={28} fill="#e9eef5" textAnchor="middle" opacity={0.7}>PUSH</text>
    <rect x={DOOR_X - 110} y={330} width={220} height={60} rx={10} fill="#1a0508" stroke="#ff3a6a" strokeWidth={4} />
    <text x={DOOR_X} y={361} fontFamily="Inter" fontWeight={900} fontSize={36} fill={locked ? "#555" : "#ff4f7a"} textAnchor="middle" dominantBaseline="central"
      filter={locked ? undefined : "url(#glow)"}>{locked ? "CLOSED" : "OPEN 24H"}</text>
    {locked ? <rect x={DOOR_X + 70} y={660} width={50} height={40} rx={8} fill="#f2c84b" stroke={INK} strokeWidth={4} /> : null}
  </g>
);

const Counter: React.FC<{ t: number; recordings: number; radio: boolean; cctvPlaying: boolean }> = ({ t, recordings, radio, cctvPlaying }) => (
  <g>
    {/* front panel */}
    <rect x={COUNTER_X0} y={FLOOR - 330} width={2160 - COUNTER_X0 + 40} height={330} fill="#3d2c22" stroke={INK} strokeWidth={8} />
    <rect x={COUNTER_X0 - 20} y={FLOOR - 352} width={2160 - COUNTER_X0 + 80} height={30} rx={6} fill="#6b5444" stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((i) => <rect key={i} x={COUNTER_X0 + 40 + i * 230} y={FLOOR - 280} width={190} height={240} rx={8} fill="#4a372b" stroke="#2a1d16" strokeWidth={4} />)}
    {/* register */}
    <rect x={1870} y={FLOOR - 470} width={200} height={120} rx={10} fill="#2a2d36" stroke={INK} strokeWidth={6} />
    <rect x={1890} y={FLOOR - 455} width={160} height={50} rx={5} fill="#0d2238" />
    <text x={1970} y={FLOOR - 430} fontFamily="Inter" fontWeight={800} fontSize={24} fill="#7dff9a" textAnchor="middle" dominantBaseline="central">$ 0.00</text>
    {/* the security monitor (CRT) with recording tiles */}
    <rect x={MONITOR.x - 110} y={MONITOR.y - 80} width={220} height={170} rx={14} fill="#1b1d24" stroke={INK} strokeWidth={6} />
    <rect x={MONITOR.x - 92} y={MONITOR.y - 64} width={184} height={128} rx={6} fill="#0a1410" />
    {Array.from({ length: Math.min(12, recordings) }).map((_, i) => (
      <rect key={i} x={MONITOR.x - 88 + (i % 4) * 45} y={MONITOR.y - 60 + Math.floor(i / 4) * 41} width={40} height={36} fill="#6f8a7a" opacity={0.35 + 0.25 * Math.sin(t * 3 + i)} />
    ))}
    {cctvPlaying ? <rect x={MONITOR.x - 92} y={MONITOR.y - 64} width={184} height={128} fill="#9fd8b0" opacity={0.15 + 0.1 * Math.sin(t * 20)} /> : null}
    <rect x={MONITOR.x - 30} y={MONITOR.y + 90} width={60} height={20} fill="#1b1d24" />
    <circle cx={MONITOR.x + 90} cy={MONITOR.y + 76} r={6} fill="#ff3a3a" />
    {/* the radio on the back shelf */}
    <rect x={RADIO.x - 90} y={RADIO.y - 70} width={180} height={100} rx={14} fill="#7a4f33" stroke={INK} strokeWidth={5} />
    <circle cx={RADIO.x - 40} cy={RADIO.y - 20} r={30} fill="#3a2a1e" stroke={INK} strokeWidth={4} />
    <rect x={RADIO.x + 10} y={RADIO.y - 55} width={60} height={26} rx={4} fill={radio ? "#ffe9a0" : "#4a3a2a"} />
    <line x1={RADIO.x + 70} y1={RADIO.y - 70} x2={RADIO.x + 110} y2={RADIO.y - 150} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    {radio ? <circle cx={RADIO.x + 40} cy={RADIO.y - 42} r={34} fill="#ffe9a0" opacity={0.18} /> : null}
  </g>
);

const BackWall: React.FC<{ t: number }> = () => (
  <g>
    {/* cigarette rack + shelf behind the counter */}
    <rect x={1460} y={420} width={700} height={18} fill="#6b5444" stroke={INK} strokeWidth={4} />
    <rect x={1460} y={RADIO.y + 30} width={700} height={18} fill="#6b5444" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={1480 + i * 54} y={360} width={44} height={60} fill={["#e9eef5", "#d0182e", "#2f6fe0", "#f2c84b"][i % 4]} stroke={INK} strokeWidth={3} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <rect key={i} x={1480 + i * 62} y={RADIO.y - 40} width={50} height={70} rx={4} fill={["#8e5bd0", "#3fae6a", "#f08a24"][i % 3]} stroke={INK} strokeWidth={3} />
    ))}
  </g>
);

/** Ceiling: three fluorescent fixtures; their glow depends on `lights`. */
const Ceiling: React.FC<{ lights: number; t: number }> = ({ lights, t }) => (
  <g>
    <rect x={-400} y={-300} width={W + 800} height={470} fill="#1a1e26" />
    <rect x={-400} y={150} width={W + 800} height={24} fill="#2a2f3a" />
    {[420, 1080, 1760].map((x, i) => {
      const hum = 0.96 + 0.04 * Math.sin(t * 50 + i * 2);
      return (
        <g key={x}>
          <rect x={x - 190} y={60} width={380} height={44} rx={8} fill="#2a2f3a" stroke={INK} strokeWidth={4} />
          <rect x={x - 176} y={70} width={352} height={24} rx={6} fill={lights > 0.5 ? "#f2fff6" : "#3a4048"} opacity={0.4 + 0.6 * lights * hum} />
          <ellipse cx={x} cy={150} rx={360} ry={120} fill="#e8fff0" opacity={0.09 * lights} />
        </g>
      );
    })}
  </g>
);

/** The security camera dome in the ceiling corner (top right), pointed at the door. */
const SecCam: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={2040} y={150} width={30} height={40} fill="#444" />
    <path d="M 1980 190 h 130 l -20 60 h -90 Z" fill="#d9dee6" stroke={INK} strokeWidth={5} />
    <circle cx={2010} cy={225} r={14} fill="#111" />
    <circle cx={2080} cy={208} r={6} fill="#ff3a3a" opacity={Math.sin(t * 3) > 0 ? 1 : 0.2} />
  </g>
);

export const Interior: React.FC<InteriorProps> = ({ t, clock, lights = 1, radio = true, stand = 0, locked = false, cctv = false, recordings = 1, children, front }) => {
  const standX = 1385 + stand * -210;
  return (
    <g>
      <defs>
        <linearGradient id="st-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4452" />
          <stop offset="1" stopColor="#2a313c" />
        </linearGradient>
        <linearGradient id="st-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9bec6" />
          <stop offset="1" stopColor="#8d939c" />
        </linearGradient>
        <radialGradient id="st-vig" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <filter id="st-cctv" x={-400} y={-300} width={W + 800} height={H + 600} filterUnits="userSpaceOnUse">
          <feColorMatrix type="matrix" values="0.25 0.5 0.1 0 0  0.3 0.6 0.12 0 0.02  0.2 0.45 0.1 0 0  0 0 0 1 0" />
        </filter>
      </defs>
      <g filter={cctv ? "url(#st-cctv)" : undefined}>
        <rect x={-400} y={-300} width={W + 800} height={FLOOR + 300} fill="url(#st-wall)" />
        {/* floor tiles with a faint wet sheen */}
        <rect x={-400} y={FLOOR} width={W + 800} height={H - FLOOR + 300} fill="url(#st-floor)" />
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={i} x1={-400 + i * 120} y1={FLOOR} x2={-700 + i * 140} y2={H + 300} stroke="#7d838c" strokeWidth={3} />
        ))}
        {[FLOOR + 60, FLOOR + 140].map((y) => <line key={y} x1={-400} y1={y} x2={W + 400} y2={y} stroke="#7d838c" strokeWidth={3} />)}
        <rect x={-400} y={FLOOR} width={W + 800} height={16} fill="#1f242c" opacity={0.5} />
        <Ceiling lights={lights} t={t} />
        <SecCam t={t} />
        <Entrance t={t} locked={locked} />
        <Fridges t={t} />
        <BackWall t={t} />
        <LedClock x={CLOCK.x} y={CLOCK.y} text={clock} s={0.9} glow={lights} />
        <Gondola x={620} w={330} seed={1} />
        <Gondola x={990} w={330} seed={4} />
        {children}
        <Stand x={standX} />
        <Counter t={t} recordings={recordings} radio={radio} cctvPlaying={false} />
        {front}
        {/* light pools on the floor + room darkness */}
        {[420, 1080, 1760].map((x) => <ellipse key={x} cx={x} cy={FLOOR + 80} rx={420} ry={60} fill="#f2fff6" opacity={0.08 * lights} />)}
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="url(#st-vig)" />
      </g>
      <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#020306" opacity={(1 - lights) * 0.93} />
    </g>
  );
};

/** Exterior: the lonely station on a forest road at night (or in grey morning light). */
export const Exterior: React.FC<{ t: number; morning?: boolean; carX?: number | null; storeLight?: number; lights?: number }> = ({ t, morning = false, carX = null, storeLight = 1, lights = 1 }) => (
  <g>
    <defs>
      <linearGradient id="ex-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={morning ? "#6b7686" : "#05070f"} />
        <stop offset="1" stopColor={morning ? "#a9b2bd" : "#141b2e"} />
      </linearGradient>
    </defs>
    <rect x={-600} y={-400} width={W + 1200} height={FLOOR + 400} fill="url(#ex-sky)" />
    {/* forest silhouettes */}
    {Array.from({ length: 34 }).map((_, i) => {
      const x = -600 + i * 100 + hash(i, 3) * 40;
      const h = 260 + hash(i, 5) * 260;
      return <path key={i} d={`M ${x - 70} ${FLOOR - 120} L ${x} ${FLOOR - 120 - h} L ${x + 70} ${FLOOR - 120} Z`} fill={morning ? "#3d4a44" : "#0a1210"} />;
    })}
    <rect x={-600} y={FLOOR - 130} width={W + 1200} height={30} fill={morning ? "#2f3a36" : "#0a0f0e"} />
    {/* road */}
    <rect x={-600} y={FLOOR + 40} width={W + 1200} height={260} fill={morning ? "#4a4f57" : "#11141b"} />
    {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={-600 + i * 260} y={FLOOR + 160} width={140} height={12} fill="#d9cf9a" opacity={0.5} />)}
    {/* the store */}
    <rect x={1180} y={FLOOR - 470} width={900} height={500} fill={morning ? "#8a9098" : "#2a2f3a"} stroke={INK} strokeWidth={8} />
    <rect x={1220} y={FLOOR - 380} width={560} height={360} fill={morning ? "#c9d3dc" : "#d8f5e4"} opacity={morning ? 0.6 : 0.85 * storeLight * lights} />
    <rect x={1820} y={FLOOR - 400} width={220} height={380} fill={morning ? "#9fb3c4" : "#bfe8d4"} opacity={morning ? 0.6 : 0.75 * storeLight * lights} stroke={INK} strokeWidth={6} />
    {!morning ? <rect x={1100} y={FLOOR - 40} width={1080} height={120} fill="#bfe8d4" opacity={0.12 * storeLight * lights} /> : null}
    {/* canopy over the pumps */}
    <rect x={120} y={FLOOR - 640} width={900} height={70} fill={morning ? "#b9bfc9" : "#1d222c"} stroke={INK} strokeWidth={8} />
    <rect x={130} y={FLOOR - 570} width={880} height={14} fill={morning ? "#9aa0aa" : "#f2fff6"} opacity={morning ? 1 : 0.9 * lights} />
    {!morning ? <path d={`M 130 ${FLOOR - 556} L 1010 ${FLOOR - 556} L 1100 ${FLOOR + 40} L 40 ${FLOOR + 40} Z`} fill="#e8fff0" opacity={0.09 * lights} /> : null}
    {[300, 840].map((x) => <rect key={x} x={x - 20} y={FLOOR - 570} width={40} height={600} fill="#4a4f57" stroke={INK} strokeWidth={5} />)}
    {[460, 680].map((x) => (
      <g key={x}>
        <rect x={x - 45} y={FLOOR - 260} width={90} height={260} rx={10} fill="#c0392b" stroke={INK} strokeWidth={6} />
        <rect x={x - 32} y={FLOOR - 230} width={64} height={50} fill="#0b2233" />
      </g>
    ))}
    {/* sign */}
    <rect x={2100} y={FLOOR - 760} width={24} height={760} fill="#4a4f57" />
    <rect x={1960} y={FLOOR - 900} width={300} height={180} rx={14} fill={morning ? "#d9dee6" : "#101520"} stroke={INK} strokeWidth={6} />
    <text x={2110} y={FLOOR - 850} fontFamily="Inter" fontWeight={900} fontSize={40} fill={morning ? "#d0182e" : "#ff4f7a"} textAnchor="middle" filter={morning ? undefined : "url(#glow)"}>ROUTE 9</text>
    <text x={2110} y={FLOOR - 790} fontFamily="Inter" fontWeight={900} fontSize={34} fill={morning ? "#2a3350" : "#f2c84b"} textAnchor="middle">FUEL · 24H</text>
    {/* a passing car */}
    {carX !== null ? (
      <g>
        <rect x={carX - 160} y={FLOOR + 80} width={320} height={80} rx={26} fill="#1b1e26" />
        <ellipse cx={carX + 180} cy={FLOOR + 120} rx={260} ry={40} fill="#fff6c8" opacity={0.25} />
        <circle cx={carX + 150} cy={FLOOR + 110} r={12} fill="#fff6c8" />
      </g>
    ) : null}
    {!morning ? <Rain t={t} x={-600} y={-300} w={W + 1200} h={H + 600} n={260} op={0.55} seed={7} /> : <Rain t={t} x={-600} y={-300} w={W + 1200} h={H + 600} n={80} op={0.25} seed={9} />}
  </g>
);

/** CCTV overlay: scanlines, timestamp, REC. Drawn on top of an <Interior cctv />. */
export const CctvOverlay: React.FC<{ t: number; stamp: string; label?: string }> = ({ t, stamp, label = "CAM 01 · ENTRANCE" }) => (
  <g>
    {Array.from({ length: 62 }).map((_, i) => <rect key={i} x={-400} y={-300 + i * 30} width={W + 800} height={6} fill="#000" opacity={0.18} />)}
    <rect x={-400} y={((t * 300) % 1800) - 300} width={W + 800} height={60} fill="#fff" opacity={0.05} />
    <text x={120} y={110} fontFamily="Inter" fontWeight={800} fontSize={48} fill="#e9f2ea" opacity={0.85}>{label}</text>
    <text x={2040} y={110} fontFamily="Inter" fontWeight={800} fontSize={48} fill="#e9f2ea" textAnchor="end" opacity={0.85} style={{ fontVariantNumeric: "tabular-nums" }}>{stamp}</text>
    <circle cx={140} cy={1150} r={18} fill="#ff3a3a" opacity={Math.sin(t * 4) > 0 ? 1 : 0.2} />
    <text x={175} y={1165} fontFamily="Inter" fontWeight={800} fontSize={44} fill="#e9f2ea" opacity={0.85}>REC</text>
  </g>
);
