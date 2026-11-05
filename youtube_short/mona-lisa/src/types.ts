import type React from "react";

export type Word = { w: string; s: number; e: number };
export type SceneData = { id: string; dur: number; L: number[]; Le: number[]; words: Word[][] };
export type SceneFn = (p: { S: SceneData; t: number }) => React.ReactNode;

/** Scene-relative time of the nth word in line li matching re (start, or end with end=true). */
export const wt = (S: SceneData, li: number, re: RegExp, end = false, nth = 0) => {
  const hits = S.words[li].filter((w) => re.test(w.w));
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`no word ${re} in ${S.id} line ${li}`);
  return end ? w.e : w.s;
};
