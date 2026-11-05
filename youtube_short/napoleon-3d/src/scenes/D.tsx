import React from "react";
import * as THREE from "three";
import { SceneProps } from "../Video";
import { Ball, Box, Cam, Char, Cone, Cyl, EV, FaceCam, Flat, Glow, LOOK, Lights, PAL, Sign, Sky, Stars, SC, clamp, hash, keys, lerp, ramp } from "../lib";

// ---------------------------------------------------------------- 39: Elba, alone
export const Elba: React.FC<SceneProps> = ({ t, u }) => {
  const cam = keys(u, [[0, [0.5, 1.9, 10]], [2, [0.2, 1.9, 7.6]]]);
  return (
    <>
      <Sky top="#7c8da3" bottom="#e9d2b0" mid="#c8cac6" />
      <fog attach="fog" args={["#d9cdb4", 20, 120]} />
      <Lights amb={1.0} sun={1.0} color="#ffe0b0" dir={[10, 6, -10]} />
      <Cam pos={cam} target={[0, 2.2, -10]} fov={58} />
      <Flat p={[0, -0.02, -40]} s={[300, 120]} c="#4d7894" />
      <Flat p={[0, 0, 6]} s={[300, 22]} c="#dcc590" />
      {[0, 1, 2].map((k) => { const ph = (t * 0.45 + k / 3) % 1; return <Box key={k} p={[0, 0.03, -4.5 + ph * 5]} s={[300, 0.04, 0.35 * (1 - ph) + 0.05]} c="#f5fbff" />; })}
      {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[((i * 17 + t * 4) % 120) - 60, 0.04, -14 - i * 4]} s={[3, 0.04, 0.12]} c="#e9f2f7" />)}
      <Ball p={[-26, 1.2, -70]} r={14} c="#8e9aa0" sc={[2.4, 0.5, 1]} />
      <Ball p={[18, 6, -90]} r={4} c="#f0ddb5" emissive="#f0ddb5" /><Glow p={[18, 6, -90]} s={40} c="#ffd9a0" o={0.5} />
      <Char pos={[-1.2, 0, -1]} h={3.3} look={{ ...LOOK.nap, sil: "#1b1c26", back: true, arm: "behind", ep: 0, coattails: true }} />
      <FaceCam pos={[0, 8, -6]}><Sign p={[0, 0, 0]} w={3.6} h={1.1} text={["ELBA"]} bg="#1b1511" font={130} /></FaceCam>
    </>
  );
};

// ---------------------------------------------------------------- 41: the escape by boat (camera circles the boat)
export const Boat: React.FC<SceneProps> = ({ t, u }) => {
  const ang = lerp(0.2, 1.0, u / 0.95);
  const bob = Math.sin(t * 2.4) * 0.15;
  return (
    <>
      <Sky top="#0a1030" bottom="#2b3f6e" mid="#1b2850" />
      <Stars />
      <fog attach="fog" args={["#1b2850", 20, 120]} />
      <Lights amb={0.7} sun={0.8} color="#b8c8ff" dir={[-10, 14, 6]} />
      <Cam pos={[Math.sin(ang) * 17, 3.2, Math.cos(ang) * 17]} target={[0, 2.6 + bob, 0]} fov={56} roll={Math.sin(t * 2.4) * 0.04} />
      <Flat p={[0, -0.05, 0]} s={[500, 500]} c="#16294a" />
      {Array.from({ length: 26 }, (_, i) => <Box key={i} p={[((i * 13 - t * 3) % 60) - 30, 0.02, -20 + hash(i, 1) * 40]} s={[2.6, 0.05, 0.12]} c="#6f8fc4" />)}
      <Ball p={[-30, 22, -60]} r={5} c="#f2ebcb" emissive="#f2ebcb" /><Glow p={[-30, 22, -60]} s={50} c="#d8e0ff" o={0.4} />
      <group position={[0, bob, 0]} rotation={[0, 0, Math.sin(t * 2.4) * 0.05]}>
        <Box p={[0, 0.6, 0]} s={[7, 1.2, 2.4]} c="#3a2a1c" />
        <Cyl p={[0, 4.2, 0]} r={0.12} h={7.4} c="#3a2a1c" />
        <Box p={[0.9, 3.6, 0]} s={[2.4, 3.4, 0.08]} c="#EDE3C6" rot={[0, 0, -0.2]} />
        <Char pos={[-2.2, 1.2, 0.3]} h={2.0} look={{ ...LOOK.nap, sil: "#12131c", ep: 0 }} />
      </group>
    </>
  );
};

// ---------------------------------------------------------------- the Alps: the line of muskets, the lone walker, "here I am", the hats
const Alp: React.FC<{ t: number; sky?: [string, string] }> = ({ sky = ["#7e94b8", "#dde4ec"] }) => (
  <>
    <Sky top={sky[0]} bottom={sky[1]} />
    <fog attach="fog" args={[sky[1], 40, 260]} />
    <Lights amb={1.1} sun={1.3} color="#fff4e0" dir={[-12, 16, 8]} />
    <Flat p={[0, 0, -30]} s={[400, 200]} c="#f3f5f7" />
    <Flat p={[0, 0.02, -20]} s={[7, 200]} c="#b9a98c" />
    {[[-40, -80, 30], [20, -110, 38], [70, -90, 26], [-80, -120, 34], [0, -140, 44]].map(([x, z, h], i) => (
      <group key={i} position={[x, 0, z]}><Cone p={[0, h / 2, 0]} r={h * 0.85} h={h} c="#6f7f96" seg={7} /><Cone p={[0, h * 0.82, 0]} r={h * 0.3} h={h * 0.36} c="#f4f7fa" seg={7} /></group>
    ))}
  </>
);
const Line: React.FC<{ n: number; x0: number; z0: number; dx: number; dz: number; h: number; rise?: number; t: number }> = ({ n, x0, z0, dx, dz, h, rise = 0.5, t }) => (
  <>
    {Array.from({ length: n }, (_, i) => <Char key={i} pos={[x0 + dx * i, 0, z0 + dz * i]} h={h} flip look={{ ...LOOK.soldier, arm: rise > 0.5 ? "aim" : "down", expr: "flat", walk: undefined }} />)}
  </>
);
export const Alps: React.FC<SceneProps> = ({ t, u }) => {
  const rise = clamp((t - EV.alps - 0.2) / 0.35);
  const cam = keys(u, [[0, [-1, 2.4, 11]], [1.8, [1, 2.2, 8]]]);
  return (
    <>
      <Alp t={t} />
      <Cam pos={cam} target={[1.5, 2.2, -2]} fov={58} />
      <Line n={9} x0={3.2} z0={-3} dx={0.9} dz={-0.15} h={2.2} rise={rise} t={t} />
      <Line n={9} x0={3.6} z0={-1.2} dx={0.9} dz={-0.15} h={2.4} rise={rise} t={t} />
      <group position={[6.5, 0, -2]}><Cyl p={[0, 2.2, 0]} r={0.08} h={4.4} c="#5B3F26" />{[PAL.blue, "#F3E8CB", PAL.red].map((c, i) => <Box key={i} p={[0.45 + i * 0.5, 3.8 + Math.sin(t * 7 - i) * 0.08, 0]} s={[0.52, 0.9, 0.05]} c={c} />)}</group>
      <Char pos={[-3.8 + u * 0.6, 0, 1.5]} h={2.1} look={{ ...LOOK.nap, walk: u * 1.2 }} />
    </>
  );
};
export const Walk: React.FC<SceneProps> = ({ t, u }) => {
  const x = -3 + u * 1.4;
  return (
    <>
      <Alp t={t} sky={["#6f86ac", "#ced8e4"]} />
      <Cam pos={[x - 3.2, 2.0, 6.5]} target={[x + 3, 2.0, 0]} fov={58} />
      <Char pos={[x, 0, 0]} h={2.5} look={{ ...LOOK.nap, walk: u * 1.5 }} />
      {[0, 1, 2].map((i) => <Char key={i} pos={[3.2 + i * 1.2, 0, 1.4 - i * 1.1]} h={2.7 - i * 0.15} flip look={{ ...LOOK.soldier, arm: "aim" }} />)}
      {[0, 1, 2, 3].map((i) => <Char key={`b${i}`} pos={[5.4 + i * 1.1, 0, -2.4 - i * 0.7]} h={2.3} flip look={{ ...LOOK.soldier, arm: "aim" }} />)}
    </>
  );
};
export const Here: React.FC<SceneProps> = ({ t, u }) => {
  const talk = 0.5 + 0.5 * Math.sin(u * 15) * Math.sin(u * 4.3);
  return (
    <>
      <Alp t={t} sky={["#2b3550", "#8794ad"]} />
      <Cam pos={[0, 3.4, 10 - u * 0.5]} target={[0, 3.6, 0]} fov={50} />
      <Char pos={[0, -0.8, 0]} h={7.6} shadow={false} look={{ ...LOOK.nap, arm: "wide", mouth: talk, expr: "serious" }} />
      {[-1, 1].flatMap((sd) => [0, 1, 2].map((k) => (
        <group key={`${sd}${k}`} position={[sd * (4.5 + k * 0.8), 1.2 + k * 0.5, 4 - k]} rotation={[0, 0, sd * (0.15 + 0.05 * k) ]}>
          <Cyl p={[0, 0, 0]} r={0.12} h={8} c="#6B4A2E" rot={[0, 0, Math.PI / 2 - sd * 0.1]} />
          <Cone p={[-sd * 4.2, 0, 0]} r={0.14} h={0.9} c="#dadada" rot={[0, 0, sd * Math.PI / 2]} />
        </group>
      )))}
    </>
  );
};
export const Hats: React.FC<SceneProps> = ({ t, u }) => {
  const a = t - EV.hats;
  const cheer = t >= EV.hats;
  const cam = keys(u, [[0, [-1.5, 2.2, 10]], [1.6, [0.6, 2.9, 8.2]]]);
  return (
    <>
      <Sky top="#6e8ac0" bottom="#f3ecd0" />
      <Lights amb={1.2} sun={1.3} color="#fff0c0" />
      <Cam pos={cam} target={[0, 3.2, 0]} fov={58} />
      <Flat p={[0, 0, -10]} s={[300, 100]} c="#f3f5f7" />
      {Array.from({ length: 16 }, (_, i) => <Box key={i} p={[0, 6, -22]} s={[0.4, 0.05, 60]} c="#ffe29a" rot={[0, i * 0.2 + t * 0.1, 0]} />)}
      <Glow p={[0, 6, -14]} s={26 * clamp(u / 0.5)} c="#ffe29a" o={0.8} />
      {[0, 1, 2].flatMap((r) => [-3, -2, -1, 0, 1, 2, 3].filter((c) => !(r === 0 && Math.abs(c) < 1)).map((c) => (
        <Char key={`${r}${c}`} pos={[c * 1.8 + (r % 2) * 0.8, 0, 2 - r * 1.9]} h={2.2} look={{ ...LOOK.soldier, hat: cheer ? "none" : "shako", hairC: "#2b211e", arm: cheer ? "cheer" : "down", expr: cheer ? "laugh" : "flat", mouth: cheer ? 0.8 : 0, prop: cheer ? "none" : "musket" }} />
      )))}
      <Char pos={[0, 0, 2.4]} h={2.6} look={{ ...LOOK.nap }} />
      {cheer && Array.from({ length: 26 }, (_, i) => {
        const x0 = -6 + hash(i, 1) * 12, tt = Math.max(0, a - hash(i, 5) * 0.15), vx = (hash(i, 3) - 0.5) * 5, vy = 6 + hash(i, 4) * 5;
        return <group key={i} position={[x0 + vx * tt, 2.8 + vy * tt - 9 * tt * tt, 1 + hash(i, 2) * 2]} rotation={[tt * 4 * (hash(i, 6) - 0.5), 0, tt * 7 * (hash(i, 7) - 0.5)]}><Cyl p={[0, 0, 0]} r={0.16} h={0.3} c="#211B18" /><Cyl p={[0, -0.13, 0]} r={0.17} h={0.06} c={PAL.gold} /><Ball p={[0, 0.2, 0]} r={0.06} c={PAL.red} /></group>;
      })}
    </>
  );
};

// ---------------------------------------------------------------- 1815: Waterloo
export const Waterloo: React.FC<SceneProps> = ({ t, u }) => {
  const rain = React.useMemo(() => new Float32Array(160 * 6), []);
  for (let i = 0; i < 160; i++) {
    const x = ((hash(i, 1) * 50 - t * 8) % 50 + 50) % 50 - 25, y = 12 - (((hash(i, 2) * 12 + t * 26 * (0.7 + hash(i, 3))) % 12 + 12) % 12), z = -20 + hash(i, 4) * 30;
    rain.set([x, y, z, x - 0.4, y + 1.4, z], i * 6);
  }
  const geo = React.useMemo(() => new THREE.BufferGeometry(), []);
  geo.setAttribute("position", new THREE.BufferAttribute(rain, 3)); geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
  const shake = u > 0.9 && u < 1.5 ? 0.12 : 0;
  const rows = [0, 1];
  return (
    <>
      <Sky top="#3c423f" bottom="#7c8176" />
      <fog attach="fog" args={["#6f746b", 14, 70]} />
      <Lights amb={0.8} sun={0.7} color="#d8dccf" dir={[4, 14, 6]} />
      <Cam pos={[Math.sin(t * 70) * shake, 1.8 + Math.cos(t * 60) * shake, 11]} target={[0, 2.2, -10]} fov={58} />
      <Flat p={[0, 0, -20]} s={[200, 100]} c="#4a4636" />
      {rows.flatMap((r) => Array.from({ length: 8 }, (_, i) => {
        const brk = clamp((t - 50.15 - hash(r, i) * 0.9) / 0.5), x = (i - 3.5) * 2.3 + r, z = 3 - r * 3.2;
        if (brk <= 0) return <Char key={`${r}${i}`} pos={[x, 0, z]} h={2.2} flip look={{ ...LOOK.soldier, arm: "aim", expr: "flat" }} />;
        if (i % 3 === 0) return <Char key={`${r}${i}`} pos={[x, 0, z]} h={2.2} rotZ={-1.4 * brk} look={{ ...LOOK.soldier, expr: "worry" }} />;
        return <Char key={`${r}${i}`} pos={[x + brk * 7, 0, z + brk * 4]} h={2.2} look={{ ...LOOK.soldier, hunch: true, coat: "#5b667a", expr: "worry", walk: t * 1.6 + i }} />;
      }))}
      <group position={[0.4, 0, 2.6]}><Cyl p={[0, 2.4, 0]} r={0.08} h={4.8} c="#5B3F26" />{[PAL.blue, "#F3E8CB", PAL.red].map((c, i) => <Box key={i} p={[0.45 + i * 0.5, 4.1 + Math.sin(t * 7 - i) * 0.08, 0]} s={[0.52, 0.9, 0.05]} c={c} />)}</group>
      {Array.from({ length: 9 }, (_, i) => { const ft = 49.2 + i * 0.31, a = t - ft; return a > 0 && a < 0.16 ? <Glow key={i} p={[-12 + hash(i, 1) * 24, 1.6, -22]} s={8 * (0.6 + a * 4)} c="#ffb347" o={1} /> : null; })}
      {Array.from({ length: 10 }, (_, i) => <Ball key={i} p={[((hash(i, 2) * 60 - t * 1.6) % 60 + 60) % 60 - 30, 1.5 + hash(i, 3) * 3, -10 - hash(i, 4) * 12]} r={2.4 + 2 * hash(i, 5)} c="#6a6a6c" sc={[1.6, 0.9, 1]} />)}
      <lineSegments geometry={geo}><lineBasicMaterial color="#d7e1eb" transparent opacity={0.55} /></lineSegments>
    </>
  );
};

// ---------------------------------------------------------------- Saint Helena: a tiny rock in a huge ocean
export const Helena: React.FC<SceneProps> = ({ t, u }) => {
  const dur = SC.twist - EV.helena;
  const k = ramp(u, 0.3, dur - 0.2);
  const cam = keys(u, [[0, [0, 14, 110]], [dur, [1.2, 3.4, 14]]]);
  const tgt = keys(u, [[0, [0, 2, 0]], [dur, [0.3, 3.2, 0]]]);
  return (
    <>
      <Sky top="#2d3550" bottom="#f0b070" mid="#b27a66" />
      <fog attach="fog" args={["#d89a74", 60, 520]} />
      <Lights amb={0.8} sun={1.1} color="#ffc890" dir={[0, 8, -20]} />
      <Cam pos={cam} target={tgt} fov={54} />
      <Flat p={[0, -0.05, -100]} s={[2000, 1000]} c="#35566f" />
      <Ball p={[0, 14, -260]} r={34} c="#fbe0a0" emissive="#fbe0a0" /><Glow p={[0, 14, -250]} s={260} c="#ffc890" o={0.55} />
      <Flat p={[0, 0.0, -230]} s={[40, 400]} c="#f5b86a" rot={[-Math.PI / 2, 0, 0]} opacity={0.5} />
      {Array.from({ length: 80 }, (_, i) => <Box key={i} p={[((hash(i, 1) * 200 - 100) + t * 0.8) % 200 - 100 + 0, 0.03, -hash(i, 2) * 120]} s={[2 + hash(i, 3) * 4, 0.05, 0.15]} c="#cfe1ee" />)}
      <Cone p={[0, 0.9, 0]} r={3.6} h={2.6} c="#3b3a3a" seg={6} />
      <Ball p={[0.5, 2.0, 0]} r={1.3} c="#4F7A44" sc={[1.3, 0.35, 1]} />
      <Char pos={[0.4, 2.1, 0.3]} h={1.1} look={{ ...LOOK.nap, sil: "#14141c", back: true, arm: "behind", ep: 0 }} />
      <FaceCam pos={[0, 9.5, -6]} scale={lerp(7, 1.2, k)}><Sign p={[0, 0, 0]} w={3.4} h={0.9} text={["SAINT HELENA"]} bg="#1b1511" font={74} /></FaceCam>
    </>
  );
};

// ---------------------------------------------------------------- twist: the height chart and the caricature
export const Twist: React.FC<SceneProps> = ({ t, u }) => {
  const P = 2.4; // world units per metre
  const m = ramp(t, EV.measure, EV.measure + 0.35);
  const cp = ramp(t, EV.cartoon, EV.cartoon + 0.4);
  const bob = Math.sin(t * 14) * 0.05, stomp = Math.max(0, Math.sin(t * 7)) * 0.1;
  const cam = keys(u, [[0, [0.3, 3.6, 10.6]], [5.7, [0.3, 3.6, 9.6]]]);
  return (
    <>
      <Sky top="#d9c79a" bottom="#f0e4c4" />
      <Lights amb={1.2} sun={1.1} color="#fff2d6" dir={[2, 10, 10]} />
      <Cam pos={cam} target={[0.3, 3.4, 0]} fov={60} />
      <Flat p={[0, 0, -1]} s={[40, 30]} c="#b9a67a" />
      <Box p={[0, 6, -2.4]} s={[40, 14, 0.4]} c="#e8dcb4" />
      <Box p={[-2.5, 2.5, -2.0]} s={[1.7, 5.3, 0.2]} c="#e4d3a6" />
      {Array.from({ length: 21 }, (_, i) => <Box key={i} p={[-2.0 + (i % 5 === 0 ? 0.0 : 0.2), 0.02 + i * 0.1 * P, -1.85]} s={[i % 5 === 0 ? 0.9 : 0.5, 0.05, 0.05]} c="#1b1511" />)}
      <FaceCam pos={[-2.95, 1 * P + 0.1, -1.6]} scale={0.8}><Sign p={[0, 0, 0]} w={0.8} h={0.4} text={["1 m"]} bg="#e4d3a6" fg="#1b1511" font={110} frame="#1b1511" /></FaceCam>
      <FaceCam pos={[-2.95, 2 * P + 0.1, -1.6]} scale={0.8}><Sign p={[0, 0, 0]} w={0.8} h={0.4} text={["2 m"]} bg="#e4d3a6" fg="#1b1511" font={110} frame="#1b1511" /></FaceCam>
      <Char pos={[0.1, 0, 0]} h={4.53} look={{ ...LOOK.nap, hat: "hair", ep: 1, expr: "serious", arm: "down" }} />
      {m > 0 && <Box p={[lerp(-2.4, 0.2, m), 1.69 * P, -1.2]} s={[lerp(0.1, 5.2, m), 0.07, 0.07]} c={PAL.red} emissive={PAL.red} ei={0.4} />}
      {m > 0.6 && <FaceCam pos={[-1.2, 1.69 * P + 1.0, 0.6]} scale={0.8}><Sign p={[0, 0, 0]} w={2.6} h={0.8} text={["1.69 m"]} bg="#F3E8CB" fg={PAL.red} font={96} frame={PAL.red} /></FaceCam>}
      {m > 0.6 && <FaceCam pos={[0.9, 1.69 * P + 1.0, 0.6]} scale={0.8}><Sign p={[0, 0, 0]} w={2.0} h={0.8} text={["5'7\""]} bg="#F3E8CB" fg={PAL.red} font={96} frame={PAL.red} /></FaceCam>}
      {cp > 0 && (
        <group position={[lerp(9, 2.5, cp), 3.1, 1.0]} scale={0.62} rotation={[0, 0, 0.07]}>
          <Box p={[0, 0, -0.1]} s={[3.5, 4.3, 0.12]} c="#EDE1BD" /><Box p={[0, 0, -0.03]} s={[3.2, 4.0, 0.08]} c="#e4d3a0" />
          <Char pos={[0, -1.7 + stomp, 0.1]} h={2.4} shadow={false} look={{ coat: "#7A8CB0", pants: "#5A4A3A", hat: "bicorne", expr: "angry", arm: "up", mouth: 0.5 + 0.5 * Math.sin(t * 9), steam: true, hairC: "#6a3a2a", purple: false }} />
          <Ball p={[0, -2.0 + bob, 0.05]} r={0.01} c="#000" />
        </group>
      )}
    </>
  );
};
