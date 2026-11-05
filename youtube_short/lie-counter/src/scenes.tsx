import { alex, day1, hook, perfect, publicScene, week1, SceneFn } from "./scenesA";
import { baker, ending, loophole, month3, twist, tv } from "./scenesB";

export const SCENES: Record<string, SceneFn> = {
  hook, day1, alex, public: publicScene, week1, perfect, tv, loophole, month3, baker, twist, ending,
};
