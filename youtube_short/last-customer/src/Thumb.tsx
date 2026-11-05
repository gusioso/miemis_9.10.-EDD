import { AbsoluteFill, Img, staticFile } from "remotion";
import { View } from "./kit";
import { FLOOR, Footprints, Interior, LedClock, SPOT_X, Stranger } from "./station";

// Thumbnail: the stranger in the doorway, the red clock at 11:59, one question.
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
    <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1280, height: 2276, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: 40, top: 150, width: 1200, height: 540, overflow: "hidden", borderRadius: 28, border: "8px solid #0a0a0a", boxShadow: "0 14px 30px rgba(0,0,0,0.45)" }}>
      <svg width={1184} height={680} viewBox="0 0 2160 1240" style={{ marginTop: -60 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <View c={[1.55, 760, 560]}>
          <Interior t={1.0} clock="11:59 PM" radio={false}>
            <Footprints k={1} />
            <Stranger x={SPOT_X} look={1} eyes={0.6} />
          </Interior>
        </View>
        <LedClock x={1640} y={300} text="11:59 PM" s={2.1} />
        <rect x={0} y={FLOOR + 120} width={2160} height={200} fill="#000" opacity={0} />
      </svg>
    </div>
    <div style={{ position: "absolute", top: 24, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#fffffb", borderRadius: 999, padding: "14px 50px", border: "5px solid #141419", fontFamily: "Inter", fontWeight: 900, fontSize: 68,
        color: "#141419", boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>“WHAT TIME IS IT?”</div>
    </div>
  </AbsoluteFill>
);
