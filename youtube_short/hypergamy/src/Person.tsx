import React from "react";

// "What If"-style character, ported from story_short.person(): black head, white eyes, coloured hoodie.
// Coordinates are in the panel "world" (2160 x 1240). (x, yf) = feet position.

export const INK = "#16161c";
const EYE = "#fafafa";
const BROW = "#d7d7d7";
const PANTS = "#242430";

export type Expr =
  | "neutral" | "shock" | "smug" | "tired" | "sad" | "nervous" | "angry" | "happy" | "love" | "laugh";
export type Arm = "down" | "phone" | "point" | "hips" | "shrug" | "wave" | "head" | "chest" | "hold" | "belly";
export type Hair = "quiff" | "messy" | "bun" | "long" | "cap" | "bald" | "slick";

const ARM_POSES: Record<Arm, [[number, number], [number, number]]> = {
  down: [[16, 112], [10, 220]],
  phone: [[26, 118], [-26, 72]],
  point: [[110, 14], [215, 0]],
  hips: [[88, 80], [34, 176]],
  shrug: [[88, 40], [118, -40]],
  wave: [[84, -26], [104, -150]],
  head: [[110, -30], [34, -124]],
  chest: [[40, 110], [-44, 70]],
  hold: [[40, 100], [-36, 116]],
  belly: [[60, 104], [-6, 150]],
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
};

export type PersonProps = {
  x: number;
  yf: number;
  u?: number;
  shirt?: string;
  hair?: Hair;
  hairCol?: string;
  expr?: Expr;
  look?: number;
  lookY?: number;
  talk?: boolean;
  t: number; // seconds, for blinking / talking / waving
  seed?: number;
  arms?: [Arm, Arm];
  facing?: 1 | -1;
  sit?: boolean;
  walk?: number | null;
  hood?: boolean;
  tie?: string;
  phoneHand?: 0 | 1 | null;
  blush?: number;
  glasses?: boolean;
  dress?: boolean;
};

export const headPos = (x: number, yf: number, u = 1, sit = false) => ({
  hx: x,
  hy: yf - (sit ? 536 : 562) * u,
});

export const Person: React.FC<PersonProps> = ({
  x, yf, u = 1, shirt = "#2860de", hair = "quiff", hairCol, expr = "neutral", look = 0, lookY = 0,
  talk = false, t, seed = 0, arms = ["down", "down"], facing = 1, sit = false, walk = null, hood = true,
  tie, phoneHand = null, blush = 0, glasses = false, dress = false,
}) => {
  const U = (v: number) => v * u;
  const hipY = sit ? yf - U(232) : yf - U(258);
  const shY = hipY - U(212);
  const hx = x;
  const hy = shY - U(92);
  const hr = U(88);
  const dark = shade(shirt, 0.78);
  const parts: React.ReactNode[] = [];
  let key = 0;
  const k = () => key++;

  // legs
  for (const s of [-1, 1]) {
    const hip: [number, number] = [x + s * U(24), hipY];
    let pts: [number, number][];
    if (sit) {
      const knee: [number, number] = [x + facing * U(128) + s * U(10), hipY + U(6)];
      pts = [hip, knee, [knee[0] + facing * U(8), yf - U(16)]];
    } else if (walk !== null) {
      const a = Math.sin(walk) * 0.45 * s;
      pts = [hip, [hip[0] + Math.sin(a) * U(244), hipY + Math.cos(a) * U(244) - U(4)]];
    } else {
      pts = [hip, [x + s * U(30), yf - U(16)]];
    }
    parts.push(
      <polyline key={k()} points={pts.map((p) => p.join(",")).join(" ")} fill="none"
        stroke={dress ? shade(shirt, 0.9) : PANTS} strokeWidth={U(34)} strokeLinecap="round" strokeLinejoin="round" />,
    );
    const fx = pts[pts.length - 1][0] + facing * U(16);
    parts.push(<ellipse key={k()} cx={fx} cy={yf - U(14)} rx={U(32)} ry={U(14)} fill={INK} />);
  }
  // torso
  if (hood) parts.push(<ellipse key={k()} cx={x} cy={shY + U(2)} rx={U(76)} ry={U(42)} fill={dark} />);
  if (dress) {
    parts.push(<path key={k()} d={`M ${x - U(60)} ${shY + U(10)} L ${x + U(60)} ${shY + U(10)} L ${x + U(118)} ${hipY + U(130)} L ${x - U(118)} ${hipY + U(130)} Z`} fill={shirt} />);
  }
  parts.push(<rect key={k()} x={x - U(64)} y={shY} width={U(128)} height={hipY + U(20) - shY} rx={U(42)} fill={shirt} />);
  if (hood) {
    for (const s of [-1, 1]) {
      parts.push(<line key={k()} x1={x + s * U(16)} y1={shY + U(22)} x2={x + s * U(18)} y2={shY + U(92)} stroke="#ebebf0" strokeWidth={U(6)} strokeLinecap="round" />);
    }
    parts.push(<rect key={k()} x={x - U(40)} y={hipY - U(64)} width={U(80)} height={U(54)} rx={U(14)} fill={dark} />);
  }
  if (tie) {
    parts.push(<polygon key={k()} points={`${x - U(34)},${shY} ${x},${shY + U(40)} ${x + U(34)},${shY}`} fill="#f0f0f5" />);
    parts.push(<polygon key={k()} points={`${x - U(12)},${shY + U(16)} ${x + U(12)},${shY + U(16)} ${x + U(18)},${shY + U(120)} ${x},${shY + U(148)} ${x - U(18)},${shY + U(120)}`} fill={tie} />);
  }
  // arms
  arms.forEach((mode, idx) => {
    const s = idx === 0 ? -1 : 1;
    const sx = mode === "point" ? facing : s;
    const [[ex, ey], [hx2, hy20]] = ARM_POSES[mode];
    let hx2b = hx2;
    if (mode === "wave") hx2b += Math.sin(t * 10) * 18;
    const sh: [number, number] = [x + s * U(56), shY + U(34)];
    const el: [number, number] = [sh[0] + sx * U(ex), sh[1] + U(ey)];
    const hd: [number, number] = [sh[0] + sx * U(hx2b), sh[1] + U(hy20)];
    parts.push(<polyline key={k()} points={[sh, el, hd].map((p) => p.join(",")).join(" ")} fill="none" stroke={shirt} strokeWidth={U(32)} strokeLinecap="round" strokeLinejoin="round" />);
    parts.push(<circle key={k()} cx={hd[0]} cy={hd[1]} r={U(16)} fill={INK} />);
    if ((mode === "phone" || mode === "point") && phoneHand === idx) {
      parts.push(<rect key={k()} x={hd[0] - U(22)} y={hd[1] - U(40)} width={U(44)} height={U(70)} rx={U(8)} fill="#1e1e28" stroke="#a0a0af" strokeWidth={U(3)} />);
      parts.push(<rect key={k()} x={hd[0] - U(16)} y={hd[1] - U(32)} width={U(32)} height={U(52)} fill="#78beff" />);
    }
  });
  // head
  const hc = hairCol ?? (hair === "long" ? "#3a261e" : "#603e26");
  if (hair === "long") {
    parts.push(<rect key={k()} x={hx - U(100)} y={hy - U(96)} width={U(200)} height={U(246)} rx={U(90)} fill={hc} />);
  }
  parts.push(<circle key={k()} cx={hx} cy={hy} r={hr} fill={INK} />);
  if (hair === "quiff") {
    const p = [[-74, -46], [-66, -92], [-14, -132], [58, -134], [98, -96], [86, -48], [36, -80], [-18, -70]];
    parts.push(<polygon key={k()} points={p.map(([a, b]) => `${hx + U(a)},${hy + U(b)}`).join(" ")} fill={hc} />);
    parts.push(<polyline key={k()} points={`${hx - U(20)},${hy - U(112)} ${hx + U(50)},${hy - U(120)} ${hx + U(80)},${hy - U(96)}`} fill="none" stroke="#966842" strokeWidth={U(7)} strokeLinecap="round" />);
  } else if (hair === "slick") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(4)} ${hy - U(10)} A ${hr + U(4)} ${hr + U(8)} 0 0 1 ${hx + hr + U(4)} ${hy - U(10)} Q ${hx} ${hy - U(70)} ${hx - hr - U(4)} ${hy - U(10)} Z`} fill="#1c1410" />);
  } else if (hair === "messy") {
    for (const [ox, oy] of [[-46, -70], [-12, -86], [26, -84], [56, -66]]) {
      parts.push(<polygon key={k()} points={`${hx + U(ox - 22)},${hy + U(oy + 26)} ${hx + U(ox + 4)},${hy + U(oy - 30)} ${hx + U(ox + 24)},${hy + U(oy + 22)}`} fill={INK} />);
    }
  } else if (hair === "bun") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(4)} ${hy - U(14)} A ${hr + U(4)} ${hr + U(6)} 0 0 1 ${hx + hr + U(4)} ${hy - U(14)} Z`} fill={hc} />);
    parts.push(<circle key={k()} cx={hx} cy={hy - U(112)} r={U(36)} fill={hc} />);
  } else if (hair === "cap") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(4)} ${hy - U(20)} A ${hr + U(4)} ${hr + U(6)} 0 0 1 ${hx + hr + U(4)} ${hy - U(20)} Z`} fill="#d2463c" />);
    parts.push(<rect key={k()} x={facing > 0 ? hx : hx - U(150)} y={hy - U(36)} width={U(150)} height={U(20)} rx={U(8)} fill="#b43732" />);
  } else if (hair === "long") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(6)} ${hy + hr * 0.3} A ${hr + U(6)} ${hr + U(8)} 0 0 1 ${hx + hr + U(6)} ${hy + hr * 0.3} L ${hx + hr} ${hy - U(20)} Q ${hx} ${hy - U(50)} ${hx - hr} ${hy - U(20)} Z`} fill={hc} />);
  }
  // face
  const blink = ((t + seed * 1.37) % 3.4) < 0.11 && expr !== "shock" && expr !== "love";
  const lx = look * U(15);
  for (const s of [-1, 1]) {
    const ex = hx + s * U(31) + lx;
    const ey = hy - U(6) + lookY * U(4);
    if (expr === "love") {
      const r = U(24);
      parts.push(<path key={k()} d={`M ${ex} ${ey + r} L ${ex - r * 0.97} ${ey - 0.2 * r} A ${r / 2} ${r / 2} 0 0 1 ${ex} ${ey - 0.4 * r} A ${r / 2} ${r / 2} 0 0 1 ${ex + r * 0.97} ${ey - 0.2 * r} Z`} fill="#eb3250" />);
    } else if (blink) {
      parts.push(<line key={k()} x1={ex - U(20)} y1={ey} x2={ex + U(20)} y2={ey} stroke={EYE} strokeWidth={U(5)} strokeLinecap="round" />);
    } else {
      const [rx, ry] = expr === "shock" ? [U(25), U(30)] : [U(21), U(25)];
      parts.push(<ellipse key={k()} cx={ex} cy={ey} rx={rx} ry={ry} fill={EYE} />);
      const pr = expr === "shock" ? U(7) : U(10);
      parts.push(<circle key={k()} cx={ex + look * U(8)} cy={ey + lookY * U(10)} r={pr} fill={INK} />);
      if (expr === "smug" || expr === "tired") {
        parts.push(<rect key={k()} x={ex - rx - 2} y={ey - ry - 2} width={2 * rx + 4} height={ry - U(2)} fill={INK} />);
      }
    }
    // brows
    const by = hy - U(46);
    const inner = ex - s * U(16);
    const outer = ex + s * U(16);
    let a = by;
    let b = by;
    if (expr === "shock") { a = by - U(14); b = by - U(14); }
    else if (expr === "sad" || expr === "nervous") { a = by - U(10); b = by + U(4); }
    else if (expr === "angry") { a = by + U(10); b = by - U(8); }
    else if (expr === "smug") { a = s === 1 ? by - U(12) : by + U(2); b = a; }
    else if (expr === "happy" || expr === "love" || expr === "laugh") { a = by - U(6); b = by - U(4); }
    parts.push(<line key={k()} x1={inner + lx * 0.6} y1={a} x2={outer + lx * 0.6} y2={b} stroke={BROW} strokeWidth={U(6)} strokeLinecap="round" />);
  }
  if (glasses) {
    for (const s of [-1, 1]) {
      parts.push(<rect key={k()} x={hx + s * U(31) - U(30) + lx} y={hy - U(28)} width={U(60)} height={U(40)} rx={U(10)} fill="#111" stroke="#333" strokeWidth={U(4)} />);
    }
    parts.push(<line key={k()} x1={hx - U(2) + lx} y1={hy - U(12)} x2={hx + U(2) + lx} y2={hy - U(12)} stroke="#333" strokeWidth={U(5)} />);
  }
  const mx = hx + lx * 0.7;
  const my = hy + U(46);
  const mcol = "#f0f0f0";
  if (talk) {
    const o = U(5 + 15 * Math.abs(Math.sin(t * 14 + seed)));
    parts.push(<ellipse key={k()} cx={mx} cy={my} rx={U(15)} ry={o / 2} fill="#962837" stroke={mcol} strokeWidth={U(3)} />);
  } else if (expr === "shock") {
    parts.push(<ellipse key={k()} cx={mx} cy={my + U(1)} rx={U(13)} ry={U(15)} fill={mcol} />);
    parts.push(<ellipse key={k()} cx={mx} cy={my + U(1)} rx={U(8)} ry={U(9)} fill="#962837" />);
  } else if (expr === "laugh") {
    parts.push(<path key={k()} d={`M ${mx - U(26)} ${my} A ${U(26)} ${U(22)} 0 0 0 ${mx + U(26)} ${my} Z`} fill={mcol} />);
  } else if (expr === "happy" || expr === "love") {
    parts.push(<path key={k()} d={`M ${mx - U(20)} ${my - U(4)} Q ${mx} ${my + U(14)} ${mx + U(20)} ${my - U(4)}`} fill="none" stroke={mcol} strokeWidth={U(5)} strokeLinecap="round" />);
  } else if (expr === "smug") {
    parts.push(<path key={k()} d={`M ${mx - U(16)} ${my} Q ${mx + U(6)} ${my + U(10)} ${mx + U(24)} ${my - U(8)}`} fill="none" stroke={mcol} strokeWidth={U(5)} strokeLinecap="round" />);
  } else if (expr === "sad" || expr === "nervous" || expr === "tired") {
    parts.push(<path key={k()} d={`M ${mx - U(16)} ${my + U(12)} Q ${mx} ${my - U(2)} ${mx + U(16)} ${my + U(12)}`} fill="none" stroke={mcol} strokeWidth={U(5)} strokeLinecap="round" />);
  } else if (expr === "angry") {
    parts.push(<rect key={k()} x={mx - U(20)} y={my - U(4)} width={U(40)} height={U(14)} rx={U(4)} fill={mcol} />);
  } else {
    parts.push(<line key={k()} x1={mx - U(14)} y1={my + U(4)} x2={mx + U(14)} y2={my + U(4)} stroke={mcol} strokeWidth={U(5)} strokeLinecap="round" />);
  }
  if (expr === "nervous") {
    const sx2 = hx + U(92);
    const sy2 = hy - U(36);
    parts.push(<path key={k()} d={`M ${sx2} ${sy2 - U(14)} L ${sx2 + U(9)} ${sy2 + U(8)} A ${U(10)} ${U(10)} 0 1 1 ${sx2 - U(9)} ${sy2 + U(8)} Z`} fill="#8cc8ff" />);
  }
  if (blush > 0) {
    for (const s of [-1, 1]) {
      parts.push(<ellipse key={k()} cx={hx + s * U(54)} cy={hy + U(30)} rx={U(21)} ry={U(10)} fill="#ff6e8c" opacity={0.6 * blush} />);
    }
  }
  return <g>{parts}</g>;
};
