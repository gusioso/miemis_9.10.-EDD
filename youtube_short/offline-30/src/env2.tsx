import React from "react";
import { Easing, interpolate } from "remotion";
import { FLOOR, H, Room, W, Window } from "./env";
import { INK, shade } from "./Stick";

const st = (w = 6) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: "round" as const });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PRODUCTS = ["#e0463c", "#f2c84b", "#3f7fd6", "#3fae6a", "#ff7fb0", "#f08a24", "#8e5bd0", "#2fa3a0"];

/** Store shelves. stock 0..1 removes products from the front-most slots first (deterministic pattern). */
export const Shelves: React.FC<{ x: number; y: number; w: number; rows?: number; stock: number; seed?: number; tags?: string[]; tagCol?: string }> = ({
  x, y, w, rows = 4, stock, seed = 1, tags, tagCol = "#fff7cc",
}) => {
  const cols = Math.floor(w / 70);
  return (
    <g>
      <rect x={x} y={y} width={w} height={rows * 150 + 30} rx={10} fill="#d9d4c7" {...st(6)} />
      {[...Array(rows)].map((_, r) => (
        <g key={r}>
          <rect x={x + 10} y={y + 20 + r * 150} width={w - 20} height={130} fill="#efeadf" />
          {[...Array(cols)].map((__, c) => {
            const keep = ((c * 37 + r * 53 + seed * 11) % 100) / 100 < stock;
            if (!keep) return null;
            const col = PRODUCTS[(c + r * 3 + seed) % PRODUCTS.length];
            const h = 70 + ((c * 13 + r * 7) % 4) * 12;
            return <rect key={c} x={x + 22 + c * 70} y={y + 140 + r * 150 - h} width={52} height={h} rx={8} fill={col} {...st(4)} />;
          })}
          <rect x={x} y={y + 140 + r * 150} width={w} height={18} fill="#a9a293" {...st(4)} />
          {tags && tags[r] ? (
            <g>
              <rect x={x + w / 2 - 80} y={y + 132 + r * 150} width={160} height={46} rx={8} fill={tagCol} {...st(4)} />
              <text x={x + w / 2} y={y + 156 + r * 150} fontFamily="Inter" fontWeight={900} fontSize={32} fill={INK} textAnchor="middle" dominantBaseline="central">{tags[r]}</text>
            </g>
          ) : null}
        </g>
      ))}
    </g>
  );
};

export const Supermarket: React.FC<{ id: string; t: number; stock: number }> = ({ id, t, stock }) => (
  <g>
    <Room id={id} wall="#e9eef2" wall2="#d8e0e6" floor="#c9ccd2" lightX={1080} />
    <rect x={-400} y={60} width={W + 800} height={70} fill="#e0463c" />
    <text x={1080} y={110} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#fff" textAnchor="middle">FRESHMART · OPEN 24/7</text>
    {[...Array(6)].map((_, i) => <rect key={i} x={140 + i * 360} y={150} width={220} height={16} rx={8} fill="#fffbe6" opacity={0.9} />)}
    <Shelves x={60} y={260} w={860} stock={stock} seed={2} />
    <Shelves x={1240} y={260} w={860} stock={stock * 0.9} seed={5} />
    <text x={490} y={240} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#5b6270" textAnchor="middle">AISLE 3 · PASTA & RICE</text>
    <text x={1670} y={240} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#5b6270" textAnchor="middle">AISLE 4 · SNACKS</text>
    <rect x={-400} y={FLOOR - 4} width={W + 800} height={8} fill="#ffffff" opacity={0.4} />
    <g opacity={0.15 + 0.05 * Math.sin(t * 2)}>
      <rect x={940} y={180} width={280} height={FLOOR - 180} fill="#fff" />
    </g>
  </g>
);

export const Cart: React.FC<{ x: number; y: number; full?: number; s?: number }> = ({ x, y, full = 1, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {full > 0
      ? [...Array(Math.round(9 * full))].map((_, i) => (
        <rect key={i} x={-120 + (i % 5) * 50} y={-150 - Math.floor(i / 5) * 60 - (i % 2) * 14} width={46} height={64} rx={8} fill={PRODUCTS[i % 8]} {...st(4)} />
      ))
      : null}
    <path d="M -150 -110 L 140 -110 L 110 -10 L -120 -10 Z" fill="rgba(200,210,220,0.55)" {...st(6)} />
    <line x1={140} y1={-110} x2={190} y2={-170} stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <circle cx={-90} cy={20} r={18} fill={INK} />
    <circle cx={80} cy={20} r={18} fill={INK} />
  </g>
);

export const Car: React.FC<{ x: number; y: number; col?: string; s?: number; sport?: boolean; flip?: boolean }> = ({ x, y, col = "#e0463c", s = 1, sport = true, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={6} rx={260} ry={26} fill="#000" opacity={0.18} />
    {sport ? (
      <>
        <path d="M -250 -40 Q -250 -90 -170 -100 L -80 -150 Q 30 -175 120 -130 L 230 -95 Q 260 -80 255 -40 Z" fill={col} {...st(6)} />
        <path d="M -70 -140 Q 20 -160 100 -125 L 60 -100 L -90 -100 Z" fill="#cfe9f7" {...st(4)} />
      </>
    ) : (
      <>
        <rect x={-240} y={-110} width={480} height={80} rx={30} fill={col} {...st(6)} />
        <path d="M -150 -110 L -100 -190 L 110 -190 L 170 -110 Z" fill={shade(col, 1.1)} {...st(6)} />
        <rect x={-90} y={-178} width={80} height={60} fill="#cfe9f7" />
        <rect x={10} y={-178} width={100} height={60} fill="#cfe9f7" />
      </>
    )}
    <rect x={-250} y={-60} width={500} height={30} rx={12} fill={shade(col, 0.8)} {...st(5)} />
    <circle cx={-150} cy={-24} r={44} fill={INK} />
    <circle cx={-150} cy={-24} r={18} fill="#c9ccd2" />
    <circle cx={150} cy={-24} r={44} fill={INK} />
    <circle cx={150} cy={-24} r={18} fill="#c9ccd2" />
  </g>
);

export const Dealership: React.FC<{ id: string; t: number; cars: number; sold?: number }> = ({ id, t, cars }) => (
  <g>
    <Room id={id} wall="#e6edf3" wall2="#d3dde6" floor="#e9ecef" lightX={1080} light={0.25} />
    <rect x={-400} y={80} width={W + 800} height={110} fill="#16305e" />
    <text x={1080} y={150} fontFamily="Inter" fontWeight={900} fontSize={70} fill="#fff" textAnchor="middle" letterSpacing={10}>AUTOMAX MOTORS</text>
    <Window id={`${id}-w`} x={100} y={260} w={1960} h={420} sky={["#bfe3f6", "#eef7fb"]} t={t} kind="street" />
    {[0, 1, 2].map((i) => (i < cars ? <Car key={i} x={440 + i * 640} y={FLOOR + 20} col={["#e0463c", "#2f6fe0", "#f2c84b"][i]} s={0.85} /> : null))}
  </g>
);

export const Warehouse: React.FC<{ id: string; t: number }> = ({ id, t }) => (
  <g>
    <Room id={id} wall="#cfd4da" wall2="#b9c0c8" floor="#8f9399" lightX={1080} />
    {[...Array(5)].map((_, i) => (
      <g key={i}>
        <rect x={80 + i * 420} y={240} width={360} height={FLOOR - 240} fill="none" stroke="#e08a2b" strokeWidth={14} />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <line x1={80 + i * 420} y1={420 + r * 200} x2={440 + i * 420} y2={420 + r * 200} stroke="#e08a2b" strokeWidth={12} />
            {[0, 1].map((c) => <rect key={c} x={110 + i * 420 + c * 160} y={300 + r * 200} width={130} height={120} rx={6} fill="#c99a62" {...st(4)} />)}
          </g>
        ))}
      </g>
    ))}
    <rect x={-400} y={FLOOR - 120} width={W + 800} height={40} fill="#3a3d45" />
    {[...Array(14)].map((_, i) => (
      <rect key={i} x={((i * 220 + t * 0) % 2800) - 300} y={FLOOR - 180} width={110} height={60} rx={6} fill="#c99a62" {...st(4)} />
    ))}
  </g>
);

export const Truck: React.FC<{ x: number; y: number; s?: number; label?: string; flip?: boolean }> = ({ x, y, s = 1, label = "FRESHMART", flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={8} rx={360} ry={28} fill="#000" opacity={0.18} />
    <rect x={-340} y={-330} width={480} height={290} rx={14} fill="#fbfbf8" {...st(6)} />
    <text x={-100} y={-180} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#e0463c" textAnchor="middle" transform={flip ? "scale(-1 1) translate(200 0)" : undefined}>{label}</text>
    <path d="M 150 -240 L 270 -240 L 340 -150 L 340 -40 L 150 -40 Z" fill="#2f6fe0" {...st(6)} />
    <path d="M 175 -220 L 260 -220 L 310 -150 L 175 -150 Z" fill="#cfe9f7" {...st(4)} />
    <circle cx={-220} cy={-30} r={48} fill={INK} />
    <circle cx={-220} cy={-30} r={18} fill="#c9ccd2" />
    <circle cx={240} cy={-30} r={48} fill={INK} />
    <circle cx={240} cy={-30} r={18} fill="#c9ccd2" />
  </g>
);

/** Two-line graph drawn progressively (p 0..1). */
export const Graph: React.FC<{ x: number; y: number; w: number; h: number; p: number; lines: { col: string; pts: number[]; label: string }[]; title: string; xlabel?: [string, string] }> = ({
  x, y, w, h, p, lines, title, xlabel = ["DAY 1", "WEEK 1"],
}) => (
  <g>
    <rect x={x - 40} y={y - 120} width={w + 80} height={h + 220} rx={30} fill="#fffdf6" {...st(8)} />
    <text x={x + w / 2} y={y - 50} fontFamily="Inter" fontWeight={900} fontSize={56} fill={INK} textAnchor="middle">{title}</text>
    {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={x} y1={y + h * k} x2={x + w} y2={y + h * k} stroke="#e3dfd4" strokeWidth={4} />)}
    <line x1={x} y1={y} x2={x} y2={y + h} stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <text x={x} y={y + h + 60} fontFamily="Inter" fontWeight={800} fontSize={36} fill="#5b6270">{xlabel[0]}</text>
    <text x={x + w} y={y + h + 60} fontFamily="Inter" fontWeight={800} fontSize={36} fill="#5b6270" textAnchor="end">{xlabel[1]}</text>
    {lines.map((ln, li) => {
      const n = ln.pts.length - 1;
      const upto = p * n;
      const pts: [number, number][] = [];
      for (let i = 0; i <= Math.floor(upto); i++) pts.push([x + (w * i) / n, y + h - h * ln.pts[i]]);
      if (upto < n) {
        const i = Math.floor(upto);
        const f = upto - i;
        pts.push([x + (w * (i + f)) / n, y + h - h * (ln.pts[i] + (ln.pts[i + 1] - ln.pts[i]) * f)]);
      }
      const last = pts[pts.length - 1];
      return (
        <g key={li}>
          <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke={ln.col} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r={16} fill={ln.col} stroke={INK} strokeWidth={4} />
          <text x={last[0] + 30} y={last[1]} fontFamily="Inter" fontWeight={900} fontSize={40} fill={ln.col} dominantBaseline="central">{ln.label}</text>
        </g>
      );
    })}
  </g>
);

export const PriceTag: React.FC<{ x: number; y: number; item: string; price: string; t: number; t0: number; s?: number; hot?: boolean }> = ({ x, y, item, price, t, t0, s = 1, hot }) => {
  const flip = interpolate(t, [t0 - 0.12, t0, t0 + 0.12], [1, 0, 1], clamp);
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * (t > t0 - 0.12 && t < t0 + 0.12 ? flip : 1)})`}>
      <rect x={-170} y={-110} width={340} height={220} rx={24} fill={hot ? "#ffe8ea" : "#fff7cc"} {...st(7)} />
      <circle cx={-130} cy={-70} r={14} fill="#fff" {...st(4)} />
      <text x={0} y={-48} fontFamily="Inter" fontWeight={800} fontSize={42} fill="#5b6270" textAnchor="middle" dominantBaseline="central">{item}</text>
      <text x={0} y={36} fontFamily="Inter" fontWeight={900} fontSize={88} fill={hot ? "#c0182a" : INK} textAnchor="middle" dominantBaseline="central">{price}</text>
    </g>
  );
};

export const MoneyStack: React.FC<{ x: number; y: number; n: number; s?: number }> = ({ x, y, n, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[...Array(n)].map((_, i) => {
      const row = Math.floor(Math.sqrt(i * 2));
      const col = i - (row * (row + 1)) / 2;
      return (
        <g key={i} transform={`translate(${(col - row / 2) * 120} ${-row * 0 - i * 0})`}>
          <rect x={-55 + (col - row / 2) * 0} y={-40 - (Math.floor(i / 4)) * 34} width={110} height={34} rx={4} fill="#7cc576" stroke="#2f7d3c" strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

export const Apartments: React.FC<{ id: string; t: number; party: number }> = ({ id, t, party }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1={0} y1={0} x2={0} y2={1}>
        <stop offset="0" stopColor="#ffb98a" />
        <stop offset="1" stopColor="#ffe3c2" />
      </linearGradient>
    </defs>
    <rect x={-400} y={-300} width={W + 800} height={H + 600} fill={`url(#${id}-sky)`} />
    {[0, 1].map((b) => (
      <g key={b}>
        <rect x={140 + b * 1000} y={80} width={880} height={1300} fill={b ? "#e3a86b" : "#c9866a"} {...st(8)} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => (
          <g key={`${r}${c}`}>
            <rect x={200 + b * 1000 + c * 420} y={140 + r * 330} width={340} height={210} rx={8} fill={(r + c + b) % 2 ? "#fbe7a8" : "#dff1fb"} {...st(5)} />
            <rect x={180 + b * 1000 + c * 420} y={330 + r * 330} width={380} height={24} fill="#f7f1e6" {...st(4)} />
            {[...Array(6)].map((_, j) => <line key={j} x1={195 + b * 1000 + c * 420 + j * 66} y1={354 + r * 330} x2={195 + b * 1000 + c * 420 + j * 66} y2={410 + r * 330} stroke={INK} strokeWidth={5} />)}
          </g>
        )))}
      </g>
    ))}
    {party > 0
      ? [...Array(30)].map((_, i) => {
        const ph = (t * 0.45 + i / 30) % 1;
        return <rect key={i} x={(i * 173) % 2160} y={-40 + ph * 1300} width={16} height={28} fill={PRODUCTS[i % 8]}
          transform={`rotate(${t * 220 + i * 40} ${(i * 173) % 2160} ${-40 + ph * 1300})`} opacity={party} />;
      })
      : null}
  </g>
);

export const NewsDesk: React.FC<{ t: number; headline: string }> = ({ t, headline }) => (
  <g>
    <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#16305e" />
    {[...Array(7)].map((_, i) => <path key={i} d={`M ${200 + i * 300} -40 L ${120 + i * 300} 900 L ${280 + i * 300} 900 Z`} fill="#5ea0ff" opacity={0.08} />)}
    <circle cx={1580} cy={420} r={260} fill="#2b4f8f" stroke="#7fb3ff" strokeWidth={8} />
    <text x={1580} y={420} fontFamily="Noto Color Emoji" fontSize={260} textAnchor="middle" dominantBaseline="central">🌍</text>
    <rect x={300} y={720} width={1560} height={320} rx={20} fill="#0d1f40" stroke={INK} strokeWidth={8} />
    <rect x={0} y={1050} width={W} height={190} fill="#c0182a" />
    <rect x={0} y={1050} width={300} height={190} fill="#fff" />
    <text x={150} y={1145} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#c0182a" textAnchor="middle" dominantBaseline="central">BREAKING</text>
    <text x={330 + 40 * Math.sin(t * 0.3)} y={1145} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#fff" dominantBaseline="central">{headline}</text>
  </g>
);

/** Ease helper for growing numbers. */
export const grow = (t: number, a: number, b: number, from: number, to: number) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
