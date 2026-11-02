import React from "react";
import { Easing } from "remotion";
import { INK, Person, headPos } from "./Person";
import { Bubble, Chip, EMOJI, Emoji, FLOOR, FONT, Hearts, IconCard, SceneData, Stamp, WH, WW, cam, ip, pop, tf } from "./ui";

// Characters
const BLUE = "#2860de";
const ME = { shirt: BLUE, hair: "quiff" as const, seed: 1 };
const DATE = { shirt: "#3aa874", hair: "long" as const, seed: 2, hood: false };
const POTTERY = { shirt: "#ec9a3c", hair: "bun" as const, hairCol: "#7a4a2a", seed: 5, hood: false };

const s0 = (S: SceneData, i: number) => S.lines[Math.min(i, S.lines.length - 1)].start;
const e0 = (S: SceneData, i: number) => S.lines[Math.min(i, S.lines.length - 1)].end;

type Out = { body: React.ReactNode; camera: [number, number, number] };

const Grad: React.FC<{ id: string; top: string; bot: string }> = ({ id, top, bot }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bot} />
    </linearGradient>
  </defs>
);

const Floor: React.FC<{ col: string; y?: number }> = ({ col, y = FLOOR - 20 }) => (
  <>
    <rect x={0} y={y} width={WW} height={WH - y} fill={col} />
    <line x1={0} y1={y} x2={WW} y2={y} stroke="rgba(0,0,0,0.18)" strokeWidth={6} />
  </>
);

const Window: React.FC<{ x: number; y: number; w: number; h: number; top: string; bot: string; id: string }> = ({ x, y, w, h, top, bot, id }) => (
  <>
    <Grad id={id} top={top} bot={bot} />
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    <rect x={x} y={y} width={w} height={h} fill="none" stroke="#f5f0e6" strokeWidth={18} />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#f5f0e6" strokeWidth={12} />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#f5f0e6" strokeWidth={12} />
    <rect x={x - 20} y={y + h} width={w + 40} height={24} fill="#ddd8cf" />
  </>
);

// ------------------------------------------------------------------------------------
// 1. HOOK — hypergamy is deleted
export const Hook = ({ S, t }: { S: SceneData; t: number }): Out => {
  const stand = s0(S, 1) - 0.2;
  const k = ip(t, stand, stand + 0.8);
  const sitting = t < stand;
  const x = sitting ? 560 : 560 + 160 * k;
  const expr = t < s0(S, 0) + 0.9 ? "tired" : t < s0(S, 1) ? "shock" : "nervous";
  const span = e0(S, 1) - s0(S, 1);
  const body = (
    <>
      <Grad id="bedwall" top="#c8d0ec" bot="#b8c2e2" />
      <rect width={WW} height={WH} fill="url(#bedwall)" />
      <Window x={1680} y={150} w={360} h={360} top="#ffe2b4" bot="#ffc696" id="bedwin" />
      <rect x={180} y={170} width={260} height={240} rx={12} fill="#242a54" stroke="#fafaff" strokeWidth={8} />
      <text x={310} y={300} fontFamily={FONT} fontWeight={900} fontSize={46} fill="#ffd25a" textAnchor="middle">GYM</text>
      <rect x={120} y={600} width={110} height={420} rx={24} fill="#78543c" />
      <rect x={140} y={790} width={860} height={110} rx={26} fill="#f4f4fa" />
      <rect x={400} y={750} width={610} height={130} rx={34} fill="#5a82cd" />
      <ellipse cx={300} cy={766} rx={110} ry={44} fill="#fcfcff" />
      <Floor col="#96765f" />
      <Person {...ME} x={x} yf={FLOOR} t={t} sit={sitting} expr={expr} look={sitting ? 0.6 : 0.8}
        arms={sitting ? ["down", "phone"] : ["head", "head"]} phoneHand={1} walk={!sitting && k < 1 ? t * 9 : null} />
      {/* the word, from the very first frame */}
      <g transform={tf(1300, 330, 1 + 0.03 * Math.sin(t * 3))}>
        <rect x={980} y={250} width={640} height={160} rx={30} fill="#fffffc" stroke={INK} strokeWidth={6} />
        <text x={1300} y={334} fontFamily={FONT} fontWeight={900} fontSize={96} fill={INK} textAnchor="middle" dominantBaseline="central">HYPERGAMY</text>
      </g>
      <Stamp x={1340} y={470} text="DELETED" t={t} t0={s0(S, 0) + 0.9} size={84} rot={-10} />
      {t >= s0(S, 1) ? (
        <g opacity={1 - ip(t, e0(S, 1) + 0.1, e0(S, 1) + 0.4)}>
          <IconCard x={1060} y={700} e="💰" label="MONEY" t={t} t0={s0(S, 1) + span * 0.38} mark="❌" />
          <IconCard x={1360} y={700} e="📏" label="HEIGHT" t={t} t0={s0(S, 1) + span * 0.5} mark="❌" />
          <IconCard x={1660} y={700} e="👑" label="STATUS" t={t} t0={s0(S, 1) + span * 0.68} mark="❌" />
        </g>
      ) : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.06, 1080, 600]]) };
};

// ------------------------------------------------------------------------------------
// 2. APP — the 6 ft filter disappears, you delete "6 ft"
export const App = ({ S, t }: { S: SceneData; t: number }): Out => {
  const off = s0(S, 0) + 1.5;
  const sw = ip(t, off, off + 0.3);
  const gone = ip(t, off + 0.5, off + 0.9);
  const del = ip(t, s0(S, 1) + 0.6, s0(S, 1) + 1.4, 0, 1, Easing.linear);
  const fix = t > s0(S, 1) + 1.6;
  const px = 380, py = 70, pw = 640, ph = 1100;
  const h6 = "6 ft";
  const shown = h6.slice(0, Math.round(h6.length * (1 - del)));
  const body = (
    <>
      <Grad id="appbg" top="#2a1f4a" bot="#53306e" />
      <rect width={WW} height={WH} fill="url(#appbg)" />
      {[[300, 300, 220], [1800, 260, 300], [1500, 1000, 260]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#ff5c93" opacity={0.08} />
      ))}
      {/* phone */}
      <rect x={px} y={py} width={pw} height={ph} rx={90} fill="#121218" stroke="#5c5c6c" strokeWidth={6} />
      <rect x={px + 18} y={py + 18} width={pw - 36} height={ph - 36} rx={72} fill="#fff6fa" />
      <rect x={px + pw / 2 - 90} y={py + 36} width={180} height={44} rx={22} fill="#121218" />
      <text x={px + pw / 2} y={py + 150} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={900} fontSize={52} fill="#ff3d7f" textAnchor="middle">Matchly 💘</text>
      {/* filter row */}
      <g opacity={1 - gone} transform={`translate(${gone * 60} ${gone * 30}) rotate(${gone * 8} ${px + pw / 2} ${py + 250})`}>
        <rect x={px + 50} y={py + 200} width={pw - 100} height={100} rx={26} fill="#ffe3ee" />
        <text x={px + 80} y={py + 262} fontFamily={FONT} fontWeight={800} fontSize={40} fill={INK}>Height: 6 ft +</text>
        <rect x={px + pw - 200} y={py + 222} width={110} height={56} rx={28} fill={sw > 0.5 ? "#c7c7cf" : "#33c46c"} />
        <circle cx={px + pw - 172 + 54 * (1 - sw)} cy={py + 250} r={24} fill="#fff" />
      </g>
      {t > off + 0.6 ? (
        <text x={px + pw / 2} y={py + 262} fontFamily={FONT} fontWeight={900} fontSize={44} fill="#e0263a" textAnchor="middle"
          transform={tf(px + pw / 2, py + 250, pop(t, off + 0.6))}>FILTER REMOVED</text>
      ) : null}
      {/* profile card */}
      <rect x={px + 50} y={py + 340} width={pw - 100} height={520} rx={36} fill="#ffffff" stroke="#f2d4e1" strokeWidth={4} />
      <clipPath id="photo"><rect x={px + 80} y={py + 370} width={pw - 160} height={250} rx={26} /></clipPath>
      <g clipPath="url(#photo)">
        <rect x={px + 80} y={py + 370} width={pw - 160} height={250} fill="#bfe0ff" />
        <Person {...ME} x={px + pw / 2} yf={py + 1050} u={1.1} t={t} expr={fix ? "happy" : "smug"} />
      </g>
      <text x={px + 90} y={py + 680} fontFamily={FONT} fontWeight={900} fontSize={50} fill={INK}>You, 22</text>
      <text x={px + 90} y={py + 760} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={600} fontSize={42} fill="#555">📏 Height: </text>
      <text x={px + 340} y={py + 760} fontFamily={FONT} fontWeight={800} fontSize={42} fill={fix ? "#1b9e55" : INK}>
        {fix ? "5'7\"" : shown}{!fix && t > s0(S, 1) && Math.floor(t * 3) % 2 ? "|" : ""}
      </text>
      {fix ? <Emoji x={px + 470} y={py + 746} size={46} e="✅" scale={pop(t, s0(S, 1) + 1.6)} /> : null}
      <text x={px + 90} y={py + 820} fontFamily={FONT} fontWeight={600} fontSize={34} fill="#888">likes: dogs, memes, pizza</text>
      {/* you */}
      <Person {...ME} x={1500} yf={FLOOR} t={t} arms={["down", "phone"]} phoneHand={1} look={-0.5}
        expr={t < s0(S, 0) + 1.5 ? "shock" : t < s0(S, 1) ? "happy" : fix ? "happy" : "smug"} />
      <Bubble x={1560} y={360} lines={["Finally."]} t={t} t0={s0(S, 1) + 2.0} t1={S.dur} size={60} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [s0(S, 1), 1.08, 1000, 600], [S.dur, 1.14, 980, 600]]) };
};

// ------------------------------------------------------------------------------------
// 3. LAMBO — nobody cares about the rental Lamborghini; the golden retriever wins
const Lambo: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <path d={`M ${x} ${y - 70} L ${x + 120} ${y - 150} L ${x + 380} ${y - 200} L ${x + 560} ${y - 170} L ${x + 760} ${y - 110} L ${x + 780} ${y - 40} L ${x} ${y - 30} Z`} fill="#f2c200" />
    <path d={`M ${x + 230} ${y - 168} L ${x + 380} ${y - 196} L ${x + 520} ${y - 172} L ${x + 450} ${y - 140} L ${x + 260} ${y - 140} Z`} fill="#26303f" />
    <rect x={x + 10} y={y - 60} width={760} height={18} fill="#c99f00" />
    {[x + 160, x + 620].map((wx, i) => (
      <g key={i}>
        <circle cx={wx} cy={y - 30} r={62} fill="#141418" />
        <circle cx={wx} cy={y - 30} r={30} fill="#9a9aa6" />
      </g>
    ))}
  </g>
);

export const LamboScene = ({ S, t }: { S: SceneData; t: number }): Out => {
  const ignored = t > e0(S, 0) - 1.0;
  const body = (
    <>
      <Grad id="city" top="#8fc4ef" bot="#dceaf4" />
      <rect width={WW} height={WH} fill="url(#city)" />
      {Array.from({ length: 11 }).map((_, i) => {
        const h = 300 + ((i * 137) % 320);
        return <rect key={i} x={-40 + i * 210} y={820 - h} width={190} height={h} fill={i % 2 ? "#b4c4d4" : "#a2b4c6"} />;
      })}
      <rect x={0} y={820} width={WW} height={60} fill="#c9c9cf" />
      <Floor col="#8c8c96" y={880} />
      <Lambo x={180} y={1020} />
      <g transform={tf(700, 640, pop(t, 0.6))}>
        <rect x={590} y={600} width={250} height={84} rx={14} fill="#fffffc" stroke={INK} strokeWidth={5} />
        <text x={715} y={632} fontFamily={FONT} fontWeight={900} fontSize={30} fill="#e0263a" textAnchor="middle">RENTED</text>
        <text x={715} y={668} fontFamily={FONT} fontWeight={800} fontSize={28} fill={INK} textAnchor="middle">$900 / day</text>
      </g>
      <Person x={1010} yf={FLOOR} shirt="#1d1d24" hair="slick" hood={false} t={t} seed={7} glasses
        arms={["hips", "hips"]} expr={ignored ? "sad" : "smug"} look={ignored ? 1 : 0} />
      {ignored ? <Emoji x={1150} y={430} size={90} e="🦗" scale={pop(t, e0(S, 0) - 1.0)} /> : null}
      {/* the crowd and the dog */}
      {[[1520, "#d2463c", "cap"], [1800, "#8a5cd6", "bun"], [1960, "#2aa198", "messy"]].map(([px, sh, hr], i) => (
        <Person key={i} x={px as number} yf={FLOOR} shirt={sh as string} hair={hr as never} hood={false} t={t} seed={10 + i}
          expr="love" look={i === 0 ? 0.6 : -0.6} lookY={0.6} facing={i === 0 ? 1 : -1} />
      ))}
      <Emoji x={1690} y={950} size={230} e="🐕" />
      <Hearts cx={1690} cy={720} t={t} n={6} spread={110} rise={300} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.12, 800, 620], [e0(S, 0) + 0.1, 1.16, 860, 600], [s0(S, 1) + 0.6, 1.25, 1640, 620], [S.dur, 1.28, 1640, 620]]) };
};

// ------------------------------------------------------------------------------------
// 4. NEWS — luxury watch sales crash, jet selfies get 0 likes
export const News = ({ S, t }: { S: SceneData; t: number }): Out => {
  const span = e0(S, 0) - s0(S, 0);
  const drop = ip(t, s0(S, 0) + span * 0.25, s0(S, 0) + span * 0.6);
  const pts = Array.from({ length: 13 }).map((_, i) => {
    const x = 380 + i * 70;
    const base = 420 + Math.sin(i * 1.7) * 26 - i * 6;
    const y = i < 7 ? base : base + (i - 6) * 55 * drop;
    return `${x},${y}`;
  });
  const jet = t > s0(S, 0) + span * 0.6;
  const body = (
    <>
      <Grad id="newsbg" top="#c9b9a6" bot="#b19e8a" />
      <rect width={WW} height={WH} fill="url(#newsbg)" />
      <Floor col="#7d6553" />
      {/* TV */}
      <rect x={240} y={110} width={1180} height={720} rx={24} fill="#18181e" />
      <rect x={270} y={140} width={1120} height={660} fill="#0d2440" />
      <rect x={270} y={140} width={1120} height={90} fill="#e0263a" />
      <text x={300} y={200} fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff">BREAKING NEWS</text>
      <text x={830} y={300} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={900} fontSize={52} fill="#fff" textAnchor="middle">⌚ LUXURY WATCH SALES</text>
      <polyline points={pts.join(" ")} fill="none" stroke="#ff4d5e" strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
      {drop > 0.6 ? <text x={1190} y={720} fontFamily={FONT} fontWeight={900} fontSize={64} fill="#ff4d5e" textAnchor="middle"
        transform={tf(1190, 700, pop(t, s0(S, 0) + span * 0.5))}>-70%</text> : null}
      <rect x={270} y={740} width={1120} height={60} fill="#ffd25a" />
      <text x={300} y={782} fontFamily={FONT} fontWeight={800} fontSize={36} fill={INK}>NOBODY IS IMPRESSED ANYMORE</text>
      <rect x={780} y={830} width={100} height={140} fill="#18181e" />
      {/* jet selfie post */}
      {jet ? (
        <g transform={tf(1700, 520, pop(t, s0(S, 0) + span * 0.6))}>
          <rect x={1450} y={180} width={500} height={680} rx={40} fill="#fffffc" stroke={INK} strokeWidth={5} />
          <text x={1490} y={250} fontFamily={FONT} fontWeight={800} fontSize={34} fill={INK}>@rich.life.only</text>
          <rect x={1480} y={280} width={440} height={380} rx={20} fill="#9fd0ff" />
          <Emoji x={1700} y={450} size={200} e="🛩️" />
          <text x={1490} y={740} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={900} fontSize={54} fill="#e0263a">♡ 0 likes</text>
          <text x={1490} y={810} fontFamily={FONT} fontWeight={600} fontSize={32} fill="#888">"cool, but are you funny?"</text>
        </g>
      ) : null}
      <Person {...ME} x={1820} yf={FLOOR} u={0.85} t={t} expr="laugh" look={-1} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.08, 1080, 600]]) };
};

// ------------------------------------------------------------------------------------
// 5. DATE — you talk about yourself for 2 hours
const Clock: React.FC<{ cx: number; cy: number; a: number }> = ({ cx, cy, a }) => (
  <g>
    <circle cx={cx} cy={cy} r={70} fill="#faf8f0" stroke={INK} strokeWidth={7} />
    <line x1={cx} y1={cy} x2={cx + Math.sin(a) * 52} y2={cy - Math.cos(a) * 52} stroke={INK} strokeWidth={7} strokeLinecap="round" />
    <line x1={cx} y1={cy} x2={cx + Math.sin(a / 12) * 34} y2={cy - Math.cos(a / 12) * 34} stroke={INK} strokeWidth={9} strokeLinecap="round" />
  </g>
);

export const DateScene = ({ S, t }: { S: SceneData; t: number }): Out => {
  const span = e0(S, 0) - s0(S, 0);
  const ff = ip(t, s0(S, 0) + span * 0.55, e0(S, 0), 0, 1, Easing.linear);
  const bored = ff > 0.3;
  const after = t >= s0(S, 1);
  const body = (
    <>
      <Grad id="rest" top="#7a3f3a" bot="#5e302d" />
      <rect width={WW} height={WH} fill="url(#rest)" />
      {[400, 1760].map((x, i) => (
        <rect key={i} x={x - 110} y={200} width={220} height={260} fill="#e8d4a8" stroke="#3c2420" strokeWidth={12} />
      ))}
      <Clock cx={1080} cy={250} a={ff * Math.PI * 2 * 24} />
      {ff > 0.2 && ff < 1 ? <Chip x={1080} y={400} text="2 HOURS LATER" t={t} t0={s0(S, 0) + span * 0.62} size={44} /> : null}
      <Floor col="#3c2420" />
      <rect x={760} y={790} width={640} height={36} rx={10} fill="#fafafa" />
      <rect x={1060} y={826} width={40} height={200} fill="#3c2420" />
      <rect x={1068} y={720} width={24} height={70} fill="#fff6dc" />
      <ellipse cx={1080} cy={712} rx={14} ry={22} fill="#ffcf5a" opacity={0.6 + 0.4 * Math.sin(t * 12)} />
      <Person {...ME} x={720} yf={FLOOR} t={t} sit expr={after ? "sad" : "happy"} talk={!after && t > s0(S, 0) + 1.2} look={1} />
      <Person {...DATE} x={1440} yf={FLOOR} t={t} sit facing={-1} look={bored ? 0 : -1} lookY={bored ? 1 : 0}
        expr={after ? "neutral" : bored ? "tired" : "happy"} arms={bored ? ["down", "head"] : ["down", "down"]} />
      <Bubble x={760} y={390} lines={["...and then I bought", "a new watch..."]} t={t} t0={s0(S, 0) + span * 0.35} t1={e0(S, 0) + 0.2} size={50} />
      <Stamp x={1080} y={700} text="NO 2ND DATE" t={t} t0={s0(S, 1) + 0.1} size={100} />
      <Chip x={1080} y={250} text="PERSONALITY: REQUIRED ✅" t={t} t0={s0(S, 1) + 1.6} size={46} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [s0(S, 1), 1.1, 1080, 600], [S.dur, 1.16, 1080, 580]]) };
};

// ------------------------------------------------------------------------------------
// 6. POTTERY — cook, listen, pottery class; the potato bowl
export const Pottery = ({ S, t }: { S: SceneData; t: number }): Out => {
  const span = e0(S, 0) - s0(S, 0);
  const a = s0(S, 0) + span * 0.3;
  const b = s0(S, 0) + span * 0.62;
  const phase = t < a ? 0 : t < b ? 1 : 2;
  const bowl = t >= s0(S, 1);
  let body: React.ReactNode;
  if (phase === 0) {
    body = (
      <>
        <rect width={WW} height={WH} fill="#f6e2b8" />
        <rect x={0} y={640} width={WW} height={60} fill="#e9e6df" />
        <rect x={0} y={700} width={WW} height={330} fill="#6c9c86" />
        <Floor col="#b48660" />
        <Person {...ME} x={1000} yf={FLOOR} t={t} arms={["down", "point"]} expr="happy" look={1} />
        <rect x={1150} y={590} width={190} height={22} rx={10} fill="#2a2a30" />
        <ellipse cx={1310} cy={600} rx={90} ry={26} fill="#3a3a42" />
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={1290 + i * 20} cy={560 - ((t * 3 + i * 0.3) % 1) * 90} rx={22} ry={34} fill="#ff8a2a" opacity={0.8 - ((t * 3 + i * 0.3) % 1) * 0.7} />
        ))}
        <Chip x={1080} y={250} text="LEARNS TO COOK 🍳" t={t} t0={s0(S, 0) + 0.2} />
      </>
    );
  } else if (phase === 1) {
    body = (
      <>
        <rect width={WW} height={WH} fill="#cfe3d2" />
        <Floor col="#8aa48e" />
        <Person {...ME} x={820} yf={FLOOR} t={t} expr="happy" look={1} lookY={Math.sin(t * 6) * 0.4} />
        <Person x={1360} yf={FLOOR} shirt="#e0a030" hair="cap" hood={false} t={t} seed={8} talk expr="happy" look={-1} facing={-1} />
        <Bubble x={1300} y={390} lines={["...and then my cat..."]} t={t} t0={a + 0.05} t1={b} tail="right" size={52} />
        <Chip x={1080} y={250} text="ACTUALLY LISTENS 👂" t={t} t0={a + 0.2} />
      </>
    );
  } else {
    body = (
      <>
        <rect width={WW} height={WH} fill="#e8d6c8" />
        {[300, 600, 1560, 1860].map((x, i) => (
          <g key={i}>
            <rect x={x - 120} y={300} width={240} height={14} fill="#8a6a50" />
            <path d={`M ${x - 50} 300 Q ${x - 60} 240 ${x - 20} 230 L ${x + 20} 230 Q ${x + 60} 240 ${x + 50} 300 Z`} fill={["#c86e4c", "#6e8cc8", "#d4a24c", "#7aa86e"][i]} />
          </g>
        ))}
        <Floor col="#a68a74" />
        <Person {...ME} x={760} yf={FLOOR} t={t} sit expr={bowl ? "nervous" : "neutral"} look={1} lookY={1} blush={bowl ? 1 : 0} />
        {/* wheel + the bowl */}
        <rect x={960} y={840} width={260} height={30} rx={10} fill="#6a6a72" />
        <ellipse cx={1090} cy={835} rx={140} ry={26} fill="#8a8a92" />
        <g transform={tf(1090, 770, bowl ? 1 + 0.06 * Math.sin(t * 9) : 1)}>
          <path d="M 1010 815 Q 990 760 1030 735 Q 1070 700 1120 728 Q 1175 745 1160 790 Q 1150 830 1090 828 Q 1030 832 1010 815 Z" fill="#b07a4e" />
          <ellipse cx={1085} cy={735} rx={52} ry={14} fill="#8a5a36" />
        </g>
        {bowl ? <Emoji x={1300} y={700} size={140} e="🥔" scale={pop(t, s0(S, 1) + 0.5)} /> : null}
        {bowl ? <text x={1220} y={700} fontFamily={FONT} fontWeight={900} fontSize={70} fill={INK} textAnchor="middle">=</text> : null}
        <Person {...POTTERY} x={1560} yf={FLOOR} t={t} facing={-1} look={-1} expr={bowl ? "laugh" : "happy"} arms={bowl ? ["belly", "belly"] : ["down", "down"]} />
        <Chip x={1080} y={230} text="POTTERY CLASS 🏺" t={t} t0={b + 0.1} />
      </>
    );
  }
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [b, 1.02, 1080, 620], [s0(S, 1), 1.2, 1180, 640], [S.dur, 1.26, 1200, 640]]) };
};

// ------------------------------------------------------------------------------------
// 7. BILLIONAIRE — "what do you do for fun?" "Business." Left on read.
export const Billionaire = ({ S, t }: { S: SceneData; t: number }): Out => {
  const leave = ip(t, s0(S, 1) + 0.9, s0(S, 1) + 1.5);
  const read = t > s0(S, 1) + 1.1;
  const body = (
    <>
      <Grad id="fancy" top="#1e2340" bot="#2c2a48" />
      <rect width={WW} height={WH} fill="url(#fancy)" />
      {[540, 1080, 1620].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={0} x2={x} y2={110} stroke="#d8b45a" strokeWidth={5} />
          <path d={`M ${x - 90} 110 L ${x + 90} 110 L ${x + 50} 190 L ${x - 50} 190 Z`} fill="#f2d27a" />
          <ellipse cx={x} cy={200} rx={130} ry={40} fill="#ffe7a8" opacity={0.25} />
        </g>
      ))}
      <Floor col="#3a2c26" />
      <rect x={780} y={790} width={600} height={36} rx={10} fill="#f6f2e6" />
      <rect x={1060} y={826} width={40} height={200} fill="#2a1e1a" />
      <Emoji x={980} y={760} size={70} e="🍷" />
      <Emoji x={1190} y={760} size={70} e="🦞" />
      <Person x={720} yf={FLOOR} shirt="#22222c" hair="bald" hood={false} tie="#c8a040" t={t} seed={9} sit look={1}
        expr={t > s0(S, 1) + 1.0 ? "shock" : "smug"} talk={t > s0(S, 1) && t < s0(S, 1) + 0.8} />
      <g opacity={1 - leave} transform={`translate(${leave * 500} 0)`}>
        <Person x={1440} yf={FLOOR} shirt="#d23c5a" hair="long" hood={false} t={t} seed={3} sit facing={-1} look={-1}
          expr={t > s0(S, 1) + 0.5 ? "tired" : "happy"} talk={t > e0(S, 0) - 1.4 && t < e0(S, 0)} />
      </g>
      <Bubble x={1400} y={390} lines={["So what do you do", "for fun?"]} t={t} t0={e0(S, 0) - 1.5} t1={s0(S, 1) + 0.2} tail="right" size={52} />
      <Bubble x={760} y={400} lines={["Business."]} t={t} t0={s0(S, 1) - 0.05} t1={s0(S, 1) + 1.1} size={62} />
      {read ? (
        <g transform={tf(1500, 400, pop(t, s0(S, 1) + 1.1))}>
          <rect x={1220} y={220} width={560} height={300} rx={36} fill="#fffffc" stroke={INK} strokeWidth={5} />
          <rect x={1420} y={260} width={330} height={80} rx={40} fill="#2f80ff" />
          <text x={1585} y={312} fontFamily={FONT} fontWeight={600} fontSize={34} fill="#fff" textAnchor="middle">had fun tonight?</text>
          <text x={1740} y={390} fontFamily={FONT} fontWeight={600} fontSize={30} fill="#999" textAnchor="end">Read 9:41 PM</text>
          <text x={1500} y={470} fontFamily={FONT} fontWeight={900} fontSize={44} fill="#e0263a" textAnchor="middle">LEFT ON READ</text>
        </g>
      ) : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.1, 1080, 600]]) };
};

// ------------------------------------------------------------------------------------
// 8. WEDDING — year ten
export const Wedding = ({ S, t }: { S: SceneData; t: number }): Out => {
  const body = (
    <>
      <Grad id="garden" top="#a8dcff" bot="#e6f6ff" />
      <rect width={WW} height={WH} fill="url(#garden)" />
      <ellipse cx={400} cy={1000} rx={900} ry={260} fill="#8cc878" />
      <ellipse cx={1800} cy={1020} rx={900} ry={260} fill="#7cbc6c" />
      <path d="M 760 1030 L 760 420 Q 1080 140 1400 420 L 1400 1030" fill="none" stroke="#fff6fa" strokeWidth={40} />
      {Array.from({ length: 14 }).map((_, i) => {
        const a = Math.PI * (i / 13);
        return <Emoji key={i} x={1080 - Math.cos(a) * 320} y={430 - Math.sin(a) * 250} size={56} e={i % 2 ? "🌸" : "🌼"} />;
      })}
      <Floor col="#78b468" />
      <Person {...ME} x={930} yf={FLOOR} shirt="#22304e" hood={false} tie="#e05a7a" t={t} expr="love" look={1} />
      <Person {...POTTERY} shirt="#fbfbff" dress x={1240} yf={FLOOR} t={t} facing={-1} look={-1} expr="love" />
      <rect x={1520} y={860} width={200} height={20} fill="#c8a882" />
      <rect x={1608} y={880} width={24} height={150} fill="#c8a882" />
      <g transform={tf(1620, 800, pop(t, 0.8))}>
        <path d="M 1540 845 Q 1520 800 1560 780 Q 1600 752 1650 776 Q 1705 790 1690 830 Q 1680 862 1620 860 Q 1560 864 1540 845 Z" fill="#b07a4e" />
        <Emoji x={1590} y={740} size={60} e="🌷" />
        <Emoji x={1650} y={730} size={60} e="🌹" />
      </g>
      <Hearts cx={1085} cy={520} t={t} n={8} spread={150} rise={360} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.12, 1180, 600]]) };
};

// ------------------------------------------------------------------------------------
// 9. FACT — what people actually rate highest (Buss 1989, 37 cultures)
export const Fact = ({ S, t }: { S: SceneData; t: number }): Out => {
  const span = e0(S, 0) - s0(S, 0);
  const grow = ip(t, s0(S, 0) + span * 0.08, s0(S, 0) + span * 0.5);
  const rows: [string, string, number, number][] = [
    ["💗", "KINDNESS", 0.95, 0.95],
    ["🧠", "INTELLIGENCE", 0.9, 0.88],
    ["💰", "MONEY", 0.45, 0.65],
  ];
  const body = (
    <>
      <rect width={WW} height={WH} fill="#14324a" />
      <rect x={280} y={110} width={1600} height={960} rx={44} fill="#fffffc" />
      <text x={1080} y={210} fontFamily={FONT} fontWeight={900} fontSize={62} fill={INK} textAnchor="middle">WHAT PEOPLE WANT IN A PARTNER</text>
      <text x={1100} y={340} fontFamily={FONT} fontWeight={800} fontSize={40} fill="#2860de" textAnchor="middle">MEN</text>
      <text x={1560} y={340} fontFamily={FONT} fontWeight={800} fontSize={40} fill="#d23c78" textAnchor="middle">WOMEN</text>
      {rows.map(([e, lab, m, w], i) => {
        const y = 430 + i * 170;
        return (
          <g key={i}>
            <Emoji x={380} y={y + 20} size={70} e={e} />
            <text x={440} y={y + 36} fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>{lab}</text>
            <rect x={900} y={y - 10} width={400 * m * grow} height={60} rx={30} fill="#2860de" />
            <rect x={1360} y={y - 10} width={400 * w * grow} height={60} rx={30} fill="#d23c78" />
          </g>
        );
      })}
      {grow > 0.9 ? <Emoji x={1810} y={420} size={80} e="⭐" scale={pop(t, s0(S, 0) + span * 0.5)} /> : null}
      <text x={1080} y={262} fontFamily={FONT} fontWeight={600} fontSize={32} fill="#666" textAnchor="middle">Study of 37 cultures (Buss, 1989)</text>
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 600], [S.dur, 1.05, 1080, 600]]) };
};

// ------------------------------------------------------------------------------------
// 10. CTA — would this world be better?
export const Cta = ({ t }: { S: SceneData; t: number }): Out => {
  const body = (
    <>
      <rect x={0} y={0} width={WW / 2} height={WH} fill="#ffb4d0" />
      <rect x={WW / 2} y={0} width={WW / 2} height={WH} fill="#4462b2" />
      <line x1={WW / 2} y1={0} x2={WW / 2} y2={WH} stroke="#fff" strokeWidth={8} />
      <Person {...ME} x={420} yf={FLOOR} t={t} expr="love" look={1} />
      <Person {...POTTERY} x={700} yf={FLOOR} t={t} expr="love" look={-1} facing={-1} />
      <Hearts cx={560} cy={560} t={t} n={6} spread={80} rise={280} />
      <Lambo x={1250} y={1040} />
      <Person x={1700} yf={FLOOR} shirt="#1d1d24" hair="slick" hood={false} glasses t={t} seed={7} expr="sad" arms={["hips", "hips"]} />
      {[[540, "YES 💘"], [1620, "NO WAY 🤔"]].map(([x, lab], i) => (
        <g key={i}>
          <rect x={(x as number) - 240} y={70} width={480} height={130} rx={30} fill="#fffffc" />
          <text x={x as number} y={138} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={900} fontSize={66} fill={INK} textAnchor="middle" dominantBaseline="central">{lab}</text>
        </g>
      ))}
    </>
  );
  return { body, camera: [1, 1080, 620] };
};

export const SCENES: Record<string, (p: { S: SceneData; t: number }) => Out> = {
  hook: Hook, app: App, lambo: LamboScene, news: News, date: DateScene, pottery: Pottery,
  billionaire: Billionaire, wedding: Wedding, fact: Fact, cta: Cta,
};
export { headPos };
