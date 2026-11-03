// Render several stills with one bundle: node tools/stills.mjs 1.5 10 20 ...  (seconds)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "MillionaireShort", browserExecutable });
for (const s of process.argv.slice(2)) {
  const frame = Math.round(Number(s) * 30);
  const output = `out/still_${String(s).padStart(6, "0")}.png`;
  await renderStill({ serveUrl, composition, frame, output, browserExecutable });
  console.log("saved", output);
}
