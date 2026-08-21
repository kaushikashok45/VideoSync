import { assert, assertEquals } from "@std/assert";
import { checkPipelineArtifacts } from "./pipeline-check.ts";

Deno.test("happy: no feature artifacts is an empty pipeline", () => {
  assertEquals(checkPipelineArtifacts(""), []);
});

Deno.test("sad: blocked readiness cannot have populated capabilities", () => {
  const files = new Map([
    [
      "docs/features/demo/00-brief.md",
      "# Brief\n- **Verdict**: PROCEED",
    ],
    [
      "docs/features/demo/01-prd.md",
      "## Readiness\n- **Status**: BLOCKED\n## Capabilities\n### CAP-1\n",
    ],
  ]);
  const failures = checkPipelineArtifacts("demo", files);
  assert(failures.some((failure) => failure.includes("BLOCKED")));
});

Deno.test("edge: a capability must trace through screen, slice, and test", () => {
  const files = new Map([
    [
      "docs/features/demo/00-brief.md",
      "- **Verdict**: PROCEED\n**Approved**: yes",
    ],
    [
      "docs/features/demo/01-prd.md",
      "## Readiness\n- **Status**: READY\n**Approved**: yes\n## Capabilities\n### CAP-1\n**Phase**: 1\n## Delivery phases\nCAP-1",
    ],
    ["docs/features/demo/02a-design.md", "**Approved**: yes\nscreen for CAP-1"],
    ["docs/features/demo/03-hld.md", "**Approved**: yes\nslice for CAP-1"],
    ["docs/features/demo/04-spec.md", 'CAP-1\nDeno.test("works", () => {})'],
  ]);
  assertEquals(checkPipelineArtifacts("demo", files), []);
});
