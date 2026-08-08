import { assertEquals } from "@std/assert";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import Seeker from "./seeker.tsx";

// Happy: renders a labeled range input with the clamped value.
Deno.test("renders a seeker with the current time", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={10} duration={100} onSeek={() => {}} />,
  );
  const input = container.querySelector('[data-testid="seeker"]');
  if (!input) throw new Error("no seeker");
  assertEquals(input.getAttribute("aria-label"), "Seek");
  assertEquals(input.getAttribute("value"), "10");
});

// Edge: duration 0 renders a disabled-at-zero seeker (max 0, value 0).
Deno.test("clamps the value to the duration", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={200} duration={100} onSeek={() => {}} />,
  );
  const input = container.querySelector('[data-testid="seeker"]');
  if (!input) throw new Error("no seeker");
  assertEquals(input.getAttribute("value"), "100");
});

// Mutation: the seeker thumb grows on hover, guarded for reduced motion.
Deno.test("seeker thumb hover scale is motion-reduce guarded", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={0} duration={0} onSeek={() => {}} />,
  );
  const style = container.querySelector("style");
  const css = style?.textContent ?? "";
  assertEquals(css.includes(":hover::-webkit-slider-thumb"), true);
  assertEquals(css.includes(":hover::-moz-range-thumb"), true);
  assertEquals(css.includes("transform: scale(1.3)"), true);
  assertEquals(css.includes("prefers-reduced-motion"), true);
});
