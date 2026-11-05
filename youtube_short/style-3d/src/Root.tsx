import { Composition } from "remotion";
import { GravityShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition id="GravityShort" component={GravityShort} durationInFrames={timeline.durationInFrames} fps={30} width={1080} height={1920} />
);
