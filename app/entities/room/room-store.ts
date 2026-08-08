import { createStore, type StoreApi } from "zustand/vanilla";
import type { RoomMeta } from "contracts/room-meta.ts";

export interface RoomState {
  room: RoomMeta | null;
  joined: boolean;
  setRoom(meta: RoomMeta): void;
  clearRoom(): void;
}

export type RoomStore = StoreApi<RoomState>;

export function createRoomStore(): RoomStore {
  return createStore<RoomState>()((set) => ({
    room: null,
    joined: false,
    setRoom(meta) {
      set({ room: meta, joined: true });
    },
    clearRoom() {
      set({ room: null, joined: false });
    },
  }));
}
