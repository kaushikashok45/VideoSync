import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { useOptionalAppStores } from "~/shared/api/socket-bridge.tsx";

interface UseEnsureHostRoomProps {
  enabled: boolean;
  roomId: string;
  sourceLabel: string;
}

function idleSubscribe(_onStoreChange: () => void): () => void {
  return () => {};
}

export function useEnsureHostRoom(props: UseEnsureHostRoomProps): boolean {
  const { enabled, roomId, sourceLabel } = props;
  const navigate = useNavigate();
  const stores = useOptionalAppStores();
  const activeRoomCode = useSyncExternalStore(
    stores?.room.subscribe ?? idleSubscribe,
    () => stores?.room.getState().room?.code ?? null,
    () => null,
  );
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!enabled || stores === null) {
      setRecovering(false);
      return;
    }
    if (activeRoomCode === roomId) {
      setRecovering(false);
      return;
    }
    setRecovering(true);
    navigate(`/${roomId}/SetupScreen`, {
      replace: true,
      state: {
        notice: `Reconnect the host room before continuing to ${sourceLabel}.`,
      },
    });
  }, [activeRoomCode, enabled, navigate, roomId, sourceLabel, stores]);

  return recovering;
}
