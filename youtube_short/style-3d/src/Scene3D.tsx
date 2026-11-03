import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import timeline from "./timeline.json";

// Real 3D (three.js) style test: a sunny kitchen, Maya, her cat and breakfast. Gravity switches off at "switched".
const E = timeline.ev;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, a: number, b: number, f = 0, to = 1, ease = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [f, to], { ...cl, easing: ease });

const SKIN = "#b9805b";
const HAIR = "#2a1a14";
const HOODIE = "#1fb5a8";

type V3 = [number, number, number];
const Mat: React.FC<{ c: string; r?: number; m?: number; e?: string; ei?: number }> = ({ c, r = 0.55, m = 0, e, ei = 0 }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000000"} emissiveIntensity={ei} />
);
const Ball: React.FC<{ p: V3; r: number; c: string; s?: V3; rough?: number; e?: string; ei?: number }> = ({ p, r, c, s = [1, 1, 1], rough, e, ei }) => (
  <mesh position={p} scale={s} castShadow receiveShadow>
    <sphereGeometry args={[r, 40, 28]} />
    <Mat c={c} r={rough} e={e} ei={ei} />
  </mesh>
);
const Box: React.FC<{ p: V3; s: V3; c: string; rot?: V3; rough?: number; e?: string; ei?: number }> = ({ p, s, c, rot = [0, 0, 0], rough, e, ei }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow>
    <boxGeometry args={s} />
    <Mat c={c} r={rough} e={e} ei={ei} />
  </mesh>
);
/** Limb hanging from a joint: group at the joint, rotated, capsule below it. */
const Limb: React.FC<{ p: V3; rot: V3; r: number; len: number; c: string; end?: React.ReactNode }> = ({ p, rot, r, len, c, end }) => (
  <group position={p} rotation={rot}>
    <mesh position={[0, -len / 2 - r * 0.2, 0]} castShadow>
      <capsuleGeometry args={[r, len, 8, 20]} />
      <Mat c={c} />
    </mesh>
    <group position={[0, -len - r * 0.4, 0]}>{end}</group>
  </group>
);

// ------------------------------------------------------------------ Maya
type Face = "sleepy" | "smile" | "surprised" | "laugh";
const Maya: React.FC<{ t: number; face: Face; armsUp: number; legsK: number; look: number }> = ({ t, face, armsUp, legsK, look }) => {
  const blink = (t + 0.4) % 3.1 < 0.12;
  const eyeSY = blink ? 0.12 : face === "sleepy" ? 0.45 : face === "laugh" ? 0.6 : face === "surprised" ? 1.15 : 1;
  const brow = face === "surprised" ? 0.05 : face === "sleepy" ? -0.01 : 0.02;
  // curls on the hair cap (fixed pseudo-random layout on the upper back of the head)
  const curls: V3[] = [];
  for (let i = 0; i < 34; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const el = 0.25 + ((i * 0.618) % 1) * 1.05;
    const r = 0.37;
    const z = Math.cos(a) * Math.sin(el) * r;
    if (z > 0.2 && el > 0.85) continue; // keep the face clear
    curls.push([Math.sin(a) * Math.sin(el) * r, Math.cos(el) * r, z]);
  }
  const armRot = (s: number): V3 => [0, 0, s * (0.18 + armsUp * 2.2) + Math.sin(t * 3 + s) * 0.05 * armsUp];
  return (
    <group>
      {/* legs */}
      {[-1, 1].map((s) => (
        <Limb key={s} p={[s * 0.1, 0.42, 0]} rot={[legsK * (s > 0 ? 0.5 : -0.3), 0, s * legsK * 0.35]} r={0.085} len={0.24} c="#3b3f6b"
          end={<Ball p={[0, -0.01, 0.06]} r={0.1} s={[1, 0.6, 1.5]} c="#fbfbfb" />} />
      ))}
      {/* hoodie body */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <capsuleGeometry args={[0.23, 0.26, 10, 28]} />
        <Mat c={HOODIE} r={0.75} />
      </mesh>
      <mesh position={[0, 0.5, 0.13]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.08]} />
        <Mat c="#169a90" r={0.8} />
      </mesh>
      <mesh position={[0, 0.9, -0.02]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow>
        <torusGeometry args={[0.17, 0.06, 14, 30]} />
        <Mat c="#18a497" r={0.8} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.78, 0.225]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.16, 8]} />
          <Mat c="#fff4e6" />
        </mesh>
      ))}
      {/* arms */}
      {[-1, 1].map((s) => (
        <Limb key={s} p={[s * 0.25, 0.84, 0]} rot={armRot(s)} r={0.065} len={0.26} c={HOODIE} end={<Ball p={[0, 0, 0]} r={0.07} c={SKIN} />} />
      ))}
      {/* head */}
      <group position={[0, 1.18, 0]} rotation={[0, look * 0.35, Math.sin(t * 1.3) * 0.04]}>
        <Ball p={[0, 0, 0]} r={0.36} c={SKIN} s={[1, 0.96, 0.95]} rough={0.5} />
        {[-1, 1].map((s) => <Ball key={s} p={[s * 0.35, -0.02, 0]} r={0.07} c={SKIN} s={[0.6, 1, 1]} />)}
        {/* hair cap + curls + two puffs */}
        <mesh position={[0, 0.03, -0.02]} rotation={[-0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.38, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <Mat c={HAIR} r={0.85} />
        </mesh>
        {curls.map((p, i) => <Ball key={i} p={[p[0], p[1] + 0.02, p[2] - 0.03]} r={0.075 + (i % 3) * 0.012} c={i % 4 ? HAIR : "#3d271d"} rough={0.9} />)}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.3, 0.3, -0.05]}>
            <Ball p={[0, 0, 0]} r={0.17} c={HAIR} rough={0.9} />
            {Array.from({ length: 9 }).map((_, i) => (
              <Ball key={i} p={[Math.cos(i * 0.7) * 0.14, Math.sin(i * 1.3) * 0.13, Math.sin(i * 0.7) * 0.12]} r={0.07} c={i % 3 ? HAIR : "#3d271d"} rough={0.9} />
            ))}
            <mesh position={[-s * 0.1, -0.1, 0]} rotation={[0, 0, s * 0.8]}>
              <torusGeometry args={[0.08, 0.025, 10, 20]} />
              <Mat c="#ffcc33" r={0.4} />
            </mesh>
          </group>
        ))}
        {/* eyes: glossy whites, big brown irises, two highlights each */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.13, 0.0, 0.3]} scale={[1, eyeSY, 1]}>
            <mesh scale={[1, 1.15, 0.55]}>
              <sphereGeometry args={[0.085, 32, 24]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={1} />
            </mesh>
            <mesh position={[look * 0.015, -0.005, 0.042]} scale={[1, 1.12, 0.4]}>
              <sphereGeometry args={[0.06, 32, 24]} />
              <meshPhysicalMaterial color="#5a2e16" roughness={0.2} clearcoat={1} />
            </mesh>
            <mesh position={[look * 0.015, -0.005, 0.062]} scale={[1, 1.1, 0.3]}>
              <sphereGeometry args={[0.032, 24, 16]} />
              <meshBasicMaterial color="#140a08" />
            </mesh>
            <mesh position={[look * 0.015 - 0.02, 0.025, 0.072]}>
              <sphereGeometry args={[0.014, 16, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[look * 0.015 + 0.018, -0.025, 0.07]}>
              <sphereGeometry args={[0.007, 12, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* lashes */}
            <mesh position={[0, 0.03, 0.03]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.085, 0.012, 8, 24, Math.PI]} />
              <Mat c="#140a08" />
            </mesh>
          </group>
        ))}
        {/* brows */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.13, 0.15 + brow, 0.31]} rotation={[0, 0, Math.PI / 2 + s * (face === "surprised" ? -0.15 : 0.12)]}>
            <capsuleGeometry args={[0.014, 0.07, 4, 8]} />
            <Mat c={HAIR} />
          </mesh>
        ))}
        {/* cheeks + nose */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.22, -0.1, 0.27]} scale={[1, 0.6, 0.3]}>
            <sphereGeometry args={[0.05, 20, 14]} />
            <meshStandardMaterial color="#ff7f8f" transparent opacity={0.45} roughness={0.8} />
          </mesh>
        ))}
        <Ball p={[0, -0.06, 0.345]} r={0.025} c="#a86e4c" />
        {/* mouth */}
        {face === "surprised" ? (
          <mesh position={[0, -0.16, 0.32]} scale={[1, 1.3, 0.4]}>
            <sphereGeometry args={[0.035, 20, 14]} />
            <meshStandardMaterial color="#5c1a24" roughness={0.6} />
          </mesh>
        ) : face === "laugh" ? (
          <group position={[0, -0.15, 0.32]}>
            <mesh scale={[1.3, 0.8, 0.4]}>
              <sphereGeometry args={[0.055, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color="#5c1a24" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.025, 0.01]} scale={[1, 0.5, 0.4]}>
              <sphereGeometry args={[0.03, 16, 12]} />
              <meshStandardMaterial color="#ff6b80" />
            </mesh>
          </group>
        ) : (
          <mesh position={[0, -0.13, 0.32]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.011, 8, 24, Math.PI]} />
            <Mat c="#5c1a24" />
          </mesh>
        )}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ the cat
const Cat: React.FC<{ t: number; float: number }> = ({ t, float }) => (
  <group>
    <Ball p={[0, 0.18, 0]} r={0.2} s={[1.2, 0.85, 0.9]} c="#f29a4a" />
    <Ball p={[0.22, 0.33, 0]} r={0.14} c="#f29a4a" />
    {[-1, 1].map((s) => (
      <mesh key={s} position={[0.24, 0.47, s * 0.07]} rotation={[s * 0.3, 0, -0.1]} castShadow>
        <coneGeometry args={[0.045, 0.09, 12]} />
        <Mat c="#f29a4a" />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <group key={s}>
        <Ball p={[0.35, 0.35, s * 0.05]} r={0.022} c="#1a1a1a" s={[0.5, 1.2, 1]} />
        <Ball p={[0.358, 0.36, s * 0.05 + 0.005]} r={0.007} c="#ffffff" />
      </group>
    ))}
    <Ball p={[0.36, 0.3, 0]} r={0.014} c="#ff8fa0" />
    {[[-0.12, -1], [-0.12, 1], [0.12, -1], [0.12, 1]].map(([x, s], i) => (
      <Ball key={i} p={[x, 0.04 - float * 0.03, s * 0.09 + s * float * 0.05]} r={0.05} c="#ffd9b0" />
    ))}
    <mesh position={[-0.28, 0.25, 0]} rotation={[0, 0, 0.9 + Math.sin(t * 2.4) * 0.25 + float * 0.6]} castShadow>
      <capsuleGeometry args={[0.03, 0.26, 6, 12]} />
      <Mat c="#e0873a" />
    </mesh>
  </group>
);

// ------------------------------------------------------------------ the camera
const Cam: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const keys: [number, V3, V3][] = [
      [0, [0.2, 1.35, 4.4], [0.2, 0.9, 0]],
      [E.off, [-0.6, 1.4, 3.7], [0.3, 0.95, 0]],
      [E.cereal - 0.3, [2.3, 1.45, 1.5], [1.1, 1.1, -0.55]],
      [E.cat - 0.4, [2.1, 1.6, 1.8], [1.0, 1.25, -0.5]],
      [E.cat + 0.1, [-1.8, 1.0, 2.6], [-1.2, 1.0, -0.2]],
      [E.you0, [-1.6, 1.1, 2.9], [-1.0, 1.3, 0]],
      [E.you0 + 0.3, [0.4, 0.55, 3.6], [0.1, 1.5, 0]],
      [10, [0.0, 0.5, 4.6], [0.1, 1.7, 0]],
    ];
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const [t0, p0, l0] = keys[i];
    const [t1, p1, l1] = keys[i + 1];
    const k = ip(t, t0, t1);
    const lerp = (a: V3, b: V3) => a.map((v, j) => v + (b[j] - v) * k) as V3;
    const p = lerp(p0, p1);
    const l = lerp(l0, l1);
    camera.position.set(...p);
    camera.lookAt(...l);
    camera.updateProjectionMatrix();
  }, [t, camera]);
  return null;
};

// ------------------------------------------------------------------ the kitchen
export const Scene3D: React.FC<{ t: number }> = ({ t }) => {
  const off = ip(t, E.off, E.off + 1.2, 0, 1, Easing.out(Easing.quad));
  const fl = (lift: number, ph: number, k = off) => k * (lift + Math.sin(t * 1.6 + ph) * 0.05);
  const spin = (ph: number, k = off) => k * (t - E.off) * (0.4 + (ph % 1) * 0.6);
  const catK = ip(t, E.cat - 0.2, E.cat + 1.0, 0, 1, Easing.out(Easing.quad));
  const mayaK = ip(t, E.you0, E.you0 + 1.4, 0, 1, Easing.out(Easing.quad));
  const face: Face = t < 1.6 ? "sleepy" : t < E.off + 0.2 ? "smile" : t < E.you + 0.1 ? "surprised" : "laugh";
  const cereal = Array.from({ length: 22 }).map((_, i) => {
    const a = i * 2.4;
    const r = 0.04 + (i % 5) * 0.012;
    const k = ip(t, E.off + 0.2 + (i % 7) * 0.08, E.cereal + 1.6, 0, 1, Easing.out(Easing.quad));
    return { p: [1.15 + Math.cos(a) * (r + k * 0.35), 0.86 + k * (0.3 + (i % 6) * 0.1) + Math.sin(t * 2 + i) * 0.02 * k, -0.55 + Math.sin(a) * (r + k * 0.3)] as V3, rot: t * (1 + (i % 3)) * k + i };
  });
  return (
    <>
      <Cam t={t} />
      <color attach="background" args={["#f6e3c9"]} />
      <fog attach="fog" args={["#f6e3c9", 7, 14]} />
      <hemisphereLight args={["#fff6ea", "#c99a6a", 0.75]} />
      <directionalLight position={[3.5, 5, 3]} intensity={2.2} color="#fff1d6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} shadow-radius={4} />
      <pointLight position={[-2, 2.2, 2]} intensity={6} color="#ffd2a8" distance={8} />
      {/* room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <Mat c="#c98f5e" r={0.7} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => <Box key={i} p={[-6.5 + i, 0.002, 0]} s={[0.02, 0.002, 10]} c="#a8703f" />)}
      <mesh position={[0, 2.5, -2.6]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <Mat c="#f3c9a0" r={0.9} />
      </mesh>
      <Box p={[0, 0.5, -2.58]} s={[14, 1, 0.04]} c="#e8a37a" />
      <Box p={[0, 1.01, -2.56]} s={[14, 0.05, 0.06]} c="#fff4e6" />
      <mesh position={[-4.2, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <Mat c="#f7d3ae" r={0.9} />
      </mesh>
      {/* window with sky */}
      <Box p={[-0.9, 2.0, -2.55]} s={[1.6, 1.2, 0.02]} c="#9fdcff" e="#bfe9ff" ei={0.9} />
      <Box p={[-0.9, 2.0, -2.53]} s={[0.05, 1.2, 0.03]} c="#ffffff" />
      <Box p={[-0.9, 2.0, -2.53]} s={[1.6, 0.05, 0.03]} c="#ffffff" />
      <Box p={[-0.9, 1.38, -2.48]} s={[1.8, 0.06, 0.16]} c="#ffffff" />
      {[-1, 1].map((s) => <Box key={s} p={[-0.9 + s * 1.0, 2.05, -2.5]} s={[0.35, 1.5, 0.05]} c="#ff8a7a" rough={0.95} />)}
      {/* shelf with books + plant (books float off) */}
      <Box p={[2.2, 1.9, -2.45]} s={[1.4, 0.05, 0.25]} c="#8a5a3a" />
      {["#e0566c", "#3f7fd6", "#f2c84b", "#5ab06a", "#8e5bd0"].map((c, i) => (
        <mesh key={i} position={[1.7 + i * 0.22, 2.07 + fl(0.25 + i * 0.07, i), -2.42 + fl(0.15, i + 2)]} rotation={[0, 0, spin(i * 0.37) * 0.6]} castShadow>
          <boxGeometry args={[0.12, 0.3, 0.2]} />
          <Mat c={c} r={0.6} />
        </mesh>
      ))}
      <group position={[-3.4, 0, -1.8]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.2, 0.5, 24]} />
          <Mat c="#e07a4a" />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i) * 0.12, 0.75 + (i % 3) * 0.12, Math.sin(i) * 0.12]} rotation={[Math.cos(i) * 0.6, i, Math.sin(i) * 0.6 + Math.sin(t + i) * 0.05]} castShadow scale={[0.5, 1.4, 0.15]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <Mat c={i % 2 ? "#4f9e5d" : "#3f8a50"} />
          </mesh>
        ))}
      </group>
      {/* table + breakfast */}
      <group>
        <Box p={[1.15, 0.74, -0.55]} s={[1.5, 0.07, 0.9]} c="#f0d9b8" rough={0.6} />
        {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z], i) => <Box key={i} p={[1.15 + x, 0.36, -0.55 + z]} s={[0.07, 0.72, 0.07]} c="#c9a07a" />)}
        <group position={[1.15, 0.86 + fl(0.45, 1), -0.55]} rotation={[spin(0.2) * 0.5, 0, spin(0.7) * 0.4]}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color="#ff6f61" roughness={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <Mat c="#fffaf0" r={0.3} />
          </mesh>
        </group>
        {cereal.map((c, i) => (
          <mesh key={i} position={c.p} rotation={[c.rot, c.rot * 0.7, 0]} castShadow>
            <torusGeometry args={[0.022, 0.011, 8, 16]} />
            <Mat c={["#f2b23a", "#e8743a", "#f6d36b"][i % 3]} r={0.7} />
          </mesh>
        ))}
        <mesh position={[0.65, 0.84 + fl(0.6, 3), -0.35]} rotation={[spin(0.5), 0, spin(0.9)]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, 0.17, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} transparent opacity={0.85} />
        </mesh>
        <mesh position={[1.55, 0.86 + fl(0.35, 5), -0.7]} rotation={[spin(0.3), spin(0.6), 0]} castShadow>
          <boxGeometry args={[0.18, 0.28, 0.07]} />
          <Mat c="#3f7fd6" />
        </mesh>
        <mesh position={[1.35, 0.79 + fl(0.55, 7), -0.3]} rotation={[0, spin(0.8), Math.PI / 2 + spin(0.4)]} castShadow>
          <capsuleGeometry args={[0.012, 0.16, 4, 8]} />
          <meshStandardMaterial color="#d9dde6" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
      {/* chair */}
      <group position={[0.2, 0, -0.9]}>
        <Box p={[0, 0.46, 0]} s={[0.5, 0.06, 0.5]} c="#7fb3c9" />
        <Box p={[0, 0.8, -0.23]} s={[0.5, 0.6, 0.05]} c="#7fb3c9" />
        {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([x, z], i) => <Box key={i} p={[x, 0.22, z]} s={[0.05, 0.44, 0.05]} c="#5a8ea3" />)}
      </group>
      {/* cat */}
      <group position={[-1.2, fl(0.9, 2, catK), 0.1]} rotation={[0, 0.6, catK * (t - E.cat) * 0.5]}>
        <Cat t={t} float={catK} />
      </group>
      {/* Maya */}
      <group position={[-0.05, mayaK * (0.75 + Math.sin(t * 1.8) * 0.05), 0.35]} rotation={[mayaK * 0.15, -0.15 + mayaK * Math.sin(t * 0.9) * 0.3, mayaK * -0.12]}>
        <Maya t={t} face={face} armsUp={Math.max(t > 0.8 && t < 1.9 ? Math.sin(ip(t, 0.8, 1.9, 0, Math.PI, Easing.linear)) * 0.8 : 0, mayaK)} legsK={mayaK}
          look={t < E.off ? 0.5 : t < E.cat ? 0.8 : t < E.you0 ? -0.8 : 0} />
      </group>
      {/* floating dust motes in the sunlight */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} position={[-2.5 + (i * 0.37) % 5, 0.4 + ((i * 0.53 + t * 0.05 * (1 + off * 3)) % 2.4), -1.5 + (i * 0.71) % 3]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color="#fff3c4" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
};
