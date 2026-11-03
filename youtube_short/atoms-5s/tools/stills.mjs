// Render test stills: node tools/stills.mjs 1.5 10 20 ...  (seconds)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "AtomsShort", browserExecutable, chromiumOptions });
for (const s of process.argv.slice(2)) {
  const frame = Math.round(Number(s) * composition.fps);
  const output = `out/t_${String(s).padStart(6, "0")}.png`;
  const t0 = Date.now();
  await renderStill({ serveUrl, composition, frame, output, browserExecutable, chromiumOptions, scale: 0.5 });
  console.log("saved", output, Date.now() - t0, "ms");
}
