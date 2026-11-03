import React, { useMemo } from "react";
import * as THREE from "three";
import { B, Ball, Boxes, Cam, Cyl, EV as E, Glow, Lights, NORA, Person, SHOTS, Sky, V3, ZUp, clamp, keys, lerp, mat, ramp, rng, useTextTexture } from "./common";

const basic = (c: string, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o });

// ------------------------------------------------------------------ the void: glowing outlines of what's gone, fading
const WireBox: React.FC<{ p: V3; s: V3; c: string; o: number }> = ({ p, s, c, o }) => {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...s)), [s]);
  if (o <= 0.01) return null;
  return (
    <lineSegments position={p} geometry={geo}>
      <lineBasicMaterial color={c} transparent opacity={o} />
    </lineSegments>
  );
};
const WireSphere: React.FC<{ p: V3; r: number; c: string; o: number }> = ({ p, r, c, o }) => {
  const geo = useMemo(() => new THREE.WireframeGeometry(new THREE.SphereGeometry(r, 18, 12)), [r]);
  if (o <= 0.01) return null;
  return (
    <lineSegments position={p} geometry={geo}>
      <lineBasicMaterial color={c} transparent opacity={o} />
    </lineSegments>
  );
};

const Stars: React.FC<{ n: number; R: number; seed: number; hide?: (i: number) => boolean; o?: number; zmin?: number }> = ({ n, R, seed, hide, o = 1, zmin = 0.05 }) => {
  const list = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const th = r() * Math.PI * 2;
      const ph = Math.asin(zmin + r() * (1 - zmin));
      const sz = R * [0.0012, 0.0016, 0.0022, 0.003][Math.floor(r() * 4)];
      return { p: [Math.cos(th) * Math.cos(ph) * R, Math.sin(th) * Math.cos(ph) * R, Math.sin(ph) * R] as V3, s: [sz, sz, sz] as V3 };
    });
  }, [n, R, seed, zmin]);
  const vis = hide ? list.filter((_, i) => !hide(i)) : list;
  return <Boxes key={vis.length} items={vis} m={basic("#fff8ea", o)} cast={false} />;
};

export const VoidScene: React.FC<{ t: number }> = ({ t }) => {
  const fade = (a: number) => 1 - ramp(t, a + 0.25, a + 0.9);
  const air = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 140 }, () => ({ p: [r() * 12 - 6, 4 + r() * 20, 0.2 + r() * 8] as V3, s: [0.07, 0.07, 0.07] as V3 }));
  }, []);
  return (
    <>
      <Sky col="#000000" />
      <Cam pos={keys<V3>(t, [[SHOTS.void.start, [0.5, -2, 2.5]], [E.v_nora, [0.8, 2, 2.2]], [E.v_earth, [0, -6, 6]], [SHOTS.void.end, [0, -18, 10]]])}
        target={keys<V3>(t, [[SHOTS.void.start, [1, 14, 3]], [E.v_nora, [2.5, 9, 1.4]], [E.v_earth, [-1, 30, 7]], [SHOTS.void.end, [0, 60, 14]]])} lens={28} />
      <ZUp>
        {Array.from({ length: 6 }).map((_, i) => (
          <WireBox key={i} p={[(-1) ** i * 7, 14 + Math.floor(i / 2) * 9, 7]} s={[6, 8, 14 + i]} c="#bfe3ff" o={0.9 * fade(E.v_street)} />
        ))}
        {fade(E.v_air) > 0.01 ? <Boxes items={air} m={basic("#9fd8ff", fade(E.v_air))} cast={false} /> : null}
        {fade(E.v_nora) > 0.01 ? <Person p={[2.5, 9, 0]} rz={Math.PI} look={NORA} glow="#ffb3a8" /> : null}
        <WireSphere p={[-3, 30, 6]} r={4} c="#9fd8ff" o={fade(E.v_earth)} />
        <WireSphere p={[6, 60, 14]} r={9} c="#ffd27a" o={fade(E.v_sun)} />
        {fade(E.v_star + 0.6) > 0.01 ? <Stars n={260} R={130} seed={99} o={fade(E.v_star + 0.6)} /> : null}
      </ZUp>
    </>
  );
};

// ------------------------------------------------------------------ only light is left
export const LightScene: React.FC<{ t: number }> = ({ t }) => {
  const rays = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 170 }, () => ({ y: r() * 28 - 14, z: r() * 16 - 8, ph: r() * 60, sp: 18 + r() * 8, len: 1.5 + r() * 2.5 }));
  }, []);
  const items = rays.map((a) => ({ p: [((t * a.sp + a.ph) % 60) - 30, a.y, a.z] as V3, s: [a.len, 0.025, 0.025] as V3 }));
  const ring = ramp(t, E.keeps - 1.5, E.keeps - 0.5) * (0.6 + 0.4 * Math.sin(t * 3));
  return (
    <>
      <Sky col="#000000" />
      <Cam pos={keys<V3>(t, [[SHOTS.light.start, [-6, -14, 2]], [E.keeps, [2, -10, 1.5]], [SHOTS.light.end, [6, -7, 0.5]]])} target={[0, 0, 0]} lens={30} />
      <ZUp>
        <Boxes items={items} m={basic("#ffc46a")} cast={false} />
        {ring > 0.01 ? (
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[3, 0.03, 8, 64]} />
            <meshBasicMaterial color="#7fb8ff" transparent opacity={ring} />
          </mesh>
        ) : null}
      </ZUp>
    </>
  );
};

// ------------------------------------------------------------------ the five-second hole in the sunlight, Sun at top, Earth at bottom
export const SpaceScene: React.FC<{ t: number }> = ({ t }) => {
  const SUNZ = 42;
  const EARTHZ = -34;
  const L = SUNZ - EARTHZ;
  const phot = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 420 }, () => ({ ph: r(), x: r() * 6.4 - 3.2, y: r() * 6.4 - 3.2 }));
  }, []);
  const conts = useMemo(() => {
    const r = rng(4);
    return Array.from({ length: 10 }, () => {
      const v = new THREE.Vector3(r() * 2 - 1, r() * 1.2 - 1, r() * 2 - 1).normalize().multiplyScalar(3.6);
      return [v.x, v.y, EARTHZ + v.z] as V3;
    });
  }, [EARTHZ]);
  const k = clamp((t - E.hole + 0.3) / (SHOTS.space.end - E.hole + 0.3));
  const hole = lerp(SUNZ - 2, EARTHZ + 8, k);
  const items = phot
    .map((o) => {
      const z = SUNZ - ((o.ph * L + t * 7) % L);
      if (t > E.hole - 0.4 && z > hole - 7 && z < hole + 7) return null;
      return { p: [o.x, o.y, z] as V3, s: [0.08, 0.08, 1.1] as V3 };
    })
    .filter(Boolean) as { p: V3; s: V3 }[];
  return (
    <>
      <Sky col="#02030a" />
      <Cam pos={keys<V3>(t, [[SHOTS.space.start, [6, -82, 14]], [E.hole, [0, -86, 6]], [SHOTS.space.end, [-4, -70, -6]]])}
        target={keys<V3>(t, [[SHOTS.space.start, [0, 0, 12]], [E.hole, [0, 0, 4]], [SHOTS.space.end, [0, 0, -8]]])} lens={30} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, SUNZ, 12]} intensity={4000} distance={0} decay={1.4} color="#fff0d0" />
      <ZUp>
        <Ball p={[0, 0, SUNZ + 10]} r={14} m={basic("#ffb347")} seg={48} />
        <Glow p={[0, 0, SUNZ + 10]} r={34} c="#ff9a3a" o={0.6} />
        <Ball p={[0, 0, EARTHZ]} r={4.2} m={mat("#2f6fd0", 0.55)} seg={48} />
        {conts.map((p, i) => <Ball key={i} p={p} r={1.2} s={[1, 1, 0.6]} m={mat("#4c9a52", 0.8)} ico />)}
        <Glow p={[0, 0, EARTHZ]} r={6.5} c="#7fc4ff" o={0.35} />
        <Ball p={[9, 3, EARTHZ + 4]} r={1.1} m={mat("#bdbdbd", 0.9)} />
        <Boxes key={items.length} items={items} m={basic("#ffb44a")} cast={false} />
        <Stars n={320} R={140} seed={7} zmin={-1} />
      </ZUp>
    </>
  );
};

// ------------------------------------------------------------------ observatory control room
export const LabScene: React.FC<{ t: number }> = ({ t }) => {
  const flux = useTextTexture([{ text: "SOLAR FLUX", color: "#bfe3ff", size: 36, y: 40 }]);
  const clockOn = t > E.behind - 0.4;
  const pulse = clockOn ? 0.75 + 0.25 * Math.sin(t * 8) : 1;
  const clock = useTextTexture([
    { text: "CLOCK OFFSET", color: "#bfe3ff", size: 40, y: 60 },
    { text: "-5.000 s", color: clockOn ? `rgba(255,90,90,${pulse})` : "#335577", size: 110, y: 175 },
  ]);
  const survey = useTextTexture([{ text: "SKY SURVEY", color: "#bfe3ff", size: 36, y: 40 }]);
  const dots = useMemo(() => {
    const r = rng(2);
    return Array.from({ length: 40 }, () => ({ p: [1.4 + (r() - 0.5), 2.955, 1.32 + (r() - 0.55) * 0.45] as V3, s: [0.012, 0.005, 0.012] as V3 }));
  }, []);
  const bars = Array.from({ length: 16 }, (_, j) => {
    const h = j === 9 ? 0.02 : 0.32;
    return { p: [-1.92 + j * 0.07, 2.955, 1.2 + h / 2] as V3, s: [0.045, 0.005, h] as V3 };
  });
  const armR: V3 = [-1.2 - 0.25 * ramp(t, E.clock - 0.5, E.clock), 0, -0.1];
  return (
    <>
      <Sky col="#cfe3f2" />
      <Cam pos={keys<V3>(t, [[SHOTS.lab.start, [2.6, -2.2, 2.0]], [E.clock - 0.6, [1.2, 0.4, 1.7]], [E.behind, [0.05, 2.12, 1.42]], [SHOTS.lab.end, [0.0, 2.2, 1.4]]])}
        target={keys<V3>(t, [[SHOTS.lab.start, [0, 2.6, 1.2]], [E.clock - 0.6, [0, 2.9, 1.3]], [E.behind, [0, 3.0, 1.33]], [SHOTS.lab.end, [0, 3.0, 1.33]]])}
        lens={keys(t, [[SHOTS.lab.start, 30], [E.clock - 0.6, 26], [E.behind, 19]])} />
      <Lights sun={2.2} dir={[-30, 10, 20]} hemi={0.8} shadow={8} />
      <ZUp>
        <B p={[0, 0, -0.05]} s={[12, 12, 0.1]} m={mat("#8f8a84", 0.8)} />
        <B p={[0, 4, 2]} s={[12, 0.2, 4]} m={mat("#e6e1d8", 0.9)} />
        <B p={[-5, 0, 2]} s={[0.2, 12, 4]} m={mat("#dcd6cc", 0.9)} />
        <B p={[-4.88, 0.5, 2.2]} s={[0.05, 3.2, 1.6]} m={basic("#eef6ff")} />
        <B p={[0, 2.6, 0.75]} s={[4.4, 1.2, 0.08]} m={mat("#c9b49a", 0.6)} />
        {[-2, 2].map((x) => <B key={x} p={[x, 2.6, 0.37]} s={[0.08, 1.0, 0.74]} m={mat("#6b6f78", 0.5)} />)}
        {[-1.4, 0, 1.4].map((x, i) => (
          <group key={i}>
            <B p={[x, 3.0, 1.35]} s={[1.25, 0.06, 0.78]} m={mat("#1b1d24", 0.4)} />
            <B p={[x, 3.05, 0.95]} s={[0.08, 0.08, 0.35]} m={mat("#1b1d24", 0.4)} />
            <mesh position={[x, 2.965, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.15, 0.68]} />
              <meshBasicMaterial map={[flux, clock, survey][i]} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        <Boxes items={bars} m={basic("#7dff9a")} cast={false} />
        <Boxes items={dots} m={basic("#bfe3ff")} cast={false} />
        <B p={[0.2, 1.7, 0.5]} s={[0.6, 0.6, 0.1]} m={mat("#2f3a4a", 0.6)} />
        <B p={[0.2, 1.45, 0.85]} s={[0.6, 0.08, 0.7]} m={mat("#2f3a4a", 0.6)} />
        {[0, 1, 2].map((i) => <B key={i} p={[-4.8, 2.6, 0.6 + i * 0.7]} s={[0.3, 2.5, 0.05]} m={mat("#8a6446", 0.7)} />)}
        <Person p={[0.2, 1.75, 0]} rz={Math.PI} look={NORA} pose={{ sit: true, armL: [-1.2, 0, 0.1], armR, head: [0.1, 0.25 * Math.sin(t * 0.6)] }} />
      </ZUp>
    </>
  );
};

// ------------------------------------------------------------------ night pieces
const NightLights: React.FC = () => <Lights sun={1.1} sunCol="#b9ccff" dir={[20, -30, 40]} hemi={0.55} sky="#3a4a8a" ground="#1a1f30" shadow={25} />;

const BrightStar: React.FC<{ p: V3; r?: number; hidden?: boolean; c?: string }> = ({ p, r = 1.7, hidden, c = "#fff2cf" }) =>
  hidden ? null : (
    <group>
      <Ball p={p} r={r} m={basic(c)} seg={16} />
      <Glow p={p} r={r * 6} c={c} o={0.7} />
    </group>
  );

export const DomeScene: React.FC<{ t: number }> = ({ t }) => {
  const A: V3 = [-60, 330, 210];
  const ring = ramp(t, E.closest, E.closest + 0.6) * (0.7 + 0.3 * Math.sin(t * 5));
  const ringRot = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...A).normalize().negate());
    return new THREE.Euler().setFromQuaternion(q);
  }, []);
  return (
    <>
      <Sky col="#1b2652" />
      <Cam pos={keys<V3>(t, [[SHOTS.dome.start, [6, -10, 1.6]], [E.realize + 3, [4, -8, 2.0]], [E.closest, [2, -6, 2.4]], [SHOTS.dome.end, [1.5, -5, 2.5]]])}
        target={keys<V3>(t, [[SHOTS.dome.start, [0, 6, 4]], [E.realize + 3, [-10, 60, 40]], [E.closest, [-55, 320, 205]], [SHOTS.dome.end, A]])}
        lens={keys(t, [[SHOTS.dome.start, 26], [E.closest, 30], [SHOTS.dome.end, 70]])} />
      <NightLights />
      <ZUp>
        <B p={[0, 0, -0.5]} s={[80, 80, 1]} m={mat("#2b3a2e", 0.95)} />
        <Cyl p={[0, 6, 2]} r={3.2} h={4} m={mat("#d9d6cf", 0.8)} seg={32} rot={[Math.PI / 2, 0, 0]} />
        <Ball p={[0, 6, 4]} r={3.3} m={mat("#e9e6df", 0.4, undefined, 0, 0.3)} seg={48} />
        <Cyl p={[0, 6, 4]} r={3.35} h={0.12} m={mat("#9a9da5", 0.5)} seg={48} rot={[Math.PI / 2, 0, 0]} />
        <Cyl p={[0, 4.4, 7.0]} r={0.32} h={2.4} m={mat("#f2f0ea", 0.4)} seg={20} rot={[Math.PI / 2 + 0.7, 0, 0]} />
        <B p={[0, 2.8, 1.0]} s={[0.9, 0.05, 1.9]} m={basic("#ffd9a0")} />
        <Glow p={[0, 2.6, 1.0]} r={2.4} c="#ffcf8a" o={0.6} />
        <Stars n={900} R={400} seed={5} hide={(i) => i < 300 && t > E.each && rng(i * 7 + Math.floor(t * 2))() < 0.04} />
        <BrightStar p={A} r={1.8} />
        {ring > 0.01 ? (
          <mesh position={A} rotation={ringRot}>
            <torusGeometry args={[16, 0.6, 8, 64]} />
            <meshBasicMaterial color="#ffe36b" transparent opacity={ring} />
          </mesh>
        ) : null}
      </ZUp>
    </>
  );
};

const CROWD_COLS = ["#3f7fd6", "#e8b84a", "#7a5bb6", "#3fae6a", "#e07a4a", "#f2f2ee", "#9e1b2d"];
export const RoofScene: React.FC<{ t: number }> = ({ t }) => {
  const crowd = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 18 }, () => ({
      p: [r() * 14 - 7, r() * 7 - 1, 0] as V3, rz: Math.PI + (r() - 0.5) * 0.6, s: 0.92 + r() * 0.13,
      look: { shirt: CROWD_COLS[Math.floor(r() * 7)], pants: ["#2a2f3a", "#3f5f9e", "#3b3e46"][Math.floor(r() * 3)], hair: ["#2b1d16", "#4a3426", "#d9c39a", "#1e1a18"][Math.floor(r() * 4)], style: (["short", "long", "pony", "bald"] as const)[Math.floor(r() * 4)] },
    }));
  }, []);
  const sky = useMemo(() => {
    const r = rng(8);
    const b: { p: V3; s: V3 }[] = [];
    const w: { p: V3; s: V3 }[] = [];
    for (let i = 0; i < 30; i++) {
      const x = -60 + i * 4.2;
      const h = (8 + r() * 22) * (Math.abs(x) < 10 ? 0.55 : 1);
      const y = 30 + r() * 30;
      b.push({ p: [x, y, h / 2 - 20], s: [3.6, 3.6, h] });
      for (let j = 0; j < Math.floor(h / 3); j++) if (r() < 0.5) w.push({ p: [x + (r() - 0.5) * 2.4, y - 1.85, j * 3 - 18], s: [0.6, 0.05, 0.8] });
    }
    return { b, w };
  }, []);
  const blink = t >= E.blink && t < E.blink + 5;
  return (
    <>
      <Sky col="#1b2652" />
      <Cam pos={keys<V3>(t, [[SHOTS.roof.start, [0.5, -9, 1.4]], [E.blink - 1, [0.2, -7.5, 1.2]], [SHOTS.roof.end, [0, -7, 1.1]]])}
        target={keys<V3>(t, [[SHOTS.roof.start, [0, 8, 3]], [E.blink - 1, [-6, 60, 22]], [SHOTS.roof.end, [-8, 70, 26]]])} lens={24} />
      <NightLights />
      <ZUp>
        <B p={[0, 0, -0.1]} s={[30, 30, 0.2]} m={mat("#4a4d55", 0.9)} />
        <B p={[0, 9, 0.5]} s={[30, 0.1, 0.08]} m={mat("#9a9da5", 0.5)} />
        <Boxes items={sky.b} m={mat("#1b2033", 0.9)} />
        <Boxes items={sky.w} m={basic("#ffd59a")} cast={false} />
        {crowd.map((c, i) => (
          <Person key={i} p={c.p} rz={c.rz} s={c.s} look={c.look} pose={{ head: [-0.5 - 0.1 * Math.sin(i), 0.1 * Math.sin(i * 2)], armR: i % 3 ? [-0.3, 0, -0.06] : [-2.7, 0, -0.1] }} />
        ))}
        <Person p={[1.5, -2.5, 0]} rz={Math.PI + 0.05} look={NORA} pose={{ head: [-0.35, 0], armL: [-1.6, 0, 0.2], armR: [-1.5, 0, -0.2] }} />
        <Cyl p={[1.5, -1.6, 1.55]} r={0.1} h={1.2} m={mat("#e9e6df", 0.4)} rot={[Math.PI / 2 + 1.1, 0, 0]} />
        <Cyl p={[1.5, -1.9, 0.6]} r={0.03} h={1.2} m={mat("#30343c", 0.5)} seg={8} rot={[Math.PI / 2, 0, 0]} />
        <Stars n={700} R={400} seed={9} />
        <BrightStar p={[-40, 300, 160]} hidden={blink} />
      </ZUp>
    </>
  );
};

export const SkyScene: React.FC<{ t: number }> = ({ t }) => {
  const sil = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 40 }, (_, i) => {
      const h = 4 + r() * 26;
      return { p: [-80 + i * 4.2, 60 + r() * 20, h / 2] as V3, s: [3.8, 3.8, h] as V3 };
    });
  }, []);
  const rocks = useMemo(() => {
    const r = rng(40);
    return Array.from({ length: 12 }, () => ({ p: [r() * 40 - 20, 5 + r() * 35, -499.8] as V3, r: 0.5 + r() * 1.1 }));
  }, []);
  const far = t >= E.somewhere;
  const blinkAlpha = t >= E.blink && t < E.blink + 5;
  return (
    <>
      <Sky col={far ? "#3a2350" : "#1b2652"} />
      {far ? (
        <Cam pos={keys<V3>(t, [[E.somewhere, [0, -6, -500 + 1.7]], [SHOTS.sky.end, [0, -3, -500 + 1.6]]])}
          target={keys<V3>(t, [[E.somewhere, [-10, 120, -500 + 40]], [SHOTS.sky.end, [-25, 280, -500 + 110]]])} lens={26} />
      ) : (
        <Cam pos={keys<V3>(t, [[SHOTS.sky.start, [0, -10, 2]], [E.somewhere, [0, -12, 8]]])} target={keys<V3>(t, [[SHOTS.sky.start, [0, 100, 40]], [E.somewhere, [0, 100, 120]]])} lens={20} />
      )}
      <NightLights />
      {far ? <pointLight position={[0, -492, -10]} intensity={60} distance={0} decay={1} color="#c9a0ff" /> : null}
      <ZUp>
        {!far ? (
          <group>
            <B p={[0, 0, -0.5]} s={[300, 300, 1]} m={mat("#141824", 0.95)} />
            <Boxes items={sil} m={mat("#0d1020", 0.9)} />
            <Stars n={1100} R={450} seed={21} hide={(i) => {
              const r = rng(i * 31);
              const t0 = SHOTS.sky.start + r() * 18 - 4;
              return t >= t0 && t < t0 + 5 && r() < 0.35;
            }} />
            <BrightStar p={[-40, 300, 160]} hidden={blinkAlpha} />
          </group>
        ) : (
          <group>
            <B p={[0, 0, -500.5]} s={[400, 400, 1]} m={mat("#5a3f4f", 0.95)} />
            {rocks.map((r, i) => <Ball key={i} p={r.p} r={r.r} m={mat("#3f2c38", 0.9)} ico />)}
            <B p={[3, 18, -497]} s={[0.6, 0.6, 6]} m={mat("#9aa0b0", 0.4)} />
            <Ball p={[3, 18, -493.8]} r={0.18} m={basic("#ff5a5a")} />
            <Glow p={[3, 18, -493.8]} r={1.2} c="#ff5a5a" o={0.6} />
            
            <group position={[0, 0, -500]}>
              <Stars n={600} R={420} seed={33} />
            </group>
            <BrightStar p={[-30, 300, -380]} r={2.2} c="#ffe08a" hidden={t > E.end + 0.4 && t < E.end + 5.4} />
          </group>
        )}
      </ZUp>
    </>
  );
};
