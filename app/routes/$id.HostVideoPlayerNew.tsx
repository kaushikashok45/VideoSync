import { useSearchParams } from "react-router";
import { HostPlaybackScreen } from "~/features/entry-flow/components/host-playback-screen.tsx";
import { HostPreplayScreen } from "~/features/entry-flow/components/host-preplay-screen.tsx";

export default function HostVideoPlayerNew() {
  const [searchParams] = useSearchParams();
  return searchParams.get("preview") === "1"
    ? <HostPreplayScreen />
    : <HostPlaybackScreen />;
}
