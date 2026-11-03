import React from "react";
import * as THREE from "three";

// Leo: the tall, handsome lead (about 1.9 m). Broad shoulders and a V-taper, strong square jaw, hooded "hunter" eyes
// with a slight upward tilt, low thick brows, light stubble, a textured quiff. White tee, open olive bomber,
// dark jeans, white sneakers. Units: metres, feet at y = 0, facing +z.
export type LeoFace = "smirk" | "surprised" | "laugh" | "calm";
type V3 = [number, number, number];

const SKIN = "#d9a07a";
const SKIN_D = "#c08460";
const HAIR = "#2b1c15";
const JACKET = "#4f5a3a";
const JEANS = "#2a3350";

const M: React.FC<{ c: string; r?: number; o?: number }> = ({ c, r = 0.6, o }) => (
  <meshStandardMaterial color={c} roughness={r} transparent={o !== undefined} opacity={o ?? 1} />
);
const S: React.FC<{ p: V3; r: number; c: string; s?: V3; rot?: V3; rough?: number; o?: number }> = ({ p, r, c, s = [1, 1, 1], rot = [0, 0, 0], rough, o }) => (
  <mesh position={p} scale={s} rotation={rot} castShadow receiveShadow>
    <sphereGeometry args={[r, 36, 26]} />
    <M c={c} r={rough} o={o} />
  </mesh>
);
const Cap: React.FC<{ p?: V3; r: number; len: number; c: string; rot?: V3 }> = ({ p = [0, 0, 0], r, len, c, rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot} castShadow>
    <capsuleGeometry args={[r, len, 8, 20]} />
    <M c={c} />
  </mesh>
);

// tapered torso (V shape) as a lathe; jacket version leaves an opening at the front
const torsoPts = (k: number) =>
  [[0.15, 0.0], [0.165, 0.08], [0.18, 0.2], [0.215, 0.33], [0.245, 0.44], [0.25, 0.5], [0.2, 0.56], [0.08, 0.6]].map(
    ([r, y]) => new THREE.Vector2(r * k, y),
  );
const TORSO = new THREE.LatheGeometry(torsoPts(1), 40);
const JACKET_G = new THREE.LatheGeometry(torsoPts(1.07), 40, 0.42, Math.PI * 2 - 0.84);

/** Two-segment limb: shoulder/hip rotation a, elbow/knee bend b (radians, around x for legs, z for arms). */
const Limb: React.FC<{ p: V3; a: V3; b: V3; r1: number; r2: number; l1: number; l2: number; c1: string; c2: string; end: React.ReactNode }> = ({
  p, a, b, r1, r2, l1, l2, c1, c2, end,
}) => (
  <group position={p} rotation={a}>
    <Cap p={[0, -l1 / 2, 0]} r={r1} len={l1} c={c1} />
    <group position={[0, -l1, 0]} rotation={b}>
      <Cap p={[0, -l2 / 2, 0]} r={r2} len={l2} c={c2} />
      <group position={[0, -l2 - r2 * 0.6, 0]}>{end}</group>
    </group>
  </group>
);

export const Leo: React.FC<{ t: number; face: LeoFace; armsUp: number; legsK: number; look: number; hips?: number }> = ({ t, face, armsUp, legsK, look, hips = 0 }) => {
  const blink = (t + 1.1) % 3.7 < 0.11;
  const lid = blink ? 0.08 : face === "surprised" ? 1.15 : face === "laugh" ? 0.55 : 0.78; // hooded eyes by default
  const browY = face === "surprised" ? 0.045 : 0.03;
  const browTilt = face === "surprised" ? -0.05 : 0.12;
  const breathe = Math.sin(t * 2.0) * 0.004;
  const armZ = (s: number): V3 => [hips * 0.3, 0, s * (0.12 + armsUp * 2.3 + hips * 0.35) + Math.sin(t * 3 + s) * 0.05 * armsUp];
  const elbow = (s: number): V3 => [0, 0, s * -(0.15 + hips * 1.2) * (1 - armsUp)];
  return (
    <group>
      {/* legs: jeans + white sneakers */}
      {[-1, 1].map((s) => (
        <Limb key={s} p={[s * 0.1, 0.93, 0]} a={[legsK * (s > 0 ? -0.35 : 0.2), 0, s * (0.03 + legsK * 0.2)]} b={[legsK * (s > 0 ? 0.9 : 0.4), 0, 0]}
          r1={0.078} r2={0.066} l1={0.4} l2={0.4} c1={JEANS} c2={JEANS}
          end={
            <group>
              <S p={[0, -0.01, 0.06]} r={0.075} s={[1.05, 0.55, 1.9]} c="#f6f6f2" rough={0.5} />
              <mesh position={[0, -0.045, 0.06]} scale={[1.08, 0.18, 1.95]}>
                <sphereGeometry args={[0.075, 24, 16]} />
                <M c="#d9d9d4" />
              </mesh>
            </group>
          } />
      ))}
      {/* hips / belt */}
      <mesh position={[0, 0.93, 0]} scale={[1, 0.5, 0.72]} castShadow>
        <sphereGeometry args={[0.17, 30, 20]} />
        <M c={JEANS} />
      </mesh>
      {/* torso: fitted white tee under an open bomber */}
      <group position={[0, 0.92 + breathe, 0]} scale={[1, 1, 0.62]}>
        <mesh geometry={TORSO} castShadow>
          <M c="#f4f2ec" r={0.8} />
        </mesh>
        <mesh geometry={JACKET_G} castShadow>
          <meshStandardMaterial color={JACKET} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* collar + subtle chest line */}
      <mesh position={[0, 1.47, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} castShadow>
        <torusGeometry args={[0.11, 0.025, 10, 30]} />
        <M c="#3f492e" />
      </mesh>
      {/* shoulders */}
      {[-1, 1].map((s) => <S key={s} p={[s * 0.25, 1.39, 0]} r={0.095} c={JACKET} s={[1.1, 0.9, 0.9]} rough={0.7} />)}
      {/* arms */}
      {[-1, 1].map((s) => (
        <Limb key={s} p={[s * 0.28, 1.38, 0]} a={armZ(s)} b={elbow(s)} r1={0.065} r2={0.056} l1={0.27} l2={0.25} c1={JACKET} c2={JACKET}
          end={<S p={[0, 0, 0]} r={0.055} s={[0.9, 1.1, 0.7]} c={SKIN} />} />
      ))}
      {/* neck */}
      <mesh position={[0, 1.53, 0]} castShadow>
        <cylinderGeometry args={[0.058, 0.066, 0.12, 20]} />
        <M c={SKIN_D} />
      </mesh>
      {/* head */}
      <group position={[0, 1.7, 0.005]} rotation={[0, look * 0.4, Math.sin(t * 1.2) * 0.02]}>
        {/* skull + square jaw + chin */}
        <S p={[0, 0.02, 0]} r={0.112} s={[0.9, 1.05, 1.0]} c={SKIN} rough={0.5} />
        <S p={[0, -0.045, 0.012]} r={0.1} s={[0.95, 0.78, 0.98]} c={SKIN} rough={0.5} />
        {[-1, 1].map((s) => <S key={s} p={[s * 0.07, -0.07, 0.0]} r={0.042} s={[0.9, 0.9, 1.3]} c={SKIN} rough={0.5} />)}
        <S p={[0, -0.112, 0.07]} r={0.034} s={[1.25, 0.85, 0.9]} c={SKIN} rough={0.5} />
        {/* stubble shadow along the jaw */}
        <mesh position={[0, -0.07, 0.02]} scale={[0.99, 0.62, 1.0]}>
          <sphereGeometry args={[0.104, 36, 24, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
          <meshStandardMaterial color="#4a3326" roughness={0.9} transparent opacity={0.28} />
        </mesh>
        {/* cheekbones */}
        {[-1, 1].map((s) => <S key={s} p={[s * 0.065, -0.005, 0.07]} r={0.03} s={[1.3, 0.7, 0.8]} c={SKIN} rough={0.5} />)}
        {/* ears */}
        {[-1, 1].map((s) => <S key={s} p={[s * 0.1, 0.0, -0.01]} r={0.025} s={[0.5, 1.1, 0.8]} c={SKIN_D} />)}
        {/* eyes: almond shape, slight upward tilt, hooded lids */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.04, 0.015, 0.088]} rotation={[0, s * 0.12, s * 0.12]}>
            <mesh scale={[1.35, 0.7 * lid, 0.6]}>
              <sphereGeometry args={[0.017, 24, 16]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={1} />
            </mesh>
            {lid > 0.2 ? (
              <>
                <mesh position={[look * 0.004, -0.001, 0.008]} scale={[1, 1, 0.5]}>
                  <sphereGeometry args={[0.0105, 20, 14]} />
                  <meshPhysicalMaterial color="#4a6b3a" roughness={0.2} clearcoat={1} />
                </mesh>
                <mesh position={[look * 0.004, -0.001, 0.0125]} scale={[1, 1, 0.4]}>
                  <sphereGeometry args={[0.0052, 14, 10]} />
                  <meshBasicMaterial color="#0e0a08" />
                </mesh>
                <mesh position={[look * 0.004 - 0.004, 0.004, 0.0145]}>
                  <sphereGeometry args={[0.0022, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </>
            ) : null}
            {/* heavy upper lid / lash line */}
            <mesh position={[0, 0.011 * lid + 0.002, 0.004]} scale={[1.5, 0.45, 0.8]}>
              <sphereGeometry args={[0.018, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <M c={SKIN_D} />
            </mesh>
            <mesh position={[0, 0.009 * lid, 0.011]} rotation={[0, 0, 0]} scale={[1.4, 0.6, 1]}>
              <torusGeometry args={[0.016, 0.0022, 6, 20, Math.PI]} />
              <M c="#1a100c" />
            </mesh>
          </group>
        ))}
        {/* thick, low, straight brows */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.045, 0.04 + browY - 0.03, 0.098]} rotation={[0, s * 0.2, Math.PI / 2 + s * browTilt]} castShadow>
            <capsuleGeometry args={[0.0085, 0.04, 4, 10]} />
            <M c={HAIR} r={0.9} />
          </mesh>
        ))}
        {/* straight nose */}
        <mesh position={[0, -0.01, 0.105]} rotation={[0.25, 0, 0]} castShadow>
          <capsuleGeometry args={[0.011, 0.035, 6, 12]} />
          <M c={SKIN} r={0.5} />
        </mesh>
        <S p={[0, -0.035, 0.112]} r={0.014} c={SKIN} s={[1.3, 0.9, 1]} rough={0.5} />
        {/* mouth */}
        {face === "surprised" ? (
          <mesh position={[0, -0.072, 0.098]} scale={[1.1, 0.8, 0.4]}>
            <sphereGeometry args={[0.014, 16, 12]} />
            <meshStandardMaterial color="#4a1a1c" />
          </mesh>
        ) : face === "laugh" ? (
          <group position={[0, -0.07, 0.1]}>
            <mesh scale={[1.6, 0.75, 0.35]}>
              <sphereGeometry args={[0.02, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color="#4a1a1c" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.003, 0.002]} scale={[1.45, 0.25, 0.3]}>
              <sphereGeometry args={[0.02, 16, 10]} />
              <M c="#ffffff" r={0.3} />
            </mesh>
          </group>
        ) : (
          <group position={[0, -0.07, 0.099]} rotation={[0, 0, face === "smirk" ? 0.12 : 0]}>
            <Cap r={0.0055} len={0.036} c="#a3644c" rot={[0, 0, Math.PI / 2]} />
            <Cap p={[0, -0.009, -0.002]} r={0.0068} len={0.03} c="#b8735a" rot={[0, 0, Math.PI / 2]} />
            {face === "smirk" ? <S p={[0.026, 0.004, -0.003]} r={0.006} c={SKIN_D} /> : null}
          </group>
        )}
        {/* hair: short sides, textured quiff swept up and back */}
        <mesh position={[0, 0.03, -0.006]} rotation={[-0.25, 0, 0]} castShadow>
          <sphereGeometry args={[0.117, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <M c={HAIR} r={0.85} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.088, 0.03, -0.012]} scale={[0.35, 0.75, 0.95]}>
            <sphereGeometry args={[0.1, 24, 16]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} transparent opacity={0.8} />
          </mesh>
        ))}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = -0.06 + (i % 6) * 0.024;
          const row = Math.floor(i / 6);
          return (
            <mesh key={i} position={[x, 0.12 + row * 0.012 - Math.abs(x) * 0.25, 0.055 - row * 0.04]} rotation={[-0.9 - row * 0.3, 0, x * 3]} castShadow>
              <capsuleGeometry args={[0.022, 0.06, 6, 12]} />
              <M c={i % 3 ? HAIR : "#3d2a1f"} r={0.85} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
