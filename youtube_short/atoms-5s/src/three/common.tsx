import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import timeline from "../timeline.json";

// Shared three.js pieces for the atoms video. Scenes are written in the same Z-up coordinates as the Blender version
// (x right, y forward/away, z up) inside <ZUp>, so positions read the same as in tools/render.py.
export const EV = timeline.ev as Record<string, number>;
export const SHOTS = Object.fromEntries(timeline.shots.map((s) => [s.id, s])) as Record<string, { id: string; start: number; end: number }>;
export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => {
  const k = clamp(x);
  return k * k * (3 - 2 * k);
};
export const ramp = (t: number, a: number, b: number) => (b !== a ? smooth((t - a) / (b - a)) : Number(t >= a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export function keys<T extends number | V3>(t: number, ks: [number, T][]): T {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i];
    const [t1, v1] = ks[i + 1];
    if (t < t1) {
      const k = smooth((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return (v0 as V3).map((a, j) => lerp(a, (v1 as V3)[j], k)) as T;
      return lerp(v0 as number, v1 as number, k) as T;
    }
  }
  return ks[ks.length - 1][1];
}

/** Deterministic random numbers. */
export const rng = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const ZUp: React.FC<{ children: React.ReactNode }> = ({ children }) => <group rotation={[-Math.PI / 2, 0, 0]}>{children}</group>;
const toY = (p: V3) => new THREE.Vector3(p[0], p[2], -p[1]);

/** Camera in Z-up coordinates; lens in mm like Blender (vertical fit for a portrait frame). */
export const Cam: React.FC<{ pos: V3; target: V3; lens?: number }> = ({ pos, target, lens = 30 }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.copy(toY(pos));
    c.up.set(0, 1, 0);
    c.lookAt(toY(target));
    c.fov = (2 * Math.atan(18 / lens) * 180) / Math.PI;
    c.near = 0.05;
    c.far = 3000;
    c.updateProjectionMatrix();
  }, [camera, pos, target, lens]);
  return null;
};

/** Scene background + fog colour. */
export const Sky: React.FC<{ col: string }> = ({ col }) => {
  const { scene } = useThree();
  useLayoutEffect(() => {
    scene.background = new THREE.Color(col);
  }, [scene, col]);
  return null;
};

const MAT = new Map<string, THREE.MeshStandardMaterial>();
/** Cached standard material. e = emissive colour, ei = emissive intensity. */
export const mat = (c: string, r = 0.8, e?: string, ei = 0, metal = 0) => {
  const k = `${c}|${r}|${e}|${ei}|${metal}`;
  let m = MAT.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: metal, emissive: e ?? "#000000", emissiveIntensity: ei, flatShading: false });
    MAT.set(k, m);
  }
  return m;
};
const BOX = new THREE.BoxGeometry(1, 1, 1);

/** Box by centre + size. */
export const B: React.FC<{ p: V3; s: V3; m: THREE.Material; rot?: V3; cast?: boolean }> = ({ p, s, m, rot = [0, 0, 0], cast = true }) => (
  <mesh position={p} scale={s} rotation={rot} geometry={BOX} material={m} castShadow={cast} receiveShadow />
);
/** Box by min/max corners (relative to its parent, so the parent can be a joint). */
export const BM: React.FC<{ mn: V3; mx: V3; m: THREE.Material }> = ({ mn, mx, m }) => (
  <B p={[(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2]} s={[mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]} m={m} />
);

/** Many boxes with one material as a single InstancedMesh (fast). */
export const Boxes: React.FC<{ items: { p: V3; s: V3; rot?: V3; c?: string }[]; m: THREE.Material; cast?: boolean }> = ({ items, m, cast = true }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.scale.set(...it.s);
      o.rotation.set(...(it.rot ?? [0, 0, 0]));
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      if (it.c) im.setColorAt(i, new THREE.Color(it.c));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[BOX, m, items.length]} castShadow={cast} receiveShadow />;
};

export const Ball: React.FC<{ p: V3; r: number; m: THREE.Material; s?: V3; seg?: number; ico?: boolean }> = ({ p, r, m, s = [1, 1, 1], seg = 24, ico }) => (
  <mesh position={p} scale={s} material={m} castShadow receiveShadow>
    {ico ? <icosahedronGeometry args={[r, 1]} /> : <sphereGeometry args={[r, seg, Math.max(8, seg / 2)]} />}
  </mesh>
);
export const Cyl: React.FC<{ p: V3; r: number; h: number; m: THREE.Material; rot?: V3; seg?: number }> = ({ p, r, h, m, rot = [Math.PI / 2, 0, 0], seg = 16 }) => (
  <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
    <cylinderGeometry args={[r, r, h, seg]} />
  </mesh>
);

/** Glow sprite (additive) for lamps, stars and the Sun. */
export const Glow: React.FC<{ p: V3; r: number; c: string; o?: number }> = ({ p, r, c, o = 0.5 }) => {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);
  if (o <= 0.001) return null;
  return (
    <sprite position={p} scale={[r * 2, r * 2, 1]}>
      <spriteMaterial map={tex} color={c} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
};

/** Text drawn on a canvas, used for the lab monitors. */
export const useTextTexture = (lines: { text: string; color: string; size: number; y: number }[], w = 512, h = 300, bg = "#0d2238") =>
  useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const l of lines) {
      g.fillStyle = l.color;
      g.font = `700 ${l.size}px Inter, sans-serif`;
      g.fillText(l.text, w / 2, l.y);
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lines)]);

// ------------------------------------------------------------------ blocky people (boxes, like the reference)
export type PersonLook = { shirt?: string; pants?: string; skin?: string; hair?: string; style?: "short" | "long" | "pony" | "bald"; coat?: boolean; cup?: boolean; phone?: number; shoes?: string };
export type Pose = { walk?: number | null; armL?: V3; armR?: V3; head?: [number, number]; lean?: number; sit?: boolean; bob?: number };

export const Person: React.FC<{ p: V3; rz?: number; s?: number; look?: PersonLook; pose?: Pose; glow?: string }> = ({ p, rz = 0, s = 1, look = {}, pose = {}, glow }) => {
  const { shirt = "#e8b84a", pants = "#3f5f9e", skin = "#e3b18e", hair = "#4a3426", style = "short", coat, cup, phone = 0, shoes = "#2a2a2e" } = look;
  const M = glow
    ? { sh: mat("#000000", 1, glow, 2.5), pa: mat("#000000", 1, glow, 2.5), sk: mat("#000000", 1, glow, 2.5), ha: mat("#000000", 1, glow, 2.5) }
    : { sh: mat(shirt, 0.85), pa: mat(pants, 0.85), sk: mat(skin, 0.6), ha: mat(hair, 0.9) };
  const { walk = null, armL, armR, head = [0, 0], lean = 0, sit = false, bob = 0 } = pose;
  const a = walk !== null ? Math.sin(walk) * 0.45 : 0;
  const tz = 0.9 + (walk !== null ? Math.abs(Math.cos(walk)) * 0.03 : 0) + bob;
  const hipZ = sit ? 0.6 : 0.9;
  return (
    <group position={p} rotation={[0, 0, rz]} scale={[s, s, s]}>
      {([["L", 0.1], ["R", -0.1]] as const).map(([side, x]) => (
        <group key={side} position={[x, 0, hipZ]} rotation={[sit ? -1.5 : side === "L" ? a : -a, 0, 0]}>
          <BM mn={[-0.075, -0.085, -0.86]} mx={[0.075, 0.085, 0]} m={M.pa} />
          <BM mn={[-0.08, -0.15, -0.9]} mx={[0.08, 0.09, -0.84]} m={glow ? M.pa : mat(shoes, 0.6)} />
        </group>
      ))}
      <group position={[0, 0, sit ? 0.6 : tz]} rotation={[lean, 0, 0]}>
        <BM mn={[-0.21, -0.12, 0]} mx={[0.21, 0.12, 0.62]} m={M.sh} />
        {coat ? <BM mn={[-0.22, -0.13, -0.28]} mx={[0.22, 0.13, 0.63]} m={M.sh} /> : null}
        {coat && !glow ? <BM mn={[-0.13, -0.14, 0.5]} mx={[0.13, 0.1, 0.62]} m={mat("#f2e2c4", 0.9)} /> : null}
        <BM mn={[-0.06, -0.06, 0.6]} mx={[0.06, 0.06, 0.66]} m={M.sk} />
        {([["L", 0.28], ["R", -0.28]] as const).map(([side, x]) => {
          const r = side === "L" ? armL ?? [-a * 0.8, 0, 0.06] : armR ?? [a * 0.8, 0, -0.06];
          return (
            <group key={side} position={[x, 0, 0.58]} rotation={r}>
              <BM mn={[-0.065, -0.065, -0.58]} mx={[0.065, 0.065, 0.03]} m={M.sh} />
              <BM mn={[-0.05, -0.055, -0.68]} mx={[0.05, 0.055, -0.58]} m={M.sk} />
              {side === "R" && cup && !glow ? (
                <group>
                  <Cyl p={[0, -0.04, -0.66]} r={0.045} h={0.14} m={mat("#fbfbf6", 0.5)} />
                  <Cyl p={[0, -0.04, -0.66]} r={0.049} h={0.06} m={mat("#9a6a42", 0.8)} />
                </group>
              ) : null}
              {side === "R" && phone > 0 ? (
                <group>
                  <B p={[0, -0.07, -0.66]} s={[0.08, 0.012, 0.15]} m={mat("#1a1a22", 0.3)} />
                  <B p={[0, -0.078, -0.66]} s={[0.068, 0.004, 0.13]} m={mat("#cfe8ff", 0.4, "#cfe8ff", 2.5 * phone)} cast={false} />
                </group>
              ) : null}
            </group>
          );
        })}
        <group position={[0, 0, 0.66]} rotation={[head[0], 0, head[1]]}>
          <BM mn={[-0.125, -0.135, 0]} mx={[0.125, 0.125, 0.29]} m={M.sk} />
          {style !== "bald" ? (
            <>
              <BM mn={[-0.135, -0.145, 0.22]} mx={[0.135, 0.135, 0.33]} m={M.ha} />
              <BM mn={[-0.135, 0.03, 0.05]} mx={[0.135, 0.14, 0.3]} m={M.ha} />
              <BM mn={[-0.135, -0.1, 0.12]} mx={[-0.105, 0.14, 0.3]} m={M.ha} />
              <BM mn={[0.105, -0.1, 0.12]} mx={[0.135, 0.14, 0.3]} m={M.ha} />
            </>
          ) : null}
          {style === "long" ? <BM mn={[-0.14, 0.0, -0.18]} mx={[0.14, 0.15, 0.3]} m={M.ha} /> : null}
          {style === "pony" ? <BM mn={[-0.05, 0.13, -0.1]} mx={[0.05, 0.22, 0.24]} m={M.ha} /> : null}
          {!glow ? (
            <>
              <BM mn={[-0.066, -0.139, 0.14]} mx={[-0.034, -0.13, 0.17]} m={mat("#1d1612", 0.5)} />
              <BM mn={[0.034, -0.139, 0.14]} mx={[0.066, -0.13, 0.17]} m={mat("#1d1612", 0.5)} />
              <BM mn={[-0.03, -0.139, 0.075]} mx={[0.03, -0.13, 0.083]} m={mat("#a5645a", 0.6)} />
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
};

export const NORA: PersonLook = { shirt: "#c8423a", pants: "#2a3350", hair: "#2b1a14", style: "pony", coat: true };

/** Sun + sky fill. */
export const Lights: React.FC<{ sun?: number; sunCol?: string; dir?: V3; hemi?: number; sky?: string; ground?: string; shadow?: number }> = ({
  sun = 3, sunCol = "#fff1dc", dir = [-30, 40, 60], hemi = 0.9, sky = "#cfe6ff", ground = "#b8a894", shadow = 40,
}) => {
  const p = toY(dir);
  return (
    <>
      <hemisphereLight args={[sky, ground, hemi]} />
      <directionalLight position={[p.x, p.y, p.z]} intensity={sun} color={sunCol} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-shadow} shadow-camera-right={shadow} shadow-camera-top={shadow} shadow-camera-bottom={-shadow} shadow-camera-far={400} shadow-bias={-0.0005} />
    </>
  );
};
