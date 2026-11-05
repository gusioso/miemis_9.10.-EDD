import { hook, second, shift, stranger, testing, wrong } from "./scenesA";
import { camera, dont, midnight, realize, reveal } from "./scenesB";
import type { SceneFn } from "./types";

export const SCENES: Record<string, SceneFn> = { hook, shift, stranger, wrong, second, testing, camera, realize, dont, midnight, reveal };
