import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { SCENES } from "./scenes";
import type { Pause } from "./freeze";
import { H, W } from "./kit";

const FONT = "Inter";
const EMOJI = "Noto Color Emoji";
for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

export const TITLE = "What If You Could Pause Time?";
const PANEL_Y = 560;
const PW = 1080;
const PH = 620;
const LEAD = 0.35; // crossfade between scenes

type TLScene = (typeof timeline.scenes)[number];
const allPauses: Pause[] = timeline.scenes.flatMap((s) => s.pauses as Pause[]);

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
    pauses: (sc.pauses as Pause[]).map((p) => ({ ...p, start: p.start - sc.start, end: p.end - sc.start })),
  };
  const op = first ? 1 : interpolate(raw, [-lead, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
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

const Tag: React.FC<{ text: string; right?: boolean; color?: string; bg?: string }> = ({ text, right, color = "#0a0a0a", bg = "rgba(255,255,255,0.94)" }) => (
  <div style={{
    position: "absolute", top: 18, [right ? "right" : "left"]: 22, background: bg, borderRadius: 14,
    padding: "5px 16px", fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 900, fontSize: 28, color, fontVariantNumeric: "tabular-nums",
    boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
  }}>{text}</div>
);

const tagOf = (sc: TLScene) => sc.tag as string | null;
const dayOf = (sc: TLScene) => { const g = tagOf(sc); return g ? g.split("·")[0].trim() : sc.id; };

/** Alex's presses left today: 1, minus his pauses that started earlier in scenes of the same day. */
const leftAt = (t: number) => {
  let idx = 0;
  timeline.scenes.forEach((s, i) => { if (t >= s.start - LEAD * 0.5) idx = i; });
  const day = dayOf(timeline.scenes[idx]);
  const used = timeline.scenes.filter((s) => dayOf(s) === day).flatMap((s) => s.pauses as Pause[]).filter((p) => p.owner === "alex" && t >= p.start).length;
  return { idx, left: Math.max(0, 1 - used) };
};

const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { idx, left } = leftAt(t);
  const sc = timeline.scenes[idx];
  return (
    <>
      {tagOf(sc) ? <Tag text={tagOf(sc)!} /> : null}
      <Tag right text={`⏸ PAUSES LEFT: ${left}`} color={left ? "#d0182e" : "#7b7f8c"} />
    </>
  );
};

const OWNER_COL: Record<string, string> = { alex: "#6fd8ff", mia: "#ffd21f", other: "#ffd21f" };

/** Big digital countdown under the story window while time is paused: 00:10 -> 00:00 in real seconds. */
const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = allPauses.find((q) => t >= q.start && t < q.end + 0.8);
  if (!p) return null;
  const rem = Math.max(0, Math.ceil(p.end - t - 1e-6));
  const into = t - p.start;
  const s = interpolate(into, [0, 0.22], [0.6, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.4)) });
  const op = interpolate(t, [p.start, p.start + 0.1, p.end + 0.5, p.end + 0.8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = (t - p.start) % 1;
  const bump = 1 + 0.06 * Math.max(0, 1 - tick / 0.18);
  const col = OWNER_COL[p.owner] ?? "#6fd8ff";
  const done = t >= p.end;
  const blink = done && Math.floor((t - p.end) * 8) % 2 === 1;
  return (
    <div style={{ position: "absolute", top: PANEL_Y + PH + 40, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        scale: String(s * bump), background: "#0c1222", border: `6px solid ${col}`, borderRadius: 34, padding: "6px 46px 12px",
        boxShadow: `0 0 34px ${col}88, 0 10px 24px rgba(0,0,0,0.4)`, textAlign: "center",
      }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: col, opacity: 0.9 }}>
          {done ? "TIME RESUMES" : "⏸ TIME PAUSED"}
        </div>
        <div style={{
          fontFamily: FONT, fontWeight: 900, fontSize: 150, lineHeight: 1, color: blink ? "#0c1222" : "#ffffff", fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 18px ${col}, 0 0 4px ${col}`, letterSpacing: 4,
        }}>{`00:${String(rem).padStart(2, "0")}`}</div>
      </div>
    </div>
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
                fontFamily: `${FONT}, ${EMOJI}`, fontWeight: 900, fontSize: 68, color: c.voice === "mia" ? "#ffd21f" : "#fff", scale: String(s), letterSpacing: 1,
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
      background: "#fff", borderRadius: 999, padding: `${size * 0.42}px 40px`, maxWidth: 1040, whiteSpace: "nowrap", textAlign: "center",
      fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.2, color: "#0a0a0a", boxShadow: "0 8px 22px rgba(0,0,0,0.32)",
    }}>{text}</div>
  </div>
);

const Label: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{
      background: "#141419", color: "#fff", borderRadius: 999, padding: "8px 26px", fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 5,
      boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
    }}>{text}</div>
  </div>
);

export const PauseShort: React.FC = () => {
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
      <Countdown />
      <Label text="FULL STORY" top={1560} />
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
