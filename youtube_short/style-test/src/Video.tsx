import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { H, View, W, cam, ip, shot } from "./kit";
import { Hero, LINE } from "./Hero";

const FONT = "Inter";
for (const [file, weight] of [["Inter-SemiBold.otf", "600"], ["Inter-ExtraBold.otf", "800"], ["Inter-Black.otf", "900"]]) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}
const E = timeline.ev;
const PANEL_Y = 560;
const PW = 1080;
const PH = 620;
const FLOOR = 1010;
const SPEED = 260; // world px / s while walking

const hash = (i: number, s = 1) => {
  const v = Math.sin(i * 127.1 * s + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Draw a repeating strip: tiles of width tw, scrolled by off. */
const strip = (off: number, tw: number, draw: (x: number, i: number) => React.ReactNode, from = -600, to = W + 600) => {
  const o = ((off % tw) + tw) % tw;
  const base = Math.floor(off / tw);
  const out: React.ReactNode[] = [];
  for (let x = from - o, k = 0; x < to; x += tw, k++) out.push(<g key={k}>{draw(x, k - base)}</g>);
  return out;
};

// ------------------------------------------------------------------ the world: a cosy night street, 4 parallax layers
const NightStreet: React.FC<{ t: number; d: number }> = ({ t, d }) => (
  <g>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0b1036" />
        <stop offset="0.45" stopColor="#2b2470" />
        <stop offset="0.75" stopColor="#7a3f85" />
        <stop offset="1" stopColor="#e88a6e" />
      </linearGradient>
      <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe3a0" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a3150" />
        <stop offset="1" stopColor="#221c30" />
      </linearGradient>
    </defs>
    <rect x={-800} y={-400} width={W + 1600} height={FLOOR + 400} fill="url(#sky)" />
    {Array.from({ length: 90 }).map((_, i) => {
      const x = hash(i, 3) * (W + 400) - 200 - d * 0.03;
      const y = hash(i, 7) * 620 - 60;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + hash(i, 9) * 2) + i));
      const r = 2 + hash(i, 5) * 3.5;
      return <circle key={i} cx={x} cy={y} r={r} fill="#fff6d8" opacity={tw * (y < 520 ? 1 : 0.4)} />;
    })}
    {/* far skyline */}
    {strip(d * 0.15, 260, (x, i) => {
      const h = 300 + hash(i, 11) * 260;
      return (
        <g>
          <rect x={x} y={FLOOR - 160 - h} width={240} height={h + 200} fill="#2a2556" />
          {Array.from({ length: 10 }).map((_, j) => (hash(i * 10 + j, 13) > 0.62 ? (
            <rect key={j} x={x + 26 + (j % 4) * 52} y={FLOOR - 120 - h + Math.floor(j / 4) * 70} width={22} height={30} fill="#ffcf7a" opacity={0.55} />
          ) : null))}
        </g>
      );
    })}
    {/* mid buildings with warm windows, awnings, a neon sign and string lights */}
    {strip(d * 0.45, 560, (x, i) => {
      const cols = ["#5b4a86", "#7a4f74", "#3f5a86", "#6a5a8e", "#865a6a"];
      const c = cols[((i % 5) + 5) % 5];
      const h = 620 + hash(i, 17) * 160;
      const neon = ((i % 3) + 3) % 3 === 1;
      return (
        <g>
          <rect x={x + 20} y={FLOOR - 40 - h} width={520} height={h} fill={c} stroke={LINE} strokeWidth={6} />
          <rect x={x + 4} y={FLOOR - 70 - h} width={552} height={40} rx={8} fill="#2f2848" stroke={LINE} strokeWidth={5} />
          {Array.from({ length: 6 }).map((_, j) => {
            const wx = x + 70 + (j % 3) * 150;
            const wy = FLOOR - h + 40 + Math.floor(j / 3) * 190;
            const lit = hash(i * 6 + j, 19) > 0.35;
            return (
              <g key={j}>
                <rect x={wx - 8} y={wy - 8} width={106} height={136} rx={10} fill="#2a2240" />
                <rect x={wx} y={wy} width={90} height={120} rx={6} fill={lit ? "#ffd27a" : "#3b3460"} stroke={LINE} strokeWidth={5} />
                {lit ? <rect x={wx} y={wy} width={90} height={120} rx={6} fill="#ff9e4a" opacity={0.25 + 0.1 * Math.sin(t * 2 + j)} /> : null}
                <line x1={wx + 45} y1={wy} x2={wx + 45} y2={wy + 120} stroke={LINE} strokeWidth={4} />
                {lit && hash(j, i + 23) > 0.6 ? <path d={`M ${wx + 10} ${wy + 120} q 15 -40 30 0 q 10 -30 30 0`} fill="#4fa36a" stroke={LINE} strokeWidth={3} /> : null}
                <rect x={wx - 12} y={wy + 120} width={114} height={14} rx={4} fill="#d9c6a8" stroke={LINE} strokeWidth={4} />
              </g>
            );
          })}
          {neon ? (
            <g>
              <rect x={x + 150} y={FLOOR - 330} width={260} height={90} rx={20} fill="#1d1630" stroke={LINE} strokeWidth={5} />
              <text x={x + 280} y={FLOOR - 283} fontFamily={FONT} fontWeight={900} fontSize={50} fill="#ff6fb5" textAnchor="middle" dominantBaseline="central"
                style={{ filter: "drop-shadow(0 0 10px #ff4fa0)" }} opacity={0.85 + 0.15 * Math.sin(t * 13)}>NOODLES</text>
            </g>
          ) : (
            <path d={`M ${x + 40} ${FLOOR - 250} h 480 l -30 70 h -420 Z`} fill={((i % 2) + 2) % 2 ? "#e0566c" : "#3f9a8a"} stroke={LINE} strokeWidth={5} />
          )}
          {/* string lights to the next building */}
          <path d={`M ${x + 540} ${FLOOR - 470} Q ${x + 820} ${FLOOR - 380} ${x + 1100} ${FLOOR - 470}`} fill="none" stroke="#1d1630" strokeWidth={4} />
          {Array.from({ length: 9 }).map((_, j) => {
            const k = (j + 1) / 10;
            const bx = x + 540 + 560 * k;
            const by = FLOOR - 470 + 4 * 90 * k * (1 - k) * 0.95 * 1.0 + 0;
            return <circle key={j} cx={bx} cy={by + 12} r={9} fill={["#ffd27a", "#ff8fb0", "#9fe3ff"][j % 3]} opacity={0.75 + 0.25 * Math.sin(t * 4 + j + i)} />;
          })}
        </g>
      );
    })}
    {/* sidewalk + road */}
    <rect x={-800} y={FLOOR - 40} width={W + 1600} height={80} fill="#5a4e6e" stroke={LINE} strokeWidth={5} />
    {strip(d, 180, (x) => <line x1={x} y1={FLOOR - 40} x2={x - 30} y2={FLOOR + 40} stroke="#4a3f5e" strokeWidth={4} />)}
    <rect x={-800} y={FLOOR + 40} width={W + 1600} height={400} fill="url(#road)" />
    {strip(d, 520, (x) => <rect x={x} y={FLOOR + 150} width={240} height={16} rx={8} fill="#e8dcc0" opacity={0.5} />)}
    {/* street lamps with light cones and glossy reflections */}
    {strip(d, 1100, (x, i) => (
      <g>
        <path d={`M ${x + 200} ${FLOOR - 640} L ${x + 40} ${FLOOR + 40} L ${x + 360} ${FLOOR + 40} Z`} fill="url(#cone)" />
        <ellipse cx={x + 200} cy={FLOOR + 30} rx={220} ry={34} fill="#ffd98a" opacity={0.18} />
        <ellipse cx={x + 200} cy={FLOOR + 200} rx={60} ry={160} fill="#ffd98a" opacity={0.07} />
        <rect x={x + 190} y={FLOOR - 640} width={20} height={640} fill="#1f1a2c" stroke={LINE} strokeWidth={4} />
        <path d={`M ${x + 160} ${FLOOR - 640} h 80 l -12 -50 h -56 Z`} fill="#2a2440" stroke={LINE} strokeWidth={5} />
        <circle cx={x + 200} cy={FLOOR - 650} r={120} fill="url(#lampglow)" />
        <circle cx={x + 200} cy={FLOOR - 648} r={16} fill="#fff2c4" />
        {((i % 2) + 2) % 2 === 0 ? (
          <g>
            {/* a cat on the step, eyes glowing */}
            <path d={`M ${x + 620} ${FLOOR - 40} q -10 -60 20 -80 l 6 -26 l 12 20 l 14 0 l 12 -20 l 6 26 q 30 20 20 80 Z`} fill="#1b1626" />
            <circle cx={x + 648} cy={FLOOR - 104} r={5} fill="#c8ff7a" opacity={(t + i) % 3.2 < 0.15 ? 0.1 : 1} />
            <circle cx={x + 668} cy={FLOOR - 104} r={5} fill="#c8ff7a" opacity={(t + i) % 3.2 < 0.15 ? 0.1 : 1} />
            <path d={`M ${x + 690} ${FLOOR - 50} q 40 ${-10 + Math.sin(t * 3) * 10} 50 -40`} fill="none" stroke="#1b1626" strokeWidth={10} strokeLinecap="round" />
          </g>
        ) : null}
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------------ the moon, a shy cute character
const Moon: React.FC<{ x: number; y: number; r: number; t: number; wink: number; squash?: number; shy?: number; tilt?: number }> = ({ x, y, r, t, wink, squash = 0, shy = 0, tilt = 0 }) => {
  const sx = 1 + squash * 0.16;
  const sy = 1 - squash * 0.14;
  const ex = 0.32 * r;
  const ey = -0.05 * r;
  const lookX = -shy * 0.12 * r;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${sx} ${sy})`}>
      <defs>
        <radialGradient id="moonglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.35" stopColor="#fff3c2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff3c2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonbody" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#fffdf0" />
          <stop offset="0.6" stopColor="#ffeeb0" />
          <stop offset="1" stopColor="#f0c770" />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={r * 2.4} fill="url(#moonglow)" opacity={0.85 + 0.15 * Math.sin(t * 2)} />
      <circle cx={0} cy={0} r={r} fill="url(#moonbody)" stroke="#c99a4a" strokeWidth={r * 0.04} />
      {[[-0.45, -0.45, 0.16], [0.5, -0.3, 0.1], [0.35, 0.5, 0.14], [-0.55, 0.35, 0.09]].map(([a, b, c], i) => (
        <circle key={i} cx={a * r} cy={b * r} r={c * r} fill="#f2d48a" opacity={0.7} />
      ))}
      {/* face */}
      {[-1, 1].map((s) => {
        const closed = s === 1 && wink > 0.5;
        const cx = s * ex + lookX;
        return closed ? (
          <path key={s} d={`M ${cx - 0.12 * r} ${ey} Q ${cx} ${ey - 0.12 * r} ${cx + 0.12 * r} ${ey}`} fill="none" stroke="#5a3a2a" strokeWidth={r * 0.06} strokeLinecap="round" />
        ) : (
          <g key={s}>
            <ellipse cx={cx} cy={ey} rx={0.1 * r} ry={0.14 * r} fill="#3a2430" />
            <circle cx={cx - 0.03 * r} cy={ey - 0.05 * r} r={0.04 * r} fill="#fff" />
          </g>
        );
      })}
      {[-1, 1].map((s) => <ellipse key={s} cx={s * 0.52 * r + lookX} cy={0.2 * r} rx={0.13 * r} ry={0.07 * r} fill="#ff9aa8" opacity={0.6 + shy * 0.3} />)}
      <path d={`M ${-0.14 * r + lookX} ${0.22 * r} Q ${lookX} ${0.36 * r} ${0.14 * r + lookX} ${0.22 * r}`} fill="none" stroke="#5a3a2a" strokeWidth={r * 0.055} strokeLinecap="round" />
    </g>
  );
};

const Sparkle: React.FC<{ x: number; y: number; s: number; op: number }> = ({ x, y, s, op }) => (
  <path d={`M ${x} ${y - s} Q ${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y} Q ${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s} Q ${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y} Q ${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s} Z`}
    fill="#fff6c8" opacity={op} />
);

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{ t: number }> = ({ t }) => {
  const walkT = Math.min(t, E.stop);
  const slow = ip(t, E.stop - 0.35, E.stop + 0.1, 0, 1, Easing.out(Easing.quad));
  const d = walkT * SPEED - slow * 30;
  const walking = t < E.stop + 0.05;
  const HX = 1150;
  // moon: high in the sky, then it drifts down behind Alex and follows; stops when he stops (comic overshoot)
  const fk = ip(t, E.follow - 0.2, E.follow + 1.6, 0, 1, Easing.inOut(Easing.cubic));
  const bobM = Math.sin(t * 2.4) * 14;
  const mxFollow = HX - 520 + Math.sin(t * 1.6) * 20;
  const overshoot = t > E.stops - 0.25 ? Math.sin(ip(t, E.stops - 0.25, E.stops + 0.35, 0, Math.PI, Easing.linear)) * 70 : 0;
  const mx = 520 + (mxFollow - 520) * fk + overshoot;
  const my = 230 + (430 - 230) * fk + bobM * fk;
  const mr = 110 + 40 * fk;
  const squash = t > E.stops - 0.05 ? Math.max(0, Math.sin((t - E.stops + 0.05) * 18) * Math.exp(-(t - E.stops) * 6)) : 0;
  const shy = ip(t, E.stops + 0.1, E.stops + 0.5) * (1 - ip(t, E.leave - 0.4, E.leave));
  const wink = t > E.leave && t < E.leave + 0.6 ? 1 : 0;
  const turned = ip(t, E.stop + 0.05, E.stop + 0.45);
  const face = t > E.leave + 0.15 ? "laugh" : t > E.stops + 0.2 ? "grin" : t > E.stop ? "surprised" : "smile";

  const world = (
    <g>
      <NightStreet t={t} d={d} />
      <Moon x={mx} y={my} r={mr} t={t} wink={wink} squash={squash} shy={shy} tilt={shy * -8} />
      {Array.from({ length: 12 }).map((_, i) => {
        const ph = (t * 0.35 + i / 12) % 1;
        return <Sparkle key={i} x={mx + Math.cos(i * 2.4) * mr * (1.3 + ph)} y={my + Math.sin(i * 2.4) * mr * (1.1 + ph)} s={10 + (i % 3) * 6} op={Math.sin(ph * Math.PI) * 0.9 * (0.4 + fk * 0.6)} />;
      })}
      <Hero x={HX} yf={FLOOR + 6} t={t} u={0.62} facing={1} walk={walking ? t * 7.5 : null} turn={turned} look={turned > 0.5 ? -1 : 0.6} lookY={turned > 0.5 ? -0.5 : 0}
        face={face} armL={t > E.leave + 0.15 ? "wave" : walking ? "swing" : "pocket"} armR={walking ? "swing" : "pocket"} rim="#fff0b8" />
      {/* moonlight wash + vignette */}
      <rect x={-800} y={-400} width={W + 1600} height={H + 800} fill="#ffe9a8" opacity={0.05 + 0.05 * fk} style={{ mixBlendMode: "screen" }} />
    </g>
  );
  const cA = cam(t, [[0, 1.0, 1080, 600], [E.follow, 1.08, 1000, 580], [E.stop - 0.6, 1.12, 960, 560]]);
  const cB = cam(t, [[E.stop - 0.6, 1.5, 920, 560], [E.leave0, 1.55, 900, 540]]);
  const headY = FLOOR + 6 - 0.62 * 790;
  const cC = cam(t, [[E.leave0, 2.7, HX - 90, headY + 10], [E.leave, 2.3, HX - 260, headY - 30], [10, 2.15, HX - 300, headY - 40]]);
  return (
    <>
      <View c={cA} op={shot(t, 0, E.stop - 0.6, 0.3)}>{world}</View>
      <View c={cB} op={shot(t, E.stop - 0.6, E.leave0, 0.3)}>{world}</View>
      <View c={cC} op={shot(t, E.leave0, 1e9, 0.3)}>{world}</View>
      <rect x={0} y={0} width={W} height={H} fill="url(#vig)" />
    </>
  );
};

/** Moon's distance from Alex: 384,400 km, closing in as it follows, then 2 m once it stops right behind him. */
const moonDist = (t: number) => {
  const km = Math.round(384400 * (1 - ip(t, E.follow - 0.2, E.stops, 0, 1, Easing.inOut(Easing.cubic))));
  return km >= 1 ? `${km.toLocaleString("en-US")} KM` : "2 M";
};

const Captions: React.FC<{ t: number }> = ({ t }) => {
  for (const l of timeline.lines) {
    for (const c of l.caps) {
      if (t >= c.start && t < c.end) {
        const s = interpolate(t - c.start, [0, 0.12], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.2)) });
        const hot = /MOON|STOPS|LEAVE/.test(c.text);
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

export const MoonShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: "#e8cca6" }}>
      <Img src={staticFile("plaid.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <div style={{ position: "absolute", top: PANEL_Y - 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 999, padding: "18px 40px", whiteSpace: "nowrap", fontFamily: FONT, fontWeight: 800, fontSize: 42,
          color: "#0a0a0a", boxShadow: "0 8px 22px rgba(0,0,0,0.32)",
        }}>What If the Moon Followed You Home?</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: PANEL_Y, width: PW, height: PH, overflow: "hidden", background: "#000", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
        <svg width={PW} height={PH} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
              <stop offset="0.6" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#05030c" stopOpacity="0.55" />
            </radialGradient>
          </defs>
          <Scene t={t} />
        </svg>
        <div style={{
          position: "absolute", top: 18, left: 22, background: "rgba(255,255,255,0.94)", borderRadius: 14, padding: "5px 16px",
          fontFamily: FONT, fontWeight: 900, fontSize: 28, color: "#0a0a0a", boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
        }}>NIGHT 1 · 11:47 PM</div>
        <div style={{
          position: "absolute", top: 18, right: 22, background: "rgba(255,255,255,0.94)", borderRadius: 14, padding: "5px 16px",
          fontFamily: FONT, fontWeight: 900, fontSize: 28, color: "#b07a10", boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
        }}>🌕 DISTANCE: {moonDist(t)}</div>
        <Captions t={t} />
      </div>
      <div style={{ position: "absolute", top: 1240, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#141419", color: "#fff", borderRadius: 999, padding: "8px 26px", fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 5 }}>PART 1</div>
      </div>
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
