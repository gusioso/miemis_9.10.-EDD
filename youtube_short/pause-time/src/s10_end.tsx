import React from "react";
import { Easing } from "remotion";
import { Bakery, Street } from "./env";
import { MoneyStack, Shelves } from "./env2";
import { ALEX, BAKER, Bubble, Chip, H, P, Sparkles, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;

// ------------------------------------------------------------------ 10 · THE DISCOVERY and 11 · THE FINAL QUESTION (as sent by the user)
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

export const discover: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const stock = ip(t, E.improves, S.dur - 0.6, 0.15, 1, Easing.inOut(Easing.quad));
  const cA = cam(t, [[0, 1.4, 1100, 560], [E.compare, 1.55, 1100, 540]]);
  const cB = cam(t, [[E.compare - 0.3, 1.0, 1080, 620], [E.help, 1.05, 1080, 610]]);
  const cC = cam(t, [[E.help - 0.3, 1.2, 1200, 600], [E.improves, 1.2, 1100, 600]]);
  const cD = cam(t, [[E.improves - 0.3, 1.35, 1000, 560], [S.dur, 1.0, 1080, 620]]);
  const carry = ip(t, E.help + 0.5, E.help + 2.4);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.compare - 0.3, 0.4)}>
        <Bakery id="d-in" t={t} stock={0.15} warm={0.7} />
        <P t={t} x={1150} yf={FLOOR + 20} {...ALEX} arms={["down", "chin"]} expr="thinking" look={0.2} lookY={-0.3} seed={1} />
        <Bubble x={1270} y={520} lines={["💡"]} t={t} t0={1.2} think size={80} />
      </View>
      <View c={cB} op={shot(t, E.compare - 0.3, E.help - 0.3, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <rect x={140} y={120} width={880} height={940} rx={30} fill="#e6f9ee" stroke={INK} strokeWidth={8} />
        <rect x={1140} y={120} width={880} height={940} rx={30} fill="#fff3e0" stroke={INK} strokeWidth={8} />
        <text x={580} y={210} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#127a3e" textAnchor="middle">MONEY</text>
        <text x={1580} y={210} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#c75a28" textAnchor="middle">STUFF</text>
        {[...Array(5)].map((_, r) => [...Array(6 - r)].map((__, c) => {
          const show = t > E.compare + 0.2 + (r * 6 + c) * 0.05;
          return show ? <rect key={`${r}${c}`} x={580 - (6 - r) * 60 + c * 120 + 4} y={960 - r * 110 - 80} width={112} height={80} rx={8} fill="#7cc576" stroke="#2f7d3c" strokeWidth={5} /> : null;
        }))}
        <text x={580} y={290} fontFamily="Inter" fontWeight={900} fontSize={46} fill="#127a3e" textAnchor="middle">+ $8,100,000,000,000,000</text>
        {[[-90, 0], [0, 0], [90, 0], [-45, -46]].map(([dx, dy], i) => (
          <ellipse key={i} cx={1580 + dx} cy={990 + dy} rx={56} ry={26} fill="#d9934e" stroke={INK} strokeWidth={4} opacity={ip(t, E.compare + 0.6 + i * 0.1, E.compare + 0.8 + i * 0.1)} />
        ))}
        {[["🍞", "FOOD"], ["🏠", "HOUSES"], ["⏰", "TIME"]].map(([e, lab], i) => (
          <g key={i} opacity={ip(t, E.compare + 1.2 + i * 0.6, E.compare + 1.5 + i * 0.6)}>
            <text x={1300} y={420 + i * 220} fontFamily="Noto Color Emoji" fontSize={120} textAnchor="middle" dominantBaseline="central">{e}</text>
            <text x={1420} y={420 + i * 220} fontFamily="Inter" fontWeight={900} fontSize={64} fill={INK} dominantBaseline="central">{lab}</text>
            <text x={1960} y={420 + i * 220} fontFamily="Inter" fontWeight={900} fontSize={72} fill="#c0182a" textAnchor="end" dominantBaseline="central">+0</text>
          </g>
        ))}
      </View>
      <View c={cC} op={shot(t, E.help - 0.3, E.improves - 0.3, 0.4)}>
        <Bakery id="d-in2" t={t} stock={0.2} warm={0.8} />
        <P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={["hold", "hold"]} expr="warm" facing={1} look={1} seed={120} />
        {t < E.help + 0.5 ? (
          <P t={t} x={1850} yf={FLOOR + 20} {...ALEX} facing={-1} arms={["chest", "chest"]} expr="proud" look={-1} seed={1} />
        ) : (
          <P t={t} x={1850 - carry * 600} yf={FLOOR + 20} {...ALEX} facing={-1} walk={carry < 1 ? t * 7 : null} arms={["hold", "hold"]} hold="sack" expr="happy" look={-1} seed={1} />
        )}
        <Chip x={1700} y={330} text="💪 SLEEVES UP" t={t} t0={E.help - 0.1} t1={E.help + 0.9} size={40} />
        <Bubble x={1300} y={560} lines={["Supplier says:", "flour Tuesday!"]} t={t} t0={E.help + 2.0} tail="right" size={42} />
      </View>
      <View c={cD} op={shot(t, E.improves - 0.3, 1e9, 0.45)}>
        <Bakery id="d-in3" t={t} stock={stock} warm={1} />
        <P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={["down", "give"]} hold="bread" expr="laugh" facing={1} look={1} seed={120} />
        <P t={t} x={1000} yf={FLOOR - 140} {...ALEX} arms={["down", "give"]} hold="bread" expr="happy" facing={1} look={1} seed={1} />
        {[0, 1, 2].map((i) => {
          const tt = t - E.improves - 0.6 - i * 1.0;
          const x = 2300 - Math.max(0, tt) * 520;
          const back = x < 1500;
          return (
            <P key={i} t={t} x={back ? 1500 + (1500 - x) : x} yf={FLOOR + 20} u={0.9} outfit={["coat", "tee", "dress"][i] as "coat"} color={["#8e5bd0", "#3fae6a", "#ff7fb0"][i]}
              hair={["long", "cap", "bun"][i] as "long"} accent="#2f6fe0" facing={back ? 1 : -1} walk={t * 7 + i} arms={back ? ["down", "hold"] : ["down", "down"]}
              hold={back ? "bread" : null} expr="happy" seed={140 + i} />
          );
        })}
        <Sparkles cx={700} cy={300} t={t} n={8} r={300} k={ip(t, E.improves + 1, E.improves + 2)} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 11 · THE FINAL QUESTION
export const final: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const dark = ip(t, E.question - 0.4, E.final + 0.4, 0, 0.5);
  const cA = cam(t, [[0, 1.15, 1080, 600], [E.split, 1.3, 1100, 560]]);
  const cB = cam(t, [[E.split - 0.3, 1.05, 1080, 630], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.split - 0.3, 0.45)}>
        <Storefront t={t} inside={<BakeryInside t={t} stock={1} baker={<P t={t} x={700} yf={FLOOR - 140} {...BAKER} arms={["down", "wave"]} expr="laugh" seed={120} />} />} />
        <P t={t} x={1100} yf={FLOOR + 50} {...ALEX} arms={["down", "chin"]} expr="thinking" look={-0.3} lookY={-0.3} seed={1} />
        <Chip x={1100} y={385} text="🏦 $949,212.65" t={t} t0={0.6} bg="#e6f9ee" fg="#127a3e" size={46} />
      </View>
      <View c={cB} op={shot(t, E.split - 0.3, 1e9, 0.5)}>
        <defs><clipPath id="f-l"><rect x={-300} y={-300} width={1380} height={H + 600} /></clipPath><clipPath id="f-r"><rect x={1080} y={-300} width={1380} height={H + 600} /></clipPath></defs>
        <g clipPath="url(#f-l)">
          <rect x={-300} y={-300} width={1380} height={H + 600} fill="#3a4868" />
          <Shelves x={40} y={240} w={1000} rows={4} stock={0.04} seed={3} />
          <P t={t} x={540} yf={FLOOR + 40} {...ALEX} arms={["down", "hold"]} hold="bag" expr="sad" lookY={0.4} seed={1} />
          <MoneyStack x={300} y={FLOOR + 30} n={6} s={0.8} />
        </g>
        <g clipPath="url(#f-r)">
          <g transform="translate(1080 0) scale(0.5 1) translate(0 0)">
            <rect x={0} y={-300} width={2160} height={H + 600} fill="#f2cf9f" />
          </g>
          <g transform="translate(700 0)">
            <Bakery id="f-bk" t={t} stock={1} />
          </g>
          <P t={t} x={1350} yf={FLOOR - 140} {...BAKER} arms={["down", "give"]} hold="bread" expr="laugh" facing={1} look={1} seed={120} />
          <P t={t} x={1640} yf={FLOOR - 140} {...ALEX} arms={["down", "give"]} hold="bread" expr="happy" facing={1} look={1} seed={1} />
          <P t={t} x={1960} yf={FLOOR + 30} u={0.9} outfit="coat" color="#8e5bd0" hair="long" facing={-1} look={-1} expr="happy" arms={["down", "hold"]} seed={150} />
        </g>
        <line x1={1080} y1={-300} x2={1080} y2={H + 300} stroke="#fff" strokeWidth={8} opacity={0.85} />
        <Chip x={540} y={250} text="ALL THE MONEY" t={t} t0={E.split + 0.3} bg="#16161c" fg="#7dffb0" size={42} />
        <Chip x={1620} y={250} text="ALL THE BREAD" t={t} t0={E.split + 0.8} bg="#16161c" fg="#ffd38a" size={42} />
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#050712" opacity={dark} />
        {t >= E.final ? (
          <g transform={tf(1080, 600, pop(t, E.final, 0.5))}>
            <rect x={220} y={480} width={1720} height={240} rx={50} fill="#fffffb" stroke={INK} strokeWidth={10} />
            <text x={1080} y={606} fontFamily="Inter" fontWeight={900} fontSize={112} fill="#141419" textAnchor="middle" dominantBaseline="central">WOULD YOU STILL WORK?</text>
          </g>
        ) : null}
      </View>
    </>
  );
};

