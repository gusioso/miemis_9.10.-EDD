import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import timeline from "./timeline.json";
import { EV, SC, clamp } from "./lib";
import * as A from "./scenes/A";
import * as B from "./scenes/B";
import * as C from "./scenes/C";
import * as D from "./scenes/D";

loadFont({ family: "Bungee", url: staticFile("fonts/Bungee-Regular.ttf"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/Inter-800.ttf"), weight: "800" });

export type SceneProps = { t: number; u: number };
type Entry = { id: string; t0: number; t1: number; C: React.FC<SceneProps> };
const E: Entry[] = [
  { id: "title", t0: 0, t1: SC.about, C: A.Title },
  { id: "about", t0: SC.about, t1: SC.origins, C: A.About },
  { id: "corsica", t0: SC.origins, t1: EV.school, C: A.Corsica },
  { id: "school", t0: EV.school, t1: SC.toulon, C: A.School },
  { id: "toulon", t0: SC.toulon, t1: EV.officer, C: B.Toulon },
  { id: "officer", t0: EV.officer, t1: EV.epaulette, C: B.Officer },
  { id: "epaulette", t0: EV.epaulette, t1: SC.power, C: B.Epaulette },
  { id: "coup", t0: SC.power, t1: EV.y1804 - 0.05, C: B.Coup },
  { id: "coronation", t0: EV.y1804 - 0.05, t1: EV.book - 0.3, C: B.Coronation },
  { id: "book", t0: EV.book - 0.3, t1: EV.austerlitz, C: C.Book },
  { id: "austerlitz", t0: EV.austerlitz, t1: EV.flood, C: C.Austerlitz },
  { id: "flood", t0: EV.flood, t1: SC.russia, C: C.Flood },
  { id: "march", t0: SC.russia, t1: EV.moscow, C: C.March },
  { id: "moscow", t0: EV.moscow, t1: EV.winter, C: C.Moscow },
  { id: "retreat", t0: EV.winter, t1: SC.elba, C: C.Retreat },
  { id: "elba", t0: SC.elba, t1: SC.ret, C: D.Elba },
  { id: "boat", t0: SC.ret, t1: EV.alps, C: D.Boat },
  { id: "alps", t0: EV.alps, t1: EV.walk, C: D.Alps },
  { id: "walk", t0: EV.walk, t1: 45.15, C: D.Walk },
  { id: "here", t0: 45.15, t1: EV.lower, C: D.Here },
  { id: "hats", t0: EV.lower, t1: SC.end, C: D.Hats },
  { id: "waterloo", t0: SC.end, t1: EV.helena, C: D.Waterloo },
  { id: "helena", t0: EV.helena, t1: SC.twist, C: D.Helena },
  { id: "twist", t0: SC.twist, t1: 60, C: D.Twist },
];

const FADE = 5; // frames of dissolve into each new scene (the reference dissolves ~0.2 s)

const SceneLayer: React.FC<{ e: Entry; first: boolean }> = ({ e, first }) => {
  const f = useCurrentFrame(); // local to the Sequence
  const t = e.t0 + f / 30;
  const op = first ? 1 : interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 55, near: 0.05, far: 2500, position: [0, 2, 8] }} gl={{ antialias: true }}>
        <e.C t={t} u={t - e.t0} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- overlays
const BUNGEE = "Bungee, sans-serif";
const Stamp: React.FC<{ t: number; t0: number; lines: string[]; x: number; y: number; size: number; rot?: number; hold?: number }> = ({ t, t0, lines, x, y, size, rot = -0.05, hold = 2 }) => {
  const a = t - t0;
  if (a < 0 || a > hold + 0.3) return null;
  const sc = 1 + 0.9 * Math.pow(1 - clamp(a / 0.13), 3);
  const op = (1 - clamp((a - hold) / 0.3)) * clamp(a / 0.04 + 0.2);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}rad) scale(${sc})`, opacity: op, background: "#A3262A", border: "6px solid #1b1511", outline: "5px solid #F3E8CB", outlineOffset: "-14px", borderRadius: 14, padding: `${size * 0.16}px ${size * 0.34}px`, textAlign: "center", fontFamily: BUNGEE, fontSize: size, lineHeight: 1.02, color: "#F3E8CB", whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
};

type Chunk = { t: number; end: number; text: string };
const chunks: Chunk[] = (() => {
  const out: Chunk[] = []; let cur: typeof timeline.words = [];
  const flush = () => { if (cur.length) { out.push({ t: cur[0].t, end: cur[cur.length - 1].end, text: cur.map((w) => w.w).join(" ") }); cur = []; } };
  for (const w of timeline.words) { cur.push(w); if (cur.length >= 2 || /[.?!:,]$/.test(w.w)) flush(); }
  flush();
  out.forEach((c, i) => { const n = out[i + 1]; c.end = Math.min(c.end + 0.3, n ? n.t : 60); });
  return out;
})();

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = chunks.find((q) => t >= q.t - 0.02 && t < q.end);
  if (!c) return null;
  const a = t - c.t;
  const pop = a < 0.1 ? 0.86 + 0.14 * (a / 0.1) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 140, top: 1270, textAlign: "center", whiteSpace: "nowrap", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 86, color: "#fff", WebkitTextStroke: "14px #000", paintOrder: "stroke fill", transform: `scale(${pop})`, letterSpacing: 1 }}>
      {c.text}
    </div>
  );
};

export const NapoleonShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const stamps = [
    { t0: EV.nameStamp, lines: ["NAPOLEON", "BONAPARTE"], x: 500, y: 520, size: 84, rot: -0.04, hold: 3.0 },
    { t0: EV.y1769, lines: ["1769"], x: 360, y: 330, size: 150, rot: -0.06, hold: 2.1 },
    { t0: EV.y1793, lines: ["1793"], x: 360, y: 330, size: 150, rot: -0.06, hold: 1.9 },
    { t0: EV.y1799, lines: ["1799"], x: 360, y: 330, size: 150, rot: -0.06, hold: 2.3 },
    { t0: EV.y1804, lines: ["1804"], x: 360, y: 330, size: 150, rot: 0.05, hold: 2.3 },
    { t0: EV.y1812, lines: ["1812"], x: 360, y: 330, size: 150, rot: -0.06, hold: 2.3 },
    { t0: EV.y1815, lines: ["1815"], x: 360, y: 330, size: 150, rot: -0.06, hold: 1.7 },
    { t0: EV.myth, lines: ["MYTH"], x: 800, y: 1030, size: 100, rot: -0.28, hold: 3.6 },
  ];
  const tt = t < 3.7 ? 1 : 1 - clamp((t - 3.7) / 0.3);
  const ts = 1 + 0.7 * Math.pow(1 - clamp((t + 0.1) / 0.2), 3);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("soundtrack.mp3")} />
      {E.map((e, i) => (
        <Sequence key={e.id} from={Math.round(e.t0 * 30)} durationInFrames={Math.round((e.t1 - e.t0) * 30) + (i < E.length - 1 ? 0 : 1)} layout="none">
          <SceneLayer e={e} first={i === 0} />
        </Sequence>
      ))}
      {/* title card */}
      {t < 4 && (
        <div style={{ position: "absolute", left: 0, right: 140, top: 520, textAlign: "center", fontFamily: BUNGEE, color: "#EBCB6E", WebkitTextStroke: "16px #1b1511", paintOrder: "stroke fill", lineHeight: 0.98, transform: `scale(${ts})`, opacity: tt, textShadow: "0 12px 0 #9A7421" }}>
          <div style={{ fontSize: 420 }}>60</div>
          <div style={{ fontSize: 140 }}>SECONDS</div>
          <div style={{ fontSize: 104 }}>OF HISTORY</div>
        </div>
      )}
      {stamps.map((s, i) => <Stamp key={i} t={t} {...s} />)}
      <Captions t={t} />
      {t > EV.endCard && (
        <div style={{ position: "absolute", left: 0, right: 140, top: 1470, textAlign: "center", fontFamily: BUNGEE, fontSize: 40, color: "#EBCB6E", WebkitTextStroke: "9px #1b1511", paintOrder: "stroke fill", opacity: clamp((t - EV.endCard) / 0.35) }}>60 SECONDS OF HISTORY</div>
      )}
    </AbsoluteFill>
  );
};
