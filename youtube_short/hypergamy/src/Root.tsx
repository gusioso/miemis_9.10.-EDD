import { Composition } from "remotion";
import { HypergamyShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HypergamyShort"
      component={HypergamyShort}
      durationInFrames={timeline.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
