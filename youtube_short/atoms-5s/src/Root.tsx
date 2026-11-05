import { Composition } from "remotion";
import { AtomsShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition id="AtomsShort" component={AtomsShort} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
);
