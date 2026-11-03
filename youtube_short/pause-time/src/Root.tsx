import { Composition, Still } from "remotion";
import { Thumb } from "./Thumb";
import { PauseShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Still id="Thumb" component={Thumb} width={1280} height={720} />
    <Composition
      id="PauseShort"
      component={PauseShort}
      durationInFrames={timeline.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
    />
    </>
  );
};
