import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { LieCounter, Stick } from "./Stick";
import { ALEX, ROSE, VICTOR } from "./kit";

// Thumbnail / cover in the video's style ("Honest Ledger": two fields, two figures, two glowing numbers).
const Split: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const t = 1.3;
  return (
    <svg width={w} height={h} viewBox="0 0 2160 1240">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        <radialGradient id="cool" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#3c5784" /><stop offset="1" stopColor="#1c2742" /></radialGradient>
        <radialGradient id="warm" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#ffc685" /><stop offset="1" stopColor="#d9884e" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1240} fill="url(#cool)" />
      <rect x={1080} y={0} width={1080} height={1240} fill="url(#warm)" />
      <rect x={0} y={1110} width={2160} height={130} fill="#000" opacity={0.18} />
      <rect x={1074} y={0} width={12} height={1240} fill="#fffaf0" />
      <Stick t={t} x={540} yf={1140} u={1.2} {...VICTOR} arms={["down", "chest"]} expr="smug" look={0.5} seed={30} />
      <Stick t={t} x={1620} yf={1140} u={1.2} {...ROSE} arms={["down", "down"]} expr="warm" look={-0.5} seed={60} />
      <LieCounter x={540} y={1140 - 1.2 * 702} t={t} steps={[[-100, 0]]} u={1.9} tone="green" />
      <LieCounter x={1620} y={1140 - 1.2 * 742} t={t} steps={[[-100, 48]]} u={1.9} tone="red" />
      <Stick t={t} x={1080} yf={1230} u={0.78} {...ALEX} arms={["down", "chin"]} expr="thinking" look={0} lookY={-0.4} seed={1} />
    </svg>
  );
};

const Capsule: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div style={{
    background: "#fffffb", borderRadius: 999, padding: `${size * 0.22}px ${size * 0.7}px`, border: `${size * 0.08}px solid #141419`,
    fontFamily: "Inter", fontWeight: 900, fontSize: size, color: "#141419", letterSpacing: size * 0.01, lineHeight: 1.05, textAlign: "center",
    boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
  }}>{text}</div>
);

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
    <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1280, height: 2276, objectFit: "cover" }} />
    <div style={{ position: "absolute", left: 56, top: 170, width: 1168, height: 506, overflow: "hidden", borderRadius: 28, border: "8px solid #141419", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
      <Split w={1152} h={662} />
    </div>
    <div style={{ position: "absolute", top: 30, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Capsule text="WHO WOULD YOU TRUST?" size={70} />
    </div>
  </AbsoluteFill>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
    <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Capsule text="What If Everyone Had a Lie Counter?" size={50} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 560, width: 1080, height: 620, overflow: "hidden", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
      <Split w={1080} h={620} />
    </div>
    <div style={{ position: "absolute", top: 1250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Capsule text="WHO WOULD YOU TRUST?" size={60} />
    </div>
  </AbsoluteFill>
);
