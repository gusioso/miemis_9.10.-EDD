import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { SCENES } from "./scenes";
import { H, W } from "./kit";

const FONT = "Inter";
const EMOJI = "Noto Color Emoji";
for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

export const TITLE = "What If Everyone Became a Millionaire?";
const PANEL_Y = 560;
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
  const S = {
    id: sc.id,
    dur: sc.end - sc.start,
    ev: sc.ev as unknown as Record<string, number>,
    L: sc.lines.map((l) => l.start - sc.start),
    Le: sc.lines.map((l) => l.end - sc.start),
  };
  const op = first ? interpolate(frame / fps, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }) : interpolate(raw, [-lead, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width={PW} height={PH} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="#000" />
        {SCENES[sc.id]({ S, t })}
      </svg>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string; right?: boolean; color?: string }> = ({ text, right, color = "#0a0a0a" }) => (
  <div style={{
    position: "absolute", top: 18, [right ? "right" : "left"]: 22, background: "rgba(255,255,255,0.94)", borderRadius: 14,
    padding: "5px 16px", fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 900, fontSize: 28, color, fontVariantNumeric: "tabular-nums",
    boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
  }}>{text}</div>
);

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const abs = (id: string, name: string) => {
  const sc = timeline.scenes.find((s) => s.id === id)!;
  return sc.start + (sc.ev as unknown as Record<string, number>)[name];
};
// Alex's balance over the whole video: [time, value, ease seconds]
const BAL: [number, number, number][] = [
  [abs("notify", "clock"), 83.47, 0],
  [abs("notify", "million") + 0.15, 1000083.47, 1.2],
  [abs("spend", "buy") + 0.2, 950083.47, 0.7],
  [abs("prices", "alex") + 0.4, 949212.65, 1.0],
  [abs("bakery", "explain"), 948912.2, 0.8],
];
const balanceAt = (t: number) => {
  if (t < BAL[0][0]) return null;
  let v = BAL[0][1];
  for (let i = 1; i < BAL.length; i++) {
    const [t0, val, d] = BAL[i];
    if (t >= t0) v = d ? interpolate(t, [t0, t0 + d], [v, val], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : val;
  }
  return v;
};

const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = 0;
  timeline.scenes.forEach((s, i) => { if (t >= s.start - LEAD * 0.5) idx = i; });
  const sc = timeline.scenes[idx];
  const lt = t - sc.start;
  const ev = sc.ev as unknown as Record<string, number>;
  let tag: string | null = sc.tag;
  if (sc.id === "notify") tag = lt < ev.clock ? "DAY 1 · 6:59 AM" : "DAY 1 · 7:00 AM";
  if (sc.id === "morning") tag = lt < ev.news ? "DAY 1 · 7:05 AM" : "DAY 1 · 8:00 AM";
  const bal = balanceAt(t);
  return (
    <>
      {tag ? <Tag text={tag} /> : null}
      {bal !== null ? <Tag right text={`🏦 ALEX ${money(bal)}`} color={bal > 1000 ? "#127a3e" : "#0a0a0a"} /> : null}
    </>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  for (const sc of timeline.scenes) {
    for (const l of sc.lines) {
      for (const c of l.caps) {
        if (t >= c.start && t < c.end) {
          const s = interpolate(t - c.start, [0, 0.1], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
          return (
            <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.79 - 46, display: "flex", justifyContent: "center" }}>
              <div style={{
                fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 900, fontSize: 68, color: "#fff", scale: String(s), letterSpacing: 1,
                WebkitTextStroke: "10px #111", paintOrder: "stroke fill", textShadow: "0 6px 10px rgba(0,0,0,0.55)", textAlign: "center",
                maxWidth: 980, lineHeight: 1.05,
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
      background: "#fff", borderRadius: 999, padding: `${size * 0.42}px 44px`, maxWidth: 960, textAlign: "center",
      fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.2, color: "#0a0a0a", boxShadow: "0 8px 22px rgba(0,0,0,0.32)",
    }}>{text}</div>
  </div>
);

export const MillionaireShort: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
      <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <Box text={TITLE} size={46} top={PANEL_Y - 150} />
      <div style={{
        position: "absolute", left: 0, top: PANEL_Y, width: PW, height: PH, overflow: "hidden", background: "#000",
        boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
      }}>
        {timeline.scenes.map((sc, i) => {
          const from = Math.max(0, Math.round((sc.start - (i ? LEAD : sc.start)) * fps));
          const to = Math.round(sc.end * fps);
          return (
            <Sequence key={sc.id} name={sc.id} from={from} durationInFrames={to - from}>
              <ScenePanel sc={sc} first={i === 0} />
            </Sequence>
          );
        })}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 110px rgba(0,0,0,0.32)", pointerEvents: "none" }} />
        <Hud />
        <Captions />
      </div>
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
