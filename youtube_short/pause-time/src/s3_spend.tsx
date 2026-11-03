import { Easing } from "remotion";
import { Frame, Panel, Room, Street } from "./env";
import { Car, Cart } from "./env2";
import { ALEX, Bubble, Chip, H, P, Sparkles, View, W, cam, ip, shot } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;

// ------------------------------------------------------------------ 3 · EVERYONE STARTS SPENDING (as sent by the user)
export const spend: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.05, 1080, 620], [E.cars - 0.6, 1.15, 1080, 580]]);
  const cB = cam(t, [[E.cars - 0.6, 1.0, 1080, 620], [E.alex, 1.08, 1080, 590]]);
  const cC = cam(t, [[E.alex - 0.2, 1.1, 1080, 600], [E.buy, 1.4, 1240, 500], [E.queue, 1.3, 1100, 560]]);
  const cD = cam(t, [[E.queue - 0.3, 1.25, 1350, 560], [S.dur, 0.95, 1080, 640]]);
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
          <P t={t} x={190} yf={1000} u={0.42} outfit="suit" color="#5b6270" hair="slick" arms={["down", "phone"]} hold="phone" lookY={0.5} expr="laugh" seed={51} shadow={false} />
        </Panel>
        <Panel x={760} y={110} w={640} h={900} id="s-p2" bg="#ffe1ea" op={ip(t, E.clothes - 0.3, E.clothes)}>
          <rect x={760} y={110} width={640} height={900} fill="#ffe1ea" />
          <Cart x={1080} y={680} full={1} s={1.2} />
          <text x={1080} y={860} fontFamily="Inter" fontWeight={900} fontSize={48} fill={INK} textAnchor="middle">Designer clothes 👗</text>
          <text x={1080} y={300} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#c0182a" textAnchor="middle">🛒 {Math.min(47, Math.max(1, Math.floor((t - E.clothes + 0.3) * 30)))} items</text>
          <P t={t} x={1290} yf={1000} u={0.42} outfit="dress" color="#ff7fb0" hair="long" arms={["down", "phone"]} hold="phone" lookY={0.5} expr="happy" seed={52} shadow={false} />
        </Panel>
        <Panel x={1450} y={110} w={640} h={900} id="s-p3" bg="#e6f4e0" op={ip(t, E.houses - 0.3, E.houses)}>
          <rect x={1450} y={110} width={640} height={900} fill="#e6f4e0" />
          <rect x={1560} y={420} width={420} height={300} fill="#f2d7a6" stroke={INK} strokeWidth={6} />
          <path d="M 1530 430 L 1770 250 L 2010 430 Z" fill="#c25a44" stroke={INK} strokeWidth={6} />
          <rect x={1730} y={560} width={80} height={160} fill="#7a4f33" stroke={INK} strokeWidth={5} />
          <text x={1770} y={800} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#1d7a44" textAnchor="middle">$2,400,000</text>
          <text x={1770} y={860} fontFamily="Inter" fontWeight={900} fontSize={48} fill={INK} textAnchor="middle">Dream houses 🏠</text>
          {[0, 1, 2].map((i) => (
            <P key={i} t={t} x={1530 + i * 60 + (i === 2 ? 20 : 0)} yf={1000 - Math.abs(Math.sin(t * 6 + i)) * 14} u={i === 2 ? 0.3 : 0.4} outfit={["coat", "tee", "dress"][i] as "coat"}
              color={["#2fa3a0", "#e0463c", "#f2c84b"][i]} hair={["short", "long", "pigtails"][i] as "short"} arms={["cheer", "cheer"]} expr="laugh" seed={53 + i} shadow={false} />
          ))}
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
        {[...Array(12)].map((_, i) => {
          const arrive = E.queue - 0.3 + Math.max(0, i - 4) * 0.28;
          if (t < arrive - 0.6) return null;
          const k = ip(t, arrive - 0.6, arrive, 0, 1, Easing.out(Easing.quad));
          const x = 1260 - i * 150;
          return (
            <P key={i} t={t} x={x - (1 - k) * 700} yf={FLOOR + 20} u={0.74} outfit={["tee", "coat", "suit", "hoodie", "dress", "tee", "cardigan", "hoodie", "coat", "suit", "tee", "dress"][i] as "tee"}
              color={["#e0463c", "#8e5bd0", "#5b6270", "#f2c84b", "#ff7fb0", "#3fae6a", "#c0703a", "#2fa3a0", "#d9934e", "#3b3e46", "#7a5bb6", "#e0463c"][i]}
              hair={["short", "long", "slick", "curly", "bun", "cap", "bald", "short", "long", "slick", "curly", "bun"][i] as "short"} accent="#2f6fe0" facing={1} look={1}
              walk={k < 1 ? t * 11 : null} expr={i % 2 ? "happy" : "neutral"} bob={k >= 1 ? Math.abs(Math.sin(t * 3 + i)) * 6 : 0} seed={40 + i} />
          );
        })}
        <Chip x={760} y={330} text={`QUEUE: ${Math.min(214, Math.max(5, Math.round((t - E.queue) * 110)))} PEOPLE`} t={t} t0={E.queue + 0.3} bg="#16161c" fg="#ffe36b" size={46} />
      </View>
    </>
  );
};

