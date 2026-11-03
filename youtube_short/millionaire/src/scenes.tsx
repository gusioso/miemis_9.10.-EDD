import { morning, notify, problem, spend, week1, work, SceneFn } from "./scenesA";
import { bakery, discover, final, month1, prices } from "./scenesB";

export const SCENES: Record<string, SceneFn> = { notify, morning, spend, problem, week1, work, prices, month1, bakery, discover, final };
