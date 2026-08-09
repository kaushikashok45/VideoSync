import type { SocketConnectionState } from "~/shared/api/socket-client.ts";

export interface RoomConnectionInput {
  mode: "host" | "receiver";
  socketState: SocketConnectionState;
  hostPresent: boolean;
  hasStream: boolean;
  sourceReady: boolean;
  hadStream: boolean;
}

export interface RoomConnectionState {
  stage:
    | "connecting"
    | "waiting-for-source"
    | "waiting-for-host"
    | "reconnecting"
    | "in-sync";
  label: string;
  banner: string | null;
  panelTone: "neutral" | "success" | "warning";
}

function reconnectingState(): RoomConnectionState {
  return {
    stage: "reconnecting",
    label: "Reconnecting",
    banner: "Connection interrupted. Trying again.",
    panelTone: "warning",
  };
}

function inSyncState(): RoomConnectionState {
  return {
    stage: "in-sync",
    label: "In sync",
    banner: null,
    panelTone: "success",
  };
}

export function resolveRoomConnectionState(
  input: RoomConnectionInput,
): RoomConnectionState {
  if (input.socketState !== "connected") {
    if (input.mode === "host" || input.hadStream || input.hostPresent) {
      return reconnectingState();
    }
    return {
      stage: "connecting",
      label: "Connecting",
      banner: "Connecting to the room.",
      panelTone: "neutral",
    };
  }
  if (input.mode === "host") {
    return inSyncState();
  }
  if (input.hasStream) return inSyncState();
  if (input.hadStream) return reconnectingState();
  if (!input.hostPresent) {
    return {
      stage: "connecting",
      label: "Connecting",
      banner: "Connecting to the room.",
      panelTone: "neutral",
    };
  }
  if (!input.sourceReady) {
    return {
      stage: "waiting-for-source",
      label: "Waiting for source",
      banner: "The host has not chosen a video yet.",
      panelTone: "neutral",
    };
  }
  return {
    stage: "waiting-for-host",
    label: "Waiting for host",
    banner: "You’re in. Waiting for the host to start.",
    panelTone: "neutral",
  };
}
