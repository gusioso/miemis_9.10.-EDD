import { hook } from "./s1_hook";
import { morning } from "./s2_morning";
import { spend } from "./s3_spend";
import { problem } from "./s4_problem";
import { week1 } from "./s5_week1";
import { work } from "./s6_work";
import { prices } from "./s7_prices";
import type { SceneFn } from "./types";

export const SCENES: Record<string, SceneFn> = { hook, morning, spend, problem, week1, work, prices };
