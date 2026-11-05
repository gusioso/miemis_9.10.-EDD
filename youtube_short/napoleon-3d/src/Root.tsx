import { Composition } from "remotion";
import { NapoleonShort } from "./Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="NapoleonShort" component={NapoleonShort} durationInFrames={1800} fps={30} width={1080} height={1920} />
);
