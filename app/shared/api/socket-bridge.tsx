import { createContext, type ReactNode, useContext, useState } from "react";
import { createSocketClient, type SocketClient } from "./socket-client.ts";
import type { RoomStore } from "../../entities/room/room-store.ts";
import type { MembersStore } from "../../entities/member/members-store.ts";
import type { ChatStore } from "../../entities/chat/chat-store.ts";
import type { ReactionStore } from "../../entities/reaction/reaction-store.ts";
import type { ErrorStore } from "./error-store.ts";

export interface SocketBridgeStores {
  room: RoomStore;
  members: MembersStore;
  chat: ChatStore;
  reaction: ReactionStore;
  error: ErrorStore;
}

export interface SocketBridgeDeps {
  socket: SocketClient;
  stores: SocketBridgeStores;
}

export function createSocketBridge(deps: SocketBridgeDeps): void {
  const { socket, stores } = deps;
  socket.onMemberJoined((p) => stores.members.getState().addMember(p.member));
  socket.onMemberLeft((p) =>
    stores.members.getState().removeMember(p.memberId)
  );
  socket.onChatMessage((m) => stores.chat.getState().append(m));
  socket.onReaction((r) => stores.reaction.getState().burst(r));
  socket.onRoomEnded(() => stores.room.getState().clearRoom());
  socket.onSignal(() => {});
  socket.onAppError((e) => stores.error.getState().setError(e));
}

const SocketContext = createContext<SocketClient | null>(null);

export function useSocketClient(): SocketClient {
  const client = useContext(SocketContext);
  if (client === null) {
    throw new Error("useSocketClient must be used within SocketProvider");
  }
  return client;
}

export function SocketProvider({ children }: { children?: ReactNode }) {
  const [client] = useState<SocketClient | null>(() =>
    typeof globalThis.location === "undefined"
      ? null
      : createSocketClient({ url: globalThis.location.origin })
  );

  return (
    <SocketContext.Provider value={client}>{children}</SocketContext.Provider>
  );
}
