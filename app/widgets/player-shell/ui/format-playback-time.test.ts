import { assertEquals } from "@std/assert";
import { formatPlaybackTime } from "./format-playback-time.ts";

Deno.test("formats playback time as minutes and seconds", () => {
  assertEquals(formatPlaybackTime(65.8), "1:05");
});

Deno.test("formats empty and invalid durations as zero", () => {
  assertEquals(formatPlaybackTime(0), "0:00");
  assertEquals(formatPlaybackTime(Number.NaN), "0:00");
});
