import { createStore, type StoreApi } from "zustand/vanilla";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";

export interface ErrorState {
  lastError: AppErrorPayload | null;
  setError(e: AppErrorPayload): void;
  clearError(): void;
}

export type ErrorStore = StoreApi<ErrorState>;

export function createErrorStore(): ErrorStore {
  return createStore<ErrorState>()((set) => ({
    lastError: null,
    setError(e) {
      set({ lastError: e });
    },
    clearError() {
      set({ lastError: null });
    },
  }));
}
