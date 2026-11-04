import React from "react";
import { Easing } from "remotion";
import { Room } from "./env";
import { Chip, H, MANAGER, P, View, W, cam, shot } from "./kit";
import { CctvOverlay, DOOR_X, Exterior, FLOOR, Footprints, Interior, KAI_X, MONITOR, SPOT_X, Stranger } from "./station";
import { ClockShot, Glitch, Kai, flick, lerp, sip } from "./scenesA";
import type { SceneFn } from "./types";

// Scenes 7-11 of "The Last Customer".
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
/** The clock with seconds, ticking in real time from 11:59:40 at the word "Twenty". */
export const secClock = (lt: number, twenty: number) => {
  const s = 40 + (lt - twenty);
  if (s >= 60) return "12:00:00";
  return `11:59:${pad2(s)}`;
};

// ------------------------------------------------------------------ 7 · THE SECURITY CAMERA
const MonitorWall: React.FC<{ t: number; n: number }> = ({ t, n }) => (
  <g>
    <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#0c0f14" />
    <rect x={180} y={110} width={1800} height={1000} rx={40} fill="#1b1d24" stroke="#000" strokeWidth={10} />
    <rect x={230} y={160} width={1700} height={900} rx={20} fill="#071009" />
    {Array.from({ length: Math.min(24, n) }).map((_, i) => {
      const x = 260 + (i % 6) * 278;
      const y = 190 + Math.floor(i / 6) * 216;
      return (
        <g key={i} opacity={i === n - 1 ? 0.5 + 0.5 * Math.sin(t * 10) : 1}>
          <rect x={x} y={y} width={258} height={196} fill="#1f2b24" stroke="#4d6b58" strokeWidth={3} />
          <rect x={x + 10} y={y + 120} width={238} height={6} fill="#4d6b58" />
          <rect x={x + 20} y={y + 40} width={40} height={80} fill="#3d4f44" />
          <circle cx={x + 200} cy={y + 70} r={16} fill="#3d4f44" />
          <rect x={x + 186} y={y + 86} width={28} height={36} fill="#3d4f44" />
          <text x={x + 12} y={y + 26} fontFamily="Inter" fontWeight={800} fontSize={20} fill="#b9e8c8">{`REC ${String(i + 1).padStart(2, "0")}`}</text>
          <text x={x + 246} y={y + 186} fontFamily="Inter" fontWeight={800} fontSize={20} fill="#b9e8c8" textAnchor="end">11:59 PM</text>
        </g>
      );
    })}
    {Array.from({ length: 34 }).map((_, i) => <rect key={i} x={230} y={160 + i * 27} width={1700} height={5} fill="#000" opacity={0.25} />)}
  </g>
);

export const camera: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const recs = Math.round(sip(t, E.new - 0.3, E.every - 0.4, 6, 36, Easing.in(Easing.quad)));
  const clipN = Math.floor((t - (E.every - 0.3)) / 1.6);
  const cA = cam(t, [[0, 1.6, 1600, 560], [E.monitor - 0.3, 1.9, MONITOR.x + 60, 520]]);
  const cB = cam(t, [[E.monitor - 0.3, 1.0, 1080, 610], [E.every - 0.3, 1.12, 1080, 600]]);
  const cC = cam(t, [[E.every - 0.3, 1.05, 1050, 600], [E.talk + 1.6, 1.12, 1000, 600]]);
  const cD = cam(t, [[E.talk + 1.6, 2.2, KAI_X - 230, 470], [S.dur, 2.4, KAI_X - 230, 460]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.monitor - 0.3, 0.3)}>
        <Interior t={t} clock="11:58 PM" radio recordings={6}>
          <Kai t={t} pose="monitor" x={lerp(KAI_X, 1640, sip(t, 0.3, 2.4))} look={-0.7} lookY={0.6} expr="suspicious" walk={t > 0.3 && t < 2.4 ? t * 6 : null} />
        </Interior>
      </View>
      <View c={cB} op={shot(t, E.monitor - 0.3, E.every - 0.3, 0.3)}>
        <MonitorWall t={t} n={recs} />
        <Chip x={1080} y={1150} text={`RECORDINGS: ${recs}`} t={t} t0={E.monitor} bg="#16161c" fg="#ff5a6a" size={40} />
      </View>
      <View c={cC} op={shot(t, E.every - 0.3, E.talk + 1.6, 0.05)}>
        <Interior t={t} clock="11:59 PM" radio={false} cctv recordings={36}>
          <Footprints k={1} op={0.6} />
          {/* the camera never sees him: Kai turns to the empty doorway and talks */}
          <Kai t={t + clipN * 0.7} pose="talk" look={-1} talk={(t - (E.every - 0.3)) % 1.6 > 0.4} expr="worried" />
        </Interior>
      </View>
      {shot(t, E.every - 0.3, E.talk + 1.6, 0.05) > 0.01 ? (
        <g opacity={shot(t, E.every - 0.3, E.talk + 1.6, 0.05)}><CctvOverlay t={t} stamp={`11:59:0${3 + (clipN % 5)} PM`} label={`REC ${String(7 + clipN * 9).padStart(2, "0")} · CAM 01`} /></g>
      ) : null}
      <View c={cD} op={shot(t, E.talk + 1.6, 1e9, 0.3)}>
        <Interior t={t} clock="11:58 PM" radio recordings={36}>
          <Kai t={t} pose="monitor" x={1640} look={-0.7} lookY={0.5} expr="shock" />
          <ellipse cx={1560} cy={470} rx={260} ry={200} fill="#9fd8b0" opacity={0.12 + 0.05 * Math.sin(t * 25)} />
        </Interior>
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 8 · THE REALIZATION
export const realize: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const breath = Math.sin(Math.min(t, 2.4) / 2.4 * Math.PI) * 14;
  const clockTxt = t < E.bell - 0.6 ? "11:58 PM" : "11:59 PM";
  const appear = sip(t, E.bell, E.bell + 0.6, 0, 1);
  const cA = cam(t, [[0, 2.5, KAI_X, 470], [E.loop - 0.3, 2.6, KAI_X, 470]]);
  const cB = cam(t, [[E.loop - 0.3, 1.0, 1080, 620], [E.repeated - 0.3, 1.08, 1080, 620]]);
  const cC = cam(t, [[E.repeated - 0.3, 2.1, DOOR_X, 560], [E.silent - 1.4, 2.0, DOOR_X + 40, 560]]);
  const cD = cam(t, [[E.silent - 1.4, 1.0, 1080, 620], [S.dur, 1.08, 980, 620]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.loop - 0.3, 0.3)}>
        <Interior t={t} clock="11:58 PM" radio recordings={36}>
          <Kai t={t} pose="idle" yf={FLOOR - breath} look={0} lookY={t < 1.6 ? 0.8 : 0} expr={t < 1.6 ? "sleep" : "worried"} />
        </Interior>
      </View>
      <View c={cB} op={shot(t, E.loop - 0.3, E.repeated - 0.3, 0.3)}>
        <ClockShot text={Math.floor(t * 1.0) % 2 ? "11:58 PM" : "11 58 PM"} t={t} />
      </View>
      <View c={cC} op={shot(t, E.repeated - 0.3, E.silent - 1.4, 0.3)}>
        <Interior t={t} clock="11:58 PM" radio recordings={36} />
      </View>
      <View c={cD} op={shot(t, E.silent - 1.4, 1e9, 0.3)}>
        <Interior t={t} clock={clockTxt} radio recordings={36}>
          <Stranger x={DOOR_X + 40 + appear * 80} op={appear} look={-0.4} walk={appear > 0 && appear < 1 ? t * 12 : null} />
          <Kai t={t} pose="grip" look={-1} expr="worried" />
        </Interior>
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 9 · DON'T ANSWER
export const dont: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const wk = sip(t, 0, 0.8, 0.7, 1, Easing.linear);
  const x0 = lerp(DOOR_X + 120, SPOT_X, sip(t, 0, 0.8, 0, 1, Easing.linear));
  const step1 = sip(t, E.step - 0.2, E.step + 1.0, 0, 1);
  const step2 = sip(t, E.heard - 0.9, E.heard + 0.3, 0, 1);
  const step3 = sip(t, E.staring + 0.4, E.staring + 1.8, 0, 1);
  const x = x0 + 170 * (step1 + step2 + step3);
  const walking = (step1 > 0 && step1 < 1) || (step2 > 0 && step2 < 1) || (step3 > 0 && step3 < 1);
  const clock = t < E.twenty - 0.3 ? "11:59 PM" : secClock(t, E.twenty);
  const cA = cam(t, [[0, 2.2, SPOT_X + 40, FLOOR - 540], [E.nothing - 0.3, 2.4, SPOT_X + 40, FLOOR - 560]]);
  const cB = cam(t, [[E.nothing - 0.3, 2.3, KAI_X - 30, 460], [E.step - 0.3, 2.5, KAI_X - 30, 460]]);
  const cC = cam(t, [[E.step - 0.3, 3.0, x - 30, FLOOR - 60], [E.heard - 0.3, 3.0, x - 30, FLOOR - 60]]);
  const cD = cam(t, [[E.heard - 0.3, 2.3, x + 20, FLOOR - 560], [E.staring - 0.3, 2.4, x + 30, FLOOR - 560]]);
  const cE = cam(t, [[E.staring - 0.3, 1.3, 1450, 560], [E.twenty - 0.4, 1.4, 1550, 520]]);
  const inner = (
    <>
      <Footprints k={1} />
      <Stranger x={x} walk={walking ? t * 7 : null} look={1} op={wk > 0.7 ? 1 : 0} />
    </>
  );
  return (
    <>
      <View c={cA} op={shot(t, 0, E.nothing - 0.3, 0.3)}>
        <Interior t={t} clock={clock} radio recordings={36}>{inner}</Interior>
      </View>
      <View c={cB} op={shot(t, E.nothing - 0.3, E.step - 0.3, 0.3)}>
        <Interior t={t} clock={clock} radio recordings={36}>
          <Kai t={t} pose="grip" look={-1} expr="neutral" />
        </Interior>
      </View>
      <View c={cC} op={shot(t, E.step - 0.3, E.heard - 0.3, 0.3)}>
        <Interior t={t} clock={clock} radio recordings={36} front={inner} />
      </View>
      <View c={cD} op={shot(t, E.heard - 0.3, E.staring - 0.3, 0.3)}>
        <Interior t={t} clock={clock} radio recordings={36} front={inner} />
      </View>
      <View c={cE} op={shot(t, E.staring - 0.3, E.twenty - 0.4, 0.3)}>
        <Interior t={t} clock={clock} radio recordings={36} front={inner}>
          <Kai t={t} pose="grip" look={0.3} lookY={-0.7} expr="worried" />
        </Interior>
      </View>
      <View c={[1.0, 1080, 620]} op={shot(t, E.twenty - 0.4, 1e9, 0.3)}>
        <ClockShot text={clock} t={t} />
      </View>
    </>
  );
};

// ------------------------------------------------------------------ 10 · MIDNIGHT
export const midnight: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const clock = secClock(t, E.twenty);
  const dark = t >= E.midnight && t < E.on;
  const lights = dark ? 0 : t >= E.on ? flick(t, E.on, E.on + 0.6) : 1;
  const gone = t >= E.on;
  const SX = SPOT_X + 510;
  const eyes = sip(t, 0.2, 1.2, 0, 1);
  const lean = sip(t, E.lean, E.whisper, 0, 9);
  const relax = sip(t, E.gone + 0.2, S.dur, 0, 1);
  const cA = cam(t, [[0, 1.4, 1450, 560], [E.lean, 1.5, 1450, 540]]);
  const cB = cam(t, [[E.lean, 2.2, SX + 80, FLOOR - 560], [E.ten - 0.3, 2.5, SX + 100, FLOOR - 560]]);
  const cD = cam(t, [[E.five - 0.3, 2.6, KAI_X - 40, 470], [E.three - 0.3, 2.8, KAI_X - 40, 470]]);
  const cF = cam(t, [[E.on - 0.1, 1.0, 1080, 620], [S.dur, 1.06, 1150, 620]]);
  const room = (kai: React.ReactNode, cl = clock) => (
    <Interior t={t} clock={cl} radio={false} recordings={36} lights={lights}
      front={!gone ? <Stranger x={SX} look={1} eyes={eyes} lean={lean} /> : null}>
      <Footprints k={1} op={gone ? 0.5 : 1} />
      {kai}
    </Interior>
  );
  return (
    <>
      <View c={cA} op={shot(t, 0, E.lean, 0.3)}>{room(<Kai t={t} pose="grip" look={-1} expr="worried" />)}</View>
      <View c={cB} op={shot(t, E.lean, E.ten - 0.3, 0.3)}>{room(<Kai t={t} pose="grip" look={-1} expr="worried" />)}</View>
      <View c={[1.0, 1080, 620]} op={shot(t, E.ten - 0.3, E.five - 0.3, 0.2)}><ClockShot text={clock} t={t} /></View>
      <View c={cD} op={shot(t, E.five - 0.3, E.three - 0.3, 0.2)}>{room(<Kai t={t} pose="grip" look={-1} expr="awkward" />)}</View>
      <View c={[1.0, 1080, 620]} op={shot(t, E.three - 0.3, E.on - 0.1, 0.05)}><ClockShot text={clock} t={t} lights={dark ? 0.15 : 1} /></View>
      <View c={cF} op={shot(t, E.on - 0.1, 1e9, 0.05)}>
        {room(
          <Kai t={t} pose={relax > 0.5 ? "idle" : "grip"} x={lerp(KAI_X, 1560, relax)} look={Math.sin(t * 2.2) * (1 - relax) - relax} lookY={0} expr={relax > 0.3 ? "neutral" : "shock"}
            walk={relax > 0.2 && relax < 1 ? t * 6 : null} />,
        )}
      </View>
      {dark ? <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#000" /> : null}
    </>
  );
};

// ------------------------------------------------------------------ 11 · THE FINAL REVEAL
export const reveal: SceneFn = ({ S, t }) => {
  const E = S.ev;
  const run = sip(t, 0.4, 3.2, 0, 1, Easing.in(Easing.quad));
  const clipN = Math.floor((t - (E.clips - 0.3)) / 1.25);
  const ended = t >= E.end;
  const turn = sip(t, E.turn, E.turn + 2.0, -1, 0);
  const cA = cam(t, [[0, 1.5, 1700, 640], [E.morning - 0.3, 1.0, 1080, 600]]);
  const cB = cam(t, [[E.morning - 0.3, 1.0, 1080, 620], [E.footage - 0.2, 1.05, 1080, 610]]);
  const cB2 = cam(t, [[E.footage - 0.2, 1.4, 1150, 560], [E.clips - 0.3, 1.6, 1250, 520]]);
  const cD = cam(t, [[E.last - 0.3, 1.05, 1080, 600], [E.turn, 1.6, KAI_X - 20, 470], [E.end, 5.0, KAI_X - 8, FLOOR - 512]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.morning - 0.3, 0.4)}>
        <Exterior t={t} />
        <Kai t={t} pose="idle" x={lerp(1930, 200, run)} yf={FLOOR + 30} facing={-1} look={-1} expr="shock" walk={run > 0 && run < 1 ? t * 16 : null} />
      </View>
      <View c={cB} op={shot(t, E.morning - 0.3, E.footage - 0.2, 0.5)}>
        <Exterior t={t} morning />
        <Chip x={1080} y={250} text="THE NEXT MORNING" t={t} t0={E.morning} bg="#16161c" fg="#e9eef5" size={44} />
      </View>
      <View c={cB2} op={shot(t, E.footage - 0.2, E.clips - 0.3, 0.3)}>
        <Room id="r-off" wall="#5a6270" wall2="#4a515d" floor="#6b6f78" lightX={1200} light={0.12} />
        <rect x={900} y={FLOOR - 340} width={900} height={40} rx={8} fill="#6b5444" stroke="#111" strokeWidth={6} />
        <rect x={1120} y={FLOOR - 650} width={460} height={310} rx={16} fill="#1b1d24" stroke="#111" strokeWidth={8} />
        <rect x={1140} y={FLOOR - 630} width={420} height={270} rx={6} fill="#0a1410" />
        {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={1150 + (i % 4) * 102} y={FLOOR - 620 + Math.floor(i / 4) * 86} width={94} height={78} fill="#4d6b58" opacity={0.6} />)}
        <P t={t} x={920} yf={FLOOR + 30} {...MANAGER} facing={1} look={1} lookY={-0.2} arms={["down", "chest"]} expr="suspicious" seed={60} />
        <Chip x={1350} y={FLOOR - 720} text="37 RECORDINGS · SAME MINUTE" t={t} t0={E.footage + 0.4} bg="#16161c" fg="#ff5a6a" size={34} />
      </View>
      <View c={[1.05, 1050, 600]} op={shot(t, E.clips - 0.3, E.last - 0.3, 0.05)}>
        <Interior t={t} clock="11:59 PM" radio={false} cctv recordings={36}>
          <Kai t={t + clipN} pose="talk" look={-1} talk={(t - E.clips) % 1.25 > 0.3} expr="worried" />
        </Interior>
      </View>
      {shot(t, E.clips - 0.3, E.last - 0.3, 0.05) > 0.01 ? (
        <CctvOverlay t={t} stamp="11:59:05 PM" label={`REC ${String([3, 11, 17, 24, 29, 33][Math.max(0, clipN) % 6]).padStart(2, "0")} · CAM 01`} />
      ) : null}
      <View c={cD} op={shot(t, E.last - 0.3, 1e9, 0.05)}>
        <Interior t={t} clock="12:00 AM" radio={false} cctv recordings={37}>
          {/* the last recording: Kai, perfectly still, turns to the camera */}
          <Kai t={0.5} frozen pose="idle" look={turn} lookY={-0.35 * (1 + turn)} expr="neutral" />
        </Interior>
      </View>
      {t >= E.last - 0.3 && !ended ? <CctvOverlay t={t} stamp="12:00:00 AM" label="REC 37 · CAM 01" /> : null}
      {ended ? <rect x={-400} y={-300} width={W + 800} height={H + 600} fill="#000" /> : null}
      <Glitch t={t} t0={E.clips - 0.3} />
    </>
  );
};

