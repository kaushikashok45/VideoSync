import { assertEquals } from "@std/assert";
import { Button } from "./button.tsx";
import { click, render, setupDom } from "./render-helper.ts";

// Happy: renders label and fires onClick
Deno.test("renders label and fires onClick", () => {
  setupDom();
  let clicks = 0;
  const { container } = render(<Button onClick={() => clicks++}>Watch</Button>);
  const button = container.querySelector("button");
  if (!button) throw new Error("no button");
  assertEquals(button.textContent, "Watch");
  click(button);
  assertEquals(clicks, 1);
});

// Sad: disabled blocks click
Deno.test("disabled blocks click", () => {
  setupDom();
  let clicks = 0;
  const { container } = render(
    <Button disabled onClick={() => clicks++}>Watch</Button>,
  );
  const button = container.querySelector("button");
  if (!button) throw new Error("no button");
  click(button);
  assertEquals(clicks, 0);
});

// Edge: loading shows spinner and disables the button
Deno.test("loading shows spinner and disables the button", () => {
  setupDom();
  let clicks = 0;
  const { container } = render(
    <Button loading onClick={() => clicks++}>Watch</Button>,
  );
  const button = container.querySelector("button");
  if (!button) throw new Error("no button");
  assertEquals(button.getAttribute("disabled"), "");
  assertEquals(button.querySelector('[role="status"]') !== null, true);
  click(button);
  assertEquals(clicks, 0);
});

// Mutation: variant classes differ (brand vs secondary)
Deno.test("primary uses brand classes, secondary uses surface", () => {
  setupDom();
  const primary = render(<Button variant="primary">A</Button>);
  const secondary = render(<Button variant="secondary">B</Button>);
  const primaryButton = primary.container.querySelector("button");
  const secondaryButton = secondary.container.querySelector("button");
  if (!primaryButton || !secondaryButton) throw new Error("no buttons");
  assertEquals(primaryButton.className.includes("bg-brand"), true);
  assertEquals(secondaryButton.className.includes("bg-surface"), true);
  assertEquals(
    primaryButton.className.includes("bg-brand") ===
      secondaryButton.className.includes("bg-brand"),
    false,
  );
});

// Edge: defaults to type="button" but honors an explicit override
Deno.test("defaults to type button and honors a submit override", () => {
  setupDom();
  const plain = render(<Button>Go</Button>);
  const submit = render(<Button type="submit">Go</Button>);
  const plainButton = plain.container.querySelector("button");
  const submitButton = submit.container.querySelector("button");
  if (!plainButton || !submitButton) throw new Error("no buttons");
  assertEquals(plainButton.getAttribute("type"), "button");
  assertEquals(submitButton.getAttribute("type"), "submit");
});

// Limits: size classes differ (sm vs lg)
Deno.test("size classes differ between sm and lg", () => {
  setupDom();
  const small = render(<Button size="sm">A</Button>);
  const large = render(<Button size="lg">B</Button>);
  const smallButton = small.container.querySelector("button");
  const largeButton = large.container.querySelector("button");
  if (!smallButton || !largeButton) throw new Error("no buttons");
  assertEquals(smallButton.className.includes("px-sm"), true);
  assertEquals(largeButton.className.includes("px-lg"), true);
  assertEquals(
    smallButton.className.includes("px-lg") ===
      largeButton.className.includes("px-lg"),
    false,
  );
});
