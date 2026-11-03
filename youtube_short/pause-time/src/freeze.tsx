import React from "react";
import { INK } from "./Stick";
import { H, W, ip } from "./kit";

// Shared pieces for "What If You Could Pause Time?": frozen-world time, rain, umbrellas, birds, freeze tint.

export type Pause = { start: number; end: number; owner: string };

/** World time: stops during [p.start, p.end) and then carries on from where it stopped. */
export const worldTime = (t: number, pauses: Pause[]) => {
  let lost = 0;
  for (const p of pauses) {
    if (t >= p.end) lost += p.end - p.start;
    else if (t > p.start) lost += t - p.start;
  }
  return t - lost;
};

/** 0..1 how frozen the world looks (quick ramp in, quick ramp out). */
export const frozenK = (t: number, pauses: Pause[]) => {
  let k = 0;
  for (const p of pauses) k = Math.max(k, Math.min(ip(t, p.start - 0.02, p.start + 0.18), 1 - ip(t, p.end - 0.05, p.end + 0.15)));
  return k;
};

const hash = (i: number, s = 1) => {
  const v = Math.sin(i * 127.1 * s + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Rain streaks; while frozen they turn into suspended drops. */
export const Rain: React.FC<{ wt: number; k: number; n?: number; x0?: number; x1?: number; seed?: number; size?: number; op?: number }> = ({
  wt, k, n = 240, x0 = -700, x1 = W + 700, seed = 1, size = 1, op = 1,
}) => {
  const span = H + 500;
  return (
    <g opacity={op}>
      {Array.from({ length: n }).map((_, i) => {
        const x = x0 + hash(i, seed) * (x1 - x0);
        const sp = 1500 + hash(i, seed + 3) * 600;
        const y = ((hash(i, seed + 7) * span + wt * sp) % span) - 300;
        const xx = x - y * 0.18;
        const L = (42 + hash(i, seed + 5) * 30) * size;
        const a = 0.35 + hash(i, seed + 9) * 0.35;
        if (k < 0.5) {
          return <line key={i} x1={xx} y1={y} x2={xx - L * 0.18} y2={y - L} stroke="#e8f2ff" strokeWidth={4 * size} strokeLinecap="round" opacity={a * (1 - k * 2)} />;
        }
        const r = (6 + hash(i, seed + 11) * 5) * size;
        return (
          <g key={i} opacity={Math.min(1, (k - 0.5) * 3) * (a + 0.3)}>
            <path d={`M ${xx} ${y - r * 2.1} Q ${xx + r} ${y - r * 0.4} ${xx + r} ${y + r * 0.2} A ${r} ${r} 0 0 1 ${xx - r} ${y + r * 0.2} Q ${xx - r} ${y - r * 0.4} ${xx} ${y - r * 2.1} Z`}
              fill="#cfe6ff" stroke="#7fa6d6" strokeWidth={1.5 * size} />
            <circle cx={xx - r * 0.35} cy={y - r * 0.1} r={r * 0.28} fill="#ffffff" />
          </g>
        );
      })}
    </g>
  );
};

/** One big hero raindrop. */
export const Drop: React.FC<{ x: number; y: number; r: number; wob?: number }> = ({ x, y, r, wob = 0 }) => {
  const sx = 1 + wob * 0.18;
  const sy = 1 - wob * 0.14;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <circle cx={0} cy={0} r={r * 2.2} fill="#bfe4ff" opacity={0.18} />
      <path d={`M 0 ${-r * 2.1} Q ${r} ${-r * 0.4} ${r} ${r * 0.2} A ${r} ${r} 0 0 1 ${-r} ${r * 0.2} Q ${-r} ${-r * 0.4} 0 ${-r * 2.1} Z`}
        fill="#d9eeff" stroke="#5f8fc8" strokeWidth={r * 0.12} />
      <ellipse cx={-r * 0.38} cy={-r * 0.05} rx={r * 0.22} ry={r * 0.36} fill="#ffffff" />
      <path d={`M ${-r * 0.55} ${r * 0.5} Q 0 ${r * 0.95} ${r * 0.55} ${r * 0.5}`} fill="none" stroke="#9cc6f0" strokeWidth={r * 0.1} strokeLinecap="round" />
    </g>
  );
};

/** Umbrella held in a Stick figure's right hand with arms[1] = "phoneUp" (hand at x + 72u, yf - 386u). */
export const Umbrella: React.FC<{ x: number; yf: number; u?: number; col: string; bob?: number }> = ({ x, yf, u = 1, col, bob = 0 }) => {
  const hx = x + 72 * u;
  const top = yf - 760 * u - bob;
  const cy = top + 40 * u;
  const R = 200 * u;
  const cx = hx - 30 * u;
  const scal = [-1, -0.5, 0, 0.5, 1].map((k) => cx + k * R);
  return (
    <g>
      <line x1={hx} y1={yf - 386 * u - bob} x2={cx} y2={top} stroke={INK} strokeWidth={8 * u} strokeLinecap="round" />
      <path d={`M ${cx - R} ${cy + 40 * u} Q ${cx - R} ${top - 40 * u} ${cx} ${top - 50 * u} Q ${cx + R} ${top - 40 * u} ${cx + R} ${cy + 40 * u} ` +
        scal.slice(1).reverse().map((sx, i) => `Q ${sx - R * 0.25} ${cy + 10 * u} ${scal[3 - i]} ${cy + 40 * u}`).join(" ") + " Z"}
        fill={col} stroke={INK} strokeWidth={6 * u} strokeLinejoin="round" />
      {[-0.5, 0, 0.5].map((k) => (
        <path key={k} d={`M ${cx} ${top - 48 * u} Q ${cx + k * R * 0.8} ${top} ${cx + k * R} ${cy + 40 * u}`} fill="none" stroke={INK} strokeWidth={3.5 * u} opacity={0.5} />
      ))}
      <circle cx={cx} cy={top - 54 * u} r={7 * u} fill={INK} />
    </g>
  );
};

/** Small bird; wings flap with world time. */
export const Bird: React.FC<{ x: number; y: number; wt: number; s?: number; flip?: boolean }> = ({ x, y, wt, s = 1, flip = false }) => {
  const a = Math.sin(wt * 18) * 34;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d={`M -6 -4 Q -40 ${-30 - a} -78 ${-14 - a * 1.4}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M 6 -4 Q 30 ${-34 - a} 62 ${-22 - a * 1.4}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={34} ry={17} fill="#5b6270" stroke={INK} strokeWidth={5} />
      <circle cx={30} cy={-8} r={13} fill="#5b6270" stroke={INK} strokeWidth={5} />
      <path d="M 41 -8 L 58 -4 L 41 0 Z" fill="#f2b23a" stroke={INK} strokeWidth={3} />
      <circle cx={33} cy={-11} r={3} fill="#fff" />
    </g>
  );
};

/** Tyre splash fan; `k` 0..1 growth. */
export const Splash: React.FC<{ x: number; y: number; k: number; flip?: boolean }> = ({ x, y, k, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} opacity={Math.min(1, k * 3)}>
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (-160 + i * 9) * (Math.PI / 180);
      const d = (90 + hash(i, 5) * 160) * k;
      const r = 5 + hash(i, 8) * 9;
      return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.9} r={r} fill="#d6ebff" stroke="#7fa6d6" strokeWidth={2} />;
    })}
    <path d={`M -10 0 Q -90 ${-70 * k} -190 ${-40 * k}`} fill="none" stroke="#d6ebff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
  </g>
);

/** Frozen look applied to a world group: desaturate + cool tint. Put <FreezeDefs> once per scene. */
export const FreezeDefs: React.FC<{ id: string; k: number }> = ({ id, k }) => (
  <defs>
    <filter id={id} x={-1200} y={-1000} width={4600} height={3400} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values={String(1 - 0.72 * k)} />
      <feComponentTransfer>
        <feFuncR type="linear" slope={1 - 0.12 * k} />
        <feFuncG type="linear" slope={1 - 0.04 * k} />
        <feFuncB type="linear" slope={1 + 0.1 * k} intercept={0.03 * k} />
      </feComponentTransfer>
    </filter>
  </defs>
);

/** Ripple ring that expands from where time was stopped. */
export const Shockwave: React.FC<{ x: number; y: number; t: number; t0: number; col?: string }> = ({ x, y, t, t0, col = "#bfe8ff" }) => {
  const k = t - t0;
  if (k < 0 || k > 0.9) return null;
  const r = 40 + k * 2600;
  return (
    <g opacity={1 - k / 0.9}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={col} strokeWidth={30 * (1 - k / 0.9) + 4} />
      <circle cx={x} cy={y} r={r * 0.82} fill="none" stroke="#ffffff" strokeWidth={8} opacity={0.6} />
    </g>
  );
};
