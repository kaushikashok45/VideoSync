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
import { AppError } from "contracts/app-error.ts";

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

export function resetRoomScopedStores(stores: SocketBridgeStores): void {
  stores.room.getState().clearRoom();
  stores.members.setState({ members: [], me: null, controlRequests: [] });
  stores.chat.setState({ messages: [] });
  stores.reaction.getState().expireAll();
  stores.error.getState().clearError();
}

export function createSocketBridge(deps: SocketBridgeDeps): void {
  const { socket, stores } = deps;
  socket.onMemberJoined((p) => stores.members.getState().addMember(p.member));
  socket.onMemberLeft((p) =>
    stores.members.getState().removeMember(p.memberId)
  );
  socket.onChatMessage((m) => stores.chat.getState().append(m));
  socket.onReaction((r) => stores.reaction.getState().burst(r));
  socket.onRoomEnded(() => {
    resetRoomScopedStores(stores);
    stores.error.getState().setError(new AppError("ROOM_ENDED").toJSON());
  });
  socket.onSignal(() => {});
  socket.onAppError((e) => stores.error.getState().setError(e));
}

const SocketContext = createContext<SocketClient | null>(null);
const StoresContext = createContext<SocketBridgeStores | null>(null);

let fallbackRuntime:
  | { client: SocketClient | null; stores: SocketBridgeStores }
  | undefined;

function getFallbackRuntime(): {
  client: SocketClient | null;
  stores: SocketBridgeStores;
} {
  if (fallbackRuntime) return fallbackRuntime;
  const client = typeof globalThis.location === "undefined"
    ? null
    : createSocketClient({ url: globalThis.location.origin });
  const stores = {
    room: createRoomStore(),
    members: createMembersStore(),
    chat: createChatStore(),
    reaction: createReactionStore(),
    error: createErrorStore(),
  };
  if (client) createSocketBridge({ socket: client, stores });
  fallbackRuntime = { client, stores };
  return fallbackRuntime;
}

export function useSocketClient(): SocketClient {
  return useContext(SocketContext) ?? getFallbackRuntime().client ??
    (() => {
      throw new Error("Socket client is unavailable during server rendering");
    })();
}

export function useAppStores(): SocketBridgeStores {
  return useContext(StoresContext) ?? getFallbackRuntime().stores;
}

export function useOptionalAppStores(): SocketBridgeStores | null {
  return useContext(StoresContext) ?? getFallbackRuntime().stores;
}

export function useOptionalSocketClient(): SocketClient | null {
  return useContext(SocketContext) ?? getFallbackRuntime().client;
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
