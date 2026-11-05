import { AbsoluteFill, Img, staticFile } from "remotion";
import timeline from "./timeline.json";
import { hook } from "./s1_hook";
import type { Pause } from "./freeze";

// Thumbnail: the frozen rain street from the hook, Alex touching the floating drop, a big 00:10 countdown.
const sc = timeline.scenes[0];
const S = {
  id: sc.id, dur: sc.end - sc.start, ev: sc.ev as unknown as Record<string, number>,
  L: sc.lines.map((l) => l.start), Le: sc.lines.map((l) => l.end), pauses: sc.pauses as Pause[],
};

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
    <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1280, height: 2276, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: 40, top: 150, width: 1200, height: 540, overflow: "hidden", borderRadius: 28, border: "8px solid #141419", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
      <svg width={1184} height={680} viewBox="0 0 2160 1240" style={{ marginTop: -70 }}>
        {hook({ S, t: S.ev.touch + 0.25 })}
      </svg>
      <div style={{
        position: "absolute", right: 30, top: 26, background: "#0c1222", border: "6px solid #6fd8ff", borderRadius: 26, padding: "0 30px 6px",
        fontFamily: "Inter", fontWeight: 900, fontSize: 120, color: "#fff", textShadow: "0 0 18px #6fd8ff", boxShadow: "0 0 30px #6fd8ff88",
      }}>00:10</div>
    </div>
    <div style={{ position: "absolute", top: 26, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{
        background: "#fffffb", borderRadius: 999, padding: "14px 46px", border: "5px solid #141419", fontFamily: "Inter", fontWeight: 900, fontSize: 64,
        color: "#141419", boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
      }}>WHAT IF YOU COULD PAUSE TIME?</div>
    </div>
  </AbsoluteFill>
);
