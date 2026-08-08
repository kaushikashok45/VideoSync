import { assertEquals } from "@std/assert";
import { Popover } from "./popover.tsx";
import {
  click,
  mouseDown,
  pressKey,
  render,
  setupDom,
} from "./render-helper.ts";

// Happy: opens on trigger click with aria-expanded true and content present
Deno.test("opens on trigger and sets aria-expanded true", () => {
  setupDom();
  const { container } = render(
    <Popover trigger={<button type="button">Menu</button>}>
      <p>popover-content</p>
    </Popover>,
  );
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("no trigger");
  click(trigger);
  assertEquals(trigger.getAttribute("aria-expanded"), "true");
  assertEquals(document.body.textContent?.includes("popover-content"), true);
});

// Sad: outside click closes the popover
Deno.test("outside click closes the popover", () => {
  setupDom();
  const { container } = render(
    <Popover trigger={<button type="button">Menu</button>}>
      <p>popover-content</p>
    </Popover>,
  );
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("no trigger");
  click(trigger);
  mouseDown(document.body);
  assertEquals(trigger.getAttribute("aria-expanded"), "false");
  assertEquals(document.body.textContent?.includes("popover-content"), false);
});

// Edge: Esc closes the popover
Deno.test("Esc closes the popover", () => {
  setupDom();
  const { container } = render(
    <Popover trigger={<button type="button">Menu</button>}>
      <p>popover-content</p>
    </Popover>,
  );
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("no trigger");
  click(trigger);
  pressKey(document, "Escape");
  assertEquals(trigger.getAttribute("aria-expanded"), "false");
  assertEquals(document.body.textContent?.includes("popover-content"), false);
});

// Mutation: content only present while open
Deno.test("content absent before open and present after", () => {
  setupDom();
  const { container } = render(
    <Popover trigger={<button type="button">Menu</button>}>
      <p>popover-content</p>
    </Popover>,
  );
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("no trigger");
  assertEquals(document.body.textContent?.includes("popover-content"), false);
  click(trigger);
  assertEquals(document.body.textContent?.includes("popover-content"), true);
});
