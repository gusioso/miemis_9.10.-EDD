import React from "react";
import { SceneProps } from "../Video";
import { Ball, Box, Candle, Cam, Char, Cyl, EV, Flat, Glow, LOOK, Lights, PAL, Ship, Sky, Stars, Torus, clamp, hash, keys, lerp, lin, ramp, V3 } from "../lib";

// ---------------------------------------------------------------- 13 - officer: the siege of Toulon, night
export const Toulon: React.FC<SceneProps> = ({ t, u }) => {
  const salvos = EV.salvo;
  const since = (s: number) => t - s;
  const rec = salvos.reduce((a, s) => Math.max(a, t >= s ? 0.5 * Math.exp(-(t - s) * 9) : 0), 0);
  const flash = salvos.reduce((a, s) => Math.max(a, t >= s ? Math.exp(-(t - s) * 12) : 0), 0);
  const shake = salvos.reduce((a, s) => Math.max(a, t >= s ? 0.28 * Math.exp(-(t - s) * 7) : 0), 0);
  const cam = keys(u, [[0, [1.4, 3.2, 10.5]], [2.65, [0.6, 2.9, 8.0]]]);
  const targets: V3[] = [[-14, 3, -62], [0, 3, -78], [14, 3, -66], [-6, 3, -72]];
  return (
    <>
      <Sky top="#070a22" bottom="#5a3b55" mid="#2a2650" />
      <Stars />
      <fog attach="fog" args={["#241f45", 40, 160]} />
      <Lights amb={0.55} sun={0.7} color="#aab4ff" dir={[-6, 12, 8]} />
      <Cam pos={[cam[0] + Math.sin(t * 70) * shake, cam[1] + Math.cos(t * 63) * shake, cam[2]]} target={[-1, 2.0, -25]} fov={58} />
      <Flat p={[0, 0, -60]} s={[500, 300]} c="#1a2c48" />
      {/* the harbour town, far */}
      {Array.from({ length: 16 }, (_, i) => <Box key={i} p={[-90 + i * 12, 3 + hash(i, 3) * 6, -130]} s={[9, 6 + hash(i, 4) * 10, 5]} c="#0b0e1e" />)}
      {Array.from({ length: 20 }, (_, i) => <Box key={i} p={[-90 + i * 9.4, 4 + hash(i, 8) * 4, -127]} s={[0.7, 0.9, 0.2]} c="#ffcf6a" emissive="#ffb030" />)}
      <Ball p={[24, 22, -120]} r={4} c="#efe6c8" emissive="#efe6c8" />
      <Glow p={[24, 22, -120]} s={34} c="#d8dcff" o={0.35} />
      {/* ships */}
      <Ship p={[-14, 0, -62]} s={1.8} lit={salvos.some((s) => since(s) > 0.28 && since(s) < 0.5 && salvos.indexOf(s) % 3 === 0) ? 1 : 0} />
      <Ship p={[0, 0, -78]} s={2.2} lit={salvos.some((s) => since(s) > 0.28 && since(s) < 0.5 && salvos.indexOf(s) % 3 === 1) ? 1 : 0} />
      <Ship p={[14, 0, -66]} s={1.8} lit={salvos.some((s) => since(s) > 0.28 && since(s) < 0.5 && salvos.indexOf(s) % 3 === 2) ? 1 : 0} />
      {/* the hill and battery */}
      <Box p={[0, -2, 4]} s={[30, 5, 22]} c="#0c0d16" />
      <Box p={[-6, 0.6, 0]} s={[5, 1.2, 1.2]} c="#14151f" /><Box p={[5.5, 0.6, -1]} s={[5, 1.2, 1.2]} c="#14151f" />
      <group position={[0, 0, 1.2 + rec]}>
        <Cyl p={[0, 1.55, -0.6]} r={0.46} r2={0.34} h={4.2} c="#6e5a2e" rot={[Math.PI / 2 - 0.1, 0, 0]} />
        <Cyl p={[0, 1.55, 1.45]} r={0.14} h={0.5} c="#4a3c1e" rot={[Math.PI / 2, 0, 0]} />
        <Box p={[0, 1.0, 0.3]} s={[1.3, 0.5, 3.6]} c="#5b3d22" />
        {[-1, 1].map((sd) => <Cyl key={sd} p={[sd * 0.95, 0.85, 0.3]} r={0.85} h={0.28} c="#6b4a2a" rot={[0, 0, Math.PI / 2]} />)}
      </group>
      <Char pos={[-2.6, 0, 1.4]} h={2.1} look={{ ...LOOK.soldier, sil: "#171a2c", arm: "aim" }} />
      <Char pos={[3.1, 0, 0.4]} h={2.0} flip look={{ ...LOOK.soldier, sil: "#171a2c", arm: "down" }} />
      {/* flashes, smoke, shot, hits */}
      {salvos.map((s, i) => {
        const a = t - s; if (a < 0 || a > 1.6) return null;
        const ta = targets[i % 4];
        const p = clamp(a / 0.28);
        const ball: V3 = [lerp(0, ta[0], p), lerp(2.2, ta[1] + 2, p) + Math.sin(p * Math.PI) * 2, lerp(-2, ta[2], p)];
        const hit = a - 0.28;
        return (
          <React.Fragment key={i}>
            {a < 0.16 && <Glow p={[0, 2.1, -2.6]} s={9 * (1 - a * 3)} c="#ffb347" o={1} />}
            {a < 0.28 && <Ball p={ball} r={0.2} c="#222" />}
            {Array.from({ length: 6 }, (_, k) => <Ball key={k} p={[(hash(i, k) - 0.5) * 2 * a * 3, 2.2 + a * 1.2 + k * 0.1, -4 - a * 7 - k * 0.5]} r={0.25 + a * 0.7} c="#8c8a92" sc={[1, 0.8, 1]} />)}
            {hit > 0 && hit < 0.45 && <Glow p={[ta[0], 4, ta[2]]} s={26 * (0.4 + hit * 2)} c="#ff9a3a" o={1 - hit * 2} />}
          </React.Fragment>
        );
      })}
      <pointLight position={[0, 3, -1]} intensity={80 * flash} distance={40} color="#ffa040" />
    </>
  );
};

// ---------------------------------------------------------------- the officer studies a map by candlelight
export const Officer: React.FC<SceneProps> = ({ t, u }) => {
  const route: [number, number][] = [[-1.6, 1.0], [-0.8, 0.5], [0, 0.2], [0.8, -0.3], [1.8, -0.5]];
  const p = lin(u, 0, 1.0) * 4;
  const cam = keys(u, [[0, [0.4, 2.7, 7.0]], [1.4, [0.1, 2.3, 5.6]]]);
  return (
    <>
      <Sky top="#0d0805" bottom="#2a170b" />
      <fog attach="fog" args={["#150c06", 8, 22]} />
      <Lights amb={0.35} sun={0.25} color="#ffc890" />
      <Cam pos={cam} target={[0, 1.9, -0.6]} fov={52} roll={0.04} />
      <Box p={[0, 4, -4.5]} s={[16, 10, 0.4]} c="#3b2616" />
      <Box p={[-4.5, 3.5, -4.2]} s={[1.6, 7, 0.3]} c="#5b1a1c" /><Box p={[4.5, 3.5, -4.2]} s={[1.6, 7, 0.3]} c="#5b1a1c" />
      <Char pos={[0, 0, -1.7]} h={3.7} look={{ ...LOOK.nap, hunch: true, expr: "serious", ep: 0 }} />
      <Box p={[0, 0.75, 0.2]} s={[7, 0.2, 3.2]} c="#6a4224" /><Box p={[0, 0.0, 0.2]} s={[6.4, 1.5, 2.8]} c="#4a2d18" />
      <Flat p={[0, 0.87, 0.2]} s={[5.4, 2.6]} c="#E6D6A8" />
      <Flat p={[-1.3, 0.875, 0.5]} s={[1.8, 0.2]} c="#8a7a50" rot={[-Math.PI / 2, 0, 0.3]} />
      {route.map(([x, z], i) => (i <= p ? <Ball key={i} p={[x, 0.95, z + 0.2]} r={0.1} c={PAL.red} /> : null))}
      {route.slice(0, -1).map(([x, z], i) => (i < p ? <Box key={i} p={[(x + route[i + 1][0]) / 2, 0.9, (z + route[i + 1][1]) / 2 + 0.2]} s={[Math.hypot(route[i + 1][0] - x, route[i + 1][1] - z), 0.03, 0.06]} c={PAL.red} rot={[0, -Math.atan2(route[i + 1][1] - z, route[i + 1][0] - x), 0]} /> : null))}
      <Candle p={[2.8, 0.85, 0.3]} t={t} s={1.5} />
    </>
  );
};

// ---------------------------------------------------------------- 17: the general's epaulettes
export const Epaulette: React.FC<SceneProps> = ({ t, u }) => {
  const ep = ramp(u, 0.05, 0.3);
  const land = u - 0.28;
  const cam = keys(u, [[0, [0, 4.1, 9.6]], [1.98, [0, 4.0, 7.8]]]);
  return (
    <>
      <Sky top="#2c1018" bottom="#4a1a22" />
      <Lights amb={1.0} sun={1.2} />
      <Cam pos={cam} target={[0, 3.9, 0]} fov={48} />
      {[-6, -3, 0, 3, 6].map((x, i) => <Box key={i} p={[x, 4, -3]} s={[1.5, 12, 0.5]} c={i % 2 ? "#6a1a22" : "#511319"} />)}
      <Char pos={[0, -1.2, 0]} h={9} shadow={false} look={{ ...LOOK.nap, ep }} />
      {land > 0 && land < 0.5 && [-1, 1].map((sd) => <Glow key={sd} p={[sd * 2.2, 4.4, 1]} s={3.6 * (0.5 + land * 3)} c="#ffe28a" o={1 - land * 2} />)}
      {Array.from({ length: 10 }, (_, i) => { const p = (u * 1.1 + hash(i, 1)) % 1; return <Glow key={i} p={[(i % 2 ? 1 : -1) * (2 + hash(i, 2) * 1.2), 4.1 + hash(i, 3) * 1.1, 1.2]} s={0.5 + 0.4 * Math.sin(p * Math.PI)} c="#ffe9a0" o={u > 0.3 ? Math.sin(p * Math.PI) : 0} />; })}
    </>
  );
};

// ---------------------------------------------------------------- 1799: soldiers pour into the hall
export const Coup: React.FC<SceneProps> = ({ t, u }) => {
  const cam = keys(u, [[0, [0, 1.7, 14]], [2.8, [0, 1.6, 9]]]);
  const bench: [number, number][] = [];
  for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) bench.push([sd * (4.2 + r * 1.1), -4 - i * 2.2 - r * 0.2]);
  return (
    <>
      <Sky top="#8c8470" bottom="#c9bfa4" />
      <fog attach="fog" args={["#bfb596", 14, 50]} />
      <Lights amb={0.95} sun={1.0} color="#fff3d0" dir={[0, 12, 8]} />
      <Cam pos={cam} target={[0, 1.8, -10]} fov={60} roll={0.025 * Math.sin(u * 1.5)} />
      <Flat p={[0, 0, -12]} s={[22, 50]} c="#8a7552" />
      {Array.from({ length: 14 }, (_, i) => <Flat key={i} p={[0, 0.01, 8 - i * 3.6]} s={[22, 0.15]} c="#5a4a30" />)}
      <Box p={[0, 5, -26]} s={[24, 12, 0.6]} c="#a79c82" />
      <Box p={[0, 3.6, -25.6]} s={[5, 7.2, 0.3]} c="#fff3c8" emissive="#fff0b0" ei={1.1} />
      <Glow p={[0, 4, -24]} s={16} c="#fff0b0" o={0.7} />
      {[-1, 1].flatMap((sd) => [0, 1, 2, 3, 4, 5].map((i) => <Cyl key={`${sd}${i}`} p={[sd * 9, 4.5, 4 - i * 5.5]} r={0.7} h={9} c="#e7dfc8" />))}
      {bench.map(([x, z], i) => <Char key={i} pos={[x, 0, z]} h={1.5} look={{ ...LOOK.cadet, sil: "#17120f", arm: i % 3 === 0 && u > 1 ? "up" : "down" }} />)}
      {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3, 4].map((c) => {
        const z = lerp(-24, 5.5, ramp(u, 0.12 + r * 0.32, 2.9)) ;
        const run = (u - 0.12 - r * 0.32);
        if (run < 0) return null;
        return <Char key={`${r}${c}`} pos={[(c - 2) * 1.7, 0, z + (hash(r, c) - 0.5) * 0.4]} h={2.3} look={{ ...LOOK.soldier, walk: u * 1.6 + c * 0.13 + r * 0.2 }} />;
      }))}
    </>
  );
};

// ---------------------------------------------------------------- 1804: Notre-Dame, the crown
export const Coronation: React.FC<SceneProps> = ({ t, u }) => {
  const lift = ramp(t, EV.crownLift, EV.crownLift + 0.55);
  const place = ramp(t, EV.crownOn - 0.1, EV.crownOn);
  const crowned = t >= EV.crownOn;
  const a = t - EV.crownOn;
  const crownY = lerp(2.3, 4.5, lift) - (crowned || place > 0 ? 1.55 * place : 0);
  const cam = keys(u, [[0, [0, 1.6, 4.2]], [3.1, [0.4, 2.4, 2.8]]]);
  return (
    <>
      <Sky top="#14152f" bottom="#3a2c3c" />
      <fog attach="fog" args={["#241c30", 14, 48]} />
      <Lights amb={0.7} sun={0.8} color="#ffe0b0" dir={[0, 14, 10]} />
      <Cam pos={cam} target={[0, 3.0, -9]} fov={58} />
      <Flat p={[0, 0, -12]} s={[26, 50]} c="#5c5648" />
      <Flat p={[0, 0.02, -10]} s={[3.4, 40]} c="#6a1a22" />
      {[-1, 1].flatMap((sd) => [0, 1, 2, 3, 4].map((i) => <React.Fragment key={`${sd}${i}`}><Cyl p={[sd * 6.2, 5.5, 1 - i * 6]} r={0.7} h={11} c="#8e8573" /><Box p={[sd * 3.4, 11, 1 - i * 6]} s={[5.6, 0.7, 0.8]} c="#7a7262" rot={[0, 0, -sd * 0.28]} /></React.Fragment>))}
      <Box p={[0, 7, -24]} s={[26, 18, 0.6]} c="#3d3547" />
      {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[Math.cos((i / 12) * Math.PI * 2) * 2.2, 11 + Math.sin((i / 12) * Math.PI * 2) * 2.2, -23.6]} s={[1.9, 0.7, 0.1]} rot={[0, 0, (i / 12) * Math.PI * 2]} c={[PAL.blue, PAL.red, PAL.gold, "#5E8F6A"][i % 4]} emissive={[PAL.blue, PAL.red, PAL.gold, "#5E8F6A"][i % 4]} ei={0.8} />)}
      <Glow p={[0, 11, -23]} s={14} c="#ffd9a0" o={0.5} />
      {[-1, 1].flatMap((sd) => [0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((i) => <Char key={`${sd}${r}${i}`} pos={[sd * (2.6 + i * 0.9 + r * 0.3), 0, -3 - r * 2.2]} h={1.55} look={{ ...LOOK.cadet, sil: r % 2 ? "#241a20" : "#1a1218", arm: crowned && (i + r) % 2 ? "up" : "down", hunch: false }} />)))}
      <Box p={[-4.3, 0.55, -5.6]} s={[1.5, 1.1, 1.5]} c={PAL.gold} />
      <Char pos={[-4.3, 0.9, -5.6]} h={2.0} look={{ ...LOOK.pope, expr: "serious" }} />
      <Char pos={[0, 0, -2.4]} h={3.4} look={{ ...LOOK.nap, coat: "#8A1D24", pants: "#8A1D24", hat: "none", back: true, ep: 0, coattails: false, sash: undefined, vest: undefined, arm: t < EV.crownLift - 0.2 ? "behind" : crowned && a > 0.25 ? "down" : "up", hairC: "#2b211e" }} />
      {t >= EV.crownLift - 0.1 && <Torus p={[0, crownY, -2.4]} r={0.42} tube={0.09} c={PAL.gold} emissive="#b8860b" />}
      {a > 0 && a < 0.7 && <Glow p={[0, 3.2, -2.4]} s={9 * (0.3 + a * 1.6)} c="#ffe28a" o={0.9 * (1 - a / 0.7)} />}
      {a > 0 && Array.from({ length: 14 }, (_, i) => <Glow key={i} p={[Math.cos(i * 2.4) * (0.8 + a * 3 * hash(i, 1)), 3.2 + Math.sin(i * 2.4) * (0.6 + a * 2 * hash(i, 2)), -2]} s={0.5} c="#fff0b0" o={clamp(1 - a / 1.2)} />)}
    </>
  );
};
