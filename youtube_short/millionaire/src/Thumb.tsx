import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Stick } from "./Stick";
import { Shelves } from "./env2";
import { ALEX } from "./kit";

// Thumbnail / cover: "Honest Ledger" approach again — two fields, one figure, one number.
// Left: a glowing $1,000,000 balance and a laughing Alex with a money bag. Right: the same morning's empty shelves.
const Split: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const t = 1.1;
  return (
    <svg width={w} height={h} viewBox="0 0 2160 1240">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="rich" cx="0.5" cy="0.45" r="0.65"><stop offset="0" stopColor="#3fa86a" /><stop offset="1" stopColor="#14462d" /></radialGradient>
        <radialGradient id="poor" cx="0.5" cy="0.45" r="0.65"><stop offset="0" stopColor="#5b6483" /><stop offset="1" stopColor="#262b40" /></radialGradient>
        <clipPath id="th-r"><rect x={1080} y={0} width={1080} height={1240} /></clipPath>
      </defs>
      <rect x={0} y={0} width={1080} height={1240} fill="url(#rich)" />
      <rect x={1080} y={0} width={1080} height={1240} fill="url(#poor)" />
      <g clipPath="url(#th-r)">
        <Shelves x={1150} y={240} w={940} rows={4} stock={0.05} seed={3} />
      </g>
      <rect x={1074} y={0} width={12} height={1240} fill="#fffaf0" />
      <text x={540} y={250} fontFamily="Inter" fontWeight={900} fontSize={150} fill="#7dffb0" textAnchor="middle" dominantBaseline="central"
        stroke="#0b2a19" strokeWidth={10} paintOrder="stroke" filter="url(#glow)">$1,000,000</text>
      <Stick t={t} x={540} yf={1180} u={1.15} {...ALEX} arms={["cheer", "hold"]} hold="bag" expr="laugh" seed={1} />
      <text x={1620} y={130} fontFamily="Inter" fontWeight={900} fontSize={110} fill="#ff5a6a" textAnchor="middle" dominantBaseline="central"
        stroke="#1a0b10" strokeWidth={8} paintOrder="stroke">SOLD OUT</text>
      <Stick t={t} x={1620} yf={1180} u={1.15} {...ALEX} arms={["shrug", "shrug"]} expr="worried" seed={1} />
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
      <Capsule text="EVERYONE IS A MILLIONAIRE?" size={62} />
    </div>
  </AbsoluteFill>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
    <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Capsule text="What If Everyone Became a Millionaire?" size={46} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 560, width: 1080, height: 620, overflow: "hidden", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
      <Split w={1080} h={620} />
    </div>
    <div style={{ position: "absolute", top: 1250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Capsule text="WOULD YOU STILL WORK?" size={60} />
    </div>
  </AbsoluteFill>
);
