import { Easing } from "remotion";
import { BigPhone, Room, Street } from "./env";
import { Apartments, Graph } from "./env2";
import { ALEX, Bubble, Chip, Emoji, H, P, ROSE, Ring, Sparkles, VICTOR, View, W, cam, ip, pop, shot, tf } from "./kit";
import { INK } from "./Stick";
import { BedRoom, BigHead } from "./scenesA";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ 6 · THE PAPER INTERNET
const NOTES: { x: number; y: number; c: string; lines: string[]; r: number }[] = [
  { x: 520, y: 320, c: "#fff3a8", lines: ["LOST CAT 🐱", "orange, fat"], r: -4 },
  { x: 820, y: 300, c: "#bfe8ff", lines: ["HELP WANTED", "bakery · cash"], r: 3 },
  { x: 1120, y: 330, c: "#ffd0dc", lines: ["MEET 6 PM", "town hall"], r: -2 },
  { x: 1420, y: 310, c: "#d6f5c8", lines: ["FREE BREAD", "for neighbors"], r: 5 },
  { x: 660, y: 520, c: "#ffe1b8", lines: ["RIDES TO", "HOSPITAL"], r: 2 },
  { x: 960, y: 540, c: "#fff3a8", lines: ["MOM, I'M OK", "– Sam"], r: -5 },
  { x: 1260, y: 520, c: "#bfe8ff", lines: ["SELLING", "PAPER MAPS"], r: 4 },
  { x: 1560, y: 540, c: "#ffd0dc", lines: ["BABYSITTER", "ask Rose"], r: -3 },
];

export const board: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.0, 1080, 600], [E.notice, 1.25, 1050, 460], [E.maps - 0.3, 1.3, 1000, 470]]);
  const cB = cam(t, [[E.maps - 0.3, 1.3, 1080, 560], [E.library - 0.3, 1.2, 1080, 580]]);
  const cC = cam(t, [[E.library - 0.3, 1.0, 1080, 620], [S.dur, 1.06, 1180, 610]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.maps - 0.3, 0.35)}>
        <Street id="o-sq" t={t * 0.1} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={360} y={180} width={1440} height={560} rx={16} fill="#c99a62" stroke={INK} strokeWidth={10} />
        <rect x={390} y={210} width={1380} height={500} rx={8} fill="#b9874f" />
        <rect x={800} y={110} width={560} height={90} rx={14} fill="#2a3350" stroke={INK} strokeWidth={6} />
        <text x={1080} y={157} fontFamily="Inter" fontWeight={900} fontSize={50} fill="#fff" textAnchor="middle" dominantBaseline="central">TOWN BOARD</text>
        {[480, 1680].map((x) => <rect key={x} x={x} y={740} width={30} height={FLOOR - 740} fill="#6b4b33" />)}
        {NOTES.map((n, i) => {
          const t0 = (i < 4 ? E.rebuilt : E.notice) - 0.6 + (i % 4) * 0.35;
          if (t < t0) return null;
          return (
            <g key={i} transform={tf(n.x, n.y, pop(t, t0, 0.3), n.r)}>
              <rect x={n.x - 130} y={n.y - 80} width={260} height={160} fill={n.c} stroke={INK} strokeWidth={4} />
              <circle cx={n.x} cy={n.y - 66} r={10} fill="#e0463c" stroke={INK} strokeWidth={3} />
              {n.lines.map((l, j) => (
                <text key={j} x={n.x} y={n.y - 18 + j * 50} fontFamily="Inter, Noto Color Emoji" fontWeight={j ? 700 : 900} fontSize={j ? 28 : 34} fill={INK} textAnchor="middle" dominantBaseline="central">{l}</text>
              ))}
            </g>
          );
        })}
        {[0, 1, 2].map((i) => (
          <P key={i} t={t} x={560 + i * 520} yf={FLOOR + 40} u={0.9} outfit={["coat", "tee", "cardigan"][i] as "tee"} color={["#2fa3a0", "#e0463c", "#8e5bd0"][i]}
            hair={["long", "short", "grayBun"][i] as "short"} facing={1} look={0} lookY={-0.8} arms={i === 1 ? ["down", "stop"] : ["down", "chin"]} expr="thinking" seed={100 + i} />
        ))}
      </View>
      <View c={cB} op={shot(t, E.maps - 0.3, E.library - 0.3, 0.35)}>
        <Street id="o-st" t={t * 0.1} sky={["#ffd9a8", "#fff1dc"]} />
        <P t={t} x={1080} yf={FLOOR + 40} {...ALEX} arms={["hold", "hold"]} lookY={0.5} look={0.3} expr="thinking" seed={1} />
        <g transform={tf(1080, 600, pop(t, E.maps - 0.2, 0.4))}>
          <rect x={760} y={470} width={640} height={300} fill="#f6efd8" stroke={INK} strokeWidth={6} />
          {[1, 2, 3].map((i) => <line key={i} x1={760 + i * 160} y1={470} x2={760 + i * 160} y2={770} stroke="#d9cfb0" strokeWidth={4} />)}
          <path d="M 790 720 C 900 600, 1000 700, 1100 560 S 1300 520, 1370 500" fill="none" stroke="#e0463c" strokeWidth={8} strokeDasharray="20 14" />
          <path d="M 800 520 L 1380 740" stroke="#7fa6cf" strokeWidth={14} />
          <circle cx={1370} cy={500} r={16} fill="#e0463c" stroke={INK} strokeWidth={4} />
          <text x={1080} y={510} fontFamily="Inter" fontWeight={900} fontSize={30} fill="#6b5a3a" textAnchor="middle">CITY MAP · 1998</text>
        </g>
        <Chip x={1080} y={250} text="🗺️ NO GPS" t={t} t0={E.maps + 0.2} bg="#16161c" fg="#ffe36b" size={46} />
      </View>
      <View c={cC} op={shot(t, E.library - 0.3, 1e9, 0.35)}>
        <Street id="o-st2" t={t * 0.1} sky={["#a7dcf6", "#eaf6fb"]} />
        <rect x={260} y={FLOOR - 760} width={1000} height={760} fill="#d9c9b0" stroke={INK} strokeWidth={8} />
        <path d={`M 220 ${FLOOR - 760} L 760 ${FLOOR - 900} L 1300 ${FLOOR - 760} Z`} fill="#b9a98f" stroke={INK} strokeWidth={8} />
        <text x={760} y={FLOOR - 800} fontFamily="Inter" fontWeight={900} fontSize={52} fill="#5a3e2b" textAnchor="middle">PUBLIC LIBRARY</text>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={330 + i * 240} y={FLOOR - 700} width={60} height={560} fill="#f4f1ea" stroke={INK} strokeWidth={5} />)}
        <rect x={680} y={FLOOR - 300} width={160} height={300} fill="#5a3e2b" stroke={INK} strokeWidth={6} />
        {Array.from({ length: 9 }).map((_, i) => (
          <P key={i} t={t} x={900 + i * 150} yf={FLOOR + 30} u={0.78} outfit={["tee", "coat", "suit", "hoodie", "dress", "tee", "cardigan", "hoodie", "coat"][i] as "tee"}
            color={["#e0463c", "#8e5bd0", "#5b6270", "#f2c84b", "#ff7fb0", "#3fae6a", "#c0703a", "#2fa3a0", "#d9934e"][i]}
            hair={["short", "long", "slick", "curly", "bun", "cap", "bald", "short", "long"][i] as "short"} accent="#2f6fe0" facing={-1} look={-1}
            arms={i % 2 ? ["down", "hold"] : ["down", "down"]} hold={i % 2 ? "paper" : null} expr="neutral" seed={110 + i} />
        ))}
        <Chip x={1500} y={300} text="📚 QUEUE: 2 HOURS" t={t} t0={E.library + 0.3} bg="#16161c" fg="#ffb238" size={44} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 7 · THE REAL COST
export const hard: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const cA = cam(t, [[0, 1.2, 1080, 600], [E.hospital, 1.0, 1080, 620], [E.flights - 0.3, 1.08, 1100, 600]]);
  const cB = cam(t, [[E.flights - 0.3, 1.0, 1080, 600], [E.pay - 0.3, 1.08, 1080, 580]]);
  const cC = cam(t, [[E.pay - 0.3, 1.1, 1080, 600], [E.graph - 0.3, 1.15, 1080, 580]]);
  const cD = cam(t, [[E.graph - 0.3, 1.0, 1080, 620], [S.dur, 1.04, 1080, 610]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.flights - 0.3, 0.35)}>
        <Room id="d-hosp" wall="#e3f0f2" wall2="#cfe2e6" floor="#b9c6cc" wains="#bfdce0" lightX={1080} />
        <rect x={1300} y={150} width={520} height={330} rx={16} fill="#0d2238" stroke={INK} strokeWidth={8} />
        <text x={1560} y={330} fontFamily="Inter" fontWeight={900} fontSize={48} fill="#ff5a6a" textAnchor="middle">SYSTEM OFFLINE</text>
        <rect x={360} y={FLOOR - 300} width={760} height={110} rx={20} fill="#ffffff" stroke={INK} strokeWidth={6} />
        <rect x={360} y={FLOOR - 190} width={760} height={50} rx={10} fill="#9fb3c9" stroke={INK} strokeWidth={5} />
        <rect x={400} y={FLOOR - 140} width={30} height={140} fill="#5b6270" />
        <rect x={1050} y={FLOOR - 140} width={30} height={140} fill="#5b6270" />
        <circle cx={460} cy={FLOOR - 330} r={62} fill={INK} />
        <rect x={380} y={FLOOR - 290} width={110} height={40} rx={14} fill="#ffffff" />
        <P t={t} x={1320} yf={FLOOR + 30} outfit="coat" color="#f4f6fb" hair="bun" arms={["hold", "chest"]} hold="paper" holdHand={0} lookY={0.6} expr="worried" facing={-1} look={-1} seed={120} />
        <Chip x={800} y={250} text="📋 BACK TO PAPER CHARTS" t={t} t0={E.hospital + 0.4} bg="#16161c" fg="#ffe36b" size={44} />
      </View>
      <View c={cB} op={shot(t, E.flights - 0.3, E.pay - 0.3, 0.35)}>
        <Room id="d-air" wall="#d9dee6" wall2="#c3cad6" floor="#9aa3b2" lightX={1080} />
        <rect x={300} y={120} width={1560} height={560} rx={20} fill="#16161c" stroke={INK} strokeWidth={8} />
        <text x={400} y={190} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#ffe36b">DEPARTURES</text>
        {["LONDON", "TOKYO", "NEW YORK", "PARIS", "DUBAI", "SYDNEY"].map((c, i) => (
          <g key={c}>
            <text x={400} y={270 + i * 66} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#e9e9ee">{c}</text>
            <text x={1000} y={270 + i * 66} fontFamily="Inter" fontWeight={800} fontSize={40} fill="#e9e9ee">{`0${6 + i}:${i % 2 ? "15" : "40"}`}</text>
            {t > E.flights + 0.1 + i * 0.18 ? <text x={1760} y={270 + i * 66} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#ff5a6a" textAnchor="end">CANCELLED</text>
              : <text x={1760} y={270 + i * 66} fontFamily="Inter" fontWeight={900} fontSize={40} fill="#7dff9a" textAnchor="end">ON TIME</text>}
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <P key={i} t={t} x={500 + i * 380} yf={FLOOR + 30} u={0.9} outfit={["suit", "coat", "tee", "hoodie"][i] as "tee"} color={["#5b6270", "#8e5bd0", "#e0463c", "#f2c84b"][i]}
            hair={["slick", "long", "cap", "curly"][i] as "short"} accent="#2f6fe0" lookY={-0.8} arms={i % 2 ? ["shrug", "shrug"] : ["down", "hold"]} hold={i % 2 ? null : "bag"} expr="worried" seed={130 + i} />
        ))}
      </View>
      <View c={cC} op={shot(t, E.pay - 0.3, E.graph - 0.3, 0.35)}>
        <Room id="d-off" wall="#e6e1d8" wall2="#d6cfc4" floor="#8f8a84" wains="#cfc6b8" />
        <rect x={700} y={170} width={760} height={260} rx={16} fill="#fffdf6" stroke={INK} strokeWidth={8} />
        <text x={1080} y={260} fontFamily="Inter" fontWeight={900} fontSize={60} fill="#d0182e" textAnchor="middle">PAYDAY DELAYED</text>
        <text x={1080} y={340} fontFamily="Inter" fontWeight={800} fontSize={36} fill="#5b6270" textAnchor="middle">bank transfers unavailable</text>
        <P t={t} x={1080} yf={FLOOR + 20} {...VICTOR} arms={["shrug", "shrug"]} expr="awkward" seed={140} />
        {[0, 1, 2, 3].map((i) => (
          <P key={i} t={t} x={[360, 600, 1560, 1800][i]} yf={FLOOR + 40} u={0.9} outfit={["tee", "cardigan", "hoodie", "coat"][i] as "tee"} color={["#3fae6a", "#c0703a", "#2fa3a0", "#ff7fb0"][i]}
            hair={["short", "bun", "curly", "long"][i] as "short"} facing={i < 2 ? 1 : -1} look={i < 2 ? 1 : -1} arms={i % 2 ? ["hips", "hips"] : ["cross", "cross"]} expr={i % 2 ? "angry" : "worried"} seed={150 + i} />
        ))}
      </View>
      <View c={cD} op={shot(t, E.graph - 0.3, 1e9, 0.35)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#16213f" />
        <Graph x={360} y={280} w={1440} h={640} p={ip(t, E.graph + 0.2, S.dur - 0.4, 0, 1, Easing.inOut(Easing.quad))} title="Cost of the outage" xlabel={["DAY 1", "DAY 20"]}
          lines={[{ col: "#e0463c", pts: [0.05, 0.18, 0.33, 0.5, 0.68, 0.86], label: "BILLIONS LOST" }]} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 8 · IT COMES BACK
export const online: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const isBack = t >= E.back;
  const notif = Math.round(ip(t, E.explode - 0.3, E.explode + 2.2, 0, 4127, Easing.in(Easing.quad)));
  const cA = cam(t, [[0, 1.1, 1000, 600], [E.back, 1.45, 700, 600]]);
  const cB = cam(t, [[E.back + 0.6, 1.15, 1080, 560], [E.hour - 0.3, 1.3, 1080, 500]]);
  const cC = cam(t, [[E.hour - 0.3, 1.3, 1080, 560], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.back + 0.6, 0.35)}>
        <BedRoom t={t} id="n-bed" expr={isBack ? "shock" : "open"} look={-0.8} clock={isBack ? "0:00" : "11:59"} night />
        {isBack ? <ellipse cx={435} cy={FLOOR - 275} rx={180} ry={90} fill="#9fd0ff" opacity={0.35 + 0.15 * Math.sin(t * 20)} /> : null}
        <Ring x={435} y={FLOOR - 275} t={t} t0={E.back} r={90} col="#9fd0ff" />
      </View>
      <View c={cB} op={shot(t, E.back + 0.6, E.hour - 0.3, 0.35)}>
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#1b2350" />
        <BigPhone x={1080} y={600} w={620} h={1080} tilt={Math.sin(t * 40) * 1.2}>
          <rect x={826} y={66} width={508} height={70} fill="#e9ecf3" />
          <text x={850} y={110} fontFamily="Inter" fontWeight={800} fontSize={30} fill="#5b6270">12:00</text>
          <text x={1310} y={110} fontFamily="Inter" fontWeight={800} fontSize={28} fill="#127a3e" textAnchor="end">5G ▮▮▮▮</text>
          {Array.from({ length: 7 }).map((_, i) => {
            const y = 190 + i * 118 + ((t * 600) % 118);
            const labels = ["💬 Mom (37)", "📧 Work email (212)", "📱 Group chat (999+)", "📰 News alert", "🛒 Your order is delayed", "❤️ 1,204 likes", "🔔 Reminder"];
            return y < 1000 ? (
              <g key={i}>
                <rect x={850} y={y} width={460} height={100} rx={18} fill="#ffffff" stroke="#d9dde6" strokeWidth={3} />
                <text x={872} y={y + 52} fontFamily="Inter, Noto Color Emoji" fontWeight={800} fontSize={30} fill="#16161c" dominantBaseline="central">{labels[(i + Math.floor(t * 5)) % labels.length]}</text>
              </g>
            ) : null;
          })}
        </BigPhone>
        <BigHead />
        <Chip x={1650} y={260} text={`🔔 ${notif.toLocaleString("en-US")}`} t={t} t0={E.explode - 0.3} bg="#e0263a" fg="#fff" size={56} />
      </View>
      <View c={cC} op={shot(t, E.hour - 0.3, 1e9, 0.35)}>
        <Apartments id="n-apt" t={t} party={0} />
        <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#0b1030" opacity={0.55} />
        {[[420, 0], [760, 1], [1260, 0], [1700, 2], [520, 2], [1440, 1], [1860, 0], [300, 1]].map(([x, r], i) => (
          <g key={i}>
            <ellipse cx={x} cy={180 + r * 330} rx={90} ry={70} fill="#9fd0ff" opacity={0.35} />
            <P t={t} x={x} yf={350 + r * 330} u={0.42} outfit={["tee", "dress", "hoodie", "coat", "suit", "tee", "cardigan", "hoodie"][i] as "tee"}
              color={["#e0463c", "#ff7fb0", "#f2c84b", "#2fa3a0", "#5b6270", "#8e5bd0", "#c0703a", "#3fae6a"][i]} hair={["short", "long", "curly", "bun", "slick", "cap", "bald", "short"][i] as "short"}
              arms={["down", "phone"]} hold="phone" lookY={0.9} expr="neutral" seed={20 + i} shadow={false} />
          </g>
        ))}
        <Chip x={1080} y={1150} text="📱 BACK ONLINE IN 1 HOUR: 94%" t={t} t0={E.hour + 0.5} bg="#16161c" fg="#8fd0ff" size={42} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 9 · THE NEXT MORNING
export const final: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const walkK = ip(t, E.leaves - 0.2, E.knock - 0.3, 0, 1, Easing.inOut(Easing.quad));
  const open = ip(t, E.knock + 1.2, E.knock + 1.8);
  const cA = cam(t, [[0, 1.05, 900, 620], [E.knock, 1.2, 1300, 600], [E.q - 0.3, 1.25, 1360, 580]]);
  const cB = cam(t, [[E.q - 0.3, 1.0, 1080, 620], [S.dur, 1.06, 1080, 610]]);
  const dark = ip(t, E.q + 0.5, E.final, 0, 0.55);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.q - 0.3, 0.4)}>
        <Room id="f-hall" wall="#e7d6bd" wall2="#d8c3a4" floor="#9a6b47" wains="#c9a27a" lightX={1100} />
        {[[520, "4A"], [1640, "4B"]].map(([x, n], i) => (
          <g key={i}>
            <rect x={(x as number) - 170} y={FLOOR - 560} width={340} height={560} fill="#f4efe6" stroke={INK} strokeWidth={8} />
            {i === 0 || open < 0.02 ? (
              <rect x={(x as number) - 150} y={FLOOR - 540} width={300} height={540} fill={i ? "#7a4f33" : "#3f6f8a"} stroke={INK} strokeWidth={6} />
            ) : (
              <g>
                <rect x={(x as number) - 150} y={FLOOR - 540} width={300} height={540} fill="#ffe7b8" />
                <path d={`M ${(x as number) + 150} ${FLOOR - 540} L ${(x as number) + 150 - 300 * (1 - open * 0.75)} ${FLOOR - 560} L ${(x as number) + 150 - 300 * (1 - open * 0.75)} ${FLOOR + 20} L ${(x as number) + 150} ${FLOOR} Z`}
                  fill="#7a4f33" stroke={INK} strokeWidth={6} />
              </g>
            )}
            <rect x={(x as number) - 50} y={FLOOR - 640} width={100} height={60} rx={10} fill="#fffdf6" stroke={INK} strokeWidth={5} />
            <text x={x as number} y={FLOOR - 610} fontFamily="Inter" fontWeight={900} fontSize={36} fill={INK} textAnchor="middle" dominantBaseline="central">{n}</text>
          </g>
        ))}
        {/* his phone stays behind, on the little table by his door */}
        <rect x={160} y={FLOOR - 330} width={180} height={20} rx={6} fill="#8a6446" stroke={INK} strokeWidth={4} />
        <rect x={200} y={FLOOR - 310} width={14} height={310} fill="#6b4b33" />
        <rect x={286} y={FLOOR - 310} width={14} height={310} fill="#6b4b33" />
        <rect x={210} y={FLOOR - 352} width={80} height={24} rx={6} fill="#1c1c26" stroke="#9a9aae" strokeWidth={3} />
        {t > E.leaves && t < E.knock ? <Emoji x={250} y={FLOOR - 410} size={60} e="📵" s={pop(t, E.leaves)} /> : null}
        {open > 0.6 ? (
          <P t={t} x={1700} yf={FLOOR + 10} u={0.95} {...ROSE} arms={["down", "wave"]} facing={-1} look={-1} expr="happy" seed={160} />
        ) : null}
        <P t={t} x={lerp(560, 1400, walkK)} yf={FLOOR + 30} {...ALEX} facing={1} look={1} walk={walkK > 0 && walkK < 1 ? t * 8 : null}
          arms={t > E.knock && t < E.knock + 1.2 ? ["down", "stop"] : open > 0.6 ? ["down", "wave"] : ["down", "down"]} expr={open > 0.6 ? "happy" : "neutral"} seed={1} />
        {[0, 1, 2].map((j) => <Ring key={j} x={1500} y={FLOOR - 330} t={t} t0={E.knock + 0.3 + j * 0.28} r={30} col="#ffffff" />)}
        <Bubble x={1640} y={520} lines={["Want some coffee?"]} t={t} t0={E.knock + 2.0} tail="right" size={42} />
      </View>
      <View c={cB} op={shot(t, E.q - 0.3, 1e9, 0.45)}>
        <defs><clipPath id="f-l"><rect x={-300} y={-300} width={1380} height={H + 600} /></clipPath><clipPath id="f-r"><rect x={1080} y={-300} width={1380} height={H + 600} /></clipPath></defs>
        <g clipPath="url(#f-l)">
          <rect x={-300} y={-300} width={1380} height={H + 600} fill="#1b2350" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <ellipse cx={240 + i * 300} cy={500} rx={80} ry={60} fill="#9fd0ff" opacity={0.3} />
              <P t={t} x={240 + i * 300} yf={FLOOR + 20} u={0.9} outfit={["tee", "coat", "hoodie"][i] as "tee"} color={["#e0463c", "#8e5bd0", "#3fae6a"][i]} hair={["short", "long", "curly"][i] as "short"}
                arms={["down", "phone"]} hold="phone" lookY={0.9} expr="neutral" seed={170 + i} />
            </g>
          ))}
        </g>
        <g clipPath="url(#f-r)">
          <Street id="f-st" t={t * 0.1} sky={["#ffd9a8", "#fff1dc"]} />
          <P t={t} x={1400} yf={FLOOR + 30} {...ALEX} facing={1} look={1} arms={["down", "wave"]} expr="laugh" seed={1} />
          <P t={t} x={1700} yf={FLOOR + 30} u={0.95} {...ROSE} facing={-1} look={-1} arms={["down", "talk"]} talk expr="happy" seed={160} />
          <Sparkles cx={1560} cy={420} t={t} n={6} r={260} />
        </g>
        <line x1={1080} y1={-300} x2={1080} y2={H + 300} stroke="#fff" strokeWidth={8} opacity={0.85} />
        <Chip x={540} y={160} text="ONLINE" t={t} t0={E.q} bg="#16161c" fg="#8fd0ff" size={42} />
        <Chip x={1620} y={160} text="OFFLINE" t={t} t0={E.q + 0.4} bg="#16161c" fg="#ffd38a" size={42} />
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#050712" opacity={dark} />
        {t >= E.final ? (
          <g transform={tf(1080, 600, pop(t, E.final, 0.5))}>
            <rect x={130} y={470} width={1900} height={260} rx={50} fill="#fffffb" stroke={INK} strokeWidth={10} />
            <text x={1080} y={602} fontFamily="Inter" fontWeight={900} fontSize={90} fill="#141419" textAnchor="middle" dominantBaseline="central">WOULD YOU SURVIVE 30 DAYS OFFLINE?</text>
          </g>
        ) : null}
      </View>
    </>
  );
};
