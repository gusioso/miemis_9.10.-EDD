import React from "react";
import { Easing } from "remotion";
import { Bed, BigPhone, CoffeeCounter, CoffeeShop, Frame, LyingHead, Room, Street, Window } from "./env";
import { Apartments, Supermarket, Truck } from "./env2";
import { ALEX, BOSS, Bubble, Chip, Emoji, H, MANAGER, P, Ring, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK, QuiffHair } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ shared bits
export const BedRoom: React.FC<{ t: number; id: string; expr: React.ComponentProps<typeof LyingHead>["expr"]; look?: number; clock?: string; reach?: number; night?: boolean }> = ({
  t, id, expr, look = 0, clock = "7:00", reach = 0, night = false,
}) => {
  const hx = 760;
  const hy = FLOOR - 372;
  const px = 380;
  return (
    <g>
      <Room id={id} wall={night ? "#3a4466" : "#cfe0ec"} wall2={night ? "#2c3452" : "#bcd3e3"} floor={night ? "#5a4636" : "#b88b63"} lightX={900} light={night ? 0.05 : 0.18} />
      <Window id={`${id}-w`} x={1320} y={150} w={560} h={400} sky={night ? ["#0b1030", "#1b2350"] : ["#ffd9a8", "#fff3dc"]} t={t} kind={night ? "night" : "trees"} curtain="#f4b9a4" />
      <Frame x={560} y={190} w={240} h={190} art="#f3c37b" />
      <rect x={150} y={FLOOR - 260} width={380} height={260} rx={14} fill="#a6774f" stroke={INK} strokeWidth={6} />
      <rect x={190} y={FLOOR - 340} width={150} height={80} rx={12} fill="#1d1d26" stroke={INK} strokeWidth={5} />
      <text x={265} y={FLOOR - 299} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#ff6b5b" textAnchor="middle" dominantBaseline="central">{clock}</text>
      <rect x={px} y={FLOOR - 290} width={110} height={30} rx={8} fill="#1c1c26" stroke="#9a9aae" strokeWidth={3} />
      <Bed x={580} w={1280} />
      {reach > 0 ? (
        <polyline points={`${hx - 100},${FLOOR - 300} ${hx - 210 + 30 * (1 - reach)},${FLOOR - 330} ${px + 70 + (1 - reach) * 160},${FLOOR - 300}`}
          fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      <LyingHead x={hx} y={hy} t={t} expr={expr} look={look} />
      {night ? <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#0b1030" opacity={0.25} /> : null}
    </g>
  );
};

/** Over-the-shoulder big head (Alex) in the corner of phone close-ups. */
export const BigHead: React.FC<{ x?: number; y?: number; r?: number; worried?: boolean }> = ({ x = 330, y = 1080, r = 230, worried }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={INK} />
    <QuiffHair x={x} y={y} u={r / 80} layer="front" />
    {[-1, 1].map((s) => (
      <g key={s}>
        <ellipse cx={x + s * 80} cy={y - 70} rx={56} ry={66} fill="#fff" />
        <circle cx={x + s * 80 + 18} cy={y - 90} r={20} fill={INK} />
        <line x1={x + s * 80 - 40} y1={y - 180 + (worried ? s * -14 : 0)} x2={x + s * 80 + 40} y2={y - 180 + (worried ? s * 14 : 0)} stroke="#e9e9ee" strokeWidth={14} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

/** Phone screen with "No connection". k = how far the restart spinner is (0 = none). */
const NoNet: React.FC<{ t: number; t0: number; spin: number }> = ({ t, t0, spin }) => (
  <g>
    <rect x={826} y={66} width={508} height={70} fill="#e9ecf3" />
    <text x={850} y={110} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#5b6270">7:00</text>
    <text x={1310} y={110} fontFamily="Inter" fontWeight={800} fontSize={28} fill="#d0182e" textAnchor="end">No Service</text>
    <g transform={tf(1080, 400, pop(t, t0 - 1.0))}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${1080 - 70 - i * 55} ${410 - i * 40} Q 1080 ${330 - i * 95} ${1080 + 70 + i * 55} ${410 - i * 40}`} fill="none" stroke="#b9bfcc" strokeWidth={22} strokeLinecap="round" />
      ))}
      <circle cx={1080} cy={445} r={20} fill="#b9bfcc" />
      <line x1={950} y1={250} x2={1210} y2={500} stroke="#e0263a" strokeWidth={22} strokeLinecap="round" />
    </g>
    {t > t0 ? (
      <g transform={tf(1080, 620, pop(t, t0))}>
        <text x={1080} y={600} fontFamily="Inter" fontWeight={900} fontSize={62} fill="#16161c" textAnchor="middle" dominantBaseline="central">No connection</text>
        <text x={1080} y={670} fontFamily="Inter" fontWeight={700} fontSize={32} fill="#6b6f7c" textAnchor="middle" dominantBaseline="central">Check your network settings</text>
      </g>
    ) : null}
    {spin > 0 && spin < 1 ? (
      <g>
        <rect x={826} y={66} width={508} height={968} fill="#000" opacity={0.75} />
        <circle cx={1080} cy={560} r={70} fill="none" stroke="#2f2f3a" strokeWidth={16} />
        <path d={`M 1080 490 A 70 70 0 0 1 ${1080 + 70 * Math.sin(t * 9)} ${560 - 70 * Math.cos(t * 9)}`} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" />
        <text x={1080} y={700} fontFamily="Inter" fontWeight={800} fontSize={36} fill="#fff" textAnchor="middle">Restarting...</text>
      </g>
    ) : null}
  </g>
);

// ------------------------------------------------------------------ 1 · NO CONNECTION
export const hook: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.15, 1000, 600], [E.reach, 1.5, 620, 640], [E.phone - 0.3, 1.8, 520, 700]]);
  const cB = cam(t, [[E.phone - 0.3, 1.15, 1080, 560], [E.window - 0.5, 1.3, 1080, 500]]);
  const cC = cam(t, [[E.window - 0.4, 1.35, 1080, 560], [S.dur, 1.0, 1080, 620]]);
  const spinK = (a: number) => (t > a && t < a + 0.8 ? (t - a) / 0.8 : 0);
  const spin = Math.max(spinK(E.restart + 0.2), spinK(E.restart + 1.1));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.phone - 0.3, 0.35)}>
        <BedRoom t={t} id="h-bed" expr={t < E.reach - 0.8 ? "sleep" : "open"} look={t > E.reach ? -0.8 : 0} reach={ip(t, E.reach, E.reach + 0.6)} />
      </View>
      <View c={cB} op={shot(t, E.phone - 0.3, E.window - 0.4, 0.35)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#bcd3e3" />
        <BigPhone x={1080} y={600} w={620} h={1080} tilt={Math.sin(t * 30) * (spin > 0 ? 0.6 : 0)}>
          <NoNet t={t} t0={E.noconn} spin={spin} />
        </BigPhone>
        <BigHead worried={t > E.noconn} />
        {t > E.restart ? <Chip x={1650} y={300} text={`↻ RESTART ×${t > E.restart + 1.1 ? 2 : 1}`} t={t} t0={E.restart + 0.1} size={44} /> : null}
      </View>
      <View c={cC} op={shot(t, E.window - 0.4, 1e9, 0.35)}>
        <Apartments id="h-apt" t={t} party={0} />
        {[[420, 0], [760, 1], [1260, 0], [1700, 2], [520, 2], [1440, 1], [1860, 0], [300, 1]].map(([x, r], i) => (
          <g key={i}>
            <P t={t} x={x} yf={350 + r * 330} u={0.42} outfit={["tee", "dress", "hoodie", "coat", "suit", "tee", "cardigan", "hoodie"][i] as "tee"}
              color={["#e0463c", "#ff7fb0", "#f2c84b", "#2fa3a0", "#5b6270", "#8e5bd0", "#c0703a", "#3fae6a"][i]} hair={["short", "long", "curly", "bun", "slick", "cap", "bald", "short"][i] as "short"}
              arms={["down", "phoneUp"]} hold="phone" expr={i % 2 ? "confused" : "worried"} seed={20 + i} shadow={false} />
            {t > E.notjust - 0.3 + i * 0.1 ? <Emoji x={x + 70} y={120 + r * 330} size={56} e="❓" s={pop(t, E.notjust - 0.3 + i * 0.1)} /> : null}
          </g>
        ))}
        <Chip x={1080} y={1150} text="🌐 NO INTERNET · ANYWHERE" t={t} t0={E.notjust + 0.6} bg="#16161c" fg="#ff8a8a" size={44} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 2 · CASH ONLY
const CardReader: React.FC<{ x: number; y: number; t: number; fail: number }> = ({ x, y, t, fail }) => (
  <g>
    <rect x={x - 90} y={y - 150} width={180} height={150} rx={20} fill="#2a2d36" stroke={INK} strokeWidth={6} />
    <rect x={x - 70} y={y - 132} width={140} height={70} rx={8} fill={t > fail ? "#3a0f14" : "#0d2238"} />
    {t > fail ? (
      <text x={x} y={y - 97} fontFamily="Inter" fontWeight={900} fontSize={28} fill="#ff5a6a" textAnchor="middle" dominantBaseline="central">OFFLINE ✕</text>
    ) : (
      <g>
        <circle cx={x} cy={y - 97} r={18} fill="none" stroke="#2f4f70" strokeWidth={6} />
        <path d={`M ${x} ${y - 115} A 18 18 0 0 1 ${x + 18 * Math.sin(t * 8)} ${y - 97 - 18 * Math.cos(t * 8)}`} fill="none" stroke="#8fd0ff" strokeWidth={6} strokeLinecap="round" />
      </g>
    )}
    {[0, 1, 2].map((i) => <rect key={i} x={x - 60 + i * 44} y={y - 46} width={32} height={22} rx={5} fill="#5b6270" />)}
  </g>
);

export const cafe: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const fail = E.spin + 1.2;
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.spin, 1.25, 900, 600], [E.cash, 1.3, 860, 560]]);
  const cB = cam(t, [[E.wallet - 0.3, 1.35, 1080, 600], [E.nothing, 1.1, 1080, 620], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.wallet - 0.3, 0.35)}>
        <CoffeeShop t={t} id="c-shop" />
        <P t={t} x={560} yf={FLOOR - 300} u={0.95} {...BOSS} arms={t > E.cash ? ["talk", "down"] : ["down", "hips"]} talk={t > E.cash && t < E.cash + 1.4} facing={1} look={1}
          expr={t > E.cash ? "awkward" : "neutral"} seed={30} />
        <CoffeeCounter t={t} />
        <CardReader x={1100} y={FLOOR - 350} t={t} fail={fail} />
        {t > E.cash ? (
          <g transform={tf(820, 470, pop(t, E.cash))}>
            <rect x={640} y={420} width={360} height={110} rx={10} fill="#fffdf6" stroke={INK} strokeWidth={5} transform="rotate(-4 820 475)" />
            <text x={820} y={478} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#d0182e" textAnchor="middle" dominantBaseline="central" transform="rotate(-4 820 475)">CASH ONLY</text>
          </g>
        ) : null}
        <P t={t} x={1420} yf={FLOOR + 20} {...ALEX} facing={-1} look={-1} arms={t < fail ? ["give", "down"] : ["shrug", "shrug"]} hold={t < fail ? "phone" : null}
          expr={t > fail ? "confused" : "neutral"} seed={1} />
        {[0, 1, 2].map((i) => (
          <P key={i} t={t} x={1680 + i * 200} yf={FLOOR + 30} u={0.9} outfit={["coat", "tee", "suit"][i] as "coat"} color={["#8e5bd0", "#3fae6a", "#5b6270"][i]}
            hair={["long", "cap", "slick"][i] as "long"} accent="#e0463c" facing={-1} look={-1} arms={t > fail + 0.4 ? ["down", "phone"] : ["down", "down"]} hold={t > fail + 0.4 ? "phone" : null}
            expr={t > fail + 0.6 ? "worried" : "neutral"} seed={40 + i} />
        ))}
        <Bubble x={640} y={480} lines={["Sorry. Cash only today."]} t={t} t0={E.cash} t1={E.wallet - 0.3} tail="left" size={44} />
      </View>
      <View c={cB} op={shot(t, E.wallet - 0.3, 1e9, 0.35)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#e9d3b4" />
        <g transform={tf(760, 620, pop(t, E.wallet - 0.2, 0.4))}>
          <rect x={430} y={380} width={660} height={460} rx={40} fill="#6b4a33" stroke={INK} strokeWidth={8} />
          <rect x={470} y={330} width={300} height={160} rx={10} fill="#8fc98f" stroke={INK} strokeWidth={5} transform="rotate(-8 620 410)" />
          <text x={620} y={415} fontFamily="Inter" fontWeight={900} fontSize={64} fill="#1d5a2a" textAnchor="middle" dominantBaseline="central" transform="rotate(-8 620 410)">$10</text>
          <circle cx={900} cy={420} r={50} fill="#d9c27a" stroke={INK} strokeWidth={5} />
          <text x={900} y={422} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#6b5a2a" textAnchor="middle" dominantBaseline="central">$1</text>
          <rect x={430} y={560} width={660} height={60} fill="#5a3e2b" />
        </g>
        <Chip x={760} y={960} text="ALEX: $11 CASH" t={t} t0={E.wallet + 0.3} bg="#16161c" fg="#7dffb0" size={48} />
        <g opacity={ip(t, E.nothing - 0.4, E.nothing)}>
          {[0, 1, 2].map((i) => (
            <P key={i} t={t} x={1350 + i * 240} yf={FLOOR + 20} u={0.85} outfit={["coat", "tee", "suit"][i] as "coat"} color={["#8e5bd0", "#3fae6a", "#5b6270"][i]}
              hair={["long", "cap", "slick"][i] as "long"} accent="#e0463c" arms={["shrug", "shrug"]} expr="worried" seed={50 + i} />
          ))}
          <Chip x={1590} y={300} text="MOST PEOPLE: $0" t={t} t0={E.nothing} bg="#ffe8ea" fg="#c0182a" size={46} />
        </g>
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 3 · MONEY IS JUST NUMBERS
const ServerRoom: React.FC<{ t: number; off: number }> = ({ t, off }) => (
  <g>
    <Room id="b-srv" wall="#1b2236" wall2="#141a2a" floor="#2a3044" lightX={1080} light={0.06} />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <rect x={120 + i * 400} y={220} width={300} height={FLOOR - 220} rx={10} fill="#2c3448" stroke={INK} strokeWidth={6} />
        {[...Array(9)].map((_, j) => (
          <g key={j}>
            <rect x={140 + i * 400} y={250 + j * 85} width={260} height={60} rx={6} fill="#20263a" />
            {[0, 1, 2, 3].map((k) => {
              const on = Math.sin(t * (6 + k) + i * 3 + j) > 0.2;
              return <circle key={k} cx={170 + i * 400 + k * 30} cy={280 + j * 85} r={7} fill={off > 0.5 ? "#5a2030" : on ? "#3dff8b" : "#1d5a3a"} />;
            })}
          </g>
        ))}
      </g>
    ))}
  </g>
);

export const bank: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.atm - 0.3, 1.15, 1080, 580]]);
  const cB = cam(t, [[E.atm - 0.3, 1.25, 700, 600], [E.lines, 1.05, 1200, 620], [S.dur, 0.95, 1450, 640]]);
  const lineN = Math.floor(ip(t, E.atm, E.lines + 1.5, 6, 16, Easing.linear));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.atm - 0.3, 0.35)}>
        <ServerRoom t={t} off={ip(t, E.numbers + 0.8, E.numbers + 1.0)} />
        <g transform={tf(1080, 560, pop(t, 0.4))}>
          <rect x={620} y={380} width={920} height={360} rx={30} fill="#0d2238" stroke="#8fd0ff" strokeWidth={6} />
          <text x={1080} y={460} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#8fd0ff" textAnchor="middle">ALEX · SAVINGS</text>
          <text x={1080} y={570} fontFamily="Inter" fontWeight={900} fontSize={96} fill={t > E.numbers + 0.8 ? "#5a6a80" : "#ffffff"} textAnchor="middle" dominantBaseline="central">
            $2,340.17
          </text>
          {t > E.numbers + 0.8 ? <text x={1080} y={680} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#ff5a6a" textAnchor="middle">SERVER UNREACHABLE</text> : null}
        </g>
        <Chip x={1080} y={180} text="💾 MONEY = DATA" t={t} t0={E.numbers} bg="#16161c" fg="#ffe36b" size={46} />
      </View>
      <View c={cB} op={shot(t, E.atm - 0.3, 1e9, 0.35)}>
        <Street id="b-st" t={t * 0.3} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={160} y={FLOOR - 780} width={900} height={780} fill="#e6e1d6" stroke={INK} strokeWidth={8} />
        <path d={`M 120 ${FLOOR - 780} L 610 ${FLOOR - 920} L 1100 ${FLOOR - 780} Z`} fill="#cfc8bb" stroke={INK} strokeWidth={8} />
        <text x={610} y={FLOOR - 820} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#2a3350" textAnchor="middle">CITY BANK</text>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={230 + i * 210} y={FLOOR - 700} width={60} height={560} fill="#f4f1ea" stroke={INK} strokeWidth={5} />)}
        <rect x={860} y={FLOOR - 420} width={170} height={300} rx={14} fill="#5b6270" stroke={INK} strokeWidth={6} />
        <rect x={880} y={FLOOR - 395} width={130} height={90} rx={6} fill="#3a0f14" />
        <text x={945} y={FLOOR - 360} fontFamily="Inter" fontWeight={900} fontSize={22} fill="#ff5a6a" textAnchor="middle">OUT OF</text>
        <text x={945} y={FLOOR - 332} fontFamily="Inter" fontWeight={900} fontSize={22} fill="#ff5a6a" textAnchor="middle">SERVICE</text>
        {Array.from({ length: lineN }).map((_, i) => (
          <P key={i} t={t} x={1150 + i * 150} yf={FLOOR + 30} u={0.78}
            {...(i === 4 ? ALEX : { outfit: (["tee", "coat", "suit", "hoodie", "dress", "tee", "cardigan", "hoodie"] as const)[i % 8],
              color: ["#e0463c", "#8e5bd0", "#5b6270", "#f2c84b", "#ff7fb0", "#3fae6a", "#c0703a", "#2fa3a0"][i % 8], hair: (["short", "long", "slick", "curly", "bun", "cap", "bald", "short"] as const)[i % 8] })}
            accent="#2f6fe0" facing={-1} look={-1} arms={i % 3 ? ["down", "down"] : ["hips", "hips"]} expr={i % 2 ? "worried" : "angry"} seed={60 + i}
            bob={Math.abs(Math.sin(t * 2 + i)) * 4} />
        ))}
        <Ring x={945} y={FLOOR - 350} t={t} t0={E.atm + 0.3} r={80} col="#ff5a6a" />
        <Chip x={1700} y={300} text="⏳ WAIT: 4 HOURS" t={t} t0={E.lines + 0.2} bg="#16161c" fg="#ffb238" size={46} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 4 · THE SUPERMARKET
export const store: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const stock = ip(t, 0, S.dur, 0.85, 0.25, Easing.inOut(Easing.quad));
  const cA = cam(t, [[0, 1.05, 1080, 620], [E.trucks - 0.4, 1.12, 1000, 600]]);
  const cB = cam(t, [[E.trucks - 0.4, 1.0, 1080, 620], [E.paper - 0.3, 1.08, 1000, 600]]);
  const cC = cam(t, [[E.paper - 0.3, 1.3, 760, 560], [S.dur, 1.15, 900, 600]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.trucks - 0.4, 0.35)}>
        <Supermarket id="s-sm" t={t} stock={stock} />
        <P t={t} x={1080} yf={FLOOR - 10} {...MANAGER} arms={["down", "phone"]} hold="phone" lookY={0.5} expr="worried" seed={70} />
        <g transform={tf(1080, 360, pop(t, 0.8))}>
          <rect x={860} y={300} width={440} height={120} rx={16} fill="#16161c" />
          <text x={1080} y={340} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#8fd0ff" textAnchor="middle">INVENTORY SYSTEM</text>
          <text x={1080} y={390} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#ff5a6a" textAnchor="middle">OFFLINE</text>
        </g>
      </View>
      <View c={cB} op={shot(t, E.trucks - 0.4, E.paper - 0.3, 0.35)}>
        <Street id="s-st" t={t * 0.2} sky={["#c9d6e2", "#eef2f6"]} />
        <Truck x={900} y={FLOOR + 160} s={0.95} />
        <P t={t} x={1500} yf={FLOOR + 40} u={0.95} outfit="tee" color="#e08a2b" hair="cap" accent="#5b6270" arms={["shrug", "shrug"]} expr="confused" facing={-1} look={-1} seed={71} />
        <Bubble x={1560} y={520} lines={["Where do I deliver?"]} t={t} t0={E.trucks + 0.2} tail="right" size={44} />
        <Chip x={900} y={300} text="📦 ORDERS: LOST" t={t} t0={E.trucks + 0.5} bg="#ffe8ea" fg="#c0182a" size={44} />
      </View>
      <View c={cC} op={shot(t, E.paper - 0.3, 1e9, 0.35)}>
        <Supermarket id="s-sm2" t={t} stock={stock} />
        <P t={t} x={760} yf={FLOOR - 10} {...MANAGER} arms={["hold", "chest"]} hold="paper" holdHand={0} lookY={0.6} expr="thinking" seed={70} />
        <g transform={tf(1240, 520, pop(t, E.paper + 1.0))}>
          <rect x={1080} y={430} width={340} height={200} rx={8} fill="#fffdf6" stroke={INK} strokeWidth={5} transform="rotate(5 1250 530)" />
          <text x={1250} y={500} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#d0182e" textAnchor="middle" transform="rotate(5 1250 530)">LIMIT 2</text>
          <text x={1250} y={560} fontFamily="Inter" fontWeight={800} fontSize={30} fill={INK} textAnchor="middle" transform="rotate(5 1250 530)">per customer</text>
        </g>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={640 + i * 6} y1={700 + i * 16} x2={720 - i * 4} y2={700 + i * 16} stroke="#3f7fd6" strokeWidth={4} opacity={ip(t, E.paper + i * 0.3, E.paper + i * 0.3 + 0.2)} />
        ))}
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 5 · PEOPLE GO OUTSIDE
const Radio: React.FC<{ x: number; y: number; t: number; on: number }> = ({ x, y, t, on }) => (
  <g>
    <rect x={x - 150} y={y - 170} width={300} height={170} rx={24} fill="#c0703a" stroke={INK} strokeWidth={6} />
    <circle cx={x - 60} cy={y - 85} r={50} fill="#5a3e2b" stroke={INK} strokeWidth={5} />
    {[0, 1, 2].map((i) => <circle key={i} cx={x - 60} cy={y - 85} r={14 + i * 12} fill="none" stroke="#3a2a1e" strokeWidth={3} />)}
    <rect x={x + 10} y={y - 140} width={110} height={44} rx={6} fill={on > 0 ? "#ffe9a0" : "#f2d7a6"} stroke={INK} strokeWidth={4} />
    <circle cx={x + 50} cy={y - 50} r={16} fill="#f2c84b" stroke={INK} strokeWidth={4} />
    <circle cx={x + 100} cy={y - 50} r={16} fill="#f2c84b" stroke={INK} strokeWidth={4} />
    <line x1={x + 110} y1={y - 170} x2={x + 190} y2={y - 330} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    {on > 0 ? [0, 1, 2].map((i) => {
      const ph = (t * 0.8 + i / 3) % 1;
      return <path key={i} d={`M ${x - 200 - ph * 80} ${y - 170} q -30 ${-60} 0 ${-120}`} fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={(1 - ph) * on} />;
    }) : null}
  </g>
);

export const street: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.share - 0.4, 1.08, 1100, 600]]);
  const cB = cam(t, [[E.share - 0.4, 1.2, 1080, 600], [E.radio, 1.4, 1080, 620], [S.dur, 1.25, 1080, 600]]);
  const out = (i: number) => ip(t, E.outside - 1.2 + i * 0.25, E.outside + i * 0.25, 0, 1, Easing.out(Easing.quad));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.share - 0.4, 0.35)}>
        <Street id="t-st" t={t * 0.1} sky={["#a7dcf6", "#eaf6fb"]} />
        {[0, 1, 2, 3, 4].map((i) => {
          const k = out(i);
          const x = 260 + i * 400;
          return (
            <P key={i} t={t} x={x + (1 - k) * (i % 2 ? 60 : -60)} yf={FLOOR + 30 - (1 - k) * 40} u={0.9} outfit={["cardigan", "tee", "dress", "coat", "hoodie"][i] as "tee"}
              color={["#8e5bd0", "#e0463c", "#ff7fb0", "#2fa3a0", "#3fae6a"][i]} hair={["grayBun", "short", "long", "bun", "curly"][i] as "short"} glasses={i === 0}
              arms={k > 0.9 ? (i % 2 ? ["wave", "down"] : ["down", "wave"]) : ["down", "down"]} expr={k > 0.9 ? "happy" : "neutral"} facing={i % 2 ? -1 : 1} look={i % 2 ? -1 : 1} seed={80 + i} />
          );
        })}
        <P t={t} x={lerp(-200, 1100, ip(t, 0.3, E.outside + 0.4))} yf={FLOOR + 60} {...ALEX} walk={t < E.outside + 0.4 ? t * 8 : null} facing={1} look={1}
          arms={t > E.outside + 0.6 ? ["down", "wave"] : ["down", "down"]} expr="happy" seed={1} />
        {[0, 1].map((i) => (
          <P key={i} t={t} x={1500 + i * 260 + Math.sin(t * 3 + i) * 60} yf={FLOOR + 140 - Math.abs(Math.sin(t * 5 + i)) * 40} u={0.6} outfit="tee" color={["#f2c84b", "#3f7fd6"][i]}
            hair={["pigtails", "cap"][i] as "cap"} accent="#e0463c" arms={["cheer", "cheer"]} expr="laugh" seed={90 + i} />
        ))}
        <circle cx={1630 + Math.sin(t * 3) * 160} cy={FLOOR + 40 - Math.abs(Math.sin(t * 4)) * 160} r={34} fill="#e0463c" stroke={INK} strokeWidth={5} />
        <Chip x={1080} y={200} text="📵 SCREEN TIME: 0 H" t={t} t0={E.outside + 0.4} bg="#16161c" fg="#7dffb0" size={46} />
      </View>
      <View c={cB} op={shot(t, E.share - 0.4, 1e9, 0.35)}>
        <Street id="t-st2" t={t * 0.1} sky={["#ffd9a8", "#fff1dc"]} />
        <rect x={760} y={FLOOR - 250} width={640} height={30} rx={8} fill="#8a6446" stroke={INK} strokeWidth={5} />
        <rect x={790} y={FLOOR - 220} width={24} height={220} fill="#6b4b33" />
        <rect x={1346} y={FLOOR - 220} width={24} height={220} fill="#6b4b33" />
        <Radio x={1080} y={FLOOR - 250} t={t} on={ip(t, E.radio - 0.3, E.radio + 0.2)} />
        {[0, 1, 2, 3, 4].map((i) => {
          const x = [480, 640, 1520, 1700, 1880][i];
          return (
            <P key={i} t={t} x={x} yf={FLOOR + 30} u={0.92} outfit={["cardigan", "tee", "dress", "coat", "hoodie"][i] as "tee"}
              color={["#8e5bd0", "#e0463c", "#ff7fb0", "#2fa3a0", "#3fae6a"][i]} hair={["grayBun", "short", "long", "bun", "curly"][i] as "short"} glasses={i === 0}
              facing={x < 1080 ? 1 : -1} look={x < 1080 ? 1 : -1} arms={i === 1 ? ["talk", "down"] : ["down", "hips"]} talk={i === 1 && t < E.radio} expr={t > E.radio + 0.3 ? "happy" : "neutral"} seed={80 + i} />
          );
        })}
        <P t={t} x={300} yf={FLOOR + 30} {...ALEX} facing={1} look={1} arms={["down", "chin"]} expr={t > E.radio + 0.3 ? "happy" : "thinking"} seed={1} />
        <Chip x={1080} y={250} text="📻 THE RADIO STILL WORKS" t={t} t0={E.radio + 0.2} bg="#16161c" fg="#ffe36b" size={46} />
      </View>
    </>
  );
};
