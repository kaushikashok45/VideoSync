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

// Edge: currentTime beyond duration clamps to the duration.
Deno.test("clamps the value to the duration", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={200} duration={100} onSeek={() => {}} />,
  );
  const input = container.querySelector('[data-testid="seeker"]');
  if (!input) throw new Error("no seeker");
  assertEquals(input.getAttribute("value"), "100");
});

Deno.test("renders the completed portion of the timeline", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={25} duration={100} onSeek={() => {}} />,
  );
  const completed = container.querySelector<HTMLElement>(
    '[data-testid="seeker-completed"]',
  );
  assertEquals(completed?.style.width, "25%");
});

// Sad path: a seeker with no usable duration stays rendered but disabled.
Deno.test("disables seeking when the duration is unavailable", () => {
  setupDom();
  const { container } = render(
    <Seeker currentTime={20} duration={0} onSeek={() => {}} />,
  );
  const input = container.querySelector<HTMLInputElement>(
    '[data-testid="seeker"]',
  );
  if (!input) throw new Error("no seeker");
  assertEquals(input.disabled, true);
  assertEquals(input.getAttribute("max"), "0");
});

// Mutation: the seeker thumb grows on hover, and the reduced-motion block
// neutralizes the HOVER scale too (same selectors) — a lower-specificity
// transform:none alone would NOT win over :hover scale, so this pins the
// hover selectors are inside the media query.
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
  const reduceBlock = css.slice(css.indexOf("@media (prefers-reduced-motion"));
  assertEquals(
    reduceBlock.includes(":hover::-webkit-slider-thumb"),
    true,
  );
  assertEquals(reduceBlock.includes(":hover::-moz-range-thumb"), true);
});
