import React from "react";
import { Easing } from "remotion";
import { Stick, StickProps, INK } from "./Stick";
import { BEROUD, GERI, GUARD, MODERN, OFFICIAL, PARISIAN, PERUGGIA, PERUGGIA_SMOCK, PICASSO, POGGI, POLICE, View, cam, ip, pop, shot, tf, H, W } from "./kit";
import { Calendar, Car, Desk, Envelope, Label, Office, Paper, Stamp, Thought, Locomotive } from "./sets";
import { Apartment, Crowd, EuropeMap, Florence, Gallery, Louvre, MonaLisa, Mood, ParisLouvre, Press, Rewind, Scribble, SuspectBoard, Telephone } from "./sets2";
import { SceneFn, wt } from "./types";

type Cast = Partial<StickProps>;
const Who: React.FC<{ c: Cast } & Partial<StickProps> & { x: number; yf: number; t: number }> = ({ c, ...p }) => <Stick {...(c as StickProps)} {...p} />;
const FLOOR = 1040;
const visitor = (i: number) => PARISIAN[i % PARISIAN.length] as unknown as Cast;

// ======================================================================== 1. THE IMPOSSIBLE THEFT
const hook: SceneFn = ({ S, t }) => {
  const stole = wt(S, 0, /^stole/), hid = wt(S, 2, /^hidden/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.1, aD = S.dur - 1.55;
  const gone = ip(t, stole, stole + 0.45);
  return (
    <g>
      <View c={cam(t, [[0, 2.2, 1080, 520], [aB, 2.9, 1080, 520]])} op={shot(t, 0, aB, 0.25)}>
        <Gallery t={t} mona={1 - gone} spot={gone} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.08, 1080, 600]])} op={shot(t, aB, aC, 0.25)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#3a3028" />
        <Paper x={260} y={140} w={900} h={1000} head="MONA LISA STOLEN!" sub="THE LOUVRE IS ROBBED" r={-6} art={(ax, ay, aw, ah) => <MonaLisa x={ax + aw * 0.22} y={ay + ah * 0.04} w={ah * 0.64} />} />
        <g transform={tf(1500, 640, pop(t, aB + 0.6, 0.4), 4)}><Paper x={1080} y={180} w={820} h={920} head="WHERE IS SHE?" sub="POLICE HAVE NO CLUE" r={5} art={(ax, ay, aw, ah) => <MonaLisa x={ax + aw * 0.22} y={ay + ah * 0.04} w={ah * 0.64} />} /></g>
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.18, 1180, 600]])} op={shot(t, aC, aD, 0.25)}>
        <Apartment t={t} door={1} night={1} />
        <Who c={POLICE[0]} x={250} yf={FLOOR} t={t} facing={1} expr="suspicious" arms={["down", "hold"]} hold="paper" seed={3} />
        <Who c={POLICE[1]} x={460} yf={FLOOR} t={t} facing={1} expr="neutral" seed={4} />
        <Who c={PERUGGIA} x={1220} yf={FLOOR} t={t} facing={-1} expr="neutral" look={t > hid ? 1 : -0.6} seed={1} />
        <Mood col="#3a4a8a" a={0.35} vig={0.65} />
      </View>
      {t >= aD && (
        <g>
          <rect x={0} y={0} width={W} height={H} fill="#0b0b0e" />
          <text x={1080} y={480} fontFamily="Inter" fontWeight={900} fontSize={70} fill="#c9a24a" textAnchor="middle" letterSpacing={10} opacity={ip(t, aD + 0.1, aD + 0.3)}>2 MINUTES OF HISTORY</text>
          <g transform={tf(1080, 680, pop(t, aD + 0.55, 0.4))}>
            <text x={1080} y={690} fontFamily="Inter" fontWeight={900} fontSize={130} fill="#fff" textAnchor="middle" dominantBaseline="central">WHO STOLE THE MONA LISA?</text>
          </g>
        </g>
      )}
    </g>
  );
};

// ======================================================================== 2. PARIS, AUGUST 1911
const paris: SceneFn = ({ S, t }) => {
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 640], [aB, 1.3, 1050, 960]])} op={shot(t, 0, aB, 0.3)}>
        <ParisLouvre t={t} id="paSky" />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.2, 1080, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Louvre t={t} />
        <Car x={ip(t, aB, aC + 0.4, -500, 2500, Easing.linear)} yb={1150} s={0.6} col="#2a3a2a" spin={t * 4} t={t} />
        {[0, 1, 2, 3].map((i) => <Stick key={i} {...(visitor(i) as StickProps)} x={((i * 520 + (t - aB) * (i % 2 ? 70 : -70)) % 2400 + 2400) % 2400 - 100} yf={1180} u={0.55} t={t} walk={t * 5 + i} facing={i % 2 ? 1 : -1} seed={i} />)}
      </View>
      <View c={cam(t, [[aC, 1.1, 700, 620], [S.dur, 1.45, 1080, 520]])} op={shot(t, aC, 1e9, 0.3)}>
        <Gallery t={t} />
        {[0, 1, 2, 3].map((i) => <Stick key={i} {...(visitor(i) as StickProps)} x={[560, 820, 1360, 1620][i]} yf={FLOOR} u={0.85} t={t} facing={i < 2 ? 1 : -1} expr={i % 2 ? "happy" : "warm"} lookY={-0.6} look={i < 2 ? 0.5 : -0.5} seed={i + 2} />)}
        <Mood col="#5a3a2a" a={ip(t, S.L[3], S.dur, 0, 0.25)} vig={0.5} />
      </View>
    </g>
  );
};

// ======================================================================== 3. THE MAN NOBODY SUSPECTED
const worker: SceneFn = ({ S, t }) => {
  const nm = wt(S, 0, /^Vincenzo/), aug = wt(S, 2, /^August/), van = wt(S, 2, /^vanished/);
  const aB = S.L[1] - 0.5, aC = aug - 0.2, aD = aug + 1.3;
  const gone = ip(t, van - 0.1, van + 0.4);
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 900, 620], [aB, 1.15, 1300, 600]])} op={shot(t, 0, aB, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#86b6e0" />
        <ParisLouvre t={t} id="wkSky" />
        <rect x={-400} y={1000} width={W + 800} height={400} fill="#9c9486" />
        <Who c={PERUGGIA} x={ip(t, 0, aB, 400, 1500, Easing.linear)} yf={1120} t={t} facing={1} walk={t * 5} expr="neutral" seed={1} />
      </View>
      <Label x={1080} y={150} text="VINCENZO PERUGGIA" t={t} t0={nm} t1={aB - 0.2} size={64} />
      <View c={cam(t, [[aB, 1.05, 1080, 620], [aC, 1.15, 980, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Gallery t={t} />
        <Who c={PERUGGIA_SMOCK} x={ip(t, aB, aC, 500, 900)} yf={FLOOR} t={t} facing={1} walk={t < aC - 1 ? t * 5 : null} expr="neutral" arms={["hold", "hold"]} hold="box" seed={1} />
        <Who c={PERUGGIA_SMOCK} x={ip(t, aB, aC, 1900, 1400, Easing.linear)} yf={FLOOR} u={0.85} t={t} facing={-1} walk={t * 5} hair="bald" seed={5} />
        <Who c={GUARD} x={1700} yf={FLOOR} u={0.85} t={t} facing={-1} expr="neutral" seed={6} />
        <Mood col="#d8b070" a={0.25} vig={0.5} />
        <Rewind t={t} k={ip(t, aB, aB + 0.2) * (1 - ip(t, aB + 0.6, aB + 1.0))} />
      </View>
      <Label x={1080} y={150} text="EARLIER: HE WORKED HERE" t={t} t0={aB + 0.7} t1={aC - 0.2} size={56} bg="#7a4a26" />
      <View c={[1.0, 1080, 620]} op={shot(t, aC, aD, 0.25)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c9a2" />
        <Calendar x={1080} y={640} t={t} t0={aC} flips={4} final="21" s={1.25} />
        <text x={1080} y={250} fontFamily="Inter" fontWeight={900} fontSize={70} fill={INK} textAnchor="middle">AUGUST 1911</text>
      </View>
      <View c={cam(t, [[aD, 2.6, 1080, 520], [S.dur, 1.25, 1080, 560]])} op={shot(t, aD, 1e9, 0.25)}>
        <Gallery t={t} mona={1 - gone} spot={gone} beams={0.6} />
        <Mood col="#2a2a4a" a={0.3 * gone} vig={0.6} />
      </View>
    </g>
  );
};

// ======================================================================== 4. THE MISSING MASTERPIECE
const beroud: SceneFn = ({ S, t }) => {
  const nm = wt(S, 0, /^Louis/), moved = wt(S, 3, /^moved/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2, aD = S.L[3] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.05, 900, 620], [aB, 1.15, 1100, 600]])} op={shot(t, 0, aB, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Who c={BEROUD} x={ip(t, 0, aB, 300, 820, Easing.linear)} yf={FLOOR} t={t} facing={1} walk={t * 5} expr="happy" arms={["down", "hold"]} hold="paper" seed={2} />
      </View>
      <Label x={1080} y={150} text="LOUIS BÉROUD · PAINTER" t={t} t0={nm} t1={aB - 0.2} size={58} />
      <View c={cam(t, [[aB, 1.3, 760, 640], [aC, 1.5, 1080, 560]])} op={shot(t, aB, aC, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Who c={BEROUD} x={520} yf={1180} u={1.3} t={t} facing={1} look={0.7} lookY={-0.4} expr="neutral" arms={["down", "hold"]} hold="paper" seed={2} />
      </View>
      <View c={cam(t, [[aC, 1.2, 1000, 600], [aD, 1.8, 760, 470]])} op={shot(t, aC, aD, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Who c={BEROUD} x={760} yf={FLOOR} t={t} facing={1} look={0.6} expr={t < aC + 0.5 ? "neutral" : "confused"} arms={["down", "chin"]} seed={2} />
        <Mood col="#2a2a4a" a={0.18} vig={0.55} />
      </View>
      <View c={cam(t, [[aD, 1.15, 1080, 600], [S.dur, 1.28, 1080, 580]])} op={shot(t, aD, 1e9, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Who c={BEROUD} x={760} yf={FLOOR} t={t} facing={1} look={0.5} expr={t < moved + 0.4 ? "confused" : "worried"} arms={["down", "talk"]} talk={t > aD + 0.3 && t < aD + 1.4} seed={2} />
        <Who c={GUARD} x={ip(t, aD, aD + 1.2, 1800, 1400)} yf={FLOOR} t={t} facing={-1} walk={t < aD + 1.2 ? t * 5 : null} expr={t < moved + 0.4 ? "thinking" : "worried"} arms={["down", "point"]} seed={6} />
        <Thought x={1080} y={260} w={640} h={340} t={t} t0={moved - 0.4} tail={[1300, 520]}>
          <rect x={760} y={90} width={640} height={340} fill="#f4efe2" />
          <MonaLisa x={850} y={120} w={170} />
          <path d="M 1060 260 L 1260 260" stroke="#b02a2e" strokeWidth={16} strokeLinecap="round" />
          <polygon points="1290,260 1240,230 1240,290" fill="#b02a2e" />
          <text x={1330} y={275} fontFamily="Inter" fontWeight={900} fontSize={56} fill={INK}>?</text>
        </Thought>
      </View>
    </g>
  );
};

// ======================================================================== 5. FRANCE IS SHOCKED
const shock: SceneFn = ({ S, t }) => {
  const aB = 3.2, aC = S.L[1] - 0.2, aD = S.L[2] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.1, 1080, 600], [aB, 1.3, 1080, 560]])} op={shot(t, 0, aB, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Who c={OFFICIAL} x={760} yf={FLOOR} t={t} facing={1} expr="shock" look={0.4} arms={["down", "chin"]} seed={7} />
        <Who c={{ ...OFFICIAL, glasses: false, mustache: true, hat: "fedora", hatColor: "#3a3a3a" }} x={1440} yf={FLOOR} t={t} facing={-1} expr="shock" look={-0.4} arms={["shrug", "shrug"]} seed={8} />
        <Who c={GUARD} x={1780} yf={FLOOR} u={0.9} t={t} facing={-1} expr="worried" seed={6} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1080, 620], [aC, 1.1, 1180, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Press t={t} />
      </View>
      <Stamp x={1080} y={260} text="MONA LISA MISSING!" t={t} t0={aB + 0.6} t1={aD - 0.2} size={110} rot={-6} />
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.05, 1080, 640]])} op={shot(t, aC, aD, 0.3)}>
        <EuropeMap t={t} news={ip(t, aC + 0.2, aD - 0.3, 0, 1, Easing.linear)} />
      </View>
      <View c={cam(t, [[aD, 1.0, 1080, 640], [S.dur, 1.12, 1080, 600]])} op={shot(t, aD, 1e9, 0.3)}>
        <Gallery t={t} mona={0} spot={1} />
        <Crowd t={t} y={FLOOR} n={7} x0={200} x1={1960} Person={({ x, i }) => (
          <Stick {...(visitor(i) as StickProps)} x={x} yf={FLOOR + (i % 2) * 60} u={0.8 + (i % 2) * 0.1} t={t} facing={x < 1080 ? 1 : -1} expr={i % 3 ? "shock" : "sad"} lookY={-0.6} hold={i % 3 === 0 ? "newspaper" : null} arms={i % 3 === 0 ? ["down", "hold"] : ["down", "down"]} seed={i} />
        )} />
        <Mood col="#2a2a4a" a={0.2} vig={0.6} />
      </View>
    </g>
  );
};

// ======================================================================== 6. THE POLICE HAVE NO ANSWERS
const police: SceneFn = ({ S, t }) => {
  const pic = wt(S, 1, /^Pablo/);
  const aB = S.L[1] - 0.2, aC = S.L[2] - 0.2, aD = S.L[3] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.18, 1200, 520]])} op={shot(t, 0, aB, 0.3)}>
        <Office t={t} />
        <SuspectBoard x={900} y={160} k={ip(t, 0.6, aB - 0.4, 0, 1, Easing.linear)} t={t} />
        <Who c={POLICE[0]} x={560} yf={FLOOR} t={t} facing={1} expr="thinking" look={0.7} arms={["down", "chin"]} seed={3} />
        <Who c={POLICE[1]} x={1500} yf={1120} u={0.95} t={t} facing={-1} expr="suspicious" arms={["down", "point"]} seed={4} />
        <Mood col="#c9a070" a={0.18} vig={0.55} />
      </View>
      <View c={cam(t, [[aB, 1.15, 1080, 600], [aC, 1.3, 1080, 560]])} op={shot(t, aB, aC, 0.3)}>
        <Office t={t} />
        <Who c={PICASSO} x={1300} yf={FLOOR} t={t} facing={-1} expr="awkward" arms={["shrug", "down"]} talk={t > aB + 0.4 && t < aB + 1.6} seed={9} />
        <Who c={POLICE[0]} x={760} yf={FLOOR} t={t} facing={1} expr="suspicious" arms={["down", "hold"]} hold="paper" talk={t > aB + 1.6 && t < aB + 2.6} seed={3} />
        <Desk y={900} lamp={false} />
      </View>
      <Label x={1080} y={150} text="PABLO PICASSO" t={t} t0={pic} t1={aC - 0.2} size={62} />
      <Label x={1080} y={290} text="QUESTIONED — NOT THE THIEF" t={t} t0={pic + 0.7} t1={aC - 0.2} size={50} bg="#2f7d3c" />
      <View c={[1.0, 1080, 620]} op={shot(t, aC, aD, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c9a2" />
        <Calendar x={1080} y={660} t={t} t0={aC + 0.1} flips={10} s={1.2} />
        <text x={1080} y={250} fontFamily="Inter" fontWeight={900} fontSize={70} fill={INK} textAnchor="middle">WEEKS PASS…</text>
      </View>
      <View c={cam(t, [[aD, 1.4, 1080, 560], [S.dur, 2.0, 1080, 500]])} op={shot(t, aD, 1e9, 0.3)}>
        <Gallery t={t} mona={0} spot={1} beams={0.4} />
        <Mood col="#1a1a3a" a={0.35} vig={0.7} />
      </View>
    </g>
  );
};

// ======================================================================== 7. THE BIGGEST CLUE WAS MISSED
const missed: SceneFn = ({ S, t }) => {
  const acc = wt(S, 1, /^accepted/);
  const aB = S.L[1] - 0.3, aC = acc + 0.4, aD = S.L[2] - 0.3;
  const doorK = t < aC ? 1 : 1 - ip(t, aC + 1.0, aC + 1.6);
  return (
    <g>
      <View c={cam(t, [[0, 1.15, 1080, 600], [aB, 1.3, 1080, 580]])} op={shot(t, 0, aB, 0.3)}>
        <Apartment t={t} door={0} night={0.2} season={2} />
        <Who c={PERUGGIA} x={1040} yf={FLOOR} t={t} facing={1} expr="neutral" look={0.2} seed={1} />
        <Mood col="#4a5a7a" a={0.25} vig={0.6} />
      </View>
      <View c={cam(t, [[aB, 1.0, 1000, 620], [aC, 1.15, 900, 600]])} op={shot(t, aB, aC, 0.3)}>
        <Apartment t={t} door={1} night={0.2} season={2} />
        <Who c={POLICE[0]} x={320} yf={FLOOR} t={t} facing={1} expr="suspicious" arms={["down", "hold"]} hold="paper" talk={t < aB + 1.6} seed={3} />
        <Who c={POLICE[1]} x={560} yf={FLOOR} t={t} facing={1} expr="neutral" seed={4} />
        <Who c={PERUGGIA} x={1180} yf={FLOOR} t={t} facing={-1} expr="neutral" arms={["down", "talk"]} talk={t > aB + 1.6 && t < acc} seed={1} />
        <Mood col="#4a5a7a" a={0.25} vig={0.6} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1000, 620], [aD, 1.1, 1000, 600]])} op={shot(t, aC, aD, 0.3)}>
        <Apartment t={t} door={doorK} night={0.2} season={2} />
        {t < aC + 1.2 && <Who c={POLICE[0]} x={ip(t, aC, aC + 1.0, 320, 160)} yf={FLOOR} t={t} facing={-1} walk={t * 5} seed={3} />}
        <Who c={PERUGGIA} x={1180} yf={FLOOR} t={t} facing={-1} expr="neutral" look={t > aC + 1.8 ? 1 : -0.6} seed={1} />
        <Mood col="#3a4a7a" a={0.3} vig={0.65} />
      </View>
      <View c={cam(t, [[aD, 1.0, 1200, 620], [S.dur, 2.1, 1900, 760]])} op={shot(t, aD, 1e9, 0.3)}>
        <Apartment t={t} door={0} night={0.2} season={2} glowK={ip(t, aD + 1.5, S.dur - 0.5)} />
        <Who c={PERUGGIA} x={1180} yf={FLOOR} t={t} facing={1} expr="neutral" look={1} seed={1} />
        <Mood col="#2a3a6a" a={0.35} vig={0.7} />
      </View>
    </g>
  );
};

// ======================================================================== 8. TWO YEARS PASS
const years: SceneFn = ({ S, t }) => {
  const aB = S.L[1] + 0.6, aC = S.L[2] + 1.2, aD = S.L[3] - 0.2;
  return (
    <g>
      <View c={[1.0, 1080, 620]} op={shot(t, 0, aB, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c9a2" />
        <Calendar x={1080} y={640} t={t} t0={0.3} flips={12} final="1913" s={1.25} />
        <text x={1080} y={230} fontFamily="Inter" fontWeight={900} fontSize={66} fill={INK} textAnchor="middle">{t < 1.2 ? "1911" : t < 2.2 ? "1912" : "1913"}</text>
      </View>
      <View c={cam(t, [[aB, 1.1, 1200, 600], [aC, 1.25, 1300, 560]])} op={shot(t, aB, aC, 0.3)}>
        <Apartment t={t} door={0} night={0} season={(t - aB) * 1.6} />
        <Who c={PERUGGIA} x={1040} yf={FLOOR} t={t} facing={1} expr="sad" lookY={0.6} seed={1} />
        <Label x={1610} y={130} text={["SUMMER", "WINTER", "SPRING", "AUTUMN"][Math.floor((t - aB) * 1.6) % 4]} t={t} t0={aB} size={46} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [aD, 1.1, 1080, 600]])} op={shot(t, aC, aD, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#6a4426" />
        <rect x={220} y={140} width={1100} height={960} fill="#f6efd8" stroke={INK} strokeWidth={6} transform="rotate(-3 770 620)" />
        <Scribble x={300} y={300} w={900} lines={9} k={ip(t, aC + 0.2, aD - 0.4, 0, 1, Easing.linear)} />
        <g transform={tf(1640, 700, pop(t, aC + 1.6, 0.4), 6)}><Envelope x={1640} y={700} s={1.6} r={6} /><text x={1640} y={740} fontFamily="Inter" fontWeight={900} fontSize={44} fill={INK} textAnchor="middle" transform="rotate(6 1640 740)">FLORENCE</text></g>
      </View>
      <View c={cam(t, [[aD, 1.05, 940, 700], [S.dur, 1.3, 980, 780]])} op={shot(t, aD, 1e9, 0.3)}>
        <EuropeMap t={t} route={ip(t, aD + 0.2, S.dur - 0.4, 0, 1, Easing.inOut(Easing.quad))} />
      </View>
    </g>
  );
};

// ======================================================================== 9. THE MEETING THAT ENDED IT ALL
const meeting: SceneFn = ({ S, t }) => {
  const nm = wt(S, 0, /^Alfredo/), uf = wt(S, 0, /^Uffizi/);
  const a0 = 2.2, aB = S.L[1] - 0.2, aC = S.L[2] - 0.2, aD = S.L[3] - 0.2;
  const reveal = ip(t, aB + 0.8, aB + 2.6);
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [a0, 1.12, 1080, 580]])} op={shot(t, 0, a0, 0.3)}>
        <Florence t={t} />
      </View>
      <View c={cam(t, [[a0, 1.2, 1080, 600], [aB, 1.45, 1080, 520]])} op={shot(t, a0, aB, 0.3)}>
        <Office t={t} florence />
        <Who c={GERI} x={1080} yf={FLOOR} t={t} facing={1} expr={t > uf - 0.6 ? "shock" : "thinking"} arms={["down", "hold"]} hold="paper" seed={2} />
        <Desk />
        <Mood col="#d8a870" a={0.18} vig={0.5} />
      </View>
      <Label x={1080} y={150} text="ALFREDO GERI · ART DEALER" t={t} t0={nm} t1={aB - 0.2} size={56} />
      <View c={cam(t, [[aB, 1.1, 1080, 600], [aC, 1.35, 1080, 560]])} op={shot(t, aB, aC, 0.3)}>
        <Office t={t} florence />
        <Who c={GERI} x={620} yf={FLOOR} t={t} facing={1} expr={reveal > 0.9 ? "shock" : "thinking"} look={0.6} seed={2} />
        <Who c={POGGI} x={1560} yf={FLOOR} t={t} facing={-1} expr={reveal > 0.9 ? "shock" : "thinking"} look={-0.6} arms={["down", "chin"]} seed={8} />
        <MonaLisa x={950} y={360} w={260} frame={false} glow={reveal} />
        <rect x={930} y={340 - reveal * 420} width={300} height={420} fill="#cfc5ae" stroke={INK} strokeWidth={6} opacity={1 - ip(t, aB + 2.4, aB + 2.8)} />
        <rect x={880} y={740} width={400} height={30} fill="#7a4a26" stroke={INK} strokeWidth={5} />
        <Mood col="#d8a870" a={0.15} vig={0.5} />
      </View>
      <Label x={1080} y={150} text="UFFIZI GALLERY · FLORENCE" t={t} t0={aB + 0.3} t1={aC - 0.2} size={54} />
      <View c={cam(t, [[aC, 1.3, 980, 560], [aD, 1.45, 980, 520]])} op={shot(t, aC, aD, 0.3)}>
        <Office t={t} florence />
        <Who c={GERI} x={900} yf={FLOOR} t={t} facing={1} expr="worried" arms={["down", "chin"]} talk seed={2} />
        <Telephone x={1180} y={860} s={1.1} lift={1} />
        <Desk />
      </View>
      <View c={cam(t, [[aD, 1.0, 1080, 620], [S.dur, 1.12, 1080, 600]])} op={shot(t, aD, 1e9, 0.3)}>
        <Florence t={t} />
        <Who c={POLICE[0]} x={760} yf={1100} t={t} facing={1} expr="neutral" arms={["down", "give"]} seed={3} />
        <Who c={PERUGGIA} x={1080} yf={1100} t={t} facing={1} expr="sad" lookY={0.8} seed={1} />
        <Who c={POLICE[1]} x={1400} yf={1100} t={t} facing={-1} expr="neutral" arms={["down", "give"]} seed={4} />
      </View>
    </g>
  );
};

// ======================================================================== 10. THE PAINTING RETURNS
const returns: SceneFn = ({ S, t }) => {
  const aB = S.L[1] - 0.2, aB2 = S.L[1] + 2.2, aC = S.L[2] - 0.2;
  return (
    <g>
      <View c={cam(t, [[0, 1.2, 1080, 560], [aB, 1.0, 1080, 620]])} op={shot(t, 0, aB, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#3f5a4a" />
        <rect x={-400} y={904} width={W + 800} height={500} fill="#e9e2d2" />
        <MonaLisa x={950} y={300} w={260} glow={0.6} />
        {[0, 1, 2, 3, 4].map((i) => <Stick key={i} {...(visitor(i) as StickProps)} x={[420, 700, 1460, 1720, 1940][i]} yf={FLOOR + (i % 2) * 40} u={0.8} t={t} facing={i < 2 ? 1 : -1} expr="happy" lookY={-0.6} seed={i} />)}
      </View>
      <Label x={1080} y={150} text="ON DISPLAY IN ITALY" t={t} t0={0.5} t1={aB - 0.2} size={56} bg="#2f6a3a" />
      <View c={[1.0, 1080, 620]} op={shot(t, aB, aB2, 0.25)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#d9c9a2" />
        <Calendar x={1080} y={660} t={t} t0={aB} flips={4} final="1914" s={1.2} />
        <text x={1080} y={250} fontFamily="Inter" fontWeight={900} fontSize={70} fill={INK} textAnchor="middle">JANUARY</text>
      </View>
      <View c={cam(t, [[aB2, 1.0, 1080, 620], [aC, 1.08, 1080, 600]])} op={shot(t, aB2, aC, 0.3)}>
        <Louvre t={t} />
        <Locomotive x={ip(t, aB2, aC, -800, 900, Easing.out(Easing.quad))} yb={1180} t={t} s={0.45} carriages={1} />
      </View>
      <View c={cam(t, [[aC, 1.0, 1080, 620], [S.dur, 1.3, 1080, 560]])} op={shot(t, aC, 1e9, 0.3)}>
        <Gallery t={t} mona={1} />
        <Crowd t={t} y={FLOOR} n={9} x0={120} x1={2040} Person={({ x, i }) => (
          <Stick {...(visitor(i) as StickProps)} x={x} yf={FLOOR + (i % 3) * 50} u={0.75 + (i % 3) * 0.08} t={t} facing={x < 1080 ? 1 : -1} expr={i % 2 ? "happy" : "warm"} lookY={-0.7} seed={i} />
        )} />
        {Array.from({ length: 8 }).map((_, i) => { const ph = ((t - aC) * 0.5 + i / 8) % 1; return <g key={i} transform={`translate(${200 + i * 240} ${900 - ph * 700}) rotate(${ph * 90 - 45})`} opacity={1 - ph}><rect x={-70} y={-50} width={140} height={100} fill="#f2ecd9" stroke={INK} strokeWidth={4} /><rect x={-56} y={-36} width={112} height={16} fill="#2a2a2a" /></g>; })}
      </View>
    </g>
  );
};

// ======================================================================== 11. THE FINAL REVEAL
const ModernRoom: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#3c4a6a" />
    <rect x={-400} y={904} width={W + 800} height={500} fill="#a9a496" />
    <rect x={860} y={240} width={440} height={560} rx={10} fill="#2a3450" stroke="#9aa6c0" strokeWidth={6} />
    <MonaLisa x={950} y={300} w={260} />
    <rect x={880} y={260} width={400} height={520} fill="#cfe4ff" opacity={0.12} />
    <rect x={600} y={880} width={960} height={20} fill="#2a2a2a" />
    <Crowd t={t} y={FLOOR} n={8} x0={150} x1={2010} Person={({ x, i }) => (
      <Stick {...(MODERN[i % MODERN.length] as unknown as StickProps)} x={x} yf={FLOOR + 110 + (i % 2) * 50} u={0.8} t={t} facing={x < 1080 ? 1 : -1} expr="happy" lookY={-0.7} arms={i % 2 ? ["down", "phoneUp"] : ["down", "down"]} hold={i % 2 ? "phone" : null} seed={i} />
    )} />
  </g>
);
const final: SceneFn = ({ S, t }) => {
  const aB = S.L[1] - 0.2, q = S.L[2] - 0.1;
  const dark = ip(t, q - 0.6, q + 0.4, 0, 0.55);
  return (
    <g>
      <View c={cam(t, [[0, 1.0, 1080, 620], [aB, 1.2, 1080, 560]])} op={shot(t, 0, aB, 0.3)}>
        <ModernRoom t={t} />
      </View>
      <View c={[1.0, 1080, 620]} op={shot(t, aB, 1e9, 0.3)}>
        <rect x={-400} y={-200} width={W + 800} height={H + 400} fill="#111" />
        <svg x={0} y={0} width={1070} height={H} viewBox="0 0 2160 1240" preserveAspectRatio="xMidYMid slice">
          <Apartment t={t} door={0} night={0.2} season={2} />
          <Who c={PERUGGIA} x={1080} yf={1100} u={1.2} t={t} facing={1} expr="neutral" seed={1} />
          <Mood col="#4a5a7a" a={0.3} vig={0.6} />
        </svg>
        <svg x={1090} y={0} width={1070} height={H} viewBox="0 0 2160 1240" preserveAspectRatio="xMidYMid slice">
          <ModernRoom t={t} />
        </svg>
        <rect x={1070} y={0} width={20} height={H} fill="#fff" />
        <Label x={540} y={240} text="1911" t={t} t0={aB + 0.2} size={70} bg="#9e1b2d" />
        <Label x={1620} y={240} text="TODAY" t={t} t0={aB + 0.5} size={70} bg="#1d2c4a" />
        <rect x={0} y={0} width={W} height={H} fill="#000" opacity={dark} />
      </View>
      {t > q && (
        <g opacity={ip(t, q, q + 0.3)} transform={tf(1080, 1040, pop(t, q, 0.45))}>
          <rect x={200} y={930} width={1760} height={220} rx={60} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={1080} y={1040} fontFamily="Inter" fontWeight={900} fontSize={96} fill={INK} textAnchor="middle" dominantBaseline="central">DID THE THIEF MAKE IT FAMOUS?</text>
        </g>
      )}
    </g>
  );
};

export const SCENES: Record<string, SceneFn> = { hook, paris, worker, beroud, shock, police, missed, years, meeting, returns, final };
