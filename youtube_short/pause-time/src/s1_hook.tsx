import { Easing } from "remotion";
import { Street } from "./env";
import { Car } from "./env2";
import { Bird, Drop, FreezeDefs, Rain, Shockwave, Splash, Umbrella, frozenK, worldTime } from "./freeze";
import { ALEX, MIA, P, View, cam, ip, shot } from "./kit";
import { Stick } from "./Stick";
import type { SceneFn } from "./types";

const FLOOR = 1040;
const SKY: [string, string] = ["#6f7f99", "#aab6c8"];

// ------------------------------------------------------------------ 1 · THE HOOK (00:00–00:13)
// Heavy rain on a busy street -> everything freezes (drops hang, bird hangs, cars and people stop) -> the camera drifts
// through the frozen street -> Alex walks in and looks at one floating drop -> eye close-up -> he touches it ->
// a yellow-coated silhouette flickers in the distance -> slow wide shot, time snaps back on "or so you think".
export const hook: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const wt = worldTime(t, S.pauses);
  const k = frozenK(t, S.pauses);

  // Alex walks in from the right and stops in front of the hero drop.
  const AX0 = 2500;
  const AX = 1620;
  const walkK = ip(t, E.alex, E.alex + 1.3, 0, 1, Easing.out(Easing.quad));
  const ax = AX0 + (AX - AX0) * walkK;
  const walking = t > E.alex && walkK < 0.98;
  const touching = t > E.touch - 0.3 && t < E.resume + 0.4;
  // hero drop sits at Alex's fingertip ("point" pose, facing left: hand at x - 258, yf - 382)
  const DX = AX - 262;
  const DY = FLOOR - 10 - 382;
  const wob = t > E.touch ? Math.sin((t - E.touch) * 26) * Math.exp(-(t - E.touch) * 4) : 0;
  const afterResume = t > E.resume;
  const heroFall = afterResume ? (t - E.resume) * (t - E.resume) * 2400 : 0;

  const world = (id: string) => (
    <g>
      <FreezeDefs id={`${id}-f`} k={k} />
      <g filter={`url(#${id}-f)`}>
        <Street id={`${id}-st`} t={wt} sky={SKY} px={(cA[1] - 1080) * 0.9} />
        {/* puddles */}
        {[200, 980, 1760].map((x, i) => (
          <ellipse key={i} cx={x} cy={FLOOR + 60 + (i % 2) * 70} rx={200} ry={26} fill="#9fb3cc" opacity={0.55} />
        ))}
        {/* the car that hits a puddle right as time stops */}
        <Car x={1180 + (wt - E.freeze) * 620} y={FLOOR + 160} col="#f2b23a" s={0.95} sport={false} />
        <Splash x={1180 + 300 + (wt - E.freeze) * 620} y={FLOOR + 130} k={ip(wt, E.freeze - 0.35, E.freeze + 0.25)} />
        {/* pedestrians, frozen mid-step */}
        <P t={wt} x={300 + wt * 110} yf={FLOOR - 10} outfit="coat" color="#7a5bb6" hair="bun" arms={["down", "phoneUp"]} walk={wt * 8} facing={1} expr="neutral" seed={5} />
        <Umbrella x={300 + wt * 110} yf={FLOOR - 10} col="#e0463c" />
        <P t={wt} x={1180 - wt * 95} yf={FLOOR - 10} outfit="suit" color="#4a4f5c" hair="slick" arms={["down", "phoneUp"]} walk={wt * 8 + 1.6} facing={-1} expr="neutral" seed={7} />
        <Umbrella x={1180 - wt * 95} yf={FLOOR - 10} col="#2fa3a0" />
        <P t={wt} x={2280 - wt * 70} yf={FLOOR - 10} u={0.92} outfit="tee" color="#3fae6a" hair="cap" accent="#f2c84b" arms={["hold", "down"]} hold="paper" walk={wt * 9 + 0.7} facing={-1} expr="worried" seed={9} />
        {/* bird hanging above the pavement */}
        <Bird x={720 + wt * 260} y={420 - Math.sin(wt * 2) * 20} wt={wt} s={1.1} />
        <Rain wt={wt} k={k} n={260} />
      </g>
      {/* yellow-coat silhouette in the distance: moving while everything else is frozen (drawn outside the freeze tint) */}
      {t > E.think - 0.5 && t < E.think + 0.05 ? (
        <g opacity={ip(t, E.think - 0.5, E.think - 0.4) * (1 - ip(t, E.think - 0.1, E.think + 0.05))}>
          <Stick t={t} x={800 + (t - (E.think - 0.5)) * 240} yf={FLOOR - 58} u={0.34} {...MIA} walk={t * 10} facing={1} shadow={false} expr="neutral" />
        </g>
      ) : null}
      {/* Alex keeps his colours: he is the one moving */}
      {t > E.alex - 0.1 ? (
        <Stick t={t} x={ax} yf={FLOOR - 10} {...ALEX} facing={-1} walk={walking ? t * 9 : null} look={-1} lookY={touching ? 0.5 : 0.1}
          arms={touching ? ["point", "down"] : ["down", "down"]} expr={afterResume ? "shock" : t > E.touch ? "happy" : "thinking"} seed={1} />
      ) : null}
      {t > E.alex - 0.2 && heroFall < 900 ? <Drop x={DX} y={DY + heroFall} r={16} wob={wob} /> : null}
      <Shockwave x={1080} y={560} t={t} t0={E.freeze} />
      {/* the drop reflected in Alex's eye (seen in the close-up) */}
      {t > E.only - 0.4 && t < E.touch - 0.3 ? <ellipse cx={AX - 62} cy={FLOOR - 10 - 508} rx={3} ry={4.5} fill="#bfe4ff" opacity={0.95} /> : null}
    </g>
  );

  // A: push-in during the rain, drift through the frozen street, then frame Alex walking in.
  const cA = cam(t, [
    [0, 1.0, 1080, 620], [E.freeze, 1.28, 1000, 560], [E.rain, 1.5, 980, 470], [E.cars, 1.45, 1380, 790],
    [E.alex + 0.2, 1.5, 1640, 620], [E.only - 0.3, 1.75, 1560, 560],
  ]);
  // B: extreme close-up of Alex's eye
  const eyeX = AX - 32 - 16;
  const eyeY = FLOOR - 10 - 512;
  const cB = cam(t, [[E.only - 0.3, 5.2, eyeX, eyeY], [E.touch - 0.35, 6.0, eyeX - 4, eyeY]]);
  // C: medium on the touch
  const cC = cam(t, [[E.touch - 0.35, 2.3, (DX + AX) / 2, DY - 30], [E.think - 0.5, 2.45, (DX + AX) / 2 - 10, DY - 30]]);
  // D: slow wide shot
  const cD = cam(t, [[E.think - 0.5, 1.35, 1150, 560], [S.dur, 1.04, 1080, 600]]);

  return (
    <>
      <View c={cA} op={shot(t, 0, E.only - 0.3, 0.25)}>{world("hA")}</View>
      <View c={cB} op={shot(t, E.only - 0.3, E.touch - 0.35, 0.25)}>{world("hB")}</View>
      <View c={cC} op={shot(t, E.touch - 0.35, E.think - 0.5, 0.25)}>{world("hC")}</View>
      <View c={cD} op={shot(t, E.think - 0.5, 1e9, 0.25)}>{world("hD")}</View>
      {/* lightning-ish flash of the frame as time stops */}
      <rect x={0} y={0} width={2160} height={1240} fill="#ffffff" opacity={t > E.freeze ? 0.55 * (1 - ip(t, E.freeze, E.freeze + 0.25, 0, 1, Easing.linear)) : 0} />
    </>
  );
};
