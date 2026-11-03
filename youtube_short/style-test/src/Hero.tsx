import React from "react";

// Detailed 2D cartoon hero (style test). Chibi-ish proportions (big head, big shiny eyes), cel shading,
// warm dark-brown outlines, soft rim light. Local units: origin at the feet, y up is negative, ~1000 tall.
export const LINE = "#2a1c24";

export type Face = "smile" | "grin" | "surprised" | "laugh" | "soft";
export type HeroProps = {
  x: number;
  yf: number;
  t: number;
  u?: number;
  facing?: 1 | -1;
  walk?: number | null; // walk phase (radians), null = standing
  look?: number; // -1..1 eye direction
  lookY?: number;
  face?: Face;
  turn?: number; // 0 = 3/4 front, 1 = head turned back over the shoulder
  armL?: "swing" | "pocket" | "wave" | "up";
  armR?: "swing" | "pocket" | "wave" | "up";
  blink?: boolean;
  rim?: string; // rim light colour (moonlight)
  skin?: string;
  hoodie?: string;
  hair?: string;
};

const shadeHex = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

/** Outlined thick limb: dark stroke under a coloured stroke. */
const Limb: React.FC<{ pts: [number, number][]; w: number; col: string }> = ({ pts, w, col }) => {
  const d = pts.map((p) => p.join(",")).join(" ");
  return (
    <g>
      <polyline points={d} fill="none" stroke={LINE} strokeWidth={w + 12} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

export const Hero: React.FC<HeroProps> = ({
  x, yf, t, u = 1, facing = 1, walk = null, look = 0.2, lookY = 0, face = "smile", turn = 0, armL = "swing", armR = "swing",
  blink, rim = "#bfe3ff", skin = "#f6c7a1", hoodie = "#ff7a3d", hair = "#4a2c1d",
}) => {
  const id = `h${Math.round(x)}${Math.round(yf)}`;
  const ph = walk ?? 0;
  const walking = walk !== null;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 16 : Math.sin(t * 2.2) * 4;
  const skinS = shadeHex(skin, 0.86);
  const hoodS = shadeHex(hoodie, 0.78);
  const hoodL = shadeHex(hoodie, 1.12);
  const hairL = shadeHex(hair, 1.6);
  const pants = "#2e3a5c";
  const blinkNow = blink ?? ((t + 0.7) % 3.4 < 0.12);

  // legs
  const leg = (s: number) => {
    const a = walking ? Math.sin(ph + (s > 0 ? 0 : Math.PI)) * 0.42 : 0;
    const hip: [number, number] = [s * 38, -330 + bob];
    const kneeBend = walking ? Math.max(0, Math.sin(ph + (s > 0 ? 0 : Math.PI) + 1.2)) * 40 : 0;
    const knee: [number, number] = [hip[0] + Math.sin(a) * 160 + kneeBend * 0.6, hip[1] + Math.cos(a) * 160];
    const foot: [number, number] = [hip[0] + Math.sin(a) * 300, Math.min(-20, hip[1] + Math.cos(a) * 310 - kneeBend * 0.4)];
    return { hip, knee, foot };
  };
  const legs = [leg(-1), leg(1)];

  // arms (shoulder at +-108, -585)
  const arm = (s: number, mode: string) => {
    const sh: [number, number] = [s * 108, -585 + bob];
    if (mode === "pocket") return { sh, el: [s * 128, -470 + bob] as [number, number], hd: [s * 58, -400 + bob] as [number, number], hand: false };
    if (mode === "wave") {
      const w = Math.sin(t * 10) * 18;
      return { sh, el: [s * 190, -620 + bob] as [number, number], hd: [s * 210 + w, -760 + bob] as [number, number], hand: true };
    }
    if (mode === "up") return { sh, el: [s * 170, -700 + bob] as [number, number], hd: [s * 150, -850 + bob] as [number, number], hand: true };
    const a = walking ? -Math.sin(ph + (s > 0 ? 0 : Math.PI)) * 0.5 : 0.12;
    const el: [number, number] = [sh[0] + s * 18 + Math.sin(a) * 120, sh[1] + Math.cos(a) * 125];
    const hd: [number, number] = [el[0] + Math.sin(a * 1.4) * 125, el[1] + Math.cos(a * 1.4) * 115];
    return { sh, el, hd, hand: true };
  };
  const arms = [arm(-1, armL), arm(1, armR)];

  const hx = turn * -14;
  const hy = -790 + bob;
  const lx = look * 10 * (1 - turn * 0.6);
  const ly = lookY * 8;
  // eye openness / brows / mouth per face
  const eyeH = blinkNow ? 3 : face === "surprised" ? 44 : face === "laugh" ? 6 : face === "soft" ? 30 : 39;
  const browY = face === "surprised" ? -58 : face === "soft" ? -46 : -50;
  const browTilt = face === "surprised" ? -6 : face === "laugh" ? -3 : 3;

  const eye = (s: number) => {
    const ex = hx + s * 50 + turn * -18;
    const ey = hy + 8;
    const sx = s > 0 ? 1 - turn * 0.35 : 1;
    if (face === "laugh" && !blinkNow) {
      return <path key={s} d={`M ${ex - 26} ${ey + 6} Q ${ex} ${ey - 22} ${ex + 26} ${ey + 6}`} fill="none" stroke={LINE} strokeWidth={9} strokeLinecap="round" />;
    }
    return (
      <g key={s} transform={`translate(${ex} ${ey}) scale(${sx} 1) translate(${-ex} ${-ey})`}>
        <ellipse cx={ex} cy={ey} rx={31} ry={eyeH} fill="#ffffff" stroke={LINE} strokeWidth={5} />
        {eyeH > 8 ? (
          <g clipPath={`url(#${id}-eye${s})`}>
            <circle cx={ex + lx} cy={ey + 4 + ly} r={24} fill={`url(#${id}-iris)`} />
            <circle cx={ex + lx} cy={ey + 4 + ly} r={12} fill="#1a1020" />
            <circle cx={ex + lx - 8} cy={ey - 5 + ly} r={8} fill="#ffffff" />
            <circle cx={ex + lx + 8} cy={ey + 12 + ly} r={3.6} fill="#ffffff" opacity={0.9} />
            <path d={`M ${ex - 31} ${ey - eyeH * 0.55} Q ${ex} ${ey - eyeH - 6} ${ex + 31} ${ey - eyeH * 0.55}`} fill={skinS} opacity={0.25} />
          </g>
        ) : null}
        <defs>
          <clipPath id={`${id}-eye${s}`}><ellipse cx={ex} cy={ey} rx={29} ry={Math.max(1, eyeH - 2)} /></clipPath>
        </defs>
        {/* upper lash line with a little flick */}
        <path d={`M ${ex - 33} ${ey - eyeH * 0.35} Q ${ex} ${ey - eyeH - 9} ${ex + 33} ${ey - eyeH * 0.35} L ${ex + s * 40} ${ey - eyeH * 0.6}`}
          fill="none" stroke={LINE} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };

  const mouth = () => {
    const mx = hx + lx * 0.6 + turn * -20;
    const my = hy + 78;
    if (face === "surprised") return <ellipse cx={mx} cy={my + 4} rx={15} ry={19} fill="#7a2232" stroke={LINE} strokeWidth={5} />;
    if (face === "laugh" || face === "grin") {
      return (
        <g>
          <path d={`M ${mx - 34} ${my - 6} Q ${mx} ${my - 2} ${mx + 34} ${my - 6} Q ${mx + 28} ${my + 40} ${mx} ${my + 42} Q ${mx - 28} ${my + 40} ${mx - 34} ${my - 6} Z`}
            fill="#7a2232" stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${mx - 28} ${my - 4} Q ${mx} ${my} ${mx + 28} ${my - 4} L ${mx + 24} ${my + 8} Q ${mx} ${my + 11} ${mx - 24} ${my + 8} Z`} fill="#ffffff" />
          <ellipse cx={mx + 4} cy={my + 30} rx={16} ry={9} fill="#e0566c" />
        </g>
      );
    }
    return <path d={`M ${mx - 24} ${my} Q ${mx} ${my + (face === "soft" ? 14 : 22)} ${mx + 24} ${my}`} fill="none" stroke={LINE} strokeWidth={7} strokeLinecap="round" />;
  };

  return (
    <g transform={`translate(${x} ${yf}) scale(${facing * u} ${u})`}>
      <defs>
        <linearGradient id={`${id}-hood`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hoodL} />
          <stop offset="0.55" stopColor={hoodie} />
          <stop offset="1" stopColor={hoodS} />
        </linearGradient>
        <radialGradient id={`${id}-skin`} cx="0.38" cy="0.35" r="0.8">
          <stop offset="0" stopColor={shadeHex(skin, 1.05)} />
          <stop offset="0.7" stopColor={skin} />
          <stop offset="1" stopColor={skinS} />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#7fd6ff" />
          <stop offset="0.6" stopColor="#2f78c8" />
          <stop offset="1" stopColor="#173a7a" />
        </radialGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={hairL} />
          <stop offset="0.5" stopColor={hair} />
          <stop offset="1" stopColor={shadeHex(hair, 0.7)} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={4} rx={170} ry={26} fill="#000" opacity={0.28} />
      {/* back arm */}
      {(() => {
        const a = arms[0];
        return (
          <g>
            <Limb pts={[a.sh, a.el, a.hd]} w={52} col={hoodS} />
            {a.hand ? <circle cx={a.hd[0]} cy={a.hd[1]} r={28} fill={skinS} stroke={LINE} strokeWidth={6} /> : null}
          </g>
        );
      })()}
      {/* legs: jeans + sneakers */}
      {legs.map((l, i) => (
        <g key={i}>
          <Limb pts={[l.hip, l.knee, l.foot]} w={58} col={i === 0 ? shadeHex(pants, 0.82) : pants} />
          <g transform={`translate(${l.foot[0]} ${l.foot[1] + 8})`}>
            <path d="M -34 -22 Q -30 -44 4 -44 Q 34 -42 52 -20 Q 70 -8 66 6 L -38 6 Q -44 -6 -34 -22 Z" fill="#ffffff" stroke={LINE} strokeWidth={6} strokeLinejoin="round" />
            <path d="M -40 6 L 68 6 L 66 16 L -38 16 Z" fill="#e94b5a" stroke={LINE} strokeWidth={5} strokeLinejoin="round" />
            <path d="M -8 -40 L 8 -16 M 6 -42 L 22 -18" stroke="#c9d3e3" strokeWidth={5} strokeLinecap="round" />
          </g>
        </g>
      ))}
      {/* hood behind the neck */}
      <path d={`M -96 ${-640 + bob} Q 0 ${-700 + bob} 96 ${-640 + bob} Q 70 ${-590 + bob} 0 ${-585 + bob} Q -70 ${-590 + bob} -96 ${-640 + bob} Z`} fill={hoodS} stroke={LINE} strokeWidth={7} />
      {/* torso: hoodie with shading, pocket, strings */}
      <path d={`M -108 ${-610 + bob} Q -132 ${-460 + bob} -122 ${-330 + bob} Q -118 ${-300 + bob} -90 ${-298 + bob} L 90 ${-298 + bob} Q 118 ${-300 + bob} 122 ${-330 + bob} Q 132 ${-460 + bob} 108 ${-610 + bob} Q 0 ${-650 + bob} -108 ${-610 + bob} Z`}
        fill={`url(#${id}-hood)`} stroke={LINE} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M 40 ${-620 + bob} Q 120 ${-560 + bob} 116 ${-330 + bob} Q 112 ${-306 + bob} 90 ${-304 + bob} L 50 ${-304 + bob} Q 92 ${-430 + bob} 40 ${-620 + bob} Z`} fill={hoodS} opacity={0.55} />
      <rect x={-122} y={-346 + bob} width={244} height={44} rx={18} fill={hoodS} stroke={LINE} strokeWidth={6} />
      <path d={`M -70 ${-440 + bob} L 70 ${-440 + bob} L 88 ${-360 + bob} L -88 ${-360 + bob} Z`} fill={hoodS} stroke={LINE} strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
      {[-22, 22].map((s) => (
        <g key={s}>
          <path d={`M ${s} ${-602 + bob} q ${s * 0.15} 60 ${s * 0.1} 100`} fill="none" stroke="#fff4e8" strokeWidth={6} strokeLinecap="round" />
          <rect x={s + s * 0.1 - 5} y={-505 + bob} width={10} height={18} rx={4} fill="#c9d3e3" stroke={LINE} strokeWidth={3} />
        </g>
      ))}
      <path d={`M -80 ${-600 + bob} Q -100 ${-500 + bob} -96 ${-380 + bob}`} fill="none" stroke="#ffffff" strokeWidth={8} opacity={0.25} strokeLinecap="round" />
      {/* neck */}
      <rect x={-26} y={-668 + bob} width={52} height={50} rx={12} fill={skinS} stroke={LINE} strokeWidth={5} />
      {/* head */}
      <g>
        {/* back hair volume */}
        <path d={`M ${hx - 150} ${hy + 10} Q ${hx - 168} ${hy - 150} ${hx - 20} ${hy - 186} Q ${hx + 150} ${hy - 196} ${hx + 160} ${hy - 30} Q ${hx + 160} ${hy + 40} ${hx + 132} ${hy + 60} L ${hx - 132} ${hy + 60} Z`}
          fill={shadeHex(hair, 0.75)} stroke={LINE} strokeWidth={7} strokeLinejoin="round" />
        {/* ears */}
        {[-1, 1].map((s) => (
          <g key={s} opacity={s > 0 ? 1 - turn : 1}>
            <ellipse cx={hx + s * 132} cy={hy + 20} rx={24} ry={32} fill={skinS} stroke={LINE} strokeWidth={6} />
            <path d={`M ${hx + s * 128} ${hy + 6} q ${s * 10} 14 0 28`} fill="none" stroke={shade2(skin)} strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}
        {/* face */}
        <path d={`M ${hx - 132} ${hy - 30} Q ${hx - 134} ${hy - 150} ${hx} ${hy - 152} Q ${hx + 134} ${hy - 150} ${hx + 132} ${hy - 30} Q ${hx + 128} ${hy + 90} ${hx + 40} ${hy + 128} Q ${hx} ${hy + 142} ${hx - 40} ${hy + 128} Q ${hx - 128} ${hy + 90} ${hx - 132} ${hy - 30} Z`}
          fill={`url(#${id}-skin)`} stroke={LINE} strokeWidth={7} strokeLinejoin="round" />
        {/* rim light from the moon (behind, upper left in world) */}
        <path d={`M ${hx - 124} ${hy + 10} Q ${hx - 128} ${hy - 110} ${hx - 40} ${hy - 140}`} fill="none" stroke={rim} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
        {/* cheeks */}
        {[-1, 1].map((s) => <ellipse key={s} cx={hx + s * 78 + turn * -16} cy={hy + 62} rx={26} ry={15} fill="#ff8f9d" opacity={face === "laugh" || face === "grin" ? 0.55 : 0.35} />)}
        {eye(-1)}
        {eye(1)}
        {/* brows */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${hx + s * 26 + turn * -18} ${hy + browY + (s * browTilt) / 2 + 6} Q ${hx + s * 52 + turn * -18} ${hy + browY - 8} ${hx + s * 80 + turn * -18} ${hy + browY + 4 - (s * browTilt) / 2}`}
            fill="none" stroke={hair} strokeWidth={13} strokeLinecap="round" />
        ))}
        {/* nose */}
        <path d={`M ${hx + 4 + lx * 0.5 + turn * -24} ${hy + 40} q 12 8 0 16`} fill="none" stroke={skinS} strokeWidth={6} strokeLinecap="round" />
        {mouth()}
        {/* front hair: swept fringe with chunky locks and a highlight band */}
        <path d={`M ${hx - 140} ${hy - 30} Q ${hx - 150} ${hy - 170} ${hx - 10} ${hy - 182} Q ${hx + 150} ${hy - 190} ${hx + 146} ${hy - 40}
          Q ${hx + 120} ${hy - 96} ${hx + 84} ${hy - 104} Q ${hx + 90} ${hy - 70} ${hx + 70} ${hy - 50} Q ${hx + 50} ${hy - 100} ${hx + 6} ${hy - 112}
          Q ${hx + 16} ${hy - 70} ${hx - 10} ${hy - 44} Q ${hx - 30} ${hy - 96} ${hx - 70} ${hy - 104} Q ${hx - 70} ${hy - 60} ${hx - 100} ${hy - 40}
          Q ${hx - 112} ${hy - 80} ${hx - 120} ${hy - 76} Q ${hx - 130} ${hy - 50} ${hx - 140} ${hy - 30} Z`}
          fill={`url(#${id}-hair)`} stroke={LINE} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M ${hx - 92} ${hy - 150} Q ${hx - 20} ${hy - 176} ${hx + 60} ${hy - 160}`} fill="none" stroke={hairL} strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        <path d={`M ${hx - 60} ${hy - 168} Q ${hx - 70} ${hy - 214} ${hx - 20} ${hy - 220} Q ${hx - 34} ${hy - 196} ${hx - 26} ${hy - 176}`} fill={hair} stroke={LINE} strokeWidth={6} strokeLinejoin="round" />
      </g>
      {/* front arm */}
      {(() => {
        const a = arms[1];
        return (
          <g>
            <Limb pts={[a.sh, a.el, a.hd]} w={52} col={hoodie} />
            {a.hand ? <circle cx={a.hd[0]} cy={a.hd[1]} r={28} fill={skin} stroke={LINE} strokeWidth={6} /> : null}
          </g>
        );
      })()}
    </g>
  );
};

const shade2 = (hex: string) => shadeHex(hex, 0.75);
