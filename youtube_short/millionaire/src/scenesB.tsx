import React from "react";
import { Easing } from "remotion";
import { Bakery, Calendar, CoffeeCounter, CoffeeShop, Street } from "./env";
import { Cart, Graph, MoneyStack, PriceTag, Shelves, Truck, grow } from "./env2";
import { ALEX, BAKER, BOSS, Bubble, Chip, H, P, Sparkles, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK } from "./Stick";
import { money, type SceneFn } from "./scenesA";

const FLOOR = 1040;

// ------------------------------------------------------------------ 7 · THE REAL COST OF A MILLION DOLLARS
export const prices: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const a = E.climb;
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.raise - 2.0, 1.1, 1080, 600]]);
  const cB = cam(t, [[E.raise - 2.0, 1.0, 1080, 620], [E.alex, 1.05, 1080, 600]]);
  const cC = cam(t, [[E.alex - 0.3, 1.1, 1080, 600], [S.dur, 1.0, 1080, 620]]);
  const step = (v: string[], ts: number[]) => v[ts.filter((x) => t >= x).length];
  return (
    <>
      <View c={cA} op={shot(t, 0, E.raise - 2.0, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#f4efe4" />
        <PriceTag x={330} y={330} item="BREAD" price={step(["$3.20", "$4.10", "$5.60"], [a, a + 1.6])} t={t} t0={t < a + 1.6 ? a : a + 1.6} hot={t > a} />
        <PriceTag x={330} y={630} item="MILK" price={step(["$1.80", "$2.40", "$3.30"], [a + 0.4, a + 2.0])} t={t} t0={t < a + 2.0 ? a + 0.4 : a + 2.0} hot={t > a + 0.4} />
        <PriceTag x={330} y={930} item="EGGS" price={step(["$3.50", "$4.90", "$6.20"], [a + 0.8, a + 2.4])} t={t} t0={t < a + 2.4 ? a + 0.8 : a + 2.4} hot={t > a + 0.8} />
        <g transform="scale(0.72) translate(820 300)">
          <Graph x={300} y={160} w={1100} h={620} p={ip(t, a + 0.3, E.raise - 2.2)} title="Price of a weekly shop" xlabel={["DAY 1", "WEEK 3"]}
            lines={[{ col: "#e0463c", pts: [0.15, 0.2, 0.3, 0.45, 0.62, 0.8], label: "PRICES" }]} />
        </g>
      </View>
      <View c={cB} op={shot(t, E.raise - 2.0, E.alex - 0.3, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <g transform="translate(0 0)">
          <defs><clipPath id="pr-l"><rect x={0} y={0} width={1076} height={H} /></clipPath><clipPath id="pr-r"><rect x={1084} y={0} width={1076} height={H} /></clipPath></defs>
          <g clipPath="url(#pr-l)">
            <g transform="translate(-200 0)">
              <CoffeeShop t={t} id="pr-cafe" />
              <rect x={240} y={360} width={420} height={70} fill={t > E.raise ? "#ffe36b" : "transparent"} opacity={0.35} />
              <text x={720} y={210} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#ff6b6b" opacity={t > E.raise ? 1 : 0}>→ 7</text>
              <text x={720} y={290} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#ff6b6b" opacity={t > E.raise + 0.3 ? 1 : 0}>→ 9</text>
              <P t={t} x={640} yf={FLOOR} {...BOSS} arms={["down", "point"]} facing={-1} look={-1} lookY={-0.8} expr="worried" seed={90} />
              <CoffeeCounter t={t} />
              <P t={t} x={1150} yf={FLOOR + 20} u={0.95} outfit="coat" color="#8e5bd0" hair="long" facing={-1} look={-1} lookY={-0.6} expr={t > E.raise + 0.2 ? "shock" : "neutral"} seed={91} />
            </g>
          </g>
          <g clipPath="url(#pr-r)">
            <Street id="pr-st" t={t * 0.2} sky={["#d6c3b0", "#efe2d3"]} />
            <rect x={1200} y={FLOOR - 760} width={860} height={760} fill="#8fb6a8" stroke={INK} strokeWidth={8} />
            <text x={1630} y={FLOOR - 680} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#fff" textAnchor="middle">TOM'S SHOES</text>
            <rect x={1450} y={FLOOR - 520} width={360} height={520} fill="#5b3f2e" stroke={INK} strokeWidth={6} />
            {t > E.close ? (
              <g transform={tf(1630, FLOOR - 360, pop(t, E.close, 0.4))}>
                <line x1={1560} y1={FLOOR - 470} x2={1630} y2={FLOOR - 520} stroke={INK} strokeWidth={5} />
                <line x1={1700} y1={FLOOR - 470} x2={1630} y2={FLOOR - 520} stroke={INK} strokeWidth={5} />
                <rect x={1470} y={FLOOR - 470} width={320} height={200} rx={14} fill="#fffdf6" stroke={INK} strokeWidth={6} />
                <text x={1630} y={FLOOR - 410} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#c0182a" textAnchor="middle" dominantBaseline="central">CLOSED</text>
                <text x={1630} y={FLOOR - 340} fontFamily="Inter" fontWeight={800} fontSize={26} fill="#5b6270" textAnchor="middle" dominantBaseline="central">not enough staff</text>
              </g>
            ) : null}
          </g>
          <line x1={1080} y1={0} x2={1080} y2={H} stroke="#fff" strokeWidth={8} />
        </g>
      </View>
      <View c={cC} op={shot(t, E.alex - 0.3, 1e9, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#e9e4da" />
        <g transform={tf(1080, 220, pop(t, E.alex + 0.2))}>
          <rect x={700} y={140} width={760} height={160} rx={30} fill="#fff" stroke={INK} strokeWidth={6} />
          <text x={1080} y={222} fontFamily="Inter" fontWeight={900} fontSize={76} fill="#127a3e" textAnchor="middle" dominantBaseline="central">{money(949212.65)}</text>
        </g>
        {[0, 1].map((i) => {
          const x = 560 + i * 1040;
          const on = t > (i ? E.less - 1.6 : E.less - 2.6);
          return on ? (
            <g key={i} transform={tf(x, 740, pop(t, i ? E.less - 1.6 : E.less - 2.6))}>
              <rect x={x - 380} y={380} width={760} height={540} rx={30} fill={i ? "#ffe8ea" : "#e6f9ee"} stroke={INK} strokeWidth={6} />
              <text x={x} y={450} fontFamily="Inter" fontWeight={900} fontSize={54} fill={INK} textAnchor="middle">{i ? "WEEK 3" : "DAY 1"}</text>
              <text x={x} y={520} fontFamily="Inter" fontWeight={900} fontSize={46} fill={i ? "#c0182a" : "#127a3e"} textAnchor="middle">$100 buys:</text>
              <Cart x={x - 20} y={840} full={i ? 0.25 : 1} s={1.1} />
            </g>
          ) : null;
        })}
        <P t={t} x={1080} yf={FLOOR + 40} u={0.75} {...ALEX} arms={["down", "phone"]} hold="phone" expr={t > E.less - 1.4 ? "worried" : "happy"} look={t > E.less - 1.4 ? 0.8 : 0} seed={1} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 8 · A WORLD FULL OF MILLIONAIRES
export const month1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, 0.3, 1.0);
  const build = ip(t, E.factory, S.dur, 0.15, 1, Easing.linear);
  const sky = (Math.sin((t - E.factory) * 3) + 1) / 2;
  const cA = cam(t, [[0, 1.4, 1080, 620], [E.hiring, 1.5, 1080, 600]]);
  const cB = cam(t, [[E.hiring - 0.3, 1.0, 1080, 620], [E.factory, 1.05, 1080, 600]]);
  const cC = cam(t, [[E.factory - 0.3, 1.0, 1080, 620], [S.dur, 1.0, 1080, 640]]);
  const truckX = grow(t, E.trucks - 0.4, E.trucks + 2.4, -600, 2600);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.hiring - 0.3, 0.4)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#2c3352" />
        <Calendar x={1080} y={640} label={flip < 0.5 ? "WEEK 3" : "MONTH 1"} flip={flip} sub={flip < 0.5 ? "STILL WAITING" : "30 DAYS LATER"} />
      </View>
      <View c={cB} op={shot(t, E.hiring - 0.3, E.factory - 0.3, 0.4)}>
        <Street id="m1-st" t={t} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={120} y={FLOOR - 700} width={900} height={700} fill="#f2d7a6" stroke={INK} strokeWidth={8} />
        <path d={`M 100 ${FLOOR - 700} h 940 l -40 100 h -860 Z`} fill="#3fae6a" stroke={INK} strokeWidth={6} />
        <g transform={tf(470, FLOOR - 450, pop(t, E.hiring + 0.2) * (1 + 0.03 * Math.sin(t * 6)))}>
          <rect x={170} y={FLOOR - 560} width={600} height={240} rx={20} fill="#fffdf6" stroke={INK} strokeWidth={6} />
          <text x={470} y={FLOOR - 490} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#1d7a44" textAnchor="middle" dominantBaseline="central">NOW HIRING!</text>
          <text x={470} y={FLOOR - 400} fontFamily="Inter" fontWeight={900} fontSize={66} fill="#16161c" textAnchor="middle" dominantBaseline="central">$95 / HOUR</text>
        </g>
        <P t={t} x={900} yf={FLOOR + 20} outfit="shopApron" color="#f4f1ea" accent="#3fae6a" hair="bald" mustache arms={["wave", "down"]} expr="happy" facing={1} seed={100} />
        <rect x={1180} y={FLOOR - 640} width={880} height={640} fill="#b48ec2" stroke={INK} strokeWidth={8} />
        <text x={1620} y={FLOOR - 560} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#fff" textAnchor="middle">LUIGI'S DINER</text>
        <rect x={1300} y={FLOOR - 470} width={640} height={300} fill="#6b5b70" stroke={INK} strokeWidth={6} />
        {t > E.closed ? (
          <g opacity={ip(t, E.closed, E.closed + 0.3)}>
            {[0, 1, 2].map((i) => <rect key={i} x={1280} y={FLOOR - 450 + i * 90} width={680} height={50} fill="#b07c52" stroke={INK} strokeWidth={5} transform={`rotate(${(i - 1) * 6} 1620 ${FLOOR - 425 + i * 90})`} />)}
            <Chip x={1620} y={FLOOR - 90} text="CLOSED FOR GOOD" t={t} t0={E.closed} bg="#ffe8ea" fg="#c0182a" size={40} />
          </g>
        ) : null}
      </View>
      <View c={cC} op={shot(t, E.factory - 0.3, 1e9, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill={sky > 0.5 ? "#a7dcf6" : "#5d6c9e"} />
        <circle cx={300 + ((t - E.factory) * 500) % 1800} cy={200 + Math.abs(Math.sin((t - E.factory) * 1.7)) * 100} r={60} fill={sky > 0.5 ? "#fff2a8" : "#f4f1e6"} />
        <rect x={-300} y={FLOOR - 40} width={W + 600} height={400} fill="#9c9488" />
        <rect x={500} y={FLOOR - 40 - 620 * build} width={1100} height={620 * build} fill="#c9ccd2" stroke={INK} strokeWidth={8} />
        {[...Array(Math.floor(build * 4))].map((_, r) => [0, 1, 2, 3, 4].map((c) => (
          <rect key={`${r}${c}`} x={560 + c * 210} y={FLOOR - 140 - r * 150} width={140} height={80} fill="#9fd0ff" stroke={INK} strokeWidth={4} />
        )))}
        <line x1={1780} y1={FLOOR - 40} x2={1780} y2={160} stroke="#f2c84b" strokeWidth={30} />
        <line x1={1780} y1={170} x2={1200 + Math.sin(t) * 60} y2={170} stroke="#f2c84b" strokeWidth={24} />
        <line x1={1200 + Math.sin(t) * 60} y1={170} x2={1200 + Math.sin(t) * 60} y2={FLOOR - 60 - 620 * build} stroke={INK} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <P key={i} t={t} x={620 + i * 400} yf={FLOOR - 40} u={0.55} outfit="tee" color="#f08a24" hair="cap" accent="#f2c84b" arms={["hold", "down"]} hold="box"
            expr="neutral" walk={t * 9 + i} facing={i % 2 ? -1 : 1} seed={110 + i} />
        ))}
        <Truck x={truckX} y={FLOOR + 140} s={0.6} label="DELIVERY" />
        <Chip x={1080} y={110} text="NEW FACTORY · 61% BUILT" t={t} t0={E.factory + 0.4} t1={E.trucks - 0.3} bg="#16161c" fg="#ffe36b" size={42} />
        <Chip x={1080} y={110} text={`ORDERS WAITING: ${Math.round(grow(t, E.trucks, S.dur, 48120, 47300)).toLocaleString("en-US")}`} t={t} t0={E.trucks} bg="#16161c" fg="#ff8a6b" size={42} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 9 · A SMALL BAKERY
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
  const ax = grow(t, 0, E.memory - 0.4, -150, 820);
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.memory, 1.1, 1000, 600]]);
  const cB = cam(t, [[E.memory - 0.2, 1.05, 1080, 620], [E.inside, 1.12, 1080, 600]]);
  const cC = cam(t, [[E.inside - 0.3, 1.0, 1080, 620], [E.empty, 1.25, 900, 560], [E.flour, 1.25, 900, 560], [S.dur, 1.5, 760, 520]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.memory - 0.2, 0.4)}>
        <Storefront t={t} inside={<BakeryInside t={t} stock={0.15} />} />
        <P t={t} x={ax} yf={FLOOR + 50} {...ALEX} facing={1} walk={t < E.memory - 0.4 ? t * 7 : null} look={t > E.memory - 1.2 ? -0.6 : 0.6} expr="neutral" seed={1} />
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
        <Bakery id="bk-now" t={t} stock={0.15} warm={0.6} />
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

// ------------------------------------------------------------------ 10 · THE DISCOVERY
export const discover: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const stock = ip(t, E.improves, S.dur - 0.6, 0.15, 1, Easing.inOut(Easing.quad));
  const cA = cam(t, [[0, 1.4, 1100, 560], [E.compare, 1.55, 1100, 540]]);
  const cB = cam(t, [[E.compare - 0.3, 1.0, 1080, 620], [E.help, 1.05, 1080, 610]]);
  const cC = cam(t, [[E.help - 0.3, 1.2, 1200, 600], [E.improves, 1.2, 1100, 600]]);
  const cD = cam(t, [[E.improves - 0.3, 1.35, 1000, 560], [S.dur, 1.0, 1080, 620]]);
  const carry = ip(t, E.help, E.help + 2.2);
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
        <P t={t} x={2050 - carry * 800} yf={FLOOR + 20} {...ALEX} facing={-1} walk={carry < 1 ? t * 7 : null} arms={["hold", "hold"]} hold="sack" expr="happy" look={-1} seed={1} />
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
        <Chip x={1100} y={385} text="🏦 $948,912" t={t} t0={0.6} bg="#e6f9ee" fg="#127a3e" size={46} />
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
        <Chip x={540} y={130} text="ALL THE MONEY" t={t} t0={E.split + 0.3} bg="#16161c" fg="#7dffb0" size={42} />
        <Chip x={1620} y={130} text="ALL THE BREAD" t={t} t0={E.split + 0.8} bg="#16161c" fg="#ffd38a" size={42} />
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

