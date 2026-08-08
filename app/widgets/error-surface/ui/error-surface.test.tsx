import { assertEquals } from "@std/assert";
import { act } from "react";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ErrorStore } from "~/shared/api/error-store.ts";
import { createErrorStore } from "~/shared/api/error-store.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import { ErrorSurface } from "./error-surface.tsx";

function recoverable(): AppErrorPayload {
  return {
    code: "TRANSPORT_DISCONNECTED",
    message: "You were disconnected.",
    recovery: { label: "Reconnect", action: { kind: "reconnect" } },
  };
}

function terminal(): AppErrorPayload {
  return {
    code: "SERVER_INTERNAL",
    message: "Something went wrong on our end. Please try again.",
  };
}

function setError(store: ErrorStore, error: AppErrorPayload): void {
  act(() => {
    store.getState().setError(error);
  });
}

// Happy: a recoverable error renders a banner.
Deno.test("recoverable error renders a banner", () => {
  setupDom();
  const store = createErrorStore();
  const { container } = render(<ErrorSurface errorStore={store} />);
  setError(store, recoverable());
  assertEquals(
    container.querySelector('[data-testid="error-banner"]') !== null,
    true,
  );
  assertEquals(container.querySelector('[data-testid="error-screen"]'), null);
});

// Sad: a terminal error renders a full screen.
Deno.test("terminal error renders a full screen", () => {
  setupDom();
  const store = createErrorStore();
  const { container } = render(<ErrorSurface errorStore={store} />);
  setError(store, terminal());
  assertEquals(
    container.querySelector('[data-testid="error-screen"]') !== null,
    true,
  );
  assertEquals(container.querySelector('[data-testid="error-banner"]'), null);
});

// Edge: no error renders nothing.
Deno.test("no error renders nothing", () => {
  setupDom();
  const store = createErrorStore();
  const { container } = render(<ErrorSurface errorStore={store} />);
  assertEquals(container.querySelector('[data-testid="error-banner"]'), null);
  assertEquals(container.querySelector('[data-testid="error-screen"]'), null);
});

// Mutation: home-kind recovery routes to onHome; others to onRecover.
Deno.test("home recovery routes to onHome, other recoveries to onRecover", () => {
  setupDom();
  let home = 0;
  let recover = 0;
  const store = createErrorStore();
  const { container } = render(
    <ErrorSurface
      errorStore={store}
      onHome={() => home++}
      onRecover={() => recover++}
    />,
  );
  setError(store, {
    code: "ROOM_NOT_FOUND",
    message: "Room not found",
    recovery: { label: "Back to home", action: { kind: "home" } },
  });
  const recoverButton = container.querySelector(
    '[data-testid="recover-button"]',
  );
  if (!recoverButton) throw new Error("no recover button");
  act(() => {
    recoverButton.dispatchEvent(
      new globalThis.MouseEvent("click", { bubbles: true }),
    );
  });
  assertEquals(home, 1);
  assertEquals(recover, 0);
});

// Mutation: a non-home recovery (e.g. reconnect) routes to onRecover, never
// onHome. A regression of recoverHandler to always call onHome would fail this.
Deno.test("reconnect recovery routes to onRecover, not onHome", () => {
  setupDom();
  let home = 0;
  let recover = 0;
  const store = createErrorStore();
  const { container } = render(
    <ErrorSurface
      errorStore={store}
      onHome={() => home++}
      onRecover={() => recover++}
    />,
  );
  setError(store, recoverable());
  const recoverButton = container.querySelector(
    '[data-testid="recover-button"]',
  );
  if (!recoverButton) throw new Error("no recover button");
  act(() => {
    recoverButton.dispatchEvent(
      new globalThis.MouseEvent("click", { bubbles: true }),
    );
  });
  assertEquals(home, 0);
  assertEquals(recover, 1);
});

// Limits: dismissing the banner clears the store.
Deno.test("dismissing the banner clears the store", () => {
  setupDom();
  const store = createErrorStore();
  const { container } = render(<ErrorSurface errorStore={store} />);
  setError(store, recoverable());
  const dismiss = container.querySelector('[aria-label="Dismiss"]');
  if (!dismiss) throw new Error("no dismiss button");
  act(() => {
    dismiss.dispatchEvent(
      new globalThis.MouseEvent("click", { bubbles: true }),
    );
  });
  assertEquals(store.getState().lastError, null);
});
