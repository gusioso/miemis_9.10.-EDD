import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";
import { Stick, StickProps } from "./Stick";
import { PERUGGIA } from "./kit";
import { EmptySpot, MonaLisa } from "./sets2";

loadFont({ family: "Inter", url: staticFile("fonts/Inter-Black.otf"), weight: "900" });

// 1280 x 720 thumbnail: the empty wall, the thief holding the painting, the question in big letters.
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#7a2a26" }}>
    <svg width={1280} height={720} viewBox="0 0 2160 1215">
      <defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter></defs>
      <rect x={0} y={0} width={2160} height={1215} fill="#7a2a26" />
      <rect x={0} y={950} width={2160} height={265} fill="#e9e2d2" />
      <EmptySpot x={1560} y={220} w={360} />
      <MonaLisa x={820} y={360} w={400} glow={0.7} />
      <Stick {...(PERUGGIA as unknown as StickProps)} x={620} yf={1215} u={1.35} t={0.4} facing={1} expr="suspicious" look={0.8} arms={["down", "hold"]} />
      <text x={1740} y={560} fontFamily="Inter" fontWeight={900} fontSize={260} fill="#c41e2a" stroke="#fff" strokeWidth={12} paintOrder="stroke" textAnchor="middle" dominantBaseline="central">?</text>
    </svg>
    <div style={{ position: "absolute", left: 36, top: 30, width: 1200, fontFamily: "Inter", fontWeight: 900, fontSize: 84, lineHeight: 1.0, color: "#fff", WebkitTextStroke: "12px #111", paintOrder: "stroke fill" }}>
      HE STOLE THE <span style={{ color: "#ffd21f" }}>MONA LISA</span>
    </div>
  </AbsoluteFill>
);
