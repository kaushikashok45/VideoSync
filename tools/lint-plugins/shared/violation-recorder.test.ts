import { assertEquals } from "@std/assert";
import { activeViolationRecorder } from "./violation-recorder.ts";

Deno.test("happy: defaults to null so ordinary lint runs pay nothing", () => {
  assertEquals(activeViolationRecorder.current, null);
});

Deno.test("edge: installing and clearing a recorder round-trips", () => {
  const seen: Array<[string, string, string]> = [];
  activeViolationRecorder.current = (path, identity, ruleId) => {
    seen.push([path, identity, ruleId]);
  };
  activeViolationRecorder.current?.("a.ts", "abc", "structural/complexity");
  activeViolationRecorder.current = null;
  assertEquals(seen, [["a.ts", "abc", "structural/complexity"]]);
  assertEquals(activeViolationRecorder.current, null);
});
