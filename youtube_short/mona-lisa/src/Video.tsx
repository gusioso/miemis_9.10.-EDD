import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { SCENES } from "./scenes";
import { H, W } from "./kit";
import type { SceneData } from "./types";

const FONT = "Inter";
for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

export const CHANNEL = "2 MINUTES OF HISTORY";
export const TITLE = "HE STOLE THE MONA LISA…";
export const SUB = "AND FOOLED THE POLICE FOR 2 YEARS";
const PANEL_Y = 600;
const PW = 1080;
const PH = 620;
const LEAD = 0.35; // crossfade between scenes

type TLScene = (typeof timeline.scenes)[number];

const ScenePanel: React.FC<{ sc: TLScene; first: boolean }> = ({ sc, first }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lead = first ? 0 : LEAD;
  const raw = frame / fps - lead;
  const t = Math.max(0, raw);
  const S: SceneData = {
    id: sc.id,
    dur: sc.end - sc.start,
    L: sc.lines.map((l) => l.start - sc.start),
    Le: sc.lines.map((l) => l.end - sc.start),
    words: sc.lines.map((l) => l.words.map((w) => ({ w: w.w, s: w.s - sc.start, e: w.e - sc.start }))),
  };
  const op = first ? 1 : interpolate(raw, [-lead, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width={PW} height={PH} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="#000" />
        {SCENES[sc.id]({ S, t })}
      </svg>
    </AbsoluteFill>
  );
};

/** Top-left date / place tag, following the story. */
const tagFor = (id: string, lt: number, sc: TLScene) => {
  const at = (li: number, re: RegExp) => { const w = sc.lines[li].words.find((x) => re.test(x.w)); return w ? w.s - sc.start : 1e9; };
  if (id === "worker") return lt >= at(2, /^August/) ? "AUGUST 21, 1911" : "PARIS — 1911";
  if (id === "years") { const k = (lt / (sc.end - sc.start)); return lt >= at(2, /^1913/) - 0.2 ? "PARIS — 1913" : k < 0.18 ? "1911" : k < 0.34 ? "1912" : "1913"; }
  if (id === "returns") return lt >= at(1, /^January/) - 0.2 ? "PARIS — JANUARY 1914" : "FLORENCE — 1913";
  return ({ hook: "PARIS · 1911", paris: "PARIS — 1911", beroud: "AUGUST 22, 1911", shock: "PARIS — 1911", police: "PARIS — 1911", missed: "PARIS",
    meeting: "FLORENCE — 1913", final: "PARIS · TODAY" } as Record<string, string>)[id] ?? "";
};

const Tag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = 0;
  timeline.scenes.forEach((sc, i) => { if (t >= sc.start - LEAD * 0.5) idx = i; });
  const sc = timeline.scenes[idx];
  const text = tagFor(sc.id, t - sc.start, sc);
  if (!text) return null;
  return (
    <div style={{
      position: "absolute", top: 18, left: 22, background: "rgba(255,255,255,0.94)", borderRadius: 14, padding: "5px 16px",
      fontFamily: FONT, fontWeight: 900, fontSize: 28, color: "#9e1b2d", letterSpacing: 1, boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
    }}>{text}</div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  for (const sc of timeline.scenes) {
    for (const l of sc.lines) {
      if (sc.id === "final" && l === sc.lines[sc.lines.length - 1]) continue;
      for (const c of l.caps) {
        if (t >= c.start && t < c.end) {
          const s = interpolate(t - c.start, [0, 0.1], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
          return (
            <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.8 - 44, display: "flex", justifyContent: "center" }}>
              <div style={{
                fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#fff", scale: String(s), letterSpacing: 1,
                WebkitTextStroke: "10px #111", paintOrder: "stroke fill", textShadow: "0 6px 10px rgba(0,0,0,0.55)", textAlign: "center", maxWidth: 980, lineHeight: 1.05,
              }}>{c.text}</div>
            </div>
          );
        }
      }
    }
  }
  return null;
};

const TitleBar: React.FC = () => (
  <div style={{ position: "absolute", top: PANEL_Y - 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ background: "#fff", borderRadius: 46, padding: "18px 46px 20px", textAlign: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.32)" }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "#9e1b2d", letterSpacing: 6 }}>{CHANNEL}</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#0a0a0a", lineHeight: 1.1, marginTop: 4 }}>{TITLE}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#3a3a3a", lineHeight: 1.1, marginTop: 4 }}>{SUB}</div>
    </div>
  </div>
);

const EndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const k = interpolate(frame, [durationInFrames - 1.1 * fps, durationInFrames - 0.15 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return k > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: k }} /> : null;
};

export const MonaLisa: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
      <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <TitleBar />
      <div style={{ position: "absolute", left: 0, top: PANEL_Y, width: PW, height: PH, overflow: "hidden", background: "#000", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
        {timeline.scenes.map((sc, i) => {
          const from = Math.max(0, Math.round((sc.start - (i ? LEAD : sc.start)) * fps));
          const to = Math.round(sc.end * fps);
          return (
            <Sequence key={sc.id} name={sc.id} from={from} durationInFrames={to - from}>
              <ScenePanel sc={sc} first={i === 0} />
            </Sequence>
          );
        })}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 110px rgba(0,0,0,0.3)", pointerEvents: "none" }} />
        <Tag />
        <Captions />
      </div>
      <EndFade />
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
