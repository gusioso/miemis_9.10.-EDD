import { Easing } from "remotion";
import { Calendar, Street } from "./env";
import { Truck, grow } from "./env2";
import { Chip, H, P, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;

// ------------------------------------------------------------------ 8 · A WORLD FULL OF MILLIONAIRES (as sent by the user)
export const month1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, 0.3, 1.0);
  const build = ip(t, E.factory, S.dur, 0.15, 1, Easing.linear);
  const sky = (Math.sin((t - E.factory) * 3) + 1) / 2;
  const cA = cam(t, [[0, 1.4, 1080, 620], [E.hiring, 1.5, 1080, 600]]);
  const cB = cam(t, [[E.hiring - 0.3, 1.0, 1000, 620], [E.closed + 0.6, 1.0, 1200, 620], [E.factory - 0.3, 1.05, 1700, 610]]);
  const cC = cam(t, [[E.factory - 0.3, 1.0, 1080, 620], [S.dur, 1.0, 1080, 640]]);
  const truckX = (k: number) => ((t - E.trucks + 0.4) * 900 + k * 1100) % 3300 - 600;
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
          <text x={470} y={FLOOR - 400} fontFamily="Inter" fontWeight={900} fontSize={66} fill="#16161c" textAnchor="middle" dominantBaseline="central">
            ${Math.round(grow(t, E.hiring + 0.3, E.hiring + 2.2, 25, 95))} / HOUR</text>
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
        <rect x={2120} y={FLOOR - 600} width={700} height={600} fill="#7fa6cf" stroke={INK} strokeWidth={8} />
        <text x={2470} y={FLOOR - 520} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#fff" textAnchor="middle">QUICKSHIP</text>
        <Chip x={2490} y={FLOOR - 380} text="HIRING $120/HR" t={t} t0={E.closed + 1.2} bg="#e6f9ee" fg="#127a3e" size={38} />
        <P t={t} x={2170} yf={FLOOR + 20} u={0.85} outfit="tee" color="#2fa3a0" hair="cap" accent="#f2c84b" arms={["wave", "down"]} expr="happy" facing={-1} seed={101} />
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
        {t > E.trucks - 0.4 ? [0, 1, 2].map((k) => <Truck key={k} x={truckX(k)} y={FLOOR + 140 + (k % 2) * 60} s={0.55} label="DELIVERY" />) : null}
        <Chip x={1080} y={110} text="NEW FACTORY · 61% BUILT" t={t} t0={E.factory + 0.4} t1={E.trucks - 0.3} bg="#16161c" fg="#ffe36b" size={42} />
        <Chip x={1080} y={110} text={`ORDERS WAITING: ${Math.round(grow(t, E.trucks, S.dur, 48120, 47300)).toLocaleString("en-US")}`} t={t} t0={E.trucks} bg="#16161c" fg="#ff8a6b" size={42} />
      </View>
    </>
  );
};

