import type React from "react";
import type { Pause } from "./freeze";

export type SceneData = { id: string; dur: number; ev: Record<string, number>; L: number[]; Le: number[]; pauses: Pause[] };
export type SceneFn = (p: { S: SceneData; t: number }) => React.ReactNode;
