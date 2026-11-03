import React from "react";
import { Easing, interpolate } from "remotion";
import { LieCounter, Stick, StickProps, headOf } from "./Stick";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const W = 2160;
export const H = 1240;

export const ip = (t: number, a: number, b: number, from = 0, to = 1, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: ease });

export const pop = (t: number, t0: number, d = 0.35) =>
  t < t0 ? 0 : interpolate(t, [t0, t0 + d], [0.2, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });

/** Opacity of a sub-shot visible between a and b, with crossfades of f seconds. */
export const shot = (t: number, a: number, b: number, f = 0.4) =>
  Math.min(a <= 0 ? 1 : ip(t, a, a + f, 0, 1, Easing.inOut(Easing.quad)), b >= 1e8 ? 1 : ip(t, b, b + f, 1, 0, Easing.inOut(Easing.quad)));

/** Camera keyframes [t, zoom, cx, cy] -> [zoom, cx, cy]. */
export const cam = (t: number, keys: [number, number, number, number][]) => {
  if (t <= keys[0][0]) return keys[0].slice(1) as [number, number, number];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, ...a] = keys[i];
    const [t1, ...b] = keys[i + 1];
    if (t < t1) {
      const k = ip(t, t0, t1);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k] as [number, number, number];
    }
  }
  return keys[keys.length - 1].slice(1) as [number, number, number];
};

/** A sub-shot: its own camera + crossfade opacity. */
export const View: React.FC<{ c: [number, number, number]; op?: number; children: React.ReactNode }> = ({ c, op = 1, children }) => {
  if (op <= 0.001) return null;
  const [z, cx, cy] = c;
  return <g opacity={op} transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;
};

/** Same tick schedule as tools/make_audio.py counting(): n steps ending exactly at `to`. */
export const ticks = (at: number, to: number, n: number, from = 0): [number, number][] => {
  const step = Math.min(0.18, (to - at) / Math.max(1, n));
  const out: [number, number][] = [[-100, from]];
  for (let j = 0; j < n; j++) out.push([to - (n - 1 - j) * step, from + j + 1]);
  return out;
};

export const tf = (x: number, y: number, s = 1, r = 0) => `translate(${x} ${y}) rotate(${r}) scale(${s}) translate(${-x} ${-y})`;

/** A person with their counter. */
export const P: React.FC<StickProps & { steps?: [number, number][]; c0?: number; tone?: "white" | "red" | "green"; cop?: number }> = ({
  steps, c0 = -10, tone = "white", cop = 1, ...p
}) => {
  const { hx, hy, hr } = headOf(p.x, p.yf, p.u ?? 1, p.sit);
  const u = p.u ?? 1;
  const extra = p.hair === "grayBun" || p.hair === "bun" ? 50 : p.hair === "alex" ? 26 : p.hair === "wolf" ? 50 : p.hair === "middle" ? 36 : p.hair === "quiff" ? 48 : 10;
  return (
    <g>
      <Stick {...p} />
      {steps ? <LieCounter x={hx} y={hy - hr - (82 + extra) * u - (p.bob ?? 0)} t={p.t} steps={steps} t0={c0} u={u} tone={tone} opacity={cop} /> : null}
    </g>
  );
};

export const ALEX = { outfit: "hoodie", color: "#2f6fe0", hair: "quiff", shoes: "#fbfbf8" } as const;
export const JAKE = { outfit: "hoodie", color: "#3fae6a", hair: "curly", shoes: "#f2c84b" } as const;
export const MANAGER = { outfit: "tee", color: "#d8433a", hair: "bald", mustache: true } as const;
export const BAKER = { outfit: "apron", color: "#f08a24", hair: "grayBun", glasses: true } as const;
export const SAM = { outfit: "hoodie", color: "#3fae6a", hair: "cap", accent: "#f2c84b" } as const;
export const BOSS = { outfit: "shopApron", color: "#f4f1ea", accent: "#2f8f5b", hair: "bun" } as const;
export const VICTOR = { outfit: "suit", color: "#3b3e46", accent: "#9e1b2d", hair: "slick" } as const;
export const ROSE = { outfit: "apron", color: "#f08a24", hair: "grayBun", glasses: true } as const;
export const LILY = { outfit: "dress", color: "#ff7fb0", hair: "pigtails" } as const;
export const MOM = { outfit: "coat", color: "#2fa3a0", hair: "long" } as const;

/** Speech bubble; tail tip at (x, y). */
export const Bubble: React.FC<{ x: number; y: number; lines: string[]; t: number; t0: number; t1?: number; tail?: "left" | "right"; size?: number; think?: boolean; hl?: string }> = ({
  x, y, lines, t, t0, t1 = 1e9, tail = "left", size = 52, think = false, hl,
}) => {
  if (t < t0 || t >= t1) return null;
  const sc = pop(t, t0, 0.3);
  const op = Math.min(1, (t - t0) / 0.1) * (1 - ip(t, t1 - 0.15, t1, 0, 1, Easing.linear));
  const lh = size * 1.25;
  const w = Math.max(...lines.map((l) => l.length * size * 0.54)) + 70;
  const h = lh * lines.length + size * 0.75;
  const bx = tail === "left" ? x - 46 : x - w + 46;
  const by = y - 50 - h;
  const tx = tail === "left" ? x + 26 : x - 26;
  return (
    <g opacity={op} transform={tf(x, y, sc)}>
      <rect x={bx + 8} y={by + 10} width={w} height={h} rx={36} fill="#000" opacity={0.18} />
      {think ? (
        <>
          <circle cx={x} cy={y - 6} r={10} fill="#fff" stroke="#141419" strokeWidth={4} />
          <circle cx={(x + tx) / 2} cy={y - 30} r={16} fill="#fff" stroke="#141419" strokeWidth={4} />
        </>
      ) : (
        <path d={`M ${tx - 22} ${y - 54} L ${x} ${y} L ${tx + 22} ${y - 54} Z`} fill="#fffffb" stroke="#141419" strokeWidth={5} strokeLinejoin="round" />
      )}
      <rect x={bx} y={by} width={w} height={h} rx={36} fill="#fffffb" stroke="#141419" strokeWidth={5} />
      {!think ? <path d={`M ${tx - 18} ${y - 58} L ${x} ${y - 10} L ${tx + 18} ${y - 58} Z`} fill="#fffffb" /> : null}
      {lines.map((l, i) => (
        <text key={i} x={bx + w / 2} y={by + size * 0.38 + lh * (i + 0.5)} fontFamily="Inter" fontWeight={700} fontSize={size}
          fill="#141419" textAnchor="middle" dominantBaseline="central">
          {hl && l.includes(hl) ? (
            <>
              {l.split(hl)[0]}
              <tspan fill="#c2410c" fontWeight={900}>{hl}</tspan>
              {l.split(hl)[1]}
            </>
          ) : l}
        </text>
      ))}
    </g>
  );
};

export const Chip: React.FC<{ x: number; y: number; text: string; t: number; t0: number; bg?: string; fg?: string; size?: number; t1?: number }> = ({
  x, y, text, t, t0, bg = "#fffffc", fg = "#141419", size = 54, t1 = 1e9,
}) => {
  if (t < t0 || t > t1) return null;
  const w = text.length * size * 0.6 + 80;
  const h = size * 1.7;
  const op = 1 - ip(t, t1 - 0.2, t1);
  return (
    <g transform={tf(x, y, pop(t, t0))} opacity={op}>
      <rect x={x - w / 2 + 6} y={y - h / 2 + 8} width={w} height={h} rx={h / 2} fill="#000" opacity={0.2} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke="#141419" strokeWidth={5} />
      <text x={x} y={y + 2} fontFamily="Inter, Noto Color Emoji" fontWeight={900} fontSize={size} fill={fg} textAnchor="middle" dominantBaseline="central">{text}</text>
    </g>
  );
};

export const Emoji: React.FC<{ x: number; y: number; size: number; e: string; s?: number; op?: number; r?: number }> = ({ x, y, size, e, s = 1, op = 1, r = 0 }) => (
  <text x={x} y={y} fontSize={size} fontFamily="Noto Color Emoji" textAnchor="middle" dominantBaseline="central" opacity={op} transform={tf(x, y, s, r)}>{e}</text>
);

/** Expanding ring flash at (x, y). */
export const Ring: React.FC<{ x: number; y: number; t: number; t0: number; r?: number; col?: string }> = ({ x, y, t, t0, r = 90, col = "#ffffff" }) => {
  const k = t - t0;
  if (k < 0 || k > 0.7) return null;
  return <circle cx={x} cy={y} r={r + k * 160} fill="none" stroke={col} strokeWidth={10 * (1 - k / 0.7)} opacity={1 - k / 0.7} />;
};

export const Sparkles: React.FC<{ cx: number; cy: number; t: number; n?: number; r?: number; col?: string; k?: number }> = ({ cx, cy, t, n = 8, r = 220, col = "#fff2b0", k = 1 }) => (
  <g opacity={k}>
    {Array.from({ length: n }).map((_, i) => {
      const ph = (t * 0.7 + i / n) % 1;
      const a = i * 2.39;
      const x = cx + Math.cos(a) * r * (0.6 + ph * 0.5);
      const y = cy + Math.sin(a) * r * 0.7 * (0.6 + ph * 0.5);
      const s = Math.sin(ph * Math.PI) * 22;
      return <path key={i} d={`M ${x} ${y - s} L ${x + s * 0.25} ${y - s * 0.25} L ${x + s} ${y} L ${x + s * 0.25} ${y + s * 0.25} L ${x} ${y + s} L ${x - s * 0.25} ${y + s * 0.25} L ${x - s} ${y} L ${x - s * 0.25} ${y - s * 0.25} Z`} fill={col} />;
    })}
  </g>
);

export const Hearts: React.FC<{ cx: number; cy: number; t: number; t0: number; n?: number }> = ({ cx, cy, t, t0, n = 6 }) => {
  if (t < t0) return null;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const ph = ((t - t0) * 0.45 + i / n) % 1;
        return <Emoji key={i} x={cx + Math.sin(i * 2.1 + t) * 120} y={cy - ph * 300} size={i % 2 ? 56 : 44} e="❤️" op={(1 - ph) * Math.min(1, (t - t0) * 2)} />;
      })}
    </g>
  );
};
