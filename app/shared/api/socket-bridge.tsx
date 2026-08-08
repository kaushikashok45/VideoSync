import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createSocketClient, type SocketClient } from "./socket-client.ts";
import type { RoomStore } from "../../entities/room/room-store.ts";
import type { MembersStore } from "../../entities/member/members-store.ts";
import type { ChatStore } from "../../entities/chat/chat-store.ts";
import type { ReactionStore } from "../../entities/reaction/reaction-store.ts";
import type { ErrorStore } from "./error-store.ts";
import { createChatStore } from "../../entities/chat/chat-store.ts";
import { createErrorStore } from "./error-store.ts";
import { createMembersStore } from "../../entities/member/members-store.ts";
import { createReactionStore } from "../../entities/reaction/reaction-store.ts";
import { createRoomStore } from "../../entities/room/room-store.ts";

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
const StoresContext = createContext<SocketBridgeStores | null>(null);

export function useSocketClient(): SocketClient {
  const client = useContext(SocketContext);
  if (client === null) {
    throw new Error("useSocketClient must be used within SocketProvider");
  }
  return client;
}

export function useAppStores(): SocketBridgeStores {
  const stores = useContext(StoresContext);
  if (stores === null) {
    throw new Error("useAppStores must be used in Providers");
  }
  return stores;
}

export function useOptionalAppStores(): SocketBridgeStores | null {
  return useContext(StoresContext);
}

export function SocketProvider({ children }: { children?: ReactNode }) {
  const [client] = useState<SocketClient | null>(() =>
    typeof globalThis.location === "undefined"
      ? null
      : createSocketClient({ url: globalThis.location.origin })
  );
  const [stores] = useState<SocketBridgeStores>(() => ({
    room: createRoomStore(),
    members: createMembersStore(),
    chat: createChatStore(),
    reaction: createReactionStore(),
    error: createErrorStore(),
  }));
  const bridged = useRef(false);

  useEffect(() => {
    if (!client || bridged.current) return;
    createSocketBridge({ socket: client, stores });
    bridged.current = true;
  }, [client, stores]);

  return (
    <SocketContext.Provider value={client}>
      <StoresContext.Provider value={stores}>{children}</StoresContext.Provider>
    </SocketContext.Provider>
  );
}
