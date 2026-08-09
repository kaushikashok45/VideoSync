import { assertEquals } from "@std/assert";
import { formatRuntime } from "./format-runtime.ts";

Deno.test("formats a runtime with hours and minutes", () => {
  assertEquals(formatRuntime(132 * 60), "2 hr 12 mins");
});

Deno.test("formats minute-only and hour-only runtimes", () => {
  assertEquals(formatRuntime(45 * 60), "45 mins");
  assertEquals(formatRuntime(2 * 60 * 60), "2 hr");
});

Deno.test("rejects missing, negative, and invalid runtimes", () => {
  assertEquals(formatRuntime(null), null);
  assertEquals(formatRuntime(-1), null);
  assertEquals(formatRuntime(Number.NaN), null);
});
