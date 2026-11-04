import { bank, cafe, hook, store, street } from "./scenesA";
import { board, final, hard, online } from "./scenesB";
import type { SceneFn } from "./types";

export const SCENES: Record<string, SceneFn> = { hook, cafe, bank, store, street, board, hard, online, final };
