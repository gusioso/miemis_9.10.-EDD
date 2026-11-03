import { Easing } from "remotion";
import { Plant, Room, Street } from "./env";
import { Truck, Warehouse } from "./env2";
import { ALEX, Bubble, Chip, MANAGER, P, View, cam, ip, shot } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
// Alex's FreshMart uniform for this scene: blue shirt under the green store apron.
const UNIFORM = { outfit: "shopApron", color: "#2f6fe0", accent: "#2f8f5b" } as const;

// ------------------------------------------------------------------ 6 · WHY WORK? (as sent by the user)
// Only a few people quit (Alex, one coworker, some drivers): empty workstations and idle trucks, not an empty world.
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
  const cB = cam(t, [[E.drivers - 0.3, 1.0, 1080, 620], [E.trucks, 1.08, 1080, 600]]);
  const cT = cam(t, [[E.trucks - 0.3, 1.0, 1080, 640], [E.manager, 1.06, 1100, 620]]);
  const cC = cam(t, [[E.manager - 0.3, 1.1, 1080, 600], [S.dur, 1.55, 1000, 520]]);
  const pile = ip(t, E.manager - 0.3, S.dur, 4, 18, Easing.linear);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.drivers - 0.3, 0.4)}>
        <Stockroom id="k-room" t={t} />
        <P t={t} x={1500} yf={FLOOR + 20} {...MANAGER} facing={-1} look={-1} expr={q1 ? "shock" : "neutral"} arms={q2 ? ["shrug", "shrug"] : ["down", "hips"]} seed={80} />
        <P t={t} x={780} yf={FLOOR + 20} {...ALEX} {...UNIFORM} badge={!q1} facing={1} look={1}
          arms={t < E.quits ? ["down", "phone"] : t < E.quits + 0.5 ? ["down", "give"] : ["down", "down"]} hold={t < E.quits ? "phone" : null}
          expr={q1 ? "smug" : t > E.bank + 0.8 ? "happy" : "neutral"} lookY={t < E.quits ? 0.6 : 0} seed={1} />
        {t > E.bank && t < E.quits ? <Chip x={780} y={300} text="🏦 $950,083.47" t={t} t0={E.bank} bg="#e6f9ee" fg="#127a3e" size={40} /> : null}
        <P t={t} x={1080} yf={FLOOR + 30} u={0.95} outfit="tee" color="#f2c84b" hair="curly" badge={!q2} facing={1} look={0.6}
          arms={t > E.quits + 0.9 && !q2 ? ["down", "give"] : ["down", "down"]} expr={q2 ? "smug" : "neutral"} seed={81} />
        {q1 ? <rect x={960} y={FLOOR - 332} width={44} height={28} rx={5} fill="#fff" stroke={INK} strokeWidth={3} /> : null}
        {q2 ? <rect x={1020} y={FLOOR - 332} width={44} height={28} rx={5} fill="#fff" stroke={INK} strokeWidth={3} /> : null}
        <Bubble x={660} y={560} lines={["I'm a millionaire.", "I quit!"]} t={t} t0={E.quits - 0.2} t1={E.drivers - 0.3} tail="right" size={44} />
      </View>
      <View c={cB} op={shot(t, E.drivers - 0.3, E.trucks - 0.3, 0.4)}>
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
      <View c={cT} op={shot(t, E.trucks - 0.3, E.manager - 0.3, 0.4)}>
        <Street id="k-lot" t={t * 0.2} sky={["#c9d6e2", "#eef2f6"]} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <Truck x={420 + i * 680} y={FLOOR + 150} s={0.75} />
            <rect x={480 + i * 680} y={FLOOR - 270} width={150} height={54} rx={8} fill="#fffdf6" stroke={INK} strokeWidth={4} />
            <text x={555 + i * 680} y={FLOOR - 243} fontFamily="Inter" fontWeight={900} fontSize={24} fill="#c0182a" textAnchor="middle" dominantBaseline="central">NO DRIVER</text>
          </g>
        ))}
        <P t={t} x={1960} yf={FLOOR + 40} u={0.85} outfit="tee" color="#e08a2b" hair="cap" accent="#5b6270" arms={["hold", "down"]} hold="paper" expr="worried" facing={-1} look={-1} seed={83} />
        <Chip x={1080} y={300} text="🚚 WAITING FOR DRIVERS" t={t} t0={E.trucks + 0.2} bg="#16161c" fg="#ffb238" size={46} />
      </View>
      <View c={cC} op={shot(t, E.manager - 0.3, 1e9, 0.4)}>
        <Stockroom id="k-room2" t={t} />
        {[...Array(Math.floor(pile))].map((_, i) => (
          <rect key={i} x={860 + (i % 2) * 14} y={FLOOR - 340 - i * 16} width={220} height={16} rx={3} fill="#fbfbf3" stroke={INK} strokeWidth={3} transform={`rotate(${(i % 3) - 1} 970 ${FLOOR - 330 - i * 16})`} />
        ))}
        <text x={970} y={FLOOR - 380 - Math.floor(pile) * 16} fontFamily="Inter" fontWeight={900} fontSize={34} fill="#c0182a" textAnchor="middle">DELIVERY REQUESTS</text>
        <P t={t} x={1260} yf={FLOOR + 20} {...MANAGER} facing={-1} look={-1} lookY={0.4} arms={["down", "chest"]} expr="worried" seed={80} />
      </View>
    </>
  );
};
