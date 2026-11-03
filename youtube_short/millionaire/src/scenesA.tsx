import React from "react";
import { Easing } from "remotion";
import { BigPhone, Bed, Calendar, Frame, LyingHead, Panel, Plant, Room, Sofa, Street, TVSet, Window } from "./env";
import { Apartments, Car, Cart, Dealership, Graph, NewsDesk, Supermarket, Truck, Warehouse, grow } from "./env2";
import { ALEX, Bubble, Chip, H, JAKE, MANAGER, P, Ring, Sparkles, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK, MiddlePart, Stick } from "./Stick";

export type SceneData = { id: string; dur: number; ev: Record<string, number>; L: number[]; Le: number[] };
export type SceneFn = (p: { S: SceneData; t: number }) => React.ReactNode;
const FLOOR = 1040;

export const money = (n: number, cents = true) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

// ------------------------------------------------------------------ shared bits
const BedRoom: React.FC<{ t: number; id: string; expr: React.ComponentProps<typeof LyingHead>["expr"]; look?: number; clock?: string; reach?: number; vib?: number }> = ({
  t, id, expr, look = 0, clock = "7:00", reach = 0, vib = 0,
}) => {
  const hx = 760;
  const hy = FLOOR - 372;
  const px = 380 + Math.sin(t * 70) * 6 * vib;
  return (
    <g>
      <Room id={id} wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" lightX={900} />
      <Window id={`${id}-w`} x={1320} y={150} w={560} h={400} sky={["#ffd9a8", "#fff3dc"]} t={t} kind="trees" curtain="#f4b9a4" />
      <Frame x={560} y={190} w={240} h={190} art="#f3c37b" />
      <rect x={150} y={FLOOR - 260} width={380} height={260} rx={14} fill="#a6774f" stroke={INK} strokeWidth={6} />
      <rect x={190} y={FLOOR - 340} width={150} height={80} rx={12} fill="#1d1d26" stroke={INK} strokeWidth={5} />
      <text x={265} y={FLOOR - 299} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#ff6b5b" textAnchor="middle" dominantBaseline="central">{clock}</text>
      <rect x={px} y={FLOOR - 290} width={110} height={30} rx={8} fill="#1c1c26" stroke="#9a9aae" strokeWidth={3} transform={`rotate(${Math.sin(t * 60) * 3 * vib} ${px + 55} ${FLOOR - 275})`} />
      {vib > 0 ? [0, 1].map((i) => (
        <path key={i} d={`M ${px + 120 + i * 24} ${FLOOR - 310} q 14 15 0 30`} fill="none" stroke="#2f6fe0" strokeWidth={6} strokeLinecap="round" opacity={vib * (0.5 + 0.5 * Math.sin(t * 20 + i))} />
      )) : null}
      {vib > 0 ? <ellipse cx={px + 55} cy={FLOOR - 290} rx={120} ry={60} fill="#9fd0ff" opacity={0.2 * vib} /> : null}
      <Bed x={580} w={1280} />
      {reach > 0 ? (
        <polyline points={`${hx - 100},${FLOOR - 300} ${hx - 210 + 30 * (1 - reach)},${FLOOR - 330} ${px + 70 + (1 - reach) * 160},${FLOOR - 300}`}
          fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      <LyingHead x={hx} y={hy} t={t} expr={expr} look={look} />
    </g>
  );
};

const BankScreen: React.FC<{ t: number; t0: number; from: number; to: number; banner?: number }> = ({ t, t0, from, to, banner = -1 }) => (
  <g>
    <rect x={826} y={66} width={508} height={140} fill="#127a3e" />
    <text x={1080} y={150} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#fff" textAnchor="middle">NovaBank</text>
    <text x={1080} y={300} fontFamily="Inter" fontWeight={700} fontSize={36} fill="#6b6f7c" textAnchor="middle">Available balance</text>
    <text x={1080} y={400} fontFamily="Inter" fontWeight={900} fontSize={70} fill="#16161c" textAnchor="middle" dominantBaseline="central">
      {money(grow(t, t0, t0 + 1.2, from, to))}
    </text>
    {banner >= 0 && t > banner ? (
      <g transform={tf(1080, 560, pop(t, banner))}>
        <rect x={850} y={500} width={460} height={130} rx={26} fill="#e6f9ee" stroke="#127a3e" strokeWidth={5} />
        <text x={1080} y={545} fontFamily="Inter" fontWeight={800} fontSize={32} fill="#127a3e" textAnchor="middle" dominantBaseline="central">Deposit received</text>
        <text x={1080} y={595} fontFamily="Inter" fontWeight={900} fontSize={42} fill="#127a3e" textAnchor="middle" dominantBaseline="central">+$1,000,000.00</text>
      </g>
    ) : null}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={870} y={700 + i * 90} width={420} height={70} rx={14} fill="#eef1f7" />
        <text x={890} y={735 + i * 90} fontFamily="Inter" fontWeight={700} fontSize={30} fill="#5b6270" dominantBaseline="central">{["Pizza Palace", "Bus pass", "FreshMart"][i]}</text>
        <text x={1270} y={735 + i * 90} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#16161c" textAnchor="end" dominantBaseline="central">{["-$14.20", "-$2.75", "-$31.08"][i]}</text>
      </g>
    ))}
  </g>
);

const PlusChip: React.FC<{ x: number; y: number; t: number; t0: number; s?: number }> = ({ x, y, t, t0, s = 1 }) =>
  t < t0 ? null : (
    <g transform={tf(x, y, pop(t, t0) * s)}>
      <rect x={x - 150} y={y - 40} width={300} height={80} rx={40} fill="#e6f9ee" stroke="#127a3e" strokeWidth={5} />
      <text x={x} y={y + 2} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#127a3e" textAnchor="middle" dominantBaseline="central">+$1,000,000</text>
    </g>
  );

// ------------------------------------------------------------------ 1 · THE IMPOSSIBLE NOTIFICATION
export const notify: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const expr = t < E.clock + 0.3 ? "sleep" : t < E.million - 0.6 ? "open" : "shock";
  const vib = t > E.vib && t < E.reach + 0.6 ? 1 : 0;
  const cA = cam(t, [[0, 1.15, 1000, 600], [E.clock, 1.5, 620, 640], [E.reach, 1.9, 520, 700], [E.million, 2.3, 450, 740]]);
  const cB = cam(t, [[E.million - 0.4, 1.15, 1080, 560], [E.million + 1.4, 1.35, 1080, 460], [E.world, 1.35, 1080, 460]]);
  const cC = cam(t, [[E.world - 0.2, 1.0, 1080, 620], [E.everyone, 1.05, 1080, 600]]);
  const cD = cam(t, [[E.everyone - 0.2, 1.25, 1080, 560], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.million - 0.45, 0.4)}>
        <BedRoom t={t} id="n-bed" expr={expr} look={t > E.reach ? -0.8 : 0} clock={t < E.clock ? "6:59" : "7:00"} reach={ip(t, E.reach, E.reach + 0.6)} vib={vib} />
      </View>
      <View c={cB} op={shot(t, E.million - 0.45, E.world - 0.25, 0.4)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#bcd3e3" />
        <BigPhone x={1080} y={600} w={620} h={1080}>
          <BankScreen t={t} t0={E.million} from={83.47} to={1000083.47} banner={E.million - 0.2} />
        </BigPhone>
        <MiddlePart x={330} y={1080} u={230 / 80} layer="back" />
        <circle cx={330} cy={1080} r={230} fill={INK} />
        <MiddlePart x={330} y={1080} u={230 / 80} layer="front" />
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={330 + s * 80} cy={1010} rx={56} ry={66} fill="#fff" />
            <circle cx={330 + s * 80 + 18} cy={990} r={20} fill={INK} />
            <line x1={330 + s * 80 - 40} y1={900} x2={330 + s * 80 + 40} y2={900} stroke="#e9e9ee" strokeWidth={14} strokeLinecap="round" />
          </g>
        ))}
        <Sparkles cx={1080} cy={400} t={t} n={10} r={320} k={ip(t, E.million + 0.8, E.million + 1.4)} />
      </View>
      <View c={cC} op={shot(t, E.world - 0.25, E.everyone - 0.25, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <Panel x={70} y={110} w={640} h={900} id="n-p1" bg="#cfe0ec" op={ip(t, E.friends - 0.6, E.friends - 0.3)}>
          <rect x={70} y={110} width={640} height={900} fill="#d7e4ee" />
          <rect x={70} y={860} width={640} height={150} fill="#b88b63" />
          <P t={t} x={390} yf={FLOOR - 30} {...JAKE} arms={["cheer", "phoneUp"]} hold="phone" expr="laugh" bob={Math.abs(Math.sin(t * 7)) * 30} seed={3} />
          <PlusChip x={390} y={250} t={t} t0={E.friends} s={0.9} />
        </Panel>
        <Panel x={760} y={110} w={640} h={900} id="n-p2" bg="#f2d7a6" op={ip(t, E.neighbors - 0.3, E.neighbors)}>
          <rect x={760} y={110} width={640} height={900} fill="#f2d7a6" />
          <rect x={760} y={760} width={640} height={30} fill="#f7f1e6" />
          {[...Array(8)].map((_, j) => <line key={j} x1={780 + j * 80} y1={790} x2={780 + j * 80} y2={880} stroke={INK} strokeWidth={6} />)}
          <P t={t} x={1080} yf={FLOOR - 120} u={0.95} outfit="cardigan" color="#8e5bd0" hair="bun" glasses arms={["chest", "phone"]} hold="phone" expr="shock" seed={4} />
          <PlusChip x={1080} y={250} t={t} t0={E.neighbors} s={0.9} />
        </Panel>
        <Panel x={1450} y={110} w={640} h={900} id="n-p3" bg="#ffd9a8" op={ip(t, E.pizza - 0.5, E.pizza - 0.2)}>
          <Street id="n-st" t={t} sky={["#ffd9a8", "#fff1dc"]} />
          <P t={t} x={1770} yf={FLOOR} outfit="tee" color="#e0463c" hair="cap" accent="#e0463c" arms={["hold", "phone"]} hold="phone" expr="shock" seed={5} />
          <rect x={1660} y={FLOOR - 400} width={160} height={40} rx={6} fill="#f2c84b" stroke={INK} strokeWidth={5} />
          <text x={1740} y={FLOOR - 378} fontFamily="Inter" fontWeight={900} fontSize={22} fill="#c0182a" textAnchor="middle" dominantBaseline="central">PIZZA</text>
          <PlusChip x={1770} y={250} t={t} t0={E.pizza} s={0.9} />
        </Panel>
      </View>
      <View c={cD} op={shot(t, E.everyone - 0.25, 1e9, 0.4)}>
        <Street id="n-st2" t={t} sky={["#ffd9a8", "#fff1dc"]} px={(cD[1] - 1080) * -1} />
        {[...Array(8)].map((_, i) => {
          const x = 150 + i * 265;
          return (
            <g key={i}>
              <P t={t} x={x} yf={FLOOR + (i % 2) * 40} u={0.8} outfit={["tee", "coat", "suit", "hoodie", "dress", "cardigan", "tee", "hoodie"][i] as "tee"}
                color={["#e0463c", "#8e5bd0", "#5b6270", "#f2c84b", "#ff7fb0", "#c0703a", "#3fae6a", "#2fa3a0"][i]}
                hair={["short", "long", "slick", "curly", "bun", "bald", "cap", "short"][i] as "short"} accent="#2f6fe0"
                arms={["down", "phoneUp"]} hold="phone" expr={i % 3 ? "shock" : "laugh"} seed={10 + i} />
              <PlusChip x={x} y={360 + (i % 2) * 40} t={t} t0={E.everyone + 0.15 + i * 0.12} s={0.62} />
            </g>
          );
        })}
        <Chip x={1080} y={150} text="🌍 8,100,000,000 MILLIONAIRES" t={t} t0={E.everyone + 1.3} bg="#16161c" fg="#7dffb0" size={46} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 2 · THE BEST MORNING EVER
export const morning: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const nref = Math.min(5, t < E.refresh ? 0 : 1 + Math.floor((t - E.refresh) / 0.34));
  const cA = cam(t, [[0, 1.2, 1000, 580], [E.still, 1.35, 1100, 560]]);
  const walkK = ip(t, E.news - 0.3, E.news + 1.2, 0, 1, Easing.out(Easing.quad));
  const cB = cam(t, [[E.news - 0.3, 1.0, 1080, 620], [E.confirm, 1.0, 1080, 620], [E.party - 0.3, 1.6, 1520, 420]]);
  const cC = cam(t, [[E.party - 0.3, 1.25, 1080, 560], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.news - 0.3, 0.4)}>
        <Room id="m-room" wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" />
        <Window id="m-w" x={1320} y={150} w={560} h={400} sky={["#ffe2b8", "#fff6e3"]} t={t} kind="trees" curtain="#f4b9a4" />
        <Bed x={300} w={900} />
        <P t={t} x={760} yf={FLOOR - 40} sit {...ALEX} arms={["down", "phone"]} hold="phone" lookY={0.6}
          expr={t < E.still ? "confused" : "laugh"} seed={1} bob={t > E.still ? Math.abs(Math.sin(t * 8)) * 12 : 0} />
        {nref > 0 ? <Chip x={1245} y={650} text={`↻ REFRESH ×${nref}`} t={t} t0={E.refresh} size={46} /> : null}
        <g transform={tf(1240, 470, pop(t, 0.3))}>
          <rect x={1010} y={380} width={470} height={180} rx={30} fill="#fff" stroke={INK} strokeWidth={6} />
          <text x={1245} y={430} fontFamily="Inter" fontWeight={700} fontSize={32} fill="#6b6f7c" textAnchor="middle" dominantBaseline="central">NovaBank balance</text>
          <text x={1245} y={500} fontFamily="Inter" fontWeight={900} fontSize={50} fill="#127a3e" textAnchor="middle" dominantBaseline="central">$1,000,083.47</text>
        </g>
        <Ring x={1245} y={470} t={t} t0={E.still} r={130} col="#127a3e" />
      </View>
      <View c={cB} op={shot(t, E.news - 0.3, E.party - 0.3, 0.4)}>
        <Room id="m-liv" wall="#e6c9a3" wall2="#d8b58a" floor="#8a6446" wains="#c99c6b" />
        <TVSet x={1180} y={180} w={760} h={440} id="m-tv">
          <g transform={`translate(1180 180) scale(${760 / W} ${440 / H})`}>
            <NewsDesk t={t} headline="EVERYONE ON EARTH IS A MILLIONAIRE" />
          </g>
        </TVSet>
        <Sofa x={200} w={760} />
        <P t={t} x={lerpN(-200, 1000, walkK)} yf={FLOOR + 20} {...ALEX} walk={walkK < 1 ? t * 9 : null} facing={1} look={1} lookY={-0.4}
          expr={t > E.confirm ? "shock" : "happy"} arms={t > E.confirm + 0.4 ? ["cheer", "cheer"] : ["down", "down"]} seed={1} />
      </View>
      <View c={cC} op={shot(t, E.party - 0.3, 1e9, 0.4)}>
        <Apartments id="m-apt" t={t} party={ip(t, E.party, E.party + 0.6)} />
        {[[420, 0], [760, 1], [1260, 0], [1700, 2], [520, 2], [1440, 1]].map(([x, r], i) => (
          <P key={i} t={t} x={x} yf={350 + r * 330} u={0.42} outfit={["tee", "dress", "hoodie", "coat", "suit", "tee"][i] as "tee"}
            color={["#e0463c", "#ff7fb0", "#f2c84b", "#2fa3a0", "#5b6270", "#8e5bd0"][i]} hair={["short", "long", "curly", "bun", "slick", "cap"][i] as "short"}
            arms={["cheer", "cheer"]} expr="laugh" bob={Math.abs(Math.sin(t * 7 + i)) * 20} seed={20 + i} shadow={false} />
        ))}
      </View>
    </>
  );
};
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ 3 · EVERYONE STARTS SPENDING
export const spend: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.05, 1080, 620], [E.cars - 0.6, 1.15, 1080, 580]]);
  const cB = cam(t, [[E.cars - 0.6, 1.0, 1080, 620], [E.alex, 1.03, 1080, 610]]);
  const cC = cam(t, [[E.alex - 0.2, 1.1, 1080, 600], [E.buy, 1.4, 1240, 500], [E.queue, 1.3, 1100, 560]]);
  const cD = cam(t, [[E.queue - 0.3, 1.2, 1300, 600], [S.dur, 1.0, 1080, 620]]);
  const bought = t > E.buy;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.cars - 0.6, 0.4)}>
        <Street id="s-st" t={t} sky={["#a7dcf6", "#eaf6fb"]} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <P t={t} x={330 + i * 500} yf={FLOOR + 20} u={0.9} outfit={["suit", "coat", "tee", "hoodie"][i] as "suit"} color={["#5b6270", "#ff7fb0", "#e0463c", "#f2c84b"][i]}
              hair={["slick", "long", "cap", "curly"][i] as "slick"} accent="#2f6fe0" arms={["down", "phone"]} hold="phone" lookY={0.5} expr="happy" seed={30 + i} />
            <Bubble x={330 + i * 500 + 110} y={560} lines={[["🚗 + 🏠", "👗 + 💍", "🏝️ + 🛥️", "🎮 + 🚗"][i]]} t={t} t0={0.5 + i * 0.4} think size={50} />
          </g>
        ))}
      </View>
      <View c={cB} op={shot(t, E.cars - 0.6, E.alex - 0.25, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <Panel x={70} y={110} w={640} h={900} id="s-p1" bg="#dfe6ee" op={ip(t, E.cars - 0.5, E.cars - 0.2)}>
          <rect x={70} y={110} width={640} height={900} fill="#dfe6ee" />
          <Car x={390} y={560} s={0.9} col="#e0463c" />
          <rect x={150} y={640} width={480} height={110} rx={55} fill="#e0463c" stroke={INK} strokeWidth={6} />
          <text x={390} y={697} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#fff" textAnchor="middle" dominantBaseline="central">BUY NOW</text>
          <text x={390} y={860} fontFamily="Inter" fontWeight={900} fontSize={48} fill={INK} textAnchor="middle">New cars 🚗</text>
        </Panel>
        <Panel x={760} y={110} w={640} h={900} id="s-p2" bg="#ffe1ea" op={ip(t, E.clothes - 0.3, E.clothes)}>
          <rect x={760} y={110} width={640} height={900} fill="#ffe1ea" />
          <Cart x={1080} y={680} full={1} s={1.2} />
          <text x={1080} y={860} fontFamily="Inter" fontWeight={900} fontSize={48} fill={INK} textAnchor="middle">Designer clothes 👗</text>
          <text x={1080} y={300} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#c0182a" textAnchor="middle">🛒 47 items</text>
        </Panel>
        <Panel x={1450} y={110} w={640} h={900} id="s-p3" bg="#e6f4e0" op={ip(t, E.houses - 0.3, E.houses)}>
          <rect x={1450} y={110} width={640} height={900} fill="#e6f4e0" />
          <rect x={1560} y={420} width={420} height={300} fill="#f2d7a6" stroke={INK} strokeWidth={6} />
          <path d="M 1530 430 L 1770 250 L 2010 430 Z" fill="#c25a44" stroke={INK} strokeWidth={6} />
          <rect x={1730} y={560} width={80} height={160} fill="#7a4f33" stroke={INK} strokeWidth={5} />
          <text x={1770} y={800} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#1d7a44" textAnchor="middle">$2,400,000</text>
          <text x={1770} y={860} fontFamily="Inter" fontWeight={900} fontSize={48} fill={INK} textAnchor="middle">Dream houses 🏠</text>
        </Panel>
      </View>
      <View c={cC} op={shot(t, E.alex - 0.25, E.queue - 0.3, 0.4)}>
        <Room id="s-room" wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" />
        <Frame x={260} y={200} w={240} h={190} art="#86b7d6" />
        <rect x={900} y={FLOOR - 320} width={900} height={40} rx={10} fill="#c58b5d" stroke={INK} strokeWidth={6} />
        <rect x={940} y={FLOOR - 280} width={30} height={280} fill="#8a6446" />
        <rect x={1730} y={FLOOR - 280} width={30} height={280} fill="#8a6446" />
        <rect x={1060} y={FLOOR - 650} width={560} height={330} rx={16} fill="#1c1c26" stroke={INK} strokeWidth={6} />
        <rect x={1080} y={FLOOR - 630} width={520} height={290} rx={8} fill="#f4f6fb" />
        <text x={1340} y={FLOOR - 590} fontFamily="Inter" fontWeight={900} fontSize={34} fill="#16305e" textAnchor="middle">AutoMax · Red GT</text>
        <Car x={1340} y={FLOOR - 450} s={0.55} col="#e0463c" />
        <rect x={1200} y={FLOOR - 420} width={280} height={60} rx={30} fill={bought ? "#1d9e55" : "#e0463c"} />
        <text x={1340} y={FLOOR - 389} fontFamily="Inter" fontWeight={900} fontSize={30} fill="#fff" textAnchor="middle" dominantBaseline="central">
          {bought ? "ORDER PLACED ✓" : "BUY · $50,000 deposit"}
        </text>
        <rect x={1260} y={FLOOR - 320} width={160} height={20} fill="#1c1c26" />
        <P t={t} x={760} yf={FLOOR} sit {...ALEX} facing={1} look={1} arms={bought ? ["cheer", "cheer"] : ["down", "point"]} expr={bought ? "laugh" : "happy"} seed={1}
          bob={bought ? Math.abs(Math.sin(t * 8)) * 14 : 0} />
        <rect x={640} y={FLOOR - 200} width={250} height={30} rx={8} fill="#5b6270" />
        <Sparkles cx={1340} cy={FLOOR - 420} t={t} n={8} r={240} k={ip(t, E.buy, E.buy + 0.4)} />
      </View>
      <View c={cD} op={shot(t, E.queue - 0.3, 1e9, 0.4)}>
        <Street id="s-st2" t={t * 0.2} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={1300} y={FLOOR - 760} width={900} height={760} fill="#e6edf3" stroke={INK} strokeWidth={8} />
        <rect x={1280} y={FLOOR - 820} width={940} height={110} fill="#16305e" stroke={INK} strokeWidth={6} />
        <text x={1750} y={FLOOR - 750} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#fff" textAnchor="middle">AUTOMAX MOTORS</text>
        <rect x={1360} y={FLOOR - 420} width={200} height={420} fill="#9fd0ff" stroke={INK} strokeWidth={6} />
        {[...Array(9)].map((_, i) => (
          <P key={i} t={t} x={1260 - i * 160} yf={FLOOR + 20} u={0.78} outfit={["tee", "coat", "suit", "hoodie", "dress", "tee", "cardigan", "hoodie", "coat"][i] as "tee"}
            color={["#e0463c", "#8e5bd0", "#5b6270", "#f2c84b", "#ff7fb0", "#3fae6a", "#c0703a", "#2fa3a0", "#d9934e"][i]}
            hair={["short", "long", "slick", "curly", "bun", "cap", "bald", "short", "long"][i] as "short"} accent="#2f6fe0" facing={1} look={1}
            expr={i % 2 ? "happy" : "neutral"} bob={Math.abs(Math.sin(t * 3 + i)) * 6} seed={40 + i} />
        ))}
        <Chip x={700} y={200} text="QUEUE: 3 HOURS" t={t} t0={E.queue + 0.3} bg="#16161c" fg="#ffe36b" size={46} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 4 · THE FIRST PROBLEM
export const problem: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.sells - 0.5, 1.12, 1250, 600], [E.phone, 1.15, 1220, 600]]);
  const cB = cam(t, [[E.phone - 0.3, 1.0, 1080, 620], [E.alex, 1.12, 1080, 600]]);
  const cC = cam(t, [[E.alex - 0.3, 1.0, 1080, 620], [S.dur, 1.35, 900, 560]]);
  const drive = ip(t, E.sells + 0.4, E.sells + 1.6, 0, 1, Easing.in(Easing.quad));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.phone - 0.3, 0.4)}>
        <Dealership id="p-dl" t={t} cars={0} />
        <g transform={`translate(${drive * 1400} 0)`}>
          <Car x={1280} y={FLOOR + 20} col="#2f6fe0" s={0.85} />
          {t > E.sells ? (
            <g transform={tf(1280, 780, pop(t, E.sells, 0.25))}>
              <rect x={1080} y={720} width={400} height={130} rx={20} fill="rgba(255,255,255,0.8)" stroke="#e0263a" strokeWidth={12} transform="rotate(-8 1280 785)" />
              <text x={1280} y={790} fontFamily="Inter" fontWeight={900} fontSize={96} fill="#e0263a" textAnchor="middle" dominantBaseline="central" transform="rotate(-8 1280 785)">SOLD</text>
            </g>
          ) : null}
        </g>
        <P t={t} x={700} yf={FLOOR + 20} outfit="suit" color="#3b3e46" hair="slick" accent="#2f6fe0" arms={["down", "point"]} facing={1} look={1}
          expr={t > E.sells ? "happy" : "neutral"} talk={t < 2.4} seed={50} />
        <P t={t} x={lerpN(-250, 380, ip(t, E.sells + 0.4, E.sells + 1.5))} yf={FLOOR + 30} outfit="coat" color="#ff7fb0" hair="long" facing={1}
          walk={t < E.sells + 1.5 ? t * 9 : null} look={1} expr={t > E.sells + 1.6 ? "shock" : "happy"} seed={51} />
        {t < E.sells ? <Chip x={1280} y={560} text="LAST ONE!" t={t} t0={0.5} bg="#16161c" fg="#ffe36b" size={44} /> : null}
      </View>
      <View c={cB} op={shot(t, E.phone - 0.3, E.alex - 0.3, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#bcd3e3" />
        <BigPhone x={620} y={620} w={540} h={980} tilt={-3}>
          <text x={620} y={200} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#16305e" textAnchor="middle">My orders</text>
          <Car x={620} y={420} s={0.5} col="#e0463c" />
          <text x={620} y={500} fontFamily="Inter" fontWeight={800} fontSize={34} fill="#16161c" textAnchor="middle">Red GT · deposit paid</text>
          <rect x={410} y={560} width={420} height={90} rx={45} fill="#ffe8ea" stroke="#c0182a" strokeWidth={5} />
          <text x={620} y={605} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#c0182a" textAnchor="middle" dominantBaseline="central">DELAYED ⏳</text>
          <text x={620} y={700} fontFamily="Inter" fontWeight={700} fontSize={32} fill="#6b6f7c" textAnchor="middle">New delivery: 12–16 weeks</text>
        </BigPhone>
        {[0, 1, 2, 3].map((i) => {
          const x = 1180 + (i % 2) * 440;
          const y = 300 + Math.floor(i / 2) * 420;
          const sold = t > E.houses + 0.2 + i * 0.3;
          return (
            <g key={i}>
              <rect x={x} y={y - 160} width={400} height={360} rx={24} fill="#fff" stroke={INK} strokeWidth={6} />
              <rect x={x + 100} y={y - 40} width={200} height={140} fill={["#f2d7a6", "#cfe9f7", "#e1d5f5", "#e6f4e0"][i]} stroke={INK} strokeWidth={4} />
              <path d={`M ${x + 80} ${y - 30} L ${x + 200} ${y - 120} L ${x + 320} ${y - 30} Z`} fill="#c25a44" stroke={INK} strokeWidth={4} />
              <text x={x + 200} y={y + 160} fontFamily="Inter" fontWeight={900} fontSize={38} fill="#1d7a44" textAnchor="middle">{["$890,000", "$1.2M", "$640,000", "$2.1M"][i]}</text>
              {sold ? <text x={x + 200} y={y + 30} fontFamily="Inter" fontWeight={900} fontSize={90} fill="#e0263a" textAnchor="middle" dominantBaseline="central"
                transform={tf(x + 200, y + 30, pop(t, E.houses + 0.2 + i * 0.3, 0.2), -10)} stroke="#fff" strokeWidth={6} paintOrder="stroke">SOLD</text> : null}
            </g>
          );
        })}
      </View>
      <View c={cC} op={shot(t, E.alex - 0.3, 1e9, 0.4)}>
        <Room id="p-room" wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" />
        <Window id="p-w" x={1220} y={130} w={760} h={480} sky={["#ffb98a", "#ffe3c2"]} t={t} kind="city" />
        {[...Array(5)].map((_, i) => (
          <Stick key={i} t={t} x={1320 + i * 140} yf={560} u={0.3} outfit="tee" color={["#e0463c", "#f2c84b", "#ff7fb0", "#3fae6a", "#8e5bd0"][i]} hair="short"
            arms={["cheer", "cheer"]} expr="laugh" bob={Math.abs(Math.sin(t * 7 + i)) * 12} shadow={false} seed={60 + i} />
        ))}
        {[...Array(12)].map((_, i) => {
          const ph = (t * 0.5 + i / 12) % 1;
          return <rect key={i} x={1240 + (i * 61) % 720} y={140 + ph * 440} width={12} height={20} fill={["#ffd56b", "#ff6b8a", "#6bd6ff"][i % 3]} />;
        })}
        <P t={t} x={760} yf={FLOOR + 20} {...ALEX} arms={["down", "phone"]} hold="phone" lookY={0.6} expr="confused" seed={1} />
        <Bubble x={880} y={560} lines={["Wait... it's all", "sold out?"]} t={t} t0={1.6} size={44} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 5 · WEEK 1: THE SHELVES EMPTY
export const week1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, 0.3, 1.0);
  const stock = ip(t, E.store, E.vanish + 1.2, 0.95, 0.18, Easing.inOut(Easing.quad));
  const cA = cam(t, [[0, 1.4, 1080, 620], [E.store, 1.5, 1080, 600]]);
  const cB = cam(t, [[E.store - 0.3, 1.0, 1080, 620], [E.vanish, 1.2, 600, 560], [E.graph, 1.2, 700, 560]]);
  const cC = cam(t, [[E.graph - 0.3, 1.0, 1080, 620], [S.dur, 1.04, 1080, 610]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.store - 0.3, 0.4)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#2c3352" />
        <Calendar x={1080} y={640} label={flip < 0.5 ? "DAY 1" : "WEEK 1"} flip={flip} sub={flip < 0.5 ? "MONDAY" : "7 DAYS LATER"} />
      </View>
      <View c={cB} op={shot(t, E.store - 0.3, E.graph - 0.3, 0.4)}>
        <Supermarket id="w-sm" t={t} stock={stock} />
        {[0, 1, 2, 3].map((i) => {
          const x = ((i * 520 + t * (i % 2 ? -90 : 110)) % 2600 + 2600) % 2600 - 260;
          return (
            <g key={i}>
              <Cart x={x + (i % 2 ? -150 : 150)} y={FLOOR + 30} full={1} s={0.9} />
              <P t={t} x={x} yf={FLOOR + 30} u={0.9} outfit={["coat", "tee", "suit", "dress"][i] as "coat"} color={["#8e5bd0", "#e0463c", "#5b6270", "#ff7fb0"][i]}
                hair={["long", "cap", "slick", "bun"][i] as "long"} accent="#2f6fe0" facing={i % 2 ? -1 : 1} walk={t * 7 + i}
                arms={["down", "point"]} expr="happy" seed={70 + i} />
            </g>
          );
        })}
        <P t={t} x={1080} yf={FLOOR - 10} outfit="shopApron" color="#f4f1ea" accent="#e0463c" hair="short" arms={["hold", "hold"]} hold="box" holdHand={1}
          expr="worried" look={-0.6} seed={75} />
        {t > E.delayed ? <Chip x={1080} y={180} text="🚚 DELIVERY DELAYED" t={t} t0={E.delayed} bg="#16161c" fg="#ffb238" size={46} /> : null}
        {t > E.vanish ? <Chip x={490} y={420} text="SOLD OUT" t={t} t0={E.vanish} bg="#ffe8ea" fg="#c0182a" size={44} /> : null}
      </View>
      <View c={cC} op={shot(t, E.graph - 0.3, 1e9, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <Graph x={360} y={260} w={1440} h={680} p={ip(t, E.graph + 0.2, E.fast + 0.4, 0, 1, Easing.inOut(Easing.quad))} title="What people want vs. what exists"
          lines={[
            { col: "#e0463c", pts: [0.08, 0.5, 0.78, 0.9, 0.95, 0.97], label: "DEMAND" },
            { col: "#1d9e55", pts: [0.08, 0.1, 0.13, 0.16, 0.19, 0.22], label: "SUPPLY" },
          ]} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 6 · WHY WORK?
const Stockroom: React.FC<{ id: string; t: number }> = ({ id, t }) => (
  <g>
    <Room id={id} wall="#e2ddd2" wall2="#d3ccbd" floor="#a29a8c" wains="#c7bfae" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        {[0, 1, 2].map((r) => <rect key={r} x={1500 + i * 180} y={FLOOR - 140 - r * 120} width={160} height={110} rx={6} fill="#c99a62" stroke={INK} strokeWidth={4} />)}
      </g>
    ))}
    <rect x={180} y={190} width={420} height={220} rx={12} fill="#fffdf6" stroke={INK} strokeWidth={6} />
    <text x={390} y={250} fontFamily="Inter" fontWeight={900} fontSize={38} fill="#c0182a" textAnchor="middle">FRESHMART</text>
    <text x={390} y={310} fontFamily="Inter" fontWeight={800} fontSize={32} fill="#5b6270" textAnchor="middle">STAFF ONLY</text>
    <text x={390} y={360} fontFamily="Inter" fontWeight={700} fontSize={28} fill="#5b6270" textAnchor="middle">Shift starts 6 AM</text>
    <rect x={700} y={FLOOR - 300} width={600} height={34} rx={8} fill="#8a6446" stroke={INK} strokeWidth={5} />
    <rect x={720} y={FLOOR - 266} width={24} height={266} fill="#6b4b33" />
    <rect x={1256} y={FLOOR - 266} width={24} height={266} fill="#6b4b33" />
    <Plant x={120} y={FLOOR} s={0.7} t={t} />
  </g>
);

export const work: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const q1 = t > E.quits + 0.5;
  const q2 = t > E.quits + 1.3;
  const cA = cam(t, [[0, 1.05, 1080, 620], [E.quits - 0.5, 1.25, 1000, 580], [E.drivers, 1.25, 1000, 580]]);
  const cB = cam(t, [[E.drivers - 0.3, 1.0, 1080, 620], [E.manager, 1.08, 1080, 600]]);
  const cC = cam(t, [[E.manager - 0.3, 1.1, 1080, 600], [S.dur, 1.55, 1000, 520]]);
  const pile = ip(t, E.manager, S.dur, 3, 12, Easing.linear);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.drivers - 0.3, 0.4)}>
        <Stockroom id="k-room" t={t} />
        <P t={t} x={1500} yf={FLOOR + 20} {...MANAGER} facing={-1} look={-1} expr={q1 ? "shock" : "neutral"} arms={q2 ? ["shrug", "shrug"] : ["down", "hips"]} seed={80} />
        <P t={t} x={780} yf={FLOOR + 20} {...ALEX} badge={!q1} facing={1} look={1} arms={t > E.quits && !q1 ? ["down", "give"] : ["down", "down"]}
          expr={q1 ? "smug" : "neutral"} lookY={t < E.quits ? 0.6 : 0} seed={1} />
        <P t={t} x={1080} yf={FLOOR + 30} u={0.95} outfit="tee" color="#f2c84b" hair="curly" badge={!q2} facing={1} look={0.6}
          arms={t > E.quits + 0.9 && !q2 ? ["down", "give"] : ["down", "down"]} expr={q2 ? "smug" : "neutral"} seed={81} />
        {q1 ? <rect x={960} y={FLOOR - 332} width={44} height={28} rx={5} fill="#fff" stroke={INK} strokeWidth={3} /> : null}
        {q2 ? <rect x={1020} y={FLOOR - 332} width={44} height={28} rx={5} fill="#fff" stroke={INK} strokeWidth={3} /> : null}
        <Bubble x={660} y={560} lines={["I'm a millionaire.", "I quit!"]} t={t} t0={E.quits - 0.2} t1={E.drivers - 0.3} tail="right" size={44} />
      </View>
      <View c={cB} op={shot(t, E.drivers - 0.3, E.manager - 0.3, 0.4)}>
        <Warehouse id="k-wh" t={t} />
        {[200, 620, 1460].map((x, i) => (
          <g key={i}>
            <rect x={x - 90} y={FLOOR - 300} width={180} height={30} rx={6} fill="#5b6270" stroke={INK} strokeWidth={4} />
            <text x={x} y={FLOOR - 340} fontFamily="Inter" fontWeight={900} fontSize={30} fill="#c0182a" textAnchor="middle">EMPTY</text>
          </g>
        ))}
        <P t={t} x={1040} yf={FLOOR + 20} u={0.9} outfit="shopApron" color="#f4f1ea" accent="#e08a2b" hair="cap" arms={["hold", "hold"]} hold="box" expr="worried" seed={82} />
        <Truck x={1800} y={FLOOR + 40} s={0.8} />
        <Chip x={1800} y={560} text="DRIVERS NEEDED" t={t} t0={E.drivers + 0.8} bg="#ffe8ea" fg="#c0182a" size={40} />
      </View>
      <View c={cC} op={shot(t, E.manager - 0.3, 1e9, 0.4)}>
        <Stockroom id="k-room2" t={t} />
        {[...Array(Math.floor(pile))].map((_, i) => (
          <rect key={i} x={860 + (i % 2) * 14} y={FLOOR - 340 - i * 16} width={220} height={16} rx={3} fill="#fbfbf3" stroke={INK} strokeWidth={3} transform={`rotate(${(i % 3) - 1} 970 ${FLOOR - 330 - i * 16})`} />
        ))}
        <text x={970} y={FLOOR - 380 - Math.floor(pile) * 16} fontFamily="Inter" fontWeight={900} fontSize={34} fill="#c0182a" textAnchor="middle">ORDERS</text>
        <P t={t} x={1260} yf={FLOOR + 20} {...MANAGER} facing={-1} look={-1} lookY={0.4} arms={["down", "chest"]} expr="worried" seed={80} />
      </View>
    </>
  );
};
