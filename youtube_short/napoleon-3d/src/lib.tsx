import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import timeline from "./timeline.json";
import geo from "./geo.json";

export const EV = timeline.ev as unknown as Record<string, number> & { salvo: number[] };
export const SC = timeline.SC as Record<string, number>;
export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
export const ramp = (t: number, a: number, b: number) => (b !== a ? smooth((t - a) / (b - a)) : Number(t >= a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const hash = (...n: number[]) => { let h = 2166136261; for (const x of n) { h ^= Math.round(x * 997); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };
export function keys<T extends number | V3>(t: number, ks: [number, T][]): T {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i]; const [t1, v1] = ks[i + 1];
    if (t < t1) {
      const k = smooth((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return (v0 as V3).map((a, j) => lerp(a, (v1 as V3)[j], k)) as T;
      return lerp(v0 as number, v1 as number, k) as T;
    }
  }
  return ks[ks.length - 1][1];
}
export const mixHex = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k));

export const PAL = { blue: "#2B4A8B", blueD: "#1E3566", red: "#B02A2E", gold: "#E0AE3C", cream: "#F3E8CB", ink: "#1b1511", grey: "#8A8782", greyD: "#4B4946", skin: "#FBF7EE", wood: "#8B5A33", woodD: "#5E3B20", stone: "#B9AE96", night: "#10163A" };

/** camera: position/target in world units (y up); fov in degrees; roll in radians. Runs every render so it follows the frame. */
export const Cam: React.FC<{ pos: V3; target: V3; fov?: number; roll?: number }> = ({ pos, target, fov = 55, roll = 0 }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(...pos);
    c.up.set(Math.sin(roll), Math.cos(roll), 0);
    c.lookAt(new THREE.Vector3(...target));
    c.fov = fov; c.near = 0.05; c.far = 2500;
    c.updateProjectionMatrix(); c.updateMatrixWorld();
  });
  return null;
};

// ---------------------------------------------------------------- sky
export const Sky: React.FC<{ top: string; bottom: string; mid?: string }> = ({ top, bottom, mid }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, mid: { value: new THREE.Color(mid ?? bottom) } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 bottom; uniform vec3 mid; varying vec3 p; void main(){ float h = clamp(p.y, -0.2, 1.0); vec3 c = h < 0.25 ? mix(bottom, mid, smoothstep(-0.2, 0.25, h)) : mix(mid, top, smoothstep(0.25, 0.9, h)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}",
  }), [top, bottom, mid]);
  return <mesh material={mat} renderOrder={-10}><sphereGeometry args={[1200, 24, 16]} /></mesh>;
};

export const Lights: React.FC<{ amb?: number; sun?: number; color?: string; dir?: V3 }> = ({ amb = 1.1, sun = 1.6, color = "#fff2dd", dir = [8, 14, 6] }) => (
  <>
    <ambientLight intensity={amb} color="#ffffff" />
    <directionalLight intensity={sun} color={color} position={dir} />
  </>
);

// ---------------------------------------------------------------- simple solids
export const Box: React.FC<{ p: V3; s: V3; c: string; rot?: V3; emissive?: string; ei?: number }> = ({ p, s, c, rot = [0, 0, 0], emissive, ei = 1 }) => (
  <mesh position={p} rotation={rot}><boxGeometry args={s} /><meshStandardMaterial color={c} flatShading roughness={0.9} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? ei : 0} /></mesh>
);
export const Cyl: React.FC<{ p: V3; r: number; h: number; c: string; rot?: V3; r2?: number; seg?: number; emissive?: string }> = ({ p, r, h, c, rot = [0, 0, 0], r2, seg = 14, emissive }) => (
  <mesh position={p} rotation={rot}><cylinderGeometry args={[r2 ?? r, r, h, seg]} /><meshStandardMaterial color={c} flatShading roughness={0.9} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 1 : 0} /></mesh>
);
export const Ball: React.FC<{ p: V3; r: number; c: string; sc?: V3; emissive?: string; seg?: number }> = ({ p, r, c, sc = [1, 1, 1], emissive, seg = 14 }) => (
  <mesh position={p} scale={sc}><sphereGeometry args={[r, seg, Math.max(8, seg - 4)]} /><meshStandardMaterial color={c} flatShading roughness={0.9} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 1 : 0} /></mesh>
);
export const Cone: React.FC<{ p: V3; r: number; h: number; c: string; seg?: number; emissive?: string; rot?: V3 }> = ({ p, r, h, c, seg = 8, emissive, rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot}><coneGeometry args={[r, h, seg]} /><meshStandardMaterial color={c} flatShading roughness={0.95} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 1 : 0} /></mesh>
);
export const Flat: React.FC<{ p: V3; s: [number, number]; c: string; rot?: V3; opacity?: number; emissive?: boolean }> = ({ p, s, c, rot = [-Math.PI / 2, 0, 0], opacity = 1, emissive }) => (
  <mesh position={p} rotation={rot}><planeGeometry args={s} />{emissive ? <meshBasicMaterial color={c} transparent={opacity < 1} opacity={opacity} fog={false} /> : <meshStandardMaterial color={c} flatShading roughness={1} transparent={opacity < 1} opacity={opacity} />}</mesh>
);
export const Glow: React.FC<{ p: V3; s: number; c: string; o?: number }> = ({ p, s, c, o = 0.6 }) => {
  const tex = useMemo(() => radialTex(), []);
  return (
    <sprite position={p} scale={[s, s, 1]}>
      <spriteMaterial map={tex} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
};
let _rad: THREE.CanvasTexture | null = null;
function radialTex() {
  if (_rad) return _rad;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!; const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _rad = new THREE.CanvasTexture(c); return _rad;
}

// ---------------------------------------------------------------- canvas textures (text signs, map labels)
const _tex = new Map<string, THREE.CanvasTexture>();
export function canvasTex(key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D) => void) {
  let t = _tex.get(key);
  if (!t) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; _tex.set(key, t);
  }
  return t;
}
export const Sign: React.FC<{ p: V3; w: number; h: number; text: string[]; bg?: string; fg?: string; rot?: V3; font?: number; frame?: string }> = ({ p, w, h, text, bg = "#7B1F24", fg = "#F3E8CB", rot = [0, 0, 0], font = 90, frame = "#E0AE3C" }) => {
  const tex = canvasTex(`sign|${text.join("/")}|${bg}|${fg}`, 512, Math.round((512 * h) / w), (x) => {
    const W = x.canvas.width, H = x.canvas.height;
    x.fillStyle = bg; x.fillRect(0, 0, W, H); x.strokeStyle = frame; x.lineWidth = 10; x.strokeRect(12, 12, W - 24, H - 24);
    x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `${font * (512 / 600)}px Bungee`;
    text.forEach((line, i) => x.fillText(line, W / 2, H / 2 + (i - (text.length - 1) / 2) * font * 0.9 * (512 / 600)));
  });
  return <mesh position={p} rotation={rot}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} /></mesh>;
};

// ---------------------------------------------------------------- stick-figure characters (2D art placed in the 3D world)
export type Look = {
  coat: string; pants?: string; hat?: "bicorne" | "shako" | "mitre" | "bowler" | "top" | "hair" | "none"; hatC?: string; hairC?: string;
  ep?: number; belts?: boolean; sash?: string; vest?: string; prop?: "musket" | "flag" | "none" | "cane" | "sword" | "paper";
  expr?: "serious" | "angry" | "shout" | "smirk" | "worry" | "laugh" | "sad" | "flat" | "closed";
  mouth?: number; walk?: number; arm?: "down" | "up" | "wide" | "aim" | "vest" | "behind" | "point" | "cheer";
  back?: boolean; sil?: string; hunch?: boolean; tall?: boolean; boots?: boolean; steam?: boolean; purple?: boolean; coattails?: boolean; crown?: boolean;
};
const INK = "#1b1511";
const q = (v: number | undefined, n: number) => Math.round((v ?? 0) * n) / n;

function drawChar(x: CanvasRenderingContext2D, L: Look) {
  const sil = L.sil;
  const C = (c: string) => sil ?? c;
  x.clearRect(0, 0, 256, 512);
  x.lineCap = "round"; x.lineJoin = "round";
  const w = L.walk ?? 0, sw = Math.sin(w * Math.PI * 2);
  const hy = L.hunch ? 40 : 0; // hunch lowers the head
  const pants = L.pants ?? "#2a2420";
  // ---- legs
  for (const sd of [-1, 1]) {
    const swing = sw * 22 * sd, lift = L.walk !== undefined ? Math.max(0, Math.sin(w * Math.PI * 2 + (sd > 0 ? 0 : Math.PI))) * 14 : 0;
    const hx = 128 + sd * 22, fx = 128 + sd * 28 + swing, fy = 492 - lift;
    x.strokeStyle = INK; x.lineWidth = 17; x.beginPath(); x.moveTo(hx, 330); x.lineTo(fx, fy - 40); x.stroke();
    x.strokeStyle = C(pants); x.lineWidth = 9; x.beginPath(); x.moveTo(hx, 330); x.lineTo(fx, fy - 40); x.stroke();
    x.strokeStyle = INK; x.lineWidth = 17; x.beginPath(); x.moveTo(fx, fy - 44); x.lineTo(fx, fy - 6); x.stroke();
    x.strokeStyle = C("#201a17"); x.lineWidth = 10; x.beginPath(); x.moveTo(fx, fy - 44); x.lineTo(fx, fy - 6); x.stroke();
    x.fillStyle = C("#201a17"); x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.ellipse(fx + sd * 6, fy - 4, 17, 8, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  }
  // ---- torso
  const ty0 = 190 + hy * 0.4, ty1 = 338;
  x.fillStyle = C(L.coat); x.strokeStyle = INK; x.lineWidth = 7;
  x.beginPath();
  if (L.coattails) { x.moveTo(78, ty0); x.lineTo(178, ty0); x.lineTo(196, ty1 + 34); x.lineTo(140, ty1 + 18); x.lineTo(128, ty1 - 4); x.lineTo(116, ty1 + 18); x.lineTo(60, ty1 + 34); x.closePath(); }
  else x.roundRect(80, ty0, 96, ty1 - ty0, 36);
  x.fill(); x.stroke();
  if (!sil && !L.back) {
    if (L.vest) { x.fillStyle = L.vest; x.beginPath(); x.moveTo(106, ty0); x.lineTo(150, ty0); x.lineTo(142, ty1 - 10); x.lineTo(114, ty1 - 10); x.closePath(); x.fill(); x.lineWidth = 4; x.stroke(); }
    if (L.belts) { x.strokeStyle = "#F4EFDD"; x.lineWidth = 9; x.beginPath(); x.moveTo(86, ty0 + 6); x.lineTo(170, ty1 - 20); x.moveTo(170, ty0 + 6); x.lineTo(86, ty1 - 20); x.stroke(); }
    if (L.sash) { x.fillStyle = L.sash; x.fillRect(82, ty1 - 40, 92, 18); x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(82, ty1 - 40, 92, 18); }
    for (let i = 0; i < 3; i++) { x.fillStyle = PAL.gold; x.beginPath(); x.arc(112, ty0 + 26 + i * 30, 5, 0, 7); x.arc(144, ty0 + 26 + i * 30, 5, 0, 7); x.fill(); }
  }
  // ---- arms (sleeves as thick lines with a white hand)
  const arm = (sx: number, sy: number, ex: number, ey: number, mx: number, my: number) => {
    x.strokeStyle = INK; x.lineWidth = 24; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    x.strokeStyle = C(L.coat); x.lineWidth = 14; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    x.fillStyle = C("#FBF7EE"); x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.arc(ex, ey, 11, 0, 7); x.fill(); x.stroke();
  };
  const sy = ty0 + 22, A = L.arm ?? "down";
  const swingA = L.walk !== undefined ? sw * 18 : 0;
  if (A === "down") { arm(84, sy, 66, 300 + swingA * 0.2, 70, 250); arm(172, sy, 190, 300 - swingA * 0.2, 186, 250); }
  else if (A === "up") { arm(84, sy, 58, 150, 66, 190); arm(172, sy, 198, 150, 190, 190); }
  else if (A === "cheer") { arm(84, sy, 40, 120, 56, 170); arm(172, sy, 216, 120, 200, 170); }
  else if (A === "wide") { arm(84, sy, 22, 270, 40, 215); arm(172, sy, 234, 270, 216, 215); }
  else if (A === "aim") { arm(84, sy, 96, 250, 80, 235); arm(172, sy, 236, 232, 216, 236); }
  else if (A === "point") { arm(84, sy, 66, 300, 70, 250); arm(172, sy, 250, 220, 220, 214); }
  else if (A === "behind") { arm(84, sy, 108, 318, 76, 280); arm(172, sy, 148, 318, 180, 280); }
  else if (A === "vest") { arm(84, sy, 66, 300, 70, 250); arm(172, sy, 134, 258, 192, 270); }
  // ---- props
  if (!sil) {
    if (L.prop === "musket") { x.strokeStyle = INK; x.lineWidth = 11; x.beginPath(); x.moveTo(216, 340); x.lineTo(226, 120); x.stroke(); x.strokeStyle = "#7A5230"; x.lineWidth = 6; x.stroke(); x.strokeStyle = "#D8D8D8"; x.lineWidth = 4; x.beginPath(); x.moveTo(226, 120); x.lineTo(228, 70); x.stroke(); }
    if (L.prop === "cane") { x.strokeStyle = INK; x.lineWidth = 9; x.beginPath(); x.moveTo(206, 410); x.lineTo(196, 270); x.stroke(); x.strokeStyle = "#8A5A30"; x.lineWidth = 4; x.stroke(); }
    if (L.prop === "paper") { x.fillStyle = "#F4EBD0"; x.strokeStyle = INK; x.lineWidth = 5; x.fillRect(86, 224, 84, 100); x.strokeRect(86, 224, 84, 100); x.fillStyle = INK; for (let i = 0; i < 6; i++) x.fillRect(94, 236 + i * 14, 68 - (i % 2) * 14, 5); }
  }
  // ---- epaulettes
  const ep = L.ep ?? 0;
  if (ep > 0 && !sil) for (const sd of [-1, 1]) { x.save(); x.translate(128 + sd * 56, ty0 + 6 - (1 - ep) * 90); x.rotate(sd * 0.2); x.fillStyle = PAL.gold; x.strokeStyle = INK; x.lineWidth = 4; x.fillRect(-24, -9, 48, 16); x.strokeRect(-24, -9, 48, 16); x.fillStyle = "#EBCB6E"; x.fillRect(-20, 7, 40, 24); x.strokeRect(-20, 7, 40, 24); x.strokeStyle = "#9A7421"; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(i * 6, 9); x.lineTo(i * 6, 29); x.stroke(); } x.restore(); }
  // ---- head
  const hx = 128, hcy = 118 + hy, hr = 64;
  x.save();
  if (L.hunch) { x.translate(hx, hcy); x.rotate(0.12); x.translate(-hx, -hcy); }
  x.fillStyle = L.purple ? "#7B3FA8" : C("#FBF7EE"); x.strokeStyle = INK; x.lineWidth = 7;
  x.beginPath(); x.arc(hx, hcy, hr, 0, Math.PI * 2); x.fill(); x.stroke();
  if (L.back && !sil) { x.fillStyle = L.hairC ?? "#2b211e"; x.beginPath(); x.arc(hx, hcy, hr - 3, 0, 7); x.fill(); }
  else if (!sil) {
    // hair fringe
    if (L.hat !== "none" && L.hat !== "mitre" && (L.hairC || L.hat === "bicorne" || L.hat === "hair")) { x.fillStyle = L.hairC ?? "#2b211e"; x.beginPath(); x.moveTo(hx - hr + 4, hcy - 12); x.quadraticCurveTo(hx - 26, hcy - hr - 4, hx + 8, hcy - hr + 6); x.quadraticCurveTo(hx + 50, hcy - 50, hx + hr - 4, hcy - 10); x.quadraticCurveTo(hx + 30, hcy - 34, hx - 10, hcy - 30); x.quadraticCurveTo(hx - 40, hcy - 28, hx - hr + 4, hcy - 12); x.fill(); }
    const ex = 26, ey = hcy + 2;
    const expr = L.expr ?? "serious";
    // eyes
    const eye = (cx: number, cy: number, big = false) => { x.fillStyle = "#fff"; x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.ellipse(cx, cy, big ? 14 : 11, big ? 16 : 13, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(cx + 2, cy + 2, big ? 6 : 5, 0, 7); x.fill(); };
    if (expr === "closed" || expr === "laugh") { x.strokeStyle = INK; x.lineWidth = 6; for (const sd of [-1, 1]) { x.beginPath(); x.arc(hx + sd * ex, ey + 4, 11, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } }
    else { eye(hx - ex, ey, expr === "shout" || expr === "worry"); eye(hx + ex, ey, expr === "shout" || expr === "worry"); }
    // brows
    x.strokeStyle = INK; x.lineWidth = 7;
    const brow = (a: number, b: number, c: number, d: number) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
    if (expr === "serious" || expr === "flat") { brow(hx - 42, ey - 22, hx - 12, ey - 17); brow(hx + 42, ey - 22, hx + 12, ey - 17); }
    else if (expr === "angry" || expr === "shout") { brow(hx - 44, ey - 34, hx - 8, ey - 14); brow(hx + 44, ey - 34, hx + 8, ey - 14); }
    else if (expr === "worry" || expr === "sad") { brow(hx - 44, ey - 14, hx - 10, ey - 30); brow(hx + 44, ey - 14, hx + 10, ey - 30); }
    else if (expr === "smirk") { brow(hx - 42, ey - 20, hx - 12, ey - 26); brow(hx + 40, ey - 30, hx + 12, ey - 20); }
    // mouth
    const my = hcy + 38, mo = L.mouth ?? 0;
    x.strokeStyle = INK; x.lineWidth = 6;
    if (mo > 0.2 || expr === "shout" || expr === "laugh") { x.fillStyle = "#5b1d1d"; x.beginPath(); x.ellipse(hx, my, 18, 6 + Math.max(mo, expr === "shout" ? 0.8 : 0.3) * 22, 0, 0, 7); x.fill(); x.stroke(); }
    else if (expr === "smirk") { x.beginPath(); x.moveTo(hx - 20, my + 2); x.quadraticCurveTo(hx + 4, my + 12, hx + 24, my - 8); x.stroke(); }
    else if (expr === "worry" || expr === "sad") { x.beginPath(); x.moveTo(hx - 18, my + 8); x.quadraticCurveTo(hx, my - 6, hx + 18, my + 8); x.stroke(); }
    else { x.beginPath(); x.moveTo(hx - 17, my); x.lineTo(hx + 17, my); x.stroke(); }
    if (L.purple) { x.strokeStyle = INK; x.lineWidth = 4; x.fillStyle = "#fff"; x.fillRect(hx - 22, my - 10, 44, 18); x.strokeRect(hx - 22, my - 10, 44, 18); for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(hx - 22 + i * 9, my - 10); x.lineTo(hx - 22 + i * 9, my + 8); x.stroke(); } }
  }
  // ---- hats
  const hc = L.hatC ?? "#25201E", top = hcy - hr;
  const hat = L.hat ?? "none";
  x.fillStyle = C(hc); x.strokeStyle = INK; x.lineWidth = 6;
  if (hat === "bicorne") { x.beginPath(); x.moveTo(hx - 118, top + 38); x.quadraticCurveTo(hx - 96, top - 34, hx - 20, top - 36); x.quadraticCurveTo(hx, top - 52, hx + 20, top - 36); x.quadraticCurveTo(hx + 96, top - 34, hx + 118, top + 38); x.quadraticCurveTo(hx + 60, top + 16, hx, top + 22); x.quadraticCurveTo(hx - 60, top + 16, hx - 118, top + 38); x.closePath(); x.fill(); x.stroke(); if (!sil) { x.strokeStyle = PAL.gold; x.lineWidth = 5; x.beginPath(); x.moveTo(hx - 112, top + 34); x.quadraticCurveTo(hx - 94, top - 28, hx - 20, top - 32); x.quadraticCurveTo(hx, top - 46, hx + 20, top - 32); x.quadraticCurveTo(hx + 94, top - 28, hx + 112, top + 34); x.stroke(); x.fillStyle = PAL.blue; x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.arc(hx + 62, top + 2, 15, 0, 7); x.fill(); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(hx + 62, top + 2, 9, 0, 7); x.fill(); x.fillStyle = PAL.red; x.beginPath(); x.arc(hx + 62, top + 2, 4.5, 0, 7); x.fill(); } }
  else if (hat === "shako") { x.beginPath(); x.moveTo(hx - 38, top + 24); x.lineTo(hx - 34, top - 62); x.lineTo(hx + 34, top - 62); x.lineTo(hx + 38, top + 24); x.closePath(); x.fill(); x.stroke(); if (!sil) { x.fillStyle = PAL.gold; x.fillRect(hx - 38, top + 6, 76, 14); x.fillStyle = PAL.red; x.beginPath(); x.arc(hx, top - 72, 10, 0, 7); x.fill(); x.stroke(); } }
  else if (hat === "mitre") { x.fillStyle = C("#F6F0E0"); x.beginPath(); x.moveTo(hx - 50, top + 28); x.lineTo(hx - 36, top - 56); x.lineTo(hx, top - 80); x.lineTo(hx + 36, top - 56); x.lineTo(hx + 50, top + 28); x.closePath(); x.fill(); x.stroke(); if (!sil) { x.strokeStyle = PAL.gold; x.lineWidth = 6; x.beginPath(); x.moveTo(hx - 48, top + 14); x.lineTo(hx + 48, top + 14); x.stroke(); x.beginPath(); x.moveTo(hx, top - 74); x.lineTo(hx, top + 14); x.stroke(); } }
  else if (hat === "bowler") { x.beginPath(); x.ellipse(hx, top + 22, 76, 15, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.ellipse(hx, top + 6, 48, 36, 0, Math.PI, 0); x.lineTo(hx + 48, top + 22); x.lineTo(hx - 48, top + 22); x.fill(); x.stroke(); }
  else if (hat === "top") { x.beginPath(); x.ellipse(hx, top + 20, 72, 14, 0, 0, 7); x.fill(); x.stroke(); x.fillRect(hx - 40, top - 62, 80, 82); x.strokeRect(hx - 40, top - 62, 80, 82); }
  x.restore();
  if (L.crown && !sil) { x.fillStyle = PAL.gold; x.strokeStyle = INK; x.lineWidth = 4; for (let i = -5; i <= 5; i++) { x.beginPath(); x.ellipse(hx + i * 12, top + 6 + Math.abs(i) * 2, 9, 5, i * 0.3, 0, 7); x.fill(); x.stroke(); } }
  if (L.steam && !sil) { x.fillStyle = "rgba(255,255,255,0.92)"; x.strokeStyle = INK; x.lineWidth = 4; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(hx + sd * (80 + i * 12), hcy - 20 - i * 26, 16 - i * 2, 0, 7); x.fill(); x.stroke(); } }
}

const _chars = new Map<string, THREE.CanvasTexture>();
function charTex(L: Look) {
  const k = JSON.stringify({ ...L, walk: L.walk === undefined ? undefined : q(((L.walk % 1) + 1) % 1, 16), mouth: q(L.mouth, 4), ep: q(L.ep, 8) });
  let t = _chars.get(k);
  if (!t) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 512;
    drawChar(c.getContext("2d")!, { ...L, walk: L.walk === undefined ? undefined : q(((L.walk % 1) + 1) % 1, 16), mouth: q(L.mouth, 4), ep: q(L.ep, 8) });
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; _chars.set(k, t);
  }
  return t;
}

/** A 2D stick figure standing in the 3D scene. `pos` is at the feet; it always faces the camera. */
export const Char: React.FC<{ pos: V3; h?: number; look: Look; flip?: boolean; shadow?: boolean; rotZ?: number; opacity?: number }> = ({ pos, h = 1.7, look, flip, shadow = true, rotZ = 0, opacity = 1 }) => {
  const { camera } = useThree();
  const tex = charTex(look);
  const ref = React.useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (ref.current) { ref.current.quaternion.copy(camera.quaternion); ref.current.rotateZ(rotZ); }
  });
  return (
    <group position={pos}>
      {shadow && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[h * 0.3, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.28 * opacity} /></mesh>}
      <group ref={ref} position={[0, h / 2, 0]}>
        <mesh scale={[flip ? -1 : 1, 1, 1]}><planeGeometry args={[h * 0.5, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} depthWrite={opacity >= 1} fog={false} /></mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- looks
export const LOOK = {
  nap: { coat: PAL.blue, pants: "#F3EBD6", hat: "bicorne", hairC: "#2b211e", vest: "#F3E8CB", sash: PAL.red, ep: 1, coattails: true, expr: "serious", arm: "vest" } as Look,
  soldier: { coat: PAL.blue, pants: "#EDE6D2", hat: "shako", belts: true, prop: "musket", expr: "flat", arm: "down" } as Look,
  cadet: { coat: "#4B5675", pants: "#EDE6D2", hat: "hair", hairC: "#2b211e", expr: "serious", arm: "down" } as Look,
  pope: { coat: "#F6F0E0", pants: "#F6F0E0", hat: "mitre", expr: "serious", arm: "down" } as Look,
};

// ---------------------------------------------------------------- Europe map (extruded countries)
const LON0 = -11, LON1 = 32, LAT0 = 35, LAT1 = 60;
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const MW = 20; // map width in world units
const K = MW / (((LON1 - LON0) * Math.PI) / 180);
export const mapXY = (lon: number, lat: number): [number, number] => [(((lon - LON0) * Math.PI) / 180) * K - MW / 2, (merc(lat) - merc(LAT0)) * K - ((merc(LAT1) - merc(LAT0)) * K) / 2];
const NEVER = new Set(["United Kingdom", "Ireland", "Iceland", "Russia", "Turkey", "Sweden", "Norway", "Finland", "Morocco", "Algeria", "Tunisia", "Libya", "Cyprus", "Ukraine", "Belarus", "Lithuania", "Latvia", "Estonia", "Moldova"]);
const FR = [2.5, 46.5];
const geoShapes = (() => {
  const out: { name: string; geoms: THREE.ExtrudeGeometry[]; c: [number, number]; d: number }[] = [];
  for (const [name, rings] of Object.entries(geo as Record<string, number[][]>)) {
    const geoms: THREE.ExtrudeGeometry[] = [];
    let big = rings[0];
    for (const r of rings) if (r.length > big.length) big = r;
    let sx = 0, sy = 0; const n = big.length / 2;
    for (let i = 0; i < big.length; i += 2) { sx += big[i]; sy += big[i + 1]; }
    const c: [number, number] = [sx / n, sy / n];
    for (const r of rings) {
      const sh = new THREE.Shape();
      for (let i = 0; i < r.length; i += 2) { const [mx, my] = mapXY(r[i], r[i + 1]); if (i === 0) sh.moveTo(mx, my); else sh.lineTo(mx, my); }
      geoms.push(new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false }));
    }
    out.push({ name, geoms, c, d: Math.hypot(c[0] - FR[0], (c[1] - FR[1]) * 1.3) });
  }
  return out;
})();
export const EuropeMap: React.FC<{ blue?: number; crumble?: number; shrink?: number; land?: string; pos?: V3; scale?: number; fall?: "z" | "y" }> = ({ blue = 0, crumble = 0, shrink = 0, land = "#E4D6AE", pos = [0, 0, 0], scale = 1, fall = "z" }) => (
  <group position={pos} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
    {geoShapes.map((c) => {
      let k = NEVER.has(c.name) ? 0 : clamp((blue * 1.25 - c.d / 26) * 3);
      if (c.name === "France") k = Math.max(k, clamp(blue * 6));
      if (shrink > 0 && c.name !== "France") k = Math.min(k, clamp((1 - shrink) * 1.3 - (c.d / 26) * 0.9 + 0.1));
      const col = mixHex(land, PAL.blue, k);
      const hsh = hash(c.name.length, c.d * 3);
      const cu = crumble > 0 ? clamp((crumble - hsh * 0.35) / (1 - hsh * 0.35)) : 0;
      const [cx, cy] = mapXY(c.c[0], c.c[1]);
      return (
        <group key={c.name} position={[cx, fall === "y" ? cy - cu * cu * 16 * (0.6 + hsh) : cy, fall === "y" ? 0 : -cu * cu * 14 * (0.6 + hsh)]} rotation={[(hsh - 0.5) * 3 * cu, (hsh - 0.3) * 2 * cu, (hsh - 0.5) * 2 * cu]}>
          <group position={[-cx, -cy, 0]}>
            {c.geoms.map((g, i) => (<mesh key={i} geometry={g}><meshStandardMaterial color={col} flatShading roughness={0.85} transparent={cu > 0} opacity={1 - clamp(cu * 1.2 - 0.3)} /></mesh>))}
          </group>
        </group>
      );
    })}
  </group>
);

/** Content that always faces the camera (signs, labels). */
export const FaceCam: React.FC<{ pos: V3; children: React.ReactNode; scale?: number }> = ({ pos, children, scale = 1 }) => {
  const { camera } = useThree();
  const ref = React.useRef<THREE.Group>(null);
  useLayoutEffect(() => { if (ref.current) ref.current.quaternion.copy(camera.quaternion); });
  return <group position={pos} scale={scale} ref={ref}>{children}</group>;
};
export const Candle: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => {
  const fl = 1 + 0.12 * Math.sin(t * 31) + 0.08 * Math.sin(t * 17);
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.25, 0]} r={0.09} h={0.5} c="#F1E6C6" />
      <Ball p={[0, 0.62, 0]} r={0.09} c="#FFD25A" sc={[0.8 * fl, 1.5 * fl, 0.8]} emissive="#FFB020" />
      <Glow p={[0, 0.65, 0]} s={2.4 * fl} c="#FFB347" o={0.55} />
      <pointLight position={[0, 0.8, 0]} intensity={4 * fl} distance={9} color="#FFB060" />
    </group>
  );
};
/** extruded flat polygon from [x,y] points (x right, y forward on the ground) */
export const Poly: React.FC<{ pts: [number, number][]; depth: number; c: string; p?: V3 }> = ({ pts, depth, c, p = [0, 0, 0] }) => {
  const g = useMemo(() => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); }, [pts, depth]);
  return <mesh geometry={g} position={p} rotation={[-Math.PI / 2, 0, 0]}><meshStandardMaterial color={c} flatShading roughness={0.9} /></mesh>;
};

export const Stars: React.FC<{ n?: number; r?: number; size?: number }> = ({ n = 260, r = 900, size = 3 }) => {
  const g = useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const th = hash(i, 1) * Math.PI * 2, ph = Math.acos(0.05 + hash(i, 2) * 0.95); a[i * 3] = r * Math.sin(ph) * Math.cos(th); a[i * 3 + 1] = r * Math.cos(ph); a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th); }
    const b = new THREE.BufferGeometry(); b.setAttribute("position", new THREE.BufferAttribute(a, 3)); return b;
  }, [n, r]);
  return <points geometry={g}><pointsMaterial color="#fff4d0" size={size} sizeAttenuation={false} fog={false} /></points>;
};
export const Torus: React.FC<{ p: V3; r: number; tube: number; c: string; rot?: V3; emissive?: string }> = ({ p, r, tube, c, rot = [Math.PI / 2, 0, 0], emissive }) => (
  <mesh position={p} rotation={rot}><torusGeometry args={[r, tube, 8, 22]} /><meshStandardMaterial color={c} flatShading roughness={0.5} metalness={0.4} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 0.8 : 0} /></mesh>
);
export const Ship: React.FC<{ p: V3; s?: number; lit?: number }> = ({ p, s = 1, lit = 0 }) => (
  <group position={p} scale={s}>
    <Box p={[0, 1, 0]} s={[9, 2, 2.6]} c="#1a1410" />
    {[-2.8, 0, 2.8].map((x, i) => (<React.Fragment key={i}><Cyl p={[x, 6, 0]} r={0.12} h={10} c="#1a1410" /><Box p={[x, 7.4, 0]} s={[0.1, 3.2, 3.4]} c={lit ? "#ffd9a0" : "#bdb394"} emissive={lit ? "#ff9a3a" : undefined} ei={lit} /><Box p={[x, 4, 0]} s={[0.1, 2.4, 3.8]} c={lit ? "#ffd9a0" : "#b3a98a"} emissive={lit ? "#ff9a3a" : undefined} ei={lit} /></React.Fragment>))}
  </group>
);
