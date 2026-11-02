import React from "react";
import { Easing } from "remotion";
import { BigPhone, Bed, Calendar, ChatBubble, CoffeeCounter, CoffeeShop, FLOOR, Frame, LyingHead, Panel, Plant, Room, Street, Window, WallClock } from "./env";
import { ALEX, BOSS, Bubble, Chip, Emoji, H, P, Ring, SAM, Sparkles, View, W, cam, ip, pop, shot, tf, ticks } from "./kit";
import { INK, LieCounter, Stick } from "./Stick";

export type SceneData = { id: string; dur: number; ev: Record<string, number>; L: number[]; Le: number[] };
export type SceneFn = (p: { S: SceneData; t: number }) => React.ReactNode;

// Alex in bed (used by the hook, the flashback and the first lie).
const BedRoom: React.FC<{ t: number; id: string; expr: React.ComponentProps<typeof LyingHead>["expr"]; look?: number; steps?: [number, number][]; c0?: number; phone?: number; sky?: [string, string] }> = ({
  t, id, expr, look = 0, steps, c0 = -10, phone = 0, sky = ["#ffd9a8", "#fff3dc"],
}) => {
  const hx = 690;
  const hy = FLOOR - 372;
  return (
    <g>
      <Room id={id} wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" lightX={900} />
      <Window id={`${id}-w`} x={1240} y={150} w={560} h={400} sky={sky} t={t} kind="trees" curtain="#f4b9a4" />
      <Frame x={180} y={190} w={240} h={190} art="#f3c37b" />
      <rect x={1880} y={FLOOR - 230} width={220} height={230} rx={14} fill="#a6774f" stroke={INK} strokeWidth={6} />
      <rect x={1900} y={FLOOR - 300} width={130} height={70} rx={12} fill="#1d1d26" stroke={INK} strokeWidth={5} />
      <text x={1965} y={FLOOR - 264} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#ff6b5b" textAnchor="middle" dominantBaseline="central">7:42</text>
      <Bed x={510} w={1280} />
      {phone > 0 ? (
        <g opacity={phone}>
          <polyline points={`${hx + 170},${FLOOR - 300} ${hx + 210},${hy - 120} ${hx + 120},${hy - 190}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={hx + 60} y={hy - 250} width={110} height={70} rx={12} fill="#1c1c26" stroke="#9a9aae" strokeWidth={3} transform={`rotate(-12 ${hx + 115} ${hy - 215})`} />
          <rect x={hx + 70} y={hy - 242} width={90} height={54} rx={6} fill="#8fd0ff" transform={`rotate(-12 ${hx + 115} ${hy - 215})`} />
          <ellipse cx={hx + 60} cy={hy - 120} rx={150} ry={110} fill="#8fd0ff" opacity={0.08} />
        </g>
      ) : null}
      <LyingHead x={hx} y={hy} t={t} expr={expr} look={look} />
      {steps ? <LieCounter x={hx} y={hy - 210} t={t} steps={steps} t0={c0} /> : null}
    </g>
  );
};

const Crowd: React.FC<{ t: number; vals: number[] | null; c0?: number; walk?: boolean; zeroFlash?: number; seed?: number }> = ({ t, vals, c0 = -10, walk = true, zeroFlash, seed = 0 }) => {
  const cast = [
    { outfit: "tee", color: "#e0463c", hair: "short" }, { outfit: "coat", color: "#8e5bd0", hair: "long" },
    { outfit: "suit", color: "#5b6270", hair: "slick", accent: "#2f6fe0" }, { outfit: "hoodie", color: "#f2c84b", hair: "curly" },
    { outfit: "tee", color: "#3fae6a", hair: "cap", accent: "#2f6fe0" }, { outfit: "dress", color: "#ff7fb0", hair: "bun" },
    { outfit: "cardigan", color: "#c0703a", hair: "bald", mustache: true }, { outfit: "hoodie", color: "#2fa3a0", hair: "short" },
  ] as const;
  return (
    <g>
      {cast.map((c, i) => {
        const dir = i % 2 ? -1 : 1;
        const base = 160 + i * 270;
        const x = walk ? ((base + dir * t * (70 + (i % 3) * 18) + 400) % 2900 + 2900) % 2900 - 380 : base;
        const yf = FLOOR + (i % 2) * 40;
        const steps: [number, number][] | undefined = vals ? [[-100, vals[i]]] : undefined;
        return (
          <g key={i}>
            <P t={t} x={x} yf={yf} u={0.82} seed={i + seed} {...c} facing={dir as 1 | -1} walk={walk ? t * 6 + i : null}
              steps={steps} c0={c0 + i * 0.08} look={dir * 0.6} />
            {zeroFlash !== undefined ? <Ring x={x} y={yf - 0.82 * 720} t={t} t0={zeroFlash + i * 0.05} r={60} /> : null}
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------ 1 · HOOK
export const hook: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const expr = t < 0.7 ? "sleep" : t < E.number + 0.9 ? "open" : "confused";
  const cA = cam(t, [[0, 2.5, 700, 690], [1.8, 2.8, 700, 680], [E.number, 2.8, 700, 640], [E.number + 0.9, 1.9, 760, 560], [E.street, 1.8, 780, 560]]);
  const cB = cam(t, [[E.street, 1.45, 1080, 520], [E.street + 2.4, 1.0, 1080, 620], [E.lies, 1.0, 1080, 620], [S.dur, 1.08, 1080, 600]]);
  const lies = t >= E.lies;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.street - 0.1, 0.45)}>
        <BedRoom t={t} id="h-bed" expr={expr} look={t > E.number + 0.9 ? 0.4 : 0} steps={[[-100, 0]]} c0={E.number} />
        <Sparkles cx={700} cy={FLOOR - 590} t={t} n={6} r={90} k={ip(t, E.number, E.number + 0.4) * (1 - ip(t, E.number + 1.6, E.number + 2.4))} />
        {t > E.number + 1.0 ? <Emoji x={850} y={FLOOR - 560} size={80} e="❓" s={pop(t, E.number + 1.0)} /> : null}
      </View>
      <View c={cB} op={shot(t, E.street - 0.1, 1e9, 0.45)}>
        <Street id="h-st" t={t} px={(cB[1] - 1080) * -1} />
        <Crowd t={t} vals={[2, 7, 0, 11, 4, 1, 5, 9]} c0={E.street + 0.3} seed={3} />
        {lies ? (
          <g transform={tf(1080, 330, pop(t, E.lies, 0.4) * (1 + 0.03 * Math.sin(t * 5)))}>
            <rect x={1080 - 420} y={330 - 150} width={840} height={300} rx={60} fill="#141419" opacity={0.92} />
            <text x={1080} y={340} fontFamily="Inter" fontWeight={900} fontSize={240} fill="#fff" textAnchor="middle" dominantBaseline="central"
              stroke="#ff3b4e" strokeWidth={6} paintOrder="stroke" filter="url(#glow)">LIES</text>
          </g>
        ) : null}
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 2 · DAY 1
const Yard: React.FC<{ t: number; E: Record<string, number> }> = ({ t, E }) => (
  <g>
    <Street id="d1-yard" t={t * 0} sky={["#a7dcf6", "#eaf6fb"]} />
    <rect x={-400} y={FLOOR - 560} width={1500} height={560} fill="#f2d7a6" stroke={INK} strokeWidth={6} />
    <path d={`M -440 ${FLOOR - 560} L 350 ${FLOOR - 860} L 1140 ${FLOOR - 560} Z`} fill="#c25a44" stroke={INK} strokeWidth={6} />
    <rect x={260} y={FLOOR - 360} width={170} height={360} rx={10} fill="#7a4f33" stroke={INK} strokeWidth={6} />
    <Window id="d1-yw" x={600} y={FLOOR - 440} w={300} h={220} sky={["#cfe9f7", "#eef7fb"]} t={t} kind="trees" />
    {[...Array(16)].map((_, i) => (
      <path key={i} d={`M ${1000 + i * 80} ${FLOOR} v -170 l 24 -30 l 24 30 v 170 Z`} fill="#fbf7ee" stroke={INK} strokeWidth={4} />
    ))}
    <rect x={1000} y={FLOOR - 120} width={1300} height={18} fill="#fbf7ee" stroke={INK} strokeWidth={3} />
    {[0, 1, 2, 3, 4].map((i) => <Plant key={i} x={1180 + i * 170} y={FLOOR + 10} s={0.55} t={t} />)}
    {t > E.neighbor + 0.3
      ? [...Array(8)].map((_, i) => {
        const ph = (t * 1.6 + i / 8) % 1;
        return <circle key={i} cx={1180 + ph * 140} cy={FLOOR - 300 + ph * ph * 230} r={7} fill="#6fc3ff" opacity={1 - ph} />;
      })
      : null}
  </g>
);

const Classroom: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Room id="d1-cls" wall="#e9e2c9" wall2="#ddd3b4" floor="#b88b63" wains="#cbb48a" />
    <rect x={260} y={140} width={1100} height={560} rx={16} fill="#2f5a47" stroke="#7a4f33" strokeWidth={26} />
    <text x={810} y={260} fontFamily="Inter" fontWeight={800} fontSize={70} fill="#eef5ea" textAnchor="middle">HISTORY · 1492</text>
    <path d="M 360 380 q 120 -60 240 0 t 240 0 t 240 0" fill="none" stroke="#eef5ea" strokeWidth={8} opacity={0.7} />
    <text x={810} y={560} fontFamily="Inter" fontWeight={700} fontSize={54} fill="#eef5ea" textAnchor="middle" opacity={0.85}>Homework: page 47</text>
    <WallClock x={1640} y={250} t={t} />
    <rect x={1500} y={FLOOR - 300} width={520} height={40} rx={10} fill="#c58b5d" stroke={INK} strokeWidth={6} />
    <rect x={1530} y={FLOOR - 260} width={460} height={260} fill="#a6774f" stroke={INK} strokeWidth={6} />
    <path d="M 1580 760 l 30 -50 h 40 l 30 50 Z" fill="#e0463c" stroke={INK} strokeWidth={5} />
  </g>
);

const Bench: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Street id="d1-park" t={t * 0.3} sky={["#9fd3f0", "#eaf6fb"]} />
    <rect x={-600} y={FLOOR - 60} width={3400} height={1000} fill="#8cc66a" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={150 + i * 820} y={FLOOR - 520} width={34} height={460} fill="#6b4b33" />
        <circle cx={167 + i * 820 + Math.sin(t + i) * 5} cy={FLOOR - 560} r={170} fill={i % 2 ? "#5aa865" : "#4c9a5a"} stroke={INK} strokeWidth={6} />
      </g>
    ))}
    <rect x={720} y={FLOOR - 230} width={760} height={34} rx={10} fill="#b07c52" stroke={INK} strokeWidth={5} />
    <rect x={720} y={FLOOR - 330} width={760} height={30} rx={10} fill="#b07c52" stroke={INK} strokeWidth={5} />
    <rect x={760} y={FLOOR - 196} width={20} height={196} fill="#4a4a52" />
    <rect x={1420} y={FLOOR - 196} width={20} height={196} fill="#4a4a52" />
  </g>
);

export const day1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, E.clock - 0.08, E.clock + 0.12);
  const cA = cam(t, [[0, 2.6, 1080, 620], [E.clock + 0.6, 2.9, 1080, 620]]);
  const cB = cam(t, [[E.clock + 0.5, 1.25, 1080, 560], [E.zeros + 1.6, 1.0, 1080, 620], [E.neighbor, 1.05, 1180, 620]]);
  const cC = cam(t, [[E.neighbor - 0.3, 1.45, 900, 600], [E.n3 + 0.2, 1.7, 1000, 520], [E.teacher, 1.7, 1060, 520]]);
  const cD = cam(t, [[E.teacher - 0.3, 1.25, 1150, 560], [E.t8 + 0.2, 1.5, 1180, 500]]);
  const cE = cam(t, [[E.friend - 0.3, 1.3, 1080, 600], [E.f12 - 0.2, 1.5, 1060, 520], [E.f12 + 0.4, 2.1, 1040, 460]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.clock + 0.55, 0.4)}>
        <Room id="d1-night" wall="#cfe0ec" wall2="#bcd3e3" floor="#a6774f" />
        <rect x={700} y={540} width={760} height={500} rx={20} fill="#a6774f" stroke={INK} strokeWidth={8} />
        <rect x={800} y={440} width={560} height={240} rx={40} fill="#1d1d26" stroke={INK} strokeWidth={8} />
        <g transform={`translate(1080 560) scale(1 ${1 - Math.sin(flip * Math.PI) * 0.6}) translate(-1080 -560)`}>
          <text x={1080} y={565} fontFamily="Inter" fontWeight={900} fontSize={170} fill="#ff6b5b" textAnchor="middle" dominantBaseline="central"
            filter="url(#glow)">{flip < 0.5 ? "6:59" : "7:00"}</text>
        </g>
        <text x={1290} y={490} fontFamily="Inter" fontWeight={800} fontSize={34} fill="#ff6b5b" textAnchor="middle">AM</text>
      </View>
      <View c={cB} op={shot(t, E.clock + 0.5, E.neighbor - 0.3, 0.45)}>
        <Street id="d1-st" t={t} px={(cB[1] - 1080) * -1} sky={["#ffd9a8", "#fff1dc"]} />
        <Crowd t={t} vals={[0, 0, 0, 0, 0, 0, 0, 0]} c0={E.zeros} zeroFlash={E.zero} seed={11} />
      </View>
      <View c={cC} op={shot(t, E.neighbor - 0.3, E.teacher - 0.3, 0.45)}>
        <Yard t={t} E={E} />
        <P t={t} x={1000} yf={FLOOR} outfit="cardigan" color="#5aa865" hair="bald" mustache glasses arms={["down", "water"]} hold="can"
          expr={t > E.n3 ? "awkward" : "happy"} look={0.6} steps={ticks(E.neighbor + 0.4, E.n3, 3)} seed={4} />
        <P t={t} x={1880} yf={FLOOR + 30} u={0.86} outfit="tee" color="#e0463c" hair="short" facing={-1} look={-0.8} expr="neutral" steps={[[-100, 1]]} seed={7}
          walk={null} />
        <Bubble x={1130} y={560} lines={["Love your new car!"]} t={t} t0={E.neighbor + 0.2} t1={E.teacher - 0.3} />
      </View>
      <View c={cD} op={shot(t, E.teacher - 0.3, E.friend - 0.3, 0.45)}>
        <Classroom t={t} />
        <P t={t} x={1260} yf={FLOOR} outfit="cardigan" color="#8e5bd0" hair="bun" glasses arms={["point", "down"]} facing={-1} talk={t < E.t8}
          expr={t > E.t8 ? "shock" : "happy"} look={0.4} steps={ticks(E.teacher + 0.3, E.t8, 8)} seed={5} />
        {[440, 860].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={H - 40} r={110} fill={INK} />
            <LieCounter x={x} y={H - 230} t={t} steps={[[-100, i * 2 + 1]]} u={0.8} />
          </g>
        ))}
        <Bubble x={1140} y={570} lines={["I've read every", "book in this school."]} t={t} t0={E.teacher + 0.2} t1={E.friend - 0.3} tail="right" size={46} />
      </View>
      <View c={cE} op={shot(t, E.friend - 0.3, 1e9, 0.45)}>
        <Bench t={t} />
        <P t={t} x={1040} yf={FLOOR - 50} sit {...SAM} arms={["down", "phone"]} hold="phone" talk={t < E.f12} facing={1}
          expr={t > E.f12 + 0.1 ? "awkward" : "laugh"} look={t > E.f12 + 0.1 ? -0.5 : 0.5} steps={ticks(E.friend + 0.4, E.f12, 12)} seed={8} />
        <Bubble x={1150} y={600} lines={["Yeah, I'm almost there!"]} t={t} t0={E.friend + 0.3} t1={E.f12 + 0.1} size={46} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 3 · MEET ALEX (flashback)
export const alex: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.25, 1080, 560], [2.0, 1.6, 900, 560], [E.zero, 2.0, 760, 520], [E.msg, 2.1, 760, 520]]);
  const cB = cam(t, [[E.msg - 0.4, 1.0, 1080, 620], [E.reply + 1.2, 1.12, 1180, 600]]);
  const cC = cam(t, [[E.reply + 1.0, 2.4, 700, 640], [S.dur, 2.7, 700, 650]]);
  const typing = t > E.reply - 0.8 && t < E.reply;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.msg - 0.4, 0.4)}>
        <BedRoom t={t} id="a-bed" expr="relaxed" look={0.3} steps={[[-100, 0]]} phone={1} sky={["#ffe2b8", "#fff6e3"]} />
        <Ring x={690} y={FLOOR - 582} t={t} t0={E.zero} />
        <Chip x={1060} y={440} text="ALEX · 22" t={t} t0={0.5} />
        <Bubble x={980} y={430} lines={["☕ Brew & Co."]} t={t} t0={2.4} t1={E.zero - 0.2} think size={48} />
      </View>
      <View c={cB} op={shot(t, E.msg - 0.4, E.reply + 1.0, 0.4)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#bcd3e3" />
        <rect x={-400} y={760} width={W + 800} height={800} fill="#7fb3e6" />
        <BigPhone x={1220} y={600} w={620} h={1040} tilt={-4}>
          <rect x={940} y={110} width={560} height={130} fill="#ffffff" />
          <circle cx={1000} cy={175} r={40} fill="#2f8f5b" />
          <text x={1000} y={178} fontFamily="Noto Color Emoji" fontSize={44} textAnchor="middle" dominantBaseline="central">☕</text>
          <text x={1060} y={160} fontFamily="Inter" fontWeight={900} fontSize={44} fill="#16161c">Maria (Boss)</text>
          <text x={1060} y={208} fontFamily="Inter" fontWeight={600} fontSize={32} fill="#6b6f7c">online</text>
          <text x={1220} y={300} fontFamily="Inter" fontWeight={700} fontSize={30} fill="#8a8e9a" textAnchor="middle">Today 7:43 AM</text>
          {t > E.msg ? <ChatBubble x={950} y={400} text="Are you on your way?" s={pop(t, E.msg)} w={470} /> : null}
          {typing ? <ChatBubble x={1490} y={540} text={".".repeat(1 + (Math.floor(t * 5) % 3))} me w={130} /> : null}
          {t > E.reply ? <ChatBubble x={1490} y={540} text="Almost." me s={pop(t, E.reply)} w={230} /> : null}
          {t > E.reply + 0.4 ? <text x={1480} y={620} fontFamily="Inter" fontWeight={700} fontSize={28} fill="#8a8e9a" textAnchor="end">Read 7:43</text> : null}
        </BigPhone>
        <circle cx={430} cy={1080} r={230} fill={INK} />
        <polygon points="300,900 340,820 380,910" fill={INK} />
        <polygon points="420,870 460,790 500,880" fill={INK} />
        <ellipse cx={430} cy={1420} rx={360} ry={200} fill="#2f6fe0" stroke={INK} strokeWidth={8} />
        <polyline points="640,1240 860,980 960,800" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      </View>
      <View c={cC} op={shot(t, E.reply + 1.0, 1e9, 0.4)}>
        <BedRoom t={t} id="a-bed2" expr={t > E.reply + 1.5 ? "worried" : "relaxed"} look={t > E.reply + 1.5 ? -0.3 : 0.3} steps={[[-100, 0]]} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 4 · HIS SECRET BECOMES PUBLIC
const Mini: React.FC<{ t: number; i: number; t0: number; x: number; children: React.ReactNode }> = ({ t, i, t0, x, children }) => {
  if (t < t0) return null;
  const s = 0.8 + 0.2 * ip(t, t0, t0 + 0.5, 0, 1, Easing.out(Easing.back(1.6)));
  return <Panel x={x} y={110} w={640} h={900} id={`pm${i}`} bg="#dbe7f2" op={ip(t, t0, t0 + 0.25)} s={s}>{children}</Panel>;
};

export const publicScene: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 2.3, 700, 560], [E.ding + 1.6, 2.3, 700, 560], [E.work, 2.0, 720, 600]]);
  const walkK = ip(t, E.work - 0.3, E.work + 1.8, 0, 1, Easing.out(Easing.quad));
  const ax = 2300 - walkK * 700;
  const cB = cam(t, [[E.work - 0.3, 1.0, 1080, 620], [E.sees, 1.25, 1200, 560], [E.world, 1.3, 1200, 540]]);
  const cC = cam(t, [[E.world - 0.2, 1.0, 1080, 620], [S.dur, 1.05, 1080, 600]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.work - 0.3, 0.4)}>
        <BedRoom t={t} id="p-bed" expr={t > E.ding + 0.2 ? "shock" : "worried"} steps={[[-100, 0], [E.ding, 1]]} />
        <Ring x={690} y={FLOOR - 582} t={t} t0={E.ding} col="#bfe4ff" />
        <Ring x={690} y={FLOOR - 582} t={t} t0={E.ding + 0.15} col="#bfe4ff" />
      </View>
      <View c={cB} op={shot(t, E.work - 0.3, E.world - 0.2, 0.4)}>
        <CoffeeShop t={t} id="p-cafe" />
        <P t={t} x={640} yf={FLOOR} {...BOSS} steps={[[-100, 2]]} seed={6}
          expr={t > E.sees ? "suspicious" : "neutral"} look={t > E.sees - 0.6 ? 1 : 0.2} lookY={t > E.sees ? -0.6 : 0}
          arms={t > E.sees + 0.5 ? ["cross", "cross"] : ["down", "hold"]} hold={t > E.sees + 0.5 ? null : "cup"} />
        <CoffeeCounter t={t} />
        <P t={t} x={ax} yf={FLOOR + 20} {...ALEX} facing={-1} walk={walkK < 1 ? t * 7 : null} steps={[[-100, 1]]} seed={1}
          expr={t > E.sees ? "awkward" : "neutral"} look={-0.8} arms={t > E.sees + 0.3 ? ["down", "shrug"] : ["down", "down"]} />
        {t > E.sees ? <Emoji x={810} y={470} size={90} e="🤨" s={pop(t, E.sees)} /> : null}
      </View>
      <View c={cC} op={shot(t, E.world - 0.2, 1e9, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        {[...Array(30)].map((_, i) => <circle key={i} cx={(i * 337) % 2160} cy={(i * 191) % 1240} r={3} fill="#fff" opacity={0.25} />)}
        <Mini t={t} i={0} t0={E.world} x={70}>
          <Street id="pm-st" t={t} sky={["#ffd9a8", "#fff1dc"]} />
          <P t={t} x={250} yf={FLOOR} u={0.9} outfit="tee" color="#f2c84b" hair="curly" arms={["down", "film"]} hold="phone" facing={1} look={1} seed={2} steps={[[-100, 3]]} />
          <P t={t} x={540} yf={FLOOR} u={0.9} outfit="coat" color="#8e5bd0" hair="long" facing={-1} look={-1} expr="awkward" arms={["shrug", "shrug"]} seed={3} steps={[[-100, 6]]} />
          <circle cx={150} cy={170} r={18} fill="#e0463c" opacity={Math.floor(t * 2) % 2 ? 1 : 0.3} />
          <text x={180} y={182} fontFamily="Inter" fontWeight={900} fontSize={36} fill="#e0463c">REC</text>
        </Mini>
        <Mini t={t} i={1} t0={E.world + 1.6} x={760}>
          <rect x={760} y={110} width={640} height={900} fill="#f4dcc0" />
          <P t={t} x={920} yf={FLOOR} u={0.9} outfit="suit" color="#5b6270" hair="slick" accent="#2f6fe0" arms={["down", "point"]} facing={1} expr="angry" talk seed={4} steps={[[-100, 4]]} />
          <P t={t} x={1240} yf={FLOOR} u={0.9} outfit="hoodie" color="#e0463c" hair="short" arms={["point", "down"]} facing={-1} expr="angry" talk seed={5} steps={[[-100, 9]]} />
          <Bubble x={900} y={430} lines={["That wasn't a lie!"]} t={t} t0={E.world + 1.9} size={40} />
          <Bubble x={1260} y={540} lines={["Yes it was!"]} t={t} t0={E.world + 2.6} tail="right" size={40} />
        </Mini>
        <Mini t={t} i={2} t0={E.argue - 0.6} x={1450}>
          <rect x={1450} y={110} width={640} height={900} fill="#eef1f7" />
          <circle cx={1530} cy={200} r={40} fill="#e0463c" />
          <text x={1590} y={190} fontFamily="Inter" fontWeight={900} fontSize={36} fill="#16161c">@NewsNow</text>
          <text x={1590} y={232} fontFamily="Inter" fontWeight={600} fontSize={28} fill="#6b6f7c">just now</text>
          <text x={1490} y={320} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#16161c">The lie counters</text>
          <text x={1490} y={372} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#16161c">are everywhere 😳</text>
          <rect x={1490} y={410} width={560} height={330} rx={20} fill="#253049" />
          <LieCounter x={1770} y={575} t={t} steps={[[-100, 14]]} u={1.4} />
          <text x={1490} y={800} fontFamily="Inter, Noto Color Emoji" fontWeight={800} fontSize={36} fill="#16161c">❤️ 9.1M   💬 2.3M</text>
          <text x={1490} y={870} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#2f6fe0">#LieCounter</text>
          <text x={1490} y={930} fontFamily="Inter" fontWeight={700} fontSize={34} fill="#6b6f7c">{`${(1.2 + Math.max(0, t - E.argue) * 0.6).toFixed(1)}B views`}</text>
        </Mini>
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 5 · WEEK 1
const Office: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <Room id="w-off" wall="#dfe6ee" wall2="#cfd8e2" floor="#9aa3ad" wains="#c3ccd6" />
    <rect x={1500} y={160} width={520} height={FLOOR - 160} fill="#8c6a4f" stroke={INK} strokeWidth={8} />
    <circle cx={1960} cy={620} r={16} fill="#f2c84b" />
    <rect x={1540} y={260} width={440} height={200} rx={16} fill="#fff" stroke={INK} strokeWidth={6} />
    <text x={1760} y={330} fontFamily="Inter" fontWeight={900} fontSize={48} fill="#16161c" textAnchor="middle">NOW HIRING</text>
    <text x={1760} y={400} fontFamily="Inter" fontWeight={900} fontSize={42} fill="#1d9e55" textAnchor="middle">ZERO LIES</text>
    <text x={1760} y={444} fontFamily="Inter" fontWeight={900} fontSize={42} fill="#1d9e55" textAnchor="middle">PREFERRED</text>
    <WallClock x={260} y={220} t={t} />
    <Plant x={1380} y={FLOOR} s={0.9} t={t} />
  </g>
);

export const week1: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const flip = ip(t, 0.25, 1.0);
  const cA = cam(t, [[0, 1.4, 760, 620], [E.valuable - 0.4, 1.4, 760, 620], [E.valuable + 0.4, 1.25, 1300, 600], [E.jobs, 1.3, 1300, 580]]);
  const cB = cam(t, [[E.jobs - 0.2, 1.0, 1080, 620], [E.dating, 1.15, 1150, 580]]);
  const cC = cam(t, [[E.dating - 0.2, 1.05, 1080, 620], [E.shop, 1.2, 1080, 600]]);
  const cD = cam(t, [[E.shop - 0.2, 1.0, 1080, 620], [S.dur, 1.1, 1080, 600]]);
  const filt = t > E.dating + 0.7;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.jobs - 0.25, 0.4)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#2c3352" />
        <Calendar x={760} y={640} label={flip < 0.5 ? "DAY 1" : "WEEK 1"} flip={flip} sub={flip < 0.5 ? "MONDAY" : "7 DAYS LATER"} />
        {t > E.valuable - 0.2 ? (
          <g transform={tf(1500, 640, pop(t, E.valuable - 0.2, 0.5))}>
            <ellipse cx={1500} cy={640} rx={330} ry={330} fill="#ffd56b" opacity={0.16} />
            <path d="M 1360 900 h 280 l -40 -90 h -200 Z" fill="#c9962f" stroke={INK} strokeWidth={6} />
            <rect x={1300} y={900} width={400} height={70} rx={10} fill="#9c7424" stroke={INK} strokeWidth={6} />
            <text x={1500} y={600} fontFamily="Inter" fontWeight={900} fontSize={380} fill="#ffd56b" textAnchor="middle" dominantBaseline="central"
              stroke={INK} strokeWidth={10} paintOrder="stroke" filter="url(#glow)">0</text>
            <Emoji x={1500} y={330} size={120} e="👑" />
            <Sparkles cx={1500} cy={600} t={t} n={10} r={300} />
          </g>
        ) : null}
      </View>
      <View c={cB} op={shot(t, E.jobs - 0.2, E.dating - 0.25, 0.4)}>
        <Office t={t} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={240 + i * 330} y={FLOOR - 230} width={200} height={34} rx={8} fill="#5b6270" stroke={INK} strokeWidth={5} />
            <P t={t} x={330 + i * 330} yf={FLOOR} u={0.88} sit outfit={["suit", "tee", "cardigan"][i] as "suit"} color={["#2f6fe0", "#e0463c", "#c0703a"][i]}
              hair={["short", "curly", "long"][i] as "short"} accent="#f2c84b" facing={1} look={1} seed={i + 20}
              expr={t > E.jobs + 1.2 ? (i === 0 ? "happy" : "sad") : "neutral"} steps={[[-100, [0, 5, 2][i]]]} />
          </g>
        ))}
        <P t={t} x={1320} yf={FLOOR} {...{ outfit: "suit", color: "#6b5b8e", hair: "bun", accent: "#f2c84b" }} facing={-1} arms={["down", "point"]} look={-1}
          expr="happy" talk={t > E.jobs + 1.0 && t < E.jobs + 1.9} steps={[[-100, 1]]} seed={9} />
        <Bubble x={1200} y={560} lines={["You're hired!"]} t={t} t0={E.jobs + 1.0} tail="right" />
      </View>
      <View c={cC} op={shot(t, E.dating - 0.2, E.shop - 0.25, 0.4)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#ffd6e1" />
        {[...Array(12)].map((_, i) => <Emoji key={i} x={(i * 397) % 2160} y={(i * 233) % 1240} size={70} e="💗" op={0.25} />)}
        <BigPhone x={1080} y={620} w={1100} h={1160}>
          <rect x={556} y={66} width={1048} height={150} fill="#ff5a8a" />
          <text x={1080} y={150} fontFamily="Inter" fontWeight={900} fontSize={64} fill="#fff" textAnchor="middle">Matchly 💘</text>
          <rect x={640} y={240} width={880} height={90} rx={45} fill={filt ? "#1d9e55" : "#e6e8ef"} />
          <text x={1080} y={287} fontFamily="Inter" fontWeight={900} fontSize={44} fill={filt ? "#fff" : "#16161c"} textAnchor="middle" dominantBaseline="central">
            {filt ? "✓ Filter: 0 lies only" : "Filter: any lie count"}
          </text>
          {[0, 1, 2].map((i) => {
            const v = [7, 0, 3][i];
            const out = filt && v > 0;
            const x = 760 + i * 280 - (out ? ip(t, E.dating + 0.8, E.dating + 1.4) * 500 * (i === 0 ? 1 : -1) : 0);
            return (
              <g key={i} opacity={out ? 1 - ip(t, E.dating + 0.8, E.dating + 1.4) : 1}>
                <rect x={x - 120} y={380} width={240} height={420} rx={24} fill="#fff" stroke={INK} strokeWidth={5} />
                <rect x={x - 100} y={400} width={200} height={240} rx={16} fill={["#fde2b9", "#cfe9f7", "#e1d5f5"][i]} />
                <Stick t={t} x={x} yf={790} u={0.36} outfit={["tee", "hoodie", "dress"][i] as "tee"} color={["#e0463c", "#2fa3a0", "#8e5bd0"][i]}
                  hair={["short", "curly", "long"][i] as "short"} expr="happy" shadow={false} seed={i} />
                <LieCounter x={x} y={710} t={t} steps={[[-100, v]]} u={0.7} tone={v === 0 ? "green" : "white"} />
              </g>
            );
          })}
          {t > E.dating + 1.5 ? <text x={1080} y={900} fontFamily="Inter, Noto Color Emoji" fontWeight={900} fontSize={72} fill="#ff5a8a" textAnchor="middle"
            transform={tf(1080, 880, pop(t, E.dating + 1.5))}>It's a match! 💘</text> : null}
        </BigPhone>
      </View>
      <View c={cD} op={shot(t, E.shop - 0.2, 1e9, 0.4)}>
        <Street id="w-shop" t={t * 0.2} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={500} y={FLOOR - 880} width={1160} height={880} fill="#f2d7a6" stroke={INK} strokeWidth={6} />
        <path d={`M 480 ${FLOOR - 880} h 1200 l -40 110 h -1120 Z`} fill="#3fae6a" stroke={INK} strokeWidth={6} />
        <text x={1080} y={FLOOR - 805} fontFamily="Inter" fontWeight={900} fontSize={56} fill="#fff" textAnchor="middle">CORNER MARKET</text>
        <rect x={880} y={FLOOR - 470} width={400} height={470} fill="#5b3f2e" stroke={INK} strokeWidth={6} />
        <P t={t} x={1080} yf={FLOOR} outfit="shopApron" color="#f4f1ea" accent="#e0463c" hair="bald" mustache
          arms={t > E.shop + 1.8 ? ["stop", "wave"] : ["down", "wave"]} facing={1} look={t > E.shop + 1.8 ? 1 : -1} expr={t > E.shop + 1.8 ? "suspicious" : "happy"}
          steps={[[-100, 2]]} seed={12} />
        <P t={t} x={600} yf={FLOOR + 20} u={0.92} outfit="coat" color="#2f6fe0" hair="short" facing={1} look={1} expr="happy" steps={[[-100, 0]]} tone="green" seed={13} />
        <P t={t} x={1700 + ip(t, E.shop + 2.6, E.shop + 4.2) * 500} yf={FLOOR + 20} u={0.92} outfit="hoodie" color="#c0703a" hair="cap" accent="#5b6270"
          facing={t > E.shop + 2.6 ? 1 : -1} walk={t > E.shop + 2.6 ? t * 7 : null} look={-1} expr={t > E.shop + 1.9 ? "sad" : "neutral"}
          steps={[[-100, 6]]} seed={14} />
        {t > E.shop + 0.6 ? <Emoji x={760} y={520} size={90} e="✅" s={pop(t, E.shop + 0.6)} /> : null}
        {t > E.shop + 1.9 ? <Emoji x={1540} y={520} size={90} e="❌" s={pop(t, E.shop + 1.9)} /> : null}
      </View>
    </>
  );
};

// ------------------------------------------------------------------------------ 6 · ALEX TRIES TO BE PERFECT
export const perfect: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.1, 1080, 600], [E.works, 1.4, 1000, 520]]);
  const cB = cam(t, [[E.works - 0.2, 1.0, 1080, 620], [E.stays - 0.3, 1.0, 1080, 620], [E.stays + 0.5, 2.0, 1500, 360], [E.praise, 2.0, 1500, 370]]);
  const cC = cam(t, [[E.praise - 0.2, 1.1, 1080, 600], [S.dur, 1.2, 1080, 580]]);
  // time-lapse sky through the café window
  const day = (Math.sin((t - E.works) * 2.4) + 1) / 2;
  const sky: [string, string] = t > E.works ? [day > 0.5 ? "#9fd3f0" : "#2c3352", day > 0.5 ? "#eaf6fb" : "#59628c"] : ["#9fd3f0", "#eaf6fb"];
  return (
    <>
      <View c={cA} op={shot(t, 0, E.works - 0.25, 0.4)}>
        <Room id="pf-room" wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" />
        <Window id="pf-w" x={1300} y={160} w={560} h={400} sky={["#ffe2b8", "#fff6e3"]} t={t} kind="trees" curtain="#f4b9a4" />
        <Frame x={240} y={200} w={240} h={190} art="#86b7d6" />
        <P t={t} x={980} yf={FLOOR} {...ALEX} arms={["down", "chest"]} expr={t > 1.2 ? "proud" : "worried"} look={0.2} steps={[[-100, 1]]} seed={1} />
        <Chip x={1520} y={700} text="NO MORE LIES." t={t} t0={1.0} />
      </View>
      <View c={cB} op={shot(t, E.works - 0.2, E.praise - 0.25, 0.4)}>
        <CoffeeShop t={t} id="pf-cafe" sky={sky} />
        <P t={t} x={640} yf={FLOOR} {...BOSS} steps={[[-100, 2]]} seed={6} look={1} expr={t > E.works + 1.6 ? "happy" : "neutral"}
          arms={["down", t > E.works + 1.6 ? "thumb" : "down"]} />
        <CoffeeCounter t={t} />
        <P t={t} x={1500} yf={FLOOR + 20} {...ALEX} facing={-1} look={-1} arms={["chest", "down"]} talk={t > E.works + 0.3 && t < E.works + 1.4}
          expr={t > E.works + 1.6 ? "happy" : "awkward"} steps={[[-100, 1]]} seed={1} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${1240 + i * 46} ${FLOOR + 30} l 30 -26 l 20 30 Z`} fill="#fffaf0" stroke={INK} strokeWidth={4} transform={`rotate(${i * 40} ${1260 + i * 46} ${FLOOR + 20})`} />
        ))}
        <Bubble x={1380} y={580} lines={["That broken mug?", "That was me. Sorry."]} t={t} t0={E.works + 0.25} t1={E.works + 1.6} tail="right" size={46} />
        <Bubble x={760} y={560} lines={["Thanks for telling me."]} t={t} t0={E.works + 1.7} t1={E.stays + 0.2} size={44} />
      </View>
      <View c={cC} op={shot(t, E.praise - 0.2, 1e9, 0.4)}>
        <Street id="pf-st" t={t} sky={["#ffd9a8", "#fff1dc"]} />
        <P t={t} x={1080} yf={FLOOR} {...ALEX} arms={["hips", "hips"]} expr="proud" steps={[[-100, 1]]} seed={1} />
        <P t={t} x={600} yf={FLOOR + 20} u={0.95} {...SAM} arms={["down", "thumb"]} facing={1} look={1} expr="happy" talk={t < E.praise + 1.8} steps={[[-100, 14]]} seed={8} />
        <P t={t} x={1560} yf={FLOOR + 20} u={0.95} outfit="dress" color="#ffb238" hair="long" arms={["cheer", "down"]} facing={-1} look={-1} expr="laugh" steps={[[-100, 5]]} seed={15} />
        <P t={t} x={1880} yf={FLOOR + 40} u={0.9} outfit="tee" color="#8e5bd0" hair="curly" arms={["down", "thumb"]} facing={-1} look={-1} expr="happy" steps={[[-100, 3]]} seed={16} />
        <Bubble x={700} y={590} lines={["Alex never lies!"]} t={t} t0={E.praise + 0.3} t1={E.praise + 2.2} />
        <Bubble x={1450} y={600} lines={["Literally perfect."]} t={t} t0={E.praise + 2.3} tail="right" />
        <Sparkles cx={1080} cy={420} t={t} n={8} r={200} k={ip(t, E.praise + 0.5, E.praise + 1.2)} />
      </View>
    </>
  );
};
