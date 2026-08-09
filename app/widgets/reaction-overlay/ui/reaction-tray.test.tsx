import { assertEquals } from "@std/assert";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import ReactionTray from "./reaction-tray.tsx";

Deno.test("reaction tray progressively discloses emojis from one trigger", () => {
  setupDom();
  const { container } = render(
    <ReactionTray open={false} onToggle={() => {}} onReact={() => {}} />,
  );
  assertEquals(
    container.querySelector('[data-testid="reaction-tray"]')?.getAttribute(
      "aria-hidden",
    ),
    "true",
  );
  assertEquals(
    container.querySelector('[aria-label="Open reactions"]') !== null,
    true,
  );
});

Deno.test("reaction tray exposes all supported reactions when open", () => {
  setupDom();
  const { container } = render(
    <ReactionTray open onToggle={() => {}} onReact={() => {}} />,
  );
  assertEquals(
    container.querySelectorAll('[aria-label^="React "]').length,
    5,
  );
});

Deno.test("reaction trigger calls the toggle action", () => {
  setupDom();
  let toggles = 0;
  const { container } = render(
    <ReactionTray
      open={false}
      onToggle={() => toggles++}
      onReact={() => {}}
    />,
  );
  click(container.querySelector('[aria-label="Open reactions"]') as Element);
  assertEquals(toggles, 1);
});
