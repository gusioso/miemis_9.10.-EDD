import { Easing } from "remotion";
import { BigPhone, Room, Window } from "./env";
import { Car, Dealership } from "./env2";
import { ALEX, Bubble, Chip, H, P, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK, Stick } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ 4 · THE FIRST PROBLEM (as sent by the user)
export const problem: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const SOLD = 1.9;
  const cA = cam(t, [[0, 1.0, 1080, 560], [SOLD, 1.12, 1250, 600], [E.customer + 0.6, 1.05, 900, 620], [E.customer + 2.6, 1.5, 1150, 760], [E.phone, 1.6, 1150, 780]]);
  const cB = cam(t, [[E.phone - 0.3, 1.0, 1080, 620], [E.alex, 1.12, 1080, 600]]);
  const cC = cam(t, [[E.alex - 0.3, 1.45, 820, 520], [S.dur, 1.0, 1080, 620]]);
  const drive = ip(t, SOLD + 0.5, SOLD + 1.7, 0, 1, Easing.in(Easing.quad));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.phone - 0.3, 0.4)}>
        <Dealership id="p-dl" t={t} cars={0} />
        <g transform={`translate(${drive * 1400} 0)`}>
          <Car x={1280} y={FLOOR + 20} col="#2f6fe0" s={0.85} />
          {t > SOLD ? (
            <g transform={tf(1280, 780, pop(t, SOLD, 0.25))}>
              <rect x={1080} y={720} width={400} height={130} rx={20} fill="rgba(255,255,255,0.8)" stroke="#e0263a" strokeWidth={12} transform="rotate(-8 1280 785)" />
              <text x={1280} y={790} fontFamily="Inter" fontWeight={900} fontSize={96} fill="#e0263a" textAnchor="middle" dominantBaseline="central" transform="rotate(-8 1280 785)">SOLD</text>
            </g>
          ) : null}
        </g>
        <P t={t} x={t > SOLD + 1.8 ? 1560 : 700} yf={FLOOR + 20} outfit="suit" color="#3b3e46" hair="slick" accent="#2f6fe0" arms={["down", "point"]} facing={1} look={1}
          expr={t > SOLD ? "happy" : "neutral"} talk={t < SOLD} seed={50} />
        <P t={t} x={980 + drive * 1400} yf={FLOOR + 20} u={0.95} outfit="tee" color="#f2c84b" hair="cap" accent="#3fae6a" arms={["cheer", "hold"]} hold="paper"
          facing={1} expr="laugh" seed={52} />
        <P t={t} x={lerpN(-250, 1020, ip(t, E.customer, E.customer + 1.4))} yf={FLOOR + 30} outfit="coat" color="#ff7fb0" hair="long" facing={1}
          walk={t > E.customer && t < E.customer + 1.4 ? t * 9 : null} look={1} lookY={0.3} arms={t > E.customer + 1.6 ? ["shrug", "shrug"] : ["cheer", "down"]}
          expr={t > E.customer + 1.6 ? "shock" : "laugh"} seed={51} />
        {t < SOLD ? <Chip x={1280} y={560} text="LAST ONE!" t={t} t0={0.5} bg="#16161c" fg="#ffe36b" size={44} /> : null}
        <Chip x={1330} y={405} text="SHOWROOM EMPTY" t={t} t0={E.customer + 2.2} t1={E.sells} bg="#ffe8ea" fg="#c0182a" size={44} />
        <Chip x={1330} y={405} text="SOLD OUT" t={t} t0={E.sells} bg="#16161c" fg="#ff5a6a" size={40} />
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
        <P t={t} x={760} yf={FLOOR + 20} {...ALEX} arms={["down", "phone"]} hold="phone" lookY={0.6} expr={t > E.alex + 2.6 ? "worried" : "confused"} seed={1} />
        <Chip x={1600} y={720} text="🎉 STILL CELEBRATING" t={t} t0={E.alex + 2.4} bg="#16161c" fg="#ffe36b" size={36} />
        <Bubble x={880} y={560} lines={["Wait... it's all", "sold out?"]} t={t} t0={E.alex + 0.4} size={44} />
      </View>
    </>
  );
};

