import { assertEquals } from "@std/assert";
import { classify } from "../lint-plugins/shared/fsd-path.ts";
import { isFloorScoped } from "./scope.ts";

const REPO = "/repo";

Deno.test("happy: model/ code is in scope", () => {
  assertEquals(
    isFloorScoped(classify(`${REPO}/app/features/chat/model/store.ts`)),
    true,
  );
});

Deno.test("edge: entities/** code is in scope regardless of role", () => {
  assertEquals(
    isFloorScoped(classify(`${REPO}/app/entities/room/model/room.ts`)),
    true,
  );
});

Deno.test("sad: ui/ presentation code is out of scope", () => {
  assertEquals(
    isFloorScoped(classify(`${REPO}/app/features/chat/ui/Panel.tsx`)),
    false,
  );
});

Deno.test("logical-limits: a contracts .d.ts is out of scope", () => {
  assertEquals(
    isFloorScoped(classify(`${REPO}/tools/contracts/fsd-path.d.ts`)),
    false,
  );
});
