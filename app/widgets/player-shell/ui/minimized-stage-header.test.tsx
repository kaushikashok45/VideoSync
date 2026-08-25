import { assertEquals } from "@std/assert";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import MinimizedStageHeader from "./minimized-stage-header.tsx";

function header(onExit?: () => void) {
  const { container } = render(
    <MinimizedStageHeader
      videoTitle="Friday night watch"
      watchingCount={4}
      connectionLabel="In sync"
      participantCount={4}
      onExit={onExit}
    />,
  );
  return container;
}

// 1. Happy path: renders the brand mark, title, watching count, and status.
Deno.test("renders the wordmark, video title, watching and status", () => {
  setupDom();
  const container = header();
  const el = container.querySelector('[data-testid="minimized-stage-header"]');
  assertEquals(el?.textContent?.includes("Sync"), true);
  assertEquals(el?.textContent?.includes("Party"), true);
  assertEquals(el?.textContent?.includes("Friday night watch"), true);
  assertEquals(el?.textContent?.includes("4 watching"), true);
  assertEquals(el?.textContent?.includes("In sync"), true);
});

// 2. Sad/Edge: no leave button when onExit is not provided.
Deno.test("omits the leave button when onExit is not provided", () => {
  setupDom();
  const container = header();
  assertEquals(
    container.querySelector('[aria-label="Leave watch party"]'),
    null,
  );
});

// 3. Mutation: leave button calls onExit when provided.
Deno.test("leave button calls onExit when clicked", () => {
  setupDom();
  let exited = 0;
  const container = header(() => {
    exited += 1;
  });
  const leave = container.querySelector('[aria-label="Leave watch party"]');
  if (!leave) throw new Error("missing leave button");
  click(leave);
  assertEquals(exited, 1);
});
