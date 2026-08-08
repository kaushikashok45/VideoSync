import { createStore } from "zustand/vanilla";
import type { MediaSource } from "contracts/media-source.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";

export interface HostSourceHandoff {
  source: MediaSource;
  file: File | null;
  metadata: MovieMetadata | null;
}

export interface HostSourceState {
  source: MediaSource | null;
  file: File | null;
  metadata: MovieMetadata | null;
  commit(handoff: HostSourceHandoff): void;
  clear(): void;
}

export const hostSourceStore = createStore<HostSourceState>()((set) => ({
  source: null,
  file: null,
  metadata: null,
  commit(handoff) {
    set({ ...handoff });
  },
  clear() {
    set({ source: null, file: null, metadata: null });
  },
}));
