import { CoffeeCounter, CoffeeShop, Street } from "./env";
import { Cart, Graph, PriceTag } from "./env2";
import { ALEX, BOSS, H, P, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ------------------------------------------------------------------ 7 · THE REAL COST OF A MILLION DOLLARS (as sent by the user)
export const prices: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const a = E.climb;
  const cA = cam(t, [[0, 1.45, 520, 630], [E.cafe + 1.2, 1.45, 520, 640], [E.cafe + 2.4, 1.0, 1080, 620], [E.raise - 2.0, 1.08, 1080, 600]]);
  const cB = cam(t, [[E.raise - 2.0, 1.0, 1080, 620], [E.alex, 1.05, 1080, 600]]);
  const cC = cam(t, [[E.alex - 0.3, 1.2, 1080, 500], [E.less - 2.8, 1.15, 1080, 520], [S.dur, 1.0, 1080, 620]]);
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
              <P t={t} x={1000} yf={FLOOR + 40} u={0.85} outfit="tee" color="#3fae6a" hair="cap" accent="#e0463c" facing={-1} look={-1} lookY={-0.6}
                arms={t > E.raise + 0.5 ? ["shrug", "shrug"] : ["down", "down"]} expr={t > E.raise + 0.5 ? "angry" : "neutral"} seed={92} />
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

