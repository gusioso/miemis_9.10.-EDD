import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { StreetScene } from "./three/street";
import { DomeScene, LabScene, LightScene, RoofScene, SkyScene, SpaceScene, VoidScene } from "./three/other";
import timeline from "./timeline.json";

// The whole video: the three.js scenes (src/three), the narration captions in a calm serif italic,
// and a small counter at the top left, in the spirit of the reference video (no copied branding).
loadFont({ family: "Garamond", url: staticFile("fonts/EBGaramond-Italic.ttf"), style: "italic", weight: "400 800" });
loadFont({ family: "Inter", url: staticFile("fonts/Inter-SemiBold.otf"), weight: "600" });
loadFont({ family: "Inter", url: staticFile("fonts/Inter-ExtraBold.otf"), weight: "800" });

const E = timeline.ev;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const shotAt = (t: number) => timeline.shots.find((s) => t >= s.start && t < s.end)?.id ?? "sky";

const counter = (t: number) => {
  const sh = shotAt(t);
  const zero = t >= E.gone && t < E.back;
  let sub = "TUESDAY · 9:41 AM";
  if (zero) sub = "FOR FIVE SECONDS";
  else if (sh === "back") sub = t < E.normal ? "TUESDAY · 9:41:05 AM" : "TUESDAY · 9:44 AM";
  else if (sh === "space") sub = "THE MISSING SUNLIGHT";
  else if (sh === "dark") sub = t < E.arrives - 0.3 ? "TUESDAY · 9:49 AM" : "TUESDAY · 9:49:20 AM";
  else if (sh === "phones") sub = "TUESDAY · 9:50 AM";
  else if (sh === "lab") sub = "TUESDAY · 10:30 AM";
  else if (sh === "dome") sub = "TUESDAY · 11:58 PM";
  else if (sh === "roof") sub = "YEAR 4";
  else if (sh === "sky") sub = t < E.somewhere ? "THE NEXT 1,000,000 YEARS" : "YEAR 40 · 40 LIGHT-YEARS AWAY";
  return { value: zero ? "0" : "10", sup: zero ? "" : "80", sub, flash: Math.max(0, 1 - Math.abs(t - E.gone) / 0.4, 1 - Math.abs(t - E.back) / 0.4) };
};

// small info labels for the science beats
const LABELS: { t0: number; t1: number; text: string; top: number }[] = [
  { t0: E.hole - 0.3, t1: timeline.shots.find((s) => s.id === "space")!.end - 0.2, text: "150 MILLION KM  ·  LIGHT TAKES 8 MIN 20 S", top: 1010 },
  { t0: E.dark, t1: E.darkEnd, text: "", top: 0 },
  { t0: E.behind - 0.2, t1: timeline.shots.find((s) => s.id === "lab")!.end - 0.1, text: "EVERY CLOCK ON EARTH: 5 SECONDS BEHIND", top: 1420 },
  { t0: E.closest + 0.3, t1: timeline.shots.find((s) => s.id === "dome")!.end - 0.1, text: "ALPHA CENTAURI  ·  4.4 LIGHT-YEARS", top: 760 },
];

const Caption: React.FC<{ t: number }> = ({ t }) => {
  for (const l of timeline.lines) {
    for (const c of l.caps) {
      if (t >= c.start - 0.05 && t < c.end) {
        const op = interpolate(t, [c.start - 0.05, c.start + 0.2, c.end - 0.15, c.end], [0, 1, 1, 0], clamp);
        const y = interpolate(t, [c.start - 0.05, c.start + 0.3], [10, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div style={{ position: "absolute", left: 90, right: 90, top: 1180, display: "flex", justifyContent: "center", opacity: op, transform: `translateY(${y}px)` }}>
            <div style={{
              fontFamily: "Garamond", fontStyle: "italic", fontWeight: 500, fontSize: 64, lineHeight: 1.18, color: "#fffdf8", textAlign: "center",
              textShadow: "0 2px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)",
            }}>{c.text}</div>
          </div>
        );
      }
    }
  }
  return null;
};

const Shot: React.FC<{ t: number }> = ({ t }) => {
  const id = shotAt(t);
  if (id === "street" || id === "vanish" || id === "back" || id === "dark" || id === "phones") return <StreetScene t={t} which={id} />;
  if (id === "void") return <VoidScene t={t} />;
  if (id === "light") return <LightScene t={t} />;
  if (id === "space") return <SpaceScene t={t} />;
  if (id === "lab") return <LabScene t={t} />;
  if (id === "dome") return <DomeScene t={t} />;
  if (id === "roof") return <RoofScene t={t} />;
  return <SkyScene t={t} />;
};

export const AtomsShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = counter(t);
  const fadeIn = interpolate(t, [0, 0.5], [0, 1], clamp);
  const fadeOut = interpolate(t, [timeline.total - 1.5, timeline.total], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, opacity: fadeIn * fadeOut }}>
        <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 50, near: 0.05, far: 3000, position: [0, 2, 10] }}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, antialias: true }}>
          <Shot t={t} />
        </ThreeCanvas>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.25) 100%)" }} />
      {/* counter, top left */}
      <div style={{ position: "absolute", left: 64, top: 190, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.5)", opacity: fadeOut }}>
        <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 24, letterSpacing: 3 }}>ATOMS IN THE UNIVERSE</div>
        <div style={{ fontFamily: "Garamond", fontStyle: "italic", fontWeight: 600, fontSize: 92, lineHeight: 1.05, color: c.flash > 0 ? `rgba(255,${Math.round(255 - 60 * c.flash)},${Math.round(255 - 160 * c.flash)},1)` : "#fff" }}>
          {c.value}{c.sup ? <span style={{ fontSize: 48, verticalAlign: "super", marginLeft: 4 }}>{c.sup}</span> : null}
        </div>
        <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 21, letterSpacing: 2.5, opacity: 0.85 }}>{c.sub}</div>
      </div>
      {LABELS.filter((l) => l.text && t >= l.t0 && t < l.t1).map((l, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: l.top, display: "flex", justifyContent: "center", opacity: interpolate(t, [l.t0, l.t0 + 0.4, l.t1 - 0.3, l.t1], [0, 1, 1, 0], clamp) }}>
          <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 26, letterSpacing: 3, color: "#fff", background: "rgba(10,12,20,0.55)", padding: "10px 22px", borderRadius: 10 }}>{l.text}</div>
        </div>
      ))}
      <Caption t={t} />
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
