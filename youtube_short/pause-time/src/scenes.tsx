import { hook } from "./s1_hook";
import { morning } from "./s2_morning";
import { spend } from "./s3_spend";
import type { SceneFn } from "./types";

export const SCENES: Record<string, SceneFn> = { hook, morning, spend };
