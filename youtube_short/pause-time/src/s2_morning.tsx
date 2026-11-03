import { Easing } from "remotion";
import { Bed, Frame, Panel, Room, Sofa, TVSet, Window } from "./env";
import { Apartments, NewsDesk } from "./env2";
import { ALEX, Chip, Hearts, P, Ring, Sparkles, View, W, H, cam, ip, pop, shot, tf } from "./kit";
import { INK, Stick } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ 2 · THE BEST MORNING EVER (as sent by the user)
// Alex refreshes his bank app (balance never changes) -> jumps out of bed and runs to the living room -> switches on
// the TV, a presenter announces the news -> people celebrate on balconies -> calling friends / dancing at home.
export const morning: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const nref = Math.min(5, t < E.refresh ? 0 : 1 + Math.floor((t - E.refresh) / 0.34));
  const jump = E.still + 0.55;
  const inBed = t < jump;
  const runK = ip(t, jump + 0.25, E.news - 0.25, 0, 1, Easing.in(Easing.quad));
  const cA = cam(t, [[0, 1.2, 1000, 580], [E.still, 1.35, 1100, 560], [E.news - 0.3, 1.1, 1300, 600]]);
  const walkK = ip(t, E.news - 0.3, E.tvon - 0.25, 0, 1, Easing.out(Easing.quad));
  const tvOn = t > E.tvon;
  const cB = cam(t, [[E.news - 0.3, 1.15, 700, 600], [E.tvon, 1.1, 1200, 600], [E.party - 0.3, 1.45, 1500, 460]]);
  const cC = cam(t, [[E.party - 0.3, 1.25, 1080, 560], [E.calls, 1.05, 1080, 620]]);
  const cD = cam(t, [[E.calls - 0.2, 1.08, 1080, 600], [S.dur, 1.0, 1080, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.news - 0.3, 0.3)}>
        <Room id="m-room" wall="#cfe0ec" wall2="#bcd3e3" floor="#b88b63" />
        <Window id="m-w" x={1320} y={150} w={560} h={400} sky={["#ffe2b8", "#fff6e3"]} t={t} kind="trees" curtain="#f4b9a4" />
        <Bed x={300} w={900} />
        {inBed ? (
          <P t={t} x={760} yf={FLOOR - 40} sit {...ALEX} arms={["down", "phone"]} hold="phone" lookY={0.6}
            expr={t < E.still ? "confused" : "laugh"} seed={1} bob={t > E.still ? Math.abs(Math.sin(t * 8)) * 12 : 0} />
        ) : (
          <P t={t} x={lerp(900, 2500, runK)} yf={FLOOR + 10} {...ALEX} walk={runK > 0 ? t * 14 : null} lean={runK > 0 ? 8 : 0} facing={1} look={1}
            arms={["cheer", "phoneUp"]} hold="phone" expr="laugh" seed={1} bob={Math.max(0, Math.sin(ip(t, jump, jump + 0.45, 0, Math.PI, Easing.linear))) * 160} />
        )}
        {nref > 0 && inBed ? <Chip x={1245} y={650} text={`↻ REFRESH ×${nref}`} t={t} t0={E.refresh} size={46} /> : null}
        {inBed ? (
          <g transform={tf(1240, 470, pop(t, 0.3))}>
            <rect x={1010} y={380} width={470} height={180} rx={30} fill="#fff" stroke={INK} strokeWidth={6} />
            <text x={1245} y={430} fontFamily="Inter" fontWeight={700} fontSize={32} fill="#6b6f7c" textAnchor="middle" dominantBaseline="central">NovaBank balance</text>
            <text x={1245} y={500} fontFamily="Inter" fontWeight={900} fontSize={50} fill="#127a3e" textAnchor="middle" dominantBaseline="central">$1,000,083.47</text>
          </g>
        ) : null}
        <Ring x={1245} y={470} t={t} t0={E.still} r={130} col="#127a3e" />
      </View>
      <View c={cB} op={shot(t, E.news - 0.3, E.party - 0.3, 0.3)}>
        <Room id="m-liv" wall="#e6c9a3" wall2="#d8b58a" floor="#8a6446" wains="#c99c6b" />
        <Frame x={420} y={200} w={260} h={200} art="#9bc29a" />
        <TVSet x={1180} y={180} w={760} h={440} id="m-tv" glow={tvOn ? "#9fd0ff" : "#e6c9a3"}>
          {tvOn ? (
            <g transform={`translate(1180 180) scale(${760 / W} ${440 / H})`}>
              <NewsDesk t={t} headline="BILLIONS BECOME MILLIONAIRES OVERNIGHT" />
              <Stick t={t} x={720} yf={1040} u={1.15} outfit="suit" color="#2c3a5c" accent="#c0182a" hair="slick" arms={["talk", "down"]} facing={1} look={0.3}
                talk={t < E.party} expr="shock" seed={8} shadow={false} />
              <rect x={300} y={720} width={1560} height={320} rx={20} fill="#0d1f40" stroke={INK} strokeWidth={8} />
              <text x={1080} y={880} fontFamily="Inter" fontWeight={900} fontSize={90} fill="#ffe36b" textAnchor="middle" dominantBaseline="central">+$1,000,000 FOR EVERYONE</text>
            </g>
          ) : (
            <rect x={1180} y={180} width={760} height={440} fill="#0c0c12" />
          )}
          {tvOn ? <rect x={1180} y={180} width={760} height={440} fill="#fff" opacity={1 - ip(t, E.tvon, E.tvon + 0.25)} /> : null}
        </TVSet>
        <Sofa x={200} w={760} />
        <P t={t} x={lerp(-200, 980, walkK)} yf={FLOOR + 20} {...ALEX} walk={walkK < 1 ? t * 13 : null} lean={walkK < 1 ? 7 : 0} facing={1} look={1} lookY={-0.4}
          expr={t > E.confirm ? "shock" : "happy"} hold={t > E.tvon - 0.4 && t < E.confirm + 0.4 ? "phone" : null}
          arms={t > E.confirm + 0.4 ? ["cheer", "cheer"] : t > E.tvon - 0.4 ? ["down", "point"] : ["down", "down"]} seed={1} />
        {t > E.tvon - 0.4 && t < E.tvon + 0.3 ? <Ring x={1560} y={400} t={t} t0={E.tvon} r={60} col="#9fd0ff" /> : null}
      </View>
      <View c={cC} op={shot(t, E.party - 0.3, E.calls - 0.2, 0.3)}>
        <Apartments id="m-apt" t={t} party={ip(t, E.party, E.party + 0.6)} />
        {[[420, 0], [760, 1], [1260, 0], [1700, 2], [520, 2], [1440, 1]].map(([x, r], i) => (
          <P key={i} t={t} x={x} yf={350 + r * 330} u={0.42} outfit={["tee", "dress", "hoodie", "coat", "suit", "tee"][i] as "tee"}
            color={["#e0463c", "#ff7fb0", "#f2c84b", "#2fa3a0", "#5b6270", "#8e5bd0"][i]} hair={["short", "long", "curly", "bun", "slick", "cap"][i] as "short"}
            arms={i % 3 === 1 ? ["cheer", "phoneUp"] : ["cheer", "cheer"]} hold={i % 3 === 1 ? "phone" : null} expr="laugh" bob={Math.abs(Math.sin(t * 7 + i)) * 20} seed={20 + i} shadow={false} />
        ))}
        <Chip x={1080} y={1150} text="🎉 THE WHOLE CITY IS CELEBRATING" t={t} t0={E.party + 0.5} bg="#16161c" fg="#ffe36b" size={44} />
      </View>
      <View c={cD} op={shot(t, E.calls - 0.2, 1e9, 0.3)}>
        <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="#253049" />
        <Panel x={80} y={110} w={980} h={900} id="m-p1" bg="#cfe0ec">
          <rect x={80} y={110} width={980} height={900} fill="#d7e4ee" />
          <rect x={80} y={860} width={980} height={150} fill="#b88b63" />
          <P t={t} x={330} yf={FLOOR - 50} u={0.95} outfit="cardigan" color="#8e5bd0" hair="bun" glasses arms={["down", "phone"]} hold="phone" expr="laugh" talk seed={4} />
          <P t={t} x={800} yf={FLOOR - 50} u={0.95} outfit="tee" color="#3fae6a" hair="curly" arms={["cheer", "phone"]} hold="phone" expr="laugh" talk seed={5} />
          <Chip x={570} y={240} text="📞 “DID YOU GET IT TOO?!”" t={t} t0={E.calls + 0.2} size={40} />
          <Hearts cx={570} cy={560} t={t} t0={E.calls + 0.4} n={5} />
        </Panel>
        <Panel x={1100} y={110} w={980} h={900} id="m-p2" bg="#f2d7a6">
          <rect x={1100} y={110} width={980} height={900} fill="#f6dcae" />
          <rect x={1100} y={860} width={980} height={150} fill="#9a6b47" />
          {[0, 1, 2].map((i) => (
            <P key={i} t={t} x={1300 + i * 290} yf={FLOOR - 50 - Math.abs(Math.sin(t * 6 + i * 1.3)) * 50} u={i === 1 ? 0.7 : 0.92}
              outfit={["dress", "tee", "hoodie"][i] as "dress"} color={["#ff7fb0", "#f2c84b", "#e0463c"][i]} hair={["long", "pigtails", "short"][i] as "long"}
              arms={Math.sin(t * 3 + i) > 0 ? ["cheer", "wave"] : ["wave", "cheer"]} expr="laugh" seed={30 + i} />
          ))}
          <Chip x={1590} y={240} text="💃 DANCING AT HOME" t={t} t0={E.calls + 0.5} size={40} />
          <Sparkles cx={1590} cy={520} t={t} n={10} r={360} />
        </Panel>
      </View>
    </>
  );
};
