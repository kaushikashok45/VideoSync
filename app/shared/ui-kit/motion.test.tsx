import { assertEquals } from "@std/assert";
import { Button } from "./button.tsx";
import { EASING, revealStyle, useReveal } from "./motion.ts";
import { render, setupDom } from "./render-helper.ts";

const REDUCED_CROSSFADE_MS = 150;

function RevealProbe({
  delayMs = 0,
  durationMs = 400,
}: { delayMs?: number; durationMs?: number }) {
  const reveal = useReveal({ delayMs, durationMs });
  return (
    <div
      data-testid="reveal-probe"
      data-revealed={String(reveal.revealed)}
      style={reveal.style}
    >
      <span>content</span>
    </div>
  );
}

// 1. Happy path: default reveal is SSR-safe and returns the full eased style.
Deno.test("useReveal default is SSR-safe with revealed content and full animation", () => {
  setupDom();
  const { container } = render(<RevealProbe />);
  const probe = container.querySelector<HTMLElement>(
    '[data-testid="reveal-probe"]',
  );
  if (!probe) throw new Error("no probe");
  assertEquals(probe.dataset.revealed, "true");
  assertEquals(probe.textContent?.includes("content"), true);
  assertEquals(probe.style.animationDuration, "400ms");
  assertEquals(probe.style.animationDelay, "0ms");
  assertEquals(probe.style.animationTimingFunction, EASING.easeOutExpo);
});

// 1b. Happy: the pure revealStyle pins duration, delay, easing, and fill mode.
Deno.test("revealStyle returns the exact eased animation style", () => {
  assertEquals(revealStyle(200, 400, false), {
    animationDuration: "400ms",
    animationDelay: "200ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    animationFillMode: "backwards",
  });
});

// 2. Sad: reduced motion collapses the reveal to a short crossfade, no delay.
Deno.test("reduced motion truncates the animation and drops the delay", () => {
  const style = revealStyle(300, 400, true);
  assertEquals(style.animationDuration, `${REDUCED_CROSSFADE_MS}ms`);
  assertEquals(style.animationDelay, "0ms");
});

// 2b. Sad: useReveal honors prefers-reduced-motion after mount.
Deno.test("useReveal truncates the animation under reduced motion", () => {
  setupDom();
  const matchMedia = globalThis as unknown as {
    matchMedia?: (q: string) => { matches: boolean };
  };
  matchMedia.matchMedia = () => ({ matches: true });
  try {
    const { container } = render(
      <RevealProbe delayMs={300} durationMs={400} />,
    );
    const probe = container.querySelector<HTMLElement>(
      '[data-testid="reveal-probe"]',
    );
    if (!probe) throw new Error("no probe");
    assertEquals(probe.dataset.revealed, "true");
    assertEquals(probe.style.animationDuration, `${REDUCED_CROSSFADE_MS}ms`);
    assertEquals(probe.style.animationDelay, "0ms");
  } finally {
    Reflect.deleteProperty(globalThis, "matchMedia");
  }
});

// 3. Edge: zero delay and zero duration are valid boundaries.
Deno.test("zero delay and zero duration are valid boundaries", () => {
  assertEquals(revealStyle(0, 400, false).animationDelay, "0ms");
  assertEquals(revealStyle(0, 0, false).animationDuration, "0ms");
  assertEquals(
    revealStyle(0, 0, false).animationTimingFunction,
    EASING.easeOutExpo,
  );
});

// 4. Mutation: the easing constant is pinned to the exact expo curve.
Deno.test("EASING.easeOutExpo is exactly the ease-out-expo curve", () => {
  assertEquals(EASING.easeOutExpo, "cubic-bezier(0.16, 1, 0.3, 1)");
});

// 4b. Mutation: dropping the reduced-motion guard would change the output.
Deno.test("reduced-motion guard cannot be dropped without failing", () => {
  const reduced = revealStyle(300, 400, true);
  const full = revealStyle(300, 400, false);
  assertEquals(reduced.animationDuration === full.animationDuration, false);
  assertEquals(reduced.animationDelay === full.animationDelay, false);
  assertEquals(reduced.animationDuration, `${REDUCED_CROSSFADE_MS}ms`);
  assertEquals(reduced.animationDelay, "0ms");
});

// 5. Limits: negative delay and duration clamp to zero.
Deno.test("negative delay and duration clamp to zero", () => {
  const style = revealStyle(-50, -100, false);
  assertEquals(style.animationDelay, "0ms");
  assertEquals(style.animationDuration, "0ms");
  assertEquals(style.animationTimingFunction, EASING.easeOutExpo);
});

// 6. Hover micro-interaction: the button lifts on hover, guarded by motion-reduce.
Deno.test("button hover lift is transform-only and motion-reduce guarded", () => {
  setupDom();
  const { container } = render(<Button>Watch</Button>);
  const button = container.querySelector("button");
  if (!button) throw new Error("no button");
  assertEquals(button.className.includes("hover:-translate-y-px"), true);
  assertEquals(
    button.className.includes(
      "transition-[color,background-color,border-color,transform]",
    ),
    true,
  );
  assertEquals(
    button.className.includes("motion-reduce:hover:translate-y-0"),
    true,
  );
  assertEquals(
    button.className.includes("motion-reduce:transition-none"),
    true,
  );
});
