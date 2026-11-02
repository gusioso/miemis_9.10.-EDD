import React from "react";
import { Easing, interpolate } from "remotion";

// Stick-figure cast for "What If Everyone Had a Lie Counter?".
// Black round head, big white eyes with light brows, thin black limbs, bright clothes with bold outlines.
// World coordinates (panel is 2160 x 1240). (x, yf) = point between the feet on the floor.

export const INK = "#141419";
const EYE = "#ffffff";
const BROW = "#e9e9ee";
const LIMB = 13;

export type Expr =
  | "neutral" | "happy" | "laugh" | "shock" | "worried" | "sad" | "angry" | "smug" | "sleep"
  | "confused" | "suspicious" | "thinking" | "proud" | "warm" | "awkward";
export type Arm =
  | "down" | "phone" | "phoneUp" | "point" | "wave" | "chest" | "hips" | "chin" | "cheer" | "hold"
  | "give" | "shrug" | "talk" | "water" | "stop" | "film" | "mic" | "thumb" | "cross";
export type Outfit = "hoodie" | "suit" | "apron" | "dress" | "coat" | "cardigan" | "tee" | "shopApron";
export type Hair = "alex" | "slick" | "grayBun" | "bun" | "pigtails" | "long" | "cap" | "bald" | "short" | "curly";

// [elbow, hand] offsets from the shoulder for the arm on the +x side (mirrored for the other arm).
const POSES: Record<Arm, [[number, number], [number, number]]> = {
  down: [[14, 104], [8, 200]],
  phone: [[30, 112], [-22, 64]],
  phoneUp: [[46, 70], [10, -10]],
  point: [[100, 10], [196, -6]],
  wave: [[80, -30], [96, -142]],
  chest: [[44, 96], [-40, 60]],
  hips: [[80, 74], [30, 160]],
  chin: [[40, 104], [-30, -22]],
  cheer: [[54, -70], [74, -170]],
  hold: [[40, 96], [70, 92]],
  give: [[90, 60], [180, 56]],
  shrug: [[84, 34], [112, -30]],
  talk: [[70, 80], [120, 40]],
  water: [[80, 50], [150, 70]],
  stop: [[90, -6], [150, -70]],
  film: [[70, 26], [130, -40]],
  mic: [[40, 80], [-8, 12]],
  thumb: [[74, 60], [104, -10]],
  cross: [[50, 92], [-60, 88]],
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

export type StickProps = {
  x: number;
  yf: number;
  t: number;
  u?: number;
  outfit?: Outfit;
  color?: string;
  accent?: string;
  hair?: Hair;
  expr?: Expr;
  look?: number; // -1..1 horizontal gaze
  lookY?: number; // -1 up .. 1 down
  talk?: boolean;
  seed?: number;
  arms?: [Arm, Arm];
  facing?: 1 | -1;
  sit?: boolean;
  walk?: number | null; // walk phase (radians)
  lean?: number; // degrees, + leans toward facing
  hold?: "phone" | "cup" | "can" | "cake" | "mic" | "paper" | null;
  holdHand?: 0 | 1;
  glasses?: boolean;
  mustache?: boolean;
  shadow?: boolean;
  bob?: number;
  blush?: number;
};

export const headOf = (x: number, yf: number, u = 1, sit = false) => ({ hx: x, hy: yf - (sit ? 470 : 530) * u, hr: 80 * u });

export const Stick: React.FC<StickProps> = ({
  x, yf, t, u = 1, outfit = "hoodie", color = "#2f6fe0", accent, hair = "short", expr = "neutral", look = 0,
  lookY = 0, talk = false, seed = 0, arms = ["down", "down"], facing = 1, sit = false, walk = null, lean = 0,
  hold = null, holdHand = 1, glasses = false, mustache = false, shadow = true, bob = 0, blush = 0,
}) => {
  const U = (v: number) => v * u;
  const breathe = Math.sin(t * 2.1 + seed) * U(2.5);
  const yb = yf - bob;
  const hipY = (sit ? yb - U(178) : yb - U(220)) - (walk !== null ? Math.abs(Math.sin(walk)) * U(6) : 0);
  const shY = hipY - U(190) + breathe;
  const { hr } = headOf(x, yf, u, sit);
  const hx = x;
  const hy = shY - U(98);
  const dark = shade(color, 0.78);
  const parts: React.ReactNode[] = [];
  let key = 0;
  const k = () => key++;
  const line = (pts: [number, number][], w = U(LIMB), col = INK) =>
    parts.push(<polyline key={k()} points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />);

  // ---- legs (thin black sticks with small shoes)
  for (const s of [-1, 1]) {
    const hip: [number, number] = [x + s * U(22), hipY];
    let pts: [number, number][];
    if (sit) {
      const knee: [number, number] = [x + facing * U(110) + s * U(8), hipY + U(4)];
      pts = [hip, knee, [knee[0] + facing * U(6), yb - U(10)]];
    } else if (walk !== null) {
      const a = Math.sin(walk) * 0.42 * s;
      const kneeBend = Math.max(0, Math.sin(walk * s)) * U(18);
      const foot: [number, number] = [hip[0] + Math.sin(a) * U(210), hipY + Math.cos(a) * U(210)];
      pts = [hip, [(hip[0] + foot[0]) / 2 + facing * kneeBend, (hip[1] + foot[1]) / 2], foot];
    } else {
      pts = [hip, [x + s * U(30), yb - U(10)]];
    }
    line(pts);
    const f = pts[pts.length - 1];
    parts.push(<ellipse key={k()} cx={f[0] + facing * U(14)} cy={f[1] + U(2)} rx={U(26)} ry={U(11)} fill={INK} />);
  }

  // ---- torso / clothes (bold outline)
  const st = { stroke: INK, strokeWidth: U(6), strokeLinejoin: "round" as const };
  const tw = U(66);
  const torsoBottom = hipY + U(22);
  if (outfit === "dress") {
    parts.push(<path key={k()} d={`M ${x - U(48)} ${shY + U(6)} Q ${x} ${shY - U(10)} ${x + U(48)} ${shY + U(6)} L ${x + U(96)} ${hipY + U(70)} Q ${x} ${hipY + U(90)} ${x - U(96)} ${hipY + U(70)} Z`} fill={color} {...st} />);
    parts.push(<path key={k()} d={`M ${x - U(70)} ${hipY + U(40)} Q ${x} ${hipY + U(56)} ${x + U(70)} ${hipY + U(40)}`} fill="none" stroke={accent ?? "#fff"} strokeWidth={U(7)} strokeLinecap="round" />);
  } else if (outfit === "coat") {
    parts.push(<path key={k()} d={`M ${x - tw} ${shY + U(30)} Q ${x - tw} ${shY} ${x - U(30)} ${shY} L ${x + U(30)} ${shY} Q ${x + tw} ${shY} ${x + tw} ${shY + U(30)} L ${x + tw + U(8)} ${hipY + U(70)} L ${x - tw - U(8)} ${hipY + U(70)} Z`} fill={color} {...st} />);
    parts.push(<line key={k()} x1={x} y1={shY + U(10)} x2={x} y2={hipY + U(66)} stroke={dark} strokeWidth={U(5)} />);
    for (const yy of [0.35, 0.6, 0.85]) parts.push(<circle key={k()} cx={x + U(14)} cy={shY + (hipY + U(60) - shY) * yy} r={U(6)} fill={dark} />);
  } else {
    parts.push(<rect key={k()} x={x - tw} y={shY} width={tw * 2} height={torsoBottom - shY} rx={U(40)} fill={outfit === "apron" ? "#f4ead8" : color} {...st} />);
  }
  if (outfit === "hoodie") {
    parts.push(<path key={k()} d={`M ${x - U(50)} ${shY + U(8)} Q ${x} ${shY + U(52)} ${x + U(50)} ${shY + U(8)}`} fill="none" stroke={dark} strokeWidth={U(10)} strokeLinecap="round" />);
    for (const s of [-1, 1]) line([[x + s * U(14), shY + U(30)], [x + s * U(16), shY + U(86)]], U(5), "#f2f2f6");
    parts.push(<rect key={k()} x={x - U(38)} y={hipY - U(60)} width={U(76)} height={U(48)} rx={U(14)} fill={dark} stroke={INK} strokeWidth={U(3)} />);
  } else if (outfit === "suit") {
    parts.push(<polygon key={k()} points={`${x - U(30)},${shY + U(2)} ${x},${shY + U(70)} ${x + U(30)},${shY + U(2)}`} fill="#f4f4f7" />);
    parts.push(<polygon key={k()} points={`${x - U(10)},${shY + U(16)} ${x + U(10)},${shY + U(16)} ${x + U(15)},${shY + U(112)} ${x},${shY + U(134)} ${x - U(15)},${shY + U(112)}`} fill={accent ?? "#9e1b2d"} />);
    parts.push(<path key={k()} d={`M ${x - U(30)} ${shY + U(2)} L ${x - U(4)} ${shY + U(96)} L ${x - U(44)} ${shY + U(40)} Z`} fill={shade(color, 1.25)} />);
    parts.push(<path key={k()} d={`M ${x + U(30)} ${shY + U(2)} L ${x + U(4)} ${shY + U(96)} L ${x + U(44)} ${shY + U(40)} Z`} fill={shade(color, 1.25)} />);
    for (const yy of [140, 170]) parts.push(<circle key={k()} cx={x} cy={shY + U(yy)} r={U(5)} fill="#111" />);
    parts.push(<rect key={k()} x={x + U(30)} y={shY + U(46)} width={U(22)} height={U(8)} rx={U(3)} fill="#f4f4f7" />);
  } else if (outfit === "apron" || outfit === "shopApron") {
    const ac = outfit === "apron" ? color : accent ?? "#2f8f5b";
    if (outfit === "shopApron") parts.push(<rect key={k()} x={x - tw} y={shY} width={tw * 2} height={torsoBottom - shY} rx={U(40)} fill={color} {...st} />);
    parts.push(<path key={k()} d={`M ${x - U(42)} ${shY + U(44)} L ${x + U(42)} ${shY + U(44)} L ${x + U(56)} ${hipY + U(64)} Q ${x} ${hipY + U(76)} ${x - U(56)} ${hipY + U(64)} Z`} fill={ac} {...st} />);
    for (const s of [-1, 1]) line([[x + s * U(40), shY + U(46)], [x + s * U(26), shY + U(4)]], U(7), ac);
    parts.push(<rect key={k()} x={x - U(26)} y={hipY - U(34)} width={U(52)} height={U(32)} rx={U(8)} fill={shade(ac, 0.85)} stroke={INK} strokeWidth={U(3)} />);
  } else if (outfit === "cardigan") {
    parts.push(<path key={k()} d={`M ${x - U(20)} ${shY + U(4)} L ${x} ${shY + U(60)} L ${x + U(20)} ${shY + U(4)}`} fill="#f6f2e8" />);
    for (const yy of [90, 125, 160]) parts.push(<circle key={k()} cx={x} cy={shY + U(yy)} r={U(5)} fill={dark} />);
  } else if (outfit === "tee") {
    parts.push(<path key={k()} d={`M ${x - U(26)} ${shY + U(4)} Q ${x} ${shY + U(26)} ${x + U(26)} ${shY + U(4)}`} fill="none" stroke={dark} strokeWidth={U(6)} />);
  }

  // ---- arms (sleeve cap in clothing colour, then black stick arm)
  arms.forEach((mode, idx) => {
    const s = idx === 0 ? -1 : 1;
    const flip = ["point", "give", "talk", "water", "stop", "film", "hold"].includes(mode) ? facing : s;
    const [[ex, ey], [hx2, hy2]] = POSES[mode];
    let hxx = hx2;
    let hyy = hy2;
    if (mode === "wave") hxx += Math.sin(t * 9 + seed) * 16;
    if (mode === "talk") hyy += Math.sin(t * 4 + seed + idx) * 14;
    if (mode === "cheer") hyy += Math.sin(t * 8 + idx * 2) * 10;
    const sh: [number, number] = [x + s * U(62), shY + U(34)];
    const el: [number, number] = [sh[0] + flip * U(ex), sh[1] + U(ey)];
    const hd: [number, number] = [sh[0] + flip * U(hxx), sh[1] + U(hyy)];
    line([sh, el, hd]);
    parts.push(<circle key={k()} cx={hd[0]} cy={hd[1]} r={U(13)} fill={INK} />);
    if (hold && idx === holdHand) {
      const [hX, hY] = hd;
      if (hold === "phone") {
        parts.push(<rect key={k()} x={hX - U(20)} y={hY - U(44)} width={U(40)} height={U(70)} rx={U(8)} fill="#1c1c26" stroke="#9a9aae" strokeWidth={U(3)} />);
        parts.push(<rect key={k()} x={hX - U(14)} y={hY - U(36)} width={U(28)} height={U(52)} rx={U(3)} fill="#8fd0ff" />);
      } else if (hold === "cup") {
        parts.push(<path key={k()} d={`M ${hX - U(20)} ${hY - U(50)} L ${hX + U(20)} ${hY - U(50)} L ${hX + U(15)} ${hY} L ${hX - U(15)} ${hY} Z`} fill="#fffdf6" stroke={INK} strokeWidth={U(4)} />);
        parts.push(<rect key={k()} x={hX - U(19)} y={hY - U(36)} width={U(37)} height={U(14)} fill="#8a5a3a" />);
      } else if (hold === "can") {
        parts.push(<path key={k()} d={`M ${hX - U(10)} ${hY - U(40)} h ${U(60)} v ${U(46)} h ${-U(60)} Z M ${hX + U(50)} ${hY - U(30)} l ${U(50)} ${U(-20)}`} fill="#6bb2c9" stroke={INK} strokeWidth={U(4)} />);
      } else if (hold === "mic") {
        parts.push(<rect key={k()} x={hX - U(7)} y={hY - U(40)} width={U(14)} height={U(40)} rx={U(5)} fill="#333" />);
        parts.push(<circle key={k()} cx={hX} cy={hY - U(46)} r={U(14)} fill="#555" stroke={INK} strokeWidth={U(3)} />);
      } else if (hold === "paper") {
        parts.push(<rect key={k()} x={hX - U(30)} y={hY - U(60)} width={U(60)} height={U(78)} rx={U(4)} fill="#fbfbf3" stroke={INK} strokeWidth={U(4)} />);
      }
    }
  });

  // ---- head
  const hc = hair === "grayBun" ? "#d8d8dc" : hair === "long" ? "#3d2a20" : "#141419";
  if (hair === "long") parts.push(<rect key={k()} x={hx - U(92)} y={hy - U(84)} width={U(184)} height={U(210)} rx={U(84)} fill={hc} stroke={INK} strokeWidth={U(4)} />);
  if (hair === "pigtails") {
    for (const s of [-1, 1]) {
      parts.push(<circle key={k()} cx={hx + s * U(92)} cy={hy - U(28)} r={U(30)} fill={INK} />);
      parts.push(<circle key={k()} cx={hx + s * U(70)} cy={hy - U(56)} r={U(13)} fill="#ff6fa3" stroke={INK} strokeWidth={U(3)} />);
    }
  }
  parts.push(<circle key={k()} cx={hx} cy={hy} r={hr} fill={INK} />);
  parts.push(<path key={k()} d={`M ${hx - hr * 0.62} ${hy - hr * 0.55} A ${hr * 0.85} ${hr * 0.85} 0 0 1 ${hx + hr * 0.1} ${hy - hr * 0.86}`} fill="none" stroke="#3a3a46" strokeWidth={U(7)} strokeLinecap="round" />);
  if (hair === "alex") {
    const tufts = [[-50, -58], [-18, -76], [16, -78], [48, -62]];
    for (const [ox, oy] of tufts) {
      parts.push(<polygon key={k()} points={`${hx + U(ox - 22)},${hy + U(oy + 28)} ${hx + U(ox + 6)},${hy + U(oy - 22)} ${hx + U(ox + 24)},${hy + U(oy + 24)}`} fill={INK} />);
    }
  } else if (hair === "slick") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(3)} ${hy - U(6)} Q ${hx - hr} ${hy - hr - U(18)} ${hx + U(10)} ${hy - hr - U(14)} Q ${hx + hr + U(10)} ${hy - hr} ${hx + hr + U(3)} ${hy - U(10)} Q ${hx + U(20)} ${hy - U(64)} ${hx - hr - U(3)} ${hy - U(6)} Z`} fill="#2c2c33" />);
    parts.push(<path key={k()} d={`M ${hx - U(30)} ${hy - hr - U(8)} Q ${hx + U(20)} ${hy - hr - U(2)} ${hx + U(60)} ${hy - U(58)}`} fill="none" stroke="#5a5a66" strokeWidth={U(5)} strokeLinecap="round" />);
  } else if (hair === "grayBun" || hair === "bun") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(4)} ${hy - U(10)} A ${hr + U(4)} ${hr + U(6)} 0 0 1 ${hx + hr + U(4)} ${hy - U(10)} Q ${hx} ${hy - U(50)} ${hx - hr - U(4)} ${hy - U(10)} Z`} fill={hc} stroke={INK} strokeWidth={U(4)} />);
    parts.push(<circle key={k()} cx={hx} cy={hy - hr - U(24)} r={U(32)} fill={hc} stroke={INK} strokeWidth={U(4)} />);
  } else if (hair === "cap") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(4)} ${hy - U(18)} A ${hr + U(4)} ${hr + U(6)} 0 0 1 ${hx + hr + U(4)} ${hy - U(18)} Z`} fill={accent ?? "#d8433a"} stroke={INK} strokeWidth={U(4)} />);
    parts.push(<rect key={k()} x={facing > 0 ? hx : hx - U(140)} y={hy - U(30)} width={U(140)} height={U(18)} rx={U(8)} fill={shade(accent ?? "#d8433a", 0.8)} stroke={INK} strokeWidth={U(3)} />);
  } else if (hair === "curly") {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.05 + (i / 6) * 0.9);
      parts.push(<circle key={k()} cx={hx + Math.cos(a) * hr * 0.92} cy={hy + Math.sin(a) * hr * 0.92} r={U(26)} fill={INK} />);
    }
  } else if (hair === "long") {
    parts.push(<path key={k()} d={`M ${hx - hr - U(6)} ${hy + hr * 0.2} A ${hr + U(6)} ${hr + U(8)} 0 0 1 ${hx + hr + U(6)} ${hy + hr * 0.2} L ${hx + hr} ${hy - U(18)} Q ${hx} ${hy - U(50)} ${hx - hr} ${hy - U(18)} Z`} fill={hc} />);
  } else if (hair === "short") {
    parts.push(<path key={k()} d={`M ${hx - hr + U(4)} ${hy - U(30)} Q ${hx} ${hy - hr - U(30)} ${hx + hr - U(4)} ${hy - U(30)}`} fill="none" stroke={INK} strokeWidth={U(14)} />);
  }

  // ---- face
  const blinkPhase = (t + seed * 1.37) % 3.6;
  const blinking = blinkPhase < 0.12 && !["shock", "sleep"].includes(expr);
  const lx = look * U(16);
  const ly = lookY * U(6);
  const eyeR: [number, number] = expr === "shock" ? [U(27), U(32)] : expr === "suspicious" ? [U(24), U(15)] : [U(23), U(27)];
  for (const s of [-1, 1]) {
    const ex = hx + s * U(32) + lx;
    const ey = hy - U(4) + ly;
    if (expr === "sleep") {
      parts.push(<path key={k()} d={`M ${ex - U(18)} ${ey} Q ${ex} ${ey + U(10)} ${ex + U(18)} ${ey}`} fill="none" stroke={EYE} strokeWidth={U(5)} strokeLinecap="round" />);
    } else if (blinking) {
      parts.push(<line key={k()} x1={ex - U(20)} y1={ey} x2={ex + U(20)} y2={ey} stroke={EYE} strokeWidth={U(5)} strokeLinecap="round" />);
    } else if (expr === "laugh") {
      parts.push(<path key={k()} d={`M ${ex - U(18)} ${ey + U(4)} Q ${ex} ${ey - U(16)} ${ex + U(18)} ${ey + U(4)}`} fill="none" stroke={EYE} strokeWidth={U(6)} strokeLinecap="round" />);
    } else {
      parts.push(<ellipse key={k()} cx={ex} cy={ey} rx={eyeR[0]} ry={eyeR[1]} fill={EYE} />);
      const pr = expr === "shock" ? U(8) : U(11);
      const px = ex + look * U(9);
      const py = ey + lookY * U(11);
      parts.push(<circle key={k()} cx={px} cy={py} r={pr} fill={INK} />);
      parts.push(<circle key={k()} cx={px + U(4)} cy={py - U(4)} r={U(3.2)} fill="#fff" />);
      if (["smug", "proud", "warm"].includes(expr)) {
        parts.push(<rect key={k()} x={ex - eyeR[0] - 2} y={ey - eyeR[1] - 2} width={eyeR[0] * 2 + 4} height={eyeR[1] * 0.75} fill={INK} />);
      }
    }
    // brows
    const by = hy - U(48) + ly * 0.5;
    const inner = ex - s * U(18);
    const outer = ex + s * U(18);
    let a = by;
    let b = by;
    if (expr === "shock") { a = by - U(16); b = by - U(16); }
    else if (expr === "worried" || expr === "sad" || expr === "awkward") { a = by - U(12); b = by + U(4); }
    else if (expr === "angry" || expr === "suspicious") { a = by + U(10); b = by - U(6); }
    else if (expr === "confused") { a = s === 1 ? by - U(16) : by + U(4); b = s === 1 ? by - U(10) : by + U(2); }
    else if (expr === "smug") { a = s === 1 ? by - U(12) : by; b = a; }
    else if (expr === "thinking") { a = s === 1 ? by - U(10) : by + U(6); b = s === 1 ? by - U(14) : by + U(2); }
    else if (["happy", "laugh", "proud", "warm"].includes(expr)) { a = by - U(6); b = by - U(4); }
    parts.push(<line key={k()} x1={inner + lx * 0.6} y1={a} x2={outer + lx * 0.6} y2={b} stroke={BROW} strokeWidth={U(8)} strokeLinecap="round" />);
  }
  if (glasses) {
    for (const s of [-1, 1]) parts.push(<circle key={k()} cx={hx + s * U(32) + lx} cy={hy - U(4) + ly} r={U(31)} fill="none" stroke="#c9c9d2" strokeWidth={U(5)} />);
    parts.push(<line key={k()} x1={hx - U(2) + lx} y1={hy - U(6) + ly} x2={hx + U(2) + lx} y2={hy - U(6) + ly} stroke="#c9c9d2" strokeWidth={U(5)} />);
  }
  if (mustache) {
    parts.push(<path key={k()} d={`M ${hx - U(34) + lx} ${hy + U(36)} Q ${hx + lx} ${hy + U(18)} ${hx + U(34) + lx} ${hy + U(36)} Q ${hx + lx} ${hy + U(30)} ${hx - U(34) + lx} ${hy + U(36)} Z`} fill="#eaeaea" />);
  }
  const mx = hx + lx * 0.7;
  const my = hy + U(44) + ly * 0.5;
  const mc = "#f3f3f3";
  if (talk) {
    const o = U(6 + 16 * Math.abs(Math.sin(t * 13 + seed) * Math.sin(t * 5.3 + seed)));
    parts.push(<ellipse key={k()} cx={mx} cy={my} rx={U(15)} ry={o / 2 + U(2)} fill="#8f2436" stroke={mc} strokeWidth={U(3)} />);
  } else if (expr === "shock") {
    parts.push(<ellipse key={k()} cx={mx} cy={my + U(2)} rx={U(13)} ry={U(16)} fill={mc} />);
    parts.push(<ellipse key={k()} cx={mx} cy={my + U(3)} rx={U(8)} ry={U(10)} fill="#8f2436" />);
  } else if (expr === "laugh") {
    parts.push(<path key={k()} d={`M ${mx - U(26)} ${my - U(4)} A ${U(26)} ${U(24)} 0 0 0 ${mx + U(26)} ${my - U(4)} Z`} fill={mc} />);
  } else if (["happy", "proud", "warm"].includes(expr)) {
    parts.push(<path key={k()} d={`M ${mx - U(22)} ${my - U(6)} Q ${mx} ${my + U(16)} ${mx + U(22)} ${my - U(6)}`} fill="none" stroke={mc} strokeWidth={U(6)} strokeLinecap="round" />);
  } else if (expr === "smug") {
    parts.push(<path key={k()} d={`M ${mx - U(18)} ${my} Q ${mx + U(6)} ${my + U(10)} ${mx + U(26)} ${my - U(10)}`} fill="none" stroke={mc} strokeWidth={U(6)} strokeLinecap="round" />);
  } else if (["worried", "sad", "awkward"].includes(expr)) {
    parts.push(<path key={k()} d={`M ${mx - U(16)} ${my + U(10)} Q ${mx} ${my - U(4)} ${mx + U(16)} ${my + U(10)}`} fill="none" stroke={mc} strokeWidth={U(6)} strokeLinecap="round" />);
  } else if (expr === "angry") {
    parts.push(<rect key={k()} x={mx - U(20)} y={my - U(4)} width={U(40)} height={U(13)} rx={U(4)} fill={mc} />);
  } else if (expr === "confused" || expr === "thinking") {
    parts.push(<path key={k()} d={`M ${mx - U(16)} ${my + U(4)} L ${mx - U(4)} ${my} L ${mx + U(8)} ${my + U(5)} L ${mx + U(18)} ${my}`} fill="none" stroke={mc} strokeWidth={U(5)} strokeLinecap="round" strokeLinejoin="round" />);
  } else if (expr === "sleep") {
    parts.push(<ellipse key={k()} cx={mx} cy={my + U(2)} rx={U(8)} ry={U(6)} fill={mc} />);
  } else if (expr === "suspicious") {
    parts.push(<line key={k()} x1={mx - U(16)} y1={my + U(6)} x2={mx + U(14)} y2={my + U(2)} stroke={mc} strokeWidth={U(6)} strokeLinecap="round" />);
  } else {
    parts.push(<line key={k()} x1={mx - U(14)} y1={my + U(4)} x2={mx + U(14)} y2={my + U(4)} stroke={mc} strokeWidth={U(6)} strokeLinecap="round" />);
  }
  if (expr === "worried" || expr === "awkward") {
    const sx = hx + U(86);
    const sy = hy - U(34);
    parts.push(<path key={k()} d={`M ${sx} ${sy - U(14)} L ${sx + U(9)} ${sy + U(8)} A ${U(10)} ${U(10)} 0 1 1 ${sx - U(9)} ${sy + U(8)} Z`} fill="#8cc8ff" />);
  }
  if (blush > 0) for (const s of [-1, 1]) parts.push(<ellipse key={k()} cx={hx + s * U(54)} cy={hy + U(28)} rx={U(20)} ry={U(10)} fill="#ff7a96" opacity={0.55 * blush} />);

  const tiltRot = lean * facing;
  return (
    <g>
      {shadow ? <ellipse cx={x} cy={yf + U(2)} rx={U(sit ? 120 : 92)} ry={U(16)} fill="#000" opacity={0.16} /> : null}
      <g transform={`rotate(${tiltRot} ${x} ${yf})`}>{parts}</g>
    </g>
  );
};

/** Glowing lie counter above a head. steps = [[time, value], ...] (value only ever goes up). */
export const LieCounter: React.FC<{
  x: number; y: number; t: number; steps: [number, number][]; t0?: number; u?: number; tone?: "white" | "red" | "green"; opacity?: number;
}> = ({ x, y, t, steps, t0 = -10, u = 1, tone = "white", opacity = 1 }) => {
  if (t < t0) return null;
  let v = steps[0][1];
  let lastChange = -10;
  for (const [ts, val] of steps) {
    if (t >= ts) {
      if (val !== v) lastChange = ts;
      v = val;
    }
  }
  const appear = interpolate(t, [t0, t0 + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  const bump = interpolate(t - lastChange, [0, 0.12, 0.45], [1, 1.32, 1], clamp);
  const flash = interpolate(t - lastChange, [0, 0.5], [0.9, 0], clamp);
  const txt = String(v);
  const w = (60 + txt.length * 44) * u;
  const h = 92 * u;
  const fg = tone === "red" ? "#ff4d5e" : tone === "green" ? "#3dff8b" : "#ffffff";
  const glowC = tone === "red" ? "#ff2840" : tone === "green" ? "#1fe07a" : "#bfe4ff";
  const float = Math.sin(t * 2.2 + x * 0.01) * 6 * u;
  const yy = y + float;
  return (
    <g opacity={opacity} transform={`translate(${x} ${yy}) scale(${appear * bump}) translate(${-x} ${-yy})`}>
      <rect x={x - w / 2 - 14 * u} y={yy - h / 2 - 14 * u} width={w + 28 * u} height={h + 28 * u} rx={(h + 28 * u) / 2} fill={glowC} opacity={0.18 + flash * 0.4} filter="url(#soft)" />
      <rect x={x - w / 2} y={yy - h / 2} width={w} height={h} rx={h / 2} fill="rgba(16,16,26,0.9)" stroke={fg} strokeWidth={4 * u} />
      <text x={x} y={yy + 3 * u} fontFamily="Inter" fontWeight={900} fontSize={62 * u} fill={fg} textAnchor="middle" dominantBaseline="central" filter="url(#glow)">
        {txt}
      </text>
    </g>
  );
};
