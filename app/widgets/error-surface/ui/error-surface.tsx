import { useSyncExternalStore } from "react";
import { severityOf } from "~/shared/api/error-bridge.ts";
import type { ErrorStore } from "~/shared/api/error-store.ts";
import type { Recovery } from "contracts/recovery.ts";
import { ErrorBanner } from "~/shared/ui-kit/error-banner.tsx";
import { ErrorScreen } from "~/shared/ui-kit/error-screen.tsx";

export interface ErrorSurfaceProps {
  errorStore: ErrorStore;
  onHome?: () => void;
  onRecover?: () => void;
}

function recoverHandler(
  recovery: Recovery | undefined,
  onHome?: () => void,
  onRecover?: () => void,
): (() => void) | undefined {
  if (recovery?.action.kind === "home") return onHome;
  return onRecover;
}

export function ErrorSurface(
  { errorStore, onHome, onRecover }: ErrorSurfaceProps,
) {
  const lastError = useSyncExternalStore(
    (listener) => errorStore.subscribe(listener),
    () => errorStore.getState().lastError,
  );
  if (lastError === null) return null;
  if (severityOf(lastError.code) === "recoverable") {
    return (
      <ErrorBanner
        payload={lastError}
        onDismiss={() => errorStore.getState().clearError()}
        onRecover={recoverHandler(lastError.recovery, onHome, onRecover)}
      />
    );
  }
  return <ErrorScreen payload={lastError} onHome={onHome} />;
}
