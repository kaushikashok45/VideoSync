import { assertEquals } from "@std/assert";
import { Switch } from "./switch.tsx";
import { click, render, setupDom } from "./render-helper.ts";

function findSwitch(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[role="switch"]');
  if (!el) throw new Error("no switch");
  return el as HTMLElement;
}

// Happy: toggles aria-checked on click
Deno.test("toggles aria-checked on click", () => {
  setupDom();
  const { container } = render(<Switch />);
  const el = findSwitch(container);
  assertEquals(el.getAttribute("aria-checked"), "false");
  click(el);
  assertEquals(el.getAttribute("aria-checked"), "true");
  click(el);
  assertEquals(el.getAttribute("aria-checked"), "false");
});

// Sad: disabled switch does not toggle
Deno.test("disabled switch does not toggle", () => {
  setupDom();
  const { container } = render(<Switch disabled />);
  const el = findSwitch(container);
  click(el);
  assertEquals(el.getAttribute("aria-checked"), "false");
});

// Edge: default is off
Deno.test("defaults to unchecked", () => {
  setupDom();
  const { container } = render(<Switch />);
  assertEquals(findSwitch(container).getAttribute("aria-checked"), "false");
});

// Mutation: onChange fires with the new value
Deno.test("onChange fires with the new value", () => {
  setupDom();
  const values: boolean[] = [];
  const { container } = render(
    <Switch onChange={(next) => values.push(next)} />,
  );
  const el = findSwitch(container);
  click(el);
  click(el);
  assertEquals(values, [true, false]);
});
