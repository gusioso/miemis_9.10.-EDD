import React from "react";
import { SceneProps } from "../Video";
import { Ball, Box, Candle, Cam, Char, Cone, Cyl, EuropeMap, EV, Flat, Glow, LOOK, Lights, PAL, Sign, Sky, hash, keys, lerp, lin, mixHex, ramp } from "../lib";
import * as THREE from "three";

const dr = (hex: string, k: number) => "#" + mixHex(hex, "#8d8f93", k).getHexString();

// ---------------------------------------------------------------- the Code Civil slams shut
export const Book: React.FC<SceneProps> = ({ t, u }) => {
  const a = t - EV.book;
  const close = u < 0.3 ? Math.pow(lin(u, 0, 0.3), 2) : 1;
  const phi = Math.PI * close;
  const bounce = a > 0 ? 1 + 0.12 * Math.exp(-a * 9) * Math.cos(a * 30) : 1;
  return (
    <>
      <Sky top="#8a7448" bottom="#e9d9ae" />
      <Lights amb={1.2} sun={1.2} dir={[3, 12, 6]} />
      <Cam pos={[0, 10.5, 9]} target={[0, 0.6, 0]} fov={50} roll={a > 0 && a < 0.5 ? 0.02 * Math.sin(a * 60) : 0} />
      <Box p={[0, -0.4, 0]} s={[30, 0.6, 20]} c={PAL.wood} />
      <group position={[1.6, 0, 0]} scale={[1, bounce > 1 ? 2 - bounce : 1, 1]}>
        <Box p={[-1.6, 0.35, 0]} s={[3.2, 0.7, 4.4]} c={PAL.cream} />
        <Box p={[-1.6, 0.02, 0]} s={[3.3, 0.14, 4.5]} c="#8A1D24" />
        <group position={[0, 0.7, 0]} rotation={[0, 0, phi]}>
          <Box p={[1.6, -0.35, 0]} s={[3.2, 0.7, 4.4]} c={PAL.cream} />
          <Box p={[1.6, -0.72, 0]} s={[3.3, 0.14, 4.5]} c="#8A1D24" />
          <Sign p={[1.6, -0.8, 0]} w={2.6} h={3.6} text={["CODE", "CIVIL"]} bg="#8A1D24" fg="#EBCB6E" font={130} rot={[Math.PI / 2, 0, Math.PI]} />
        </group>
      </group>
      {a > 0 && (<>
        <Glow p={[0, 0.5, -3]} s={16 * Math.min(1, a * 4 + 0.3)} c="#ffd56a" o={0.5 * (0.85 + 0.15 * Math.sin(t * 6))} />
        {Array.from({ length: 14 }, (_, i) => <Glow key={i} p={[Math.cos(i * 2.4) * (1 + hash(i, 1) * 3), 1 + ((t * 2 + i) % 3), Math.sin(i * 2.4) * (1 + hash(i, 2) * 2)]} s={0.4} c="#fff0b0" o={0.9} />)}
      </>)}
    </>
  );
};

// ---------------------------------------------------------------- Austerlitz: fog, the sun, the charge uphill
const SLOPE = 0.35;
export const Austerlitz: React.FC<SceneProps> = ({ t, u }) => {
  const sb = ramp(t, EV.sunBreaks - 0.3, EV.sunBreaks + 0.9);
  const rise = (z: number) => -z * SLOPE;
  const cam = keys(u, [[0, [-1, 3.2, 9]], [2.4, [1, 3.6, 4]]]);
  const ranks = [0, 1, 2];
  return (
    <>
      <Sky top={mixHex("#7f93b4", "#6fa6e8", sb).getStyle()} bottom={mixHex("#cfcbbd", "#fbe3a6", sb).getStyle()} mid={mixHex("#b9bfc8", "#f4d58e", sb).getStyle()} />
      <fog attach="fog" args={[mixHex("#cfd0c8", "#f4e0a8", sb), lerp(4, 40, sb), lerp(40, 190, sb)]} />
      <Lights amb={lerp(0.9, 1.15, sb)} sun={lerp(0.5, 1.7, sb)} color="#ffe6a8" dir={[10, 12, -6]} />
      <Cam pos={cam} target={[0, 3.4, -18]} fov={58} />
      <Box p={[0, -3.2, -30]} s={[200, 6, 140]} c={mixHex("#6f7d54", "#5d8a3c", sb).getStyle()} rot={[0.34, 0, 0]} />
      <Ball p={[26, 22, -110]} r={6} c="#fff1b0" emissive="#fff1b0" />
      <Glow p={[26, 22, -108]} s={60 * sb} c="#ffe39a" o={0.9 * sb} />
      {/* the enemy, fleeing over the crest */}
      {Array.from({ length: 10 }, (_, i) => <Char key={i} pos={[-8 + i * 1.9, rise(-26 - (i % 3) * 1.6), -26 - (i % 3) * 1.6 - u * 0.8]} h={1.8} flip={i % 2 === 0} look={{ ...LOOK.soldier, coat: "#9a9784", hunch: true, prop: "none", belts: false, walk: u * 1.2 + i * 0.2 }} />)}
      {/* the French charge */}
      {ranks.flatMap((r) => Array.from({ length: 8 }, (_, i) => {
        const z = 4 - r * 3.6 - u * 3.2 - (i % 2) * 0.5; const x = (i - 3.5) * 2.2 + (r % 2) * 0.9;
        return <Char key={`${r}-${i}`} pos={[x, rise(z), z]} h={2.2} look={{ ...LOOK.soldier, arm: "aim", walk: u * 2.1 + i * 0.19 + r * 0.31 }} />;
      }))}
      <group position={[-1.2, rise(-2 - u * 3.2), -2 - u * 3.2]}>
        <Cyl p={[0, 2.2, 0]} r={0.08} h={4.4} c="#5B3F26" />
        {[PAL.blue, "#F3E8CB", PAL.red].map((c, i) => <Box key={i} p={[0.45 + i * 0.5, 3.8 + Math.sin(t * 7 - i) * 0.08, 0]} s={[0.52, 0.9, 0.05]} c={c} />)}
        <Cone p={[0, 4.55, 0]} r={0.16} h={0.4} c={PAL.gold} />
      </group>
      {[0, 1, 2, 3].map((i) => { const away = ramp(t, EV.sunBreaks - 0.2 + i * 0.12, EV.sunBreaks + 1.0 + i * 0.12); return <Flat key={i} p={[(i % 2 ? 1 : -1) * away * 40, 3 + i * 2, -12 - i * 8]} s={[70, 6]} c="#e8e4d8" rot={[0, 0, 0]} opacity={0.62 * (1 - away * 0.9)} />; })}
    </>
  );
};

// ---------------------------------------------------------------- the map of Europe floods blue
export const Flood: React.FC<SceneProps> = ({ t, u }) => {
  const blue = ramp(u, 0, 1.1);
  const cam = keys(u, [[0, [0, 21, 9]], [1.5, [0, 17.5, 7]]]);
  return (
    <>
      <Sky top="#150f0b" bottom="#2e2014" />
      <fog attach="fog" args={["#1f150d", 30, 80]} />
      <Lights amb={0.8} sun={1.0} color="#ffe2b0" dir={[0, 20, 8]} />
      <Cam pos={cam} target={[0, 0, 0]} fov={50} roll={-0.03} />
      <Box p={[0, -0.05, 0]} s={[34, 0.5, 24]} c={PAL.wood} />
      <Flat p={[0, 0.22, 0]} s={[22, 14]} c="#78A0BE" />
      <EuropeMap pos={[0, 0.23, 0]} blue={blue} land="#EFDDAA" />
      <Candle p={[-10.5, 0.2, 6]} t={t} s={1.6} /><Candle p={[10.5, 0.2, -6]} t={t + 3} s={1.6} />
    </>
  );
};

// ---------------------------------------------------------------- Russia
const Russia: React.FC<{ d: number; children: React.ReactNode; sky?: [string, string] }> = ({ d, children, sky = ["#9db4d6", "#ead9b0"] }) => (
  <>
    <Sky top={dr(sky[0], d)} bottom={dr(sky[1], d)} />
    <fog attach="fog" args={[dr(sky[1], d), 30, 120]} />
    <Lights amb={1.1} sun={1.1} color={d > 0.5 ? "#e8eaf0" : "#fff0d0"} dir={[-6, 14, 8]} />
    {children}
  </>
);
export const March: React.FC<SceneProps> = ({ t, u }) => {
  const d = ramp(u, 0.2, 2.6);
  const soldiers = [];
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 14; i++) {
    const x = -14 + i * 2.6 + layer * 0.9 + u * 1.6; soldiers.push(<Char key={`${layer}${i}`} pos={[x, 0, -3 - layer * 3.2]} h={2.1} look={{ ...LOOK.soldier, coat: dr(PAL.blue, d), walk: u * 1.5 + i * 0.27 + layer * 0.3 }} />);
  }
  return (
    <Russia d={d}>
      <Cam pos={[-4 + u * 1.8, 1.8, 8]} target={[1 + u * 1.8, 2, -3]} fov={60} />
      <Flat p={[0, 0, -15]} s={[300, 140]} c={dr("#b89a52", d)} />
      <Box p={[0, 1, -70]} s={[260, 10, 4]} c={dr("#d9c38a", d)} />
      {soldiers}
      <group position={[2 + u * 1.6, 0, -2]}>
        <Cyl p={[0, 2.2, 0]} r={0.08} h={4.4} c="#5B3F26" />
        {[dr(PAL.blue, d), dr("#F3E8CB", d), dr(PAL.red, d)].map((c, i) => <Box key={i} p={[0.45 + i * 0.5, 3.8 + Math.sin(t * 7 - i) * 0.08, 0]} s={[0.52, 0.9, 0.05]} c={c} />)}
      </group>
    </Russia>
  );
};
export const Moscow: React.FC<SceneProps> = ({ t, u }) => {
  const dome = (x: number, h: number, w: number) => (
    <group key={x} position={[x, 0, -40]}>
      <Box p={[0, h / 2, 0]} s={[w, h, w]} c="#140b0b" />
      <Ball p={[0, h + w * 0.55, 0]} r={w * 0.7} c="#140b0b" sc={[1, 1.3, 1]} />
      <Cone p={[0, h + w * 1.8, 0]} r={w * 0.08} h={w * 1.2} c="#140b0b" />
    </group>
  );
  return (
    <>
      <Sky top="#2a1210" bottom="#f29a3a" mid="#b8461c" />
      <fog attach="fog" args={["#b8461c", 40, 220]} />
      <Lights amb={0.7} sun={0.3} color="#ff9a50" />
      <Cam pos={[lerp(-3, 4, u / 1.9), 2.4, 12]} target={[0, 6, -40]} fov={56} />
      <Flat p={[0, 0, -30]} s={[300, 100]} c="#5a2c1a" />
      {[-24, -14, -5, 5, 14, 24].map((x, i) => dome(x, 8 + (i % 3) * 3, 4 + (i % 2)))}
      {Array.from({ length: 30 }, (_, i) => { const f = 1 + 0.35 * Math.sin(t * 11 + i * 2); return <React.Fragment key={i}><Cone p={[-34 + i * 2.3, 5 + hash(i, 1) * 4 * f, -38]} r={1.1} h={7 * f} c="#f58a1f" emissive="#e0541a" /><Cone p={[-34 + i * 2.3, 4 + hash(i, 1) * 3 * f, -37]} r={0.6} h={4 * f} c="#ffd25a" emissive="#ffc83a" /></React.Fragment>; })}
      {Array.from({ length: 14 }, (_, i) => { const p = (t * 0.3 + hash(i, 2)) % 1; return <Ball key={i} p={[-30 + hash(i, 3) * 60 + p * 8, 8 + p * 40, -36]} r={0.8 + p * 2} c="#7a3a26" />; })}
      <Glow p={[0, 5, -36]} s={90} c="#ff9a3a" o={0.65 + 0.1 * Math.sin(t * 9)} />
      {Array.from({ length: 9 }, (_, i) => <Char key={i} pos={[-8 + i * 2, 0, 3 - (i % 2)]} h={2.0} look={{ ...LOOK.soldier, sil: "#1a0c0a", arm: "down" }} />)}
    </>
  );
};
export const Retreat: React.FC<SceneProps> = ({ t, u }) => {
  const sh = ramp(t, EV.winter + 0.2, EV.winter + 2.2);
  const flakes = React.useMemo(() => new Float32Array(600 * 3), []);
  for (let i = 0; i < 600; i++) { flakes[i * 3] = ((hash(i, 1) * 44 - t * (6 + 5 * hash(i, 3))) % 44 + 44) % 44 - 22; flakes[i * 3 + 1] = ((hash(i, 2) * 14 - t * (3 + 3 * hash(i, 4))) % 14 + 14) % 14; flakes[i * 3 + 2] = hash(i, 5) * 16 - 4; }
  const geo = React.useMemo(() => new THREE.BufferGeometry(), []);
  geo.setAttribute("position", new THREE.BufferAttribute(flakes, 3)); geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
  return (
    <Russia d={1} sky={["#9aa2aa", "#d6dadc"]}>
      <Cam pos={[0, 2.4, 10]} target={[0, 2.4, 0]} fov={58} />
      <Flat p={[0, 0, -15]} s={[300, 140]} c="#eef1f3" />
      {[-9, -5, 4, 8, 12].map((x, i) => <React.Fragment key={i}><Cyl p={[x, 3, -12]} r={0.2} h={6} c="#3e3e40" /><Box p={[x - 0.8, 4.6, -12]} s={[1.8, 0.14, 0.14]} c="#3e3e40" rot={[0, 0, 0.5]} /></React.Fragment>)}
      {Array.from({ length: 9 }, (_, i) => { const x = ((i * 3.1 - u * 1.2) % 28 + 28) % 28 - 14; return <Char key={i} pos={[x, 0, 1 - (i % 3) * 1.8]} h={2.0} flip look={{ ...LOOK.soldier, coat: "#62636A", hunch: true, hat: "shako", walk: u * 0.7 + i * 0.4 }} />; })}
      {[[-5, 4.5], [1.2, 5], [6.5, 4]].map(([x, z], i) => <React.Fragment key={i}><Char pos={[x, 0, z - 4]} h={1.9} rotZ={1.35} look={{ ...LOOK.soldier, coat: "#62636A", hunch: true }} /><Ball p={[x + 0.4, 0.2, z - 4]} r={1.2} c="#f4f7f9" sc={[1.5, 0.4, 0.9]} /></React.Fragment>)}
      <points geometry={geo}><pointsMaterial color="#ffffff" size={7} sizeAttenuation={false} fog={false} /></points>
      {/* the map in the corner: the blue shrinks back to France */}
      <mesh position={[-1.0, 5.0, 3]}><planeGeometry args={[3.2, 2.8]} /><meshBasicMaterial color="#f0e2be" /></mesh>
      <group position={[-1.0, 5.0, 3.05]} rotation={[Math.PI / 2, 0, 0]}><EuropeMap blue={1} shrink={sh} scale={0.14} land="#d6c39a" /></group>
    </Russia>
  );
};
