import React from "react";
import { Easing } from "remotion";
import { Chip, H, P, View, W, cam, ip, shot } from "./kit";
import { CLOCK, DOOR_X, Exterior, FLOOR, Footprints, Interior, KAI, KAI_X, LedClock, RADIO, SPOT_X, Stranger } from "./station";
import type { SceneFn } from "./types";

// Scenes 1-6 of "The Last Customer". Every interior shot uses the same <Interior> layout.
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const sip = (t: number, a: number, b: number, from = 0, to = 1, ease = Easing.inOut(Easing.cubic)) => (b > a ? ip(t, a, b, from, to, ease) : t >= a ? to : from);

const hash = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Fluorescent flicker: 1 = normal; dips in [a, b). */
export const flick = (t: number, a: number, b: number) => {
  if (t < a || t >= b) return 1;
  const k = Math.floor((t - a) * 22);
  return hash(k) > 0.55 ? 1 : 0.12 + hash(k + 99) * 0.3;
};
/** Glitch: a short white flash + horizontal tear at a time reset. */
export const Glitch: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const k = t - t0;
  if (k < -0.25 || k > 0.35) return null;
  const a = 1 - Math.abs(k) / 0.35;
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={-400 + hash(i + Math.floor(t * 30)) * 300} y={hash(i * 3 + Math.floor(t * 30)) * H} width={W + 800} height={10 + hash(i + 7) * 40}
          fill={i % 2 ? "#ff3a6a" : "#7fe3ff"} opacity={0.35 * a} />
      ))}
      <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#ffffff" opacity={k > -0.05 && k < 0.08 ? 0.85 : 0} />
    </g>
  );
};
export const jitter = (t: number, t0: number) => (Math.abs(t - t0) < 0.25 ? (hash(Math.floor(t * 40)) - 0.5) * 60 : 0);

export type KaiPose = "clean" | "phone" | "idle" | "look" | "clock" | "talk" | "shock" | "back" | "grip" | "plug" | "monitor";
/** Kai behind (or away from) the counter. */
export const Kai: React.FC<{ t: number; pose: KaiPose; x?: number; yf?: number; look?: number; lookY?: number; expr?: string; talk?: boolean; walk?: number | null; facing?: 1 | -1; frozen?: boolean }> = ({
  t, pose, x = KAI_X, yf = FLOOR, look = -1, lookY = 0, expr = "neutral", talk = false, walk = null, facing = -1, frozen = false,
}) => {
  const scrub = pose === "clean" ? Math.sin(t * 6) * 22 : 0;
  const arms = ({
    clean: ["point", "down"], phone: ["down", "phoneUp"], idle: ["down", "down"], look: ["down", "down"], clock: ["down", "down"], talk: ["talk", "down"],
    shock: ["stop", "stop"], back: ["stop", "down"], grip: ["point", "point"], plug: ["down", "point"], monitor: ["down", "down"],
  } as const)[pose];
  return (
    <g>
      <P t={frozen ? 0.5 : t} x={x + scrub} yf={yf} {...KAI} arms={arms as never} hold={pose === "phone" ? "phone" : pose === "clean" ? "paper" : null} holdHand={pose === "clean" ? 0 : 1}
        facing={facing} look={look} lookY={lookY} expr={expr as never} talk={talk} walk={walk} seed={frozen ? 3 : 1} />
    </g>
  );
};

/** Close-up of the wall clock (its own little set: the back wall around it). */
export const ClockShot: React.FC<{ text: string; t: number; lights?: number }> = ({ text, t, lights = 1 }) => (
  <g>
    <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#2a313c" />
    <rect x={-400} y={880} width={W + 800} height={40} fill="#6b5444" />
    <LedClock x={1080} y={560} text={text} s={2.6} glow={lights} />
    <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#000" opacity={0.15 + 0.08 * Math.sin(t * 50)} />
    <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#020306" opacity={(1 - lights) * 0.93} />
  </g>
);

/** The stranger's walk from the glass door to his spot. k 0..1. */
export const strangerWalk = (k: number) => ({ x: lerp(DOOR_X + 20, SPOT_X, k), walk: k > 0 && k < 1 ? k * 14 : null, op: Math.min(1, k * 6 + (k > 0 ? 0.3 : 0)) });

// ------------------------------------------------------------------ 1 · THE HOOK
export const hook: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const lights = t < E.flicker ? 1 : t < E.black ? flick(t, E.flicker, E.black) : 0;
  const wk = sip(t, E.walked - 0.6, E.asked - 0.4, 0, 1, Easing.linear);
  const sw = strangerWalk(wk);
  const look = sip(t, E.asked, E.asked + 1.4, -0.8, 1);
  const cA = cam(t, [[0, 1.0, 1080, 600], [E.walked - 0.6, 1.3, 1500, 560]]);
  const cB = cam(t, [[E.walked - 0.6, 1.0, 1080, 620], [E.asked, 1.15, 900, 600]]);
  const cC = cam(t, [[E.asked, 2.2, SPOT_X + 40, FLOOR - 560], [E.q - 0.2, 2.6, SPOT_X + 20, FLOOR - 580]]);
  const cE = cam(t, [[E.answered - 0.3, 1.7, KAI_X - 200, 520], [E.black, 1.9, KAI_X - 150, 500]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.walked - 0.6, 0.4)}>
        <Exterior t={t} />
        <Stranger x={lerp(700, 1880, sip(t, 0.6, E.walked - 0.4, 0, 1, Easing.linear))} yf={FLOOR + 30} u={0.5} walk={t * 9} />
      </View>
      <View c={cB} op={shot(t, E.walked - 0.6, E.asked, 0.3)}>
        <Interior t={t} clock="11:59 PM">
          <Footprints k={wk} />
          <Stranger x={sw.x} walk={sw.walk} op={sw.op} look={-0.6} />
          <Kai t={t} pose="look" look={-1} expr="neutral" />
        </Interior>
      </View>
      <View c={cC} op={shot(t, E.asked, E.q - 0.2, 0.3)}>
        <Interior t={t} clock="11:59 PM">
          <Footprints k={1} />
          <Stranger x={SPOT_X} look={look} />
        </Interior>
      </View>
      <View c={[1.0, 1080, 620]} op={shot(t, E.q - 0.2, E.answered - 0.3, 0.3)}>
        <ClockShot text="11:59 PM" t={t} />
      </View>
      <View c={cE} op={shot(t, E.answered - 0.3, 1e9, 0.3)}>
        <Interior t={t} clock="11:59 PM" lights={lights}>
          <Stranger x={SPOT_X} look={1} />
          <Kai t={t} pose="talk" look={-1} talk={t < E.answered + 1.0} expr="worried" />
        </Interior>
      </View>
      {t >= E.black ? <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#000" /> : null}
    </>
  );
};

// ------------------------------------------------------------------ 2 · THE NIGHT SHIFT
export const shift: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const radioOn = t < E.clock + 1.6;
  const cA = cam(t, [[0, 1.7, KAI_X - 120, 560], [E.road - 0.3, 1.5, KAI_X - 200, 560]]);
  const cB = cam(t, [[E.road - 0.3, 1.0, 900, 620], [E.clock - 0.3, 1.1, 1100, 600]]);
  const cC = cam(t, [[E.clock - 0.3, 1.5, 1820, 460], [E.bell - 0.4, 1.4, 1700, 500]]);
  const cD = cam(t, [[E.bell - 0.4, 1.0, 1080, 620], [S.dur, 1.05, 1000, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.road - 0.3, 0.3)}>
        <Interior t={t} clock="11:57 PM" radio={radioOn}>
          <Kai t={t} pose={t < 3.2 ? "clean" : "phone"} look={t < 3.2 ? -0.4 : 0.2} lookY={0.6} expr="neutral" />
        </Interior>
        <Chip x={KAI_X - 120} y={300} text="⏪ 2 MINUTES EARLIER" t={t} t0={0.3} t1={3.0} bg="#16161c" fg="#e9eef5" size={40} />
      </View>
      <View c={cB} op={shot(t, E.road - 0.3, E.clock - 0.3, 0.4)}>
        <Exterior t={t} carX={lerp(-700, 2900, sip(t, E.road - 0.2, E.clock + 0.2, 0, 1, Easing.linear))} />
        <Chip x={900} y={280} text="NEAREST TOWN: 20 MILES" t={t} t0={E.road + 0.8} bg="#16161c" fg="#f2c84b" size={40} />
      </View>
      <View c={cC} op={shot(t, E.clock - 0.3, E.bell - 0.4, 0.3)}>
        <Interior t={t} clock="11:57 PM" radio={radioOn}>
          <Kai t={t} pose={t > E.clock + 1.2 ? "plug" : "clock"} look={t > E.clock + 1.2 ? 1 : 0.3} lookY={-0.7} facing={t > E.clock + 1.2 ? 1 : -1} expr="neutral" />
        </Interior>
      </View>
      <View c={cD} op={shot(t, E.bell - 0.4, 1e9, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Kai t={t} pose="look" look={-1} expr={t > E.bell + 0.2 ? "shock" : "neutral"} />
        </Interior>
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 3 · THE STRANGER
export const stranger: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const wk = sip(t, 0.0, E.shelves - 0.2, 0, 1, Easing.linear);
  const sw = strangerWalk(wk);
  const look = sip(t, E.turn, E.turn + 1.6, -0.6, 1);
  const cA = cam(t, [[0, 1.75, sw.x - 120, 600], [E.shelves - 0.2, 1.75, SPOT_X - 60, 600]]);
  const cB = cam(t, [[E.shelves - 0.2, 1.0, 1080, 620], [E.stood, 1.05, 1000, 620]]);
  const cC = cam(t, [[E.stood, 1.3, SPOT_X + 100, 600], [E.turn, 1.9, SPOT_X + 40, 560]]);
  const cD = cam(t, [[E.turn, 2.4, SPOT_X + 40, FLOOR - 560], [E.glance, 2.7, SPOT_X + 30, FLOOR - 580]]);
  const cE = cam(t, [[E.glance, 1.6, 1750, 470], [S.dur - 1.4, 1.7, 1760, 480]]);
  const cF = cam(t, [[S.dur - 1.4, 1.2, 900, 600], [S.dur, 1.3, 800, 600]]);
  const st = <Stranger x={sw.x} walk={sw.walk} op={sw.op} look={wk < 1 ? -0.6 : look} />;
  return (
    <>
      <View c={cA} op={shot(t, 0, E.shelves - 0.2, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Footprints k={wk} />
          {st}
          <Kai t={t} pose="look" look={-1} expr="neutral" />
        </Interior>
      </View>
      <View c={cB} op={shot(t, E.shelves - 0.2, E.stood, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Footprints k={1} />
          {st}
          <Kai t={t} pose="look" look={-1} expr="suspicious" />
        </Interior>
      </View>
      <View c={cC} op={shot(t, E.stood, E.turn, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Footprints k={1} />
          {st}
        </Interior>
      </View>
      <View c={cD} op={shot(t, E.turn, E.glance, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Footprints k={1} />
          {st}
        </Interior>
      </View>
      <View c={cE} op={shot(t, E.glance, S.dur - 1.4, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Kai t={t} pose="talk" look={t < E.answer ? 0.3 : -1} lookY={t < E.answer ? -0.7 : 0} talk={t > E.answer && t < E.answer + 1.3} expr="worried" />
        </Interior>
      </View>
      <View c={cF} op={shot(t, S.dur - 1.4, 1e9, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio={false}>
          <Footprints k={1} />
          <Stranger x={SPOT_X} look={1} />
          <Kai t={t} pose="idle" look={-1} expr="worried" />
        </Interior>
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 4 · SOMETHING IS WRONG
export const wrong: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const lights = flick(t, E.blink - 0.1, E.reset);
  const wk = sip(t, E.bell + 0.2, S.dur + 2.6, 0, 1, Easing.linear);
  const sw = strangerWalk(wk);
  const cA = cam(t, [[0, 1.2, 1000, 600], [E.reset, 1.3, 1000, 600]]);
  const cB = cam(t, [[E.reset, 1.7, KAI_X - 120, 560], [E.clock - 0.3, 1.6, KAI_X - 100, 520]]);
  const cC = cam(t, [[E.clock - 0.3, 2.5, CLOCK.x, CLOCK.y + 40], [E.imagined - 0.5, 2.3, CLOCK.x, CLOCK.y + 60]]);
  const cD = cam(t, [[E.imagined - 0.5, 1.0, 1080, 620], [S.dur, 1.1, 800, 620]]);
  const j = jitter(t, E.reset);
  return (
    <>
      <View c={[cA[0], cA[1] + j, cA[2]]} op={shot(t, 0, E.reset, 0.05)}>
        <Interior t={t} clock="11:59 PM" lights={lights} radio={false}>
          <Footprints k={1} />
          <Stranger x={SPOT_X} look={1} />
          <Kai t={t} pose="shock" look={-1} expr="shock" />
        </Interior>
        {Math.abs(t - E.crackle - 0.3) < 0.5 ? <circle cx={RADIO.x} cy={RADIO.y - 30} r={90} fill="#ffe9a0" opacity={0.25 * (Math.floor(t * 30) % 2)} /> : null}
      </View>
      <View c={cB} op={shot(t, E.reset, E.clock - 0.3, 0.05)}>
        <Interior t={t} clock="11:57 PM" radio>
          <Kai t={t} pose="clean" look={-0.3} lookY={0.6} expr="confused" />
        </Interior>
      </View>
      <View c={cC} op={shot(t, E.clock - 0.3, E.imagined - 0.5, 0.3)}>
        <Interior t={t} clock="11:57 PM" radio>
          <Kai t={t} pose="clock" look={0.3} lookY={-0.7} expr="confused" />
        </Interior>
      </View>
      <View c={cD} op={shot(t, E.imagined - 0.5, 1e9, 0.3)}>
        <Interior t={t} clock={t < E.bell - 0.4 ? "11:58 PM" : "11:59 PM"} radio>
          <Footprints k={wk} />
          <Stranger x={sw.x} walk={sw.walk} op={sw.op} look={-0.6} />
          <Kai t={t} pose="look" look={-1} expr={t > E.bell ? "shock" : "confused"} />
        </Interior>
      </View>
      <Glitch t={t} t0={E.reset} />
    </>
  );
};

// ------------------------------------------------------------------ 5 · THE SECOND TIME
export const second: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const wk = sip(t, -2.6 + 0.0, 1.4, 0.6, 1, Easing.linear);
  const sw = strangerWalk(wk);
  const lights = flick(t, E.jump - 0.4, E.jump);
  const look = sip(t, 1.4, 2.6, -0.6, 1);
  const drops = (t * 1.3) % 1;
  const cA = cam(t, [[0, 1.0, 1000, 620], [E.wet - 0.3, 1.2, 800, 600]]);
  const cW = cam(t, [[E.wet - 0.3, 2.4, SPOT_X, FLOOR - 220], [E.wet + 1.6, 2.6, SPOT_X, FLOOR - 200]]);
  const cB = cam(t, [[E.wet + 1.6, 2.1, KAI_X - 60, 470], [E.q - 0.2, 2.3, KAI_X - 50, 460]]);
  const cC = cam(t, [[E.q - 0.2, 2.6, SPOT_X + 30, FLOOR - 570], [E.hes - 0.2, 2.8, SPOT_X + 30, FLOOR - 580]]);
  const cD = cam(t, [[E.hes - 0.2, 1.8, KAI_X - 120, 500], [E.jump, 2.0, KAI_X - 100, 480]]);
  const cE = cam(t, [[E.jump, 1.6, KAI_X - 150, 560], [S.dur, 1.7, KAI_X - 150, 560]]);
  const drop = sip(t, E.drop, E.drop + 0.6, 0, 1, Easing.in(Easing.quad));
  return (
    <>
      <View c={cA} op={shot(t, 0, E.wet - 0.3, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio>
          <Footprints k={wk} />
          <Stranger x={sw.x} walk={sw.walk} op={1} look={wk < 1 ? -0.6 : look} />
          <Kai t={t} pose="look" look={-1} expr="shock" />
        </Interior>
      </View>
      <View c={cW} op={shot(t, E.wet - 0.3, E.wet + 1.6, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio>
          <Footprints k={1} />
          <Stranger x={SPOT_X} look={1} />
          {[-40, 10, 55].map((dx, i) => (
            <ellipse key={i} cx={SPOT_X + dx} cy={FLOOR - 300 + ((drops + i * 0.33) % 1) * 330} rx={6} ry={10} fill="#9fc4e8" opacity={0.8} />
          ))}
          <ellipse cx={SPOT_X} cy={FLOOR + 30} rx={90} ry={16} fill="#5d6f86" opacity={0.45} />
        </Interior>
        <Chip x={SPOT_X} y={FLOOR - 560} text="SAME SPOT. STILL DRIPPING." t={t} t0={E.wet} bg="#16161c" fg="#9fe3ff" size={22} />
      </View>
      <View c={cB} op={shot(t, E.wet + 1.6, E.q - 0.2, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio>
          <Kai t={t} pose="idle" look={-1} expr="worried" />
        </Interior>
      </View>
      <View c={cC} op={shot(t, E.q - 0.2, E.hes - 0.2, 0.3)}>
        <Interior t={t} clock="11:59 PM" radio>
          <Footprints k={1} />
          <Stranger x={SPOT_X} look={1} />
        </Interior>
      </View>
      <View c={cD} op={shot(t, E.hes - 0.2, E.jump, 0.2)}>
        <Interior t={t} clock="11:59 PM" radio lights={lights}>
          <Kai t={t} pose="talk" look={-1} talk={t > E.answer && t < E.answer + 1.3} expr="awkward" />
        </Interior>
      </View>
      <View c={cE} op={shot(t, E.jump, 1e9, 0.05)}>
        <Interior t={t} clock="11:57 PM" radio>
          <Kai t={t} pose={t < E.drop ? "clean" : "shock"} look={-0.3} lookY={0.4} expr={t > E.drop ? "shock" : "confused"} />
          {t > E.drop ? <rect x={KAI_X - 300} y={FLOOR - 400 + drop * 60} width={60} height={40} rx={6} fill="#f4f6fb" stroke="#111" strokeWidth={4}
            transform={`rotate(${drop * 70} ${KAI_X - 270} ${FLOOR - 380 + drop * 60})`} opacity={1 - drop * 0.6} /> : null}
        </Interior>
        <Chip x={KAI_X - 150} y={260} text="11:57 · AGAIN" t={t} t0={E.jump + 0.6} bg="#16161c" fg="#ff5a6a" size={30} />
      </View>
      <Glitch t={t} t0={E.jump} />
    </>
  );
};

// ------------------------------------------------------------------ 6 · TESTING THE LOOP
export const testing: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const r1 = E.moved - 0.4;
  const r2 = E.locked - 0.4;
  const appear = E.every + 0.6;
  const back = sip(t, E.returned - 0.8, E.q, 0, 1);
  const kaiX = lerp(880, 1240, back);
  const cA = cam(t, [[0, 1.8, 1900, 520], [r1, 1.9, 1950, 520]]);
  const cB = cam(t, [[r1, 1.5, 1300, 600], [r2, 1.55, 1280, 600]]);
  const cC = cam(t, [[r2, 1.6, DOOR_X + 220, 600], [E.every, 1.7, DOOR_X + 240, 600]]);
  const cD = cam(t, [[E.every, 1.15, 600, 620], [E.returned, 1.6, kaiX - 60, 560], [S.dur, 2.4, kaiX - 30, 520]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, r1, 0.05)}>
        <Interior t={t} clock="11:57 PM" radio={t < E.unplug + 0.2}>
          <Kai t={t} pose="plug" x={1880} facing={1} look={1} lookY={0.3} expr="angry" />
          {t > E.unplug + 0.2 ? <path d={`M ${RADIO.x - 90} ${RADIO.y + 10} q -60 40 -110 ${120}`} fill="none" stroke="#111" strokeWidth={6} /> : null}
        </Interior>
        <Chip x={1900} y={260} text="TRY 1 · UNPLUG THE RADIO" t={t} t0={E.unplug} bg="#16161c" fg="#f2c84b" size={26} />
      </View>
      <View c={cB} op={shot(t, r1, r2, 0.05)}>
        <Interior t={t} clock="11:57 PM" radio stand={sip(t, r1 + 0.5, E.moved + 1.0, 0, 1)}>
          <Kai t={t} pose="shock" x={1480 - 200 * sip(t, r1 + 0.5, E.moved + 1.0, 0, 1)} yf={FLOOR + 30} facing={-1} look={-1} expr="angry" walk={t > r1 + 0.5 && t < E.moved + 1.0 ? t * 8 : null} />
        </Interior>
        <Chip x={1300} y={260} text="TRY 2 · MOVE THE STAND" t={t} t0={E.moved} bg="#16161c" fg="#f2c84b" size={26} />
      </View>
      <View c={cC} op={shot(t, r2, E.every, 0.05)}>
        <Interior t={t} clock="11:58 PM" radio locked={t > E.locked + 0.3}>
          <Kai t={t} pose="shock" x={DOOR_X + 230} yf={FLOOR + 30} facing={-1} look={-1} expr="angry" />
        </Interior>
        <Chip x={DOOR_X + 230} y={260} text="TRY 3 · LOCK THE DOOR" t={t} t0={E.locked} bg="#16161c" fg="#f2c84b" size={26} />
      </View>
      <View c={cD} op={shot(t, E.every, 1e9, 0.05)}>
        <Interior t={t} clock="11:59 PM" radio locked lights={flick(t, appear - 0.3, appear + 0.1)}>
          <Footprints k={t > appear ? 1 : 0} />
          <Stranger x={SPOT_X} look={1} op={t > appear ? 1 : 0} />
          <Kai t={t} pose="back" x={kaiX} yf={FLOOR + 30} facing={-1} look={-1} expr={t > appear ? "shock" : "neutral"} walk={back > 0 && back < 1 ? t * 5 : null} />
        </Interior>
      </View>
      <Glitch t={t} t0={r1} />
      <Glitch t={t} t0={r2} />
      <Glitch t={t} t0={S.dur - 0.1} />
    </>
  );
};

