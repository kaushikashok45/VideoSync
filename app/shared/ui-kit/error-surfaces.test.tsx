import { assertEquals } from "@std/assert";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import { ErrorBanner } from "./error-banner.tsx";
import { ErrorScreen } from "./error-screen.tsx";
import { InlineError } from "./inline-error.tsx";
import { click, render, setupDom } from "./render-helper.ts";

function payload(): AppErrorPayload {
  return {
    code: "TRANSPORT_DISCONNECTED",
    message: "You were disconnected.",
    recovery: { label: "Reconnect", action: { kind: "reconnect" } },
  };
}

// Happy: banner renders the message and the payload recovery label.
Deno.test("banner renders message and payload recovery label", () => {
  setupDom();
  const { container } = render(
    <ErrorBanner
      payload={payload()}
      onDismiss={() => {}}
      onRecover={() => {}}
    />,
  );
  const banner = container.querySelector('[data-testid="error-banner"]');
  assertEquals(banner !== null, true);
  assertEquals(banner?.textContent?.includes("You were disconnected."), true);
  assertEquals(banner?.textContent?.includes("Reconnect"), true);
});

// Sad/Edge: dismiss invokes onDismiss.
Deno.test("banner dismiss invokes onDismiss", () => {
  setupDom();
  let dismissed = 0;
  const { container } = render(
    <ErrorBanner payload={payload()} onDismiss={() => dismissed++} />,
  );
  const dismiss = container.querySelector('[aria-label="Dismiss"]');
  if (!dismiss) throw new Error("no dismiss button");
  click(dismiss);
  assertEquals(dismissed, 1);
});

// Mutation: banner recovery label comes from payload.recovery, not hardcoded.
Deno.test("banner recovery label matches payload recovery label", () => {
  setupDom();
  let recovered = 0;
  const { container } = render(
    <ErrorBanner
      payload={payload()}
      onDismiss={() => {}}
      onRecover={() => recovered++}
    />,
  );
  const recover = container.querySelector('[data-testid="recover-button"]');
  if (!recover) throw new Error("no recover button");
  assertEquals(recover.textContent, "Reconnect");
  click(recover);
  assertEquals(recovered, 1);
});

// Limits: banner without a recovery action renders no recovery button.
Deno.test("banner without recovery action renders no recovery button", () => {
  setupDom();
  const { container } = render(
    <ErrorBanner payload={payload()} onDismiss={() => {}} />,
  );
  assertEquals(container.querySelector('[data-testid="recover-button"]'), null);
});

// Happy: screen renders title, message, and code caption.
Deno.test("screen renders title, message, and code caption", () => {
  setupDom();
  const { container } = render(<ErrorScreen payload={payload()} />);
  const screen = container.querySelector('[data-testid="error-screen"]');
  assertEquals(screen !== null, true);
  assertEquals(screen?.textContent?.includes("It isn't you, it's us"), true);
  assertEquals(screen?.textContent?.includes("You were disconnected."), true);
  assertEquals(screen?.textContent?.includes("TRANSPORT_DISCONNECTED"), true);
});

// Happy: screen renders a Home action and fires onHome.
Deno.test("screen Home action fires onHome", () => {
  setupDom();
  let home = 0;
  const { container } = render(
    <ErrorScreen payload={payload()} onHome={() => home++} />,
  );
  const homeButton = container.querySelector('[data-testid="home-button"]');
  if (!homeButton) throw new Error("no home button");
  click(homeButton);
  assertEquals(home, 1);
});

// Mutation: screen recovery label comes from payload.recovery, not hardcoded.
Deno.test("screen recovery label matches payload recovery label", () => {
  setupDom();
  const custom: AppErrorPayload = {
    code: "MEDIA_URL_UNPLAYABLE",
    message: "That video couldn't start playing.",
    recovery: {
      label: "Try a different link",
      action: { kind: "choose-source" },
    },
  };
  const { container } = render(
    <ErrorScreen payload={custom} onHome={() => {}} />,
  );
  assertEquals(
    container.querySelector('[data-testid="home-button"]')?.textContent,
    "Try a different link",
  );
});

// Limits: screen with no recovery falls back to a Home label.
Deno.test("screen without recovery falls back to Home label", () => {
  setupDom();
  const noRecovery: AppErrorPayload = {
    code: "SERVER_INTERNAL",
    message: "Something went wrong on our end. Please try again.",
  };
  const { container } = render(
    <ErrorScreen payload={noRecovery} onHome={() => {}} />,
  );
  assertEquals(
    container.querySelector('[data-testid="home-button"]')?.textContent,
    "Home",
  );
});

// Happy: inline error renders message and code caption.
Deno.test("inline error renders message and code caption", () => {
  setupDom();
  const { container } = render(
    <InlineError message="Name is required" code="VALIDATION_NAME_EMPTY" />,
  );
  assertEquals(container.textContent?.includes("Name is required"), true);
  assertEquals(container.textContent?.includes("VALIDATION_NAME_EMPTY"), true);
});

// Edge: inline error without a code omits the caption.
Deno.test("inline error without code omits the caption", () => {
  setupDom();
  const { container } = render(<InlineError message="Name is required" />);
  assertEquals(container.querySelector('[data-testid="error-code"]'), null);
  assertEquals(container.textContent?.includes("Name is required"), true);
});
