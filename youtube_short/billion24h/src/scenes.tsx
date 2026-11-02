import React from "react";
import { Easing } from "remotion";
import { INK, Person, headPos } from "./Person";
import { Bubble, Chip, EMOJI, Emoji, FLOOR, FONT, Hearts, SceneData, Stamp, WH, WW, cam, ip, pop, tf } from "./ui";

const BLUE = "#2860de";
const ME = { shirt: BLUE, hair: "quiff" as const, seed: 1 };
const MOM = { shirt: "#965cad", hair: "bun" as const, hairCol: "#5a3a2a", seed: 4, hood: false };
const FRIEND = { shirt: "#ec963c", hair: "cap" as const, seed: 8, hood: false };

const s0 = (S: SceneData, i: number) => S.lines[Math.min(i, S.lines.length - 1)].start;
const e0 = (S: SceneData, i: number) => S.lines[Math.min(i, S.lines.length - 1)].end;
type Out = { body: React.ReactNode; camera: [number, number, number] };
type P = { S: SceneData; t: number };

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
const Txt: React.FC<{ x: number; y: number; s: number; c?: string; w?: number; a?: "start" | "middle" | "end"; children: React.ReactNode }> = ({
  x, y, s, c = INK, w = 900, a = "middle", children,
}) => (
  <text x={x} y={y} fontFamily={`${FONT}, ${EMOJI}`} fontWeight={w} fontSize={s} fill={c} textAnchor={a} dominantBaseline="central">{children}</text>
);
const Tears: React.FC<{ hx: number; hy: number; t: number; u?: number }> = ({ hx, hy, t, u = 1 }) => (
  <g>
    {[-1, 1].map((s) => {
      const ph = (t * 0.9 + (s > 0 ? 0.5 : 0)) % 1;
      return <ellipse key={s} cx={hx + s * 34 * u} cy={hy + 20 * u + ph * 70 * u} rx={7 * u} ry={10 * u} fill="#96d2ff" opacity={1 - ph} />;
    })}
  </g>
);
/** White receipt / info card. */
const Card: React.FC<{ x: number; y: number; w: number; h: number; t: number; t0: number; children: React.ReactNode; dark?: boolean }> = ({
  x, y, w, h, t, t0, children, dark,
}) => {
  if (t < t0) return null;
  return (
    <g transform={tf(x, y, pop(t, t0))}>
      <rect x={x - w / 2 + 10} y={y - h / 2 + 14} width={w} height={h} rx={34} fill="rgba(0,0,0,0.3)" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={34} fill={dark ? "#1c1c24" : "#fffffc"} stroke={dark ? "#555" : INK} strokeWidth={5} />
      {children}
    </g>
  );
};
const Car: React.FC<{ x: number; y: number; s?: number; col: string }> = ({ x, y, s = 1, col }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -60 L 110 -130 L 340 -175 L 500 -150 L 680 -95 L 700 -35 L 0 -25 Z" fill={col} />
    <path d="M 210 -148 L 340 -172 L 465 -150 L 400 -122 L 235 -122 Z" fill="#26303f" />
    {[140, 560].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-28} r={56} fill="#141418" />
        <circle cx={wx} cy={-28} r={26} fill="#9a9aa6" />
      </g>
    ))}
  </g>
);

// 1. Midnight: the deposit + the rules -----------------------------------------------------------
export const Deposit = ({ S, t }: P): Out => {
  const dep = s0(S, 0) + 2.8;
  const rulesT = s0(S, 1);
  const span = e0(S, 1) - rulesT;
  const rules = ["Spend ALL of it in 24 hours", "Leftover money DISAPPEARS", "No giving it away"];
  const body = (
    <>
      <Grad id="night" top="#141a3c" bot="#20284e" />
      <rect width={WW} height={WH} fill="url(#night)" />
      <rect x={200} y={160} width={340} height={340} fill="#0c1230" stroke="#3a4270" strokeWidth={16} />
      <circle cx={430} cy={260} r={46} fill="#f6f0d0" />
      <Floor col="#232848" />
      <rect x={160} y={790} width={820} height={110} rx={26} fill="#3a4478" />
      <rect x={380} y={752} width={600} height={130} rx={34} fill="#2a3466" />
      <ellipse cx={300} cy={766} rx={110} ry={42} fill="#c8cce8" />
      <ellipse cx={720} cy={520} rx={150} ry={150} fill="#78beff" opacity={0.18 + 0.06 * Math.sin(t * 4)} />
      <Person {...ME} x={720} yf={FLOOR} sit t={t} arms={["down", "phone"]} phoneHand={1} look={0.4} lookY={0.6}
        expr={t < dep ? "tired" : t < rulesT ? "shock" : "nervous"} />
      <Card x={1520} y={300} w={820} h={230} t={t} t0={dep}>
        <rect x={1150} y={220} width={92} height={92} rx={22} fill="#1db954" />
        <Txt x={1196} y={266} s={56} c="#fff">$</Txt>
        <Txt x={1270} y={236} s={30} c="#888" w={800} a="start">BANK · now</Txt>
        <Txt x={1270} y={292} s={40} a="start">Deposit received</Txt>
        <Txt x={1520} y={370} s={62} c="#1b9e55">+$1,000,000,000.00</Txt>
      </Card>
      {t >= rulesT ? (
        <Card x={1520} y={720} w={820} h={330} t={t} t0={rulesT} dark>
          <Txt x={1520} y={600} s={40} c="#ffd25a">⚠️ THE RULES</Txt>
          {rules.map((r, i) => (t > rulesT + span * (0.12 + 0.27 * i) ? (
            <Txt key={i} x={1150} y={675 + i * 70} s={40} c="#fff" w={800} a="start">{`${i + 1}. ${r}`}</Txt>
          ) : null))}
        </Card>
      ) : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [rulesT, 1.04, 1120, 610], [S.dur, 1.1, 1200, 600]]) };
};

// 2. The math -----------------------------------------------------------------------------------
export const MathScene = ({ S, t }: P): Out => {
  const show = s0(S, 0) + 1.4;
  const secs = Math.max(0, t - show);
  const body = (
    <>
      <Grad id="green" top="#0e3a2a" bot="#0a2a1e" />
      <rect width={WW} height={WH} fill="url(#green)" />
      {Array.from({ length: 22 }).map((_, i) => {
        const ph = (t * 0.35 + i * 0.137) % 1;
        return <Emoji key={i} x={100 + ((i * 97) % 1960)} y={-80 + ph * 1400} size={70} e="💸" rot={Math.sin(t * 2 + i) * 20} />;
      })}
      <Person {...ME} x={1700} yf={FLOOR} t={t} expr="shock" look={-0.8} lookY={-0.6} arms={["head", "head"]} />
      {t > show ? (
        <g transform={tf(860, 400, pop(t, show))}>
          <rect x={340} y={270} width={1040} height={260} rx={40} fill="#fffffc" stroke={INK} strokeWidth={6} />
          <Txt x={860} y={370} s={110} c="#1b9e55">$11,574</Txt>
          <Txt x={860} y={470} s={50}>EVERY SECOND ⏱️</Txt>
        </g>
      ) : null}
      {t > show + 1 ? <Chip x={860} y={640} text={`spent so far: $${(Math.floor(secs) * 11574).toLocaleString("en-US")}`} t={t} t0={show + 1} size={40} /> : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.08, 1080, 600]]) };
};

// 3. Coffee: card frozen, 40 minutes on hold -------------------------------------------------------
export const Coffee = ({ S, t }: P): Out => {
  const decl = s0(S, 0) + 3.0;
  const hold = t >= s0(S, 1);
  const body = (
    <>
      <rect width={WW} height={WH} fill="#c98e62" />
      {Array.from({ length: 9 }).map((_, r) => Array.from({ length: 10 }).map((__, c) => (
        <rect key={`${r}-${c}`} x={c * 230 - (r % 2) * 115} y={r * 80} width={222} height={72} fill="none" stroke="#b67a52" strokeWidth={4} />
      )))}
      <rect x={1100} y={150} width={460} height={250} rx={14} fill="#28282c" />
      <Txt x={1330} y={215} s={40} c="#fff">LATTE ........ $6</Txt>
      <Txt x={1330} y={280} s={40} c="#fff">MOCHA ....... $7</Txt>
      <Txt x={1330} y={345} s={40} c="#fff">CROISSANT .. $5</Txt>
      <Floor col="#5e3e2c" />
      <Person x={1760} yf={FLOOR - 120} shirt="#2f6d4f" hair="messy" hood={false} t={t} seed={6} facing={-1} look={-1}
        expr={t > decl ? "nervous" : "happy"} />
      <rect x={1100} y={700} width={1060} height={340} fill="#7a5038" />
      <rect x={1080} y={680} width={1100} height={36} fill="#e8d8c4" />
      <rect x={1180} y={560} width={150} height={120} rx={14} fill="#2a2a30" />
      <rect x={1196} y={576} width={118} height={56} rx={6} fill={t > decl ? "#e0263a" : "#3ad07a"} />
      <Txt x={1255} y={604} s={22} c="#fff">{t > decl ? "DECLINED" : "TAP"}</Txt>
      <Person {...ME} x={800} yf={FLOOR} t={t} look={1} arms={hold ? ["down", "phone"] : ["down", "point"]} phoneHand={1}
        expr={hold ? "tired" : t > decl ? "shock" : "happy"} />
      {t > decl && !hold ? <Emoji x={1255} y={470} size={110} e="❌" scale={pop(t, decl)} /> : null}
      {hold ? (
        <>
          {Array.from({ length: 4 }).map((_, i) => {
            const ph = (t * 0.6 + i / 4) % 1;
            return <Emoji key={i} x={880 + ph * 160} y={420 - ph * 260} size={60} e="🎵" opacity={1 - ph} />;
          })}
          <Chip x={560} y={260} text="ON HOLD: 40 MIN" t={t} t0={s0(S, 1) + 0.2} size={46} />
          <Chip x={560} y={400} text="-$27,000,000 of time" t={t} t0={s0(S, 1) + 1.6} bg="#ffe0e4" fg="#c8102e" size={44} />
        </>
      ) : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.05, 1080, 620], [s0(S, 1), 1.12, 900, 600], [S.dur, 1.18, 860, 590]]) };
};

// 4. Every car at the dealership --------------------------------------------------------------------
const CAR_COLS = ["#e0263a", "#f2c200", "#2860de", "#1db954", "#ff7a1a", "#9b4dff", "#16161c", "#e8e8ee"];
export const Cars = ({ S, t }: P): Out => {
  const buy = e0(S, 0) - 1.0;
  const sold = t > buy;
  const body = (
    <>
      <Grad id="show" top="#e9eef4" bot="#cfd8e2" />
      <rect width={WW} height={WH} fill="url(#show)" />
      <rect x={0} y={120} width={WW} height={40} fill="#2a2a32" />
      <Txt x={1080} y={140} s={30} c="#fff">PREMIUM MOTORS · SUPERCARS · EXOTICS · PREMIUM MOTORS</Txt>
      <Floor col="#b8c0ca" y={700} />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 5 }).map((_, i) => (
          <g key={`${row}-${i}`} opacity={0.95}>
            <Car x={-60 + i * 460 + row * 120} y={560 + row * 170} s={0.55} col={CAR_COLS[(i + row * 3) % CAR_COLS.length]} />
            {sold ? <Txt x={130 + i * 460 + row * 120} y={470 + row * 170} s={34} c="#e0263a">SOLD</Txt> : null}
          </g>
        )),
      )}
      <Person {...ME} x={700} yf={FLOOR + 160} t={t} expr="smug" look={1} arms={["down", "point"]} phoneHand={1} />
      <Person x={1450} yf={FLOOR + 160} shirt="#30303c" hair="bald" hood={false} tie="#c83c3c" t={t} seed={5} facing={-1} look={-1}
        expr={t > s0(S, 1) ? "sad" : sold ? "shock" : "happy"} />
      {t > s0(S, 1) ? <Tears hx={1450} hy={FLOOR + 160 - 562} t={t} /> : null}
      <Card x={1080} y={300} w={760} h={250} t={t} t0={buy}>
        <Txt x={1080} y={240} s={40} c="#888">RECEIPT</Txt>
        <Txt x={1080} y={300} s={48}>23 CARS 🏎️</Txt>
        <Txt x={1080} y={370} s={60} c="#e0263a">-$41,000,000</Txt>
      </Card>
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [buy, 1.08, 1080, 640], [S.dur, 1.18, 1200, 680]]) };
};

// 5. Private jet ---------------------------------------------------------------------------------------
const Jet: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M 0 -60 Q 40 -120 160 -126 L 900 -126 Q 980 -120 1000 -80 L 1000 -40 Q 960 -10 880 -10 L 120 -10 Q 30 -14 0 -60 Z" fill="#f4f6fa" stroke="#9aa4b4" strokeWidth={5} />
    <path d="M 860 -126 L 960 -270 L 1010 -270 L 980 -120 Z" fill="#e8ecf2" stroke="#9aa4b4" strokeWidth={5} />
    <path d="M 420 -40 L 700 70 L 760 70 L 640 -40 Z" fill="#dfe4ec" stroke="#9aa4b4" strokeWidth={5} />
    {Array.from({ length: 7 }).map((_, i) => <ellipse key={i} cx={250 + i * 80} cy={-80} rx={20} ry={16} fill="#3a4a64" />)}
    <path d="M 40 -78 Q 80 -110 130 -110 L 130 -78 Z" fill="#3a4a64" />
    <rect x={200} y={-46} width={640} height={10} fill="#c8a040" />
  </g>
);
export const JetScene = ({ S, t }: P): Out => {
  const d = e0(S, 0) - s0(S, 0);
  const body = (
    <>
      <Grad id="sky" top="#7ab8ec" bot="#d8ecf8" />
      <rect width={WW} height={WH} fill="url(#sky)" />
      <rect x={0} y={760} width={WW} height={WH - 760} fill="#7a8290" />
      {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 260} y={950} width={150} height={16} fill="#f0f0f0" />)}
      <Jet x={220} y={820} />
      <Person {...ME} x={1420} yf={FLOOR + 30} t={t} arms={["down", "point"]} phoneHand={1} facing={1} look={1}
        expr={t > s0(S, 0) + d * 0.75 ? "tired" : "happy"} />
      <Person x={1800} yf={FLOOR + 30} shirt="#1d1d24" hair="slick" hood={false} glasses t={t} seed={7} facing={-1} look={-1}
        expr="smug" arms={["hips", "hips"]} />
      <Bubble x={1780} y={400} lines={["Prove it's real."]} t={t} t0={s0(S, 0) + d * 0.55} t1={s0(S, 0) + d * 0.8} tail="right" size={54} />
      <Bubble x={1780} y={400} lines={["...Again."]} t={t} t0={s0(S, 0) + d * 0.82} t1={S.dur} tail="right" size={60} />
      <Chip x={700} y={280} text="✈️ -$62,000,000" t={t} t0={s0(S, 0) + 2.6} bg="#fffffc" fg="#e0263a" size={56} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.1, 1180, 620]]) };
};

// 6. Mansion: closing takes 30 days ----------------------------------------------------------------
export const Mansion = ({ S, t }: P): Out => {
  const d = e0(S, 0) - s0(S, 0);
  const no = s0(S, 0) + d * 0.6;
  const body = (
    <>
      <Grad id="msky" top="#9ccff4" bot="#e8f4fb" />
      <rect width={WW} height={WH} fill="url(#msky)" />
      <rect x={0} y={820} width={WW} height={WH - 820} fill="#7cbc6c" />
      <rect x={300} y={360} width={1100} height={480} fill="#f6f2ea" />
      <polygon points="260,360 850,170 1440,360" fill="#5a4a46" />
      {[380, 560, 1140, 1320].map((x) => <rect key={x} x={x} y={430} width={110} height={140} fill="#9cc8e8" stroke="#fff" strokeWidth={8} />)}
      {[380, 560, 1140, 1320].map((x) => <rect key={x + 1} x={x} y={640} width={110} height={140} fill="#9cc8e8" stroke="#fff" strokeWidth={8} />)}
      {[720, 800, 900, 980].map((x) => <rect key={x} x={x} y={380} width={36} height={460} fill="#fffef8" stroke="#ddd" strokeWidth={3} />)}
      <rect x={810} y={640} width={130} height={200} fill="#6a4a3a" />
      <Floor col="#c8b89c" y={1000} />
      <Person {...ME} x={1580} yf={FLOOR + 40} t={t} look={-0.6} expr={t > no ? "shock" : "love"} arms={t > no ? ["head", "head"] : ["down", "down"]} />
      <Person x={1880} yf={FLOOR + 40} shirt="#c83c6a" hair="long" hood={false} t={t} seed={3} facing={-1} look={-1} expr="neutral"
        arms={["down", "phone"]} talk={t > no - 0.2 && t < e0(S, 0) - 0.6} />
      <Bubble x={1840} y={420} lines={["Closing takes", "30 days."]} t={t} t0={no - 0.2} t1={S.dur} tail="right" size={54} />
      <Stamp x={850} y={500} text="TOO SLOW" t={t} t0={e0(S, 0) - 0.8} size={110} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.08, 1140, 600]]) };
};

// 7. Art auction: a blue square -------------------------------------------------------------------
export const Art = ({ S, t }: P): Out => {
  const sold = e0(S, 0) - 0.6;
  const body = (
    <>
      <rect width={WW} height={WH} fill="#f3f1ec" />
      <Floor col="#b49a7a" />
      <rect x={760} y={170} width={640} height={500} fill="#c8a040" />
      <rect x={790} y={200} width={580} height={440} fill="#fcfcfa" />
      <rect x={930} y={300} width={300} height={240} fill="#2848c8" />
      <rect x={1060} y={720} width={60} height={30} fill="#888" />
      <Person x={1720} yf={FLOOR} shirt="#22222c" hair="bald" hood={false} tie="#c8a040" t={t} seed={9} facing={-1} look={-1}
        expr="happy" arms={["down", "wave"]} talk={t < sold} />
      <rect x={1560} y={760} width={300} height={280} fill="#5a3a2a" />
      <Person {...ME} x={440} yf={FLOOR} t={t} look={1} lookY={-0.5} arms={t > s0(S, 0) + 2 ? ["down", "wave"] : ["down", "down"]}
        expr={t > s0(S, 1) ? "nervous" : "neutral"} />
      {t > s0(S, 0) + 2 ? (
        <g>
          <rect x={505} y={380} width={90} height={90} rx={10} fill="#fffffc" stroke={INK} strokeWidth={4} />
          <Txt x={550} y={425} s={44}>7</Txt>
        </g>
      ) : null}
      <Stamp x={1080} y={760} text="SOLD! $85,000,000" t={t} t0={sold} size={78} rot={-6} />
      {t > s0(S, 1) ? <Emoji x={600} y={300} size={120} e="❓" scale={pop(t, s0(S, 1))} /> : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [s0(S, 0) + 1.5, 1.25, 1080, 440], [sold, 1.08, 1080, 600], [S.dur, 1.15, 900, 620]]) };
};

// 8. 6 PM panic: friend + mom advice -----------------------------------------------------------------
export const Panic = ({ S, t }: P): Out => {
  const d1 = e0(S, 1) - s0(S, 1);
  const pct = 18.8;
  const body = (
    <>
      <Grad id="living" top="#d68a5c" bot="#b46e4a" />
      <rect width={WW} height={WH} fill="url(#living)" />
      <Floor col="#6e4636" />
      <rect x={560} y={760} width={1040} height={180} rx={40} fill="#6e4840" />
      <rect x={520} y={640} width={1120} height={160} rx={50} fill="#7e544a" />
      <Person {...ME} x={1080} yf={FLOOR - 60} sit t={t} expr={t > s0(S, 1) ? "tired" : "nervous"} look={0} lookY={1} />
      <g>
        <rect x={580} y={170} width={1000} height={130} rx={30} fill="#fffffc" stroke={INK} strokeWidth={5} />
        <Txt x={640} y={235} s={44} a="start">SPENT</Txt>
        <rect x={800} y={205} width={640} height={60} rx={30} fill="#e6e6ea" />
        <rect x={800} y={205} width={640 * pct / 100 * ip(t, 0.3, 1.5)} height={60} rx={30} fill="#1db954" />
        <Txt x={1500} y={235} s={44} c="#e0263a">{`${(pct * ip(t, 0.3, 1.5)).toFixed(1)}%`}</Txt>
      </g>
      <Person {...FRIEND} x={300} yf={FLOOR} t={t} look={1} expr="laugh" arms={["down", "wave"]} talk={t > s0(S, 1) && t < s0(S, 1) + d1 * 0.5} />
      <Person {...MOM} x={1860} yf={FLOOR} t={t} facing={-1} look={-1} expr="smug" arms={["hips", "hips"]} talk={t > s0(S, 1) + d1 * 0.55} />
      <Bubble x={300} y={420} lines={["Solid gold", "gaming console! 🎮"]} t={t} t0={s0(S, 1) + 0.1} t1={S.dur} size={48} />
      <Bubble x={1860} y={420} lines={["Buy groceries."]} t={t} t0={s0(S, 1) + d1 * 0.62} t1={S.dur} tail="right" size={54} />
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.04, 1080, 620]]) };
};

// 9. 10 PM: medical debt ------------------------------------------------------------------------------
export const Debt = ({ S, t }: P): Out => {
  const body = (
    <>
      <rect width={WW} height={WH} fill="#12162a" />
      <Floor col="#1c2036" />
      <rect x={1020} y={700} width={700} height={30} fill="#3a2e28" />
      <rect x={1100} y={500} width={520} height={210} rx={14} fill="#2a2a30" />
      <rect x={1118} y={516} width={484} height={176} fill="#dfe8f6" />
      <ellipse cx={1360} cy={560} rx={500} ry={340} fill="#a8c8ff" opacity={0.1} />
      <Txt x={1360} y={560} s={30}>🏥 MEDICAL DEBT</Txt>
      <Txt x={1360} y={620} s={26} w={600}>millions of people</Txt>
      <Person {...ME} x={760} yf={FLOOR} sit t={t} look={1} lookY={0.3} expr={t > s0(S, 1) ? "shock" : "sad"} />
      {t < s0(S, 1) ? (
        <g>
          {Array.from({ length: 5 }).map((_, i) => {
            const ph = (t * 0.25 + i / 5) % 1;
            return <Emoji key={i} x={1500 + Math.sin(i * 2) * 250} y={300 - ph * 120} size={70} e="🧾" opacity={0.9 - ph * 0.6} />;
          })}
        </g>
      ) : (
        <Card x={1080} y={300} w={980} h={260} t={t} t0={s0(S, 1) + 0.6}>
          <Txt x={760} y={300} s={120} c="#1b9e55">$1</Txt>
          <Txt x={950} y={300} s={80}>➜</Txt>
          <Txt x={1300} y={265} s={52} c="#e0263a">erases ~$100</Txt>
          <Txt x={1300} y={335} s={40}>of medical debt</Txt>
        </Card>
      )}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [s0(S, 1), 1.1, 1180, 600], [S.dur, 1.1, 1080, 560]]) };
};

// 10. 11 PM: buy the debt --------------------------------------------------------------------------------
export const Buy = ({ S, t }: P): Out => {
  const go = e0(S, 0) - 1.2;
  const prog = ip(t, go, s0(S, 1) + 3.0, 0, 1, Easing.inOut(Easing.quad));
  const cols = 12;
  const rows = 4;
  const erased = t > s0(S, 1);
  const body = (
    <>
      <Grad id="buybg" top="#18223e" bot="#26345a" />
      <rect width={WW} height={WH} fill="url(#buybg)" />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const i = r * cols + c;
          const done = prog * rows * cols > i;
          const x = 230 + c * 145;
          const y = 160 + r * 160;
          return (
            <g key={i}>
              <rect x={x - 55} y={y - 65} width={110} height={130} rx={10} fill={done ? "#e4fbe9" : "#fffffc"} stroke={done ? "#1db954" : "#999"} strokeWidth={4} />
              {done ? <Txt x={x} y={y} s={60}>✅</Txt> : <Txt x={x} y={y - 10} s={22} c="#c8102e">PAST DUE</Txt>}
            </g>
          );
        }),
      )}
      <Person {...ME} x={1080} yf={FLOOR + 40} t={t} look={0} lookY={-0.6} expr={erased ? "happy" : "neutral"}
        arms={erased ? ["shrug", "shrug"] : ["down", "phone"]} phoneHand={1} />
      {erased ? <Tears hx={1080} hy={FLOOR + 40 - 562} t={t} /> : null}
      {erased ? (
        <Card x={1080} y={300} w={1200} h={220} t={t} t0={s0(S, 1) + 0.3}>
          <Txt x={1080} y={260} s={80} c="#1b9e55">$80,000,000,000</Txt>
          <Txt x={1080} y={340} s={50}>OF DEBT... GONE ❤️</Txt>
        </Card>
      ) : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [S.dur, 1.06, 1080, 600]]) };
};

// 11. 11:59: the pizza place + the final countdown ---------------------------------------------------
export const Final = ({ S, t }: P): Out => {
  const c0 = e0(S, 0) + 0.25;
  const n = 10 - Math.floor((t - c0) / 0.3);
  const done = t > c0 + 3.0;
  const body = (
    <>
      <Grad id="pnight" top="#141a36" bot="#2a2244" />
      <rect width={WW} height={WH} fill="url(#pnight)" />
      <rect x={260} y={260} width={1640} height={760} fill="#b8473a" />
      <rect x={260} y={260} width={1640} height={170} fill="#2a8a4a" />
      <Txt x={1080} y={345} s={110} c="#fff6d8">TONY'S PIZZA 🍕</Txt>
      <rect x={380} y={520} width={700} height={380} fill="#ffd98a" stroke="#6a2a22" strokeWidth={14} />
      <rect x={1240} y={520} width={300} height={500} fill="#6a2a22" />
      <Floor col="#3a3a48" />
      <Person {...ME} x={660} yf={FLOOR} t={t} look={1} arms={["down", "point"]} phoneHand={1} expr={done ? "laugh" : "nervous"} />
      <Person x={1660} yf={FLOOR} shirt="#f4f4f4" hair="bald" hood={false} t={t} seed={12} facing={-1} look={-1}
        expr={t > e0(S, 0) - 1.2 ? "shock" : "happy"} arms={t > e0(S, 0) - 1.2 ? ["head", "head"] : ["down", "down"]} />
      <Bubble x={1640} y={420} lines={["...Sure?"]} t={t} t0={e0(S, 0) - 0.9} t1={c0 + 1.5} tail="right" size={60} />
      {t >= c0 && n >= 1 && !done ? (
        <g transform={tf(1080, 640, 1 + 0.3 * (1 - ip(t - c0 - (10 - n) * 0.3, 0, 0.15)))}>
          <Txt x={1080} y={640} s={360} c="#ff4d5e">{String(n)}</Txt>
        </g>
      ) : null}
      {done ? <Stamp x={1080} y={640} text="BALANCE: $0.00" t={t} t0={c0 + 3.0} size={100} color="#1b9e55" rot={-5} /> : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [c0, 1.06, 1080, 620], [S.dur, 1.12, 1080, 620]]) };
};

// 12. Next morning: the letters + mom ------------------------------------------------------------------
export const Morning = ({ S, t }: P): Out => {
  const mom = s0(S, 1);
  const body = (
    <>
      <Grad id="morn" top="#ffd6a0" bot="#ffefd6" />
      <rect width={WW} height={WH} fill="url(#morn)" />
      <circle cx={1880} cy={200} r={110} fill="#fff4c8" />
      <rect x={0} y={860} width={WW} height={WH - 860} fill="#8cc878" />
      <rect x={160} y={300} width={760} height={560} fill="#f2e6d6" />
      <polygon points="120,300 540,110 960,300" fill="#a8564a" />
      <rect x={470} y={600} width={140} height={260} fill="#8a5a3a" />
      <rect x={1040} y={700} width={20} height={200} fill="#6a6a72" />
      <rect x={960} y={620} width={180} height={100} rx={40} fill="#3a6ad8" />
      {Array.from({ length: 9 }).map((_, i) => {
        const ph = ip(t, 0.6 + i * 0.12, 1.2 + i * 0.12, 0, 1, Easing.out(Easing.quad));
        return <Emoji key={i} x={1050 + (i - 4) * 70 * ph} y={640 + ph * (200 + (i % 3) * 60)} size={64} e="✉️" rot={(i - 4) * 12 * ph} />;
      })}
      <Person {...ME} x={1360} yf={FLOOR} t={t} look={-0.4} lookY={0.6} arms={["down", "phone"]} expr={t > mom ? "laugh" : "happy"} />
      {t < mom ? <Tears hx={1360} hy={FLOOR - 562} t={t} /> : null}
      {t > 1.6 && t < mom ? (
        <Card x={1500} y={300} w={760} h={220} t={t} t0={1.6}>
          <Txt x={1500} y={260} s={44} w={600}>"My debt is gone.</Txt>
          <Txt x={1500} y={330} s={44} w={600}>Thank you." ❤️</Txt>
        </Card>
      ) : null}
      {t > mom ? (
        <>
          <Person {...MOM} x={1800} yf={FLOOR} t={t} facing={-1} look={-1} expr="smug" arms={["hips", "hips"]} talk={t < e0(S, 1)} />
          <Bubble x={1800} y={420} lines={["So... did you", "buy groceries?"]} t={t} t0={mom + 0.4} t1={s0(S, 2) + 0.3} tail="right" size={52} />
        </>
      ) : null}
      {t > s0(S, 2) ? <Hearts cx={1560} cy={600} t={t} n={7} spread={160} rise={360} /> : null}
    </>
  );
  return { body, camera: cam(t, [[0, 1.0, 1080, 620], [mom, 1.08, 1300, 600], [S.dur, 1.14, 1360, 600]]) };
};

// 13. CTA ----------------------------------------------------------------------------------------------
export const Cta = ({ t }: P): Out => {
  const body = (
    <>
      <rect x={0} y={0} width={WW / 2} height={WH} fill="#1e2a4a" />
      <rect x={WW / 2} y={0} width={WW / 2} height={WH} fill="#ffb4c8" />
      <line x1={WW / 2} y1={0} x2={WW / 2} y2={WH} stroke="#fff" strokeWidth={8} />
      <Car x={60} y={1020} s={0.8} col="#f2c200" />
      <Person {...ME} x={820} yf={FLOOR} t={t} expr="smug" glasses arms={["hips", "hips"]} />
      <Person {...ME} x={1400} yf={FLOOR} t={t} expr="love" look={1} />
      <Person {...MOM} x={1700} yf={FLOOR} t={t} expr="happy" look={-1} facing={-1} />
      <Hearts cx={1550} cy={560} t={t} n={6} spread={120} rise={300} />
      {[[540, "CARS & JETS 🏎️"], [1620, "HELP PEOPLE ❤️"]].map(([x, lab], i) => (
        <g key={i}>
          <rect x={(x as number) - 300} y={70} width={600} height={130} rx={30} fill="#fffffc" />
          <Txt x={x as number} y={135} s={58}>{lab}</Txt>
        </g>
      ))}
    </>
  );
  return { body, camera: [1, 1080, 620] };
};

export const SCENES: Record<string, (p: P) => Out> = {
  deposit: Deposit, math: MathScene, coffee: Coffee, cars: Cars, jet: JetScene, mansion: Mansion, art: Art,
  panic: Panic, debt: Debt, buy: Buy, final: Final, morning: Morning, cta: Cta,
};
export { headPos };
