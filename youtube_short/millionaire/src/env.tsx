import React from "react";
import { INK, QuiffHair, shade } from "./Stick";

// Reusable flat-vector environments (world coords 2160 x 1240, floor at FLOOR).
export const FLOOR = 1040;
export const W = 2160;
export const H = 1240;
const st = (w = 6) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: "round" as const });

export const Grad: React.FC<{ id: string; top: string; bot: string; x1?: number; y1?: number; x2?: number; y2?: number }> = ({
  id, top, bot, x1 = 0, y1 = 0, x2 = 0, y2 = 1,
}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    <stop offset="0" stopColor={top} />
    <stop offset="1" stopColor={bot} />
  </linearGradient>
);

/** Interior: wall with gradient, wainscot, baseboard, floor with soft light pool. */
export const Room: React.FC<{ id: string; wall: string; wall2?: string; floor: string; wains?: string; light?: number; lightX?: number }> = ({
  id, wall, wall2, floor, wains, light = 0.18, lightX = 1080,
}) => (
  <g>
    <defs>
      <Grad id={`${id}-w`} top={wall} bot={wall2 ?? shade(wall, 0.88)} />
      <radialGradient id={`${id}-l`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6d8" stopOpacity={light} />
        <stop offset="1" stopColor="#fff6d8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-400} y={-300} width={W + 800} height={FLOOR + 300} fill={`url(#${id}-w)`} />
    {wains ? <rect x={-400} y={FLOOR - 300} width={W + 800} height={300} fill={wains} /> : null}
    {wains ? <rect x={-400} y={FLOOR - 312} width={W + 800} height={16} fill={shade(wains, 0.85)} /> : null}
    <rect x={-400} y={FLOOR - 26} width={W + 800} height={26} fill={shade(floor, 0.7)} />
    <rect x={-400} y={FLOOR} width={W + 800} height={H - FLOOR + 300} fill={floor} />
    {[...Array(14)].map((_, i) => (
      <line key={i} x1={-400 + i * 230} y1={FLOOR} x2={-560 + i * 230} y2={H + 300} stroke={shade(floor, 0.9)} strokeWidth={4} />
    ))}
    <ellipse cx={lightX} cy={FLOOR + 60} rx={900} ry={120} fill={`url(#${id}-l)`} />
  </g>
);

export const Window: React.FC<{ id: string; x: number; y: number; w: number; h: number; sky: [string, string]; t: number; kind?: "city" | "trees" | "night" | "street"; frame?: string; curtain?: string }> = ({
  id, x, y, w, h, sky, t, kind = "city", frame = "#f7f1e6", curtain,
}) => (
  <g>
    <defs>
      <Grad id={`${id}-sky`} top={sky[0]} bot={sky[1]} />
      <clipPath id={`${id}-clip`}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
    </defs>
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
    <g clipPath={`url(#${id}-clip)`}>
      {kind === "trees" ? (
        <>
          <circle cx={x + w * 0.8 + Math.sin(t * 0.3) * 4} cy={y + h * 0.2} r={50} fill="#fff4c2" opacity={0.9} />
          {[0.1, 0.35, 0.6, 0.85].map((k, i) => (
            <g key={i}>
              <rect x={x + w * k - 10} y={y + h * 0.62} width={20} height={h * 0.4} fill="#6b4b33" />
              <circle cx={x + w * k + Math.sin(t * 1.2 + i) * 4} cy={y + h * 0.58} r={w * 0.13} fill={i % 2 ? "#5aa865" : "#4c9a5a"} />
            </g>
          ))}
        </>
      ) : null}
      {kind === "city" || kind === "night" || kind === "street"
        ? [...Array(9)].map((_, i) => {
          const bw = w / 6;
          const bh = h * (0.35 + ((i * 37) % 50) / 100);
          const bx = x + i * bw * 0.78 - 20 + ((t * 3) % 1) * 0;
          return (
            <g key={i}>
              <rect x={bx} y={y + h - bh} width={bw * 0.72} height={bh} fill={kind === "night" ? "#232846" : shade(sky[1], 0.82 - (i % 3) * 0.05)} />
              {[...Array(6)].map((__, j) => (
                <rect key={j} x={bx + 14 + (j % 2) * bw * 0.32} y={y + h - bh + 18 + Math.floor(j / 2) * 46} width={bw * 0.16} height={22}
                  fill={kind === "night" ? ((i + j) % 3 ? "#ffd77a" : "#39406a") : "rgba(255,255,255,0.45)"} />
              ))}
            </g>
          );
        })
        : null}
    </g>
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={frame} strokeWidth={22} />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={frame} strokeWidth={14} />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={frame} strokeWidth={14} />
    <rect x={x - 30} y={y + h} width={w + 60} height={24} rx={6} fill={shade(frame, 0.9)} {...st(4)} />
    {curtain ? (
      <>
        <path d={`M ${x - 60} ${y - 40} Q ${x - 20} ${y + h / 2} ${x - 70} ${y + h + 40} L ${x - 140} ${y + h + 40} L ${x - 140} ${y - 40} Z`} fill={curtain} {...st(5)} />
        <path d={`M ${x + w + 60} ${y - 40} Q ${x + w + 20} ${y + h / 2} ${x + w + 70} ${y + h + 40} L ${x + w + 140} ${y + h + 40} L ${x + w + 140} ${y - 40} Z`} fill={curtain} {...st(5)} />
        <rect x={x - 160} y={y - 56} width={w + 320} height={18} rx={9} fill="#7a5a40" />
      </>
    ) : null}
  </g>
);

export const Plant: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-40, -10, 20, 45].map((a, i) => (
      <ellipse key={i} cx={Math.sin(t * 1.3 + i) * 3 + a * 0.6} cy={-150 - (i % 2) * 30} rx={34} ry={90} fill={i % 2 ? "#4f9e5d" : "#3f8a50"}
        transform={`rotate(${a} 0 -60)`} {...st(4)} />
    ))}
    <path d="M -70 -70 L 70 -70 L 54 0 L -54 0 Z" fill="#c8693f" {...st(5)} />
  </g>
);

export const Lamp: React.FC<{ x: number; y: number; on?: number }> = ({ x, y, on = 1 }) => (
  <g>
    <ellipse cx={x} cy={y + 40} rx={260} ry={200} fill="#ffe7a8" opacity={0.16 * on} />
    <rect x={x - 8} y={y} width={16} height={FLOOR - y - 10} fill="#5b4636" />
    <ellipse cx={x} cy={FLOOR - 8} rx={60} ry={14} fill="#5b4636" />
    <path d={`M ${x - 80} ${y} L ${x + 80} ${y} L ${x + 50} ${y - 110} L ${x - 50} ${y - 110} Z`} fill="#f6d78c" {...st(5)} />
  </g>
);

export const WallClock: React.FC<{ x: number; y: number; r?: number; t: number; speed?: number }> = ({ x, y, r = 60, t, speed = 1 }) => {
  const a = t * 6 * speed;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fffdf6" {...st(6)} />
      <line x1={x} y1={y} x2={x + Math.sin((a / 12) * Math.PI / 180 + 1) * r * 0.45} y2={y - Math.cos((a / 12) * Math.PI / 180 + 1) * r * 0.45} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + Math.sin(a * Math.PI / 180) * r * 0.72} y2={y - Math.cos(a * Math.PI / 180) * r * 0.72} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={INK} />
    </g>
  );
};

export const Frame: React.FC<{ x: number; y: number; w: number; h: number; art?: string }> = ({ x, y, w, h, art = "#86b7d6" }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#fffaf0" {...st(8)} />
    <rect x={x + 18} y={y + 18} width={w - 36} height={h - 36} fill={art} />
    <path d={`M ${x + 18} ${y + h - 18} L ${x + w * 0.4} ${y + h * 0.45} L ${x + w * 0.6} ${y + h * 0.65} L ${x + w - 18} ${y + h * 0.35} L ${x + w - 18} ${y + h - 18} Z`} fill={shade(art, 0.75)} />
  </g>
);

/** Street with parallax layers. px = parallax offset (camera based). */
export const Street: React.FC<{ id: string; t: number; px?: number; sky?: [string, string]; dim?: number }> = ({
  id, t, px = 0, sky = ["#9fd3f0", "#e3f2f8"], dim = 0,
}) => (
  <g>
    <defs>
      <Grad id={`${id}-sky`} top={sky[0]} bot={sky[1]} />
    </defs>
    <rect x={-600} y={-400} width={W + 1200} height={FLOOR + 400} fill={`url(#${id}-sky)`} />
    <g transform={`translate(${px * 0.25} 0)`}>
      {[...Array(14)].map((_, i) => {
        const bw = 240 + ((i * 53) % 120);
        const bh = 420 + ((i * 97) % 300);
        return <rect key={i} x={-500 + i * 230} y={FLOOR - 120 - bh} width={bw} height={bh} fill={shade("#b8c7d4", 0.92 - (i % 3) * 0.06)} />;
      })}
    </g>
    <g transform={`translate(${px * 0.55} 0)`}>
      {[...Array(9)].map((_, i) => {
        const bx = -560 + i * 360;
        const bh = 520 + ((i * 131) % 260);
        const col = ["#e7a76b", "#d97f6a", "#8fb6a8", "#e3c27a", "#b48ec2", "#e7a76b", "#7fa6cf", "#d9886b", "#9bc29a"][i];
        return (
          <g key={i}>
            <rect x={bx} y={FLOOR - 60 - bh} width={330} height={bh + 10} fill={col} {...st(6)} />
            <rect x={bx - 10} y={FLOOR - 60 - bh - 24} width={350} height={30} rx={6} fill={shade(col, 0.8)} {...st(5)} />
            {[...Array(8)].map((__, j) => (
              <rect key={j} x={bx + 34 + (j % 3) * 96} y={FLOOR - 30 - bh + 40 + Math.floor(j / 3) * 130} width={64} height={84} rx={6}
                fill={(i + j) % 4 ? "#dff1fb" : "#fbe7a8"} {...st(4)} />
            ))}
            <rect x={bx + 120} y={FLOOR - 230} width={90} height={170} rx={8} fill={shade(col, 0.65)} {...st(5)} />
            <path d={`M ${bx + 20} ${FLOOR - 270} h 290 l -20 50 h -250 Z`} fill={i % 2 ? "#e85d5d" : "#f2f2f2"} {...st(4)} />
          </g>
        );
      })}
    </g>
    <rect x={-600} y={FLOOR - 60} width={W + 1200} height={60} fill="#cfc8bd" {...st(4)} />
    <rect x={-600} y={FLOOR} width={W + 1200} height={H - FLOOR + 400} fill="#8f8f98" />
    {[...Array(12)].map((_, i) => (
      <rect key={i} x={-600 + i * 300 + ((t * 80) % 300) * 0} y={FLOOR + 120} width={150} height={14} rx={7} fill="#e9e3cf" opacity={0.8} />
    ))}
    {[0, 1].map((i) => {
      const cx = ((t * (i ? -260 : 330) + i * 1400) % 3400 + 3400) % 3400 - 600;
      const col = i ? "#e0463c" : "#3f7fd6";
      return (
        <g key={i} transform={`translate(${cx} ${FLOOR + (i ? 170 : 60)}) scale(${i ? -1 : 1} 1)`}>
          <rect x={-150} y={-90} width={300} height={80} rx={30} fill={col} {...st(5)} />
          <path d="M -90 -90 L -60 -150 L 60 -150 L 100 -90 Z" fill={shade(col, 1.15)} {...st(5)} />
          <rect x={-50} y={-140} width={46} height={44} fill="#cfe9f7" />
          <rect x={10} y={-140} width={54} height={44} fill="#cfe9f7" />
          <circle cx={-90} cy={-8} r={30} fill={INK} />
          <circle cx={90} cy={-8} r={30} fill={INK} />
        </g>
      );
    })}
    {dim ? <rect x={-600} y={-400} width={W + 1200} height={H + 800} fill="#0b0f22" opacity={dim} /> : null}
  </g>
);

export const Bed: React.FC<{ x: number; w?: number; blanket?: string }> = ({ x, w = 1100, blanket = "#7fb3e6" }) => (
  <g>
    <ellipse cx={x + w / 2} cy={FLOOR + 10} rx={w * 0.55} ry={30} fill="#000" opacity={0.16} />
    <rect x={x - 30} y={FLOOR - 480} width={60} height={480} rx={20} fill="#9a6b47" {...st(6)} />
    <rect x={x} y={FLOOR - 290} width={w} height={170} rx={30} fill="#f3f0ea" {...st(6)} />
    <rect x={x} y={FLOOR - 140} width={w} height={60} rx={16} fill="#9a6b47" {...st(6)} />
    <rect x={x + 10} y={FLOOR - 80} width={36} height={80} fill="#7d5538" {...st(4)} />
    <rect x={x + w - 46} y={FLOOR - 80} width={36} height={80} fill="#7d5538" {...st(4)} />
    <rect x={x + 30} y={FLOOR - 360} width={300} height={110} rx={50} fill="#ffffff" {...st(6)} />
    <path d={`M ${x + 230} ${FLOOR - 300} Q ${x + 600} ${FLOOR - 380} ${x + w + 10} ${FLOOR - 300} L ${x + w + 10} ${FLOOR - 120} L ${x + 230} ${FLOOR - 120} Z`} fill={blanket} {...st(6)} />
    <path d={`M ${x + 300} ${FLOOR - 250} Q ${x + 600} ${FLOOR - 300} ${x + w - 40} ${FLOOR - 240}`} fill="none" stroke={shade(blanket, 0.82)} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** Alex lying in bed: head on the pillow, one arm out of the blanket. */
export const LyingHead: React.FC<{ x: number; y: number; t: number; expr: "sleep" | "open" | "confused" | "relaxed" | "worried" | "shock"; look?: number; armUp?: number }> = ({
  x, y, t, expr, look = 0,
}) => {
  const blink = (t % 3.3) < 0.12 && expr !== "sleep";
  const r = 82;
  const eyes = [-1, 1].map((s) => {
    const ex = x + s * 32 + look * 14;
    const ey = y - 6;
    if (expr === "sleep" || blink) return <path key={s} d={`M ${ex - 18} ${ey} Q ${ex} ${ey + 10} ${ex + 18} ${ey}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />;
    const ry = expr === "shock" ? 32 : expr === "relaxed" ? 18 : 27;
    return (
      <g key={s}>
        <ellipse cx={ex} cy={ey} rx={expr === "shock" ? 27 : 23} ry={ry} fill="#fff" />
        <circle cx={ex + look * 9} cy={ey - (expr === "open" || expr === "confused" || expr === "shock" ? 10 : 0)} r={expr === "shock" ? 8 : 11} fill={INK} />
      </g>
    );
  });
  const brows = [-1, 1].map((s) => {
    const ex = x + s * 32 + look * 10;
    const by = y - 50;
    let a = by;
    let b = by;
    if (expr === "confused") { a = s === 1 ? by - 16 : by + 4; b = s === 1 ? by - 8 : by + 2; }
    if (expr === "worried") { a = by - 12; b = by + 4; }
    if (expr === "shock") { a = by - 16; b = by - 16; }
    return <line key={s} x1={ex - s * 18} y1={a} x2={ex + s * 18} y2={b} stroke="#e9e9ee" strokeWidth={8} strokeLinecap="round" />;
  });
  const mouth = expr === "relaxed" ? <path d={`M ${x - 18} ${y + 40} Q ${x} ${y + 54} ${x + 18} ${y + 40}`} fill="none" stroke="#f3f3f3" strokeWidth={6} strokeLinecap="round" />
    : expr === "worried" ? <path d={`M ${x - 16} ${y + 50} Q ${x} ${y + 38} ${x + 16} ${y + 50}`} fill="none" stroke="#f3f3f3" strokeWidth={6} strokeLinecap="round" />
      : expr === "shock" ? <ellipse cx={x} cy={y + 46} rx={13} ry={16} fill="#f3f3f3" />
        : <ellipse cx={x} cy={y + 44} rx={9} ry={6} fill="#f3f3f3" />;
  return (
    <g>
            <circle cx={x} cy={y} r={r} fill={INK} />
      <QuiffHair x={x} y={y} u={r / 80} layer="front" />
      {eyes}
      {brows}
      {mouth}
      {expr === "worried" ? <path d={`M ${x + 86} ${y - 48} L ${x + 95} ${y - 26} A 10 10 0 1 1 ${x + 77} ${y - 26} Z`} fill="#8cc8ff" /> : null}
    </g>
  );
};

/** Big phone frame for close-ups; children are drawn in the screen (sx, sy, sw, sh). */
export const BigPhone: React.FC<{ x: number; y: number; w?: number; h?: number; children?: React.ReactNode; tilt?: number }> = ({
  x, y, w = 560, h = 1000, children, tilt = 0,
}) => (
  <g transform={`rotate(${tilt} ${x} ${y})`}>
    <rect x={x - w / 2 + 14} y={y - h / 2 + 20} width={w} height={h} rx={70} fill="#000" opacity={0.22} />
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={70} fill="#1b1b24" {...st(8)} />
    <rect x={x - w / 2 + 26} y={y - h / 2 + 26} width={w - 52} height={h - 52} rx={48} fill="#f4f6fb" />
    <rect x={x - 70} y={y - h / 2 + 40} width={140} height={30} rx={15} fill="#1b1b24" />
    {children}
  </g>
);

export const ChatBubble: React.FC<{ x: number; y: number; text: string; me?: boolean; s?: number; w?: number }> = ({ x, y, text, me = false, s = 1, w }) => {
  const ww = w ?? text.length * 26 + 70;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
      <rect x={me ? x - ww : x} y={y - 46} width={ww} height={92} rx={40} fill={me ? "#2f7cf6" : "#e6e8ef"} />
      <text x={me ? x - ww / 2 : x + ww / 2} y={y + 2} fontFamily="Inter" fontWeight={700} fontSize={44} fill={me ? "#fff" : "#16161c"} textAnchor="middle" dominantBaseline="central">{text}</text>
    </g>
  );
};

export const CoffeeShop: React.FC<{ t: number; id: string; sky?: [string, string] }> = ({ t, id, sky }) => (
  <g>
    <Room id={id} wall="#e9d3b4" wall2="#dcc29e" floor="#a77b55" wains="#c79b6d" lightX={1200} />
    <rect x={200} y={140} width={700} height={300} rx={18} fill="#2f2a28" {...st(8)} />
    {["LATTE ...... 4", "MOCHA ...... 5", "COLD BREW .. 4"].map((s, i) => (
      <text key={i} x={240} y={210 + i * 80} fontFamily="Inter" fontWeight={800} fontSize={46} fill="#f6efe2">{s}</text>
    ))}
    <Window id={`${id}-win`} x={1240} y={140} w={640} h={420} sky={sky ?? ["#bfe3f6", "#eef7fb"]} t={t} kind="street" />
  </g>
);

export const CoffeeCounter: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-100} y={FLOOR - 330} width={1400} height={330} fill="#7a4f33" {...st(7)} />
    <rect x={-120} y={FLOOR - 350} width={1440} height={40} rx={10} fill="#c58b5d" {...st(6)} />
    <rect x={160} y={FLOOR - 520} width={240} height={170} rx={16} fill="#b9bcc7" {...st(6)} />
    <rect x={190} y={FLOOR - 490} width={180} height={50} rx={8} fill="#6c7080" />
    <circle cx={330} cy={FLOOR - 400} r={18} fill="#e0463c" />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${560 + i * 80} ${FLOOR - 350} l 10 -70 h 46 l 10 70 Z`} fill="#fffaf0" {...st(5)} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M ${520 + i * 30} ${FLOOR - 420 - Math.sin(t * 2 + i) * 10} q 10 -30 0 -60`} fill="none" stroke="#fff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
    ))}
  </g>
);

export const Calendar: React.FC<{ x: number; y: number; label: string; flip: number; sub?: string }> = ({ x, y, label, flip, sub }) => (
  <g>
    <rect x={x - 300} y={y - 280} width={600} height={560} rx={30} fill="#fffdf7" {...st(8)} />
    <rect x={x - 300} y={y - 280} width={600} height={140} rx={30} fill="#e0463c" {...st(8)} />
    {[-180, 0, 180].map((dx) => <rect key={dx} x={x + dx - 16} y={y - 320} width={32} height={80} rx={16} fill="#777" {...st(5)} />)}
    <text x={x} y={y - 210} fontFamily="Inter" fontWeight={900} fontSize={64} fill="#fff" textAnchor="middle" dominantBaseline="central">{sub ?? "CALENDAR"}</text>
    <text x={x} y={y + 70} fontFamily="Inter" fontWeight={900} fontSize={150} fill={INK} textAnchor="middle" dominantBaseline="central">{label}</text>
    {flip > 0 && flip < 1 ? (
      <path d={`M ${x - 300} ${y - 140} L ${x + 300} ${y - 140} L ${x + 300 - 600 * flip} ${y + 280 - 300 * Math.sin(flip * Math.PI)} L ${x - 300} ${y + 280} Z`} fill="#f1ede2" {...st(6)} />
    ) : null}
  </g>
);

export const Cake: React.FC<{ x: number; y: number; s?: number; t: number; candles?: boolean }> = ({ x, y, s = 1, t, candles = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={190} ry={30} fill="#000" opacity={0.15} />
    <ellipse cx={0} cy={0} rx={180} ry={34} fill="#f6f2ea" {...st(5)} />
    <rect x={-140} y={-180} width={280} height={180} fill="#ffb6c8" {...st(6)} />
    <ellipse cx={0} cy={-180} rx={140} ry={28} fill="#ffd6e1" {...st(6)} />
    <path d="M -140 -120 Q -105 -95 -70 -120 Q -35 -95 0 -120 Q 35 -95 70 -120 Q 105 -95 140 -120" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
    {[-90, -30, 30, 90].map((cx, i) => <circle key={i} cx={cx} cy={-60} r={12} fill={["#e0463c", "#f2c84b", "#4c9fe0", "#5ac26d"][i]} />)}
    {candles
      ? [-60, 0, 60].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 9} y={-270} width={18} height={80} rx={4} fill={["#7ec8f5", "#f7d66b", "#9be59d"][i]} {...st(3)} />
          <ellipse cx={cx + Math.sin(t * 9 + i) * 2} cy={-292} rx={11} ry={20} fill="#ffb238" />
          <ellipse cx={cx + Math.sin(t * 9 + i) * 2} cy={-286} rx={5} ry={10} fill="#fff3b0" />
          <circle cx={cx} cy={-290} r={40} fill="#ffd56b" opacity={0.18} />
        </g>
      ))
      : null}
  </g>
);

const keepItem = (i: number, r: number, stock: number) => ((i * 37 + r * 53 + 7) % 100) / 100 < stock;

export const Bakery: React.FC<{ id: string; t: number; warm?: number; stock?: number; sepia?: number }> = ({ id, t, warm = 1, stock = 1 }) => (
  <g>
    <Room id={id} wall="#f2cf9f" wall2="#e8b77e" floor="#b07c52" wains="#d99a62" light={0.28 * warm} lightX={1300} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={-100 + i * 480} y={120} width={20} height={120} fill="#5b4636" />
    ))}
    <rect x={1500} y={150} width={540} height={300} rx={18} fill="#fff7ea" {...st(6)} />
    <text x={1770} y={230} fontFamily="Inter" fontWeight={900} fontSize={58} fill="#c75a28" textAnchor="middle">ROSE'S</text>
    <text x={1770} y={300} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#6b4b33" textAnchor="middle">BAKERY · EST 1979</text>
    <text x={1770} y={380} fontFamily="Inter" fontWeight={700} fontSize={36} fill="#6b4b33" textAnchor="middle">bread · cakes · coffee</text>
    {[0, 1, 2].map((r) => (
      <g key={r}>
        <rect x={120} y={200 + r * 150} width={620} height={18} fill="#8a5a3a" {...st(4)} />
        {[0, 1, 2, 3, 4].map((i) => (keepItem(i, r, stock) ?
          <ellipse key={i} cx={180 + i * 120} cy={176 + r * 150} rx={52} ry={28} fill={r === 1 ? "#d9934e" : "#c97f3c"} {...st(4)} /> : null
        ))}
      </g>
    ))}
    <rect x={60} y={FLOOR - 380} width={1300} height={380} fill="#8a5a3a" {...st(7)} />
    <rect x={90} y={FLOOR - 350} width={1240} height={180} rx={12} fill="#dff3f7" opacity={0.85} {...st(5)} />
    {[0, 1, 2, 3, 4].map((i) => (!keepItem(i, 9, stock) ? null :
      <g key={i}>
        <ellipse cx={210 + i * 240} cy={FLOOR - 220} rx={80} ry={24} fill="#f2e7d6" {...st(3)} />
        <circle cx={190 + i * 240} cy={FLOOR - 246} r={28} fill={["#e8a05c", "#ffb6c8", "#c97f3c", "#f6dc8b", "#b87046"][i]} {...st(4)} />
        <circle cx={236 + i * 240} cy={FLOOR - 244} r={24} fill={["#c97f3c", "#f6dc8b", "#e8a05c", "#ffb6c8", "#d9934e"][i]} {...st(4)} />
      </g>
    ))}
    <rect x={40} y={FLOOR - 400} width={1340} height={34} rx={8} fill="#c58b5d" {...st(6)} />
    <ellipse cx={1200} cy={500} rx={700} ry={400} fill="#ffcf7a" opacity={0.1 * warm} />
  </g>
);

export const TVSet: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; id: string; glow?: string }> = ({ x, y, w, h, children, id, glow = "#9fd0ff" }) => (
  <g>
    <defs>
      <clipPath id={`${id}-tv`}>
        <rect x={x} y={y} width={w} height={h} rx={14} />
      </clipPath>
    </defs>
    <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.75} ry={h * 0.75} fill={glow} opacity={0.12} />
    <rect x={x - 26} y={y - 26} width={w + 52} height={h + 52} rx={28} fill="#1c1c24" {...st(8)} />
    <g clipPath={`url(#${id}-tv)`}>{children}</g>
    <rect x={x + w / 2 - 60} y={y + h + 26} width={120} height={50} fill="#1c1c24" {...st(5)} />
    <rect x={x + w / 2 - 180} y={y + h + 70} width={360} height={22} rx={11} fill="#1c1c24" {...st(5)} />
  </g>
);

export const Sofa: React.FC<{ x: number; w?: number; col?: string }> = ({ x, w = 900, col = "#7a8fc9" }) => (
  <g>
    <ellipse cx={x + w / 2} cy={FLOOR + 6} rx={w * 0.55} ry={26} fill="#000" opacity={0.16} />
    <rect x={x} y={FLOOR - 420} width={w} height={240} rx={60} fill={shade(col, 0.88)} {...st(6)} />
    <rect x={x + 40} y={FLOOR - 220} width={w - 80} height={120} rx={30} fill={col} {...st(6)} />
    <rect x={x - 40} y={FLOOR - 300} width={110} height={240} rx={40} fill={shade(col, 0.9)} {...st(6)} />
    <rect x={x + w - 70} y={FLOOR - 300} width={110} height={240} rx={40} fill={shade(col, 0.9)} {...st(6)} />
    <rect x={x + 30} y={FLOOR - 80} width={30} height={80} fill="#5b4636" />
    <rect x={x + w - 60} y={FLOOR - 80} width={30} height={80} fill="#5b4636" />
  </g>
);

/** Rounded card with a title, used in montages. */
export const Panel: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; id: string; bg?: string; op?: number; s?: number }> = ({
  x, y, w, h, children, id, bg = "#fff", op = 1, s = 1,
}) => (
  <g opacity={op} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={x} y={y} width={w} height={h} rx={30} />
      </clipPath>
    </defs>
    <rect x={x + 12} y={y + 16} width={w} height={h} rx={30} fill="#000" opacity={0.25} />
    <rect x={x} y={y} width={w} height={h} rx={30} fill={bg} />
    <g clipPath={`url(#${id}-clip)`}>{children}</g>
    <rect x={x} y={y} width={w} height={h} rx={30} fill="none" {...st(8)} />
  </g>
);
