import React from "react";
import { Bakery, Street } from "./env";
import { grow } from "./env2";
import { ALEX, BAKER, Bubble, Chip, H, P, View, W, cam, shot } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;

// ------------------------------------------------------------------ 9 · A SMALL BAKERY (as sent by the user)
const Storefront: React.FC<{ t: number; inside: React.ReactNode; warm?: number }> = ({ t, inside, warm = 1 }) => (
  <g>
    <Street id="bk-st" t={t * 0.4} sky={["#e9b98e", "#f6dcc0"]} />
    <rect x={260} y={140} width={1640} height={FLOOR - 140} fill="#c25a44" stroke={INK} strokeWidth={8} />
    <path d="M 230 300 h 1700 l -60 120 h -1580 Z" fill="#f08a24" stroke={INK} strokeWidth={6} />
    {[...Array(9)].map((_, i) => <path key={i} d={`M ${290 + i * 180} 420 q 90 60 180 0`} fill="#fff4e6" stroke={INK} strokeWidth={4} />)}
    <rect x={560} y={170} width={1040} height={110} rx={16} fill="#fff7ea" stroke={INK} strokeWidth={6} />
    <text x={1080} y={226} fontFamily="Inter" fontWeight={900} fontSize={70} fill="#c75a28" textAnchor="middle" dominantBaseline="central">ROSE'S BAKERY</text>
    <defs><clipPath id="bk-glass"><rect x={380} y={470} width={1040} height={500} /></clipPath></defs>
    <g clipPath="url(#bk-glass)">
      <rect x={380} y={470} width={1040} height={500} fill="#ffe2b0" />
      <g transform="translate(380 470) scale(0.48) translate(0 -200)">{inside}</g>
      <rect x={380} y={470} width={1040} height={500} fill="#ffcf7a" opacity={0.12 * warm} />
      <path d={`M ${500 + (t * 60) % 300} 470 l 120 0 l -200 500 l -120 0 Z`} fill="#fff" opacity={0.16} />
    </g>
    <rect x={380} y={470} width={1040} height={500} fill="none" stroke={INK} strokeWidth={10} />
    <rect x={1520} y={470} width={280} height={FLOOR - 470} fill="#7a4f33" stroke={INK} strokeWidth={8} />
    <rect x={1550} y={510} width={220} height={200} fill="#ffe2b0" stroke={INK} strokeWidth={5} />
    <text x={1660} y={790} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#fff7ea" textAnchor="middle">OPEN</text>
  </g>
);

const BakeryInside: React.FC<{ t: number; stock: number; baker?: React.ReactNode }> = ({ t, stock, baker }) => (
  <g>
    <Bakery id="bk-in" t={t} stock={stock} />
    {baker ?? <P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={["down", "down"]} expr="worried" seed={120} />}
  </g>
);

export const bakery: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const ax = grow(t, 0, E.memory - 1.2, -150, 820);
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.memory - 1.4, 1.1, 1000, 600], [E.memory + 0.2, 1.75, 900, 700]]);
  const cB = cam(t, [[E.memory - 0.2, 1.05, 1080, 620], [E.inside, 1.12, 1080, 600]]);
  const cC = cam(t, [[E.inside - 0.3, 1.0, 1080, 620], [E.empty, 1.25, 900, 560], [E.explain, 1.3, 900, 540], [E.flour + 0.2, 1.12, 1180, 600], [E.flour + 1.8, 1.12, 1180, 600], [S.dur, 1.75, 1240, 470]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.memory - 0.2, 0.4)}>
        <Storefront t={t} inside={<BakeryInside t={t} stock={0.15} />} />
        <P t={t} x={ax} yf={FLOOR + 50} {...ALEX} facing={1} walk={t < E.memory - 1.2 ? t * 7 : null} look={t > E.memory - 1.2 ? -0.6 : 0.6} expr="neutral" seed={1} />
      </View>
      <View c={cB} op={shot(t, E.memory - 0.2, E.inside - 0.3, 0.4)}>
        <g>
          <BakeryInside t={t} stock={1} baker={<P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={["down", "give"]} expr="laugh" seed={120} />} />
          {[0, 1, 3].map((i) => (
            <P key={i} t={t} x={1250 + i * 230} yf={FLOOR + 20} u={0.85} outfit={["coat", "tee", "hoodie", "dress"][i] as "coat"} color={["#8e5bd0", "#e0463c", "#2f6fe0", "#ff7fb0"][i]}
              hair={["long", "cap", "alex", "bun"][i] as "long"} accent="#2f6fe0" facing={-1} look={-1} expr="happy" seed={130 + i} />
          ))}
          <P t={t} x={1710} yf={FLOOR + 20} u={0.85} {...ALEX} facing={-1} look={-1} expr="happy" arms={["down", "hold"]} hold="bread" seed={1} />
          <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#a8783d" opacity={0.28} />
          <Chip x={1080} y={110} text="BEFORE" t={t} t0={E.memory} bg="#fff7ea" fg="#8a5a3a" size={48} />
        </g>
      </View>
      <View c={cC} op={shot(t, E.inside - 0.3, 1e9, 0.4)}>
        <Bakery id="bk-now" t={t} stock={0.22} warm={0.6} />
        <rect x={1380} y={FLOOR - 300} width={420} height={40} rx={8} fill="#8a5a3a" stroke={INK} strokeWidth={5} />
        <rect x={1420} y={FLOOR - 270} width={70} height={40} rx={10} fill="#efe6d2" stroke={INK} strokeWidth={4} />
        <path d={`M 1520 ${FLOOR - 262} q 60 -20 120 0 l 0 30 l -120 0 Z`} fill="#efe6d2" stroke={INK} strokeWidth={4} opacity={0.8} />
        <text x={1590} y={FLOOR - 330} fontFamily="Inter" fontWeight={900} fontSize={32} fill="#8a5a3a" textAnchor="middle">FLOUR</text>
        <P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={t > E.flour ? ["down", "point"] : ["chest", "down"]} facing={1} look={1} expr={t > E.explain ? "sad" : "worried"}
          talk={t > E.explain && t < E.explain + 3.2} seed={120} />
        <P t={t} x={grow(t, E.inside, E.inside + 1.6, 2300, 1250)} yf={FLOOR + 20} {...ALEX} facing={-1} walk={t < E.inside + 1.6 ? t * 7 : null} look={-1}
          expr={t > E.empty ? "worried" : "neutral"} seed={1} />
        <Bubble x={820} y={430} lines={["Flour costs 3× more...", "and the truck didn't come."]} t={t} t0={E.explain + 0.2} size={40} />
      </View>
    </>
  );
};

