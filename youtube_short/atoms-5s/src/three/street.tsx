import React, { useMemo } from "react";
import * as THREE from "three";
import { B, Ball, Boxes, Cam, Cyl, EV as E, Glow, Lights, NORA, Person, SHOTS, Sky, V3, ZUp, clamp, keys, lerp, mat, ramp, rng } from "./common";

// The shopping street (same layout as the Blender version): road along Y, sidewalks at |x| 4..7, buildings beyond.
const BLD = ["#e9d9bf", "#d9a588", "#c9d4dc", "#e7c79a", "#b9c7b0", "#e0b7a8", "#d7d0c4", "#a9bfd3"];
const AWN = ["#3fa7b5", "#e0566c", "#f2b23a", "#3f8f6a", "#e07a4a"];

type Bld = { cx: number; cy: number; w: number; d: number; h: number; col: string; fx: number; x0: number; seed: number };

const layout = () => {
  const blds: Bld[] = [];
  let y = -30;
  let k = 0;
  while (y < 110) {
    const d = 7 + rng(k + 1)() * 4;
    for (const side of [-1, 1]) {
      const h = 12 + rng(k * 7 + side + 50)() * 12;
      const x0 = side * 7;
      blds.push({ cx: x0 + 4.5 * side, cy: y + d / 2, w: 9, d, h, col: BLD[(k * 3 + (side > 0 ? 1 : 0)) % BLD.length], fx: -side, x0, seed: k * 2 + (side > 0 ? 1 : 0) });
    }
    y += d + 0.2;
    k++;
  }
  return blds;
};

const City: React.FC<{ night: number; shrink: (cx: number, cy: number) => number }> = ({ night, shrink }) => {
  type It = { p: V3; s: V3; c?: string; rot?: V3; b: number };
  const blds = useMemo(layout, []);
  const parts = useMemo(() => {
    const body: It[] = [];
    const roof: It[] = [];
    const winA: It[] = [];
    const winB: It[] = [];
    const sills: It[] = [];
    const shops: It[] = [];
    const doors: It[] = [];
    const awn: It[] = [];
    blds.forEach((b, bi) => {
      const r = rng(b.seed + 3);
      body.push({ p: [b.cx, b.cy, b.h / 2], s: [b.w, b.d, b.h], c: b.col, b: bi });
      roof.push({ p: [b.cx, b.cy, b.h + 0.1], s: [b.w + 0.2, b.d + 0.2, 0.2], b: bi });
      const fx = b.x0 + 0.03 * b.fx;
      const nx = Math.max(1, Math.floor(b.d / 1.6));
      const rows = Math.max(1, Math.floor((b.h - 4.2) / 2.4));
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < rows; j++) {
          const wy = b.cy - b.d / 2 + (b.d / nx) * (i + 0.5);
          (r() < 0.6 ? winA : winB).push({ p: [fx, wy, 4.6 + j * 2.4], s: [0.08, 0.9, 1.35], b: bi });
          sills.push({ p: [fx + 0.05 * b.fx, wy, 3.88 + j * 2.4], s: [0.14, 1.05, 0.1], b: bi });
        }
      }
      shops.push({ p: [fx, b.cy, 1.45], s: [0.06, b.d * 0.72, 2.0], b: bi });
      doors.push({ p: [fx, b.cy + b.d * 0.39, 1.15], s: [0.07, 0.95, 2.1], b: bi });
      const ac = AWN[b.seed % AWN.length];
      const n = Math.floor((b.d * 0.8) / 0.5);
      for (let i = 0; i < n; i++) {
        awn.push({ p: [fx + 0.55 * b.fx, b.cy - b.d * 0.4 + 0.25 + i * 0.5, 2.85], s: [1.1, 0.5, 0.08], rot: [0, -0.28 * b.fx, 0], c: i % 2 ? ac : "#f7f4ee", b: bi });
      }
    });
    return { body, roof, winA, winB, sills, shops, doors, awn };
  }, [blds]);
  const k = blds.map((b) => shrink(b.cx, b.cy));
  const sc = (arr: It[]) =>
    k.every((x) => x >= 0.999)
      ? arr
      : arr.filter((it) => k[it.b] > 0.01).map((it) => {
        const b = blds[it.b];
        const f = k[it.b];
        const c: V3 = [b.cx, b.cy, b.h / 2];
        return { ...it, p: [c[0] + (it.p[0] - c[0]) * f, c[1] + (it.p[1] - c[1]) * f, c[2] + (it.p[2] - c[2]) * f] as V3, s: [it.s[0] * f, it.s[1] * f, it.s[2] * f] as V3 };
      });
  const litWin = mat("#5d7a96", 0.15, "#ffd59a", 0); // emissive tweaked below
  litWin.emissiveIntensity = 2.2 * night;
  litWin.color.set(night > 0.5 ? "#c9a46a" : "#5d7a96");
  const shopM = mat("#9ec3d8", 0.1, "#ffd59a", 0);
  shopM.emissiveIntensity = 1.6 * night;
  const P = { body: sc(parts.body), roof: sc(parts.roof), winA: sc(parts.winA), winB: sc(parts.winB), sills: sc(parts.sills), shops: sc(parts.shops), doors: sc(parts.doors), awn: sc(parts.awn) };
  if (!P.body.length) return null;
  return (
    <group>
      <Boxes key={`a${P.body.length}`} items={P.body} m={mat("#ffffff", 0.9)} />
      <Boxes key={`b${P.roof.length}`} items={P.roof} m={mat("#8c8a86", 0.9)} />
      <Boxes key={`c${P.winA.length}`} items={P.winA} m={litWin} cast={false} />
      <Boxes key={`d${P.winB.length}`} items={P.winB} m={mat("#5d7a96", 0.15)} cast={false} />
      <Boxes key={`e${P.sills.length}`} items={P.sills} m={mat("#f4f1ea", 0.7)} cast={false} />
      <Boxes key={`f${P.shops.length}`} items={P.shops} m={shopM} cast={false} />
      <Boxes key={`g${P.doors.length}`} items={P.doors} m={mat("#5a3f30", 0.7)} cast={false} />
      <Boxes key={`h${P.awn.length}`} items={P.awn} m={mat("#ffffff", 0.8)} />
    </group>
  );
};

const Ground: React.FC<{ s: number }> = ({ s }) => {
  const tiles = useMemo(() => {
    const out: { p: V3; s: V3 }[] = [];
    for (const side of [-1, 1]) for (let i = 0; i < 70; i++) out.push({ p: [side * 5.5, -40 + i * 2.2, 0.142], s: [2.9, 0.03, 0.005] });
    return out;
  }, []);
  const lanes = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ p: [0, -30 + i * 4.5, 0.005] as V3, s: [0.15, 2.2, 0.01] as V3 })), []);
  const zebra = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ p: [-3 + i, 6, 0.006] as V3, s: [0.55, 3.0, 0.01] as V3 })), []);
  if (s < 0.01) return null;
  return (
    <group scale={[1, 1, s]}>
      <B p={[0, 20, -0.05]} s={[8, 160, 0.1]} m={mat("#5c5f66", 0.95)} cast={false} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <B p={[side * 5.5, 20, 0.07]} s={[3.0, 160, 0.14]} m={mat("#d9d6cf", 0.9)} cast={false} />
          <B p={[side * 4.05, 20, 0.07]} s={[0.12, 160, 0.16]} m={mat("#b8b5ae", 0.9)} cast={false} />
        </group>
      ))}
      <Boxes items={tiles} m={mat("#c4c1ba", 0.9)} cast={false} />
      <Boxes items={lanes} m={mat("#efe7c9", 0.8)} cast={false} />
      <Boxes items={zebra} m={mat("#f2f2ee", 0.8)} cast={false} />
    </group>
  );
};

const Lamps: React.FC<{ night: number; s: (x: number, y: number) => number }> = ({ night, s }) => {
  const list = useMemo(() => {
    const out: V3[] = [];
    for (let i = 0; i < 10; i++) for (const side of [-1, 1]) out.push([side, -20 + i * 11 + (side > 0 ? 5 : 0), 0]);
    return out;
  }, []);
  const head = mat("#ffe2a8", 0.5, "#ffe2a8", 0);
  head.emissiveIntensity = 3 * night;
  return (
    <group>
      {list.map(([side, ly], i) => {
        const k = s(side * 4.4, ly);
        return k < 0.01 ? null : (
        <group key={i} position={[side * 4.4, ly, 0]} scale={[k, k, k]}><group position={[-side * 4.4, -ly, 0]}>
          <Cyl p={[side * 4.4, ly, 2.2]} r={0.06} h={4.4} m={mat("#30343c", 0.5)} seg={10} />
          <B p={[side * 4.0, ly, 4.35]} s={[0.8, 0.08, 0.08]} m={mat("#30343c", 0.5)} />
          <B p={[side * 3.6, ly, 4.25]} s={[0.4, 0.3, 0.14]} m={head} />
          <Glow p={[side * 3.6, ly, 4.1]} r={1.8} c="#ffd49a" o={0.8 * night} />
          {night > 0.02 ? (
            <mesh position={[side * 3.6, ly, 0.16]}>
              <circleGeometry args={[2.4, 32]} />
              <meshBasicMaterial color="#ffd49a" transparent opacity={0.28 * night} depthWrite={false} />
            </mesh>
          ) : null}
        </group></group>
        );
      })}
    </group>
  );
};

const Tree: React.FC<{ p: V3; seed: number; s: number }> = ({ p, seed, s }) => {
  const r = rng(seed + 11);
  const leaves = useMemo(() => [0, 1, 2].map((i) => ({ p: [p[0] + (r() - 0.5) * 0.6, p[1] + (r() - 0.5) * 0.6, 2.3 + i * 0.35] as V3, r: 0.75 - i * 0.12, c: ["#3f8f4a", "#4c9a52", "#367f42"][Math.floor(r() * 3)] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed]);
  if (s < 0.01) return null;
  return (
    <group position={p} scale={[s, s, s]}>
      <group position={[-p[0], -p[1], -p[2]]}>
        <Cyl p={[p[0], p[1], 0.9]} r={0.09} h={1.8} m={mat("#6b4a33", 0.9)} seg={8} />
        {leaves.map((l, i) => <Ball key={i} p={l.p} r={l.r} m={mat(l.c, 0.85)} ico />)}
      </group>
    </group>
  );
};

const Car: React.FC<{ p: V3; col: string; rz?: number; s?: number }> = ({ p, col, rz = 0, s = 1 }) =>
  s < 0.01 ? null : (
    <group position={p} rotation={[0, 0, rz]} scale={[s, s, s]}>
      <B p={[0, 0, 0.45]} s={[1.8, 4.1, 0.6]} m={mat(col, 0.35, undefined, 0, 0.2)} />
      <B p={[0, 0.2, 0.95]} s={[1.6, 2.1, 0.5]} m={mat(col, 0.35, undefined, 0, 0.2)} />
      <B p={[0, 0.2, 0.96]} s={[1.62, 2.0, 0.42]} m={mat("#2f3d4f", 0.1)} />
      {[-0.85, 0.85].flatMap((x) => [-1.3, 1.3].map((y) => <Cyl key={`${x}${y}`} p={[x, y, 0.33]} r={0.33} h={0.25} m={mat("#1c1c20", 0.8)} rot={[0, 0, Math.PI / 2]} seg={14} />))}
    </group>
  );

const PEOPLE: [number, number, number, string, string, string, "short" | "long" | "pony" | "bald", number][] = [
  [4.5, 16, Math.PI, "#3f7fd6", "#2a2f3a", "#2b1d16", "short", 1.2],
  [4.6, 24, 0.0, "#e8b84a", "#3f5f9e", "#4a3426", "short", 1.1],
  [-5.4, 12, Math.PI, "#7a5bb6", "#3b3e46", "#1e1a18", "long", 1.0],
  [-6.1, 30, 0.0, "#3fae6a", "#2e3a5c", "#6a4a2a", "short", 1.25],
  [4.5, 36, Math.PI, "#e07a4a", "#3b3e46", "#d9c39a", "long", 0.9],
  [-4.9, 42, Math.PI, "#f2f2ee", "#2a3350", "#2b1d16", "bald", 1.1],
  [4.6, 48, 0.0, "#9e1b2d", "#2a2f3a", "#4a3426", "short", 1.0],
  [-6.0, 6, 0.0, "#2fa3a0", "#3f5f9e", "#2b1d16", "pony", 1.15],
];

/** Light-dust: the atoms leaving (k 0..1) or arriving. */
const Dust: React.FC<{ k: number; center: V3; spread: V3 }> = ({ k, center, spread }) => {
  const items = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 700 }, () => ({
      p0: [center[0] + (r() * 2 - 1) * spread[0], center[1] + (r() * 2 - 1) * spread[1], center[2] + r() * spread[2]] as V3,
      v: [(r() * 2 - 1) * 0.9, (r() * 2 - 1) * 0.9, (0.3 + r() * 1.2) * 0.9] as V3,
      d: r() * 0.35,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (k <= 0 || k >= 1) return null;
  const vis = items
    .map((it) => {
      const kk = clamp((k - it.d) / (1 - it.d));
      if (kk <= 0 || kk >= 1) return null;
      const s = Math.sin(Math.PI * kk) * 0.14;
      return { p: [it.p0[0] + it.v[0] * kk * 2.2, it.p0[1] + it.v[1] * kk * 2.2, it.p0[2] + it.v[2] * kk * 2.2] as V3, s: [s, s, s] as V3 };
    })
    .filter(Boolean) as { p: V3; s: V3 }[];
  return vis.length ? <Boxes key={vis.length} items={vis} m={new THREE.MeshBasicMaterial({ color: "#dff0ff" })} cast={false} /> : null;
};

export type StreetShot = "street" | "vanish" | "back" | "dark" | "phones";

export const StreetScene: React.FC<{ t: number; which: StreetShot }> = ({ t, which }) => {
  const wt = t < E.gone ? t : t < E.back ? E.gone : t - (E.back - E.gone);
  let day = 1;
  if (which === "dark") day = clamp(1 - ramp(t, E.dark - 0.15, E.dark + 0.25) + ramp(t, E.darkEnd - 0.1, E.darkEnd + 0.3));
  // vanish / return: gk = how "gone" the world is
  let gk = 0;
  if (which === "vanish") gk = ramp(t, E.instant, E.gone + 0.1);
  if (which === "back") gk = 1 - ramp(t, E.back - 0.7, E.back + 0.1);
  const skyK = which === "vanish" ? ramp(t, E.gone - 0.3, E.gone + 0.2) : which === "back" ? 1 - ramp(t, E.back - 0.4, E.back + 0.2) : 0;
  const dk = which === "vanish" ? clamp((t - E.instant) / (E.gone + 0.9 - E.instant)) : which === "back" ? (t < E.back + 0.2 ? clamp((E.back + 0.2 - t) / 1.1) : 0) : 0;
  const nyNow = 26 - Math.min(wt, E.normal + 2) * 0.95;
  const shrink = (x: number, y: number) => {
    if (gk <= 0) return 1;
    if (gk >= 1) return 0;
    const d = clamp(Math.hypot(x - 5.6, y - nyNow) / 60);
    return clamp(1 - (gk * 1.7 - d * 0.7) / 1.0);
  };

  const stop = which === "dark" ? ramp(t, E.dark + 0.4, E.dark + 1.0) * (1 - ramp(t, E.darkEnd + 1.5, E.darkEnd + 2.5)) : which === "phones" ? 1 : 0;
  const lookup = which === "phones" ? 0.6 : stop;
  const pt = which === "phones" ? 0 : wt;
  const nora0 = 26;
  let ny = nora0 - Math.min(wt, E.normal + 2) * 0.95;
  if (which === "dark" || which === "phones") ny = 9;
  const sipping = which === "back" && t > E.sip - 0.3 && t < E.sip + 2.2;
  const walking = (which === "street" || which === "vanish" || which === "back") && !sipping;
  const sip = which === "back" ? ramp(t, E.sip - 0.3, E.sip + 0.3) * (1 - ramp(t, E.sip + 1.6, E.sip + 2.2)) : 0;
  const night = 1 - day;
  const skyCol = day < 1 ? lerpHex("#0d1430", "#a9d2f0", day) : skyK > 0 ? lerpHex("#a9d2f0", "#000000", skyK) : "#a9d2f0";

  let cam: { pos: V3; target: V3; lens: number };
  if (which === "street") {
    cam = {
      pos: keys<V3>(t, [[0, [1.5, -6, 15]], [3.5, [2.6, 2, 6]], [E.nora, [6.0, ny - 6.0, 1.9]], [10.7, [6.1, ny - 5.0, 1.7]]]),
      target: keys<V3>(t, [[0, [0, 40, 6]], [3.5, [3, 30, 3]], [E.nora, [5.6, ny, 1.5]], [10.7, [5.6, ny, 1.55]]]), lens: 30,
    };
  } else if (which === "vanish") {
    cam = { pos: keys<V3>(t, [[SHOTS.vanish.start, [6.1, ny - 4.6, 1.65]], [E.gone + 1, [5.4, ny - 6.5, 2.6]]]), target: [5.6, ny, 1.5], lens: 32 };
  } else if (which === "back") {
    cam = {
      pos: keys<V3>(t, [[SHOTS.back.start, [6.1, ny - 5.0, 1.75]], [E.sip, [6.2, ny - 3.2, 1.62]], [E.normal, [5.0, ny - 6.0, 2.8]], [SHOTS.back.end, [1.5, ny - 16.0, 9]]]),
      target: keys<V3>(t, [[SHOTS.back.start, [5.6, ny, 1.5]], [E.sip, [5.6, ny, 1.58]], [E.normal, [5.0, ny + 2, 1.8]], [SHOTS.back.end, [0, ny + 30, 5]]]), lens: 30,
    };
  } else if (which === "dark") {
    cam = {
      pos: keys<V3>(t, [[SHOTS.dark.start, [1.0, -6, 1.4]], [E.dark, [0.6, -4, 1.2]], [SHOTS.dark.end, [0.2, -2, 1.1]]]),
      target: keys<V3>(t, [[SHOTS.dark.start, [-1, 30, 9]], [E.dark, [-2, 30, 12.5]], [SHOTS.dark.end, [-2.5, 30, 13.5]]]), lens: 22,
    };
  } else {
    cam = { pos: keys<V3>(t, [[SHOTS.phones.start, [2.5, 4, 1.6]], [SHOTS.phones.end, [3.2, 8, 1.7]]]), target: keys<V3>(t, [[SHOTS.phones.start, [5, 16, 1.8]], [SHOTS.phones.end, [5.5, 22, 2.0]]]), lens: 28 };
  }

  return (
    <>
      <Sky col={skyCol} />
      <Cam {...cam} />
      <Lights sun={3.2 * day * (1 - skyK)} hemi={lerp(0.25, 1.0, day) * (1 - skyK)} sky={day < 1 ? "#5a6aa0" : "#d8ecff"} ground="#a89a88" shadow={45} />
      <ZUp>
        <City night={night} shrink={shrink} />
        <Ground s={gk > 0.92 || skyK > 0.6 ? 0 : 1} />
        <Lamps night={night} s={shrink} />
        {Array.from({ length: 9 }).map((_, i) => <Tree key={i} p={[i % 2 ? 4.65 : -4.65, -14 + i * 9, 0.14]} seed={i} s={shrink(i % 2 ? 4.65 : -4.65, -14 + i * 9)} />)}
        <Car p={[-2.0, 18, 0]} col="#c0392b" s={shrink(-2, 18)} />
        <Car p={[2.1, 34, 0]} col="#2f6fd0" rz={Math.PI} s={shrink(2.1, 34)} />
        <Car p={[-2.0, 50, 0]} col="#f2f2ee" s={shrink(-2, 50)} />
        <Car p={[2.0, 70 - wt * 6, 0]} col="#f2b23a" rz={Math.PI} s={shrink(2, 70 - wt * 6)} />
        {/* the Sun, low in the sky */}
        {day > 0.02 && skyK < 0.9 ? (
          <group>
            <Ball p={[-40, 300, 170]} r={9} m={mat("#fff4d6", 1, "#fff4d6", 3 * day)} seg={24} />
            <Glow p={[-40, 300, 170]} r={40} c="#fff1c8" o={0.55 * day * (1 - skyK)} />
          </group>
        ) : null}
        {PEOPLE.map(([x, y, f, sh, pa, ha, st, sp], i) => {
          const dir = f > 1 ? 1 : -1;
          const yy = (((y + dir * sp * pt + 12) % 72) + 72) % 72 - 12;
          const ks = shrink(x, yy);
          if (ks < 0.02) return null;
          return (
            <Person key={i} p={[x, yy, 0.14]} rz={f} s={(0.94 + (i % 4) * 0.03) * ks} look={{ shirt: sh, pants: pa, hair: ha, style: st, phone: which === "phones" ? 1 : 0 }}
              pose={{ walk: stop > 0.5 ? null : pt * sp * 5.2 + i, head: [lookup * -0.55, 0], armR: which === "phones" ? [-2.6, 0, -0.06] : undefined }} />
          );
        })}
        {shrink(5.6, ny) > 0.02 ? (
          <Person p={[5.6, ny, 0.14]} s={shrink(5.6, ny)} look={{ ...NORA, cup: true }}
            pose={which === "dark" ? { armR: [-0.3, 0, -0.06], head: [-0.55 * stop, 0] } : which === "phones" ? { armR: [-0.3, 0, -0.06], head: [-0.2, 0.3] }
              : { walk: walking ? wt * 4.9 : null, armR: sip > 0 ? [-1.0 - 1.4 * sip, 0, -0.25 * sip] : [-0.35, 0, -0.06], head: [0.15 * sip, 0] }} />
        ) : null}
        <Dust k={dk} center={[3, ny + 6, 0]} spread={[8, 8, 8]} />
      </ZUp>
    </>
  );
};

export const lerpHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};
