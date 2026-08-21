import { assertEquals } from "@std/assert";
import { classify } from "../lint-plugins/shared/fsd-path.ts";
import { sliceKeyOf } from "./slice-key.ts";

Deno.test("happy: a sliced path yields root/layerName/slice", () => {
  const fsd = classify("/repo/app/features/f1/model/thing.ts");
  assertEquals(sliceKeyOf(fsd), "app/features/f1");
});

Deno.test("sad: a path with no slice yields null", () => {
  const fsd = classify("/repo/app/shared/api/socket.ts");
  assertEquals(sliceKeyOf(fsd), null);
});

Deno.test("edge: two slices with the same name under different roots key differently", () => {
  const appFsd = classify("/repo/app/features/room/model/thing.ts");
  const serverFsd = classify("/repo/server/features/room/model/thing.ts");
  assertEquals(sliceKeyOf(appFsd), "app/features/room");
  assertEquals(sliceKeyOf(serverFsd), "server/features/room");
});
