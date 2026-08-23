import { assertEquals } from "@std/assert";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import PlayerFeedback from "./player-feedback.tsx";

Deno.test("receiver waiting state explains the room is still connecting", () => {
  setupDom();
  const { container } = render(
    <PlayerFeedback
      mode="receiver"
      connectionState="connecting"
      awaitingSource
      autoplayBlocked={false}
      visible
      metadata={null}
      onPlay={() => {}}
    />,
  );
  assertEquals(
    container.textContent?.includes("Connecting to the room."),
    true,
  );
});

Deno.test("receiver with a ready source but no stream waits for the host", () => {
  setupDom();
  const { container } = render(
    <PlayerFeedback
      mode="receiver"
      connectionState="waiting-for-host"
      src="ready"
      awaitingSource={false}
      autoplayBlocked={false}
      visible
      metadata={null}
      onPlay={() => {}}
    />,
  );
  assertEquals(
    container.textContent?.includes(
      "You’re in. Waiting for the host to start.",
    ),
    true,
  );
});

Deno.test("the feedback slot keeps a stable reserved container", () => {
  setupDom();
  const { container } = render(
    <PlayerFeedback
      mode="host"
      src="movie.mp4"
      awaitingSource={false}
      autoplayBlocked={false}
      visible
      metadata={null}
      onPlay={() => {}}
    />,
  );
  assertEquals(
    container.querySelector('[data-testid="player-feedback-slot"]') !== null,
    true,
  );
});

Deno.test("receiver reconnecting state announces recovery without blocking the stage", () => {
  setupDom();
  const { container } = render(
    <PlayerFeedback
      mode="receiver"
      connectionState="reconnecting"
      awaitingSource={false}
      autoplayBlocked={false}
      visible
      metadata={null}
      onPlay={() => {}}
    />,
  );
  assertEquals(
    container.textContent?.includes("Connection interrupted. Trying again."),
    true,
  );
});

Deno.test("normal playback does not leave a visible floating feedback card", () => {
  setupDom();
  const { container } = render(
    <PlayerFeedback
      mode="host"
      src="movie.mp4"
      awaitingSource={false}
      autoplayBlocked={false}
      visible
      metadata={null}
      onPlay={() => {}}
    />,
  );
  assertEquals(
    container.querySelector(
      ".border.border-line.bg-surface-raised\\/90.shadow-overlay",
    ),
    null,
  );
});
