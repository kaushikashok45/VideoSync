import { assertEquals } from "@std/assert";
import { complexityLimit } from "./complexity-limit.ts";
import { classify } from "./fsd-path.ts";

const REPO = "/repo";

Deno.test("happy: logic code gets the ≤2 limit", () => {
  const fsd = classify(`${REPO}/app/features/chat/model/store.ts`);
  assertEquals(complexityLimit(fsd), 2);
});

Deno.test("happy: presentation .tsx under ui/ gets the ≤4 limit", () => {
  const fsd = classify(`${REPO}/app/features/chat/ui/Panel.tsx`);
  assertEquals(complexityLimit(fsd), 4);
});

Deno.test("edge: legacy components/ .tsx also gets the ≤4 limit (migration incentive)", () => {
  const fsd = classify(`${REPO}/app/features/entry-flow/components/Panel.tsx`);
  assertEquals(complexityLimit(fsd), 4);
});

Deno.test("edge: a tools/** file gets the carve-out ≤4 limit despite not being presentation", () => {
  const fsd = classify(`${REPO}/tools/cli/governed-diff.ts`);
  assertEquals(fsd.isPresentation, false);
  assertEquals(complexityLimit(fsd), 4);
});

Deno.test("edge: a .ts file under ui/ is logic, not presentation, so it gets ≤2", () => {
  const fsd = classify(`${REPO}/app/features/chat/ui/helpers.ts`);
  assertEquals(fsd.isPresentation, false);
  assertEquals(complexityLimit(fsd), 2);
});

Deno.test("mutation-guard: the tools branch and the isPresentation branch are independently reachable", () => {
  const toolsLogic = classify(
    `${REPO}/tools/lint-plugins/structural-plugin.ts`,
  );
  const appPresentation = classify(`${REPO}/app/features/chat/ui/Panel.tsx`);
  const appLogic = classify(`${REPO}/app/features/chat/model/store.ts`);
  assertEquals(complexityLimit(toolsLogic), 4);
  assertEquals(complexityLimit(appPresentation), 4);
  assertEquals(complexityLimit(appLogic), 2);
});
