import React from "react";
import { Easing } from "remotion";
import { Stick, StickProps, INK } from "./Stick";
import { AGENT, BIZ, LUSTIG, PARISIAN, POISSON, View, cam, ip, pop, shot, tf, H, W } from "./kit";
import {
  Alcatraz, Bench, Calendar, Car, CityUS, Cloud, Cobbles, Court, Crillon, Desk, Envelope, Facade, Label, Lamp, Liner, Lobby, Locomotive, MapCard,
  Meeting, MeetingTable, Office, Paper, Rooftops, Sky, Stamp, Station, Steam, Strollers, Thought, Tower,
} from "./sets";
import { SceneFn, wt } from "./types";

type Cast = Partial<StickProps>;
const Who: React.FC<{ c: Cast } & Partial<StickProps> & { x: number; yf: number; t: number }> = ({ c, ...p }) => <Stick {...(c as StickProps)} {...p} />;
const FLOOR = 1060;

/** Paris skyline at a given time of day: 0 = day, 1 = dusk/night lights. */
const ParisWide: React.FC<{ t: number; dusk?: number; tower?: { x: number; yb: number; h: number }; id: string }> = ({ t, dusk = 0, tower = { x: 1080, yb: 1000, h: 820 }, id }) => (
  <g>
    <Sky id={id} top={dusk ? "#22315a" : "#7fb0de"} bot={dusk ? "#f0a46a" : "#f4dcb0"} />
    {[[300, 180, 1.4], [1500, 140, 1.2], [1950, 260, 0.9], [800, 300, 0.8]].map(([x, y, s], i) => <Cloud key={i} x={x + ((t * 14 + i * 50) % 260)} y={y} s={s} o={dusk ? 0.35 : 0.85} col={dusk ? "#f6c79a" : "#fff"} />)}
    <Rooftops y={1020} s={0.75} seed={3} dark={dusk} col="#e4d3b2" />
    <Tower x={tower.x} yb={tower.yb} h={tower.h} glow={dusk} />
    {dusk > 0 && Array.from({ length: 26 }).map((_, i) => {
      const fy = 0.05 + (i / 26) * 0.9;
      const a = Math.sin(t * 9 + i * 2.3) > 0.4 ? 1 : 0.2;
      return <circle key={i} cx={tower.x + Math.sin(i * 3.7) * tower.h * 0.12 * (1 - fy)} cy={tower.yb - fy * tower.h} r={6} fill="#fff4c0" opacity={a * dusk} />;
    })}
    <Rooftops y={1120} s={0.95} seed={9} dark={dusk} col="#eadcbf" />
    <path d={`M -400 1150 Q 700 1100 1200 1160 T 2600 1150 L 2600 1400 L -400 1400 Z`} fill={dusk ? "#2e4a6a" : "#5f8fb8"} />
    <Rooftops y={1290} s={1.2} seed={14} dark={dusk} col="#efe2c6" />
  </g>
);

/** A Paris street, scrolling with camera x offset ox (world units). */
const Street: React.FC<{ t: number; ox?: number; tower?: boolean; dusk?: number; people?: number }> = ({ t, ox = 0, tower = true, dusk = 0, people = 5 }) => (
  <g>
    <Sky id="stSky" top={dusk ? "#3a4a70" : "#86b6e0"} bot={dusk ? "#e8a878" : "#eedcb8"} />
    {tower && <Tower x={1750 - ox * 0.2} yb={760} h={700} col="#7a5a46" />}
    <g transform={`translate(${-ox} 0)`}>
      {[[-700, 560, "CAFÉ", "#7d2f3a"], [-110, 520, null], [440, 560, "BOULANGERIE", "#2f5d4a"], [1030, 520, null], [1580, 600, "TABAC", "#3a4f7a"], [2210, 540, null], [2780, 560, "CAFÉ", "#7d2f3a"], [3370, 520, null]].map(([x, w, shop, aw], i) => (
        <Facade key={i} x={x as number} w={w as number} yb={FLOOR - 60} floors={5} seed={i + 2} shop={shop as string | undefined} awning={aw as string | undefined} col={i % 2 ? "#e7d7b8" : "#efe2c6"} />
      ))}
      <rect x={-1400} y={FLOOR - 60} width={6000} height={70} fill="#cfc4ae" stroke={INK} strokeWidth={4} />
      {[-500, 300, 1100, 1900, 2700].map((x) => <Lamp key={x} x={x} yb={FLOOR} h={480} on={dusk} />)}
    </g>
    <Cobbles y={FLOOR + 10} />
    <Strollers t={t} yb={FLOOR} n={people} seed={2} span={3200} Person={({ x, i, walk, dir }) => (
      <Stick {...(PARISIAN[i % PARISIAN.length] as unknown as StickProps)} x={x - ox * 0.0} yf={FLOOR - 10} u={0.62} t={t} walk={walk} facing={dir} seed={i} expr={i % 2 ? "happy" : "neutral"} />
    )} />
  </g>
);

// ======================================================================== 1. THE IMPOSSIBLE SALE
const hook: SceneFn = ({ S, t }) => {
  const sold = wt(S, 0, /^sold/), handed = wt(S, 1, /^handed/), own = wt(S, 3, /^own/), away = wt(S, 4, /^away/);
  const aB = S.L[1] - 0.25, aC = S.L[2] + 0.9, aD = S.L[3] - 0.1;
  const gave = t > handed + 0.45;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 640], [aB, 1.42, 1080, 520]])} op={shot(t, 0, aB, 0.3)}>
        <ParisWide t={t} id="hkSky" />
      </View>
      <Stamp x={1080} y={560} text="SOLD" t={t} t0={sold} t1={aB} size={230} rot={-12} />
      <View c={cam(t, [[aB, 1.25, 1080, 600], [aC, 1.4, 1040, 560]])} op={shot(t, aB, aC, 0.3)}>
        <Lobby t={t} win={false} />
        <Who c={LUSTIG} x={820} yf={FLOOR} t={t} facing={1} expr={gave ? "smug" : "neutral"} arms={["down", gave ? "hold" : "give"]} hold={gave ? "envelope" : null} seed={1} />
        <Who c={POISSON} x={1380} yf={FLOOR} t={t} facing={-1} expr={t > handed ? "happy" : "warm"} arms={["down", "give"]} hold={gave ? null : "envelope"} holdHand={1} seed={2} talk={t > S.L[1] + 0.2 && t < S.Le[1]} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.05, 980, 620]])} op={shot(t, aC, aD, 0.3)}>
        <Lobby t={t} win={false} />
        <Who c={LUSTIG} x={ip(t, aC, aD + 0.4, 1000, 300, Easing.linear)} yf={FLOOR} t={t} facing={-1} walk={t * 5.5} expr="smug" arms={["down", "hold"]} hold="envelope" seed={1} />
        <Who c={POISSON} x={1440} yf={FLOOR} t={t} facing={-1} expr="happy" arms={["wave", "down"]} seed={2} />
      </View>
      <View c={cam(t, [[aD, 1.0, 1080, 620], [S.dur, 1.08, 1080, 600]])} op={shot(t, aD, 1e9, 0.3)}>
        <ParisWide t={t} id="hkSky2" />
        <Who c={LUSTIG} x={ip(t, away - 0.6, S.dur, 1500, 2300, Easing.linear)} yf={1180} u={0.55} t={t} facing={1} walk={t * 5} expr="smug" />
      </View>
      {t > own - 0.05 && (
        <g transform={tf(1080, 240, pop(t, own - 0.05, 0.45))}>
          <text x={1080} y={250} fontFamily="Inter" fontWeight={900} fontSize={300} fill="#c41e2a" stroke="#fff" strokeWidth={12} paintOrder="stroke" textAnchor="middle" dominantBaseline="central">?</text>
        </g>
      )}
    </g>
  );
};

// ======================================================================== 2. PARIS, 1925
const CostCard: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  if (t < t0) return null;
  const k = ip(t, t0, t0 + 1.6);
  return (
    <g transform={tf(1650, 560, pop(t, t0, 0.4))}>
      <rect x={1320} y={260} width={660} height={600} rx={30} fill="#fbf6e8" stroke={INK} strokeWidth={8} />
      <text x={1650} y={330} fontFamily="Inter" fontWeight={900} fontSize={50} fill={INK} textAnchor="middle">UPKEEP COSTS</text>
      {[0.25, 0.42, 0.62, 0.9].map((v, i) => <rect key={i} x={1400 + i * 135} y={800 - 380 * v * Math.min(1, k * 1.4 - i * 0.12)} width={95} height={380 * v * Math.min(1, Math.max(0, k * 1.4 - i * 0.12))} fill={i === 3 ? "#c41e2a" : "#8a6a52"} stroke={INK} strokeWidth={5} />)}
      <line x1={1380} y1={800} x2={1930} y2={800} stroke={INK} strokeWidth={6} />
      <path d={`M 1400 ${720 - 0} L ${1400 + 470 * k} ${720 - 360 * k}`} stroke="#c41e2a" strokeWidth={12} strokeLinecap="round" />
      {k > 0.9 && <polygon points={`${1880},${360} ${1840},${380} ${1880},${410}`} fill="#c41e2a" transform={`rotate(-36 1870 380)`} />}
    </g>
  );
};
const paris: SceneFn = ({ S, t }) => {
  const notT = wt(S, 1, /^not/), exp = wt(S, 2, /^expensive/);
  const aB = S.L[1] - 0.2, aC = notT - 0.15, aD = S.L[2] - 0.1;
  return (
    <g>
      <View c={[1.0, 1080, 620]} op={shot(t, 0, aB, 0.3)}>
        <Street t={t} ox={ip(t, 0, aB, -200, 900, Easing.linear)} />
        <Car x={ip(t, 0, aB, -600, 2600, Easing.linear)} yb={FLOOR + 120} s={0.7} col="#7a2a2a" spin={t * 4} t={t} />
        <Car x={ip(t, 0, aB, 2900, -500, Easing.linear)} yb={FLOOR + 170} s={0.8} col="#1f2a3a" dir={-1} spin={-t * 4} t={t} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 1000], [aC, 1.0, 1080, -420]])} op={shot(t, aB, aC, 0.3)}>
        <Sky id="psSky" top="#6fa6d8" bot="#e9eef2" />
        <Cloud x={500} y={-300} s={1.6} /><Cloud x={1700} y={200} s={1.3} />
        <Tower x={1080} yb={1240} h={1900} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.08, 1080, 600]])} op={shot(t, aC, aD, 0.3)}>
        <Street t={t} ox={300} people={2} />
        <Who c={PARISIAN[0]} x={820} yf={FLOOR} t={t} facing={1} expr="worried" arms={["down", "talk"]} talk seed={3} />
        <Who c={PARISIAN[2]} x={1300} yf={FLOOR} t={t} facing={-1} expr="thinking" lookY={-1} look={0.6} arms={["chin", "down"]} seed={4} />
      </View>
      <View c={cam(t, [[aD, 1.3, 760, 560], [S.dur, 1.18, 860, 580]])} op={shot(t, aD, 1e9, 0.3)}>
        <Sky id="psSky2" top="#6fa6d8" bot="#e9eef2" />
        <Tower x={900} yb={2600} h={2600} />
        <rect x={0} y={760} width={1500} height={36} fill="#5a3e2e" stroke={INK} strokeWidth={6} />
        <Stick x={760} yf={760} t={t} u={0.8} outfit="tee" color="#4a6a8a" hair="cap" accent="#3a3a3a" expr="worried" arms={["hold", "down"]} hold="can" facing={1} lookY={-0.5} seed={5} />
        <CostCard t={t} t0={exp - 0.6} />
      </View>
    </g>
  );
};

// ======================================================================== 3. THE MAN WITH A PLAN
const plan: SceneFn = ({ S, t }) => {
  const victor = wt(S, 0, /^Victor/), con = wt(S, 1, /^con/), opp = wt(S, 2, /^opportunity/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.15, aD = opp - 0.9;
  const carX = ip(t, 0, 1.7, -500, 860, Easing.out(Easing.cubic));
  const out = t > 2.0;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 900, 620], [aB, 1.1, 1180, 600]])} op={shot(t, 0, aB, 0.3)}>
        <Street t={t} ox={200} people={3} />
        <Car x={carX} yb={FLOOR + 140} s={0.95} col="#1d1f24" spin={carX / 60} door={ip(t, 1.7, 2.1)} />
        {out && <Who c={LUSTIG} x={ip(t, 2.0, aB, 760, 1300, Easing.linear)} yf={FLOOR + 60} t={t} facing={1} walk={t > 2.0 && t < aB ? t * 5.2 : null} expr="smug" seed={1} />}
      </View>
      <Label x={1080} y={150} text="VICTOR LUSTIG" t={t} t0={victor} t1={aB + 2.0} size={66} />
      <View c={cam(t, [[aB, 1.25, 820, 600], [aC, 1.35, 940, 580]])} op={shot(t, aB, aC, 0.3)}>
        <Lobby t={t} />
        <Who c={LUSTIG} x={ip(t, aB, aB + 2.4, 300, 900, Easing.out(Easing.quad))} yf={FLOOR} t={t} facing={1} walk={t < aB + 2.4 ? t * 5.2 : null} expr="smug" arms={t > aB + 2.4 ? ["hips", "down"] : ["down", "down"]} seed={1} />
        <rect x={980} y={880} width={360} height={30} rx={6} fill="#7a4a26" stroke={INK} strokeWidth={5} />
        <rect x={1140} y={910} width={40} height={150} fill="#5e3618" />
        <rect x={1030} y={858} width={150} height={26} fill="#f2ecd9" stroke={INK} strokeWidth={3} transform="rotate(-6 1100 870)" />
      </View>
      <Label x={1080} y={150} text="CON ARTIST" t={t} t0={con} t1={aC - 0.3} size={58} bg="#9e1b2d" />
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.25, 1080, 560]])} op={shot(t, aC, aD, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#c9b48a" />
        <Paper x={520} y={120} w={1120} h={1000} head="EIFFEL TOWER" sub="UPKEEP COSTS KEEP RISING" r={-2} />
      </View>
      <View c={cam(t, [[aD, 1.0, 1160, 560], [S.dur, 1.7, 820, 400]])} op={shot(t, aD, 1e9, 0.3)}>
        <Lobby t={t} />
        <Who c={LUSTIG} x={820} yf={FLOOR} t={t} facing={1} look={0.8} expr={t > opp ? "smug" : "thinking"} arms={["down", "hold"]} hold="newspaper" seed={1} />
      </View>
    </g>
  );
};

// ======================================================================== 4. A GOVERNMENT OFFICIAL?
const Seated: React.FC<{ t: number; looks: number[]; exprs?: StickProps["expr"][]; lean?: number[]; arms?: [StickProps["arms"], StickProps["arms"], StickProps["arms"], StickProps["arms"]]; xs?: number[] }> = ({ t, looks, exprs, lean, arms, xs = [420, 820, 1260, 1660] }) => (
  <g>
    {BIZ.map((b, i) => <Who key={i} c={b} x={xs[i]} yf={1040} u={0.9} t={t} facing={i < 2 ? 1 : -1} look={looks[i]} expr={exprs?.[i] ?? "neutral"} lean={lean?.[i] ?? 0} arms={arms?.[i] ?? ["down", "down"]} seed={i + 6} />)}
  </g>
);
const official: SceneFn = ({ S, t }) => {
  const crillon = wt(S, 1, /^Crillon/);
  const aB = S.L[1] - 0.15, aC = S.L[2] - 0.2;
  const glance = Math.sin(t * 1.6);
  return (
    <g>
      <View c={cam(t, [[0, 1.25, 1080, 600], [aB, 1.4, 1080, 560]])} op={shot(t, 0, aB, 0.3)}>
        <Office t={t} />
        <Who c={LUSTIG} x={1080} yf={FLOOR} t={t} facing={1} expr="smug" arms={["down", "hold"]} hold="documents" seed={1} />
        <Desk />
        <Paper x={640} y={760} w={260} h={120} img={false} head="OFFICIAL" r={-6} />
        <circle cx={1260} cy={820} r={34} fill="#9e1b2d" stroke={INK} strokeWidth={5} />
      </View>
      <Label x={1080} y={150} text="A GOVERNMENT OFFICIAL?" t={t} t0={0.6} t1={aB - 0.2} size={58} bg="#1d2c4a" />
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.12, 1080, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Crillon t={t} />
        <Car x={ip(t, aB, aC, -400, 760, Easing.out(Easing.cubic))} yb={1170} s={0.75} col="#2a2a30" spin={t * 3} />
        <Car x={1600} yb={1160} s={0.7} col="#6a2a2a" dir={-1} />
      </View>
      <Label x={1080} y={150} text="HÔTEL DE CRILLON" t={t} t0={crillon - 0.2} t1={aC - 0.2} size={64} />
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aC + 2.2, 1.25, 700, 600], [S.dur, 1.25, 1400, 600]])} op={shot(t, aC, 1e9, 0.3)}>
        <Meeting t={t} />
        <Seated t={t} looks={[glance, -glance, glance, -glance]} exprs={["confused", "neutral", "thinking", "neutral"]} />
        <MeetingTable />
        <Who c={LUSTIG} x={1080} yf={980} u={0.95} t={t} facing={1} expr="neutral" arms={["down", "talk"]} talk={t > aC + 1.6} seed={1} />
      </View>
    </g>
  );
};

// ======================================================================== 5. THE SHOCKING ANNOUNCEMENT
const announce: SceneFn = ({ S, t }) => {
  const dis = wt(S, 0, /^dismantle/), conf = wt(S, 3, /^confidential/);
  const aB = dis - 0.2, aC = S.L[1] - 0.2, aD = S.L[3] - 0.15;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.12, 1180, 580]])} op={shot(t, 0, aB, 0.3)}>
        <Meeting t={t} />
        <rect x={1360} y={300} width={420} height={560} fill="#f2ecd9" stroke={INK} strokeWidth={7} />
        <Tower x={1570} yb={820} h={460} />
        <line x1={1400} y1={860} x2={1340} y2={1060} stroke="#5e3618" strokeWidth={14} /><line x1={1740} y1={860} x2={1800} y2={1060} stroke="#5e3618" strokeWidth={14} />
        <Who c={LUSTIG} x={980} yf={1060} t={t} facing={1} expr="neutral" arms={["down", "point"]} talk seed={1} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.06, 1080, 600]])} op={shot(t, aB, aC, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#1e3a66" />
        {Array.from({ length: 22 }).map((_, i) => <line key={i} x1={-400 + i * 140} y1={-200} x2={-400 + i * 140} y2={1440} stroke="#2d4f82" strokeWidth={3} />)}
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={-400} y1={i * 130} x2={2600} y2={i * 130} stroke="#2d4f82" strokeWidth={3} />)}
        <rect x={140} y={90} width={1880} height={1060} rx={20} fill="none" stroke="#e8f3ff" strokeWidth={8} strokeDasharray="34 22" />
        <Tower x={1080} yb={1060} h={860} sketch split={ip(t, aB + 0.6, aC - 0.3)} />
        <text x={1080} y={170} fontFamily="Inter" fontWeight={900} fontSize={54} fill="#e8f3ff" textAnchor="middle" letterSpacing={4}>WHAT LUSTIG CLAIMED</text>
        <text x={1080} y={1110} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#bcd6f2" textAnchor="middle" letterSpacing={3}>(IT NEVER HAPPENED)</text>
      </View>
      <View c={cam(t, [[aC, 1.15, 1080, 520], [aD, 1.5, 1080, 470]])} op={shot(t, aC, aD, 0.3)}>
        <Meeting t={t} />
        <Seated t={t} looks={[0.5, 0.3, -0.3, -0.5]} exprs={["shock", "shock", "shock", "shock"]} lean={[0, 8, 0, 6]} arms={[["down", "down"], ["chin", "down"], ["down", "down"], ["down", "chin"]]} xs={[520, 880, 1280, 1640]} />
        <MeetingTable />
      </View>
      <View c={cam(t, [[aD, 1.1, 1080, 560], [S.dur, 1.3, 1080, 520]])} op={shot(t, aD, 1e9, 0.3)}>
        <Meeting t={t} />
        <Who c={LUSTIG} x={1080} yf={1060} t={t} facing={1} expr="suspicious" arms={["down", "stop"]} talk={t < S.Le[3]} seed={1} />
      </View>
      <Stamp x={1080} y={250} text="CONFIDENTIAL SALE?" t={t} t0={conf - 0.05} size={104} rot={-6} />
    </g>
  );
};

// ======================================================================== 6. ANDRÉ POISSON
const ScrapPiles: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    {Array.from({ length: 14 }).map((_, i) => {
      const r = Math.floor(i / 5), c = i % 5;
      return <rect key={i} x={x - 380 + c * 150 + r * 60} y={y - r * 54} width={170} height={40} rx={6} fill={["#7a5a46", "#8a6a52", "#6a4c3b"][i % 3]} stroke={INK} strokeWidth={5} transform={`rotate(${(i % 3 - 1) * 6} ${x - 300 + c * 150} ${y - r * 54})`} />;
    })}
    <path d={`M ${x + 220} ${y - 60} L ${x + 330} ${y - 240 - Math.sin(t * 3) * 8}`} stroke="#2f8f5b" strokeWidth={22} strokeLinecap="round" />
    <polygon points={`${x + 300},${y - 230} ${x + 370},${y - 270} ${x + 360},${y - 190}`} fill="#2f8f5b" />
  </g>
);
const poisson: SceneFn = ({ S, t }) => {
  const nm = wt(S, 0, /^Poisson/), opp = wt(S, 1, /^opportunity/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2;
  const ex = t < aC + 1.6 ? "suspicious" : t < aC + 3.2 ? "thinking" : "happy";
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.25, 1080, 520]])} op={shot(t, 0, aB, 0.3)}>
        <Meeting t={t} />
        <Who c={BIZ[0]} x={480} yf={1040} u={0.9} t={t} facing={1} look={0.6} seed={6} />
        <Who c={POISSON} x={1080} yf={1040} u={0.95} t={t} facing={1} expr="thinking" look={0.5} arms={["down", "chin"]} seed={2} />
        <Who c={BIZ[2]} x={1680} yf={1040} u={0.9} t={t} facing={-1} look={-0.4} seed={8} />
        <MeetingTable />
      </View>
      <Label x={1080} y={150} text="ANDRÉ POISSON" t={t} t0={nm} t1={aB + 1.2} size={66} bg="#4e3119" />
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.05, 1080, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Meeting t={t} />
        <Who c={POISSON} x={600} yf={1060} t={t} facing={1} expr={t > opp ? "happy" : "thinking"} lookY={-1} look={0.7} arms={["down", "hold"]} hold="paper" seed={2} />
        <MeetingTable papers={false} />
        <Thought x={1440} y={460} w={1060} h={620} t={t} t0={aB + 0.6} tail={[820, 420]}>
          <rect x={900} y={140} width={1100} height={700} fill="#e9eef2" />
          <ScrapPiles x={1360} y={680} t={t} />
        </Thought>
      </View>
      <View c={cam(t, [[aC, 1.7, 640, 420], [aC + 2.2, 1.0, 1080, 620], [S.dur, 1.05, 1080, 600]])} op={shot(t, aC, 1e9, 0.3)}>
        <Meeting t={t} />
        <Who c={POISSON} x={640} yf={1040} u={0.95} t={t} facing={1} expr={ex} look={0.6} seed={2} />
        <Who c={LUSTIG} x={1520} yf={1040} u={0.95} t={t} facing={-1} expr="smug" arms={["down", "talk"]} talk={t < S.Le[2]} seed={1} />
        <MeetingTable papers />
      </View>
    </g>
  );
};

// ======================================================================== 7. THE PAYMENT
const IronPile: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {Array.from({ length: 34 }).map((_, i) => {
      const r = Math.floor(i / 7), c = i % 7;
      return <rect key={i} x={300 + c * 230 + (r % 2) * 110} y={980 - r * 60 - Math.max(0, Math.sin(t * 2 + i)) * 0} width={260} height={46} rx={6} fill={["#7a5a46", "#8a6a52", "#6a4c3b"][i % 3]} stroke={INK} strokeWidth={5} />;
    })}
  </g>
);
const payment: SceneFn = ({ S, t }) => {
  const paid = wt(S, 0, /^paid/), dis = wt(S, 2, /^disappeared/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2, aD = S.dur - 1.5;
  const k = ip(t, paid + 0.1, paid + 0.9, 0, 1, Easing.inOut(Easing.cubic));
  const gone = t > dis + 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.3, 1080, 560]])} op={shot(t, 0, aB, 0.3)}>
        <Lobby t={t} win={false} />
        <Who c={LUSTIG} x={760} yf={FLOOR} t={t} facing={1} expr={k > 0.9 ? "smug" : "neutral"} arms={["down", k > 0.9 ? "hold" : "talk"]} seed={1} />
        <Who c={POISSON} x={1400} yf={FLOOR} t={t} facing={-1} expr="warm" arms={["down", "give"]} seed={2} />
        <Desk y={900} lamp={false} />
        <Envelope x={ip(k, 0, 1, 1200, 920)} y={ip(k, 0, 1, 690, 640) - Math.sin(k * Math.PI) * 70} s={0.75} r={-6} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.08, 1080, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Sky id="ipSky" top="#cfd9e2" bot="#f2ead6" />
        <IronPile t={t} />
        <Who c={POISSON} x={420} yf={1100} u={0.85} t={t} facing={1} expr="happy" arms={["cheer", "cheer"]} seed={2} />
      </View>
      <Label x={1080} y={150} text="THOUSANDS OF TONS OF IRON?" t={t} t0={aB + 0.4} t1={aC - 0.2} size={56} bg="#4e3119" />
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.05, 1180, 600]])} op={shot(t, aC, aD, 0.3)}>
        <Station t={t} />
        <Steam x={ip(t, dis, aD + 0.4, 1530, 2700, Easing.in(Easing.quad)) + 300} y={380} t={t} />
        <Locomotive x={ip(t, dis, aD + 0.4, 1500, 2700, Easing.in(Easing.quad))} yb={1060} t={t > dis ? (t - dis) * 2 : 0} s={0.85} carriages={2} />
        {!gone && <Who c={LUSTIG} x={ip(t, aC, dis, 200, 860, Easing.linear)} yf={960} u={0.8} t={t} facing={1} walk={t * 5} expr="smug" arms={["down", "down"]} hold="suitcase" holdHand={1} seed={1} />}
      </View>
      <View c={cam(t, [[aD, 1.0, 1080, 620], [S.dur, 1.04, 1080, 610]])} op={shot(t, aD, 1e9, 0.3)}>
        <ParisWide t={t} id="pySky" />
      </View>
    </g>
  );
};

// ======================================================================== 8. THE TRUTH
const truth: SceneFn = ({ S, t }) => {
  const never = wt(S, 1, /^never/), fraud = wt(S, 2, /^fraud/);
  const aB = S.L[1] - 0.2, aC = S.L[3] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.45, 1080, 470]])} op={shot(t, 0, aB, 0.3)}>
        <Office t={t} />
        <Who c={POISSON} x={1080} yf={FLOOR} t={t} facing={1} expr={t < 1.2 ? "neutral" : "worried"} lookY={0.8} arms={["down", "hold"]} hold="documents" seed={2} />
        <Desk />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 640], [aC, 1.05, 1080, 620]])} op={shot(t, aB, aC, 0.3)}>
        <ParisWide t={t} id="trSky" />
      </View>
      <Stamp x={1080} y={300} text="IT WAS NEVER FOR SALE." t={t} t0={never - 0.05} t1={aC - 0.2} size={70} rot={-5} />
      <Stamp x={1080} y={860} text="FRAUD" t={t} t0={fraud} t1={aC - 0.2} size={140} rot={8} />
      <View c={cam(t, [[aC, 1.1, 1080, 600], [S.dur, 1.3, 1080, 560]])} op={shot(t, aC, 1e9, 0.3)}>
        <Office t={t} night={0.6} />
        <Who c={POISSON} x={1080} yf={FLOOR} t={t} facing={1} expr="sad" lookY={1} lean={-4} arms={["down", "down"]} seed={2} />
        <Desk />
        <Paper x={620} y={760} w={300} h={130} img={false} head="NEWS" r={-8} />
      </View>
    </g>
  );
};

// ======================================================================== 9. HE TRIED IT AGAIN
const again: SceneFn = ({ S, t }) => {
  const agn = wt(S, 1, /^again/), left = wt(S, 3, /^left/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2, aD = S.L[3] - 0.2, aE = left - 0.4;
  return (
    <g>
      <View c={[1.0, 1080, 620]} op={shot(t, 0, aB, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c9a2" />
        <Calendar x={1080} y={640} t={t} t0={0.3} flips={7} s={1.3} />
      </View>
      <Label x={1080} y={150} text="SOME TIME LATER" t={t} t0={0.4} t1={aB - 0.2} size={58} />
      <View c={cam(t, [[aB, 1.0, 900, 620], [aC, 1.08, 1300, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Street t={t} ox={ip(t, aB, aC, 100, 700, Easing.linear)} people={3} />
        <Who c={LUSTIG} x={ip(t, aB, aC, 800, 1500, Easing.linear)} yf={FLOOR + 40} t={t} facing={1} walk={t * 5.2} expr="smug" arms={["down", "hold"]} hold="documents" seed={1} />
      </View>
      <Stamp x={1080} y={260} text="HE TRIED AGAIN." t={t} t0={agn} t1={aC - 0.25} size={120} rot={-6} />
      <View c={cam(t, [[aC, 1.2, 760, 520], [aD, 1.5, 700, 470]])} op={shot(t, aC, aD, 0.3)}>
        <Meeting t={t} />
        <Who c={BIZ[1]} x={700} yf={1040} u={0.95} t={t} facing={1} expr="suspicious" look={0.7} arms={["cross", "cross"]} seed={7} />
        <Who c={LUSTIG} x={1500} yf={1040} u={0.95} t={t} facing={-1} expr={t < aC + 1.2 ? "smug" : "awkward"} arms={["down", "talk"]} seed={1} />
        <MeetingTable />
      </View>
      <View c={cam(t, [[aD, 1.15, 1080, 560], [aE, 1.3, 1080, 520]])} op={shot(t, aD, aE, 0.3)}>
        <Street t={t} ox={500} people={4} />
        <Who c={LUSTIG} x={1080} yf={FLOOR + 40} t={t} facing={1} expr="worried" look={-0.9} arms={["down", "hold"]} hold="suitcase" seed={1} />
      </View>
      <View c={cam(t, [[aE, 1.0, 1080, 620], [S.dur, 1.05, 1000, 620]])} op={shot(t, aE, 1e9, 0.3)}>
        <Sky id="agSea" top="#8fb3d0" bot="#e8e2d0" />
        <rect x={-400} y={820} width={W + 800} height={600} fill="#3f6a8a" />
        {Array.from({ length: 24 }).map((_, i) => <rect key={i} x={((i * 233 - t * 40) % 2600 + 2600) % 2600 - 300} y={860 + (i % 7) * 50} width={100} height={7} rx={3} fill="#9cc0d8" opacity={0.6} />)}
        <Liner x={ip(t, aE, S.dur + 1, 1400, 400, Easing.linear)} yb={880} s={0.9} t={t} />
      </View>
    </g>
  );
};

// ======================================================================== 10. WHAT HAPPENED TO LUSTIG?
const caught: SceneFn = ({ S, t }) => {
  const arr = wt(S, 1, /^arrested/), sent = wt(S, 2, /^sentenced/);
  const aB = S.Le[0] * 0.55, aC = S.L[1] - 0.15, aD = S.L[2] - 0.15, aE = S.L[3] - 0.15;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.05, 1080, 620]])} op={shot(t, 0, aB, 0.3)}>
        <MapCard t={t} which="both" route={ip(t, 0.3, aB - 0.2)} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 640], [aC, 1.08, 1200, 620]])} op={shot(t, aB, aC, 0.3)}>
        <CityUS t={t} />
        <Who c={LUSTIG} x={ip(t, aB, aC, 600, 1300, Easing.linear)} yf={1080} u={0.85} t={t} facing={1} walk={t * 5} expr="smug" seed={1} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.12, 1080, 590]])} op={shot(t, aC, aD, 0.3)}>
        <CityUS t={t} />
        <Who c={AGENT} x={ip(t, arr - 0.4, arr + 0.3, 500, 760)} yf={1080} u={0.9} t={t} facing={1} expr="angry" arms={["down", "give"]} seed={3} badge />
        <Who c={LUSTIG} x={1080} yf={1080} u={0.9} t={t} facing={-1} expr={t > arr ? "worried" : "smug"} arms={t > arr ? ["shrug", "shrug"] : ["down", "down"]} seed={1} />
        <Who c={AGENT} x={ip(t, arr - 0.4, arr + 0.3, 1660, 1400)} yf={1080} u={0.9} t={t} facing={-1} expr="angry" arms={["down", "give"]} seed={4} badge />
        {t < arr + 0.4 && <Calendar x={1080} y={360} t={t} t0={aC + 0.05} flips={3} final="1935" s={ip(t, arr - 0.3, arr, 0.75, 0.0)} />}
      </View>
      <View c={cam(t, [[aD, 1.0, 1080, 620], [aE, 1.1, 1080, 580]])} op={shot(t, aD, aE, 0.3)}>
        <Court t={t} />
        <Stick x={1080} yf={900} u={0.95} t={t} outfit="robe" color="#16161a" hair="bald" mustache glasses expr="neutral" arms={["down", t > sent && t < sent + 0.6 ? "cheer" : "down"]} seed={9} />
        <Bench />
        <Who c={LUSTIG} x={420} yf={1120} u={0.9} t={t} facing={1} expr="sad" seed={1} />
      </View>
      <Label x={1080} y={150} text="20 YEARS IN PRISON" t={t} t0={sent + 0.4} t1={aE - 0.2} size={58} bg="#1d2c4a" />
      <View c={cam(t, [[aE, 1.0, 1080, 620], [S.dur, 1.12, 1080, 560]])} op={shot(t, aE, 1e9, 0.3)}>
        <Alcatraz t={t} />
      </View>
      <Label x={1080} y={150} text="ALCATRAZ" t={t} t0={aE + 0.5} size={58} />
    </g>
  );
};

// ======================================================================== 11. THE FINAL TWIST
const end: SceneFn = ({ S, t }) => {
  const aB = S.L[1] - 0.2, q = S.L[2] - 0.1;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 640], [aB, 1.12, 1080, 560]])} op={shot(t, 0, aB, 0.3)}>
        <ParisWide t={t} dusk={1} id="enSky" />
      </View>
      <View c={[1.0, 1080, 620]} op={shot(t, aB, 1e9, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#111" />
        <svg x={0} y={0} width={1070} height={H} viewBox="0 0 2160 1240" preserveAspectRatio="xMidYMid slice">
          <Lobby t={t} win={false} />
          <Who c={LUSTIG} x={1080} yf={1080} u={1.15} t={t} facing={1} expr="smug" arms={["down", "hold"]} hold="envelope" seed={1} />
        </svg>
        <svg x={1090} y={0} width={1070} height={H} viewBox="0 0 2160 1240" preserveAspectRatio="xMidYMid slice">
          <ParisWide t={t} dusk={1} id="enSky2" />
        </svg>
        <rect x={1070} y={0} width={20} height={H} fill="#fff" />
        <Label x={540} y={240} text="1925" t={t} t0={aB + 0.2} size={70} bg="#9e1b2d" />
        <Label x={1620} y={240} text="TODAY" t={t} t0={aB + 0.5} size={70} bg="#1d2c4a" />
      </View>
      {t > q && (
        <g opacity={ip(t, q, q + 0.3)} transform={tf(1080, 1010, pop(t, q, 0.45))}>
          <rect x={180} y={890} width={1800} height={240} rx={60} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={1080} y={1010} fontFamily="Inter" fontWeight={900} fontSize={94} fill={INK} textAnchor="middle" dominantBaseline="central">WOULD YOU HAVE BELIEVED HIM?</text>
        </g>
      )}
    </g>
  );
};

export const SCENES: Record<string, SceneFn> = { hook, paris, plan, official, announce, poisson, payment, truth, again, caught, end };
