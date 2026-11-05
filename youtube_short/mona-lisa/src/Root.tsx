import { Composition, Still } from "remotion";
import { Thumb } from "./Thumb";
import { MonaLisa } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="Thumb" component={Thumb} width={1280} height={720} />
    <Composition id="MonaLisa" component={MonaLisa} durationInFrames={timeline.durationInFrames} fps={30} width={1080} height={1920} />
  </>
);
