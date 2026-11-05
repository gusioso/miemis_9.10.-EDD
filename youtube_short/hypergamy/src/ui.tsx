import React from "react";
import { Easing, interpolate } from "remotion";

export const FLOOR = 1040;
export const WW = 2160;
export const WH = 1240;
export const FONT = "Inter";
export const EMOJI = "Noto Color Emoji";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 progress between a and b (eased). */
export const ip = (t: number, a: number, b: number, from = 0, to = 1, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: ease });

/** Pop-in scale (overshoot) starting at t0. */
export const pop = (t: number, t0: number, d = 0.35) =>
  t < t0 ? 0 : interpolate(t, [t0, t0 + d], [0.2, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });

/** Camera keyframes [t, zoom, cx, cy] (world coords) -> current values. */
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

export type Line = { start: number; end: number; text: string };
export type SceneData = { id: string; lines: Line[]; dur: number };
export type SceneProps = { S: SceneData; t: number };

export const tf = (x: number, y: number, sc = 1, rot = 0) => `translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(${-x} ${-y})`;

export const Emoji: React.FC<{ x: number; y: number; size: number; e: string; scale?: number; opacity?: number; rot?: number }> = ({
  x, y, size, e, scale = 1, opacity = 1, rot = 0,
}) => (
  <text x={x} y={y} fontSize={size} fontFamily={EMOJI} textAnchor="middle" dominantBaseline="central" opacity={opacity}
    transform={tf(x, y, scale, rot)}>
    {e}
  </text>
);

const textW = (s: string, size: number) => s.length * size * 0.56;

/** Speech bubble whose tail tip sits at (x, y). */
export const Bubble: React.FC<{ x: number; y: number; lines: string[]; t: number; t0: number; t1: number; tail?: "left" | "right"; size?: number }> = ({
  x, y, lines, t, t0, t1, tail = "left", size = 58,
}) => {
  if (t < t0 || t >= t1) return null;
  const sc = pop(t, t0, 0.3);
  const op = Math.min(1, (t - t0) / 0.1) * (1 - ip(t, t1 - 0.12, t1, 0, 1, Easing.linear));
  const lh = size * 1.22;
  const w = Math.max(...lines.map((l) => textW(l, size))) + 64;
  const h = lh * lines.length + size * 0.7;
  const bx = tail === "left" ? x - 40 : x - w + 40;
  const by = y - 46 - h;
  const tx = tail === "left" ? x + 26 : x - 26;
  return (
    <g opacity={op} transform={tf(x, y, sc)}>
      <path d={`M ${tx - 22} ${y - 50} L ${x} ${y} L ${tx + 22} ${y - 50} Z`} fill="#fffffa" stroke="#16161c" strokeWidth={5} strokeLinejoin="round" />
      <rect x={bx} y={by} width={w} height={h} rx={34} fill="#fffffa" stroke="#16161c" strokeWidth={5} />
      <path d={`M ${tx - 18} ${y - 54} L ${x} ${y - 8} L ${tx + 18} ${y - 54} Z`} fill="#fffffa" />
      {lines.map((l, i) => (
        <text key={i} x={bx + w / 2} y={by + size * 0.35 + lh * (i + 0.5)} fontFamily={FONT} fontWeight={600} fontSize={size}
          fill="#16161c" textAnchor="middle" dominantBaseline="central">
          {l}
        </text>
      ))}
    </g>
  );
};

/** Red rubber stamp that slams in at t0. */
export const Stamp: React.FC<{ x: number; y: number; text: string; t: number; t0: number; rot?: number; size?: number; color?: string }> = ({
  x, y, text, t, t0, rot = -10, size = 110, color = "#e0263a",
}) => {
  if (t < t0) return null;
  const sc = interpolate(t, [t0, t0 + 0.18], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const op = interpolate(t, [t0, t0 + 0.1], [0, 1], clamp);
  const w = textW(text, size) + 90;
  const h = size * 1.5;
  return (
    <g opacity={op} transform={tf(x, y, sc, rot)}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill="rgba(255,255,255,0.75)" stroke={color} strokeWidth={14} />
      <text x={x} y={y + 4} fontFamily={FONT} fontWeight={900} fontSize={size} fill={color} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  );
};

/** White card with an emoji and a label (+ optional ❌ / ✅ mark). */
export const IconCard: React.FC<{ x: number; y: number; e: string; label: string; t: number; t0: number; mark?: string }> = ({
  x, y, e, label, t, t0, mark,
}) => {
  if (t < t0) return null;
  const sc = pop(t, t0);
  return (
    <g transform={tf(x, y, sc)}>
      <rect x={x - 130} y={y - 140} width={260} height={280} rx={30} fill="#fffffc" stroke="#16161c" strokeWidth={5} />
      <Emoji x={x} y={y - 30} size={120} e={e} />
      <text x={x} y={y + 92} fontFamily={FONT} fontWeight={900} fontSize={38} fill="#16161c" textAnchor="middle">
        {label}
      </text>
      {mark ? <Emoji x={x + 105} y={y - 112} size={70} e={mark} scale={pop(t, t0 + 0.25)} /> : null}
    </g>
  );
};

/** Rounded label chip. */
export const Chip: React.FC<{ x: number; y: number; text: string; t: number; t0: number; bg?: string; fg?: string; size?: number }> = ({
  x, y, text, t, t0, bg = "#fffffc", fg = "#16161c", size = 52,
}) => {
  if (t < t0) return null;
  const w = textW(text, size) + 70;
  const h = size * 1.6;
  return (
    <g transform={tf(x, y, pop(t, t0))}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke="#16161c" strokeWidth={5} />
      <text x={x} y={y + 2} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={900} fontSize={size} fill={fg} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  );
};

export const Hearts: React.FC<{ cx: number; cy: number; t: number; n?: number; spread?: number; rise?: number; k?: number }> = ({
  cx, cy, t, n = 7, spread = 90, rise = 380, k = 1,
}) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const ph = (t * 0.45 + i / n) % 1;
      const x = cx + Math.sin(i * 2.1 + t) * spread;
      return <Emoji key={i} x={x} y={cy - ph * rise} size={i % 2 ? 54 : 40} e="❤️" opacity={(1 - ph) * k} />;
    })}
  </g>
);
