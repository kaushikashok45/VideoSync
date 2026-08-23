import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import JoinForm from "~/features/room-join/ui/join-form.tsx";
import {
  resetRoomScopedStores,
  useAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import { writeHostSessionRoom } from "../logic/host-session-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { LandingCta } from "./landing-cta.tsx";
import { LandingFeatures } from "./landing-features.tsx";
import { LandingFooter } from "./landing-footer.tsx";
import { LandingHero } from "./landing-hero.tsx";
import { LandingHowItWorks } from "./landing-how-it-works.tsx";
import { LandingInfo } from "./landing-info.tsx";
import { LandingNavigation } from "./landing-navigation.tsx";
import { LandingShowcase } from "./landing-showcase.tsx";

export function LandingScreen() {
  const navigate = useNavigate();
  const socket = useOptionalSocketClient();
  const stores = useAppStores();
  const { updateRoomId, updateRole, updateUserName } = useContext(
    SessionContext,
  );
  const [pending, setPending] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWatching = async () => {
    setPending(true);
    setError(null);
    if (!socket) {
      setError("The room service is still starting. Try again in a moment.");
      setPending(false);
      return;
    }
    try {
      const hostName = "Host";
      const room = await socket.createRoom(hostName);
      resetRoomScopedStores(stores);
      stores.room.getState().setRoom(room);
      writeHostSessionRoom(room.code);
      updateRoomId(room.code);
      updateRole(Role.HOST);
      updateUserName(hostName);
      navigate(`/${room.code}/file-upload`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start the room.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <EntryLayout bare headerActions={<LandingNavigation />}>
      <div className="landing-page pb-lg">
        <LandingHero
          pending={pending}
          joinOpen={joinOpen}
          error={error}
          onStartWatching={() => void startWatching()}
          onToggleJoin={() => setJoinOpen((current) => !current)}
        >
          <JoinForm />
        </LandingHero>
        <LandingFeatures />
        <LandingShowcase />
        <LandingHowItWorks />
        <LandingCta
          pending={pending}
          onStartWatching={() => void startWatching()}
        />
        <LandingInfo />
        <LandingFooter />
      </div>
    </EntryLayout>
  );
}
