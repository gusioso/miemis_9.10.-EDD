import { Composition, Still } from "remotion";
import { Cover, Thumb } from "./Thumb";
import { LieCounterShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Still id="Thumb" component={Thumb} width={1280} height={720} />
    <Still id="Cover" component={Cover} width={1080} height={1920} />
    <Composition
      id="LieCounterShort"
      component={LieCounterShort}
      durationInFrames={timeline.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
    />
    </>
  );
};
