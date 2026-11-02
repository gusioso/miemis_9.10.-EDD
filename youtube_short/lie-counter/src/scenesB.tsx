import React from "react";
import { Easing } from "remotion";
import { Bakery, Cake, FLOOR, Frame, Lamp, Room, Sofa, Street, TVSet, Window } from "./env";
import { ALEX, Bubble, Chip, H, Hearts, LILY, MOM, P, ROSE, Ring, Sparkles, VICTOR, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK, LieCounter } from "./Stick";
import type { SceneFn } from "./scenesA";

// TV studio (drawn full size in world coords; scaled into the TV set or shown full screen).
const Studio: React.FC<{ t: number; talk: boolean; cheer: number; replay?: number }> = ({ t, talk, cheer, replay = 0 }) => (
  <g>
    <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#16305e" />
    {[...Array(7)].map((_, i) => (
      <path key={i} d={`M ${200 + i * 300} -40 L ${120 + i * 300} 900 L ${280 + i * 300} 900 Z`} fill="#5ea0ff" opacity={0.08 + 0.04 * Math.sin(t * 2 + i)} />
    ))}
    <rect x={640} y={20} width={880} height={150} rx={20} fill="#0d1f40" stroke="#7fb3ff" strokeWidth={6} />
    <text x={1080} y={98} fontFamily="Inter" fontWeight={900} fontSize={110} fill="#ffffff" textAnchor="middle" dominantBaseline="central" letterSpacing={18}>NOVA</text>
    <path d="M 860 1040 L 900 720 L 1260 720 L 1300 1040 Z" fill="#0d1f40" stroke={INK} strokeWidth={8} />
    <rect x={880} y={700} width={400} height={40} rx={10} fill="#7fb3ff" stroke={INK} strokeWidth={6} />
    <P t={t} x={1080} yf={1000} {...VICTOR} arms={talk ? ["talk", "chest"] : ["down", "chest"]} talk={talk} expr="happy" steps={[[-100, 0]]} seed={30} />
    <rect x={1000} y={760} width={160} height={260} fill="#0d1f40" />
    {[...Array(11)].map((_, i) => {
      const x = 60 + i * 205;
      const jump = cheer * Math.abs(Math.sin(t * 7 + i)) * 30;
      return (
        <g key={i}>
          <circle cx={x} cy={1160 - jump} r={95} fill="#0a1426" />
          {cheer > 0.5 && i % 2 ? (
            <>
              <line x1={x - 70} y1={1180 - jump} x2={x - 120} y2={1030 - jump} stroke="#0a1426" strokeWidth={22} strokeLinecap="round" />
              <line x1={x + 70} y1={1180 - jump} x2={x + 120} y2={1030 - jump} stroke="#0a1426" strokeWidth={22} strokeLinecap="round" />
            </>
          ) : null}
        </g>
      );
    })}
    {cheer > 0
      ? [...Array(24)].map((_, i) => {
        const ph = (t * 0.5 + i / 24) % 1;
        return <rect key={i} x={(i * 173) % 2160} y={-40 + ph * 1200} width={18} height={30} fill={["#ffd56b", "#ff6b8a", "#6bd6ff", "#9be59d"][i % 4]}
          transform={`rotate(${t * 200 + i * 40} ${(i * 173) % 2160} ${-40 + ph * 1200})`} opacity={cheer} />;
      })
      : null}
    <rect x={120} y={860} width={1100} height={130} fill="#ffffff" opacity={0.94} />
    <rect x={120} y={860} width={26} height={130} fill="#9e1b2d" />
    <text x={180} y={910} fontFamily="Inter" fontWeight={900} fontSize={50} fill="#16161c" dominantBaseline="central">VICTOR KANE</text>
    <text x={180} y={960} fontFamily="Inter" fontWeight={700} fontSize={36} fill="#5b6270" dominantBaseline="central">CEO, NOVA BANK · LIVE</text>
    {replay > 0 ? <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#5a5f6e" opacity={0.45 * replay} /> : null}
  </g>
);

const LivingRoom: React.FC<{ t: number; children?: React.ReactNode; dim?: number }> = ({ t, children, dim = 0 }) => (
  <g>
    <Room id="tv-room" wall="#e6c9a3" wall2="#d8b58a" floor="#8a6446" wains="#c99c6b" light={0.12} lightX={500} />
    <Window id="tv-w" x={240} y={150} w={420} h={340} sky={["#ffb56b", "#ffd9a8"]} t={t} kind="city" curtain="#9cc7b8" />
    <Lamp x={120} y={560} on={0.7} />
    <Frame x={760} y={200} w={260} h={190} art="#a7c4e0" />
    {children}
    {dim ? <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#0b0f22" opacity={dim} /> : null}
  </g>
);

// ------------------------------------------------------------------------------ 7 · THE DISCOVERY
export const tv: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const talk = t > E.promise - 0.2 && t < E.promise + 2.0;
  const cheer = ip(t, E.cheer - 0.2, E.cheer + 0.4);
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.promise - 0.8, 1.0, 1080, 620], [E.nomove - 0.3, 1.55, 1560, 430]]);
  const cB = cam(t, [[E.nomove - 0.3, 1.0, 1080, 620], [E.cheer, 1.45, 1080, 430], [E.notice, 1.6, 1080, 410]]);
  const cC = cam(t, [[E.notice - 0.2, 1.7, 760, 560], [S.dur, 2.15, 760, 540]]);
  const tvScale = 760 / W;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.nomove - 0.3, 0.45)}>
        <LivingRoom t={t}>
          <TVSet x={1180} y={180} w={760} h={440} id="tv1">
            <g transform={`translate(1180 180) scale(${tvScale} ${440 / H})`}>
              <Studio t={t} talk={talk} cheer={cheer} />
            </g>
          </TVSet>
          <Sofa x={240} w={900} />
          <P t={t} x={690} yf={FLOOR - 70} sit {...ALEX} facing={1} look={1} lookY={-0.4} expr={t > E.promise + 0.8 ? "thinking" : "neutral"}
            steps={[[-100, 1]]} seed={1} />
          <ellipse cx={1560} cy={420} rx={700} ry={420} fill="#9fd0ff" opacity={0.05} />
        </LivingRoom>
        <Bubble x={1620} y={300} lines={["I care about", "every customer."]} t={t} t0={E.promise - 0.1} size={44} />
      </View>
      <View c={cB} op={shot(t, E.nomove - 0.3, E.notice - 0.2, 0.45)}>
        <Studio t={t} talk={talk} cheer={cheer} />
        <Ring x={1080} y={282} t={t} t0={E.nomove + 0.6} r={80} col="#bfe4ff" />
      </View>
      <View c={cC} op={shot(t, E.notice - 0.2, 1e9, 0.45)}>
        <LivingRoom t={t} dim={0.18}>
          <Sofa x={240} w={900} />
          <P t={t} x={690} yf={FLOOR - 70} sit {...ALEX} facing={1} look={1} lean={ip(t, E.notice, E.notice + 1.2) * 9} expr="suspicious"
            steps={[[-100, 1]]} seed={1} />
          <ellipse cx={900} cy={420} rx={300} ry={260} fill="#9fd0ff" opacity={0.1 + 0.03 * Math.sin(t * 9)} />
        </LivingRoom>
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 8 · THE LOOPHOLE
const Doc: React.FC<{ t: number; hl: number }> = ({ t, hl }) => (
  <g>
    <rect x={1200} y={130} width={760} height={980} rx={18} fill="#fffdf6" stroke={INK} strokeWidth={8} />
    <text x={1580} y={220} fontFamily="Inter" fontWeight={900} fontSize={46} fill="#16161c" textAnchor="middle">NOVA BANK</text>
    <text x={1580} y={272} fontFamily="Inter" fontWeight={700} fontSize={32} fill="#5b6270" textAnchor="middle">CUSTOMER AGREEMENT</text>
    {[...Array(12)].map((_, i) => (
      <rect key={i} x={1260} y={320 + i * 54} width={i % 4 === 3 ? 420 : 640} height={16} rx={8} fill="#cfd2db" />
    ))}
    <rect x={1250} y={968} width={660 * hl} height={70} rx={10} fill="#ffe36b" opacity={0.9} />
    <text x={1270} y={1003} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#9e1b2d" dominantBaseline="central">§14.2 Fees may rise at any time,</text>
    <text x={1270} y={1050} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#9e1b2d" dominantBaseline="central">without notice. Refunds not guaranteed.</text>
  </g>
);

export const loophole: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const care = ip(t, E.cared - 0.7, E.cared - 0.1);
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.split, 1.1, 1080, 560]]);
  const cB = cam(t, [[E.split - 0.2, 1.0, 1080, 620], [E.doc, 1.0, 1080, 620], [E.doc + 1.6, 2.2, 1580, 1000], [E.doc + 2.6, 2.2, 1580, 1000], [E.doc + 3.6, 1.35, 620, 500], [S.dur, 1.4, 600, 480]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.split - 0.25, 0.45)}>
        <Studio t={t * 0.5} talk={t < 2.8} cheer={0} replay={1} />
        <rect x={60} y={40} width={420} height={90} rx={20} fill="#16161c" />
        <text x={270} y={86} fontFamily="Inter" fontWeight={900} fontSize={46} fill="#fff" textAnchor="middle" dominantBaseline="central">▶ REPLAY 0.5×</text>
        <g transform={tf(1080, 560, pop(t, 0.4, 0.4))}>
          <rect x={300} y={470} width={1560} height={190} rx={30} fill="#fffffb" stroke={INK} strokeWidth={6} />
          <rect x={612} y={505} width={250 * care} height={120} rx={14} fill="#ffe36b" />
          <text x={1080} y={568} fontFamily="Inter" fontWeight={900} fontSize={84} fill="#16161c" textAnchor="middle" dominantBaseline="central">
            “I <tspan fill={care > 0.9 ? "#c2410c" : "#16161c"}>care</tspan> about every customer.”
          </text>
        </g>
        <Chip x={1080} y={800} text="CARING ≠ PROMISING" t={t} t0={E.cared + 0.2} bg="#16161c" fg="#ffe36b" />
      </View>
      <View c={cB} op={shot(t, E.split - 0.2, 1e9, 0.45)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#e9e4da" />
        <rect x={-300} y={-300} width={1380} height={H + 600} fill="#cfe0ec" />
        <line x1={1080} y1={-300} x2={1080} y2={H + 300} stroke={INK} strokeWidth={8} />
        <P t={t} x={520} yf={FLOOR} {...VICTOR} arms={["talk", "chest"]} talk={t < E.doc} expr="happy" steps={[[-100, 0]]} seed={30} />
        <Bubble x={600} y={400} lines={["I care about", "every customer."]} t={t} t0={E.split + 0.2} size={42} />
        <Chip x={560} y={190} text="✓ TRUE · counter stays 0" t={t} t0={E.split + 0.9} bg="#e6f9ee" fg="#1d7a44" size={40} />
        <g transform={tf(1580, 620, pop(t, E.split + 0.4, 0.45))}>
          <Doc t={t} hl={ip(t, E.doc + 0.6, E.doc + 1.6)} />
        </g>
        <Chip x={1580} y={60} text="WHAT HE DIDN'T SAY" t={t} t0={E.doc} bg="#16161c" fg="#ff6b6b" size={44} />
        <Ring x={520} y={322} t={t} t0={E.doc + 3.6} r={70} col="#bfe4ff" />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 9 · MONTH 3
export const month3: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const dark = ip(t, 0, S.dur, 0, 0.42, Easing.linear);
  const cA = cam(t, [[0, 1.0, 1080, 620], [E.ad, 1.15, 1080, 580]]);
  const cB = cam(t, [[E.ad - 0.2, 1.0, 1080, 620], [E.friends, 1.1, 1080, 600]]);
  const cC = cam(t, [[E.friends - 0.2, 1.25, 1080, 600], [E.alex, 1.45, 1080, 560]]);
  const cD = cam(t, [[E.alex - 0.2, 1.0, 1080, 620], [S.dur, 1.3, 1000, 560]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.ad - 0.25, 0.45)}>
        <Street id="m3-a" t={t} sky={["#f0b27a", "#f7d9b0"]} dim={dark * 0.5} />
        <P t={t} x={560} yf={FLOOR} outfit="suit" color="#5b6270" hair="slick" accent="#2f6fe0" arms={["down", "talk"]} talk={t < 1.8} facing={1} look={1} steps={[[-100, 9]]} seed={40} />
        <P t={t} x={1000} yf={FLOOR} outfit="coat" color="#8e5bd0" hair="long" facing={-1} look={-1} expr="suspicious" steps={[[-100, 12]]} seed={41} />
        <P t={t} x={1580} yf={FLOOR} outfit="tee" color="#e0463c" hair="curly" arms={["shrug", "shrug"]} talk={t > 1.6} facing={-1} look={-1} steps={[[-100, 15]]} seed={42} />
        <Bubble x={440} y={600} lines={["I never SAID", "I'd pay you back."]} t={t} t0={0.3} t1={1.9} tail="right" size={42} />
        <Bubble x={1460} y={600} lines={["Technically... true."]} t={t} t0={2.0} tail="right" size={42} />
        <Chip x={1080} y={150} text="½ TRUTH" t={t} t0={0.8} bg="#16161c" fg="#ffe36b" />
      </View>
      <View c={cB} op={shot(t, E.ad - 0.2, E.friends - 0.25, 0.45)}>
        <Street id="m3-b" t={t} sky={["#e79a6c", "#f0c49a"]} dim={dark * 0.5} />
        <rect x={180} y={120} width={1100} height={560} rx={20} fill="#fff7e8" stroke={INK} strokeWidth={10} />
        <text x={730} y={300} fontFamily="Inter" fontWeight={900} fontSize={110} fill="#e0463c" textAnchor="middle">30% LESS</text>
        <text x={730} y={420} fontFamily="Inter" fontWeight={900} fontSize={110} fill="#e0463c" textAnchor="middle">SUGAR!*</text>
        <text x={730} y={520} fontFamily="Inter" fontWeight={700} fontSize={30} fill="#6b6f7c" textAnchor="middle">*than our old recipe, which had 40% more sugar.</text>
        <text x={730} y={620} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#16161c" textAnchor="middle">CRUNCHO</text>
        <rect x={700} y={680} width={60} height={360} fill="#5b6270" />
        <P t={t} x={1700} yf={FLOOR} outfit="tee" color="#ff7fb0" hair="long" arms={["down", "film"]} hold="phone" facing={-1} look={-1} talk expr="happy" steps={[[-100, 2]]} seed={43} />
        <circle cx={1440} cy={500} r={70} fill="none" stroke="#fff6c8" strokeWidth={14} />
        <line x1={1440} y1={570} x2={1440} y2={FLOOR} stroke="#5b6270" strokeWidth={10} />
        <Bubble x={1590} y={590} lines={["I've used this", "every day!*"]} t={t} t0={E.ad + 0.6} tail="right" size={40} />
        <Chip x={1700} y={1110} text="*for 2 days" t={t} t0={E.ad + 1.6} size={36} />
      </View>
      <View c={cC} op={shot(t, E.friends - 0.2, E.alex - 0.25, 0.45)}>
        <Street id="m3-c" t={t * 0.3} sky={["#c98a7a", "#e7b49a"]} dim={dark * 0.55} />
        <rect x={-600} y={FLOOR - 60} width={3400} height={1000} fill="#6f8f5e" />
        <rect x={620} y={FLOOR - 230} width={920} height={34} rx={10} fill="#8a6446" stroke={INK} strokeWidth={5} />
        <rect x={620} y={FLOOR - 330} width={920} height={30} rx={10} fill="#8a6446" stroke={INK} strokeWidth={5} />
        <P t={t} x={820} yf={FLOOR - 50} sit outfit="hoodie" color="#f2c84b" hair="curly" facing={1} look={-1} lookY={0.6} expr="awkward" talk={t < E.friends + 1.6} steps={[[-100, 3]]} seed={44} />
        <P t={t} x={1340} yf={FLOOR - 50} sit outfit="coat" color="#2fa3a0" hair="bun" facing={-1} look={1} lookY={0.6} expr="sad" talk={t > E.friends + 1.7 && t < E.friends + 2.4} steps={[[-100, 5]]} seed={45} />
        <Bubble x={930} y={640} lines={["So... how's work?"]} t={t} t0={E.friends + 0.2} t1={E.friends + 1.7} size={44} />
        <Bubble x={1230} y={640} lines={["...It's fine."]} t={t} t0={E.friends + 1.8} tail="right" size={44} />
      </View>
      <View c={cD} op={shot(t, E.alex - 0.2, 1e9, 0.45)}>
        <Street id="m3-d" t={t} sky={["#5d4a6e", "#a77b86"]} dim={dark * 0.6} />
        {[0, 1, 2].map((i) => (
          <P key={i} t={t} x={400 + i * 620 + (t * 40) % 50} yf={FLOOR + 30} u={0.85} outfit={["suit", "tee", "coat"][i] as "suit"} color={["#5b6270", "#c0703a", "#8e5bd0"][i]}
            hair={["slick", "short", "long"][i] as "slick"} expr="smug" facing={i % 2 ? -1 : 1} steps={[[-100, [1, 3, 2][i]]]} seed={50 + i} />
        ))}
        <P t={t} x={1080 + ip(t, E.alex, E.alex + 2.0, 0, -120)} yf={FLOOR + 50} {...ALEX} facing={-1} walk={t < E.alex + 2.0 ? t * 6 : null}
          expr="worried" look={t > E.alex + 2 ? 0.6 : -0.6} steps={[[-100, 1]]} seed={1} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 10 · THE BAKER WITH 47 LIES
const Storefront: React.FC<{ t: number; inside: React.ReactNode }> = ({ t, inside }) => (
  <g>
    <Street id="bk-st" t={t * 0.4} sky={["#ffcf9a", "#fff0dc"]} />
    <rect x={260} y={140} width={1640} height={FLOOR - 140} fill="#c25a44" stroke={INK} strokeWidth={8} />
    <path d="M 230 300 h 1700 l -60 120 h -1580 Z" fill="#f08a24" stroke={INK} strokeWidth={6} />
    {[...Array(9)].map((_, i) => <path key={i} d={`M ${290 + i * 180} 420 q 90 60 180 0`} fill="#fff4e6" stroke={INK} strokeWidth={4} />)}
    <rect x={560} y={170} width={1040} height={110} rx={16} fill="#fff7ea" stroke={INK} strokeWidth={6} />
    <text x={1080} y={226} fontFamily="Inter" fontWeight={900} fontSize={70} fill="#c75a28" textAnchor="middle" dominantBaseline="central">ROSE'S BAKERY</text>
    <defs>
      <clipPath id="bk-glass"><rect x={380} y={470} width={1040} height={500} /></clipPath>
    </defs>
    <g clipPath="url(#bk-glass)">
      <rect x={380} y={470} width={1040} height={500} fill="#ffe2b0" />
      <g transform="translate(380 470) scale(0.48) translate(0 -200)">{inside}</g>
      <rect x={380} y={470} width={1040} height={500} fill="#ffffff" opacity={0.12} />
      <path d={`M ${500 + (t * 60) % 300} 470 l 120 0 l -200 500 l -120 0 Z`} fill="#fff" opacity={0.18} />
    </g>
    <rect x={380} y={470} width={1040} height={500} fill="none" stroke={INK} strokeWidth={10} />
    <rect x={1520} y={470} width={280} height={FLOOR - 470} fill="#7a4f33" stroke={INK} strokeWidth={8} />
    <rect x={1550} y={510} width={220} height={200} fill="#ffe2b0" stroke={INK} strokeWidth={5} />
    <text x={1660} y={790} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#fff7ea" textAnchor="middle">OPEN</text>
  </g>
);

const BakeryInside: React.FC<{ t: number; E: Record<string, number>; give: number; withGirl: boolean; roseExpr?: string }> = ({ t, give, withGirl }) => (
  <g>
    <Bakery id="bk-in" t={t} />
    <P t={t} x={700} yf={FLOOR - 140} {...ROSE} arms={give > 0 ? ["down", "give"] : ["down", "hold"]} facing={1} look={withGirl ? 1 : 0.2}
      expr="warm" steps={[[-100, 47]]} tone="red" seed={60} />
    {withGirl ? (
      <>
        <Cake x={940 + give * 260} y={FLOOR - 400 + give * 40} s={0.62} t={t} />
        <P t={t} x={1500} yf={FLOOR} u={0.62} {...LILY} facing={-1} look={-1} lookY={-0.6} expr={give > 0.6 ? "happy" : "neutral"}
          arms={give > 0.6 ? ["hold", "hold"] : ["down", "down"]} steps={[[-100, 3]]} seed={61} />
        <P t={t} x={1800} yf={FLOOR} u={0.95} {...MOM} facing={-1} look={-1} expr="sad" arms={["chest", "down"]} steps={[[-100, 6]]} seed={62} />
      </>
    ) : null}
  </g>
);

export const baker: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 3.0, 700, 300], [E.c47 + 0.4, 3.0, 700, 300], [E.avoid - 0.3, 1.2, 900, 560]]);
  const cB = cam(t, [[E.avoid - 0.2, 1.0, 1080, 620], [E.almost, 1.05, 1080, 600]]);
  const cC = cam(t, [[E.almost - 0.2, 1.05, 1300, 620], [E.cake - 0.8, 1.05, 1300, 620], [E.cake + 0.6, 1.7, 900, 700], [S.dur, 1.8, 880, 700]]);
  const ax = 2400 - ip(t, E.almost - 0.2, E.almost + 1.6, 0, 1, Easing.out(Easing.quad)) * 680;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.avoid - 0.25, 0.45)}>
        <BakeryInside t={t} E={E} give={0} withGirl={false} />
        <Ring x={700} y={240} t={t} t0={E.c47} r={90} col="#ff4d5e" />
      </View>
      <View c={cB} op={shot(t, E.avoid - 0.2, E.almost - 0.25, 0.45)}>
        <Storefront t={t} inside={<BakeryInside t={t} E={E} give={0} withGirl={false} />} />
        {[0, 1, 2].map((i) => {
          const tt = t - E.avoid - i * 0.7;
          const x = -200 + tt * 380;
          return (
            <P key={i} t={t} x={x} yf={FLOOR + 40 + i * 20} u={0.9} outfit={["coat", "suit", "tee"][i] as "coat"} color={["#8e5bd0", "#5b6270", "#3fae6a"][i]}
              hair={["long", "slick", "cap"][i] as "long"} facing={1} walk={t * 8 + i} look={x > 400 && x < 1300 ? -1 : 0.6} lookY={x > 400 && x < 1300 ? -0.4 : 0}
              expr={x > 600 && x < 1500 ? "suspicious" : "neutral"} steps={[[-100, [4, 2, 7][i]]]} seed={63 + i} />
          );
        })}
      </View>
      <View c={cC} op={shot(t, E.almost - 0.2, 1e9, 0.45)}>
        <Storefront t={t} inside={<BakeryInside t={t} E={E} give={ip(t, E.cake - 0.4, E.cake + 1.2)} withGirl />} />
        <P t={t} x={ax} yf={FLOOR + 50} {...ALEX} facing={-1} walk={ax > 1721 ? t * 7 : null} steps={[[-100, 1]]} seed={1}
          look={t > E.cake - 0.6 ? -1 : t > E.almost + 0.6 ? -0.8 : 0.3} expr={t > E.cake + 0.6 ? "warm" : t > E.almost + 0.6 ? "suspicious" : "neutral"} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 11 · THE TWIST
export const twist: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 2.2, 1150, 640], [E.yes - 0.8, 1.7, 1250, 600]]);
  const cB = cam(t, [[E.yes - 0.3, 1.25, 1000, 560], [E.d48 - 0.6, 1.25, 900, 520], [E.d48, 2.3, 700, 300], [E.d48 + 1.4, 2.3, 700, 300]]);
  const cC = cam(t, [[E.d48 + 1.2, 1.0, 1080, 620], [S.dur, 1.12, 1100, 600]]);
  const scene = (lightUp: boolean, momExpr: "sad" | "warm") => (
    <g>
      <Bakery id="tw-in" t={t} />
      <P t={t} x={700} yf={FLOOR - 140} {...ROSE} arms={["down", t < E.yes + 1.2 ? "give" : "hold"]} facing={1} look={1} lookY={0.4}
        expr="warm" talk={t > E.yes - 0.1 && t < E.yes + 1.1} steps={[[-100, 47], [E.d48, 48]]} tone="red" seed={60} bob={t > E.yes && t < E.yes + 0.8 ? Math.abs(Math.sin((t - E.yes) * 8)) * 8 : 0} />
      <Cake x={1180} y={FLOOR - 320} s={0.62} t={t} />
      <P t={t} x={1420} yf={FLOOR} u={0.62} {...LILY} facing={-1} look={-1} lookY={-0.6} expr={lightUp ? "laugh" : "neutral"} talk={t > E.ask + 0.3 && t < E.ask + 1.6}
        arms={lightUp ? ["cheer", "cheer"] : ["down", "down"]} steps={[[-100, 3]]} seed={61} bob={lightUp ? Math.abs(Math.sin(t * 6)) * 24 : 0} />
      <P t={t} x={1720} yf={FLOOR} u={0.95} {...MOM} facing={-1} look={-1} lookY={t < E.yes ? 0.8 : 0} expr={momExpr} arms={["chest", "down"]} steps={[[-100, 6]]} seed={62} />
      <rect x={1960} y={150} width={240} height={FLOOR - 150} fill="#7a4f33" stroke={INK} strokeWidth={8} />
      <P t={t} x={2060} yf={FLOOR + 20} u={0.92} {...ALEX} facing={-1} look={-1} expr={t > E.d48 + 0.6 ? "warm" : "neutral"} steps={[[-100, 1]]} seed={1} />
    </g>
  );
  return (
    <>
      <View c={cA} op={shot(t, 0, E.yes - 0.3, 0.45)}>
        {scene(false, "sad")}
        <Bubble x={1440} y={560} lines={["Did my mom", "pay for it?"]} t={t} t0={E.ask + 0.3} tail="right" size={40} />
      </View>
      <View c={cB} op={shot(t, E.yes - 0.3, E.d48 + 1.2, 0.45)}>
        {scene(false, "warm")}
        <Bubble x={830} y={430} lines={["Yes, sweetheart.", "She did."]} t={t} t0={E.yes} t1={E.d48 - 0.4} size={44} />
        <Ring x={700} y={214} t={t} t0={E.d48} r={90} col="#ff8a96" />
      </View>
      <View c={cC} op={shot(t, E.d48 + 1.2, 1e9, 0.5)}>
        {scene(t > E.light - 0.1, "warm")}
        <Sparkles cx={1420} cy={560} t={t} n={10} r={180} k={ip(t, E.light, E.light + 0.6)} />
        <Hearts cx={1600} cy={520} t={t} t0={E.light + 0.4} n={5} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 12 · WHO WOULD YOU TRUST?
export const ending: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const dark = ip(t, E.question - 0.5, E.final + 0.4, 0, 0.55);
  const cA = cam(t, [[0, 1.2, 1080, 560], [E.split, 1.35, 1080, 540]]);
  const cB = cam(t, [[E.split - 0.1, 1.08, 1080, 640], [E.final, 1.0, 1080, 620], [S.dur, 1.03, 1080, 610]]);
  const final = t >= E.final;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.split - 0.1, 0.5)}>
        <Street id="en-a" t={t * 0.3} sky={["#ff9e6b", "#ffd9a8"]} />
        <P t={t} x={1080} yf={FLOOR + 30} {...ALEX} arms={["down", "chin"]} expr="thinking" look={0.3} lookY={-0.3} steps={[[-100, 1]]} seed={1} />
      </View>
      <View c={cB} op={shot(t, E.split - 0.1, 1e9, 0.5)}>
        <rect x={-300} y={-300} width={1380} height={H + 600} fill="#2b3c5c" />
        <rect x={1080} y={-300} width={1380} height={H + 600} fill="#e8a266" />
        <ellipse cx={460} cy={560} rx={420} ry={380} fill="#6b8cc4" opacity={0.25} />
        <ellipse cx={1700} cy={560} rx={440} ry={400} fill="#ffd38a" opacity={0.35} />
        <rect x={-300} y={FLOOR} width={W + 600} height={400} fill="#3a2f2a" opacity={0.35} />
        <line x1={1080} y1={-300} x2={1080} y2={H + 300} stroke="#fff" strokeWidth={8} opacity={0.8} />
        <P t={t} x={430} yf={FLOOR + 40} u={1.12} {...VICTOR} arms={["down", "chest"]} expr="smug" facing={1} look={0.6} seed={30} />
        <P t={t} x={1730} yf={FLOOR + 40} u={1.12} {...ROSE} arms={["down", "down"]} expr="warm" facing={-1} look={-0.6} seed={60} />
        <P t={t} x={1080} yf={FLOOR + 90} u={0.9} {...ALEX} arms={["down", "chin"]} expr="thinking" look={Math.sin(t * 0.9) * 0.8} steps={[[-100, 1]]} seed={1} />
        <Chip x={430} y={1150} text="0 LIES" t={t} t0={E.split + 0.4} bg="#e6f9ee" fg="#1d7a44" size={46} />
        <Chip x={1730} y={1150} text="48 LIES" t={t} t0={E.split + 0.8} bg="#ffe8ea" fg="#c0182a" size={46} />
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#050712" opacity={dark} />
        <LieCounter x={430} y={FLOOR + 40 - 1.12 * (530 + 80 + 92)} t={t} steps={[[-100, 0]]} t0={E.split + 0.2} u={1.12} tone="green" />
        <LieCounter x={1730} y={FLOOR + 40 - 1.12 * (530 + 80 + 132)} t={t} steps={[[-100, 48]]} t0={E.split + 0.6} u={1.12} tone="red" />
        <Ring x={430} y={FLOOR + 40 - 1.12 * 702} t={t} t0={E.zero} r={90} col="#3dff8b" />
        <Ring x={1730} y={FLOOR + 40 - 1.12 * 742} t={t} t0={E.f48} r={90} col="#ff4d5e" />
        {final ? (
          <g transform={tf(1080, 860, pop(t, E.final, 0.5))}>
            <rect x={210} y={740} width={1740} height={250} rx={50} fill="#fffffb" stroke={INK} strokeWidth={10} />
            <text x={1080} y={868} fontFamily="Inter" fontWeight={900} fontSize={126} fill="#141419" textAnchor="middle" dominantBaseline="central">WHO WOULD YOU TRUST?</text>
          </g>
        ) : null}
      </View>
    </>
  );
};
