import { assertEquals } from "@std/assert";
import { createLocalMetadata } from "./create-local-metadata.ts";

Deno.test("local metadata keeps the human movie title from the filename", () => {
  const metadata = createLocalMetadata("Parimala%20and%20Co.Final.mp4");
  assertEquals(metadata.title, "Parimala and Co.Final");
  assertEquals(metadata.overview, "A local video ready for your watch party.");
});

Deno.test("local metadata stays safe for empty filenames", () => {
  assertEquals(createLocalMetadata(".mp4").title, "Local video");
});
