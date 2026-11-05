import { AbsoluteFill, Img, staticFile } from "remotion";
import timeline from "./timeline.json";
import { SCENES } from "./scenes";
import type { Pause } from "./freeze";

// Thumbnail: the "No connection" phone close-up from scene 1 on the circuit background, with a big question.
const sc = timeline.scenes[0];
const S = {
  id: sc.id, dur: sc.end - sc.start, ev: sc.ev as unknown as Record<string, number>,
  L: sc.lines.map((l) => l.start), Le: sc.lines.map((l) => l.end), pauses: sc.pauses as Pause[],
};

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0e1834" }}>
    <Img src={staticFile("bg_circuit.png")} style={{ position: "absolute", inset: 0, width: 1280, height: 2276, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: 40, top: 160, width: 1200, height: 530, overflow: "hidden", borderRadius: 28, border: "8px solid #0a0a0a", boxShadow: "0 14px 30px rgba(0,0,0,0.45)" }}>
      <svg width={1184} height={680} viewBox="0 0 2160 1240" style={{ marginTop: -60 }}>
        {SCENES.hook({ S, t: S.ev.noconn + 0.6 })}
      </svg>
      <div style={{ position: "absolute", right: 26, top: 26, background: "#e0263a", color: "#fff", borderRadius: 22, padding: "8px 26px",
        fontFamily: "Inter", fontWeight: 900, fontSize: 64, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>30 DAYS</div>
    </div>
    <div style={{ position: "absolute", top: 26, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#fffffb", borderRadius: 999, padding: "14px 46px", border: "5px solid #141419", fontFamily: "Inter", fontWeight: 900, fontSize: 64,
        color: "#141419", boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>THE INTERNET IS GONE?</div>
    </div>
  </AbsoluteFill>
);
