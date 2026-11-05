import { Composition } from "remotion";
import { BillionShort } from "./Video";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BillionShort"
      component={BillionShort}
      durationInFrames={timeline.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
