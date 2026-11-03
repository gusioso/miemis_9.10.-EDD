import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import timeline from "./timeline.json";
import { Scene3D } from "./Scene3D";

const FONT = "Inter";
for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}
const E = timeline.ev;
const PANEL_Y = 560;
const PW = 1080;
const PH = 620;

const Tag: React.FC<{ text: string; right?: boolean; color?: string }> = ({ text, right, color = "#0a0a0a" }) => (
  <div style={{
    position: "absolute", top: 18, [right ? "right" : "left"]: 22, background: "rgba(255,255,255,0.94)", borderRadius: 14, padding: "5px 16px",
    fontFamily: FONT, fontWeight: 900, fontSize: 28, color, boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
  }}>{text}</div>
);

const Captions: React.FC<{ t: number }> = ({ t }) => {
  for (const l of timeline.lines) {
    for (const c of l.caps) {
      if (t >= c.start && t < c.end) {
        const s = interpolate(t - c.start, [0, 0.12], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.2)) });
        const hot = /GRAVITY|SWITCHED|FLOATS|YOU\./.test(c.text);
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.77 - 46, display: "flex", justifyContent: "center" }}>
            <div style={{
              fontFamily: FONT, fontWeight: 900, fontSize: 70, color: hot ? "#ffe36b" : "#fff", scale: String(s), letterSpacing: 1,
              WebkitTextStroke: "11px #1a1220", paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(0,0,0,0.6)", textAlign: "center", maxWidth: 980, lineHeight: 1.05,
            }}>{c.text}</div>
          </div>
        );
      }
    }
  }
  return null;
};

export const GravityShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const off = t >= E.off;
  const flash = off ? 1 - Math.min(1, (t - E.off) / 0.3) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
      <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <div style={{ position: "absolute", top: PANEL_Y - 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 999, padding: "18px 40px", whiteSpace: "nowrap", fontFamily: FONT, fontWeight: 800, fontSize: 46,
          color: "#0a0a0a", boxShadow: "0 8px 22px rgba(0,0,0,0.32)",
        }}>What If Gravity Switched Off?</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: PANEL_Y, width: PW, height: PH, overflow: "hidden", background: "#000", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
        <ThreeCanvas width={PW} height={PH} shadows camera={{ fov: 42, near: 0.1, far: 40, position: [0, 1.4, 4.4] }}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, antialias: true }}>
          <Scene3D t={t} />
        </ThreeCanvas>
        <div style={{ position: "absolute", inset: 0, background: "#bfe9ff", opacity: flash * 0.45, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(40,20,10,0.35)", pointerEvents: "none" }} />
        <Tag text="DAY 1 · 7:30 AM" />
        <Tag right text={off ? "🌍 GRAVITY: OFF" : "🌍 GRAVITY: ON"} color={off ? "#d0182e" : "#127a3e"} />
        <Captions t={t} />
      </div>
      <div style={{ position: "absolute", top: 1240, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#141419", color: "#fff", borderRadius: 999, padding: "8px 26px", fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 5 }}>PART 1</div>
      </div>
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
