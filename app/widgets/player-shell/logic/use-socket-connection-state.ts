import { useEffect, useState } from "react";
import type {
  SocketClient,
  SocketConnectionState,
} from "~/shared/api/socket-client.ts";

export function useSocketConnectionState(
  socket: SocketClient | null,
): SocketConnectionState {
  const [state, setState] = useState<SocketConnectionState>(() =>
    socket?.getConnectionState() ?? "connected"
  );

  useEffect(() => {
    if (!socket) {
      setState("connected");
      return;
    }
    setState(socket.getConnectionState());
    return socket.onConnectionStateChange(setState);
  }, [socket]);

  return state;
}
