import { Composition } from "remotion";
import { MoonShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition id="MoonShort" component={MoonShort} durationInFrames={timeline.durationInFrames} fps={30} width={1080} height={1920} />
);
