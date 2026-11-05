import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";
import { Stick, StickProps } from "./Stick";
import { LUSTIG } from "./kit";
import { Cloud, Rooftops, Sky, Stamp, Tower } from "./sets";

loadFont({ family: "Inter", url: staticFile("fonts/Inter-Black.otf"), weight: "900" });

// 1280 x 720 thumbnail: the tower stamped SOLD, Lustig with the envelope, the question in big letters.
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <svg width={1280} height={720} viewBox="0 0 2160 1215">
      <defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter></defs>
      <Sky id="thSky" top="#2f4f86" bot="#f2b27a" />
      <Cloud x={300} y={160} s={1.4} o={0.6} col="#f6c79a" />
      <Rooftops y={1060} s={0.8} seed={3} col="#e4d3b2" />
      <Tower x={1560} yb={1060} h={1000} glow={0.6} />
      <Rooftops y={1180} s={1.1} seed={9} col="#eadcbf" />
      <Stamp x={1560} y={560} text="SOLD" t={1} t0={0} size={240} rot={-12} />
      <Stick {...(LUSTIG as unknown as StickProps)} x={520} yf={1215} u={1.45} t={0.4} facing={1} expr="smug" arms={["down", "hold"]} hold="envelope" />
    </svg>
    <div style={{ position: "absolute", left: 36, top: 34, width: 700, fontFamily: "Inter", fontWeight: 900, fontSize: 92, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "12px #111", paintOrder: "stroke fill" }}>
      HE SOLD THE <span style={{ color: "#ffd21f" }}>EIFFEL TOWER?!</span>
    </div>
  </AbsoluteFill>
);
