import { assertEquals } from "@std/assert";
import { formatPlaybackTime } from "./format-playback-time.ts";

Deno.test("formats playback time as minutes and seconds", () => {
  assertEquals(formatPlaybackTime(65.8), "00:01:05");
  assertEquals(formatPlaybackTime(7800), "02:10:00");
});

Deno.test("formats empty and invalid durations as zero", () => {
  assertEquals(formatPlaybackTime(0), "00:00:00");
  assertEquals(formatPlaybackTime(Number.NaN), "00:00:00");
});
