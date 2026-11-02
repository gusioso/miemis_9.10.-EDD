import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { SCENES } from "./scenes";
import { EMOJI, FONT, WH, WW, ip } from "./ui";

for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

export const TITLE = "What If Hypergamy Didn't Exist?";
const PANEL_Y = 560;
const PW = 1080;
const PH = 620;

type TLScene = (typeof timeline.scenes)[number];

// One scene inside the 16:9 panel, with its camera.
const ScenePanel: React.FC<{ sc: TLScene }> = ({ sc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const S = {
    id: sc.id,
    dur: sc.end - sc.start,
    lines: sc.lines.map((l) => ({ start: l.start - sc.start, end: l.end - sc.start, text: l.text })),
  };
  const { body, camera } = SCENES[sc.id]({ S, t });
  const [z, cx, cy] = camera;
  const cw = WW / z;
  const ch = WH / z;
  const x0 = Math.min(Math.max(cx - cw / 2, 0), WW - cw);
  const y0 = Math.min(Math.max(cy - ch / 2, 0), WH - ch);
  const fade = Math.min(ip(t, 0, 0.12, 0, 1, Easing.linear), ip(t, S.dur - 0.08, S.dur, 1, 0, Easing.linear));
  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: "#000" }}>
      <svg width={PW} height={PH} viewBox={`${x0} ${y0} ${cw} ${ch}`} preserveAspectRatio="none">
        {body}
      </svg>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string; color?: string; right?: boolean }> = ({ text, color = "#0a0a0a", right }) => (
  <div style={{
    position: "absolute", top: 16, [right ? "right" : "left"]: 100, background: "rgba(255,255,255,0.93)",
    borderRadius: 12, padding: "4px 14px", fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 900, fontSize: 28, color,
  }}>{text}</div>
);

// Top-left time tag + top-right matches counter.
const Tags: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = timeline.scenes.findIndex((s) => t >= s.start && t < s.end);
  const sc = timeline.scenes[Math.max(0, idx)];
  if (!sc) return null;
  let matches: React.ReactNode = null;
  if (sc.matches !== null) {
    const prev = timeline.scenes.slice(0, Math.max(0, idx)).reverse().find((s) => s.matches !== null)?.matches ?? 0;
    const n = Math.round(interpolate(t, [sc.start, sc.start + 1.0], [prev, sc.matches], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const wed = sc.id === "wedding";
    matches = <Tag right text={wed ? "💍 MATCHES: 1 (FOREVER)" : `💘 MATCHES: ${n}`} color={wed ? "#c2185b" : "#0a0a0a"} />;
  }
  return (
    <>
      {sc.tag ? <Tag text={sc.tag} /> : null}
      {matches}
    </>
  );
};

// Word-synced captions (2-3 word chunks), popping in.
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  for (const sc of timeline.scenes) {
    for (const l of sc.lines) {
      for (const c of l.caps) {
        if (t >= c.start && t < c.end) {
          const sc_ = interpolate(t - c.start, [0, 0.12], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
          return (
            <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.8 - 48, display: "flex", justifyContent: "center" }}>
              <div style={{
                fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 800, fontSize: 64, color: "#fff", scale: String(sc_),
                WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "0 5px 8px rgba(0,0,0,0.6)", textAlign: "center", maxWidth: 860,
              }}>{c.text}</div>
            </div>
          );
        }
      }
    }
  }
  return null;
};

const Box: React.FC<{ text: string; size: number; top: number }> = ({ text, size, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{
      background: "#fff", borderRadius: 22, padding: `${size * 0.3}px 28px`, maxWidth: 860, textAlign: "center",
      fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.25, color: "#0a0a0a", boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    }}>{text}</div>
  </div>
);

export const HypergamyShort: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
      <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <Box text={TITLE} size={44} top={PANEL_Y - 36 - 140} />
      <div style={{ position: "absolute", left: 0, top: PANEL_Y, width: PW, height: PH, overflow: "hidden", background: "#000" }}>
        {timeline.scenes.map((sc) => (
          <Sequence key={sc.id} name={sc.id} from={Math.round(sc.start * fps)} durationInFrames={Math.round((sc.end - sc.start) * fps)}>
            <ScenePanel sc={sc} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={Math.round(timeline.scenes[0].start * fps) + 1}>
          <AbsoluteFill style={{ background: "#c8d0ec" }} />
        </Sequence>
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.35)" }} />
        <Tags />
        <Captions />
      </div>
      <Box text="Part 1" size={54} top={PANEL_Y + PH + 50} />
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
