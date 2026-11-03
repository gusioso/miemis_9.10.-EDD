import { Easing } from "remotion";
import { Calendar, Street } from "./env";
import { Cart, Graph, Supermarket, Truck } from "./env2";
import { Chip, H, P, View, W, cam, ip, shot } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;

// ------------------------------------------------------------------ 5 · WEEK ONE: THE SHELVES EMPTY (as sent by the user)
// Calendar flips DAY 1 -> WEEK 1 -> packed supermarket (tracking shot down the aisle) -> delivery truck stuck outside a
// crowded warehouse -> shelves empty while customers keep coming and staff try to restock -> demand vs supply graph.
const Shoppers: React.FC<{ t: number; n?: number; seed?: number }> = ({ t, n = 5, seed = 0 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const dir = i % 2 ? -1 : 1;
      const x = (((i * 560 + seed * 300 + t * (dir < 0 ? -95 : 120)) % 3000) + 3000) % 3000 - 420;
      return (
        <g key={i}>
          <Cart x={x + dir * 150} y={FLOOR + 30} full={1} s={0.9} />
          <P t={t} x={x} yf={FLOOR + 30} u={0.9} outfit={["coat", "tee", "suit", "dress", "hoodie"][i % 5] as "coat"} color={["#8e5bd0", "#e0463c", "#5b6270", "#ff7fb0", "#3fae6a"][i % 5]}
            hair={["long", "cap", "slick", "bun", "curly"][i % 5] as "long"} accent="#2f6fe0" facing={dir as 1 | -1} walk={t * 7 + i}
            arms={["down", "point"]} expr={i % 3 ? "happy" : "neutral"} seed={70 + i + seed} />
        </g>
      );
    })}
  </>
);

const Staff: React.FC<{ t: number; x: number; seed: number; box?: boolean }> = ({ t, x, seed, box = true }) => (
  <P t={t} x={x} yf={FLOOR - 10} outfit="shopApron" color="#f4f1ea" accent="#e0463c" hair="short" arms={box ? ["hold", "hold"] : ["shrug", "shrug"]}
    hold={box ? "box" : null} holdHand={1} expr="worried" look={-0.6} bob={box ? Math.abs(Math.sin(t * 5 + seed)) * 10 : 0} seed={seed} />
);

export const week1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, 0.5, 1.3);
  const stock = ip(t, E.store, E.graph - 0.4, 0.95, 0.12, Easing.inOut(Easing.quad));
  const cA = cam(t, [[0, 1.4, 1080, 620], [E.store, 1.5, 1080, 600]]);
  const cB = cam(t, [[E.store - 0.3, 1.25, 420, 600], [E.delayed, 1.25, 1500, 600]]);
  const cT = cam(t, [[E.delayed - 0.3, 1.0, 1080, 620], [E.vanish, 1.12, 1180, 600]]);
  const cD = cam(t, [[E.vanish - 0.3, 1.3, 1700, 560], [E.graph - 0.3, 1.15, 600, 600]]);
  const cC = cam(t, [[E.graph - 0.3, 1.0, 1080, 620], [S.dur, 1.04, 1080, 610]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.store - 0.3, 0.3)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#2c3352" />
        <Calendar x={1080} y={640} label={flip < 0.5 ? "DAY 1" : "WEEK 1"} flip={flip} sub={flip < 0.5 ? "MONDAY" : "7 DAYS LATER"} />
      </View>
      <View c={cB} op={shot(t, E.store - 0.3, E.delayed - 0.3, 0.3)}>
        <Supermarket id="w-sm" t={t} stock={stock} />
        <Staff t={t} x={1080} seed={75} />
        <Shoppers t={t} n={5} />
        <Chip x={cB[1]} y={330} text="🛒 PACKED" t={t} t0={E.store + 0.3} bg="#16161c" fg="#ffe36b" size={44} />
      </View>
      <View c={cT} op={shot(t, E.delayed - 0.3, E.vanish - 0.3, 0.3)}>
        <Street id="w-st" t={t * 0.3} sky={["#c9d6e2", "#eef2f6"]} />
        <rect x={700} y={FLOOR - 700} width={1500} height={700} fill="#b9c0c8" stroke={INK} strokeWidth={8} />
        <rect x={680} y={FLOOR - 760} width={1540} height={90} fill="#5b6270" stroke={INK} strokeWidth={6} />
        <text x={1450} y={FLOOR - 703} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#fff" textAnchor="middle" letterSpacing={6}>DISTRIBUTION CENTER</text>
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={820 + i * 640} y={FLOOR - 520} width={520} height={520} fill="#8f969e" stroke={INK} strokeWidth={6} />
            {[...Array(9)].map((_, j) => <line key={j} x1={820 + i * 640} y1={FLOOR - 470 + j * 55} x2={1340 + i * 640} y2={FLOOR - 470 + j * 55} stroke="#6b727a" strokeWidth={5} />)}
          </g>
        ))}
        {[...Array(7)].map((_, i) => (
          <P key={i} t={t} x={900 + i * 170} yf={FLOOR + 30} u={0.7} outfit={["coat", "tee", "suit", "hoodie", "dress", "tee", "cardigan"][i] as "coat"}
            color={["#2fa3a0", "#e0463c", "#5b6270", "#f2c84b", "#ff7fb0", "#3fae6a", "#c0703a"][i]} hair={["long", "cap", "slick", "curly", "bun", "short", "bald"][i] as "long"}
            accent="#2f6fe0" arms={i % 2 ? ["point", "down"] : ["shrug", "shrug"]} facing={1} expr={i % 2 ? "angry" : "worried"} bob={Math.abs(Math.sin(t * 4 + i)) * 8} seed={90 + i} />
        ))}
        <Truck x={330} y={FLOOR + 160} s={0.9} />
        <Chip x={330} y={560} text="⏳ DELAYED" t={t} t0={E.delayed + 0.2} bg="#16161c" fg="#ffb238" size={50} />
        <Chip x={1450} y={170} text="WAITING: 6 DAYS" t={t} t0={E.delayed + 0.7} bg="#ffe8ea" fg="#c0182a" size={42} />
      </View>
      <View c={cD} op={shot(t, E.vanish - 0.3, E.graph - 0.3, 0.3)}>
        <Supermarket id="w-sm2" t={t} stock={stock} />
        <Staff t={t} x={1500} seed={76} />
        <Staff t={t} x={700} seed={77} box={t < E.vanish + 1.4} />
        <Shoppers t={t} n={6} seed={2} />
        <Chip x={cD[1]} y={330} text="SOLD OUT" t={t} t0={E.vanish + 0.4} bg="#ffe8ea" fg="#c0182a" size={48} />
      </View>
      <View c={cC} op={shot(t, E.graph - 0.3, 1e9, 0.3)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <Graph x={360} y={260} w={1440} h={680} p={ip(t, E.graph + 0.2, E.fast + 0.4, 0, 1, Easing.inOut(Easing.quad))} title="What people want vs. what exists"
          lines={[
            { col: "#e0463c", pts: [0.08, 0.5, 0.78, 0.9, 0.95, 0.97], label: "DEMAND" },
            { col: "#1d9e55", pts: [0.08, 0.12, 0.17, 0.22, 0.27, 0.32], label: "SUPPLY" },
          ]} />
      </View>
    </>
  );
};
