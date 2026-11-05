import React from "react";
import { SceneProps } from "../Video";
import { Ball, Box, Candle, Cam, Char, Cone, EuropeMap, EV, FaceCam, Flat, LOOK, Lights, PAL, Poly, Sign, Sky, clamp, keys, lerp, mapXY, ramp, V3 } from "../lib";

// ---------------------------------------------------------------- the war table (used by the title and the Corsica shot)
const Table: React.FC<{ t: number; blue?: number }> = ({ t, blue = 0 }) => (
  <>
    <Box p={[0, -0.4, 0]} s={[34, 0.6, 34]} c={PAL.woodD} />
    <Box p={[0, -0.05, 0]} s={[23, 0.5, 15]} c={PAL.wood} />
    <Flat p={[0, 0.22, 0]} s={[22, 14]} c="#78A0BE" />
    <EuropeMap pos={[0, 0.23, 0]} blue={blue} land="#EFDDAA" />
    <Candle p={[-10.5, 0.2, 6]} t={t} s={1.6} />
    <Candle p={[10.5, 0.2, -6]} t={t + 3} s={1.6} />
  </>
);
const Room: React.FC = () => (<><Sky top="#150f0b" bottom="#2e2014" mid="#24170f" /><fog attach="fog" args={["#1f150d", 25, 70]} /><Lights amb={0.55} sun={0.8} color="#ffd9a0" /></>);

export const Title: React.FC<SceneProps> = ({ t, u }) => {
  const pos = keys(u, [[0, [-3, 13, 11]], [4, [2, 15.5, 5]]]);
  return (<><Room /><Cam pos={pos} target={[0, 0.2, 0]} fov={52} roll={0.05 - 0.02 * u} /><Table t={t} blue={ramp(u, 1.5, 3.8) * 0.0} /></>);
};

// ---------------------------------------------------------------- 4-8: the silhouette in front of an upright map that turns blue and crumbles
export const About: React.FC<SceneProps> = ({ t, u }) => {
  const blue = ramp(u, 0.35, 3.0);
  const crumble = ramp(t, EV.mapCrack, EV.mapCrack + 0.55);
  const cam = keys(u, [[0, [1.2, 6.5, 18]], [4, [-0.6, 7.6, 15]]]);
  const sh = t > EV.mapCrack && crumble < 0.9 ? 0.12 : 0;
  return (
    <>
      <Sky top="#8c7a55" bottom="#e9d9ae" mid="#d8c28e" />
      <Lights amb={1.25} sun={1.1} />
      <Cam pos={[cam[0] + Math.sin(t * 60) * sh, cam[1] + Math.cos(t * 55) * sh, cam[2]]} target={[0, 7.5, 0]} fov={52} />
      <group position={[0, 7.6, -6]} rotation={[Math.PI / 2, 0, 0]}><EuropeMap blue={blue} crumble={crumble} fall="y" scale={1.12} /></group>
      <Char pos={[0, -1.6 + (1 - ramp(u, 0, 0.5)) * -3, 5]} h={10.5} shadow={false} look={{ ...LOOK.nap, sil: "#17120f", ep: 0 }} />
    </>
  );
};

// ---------------------------------------------------------------- 8 - school cut: Corsica
const CORSICA: [number, number][] = [[9.33, 43.0], [9.46, 42.88], [9.56, 42.55], [9.51, 42.16], [9.4, 41.86], [9.28, 41.5], [9.18, 41.37], [9.0, 41.4], [8.78, 41.58], [8.62, 41.9], [8.55, 42.1], [8.62, 42.26], [8.72, 42.42], [8.9, 42.56], [9.2, 42.72]];
export const Corsica: React.FC<SceneProps> = ({ t, u }) => {
  const [cx, cy] = mapXY(9.05, 42.2);
  const dur = EV.school - 8.0;
  const k = ramp(u, 0, dur);
  const pos: V3 = [lerp(cx - 4, cx - 0.2, k), lerp(10, 3.6, k), lerp(-cy + 8, -cy + 3.4, k)];
  const pts = CORSICA.map(([lo, la]) => mapXY(lo, la));
  const bob = 0.25 * Math.sin(u * 5);
  return (
    <>
      <Room />
      <Cam pos={pos} target={[cx, 0.3, -cy]} fov={48} roll={0.04 * (1 - k)} />
      <Box p={[0, -0.05, 0]} s={[40, 0.5, 30]} c={PAL.wood} />
      <Flat p={[0, 0.22, 0]} s={[40, 28]} c="#78A0BE" />
      <EuropeMap pos={[0, 0.23, 0]} land="#EFDDAA" />
      <group position={[0, 0.5, 0]}><Poly pts={pts.map(([x, y]) => [x, y] as [number, number])} depth={0.35} c={PAL.gold} p={[0, 0, 0]} /></group>
      <group position={[cx + 0.1, 0.9 + bob, -cy - 0.1]}><Cone p={[0, 0.5, 0]} r={0.12} h={0.7} c={PAL.red} rot={[Math.PI, 0, 0]} /><Ball p={[0, 1.0, 0]} r={0.2} c={PAL.red} /></group>
      <FaceCam pos={[cx - 0.4, 2.2, -cy - 0.9]}><Sign p={[0, 0, 0]} w={2.8} h={0.8} text={["CORSICA"]} bg="#1b1511" font={110} /></FaceCam>
      <Candle p={[cx - 1.2, 0.3, -cy + 1.2]} t={t} s={0.8} />
    </>
  );
};

// ---------------------------------------------------------------- 10.3 - 13: military school
export const School: React.FC<SceneProps> = ({ t, u }) => {
  const lau = clamp((u - 0.3) / 0.4);
  const talk = 0.5 + 0.5 * Math.sin(u * 22);
  const cam = keys(u, [[0, [-1.4, 1.5, 6.2]], [2.7, [0.3, 1.25, 3.7]]]);
  const stones = Array.from({ length: 9 }, (_, i) => i);
  return (
    <>
      <Sky top="#4a4136" bottom="#6c6252" />
      <fog attach="fog" args={["#4d4435", 14, 30]} />
      <Lights amb={0.9} sun={1.0} color="#fff0c0" dir={[-6, 8, 5]} />
      <Cam pos={cam} target={[0.4, 1.1, 0]} fov={58} roll={0.03 * Math.sin(u * 1.3)} />
      <Flat p={[0, 0, 0]} s={[30, 30]} c="#6b4a2c" />
      <Box p={[0, 5, -5]} s={[24, 10, 0.6]} c="#9a8f7a" />
      <Box p={[-8, 5, 0]} s={[0.6, 10, 12]} c="#8c8270" />
      <Box p={[8, 5, 0]} s={[0.6, 10, 12]} c="#8c8270" />
      {stones.map((i) => <Box key={i} p={[-7.8 + i * 2, 2.2 + (i % 2) * 2.4, -4.6]} s={[1.9, 0.12, 0.1]} c="#6b6150" />)}
      {/* arched window with a light shaft */}
      <Box p={[-3.4, 3.4, -4.6]} s={[2.4, 3.6, 0.2]} c="#fbe9a8" emissive="#ffe9a0" ei={0.6} />
      <Ball p={[-3.4, 5.2, -4.6]} r={1.2} c="#fbe9a8" sc={[1, 1, 0.1]} emissive="#ffe9a0" />
      <Box p={[-3.4, 3.4, -4.4]} s={[0.12, 3.6, 0.1]} c="#2a2018" /><Box p={[-3.4, 3.6, -4.4]} s={[2.4, 0.12, 0.1]} c="#2a2018" />
      <Flat p={[-1.8, 1.2, -1.6]} s={[3.2, 7]} c="#fff3c0" rot={[-1.15, 0, -0.35]} opacity={0.18} emissive />
      {/* the royal-school banner */}
      <Box p={[3.6, 5.4, -4.6]} s={[2.4, 3.4, 0.2]} c={PAL.blueD} />
      {[[-0.6, 0.9], [0.6, 0.9], [0, 0], [-0.6, -0.9], [0.6, -0.9]].map(([x, y], i) => <Ball key={i} p={[3.6 + x, 5.4 + y, -4.45]} r={0.22} c={PAL.gold} />)}
      {/* the three bullies and the boy */}
      <Char pos={[-2.7, 0, -0.6]} h={2.5} flip look={{ ...LOOK.cadet, hairC: "#5A3A22", expr: "laugh", arm: "point", mouth: lau * talk }} />
      <Char pos={[2.9, 0, -0.4]} h={2.55} look={{ ...LOOK.cadet, hairC: "#1E1612", expr: "laugh", arm: "point", mouth: lau * (1 - talk) }} />
      <Char pos={[2.0, 0, -2.4]} h={2.2} look={{ ...LOOK.cadet, coat: "#5B6684", hairC: "#7A5430", expr: "laugh", arm: "point", mouth: lau * talk }} />
      <Char pos={[0.3, 0, 0.8]} h={1.75} look={{ ...LOOK.cadet, coat: PAL.blueD, hairC: "#2D2019", expr: "worry", hunch: true, arm: "down" }} />
      {[[-2.7, 3.7], [2.9, 3.8], [1.6, 3.3]].map(([x, y], i) => {
        const k = ramp(u, 0.3 + i * 0.12, 0.5 + i * 0.12);
        return <FaceCam key={i} pos={[x, y + (1 - k) * -0.6 + Math.sin(u * 14 + i) * 0.06, 0.2]} scale={k}><Sign p={[0, 0, 0]} w={1.5} h={0.7} text={["HA!"]} bg="#F3E8CB" fg="#1b1511" font={120} frame="#1b1511" /></FaceCam>;
      })}
      {/* a bubble of squiggles for the mocked accent */}
      <FaceCam pos={[0.9, 3.2, 1.2]} scale={ramp(u, 0.25, 0.55)}><Sign p={[0, 0, 0]} w={2.4} h={1.1} text={["~ ~ ~ ~"]} bg="#F3E8CB" fg="#1b1511" font={110} frame="#1b1511" /></FaceCam>
    </>
  );
};
