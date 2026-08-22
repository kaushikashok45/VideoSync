import { assert, assertEquals } from "@std/assert";
import { checkPipelineArtifacts } from "./pipeline-check.ts";

/** A fully-cleared prerequisite chain through 02a-design.md, one override away
 * from failing whichever single gate a test wants to exercise. */
function clearedThroughDesign(
  overrides: Record<string, string> = {},
): Map<string, string> {
  const base: Record<string, string> = {
    "docs/features/demo/00-brief.md": "**Verdict**: PROCEED\n**Approved**: yes",
    "docs/features/demo/01-prd.md":
      "## Readiness\n- **Status**: READY\n**Approved**: yes",
    "docs/features/demo/01b-brand-alignment.md":
      "**Verdict**: CLEAR\n**Approved**: yes",
    "docs/features/demo/01c-page-strategy.md":
      "Status: APPROVED\n**Approved**: yes",
    "docs/features/demo/01d-creative-direction.md":
      "Status: APPROVED\n**Approved**: yes",
    "docs/features/demo/01e-visual-identity.md":
      "Visual Identity Version: 1.0\nStatus: APPROVED\n**Approved**: yes",
    "docs/features/demo/02a-design.md": "**Approved**: yes",
    ...overrides,
  };
  return new Map(Object.entries(base));
}

Deno.test("happy: no feature artifacts is an empty pipeline", () => {
  assertEquals(checkPipelineArtifacts(""), []);
});

Deno.test("sad: blocked readiness cannot have populated capabilities", () => {
  const files = new Map([
    ["docs/features/demo/00-brief.md", "# Brief\n- **Verdict**: PROCEED"],
    [
      "docs/features/demo/01-prd.md",
      "## Readiness\n- **Status**: BLOCKED\n## Capabilities\n### CAP-1\n",
    ],
  ]);
  const failures = checkPipelineArtifacts("demo", files);
  assert(failures.some((failure) => failure.includes("BLOCKED")));
});

Deno.test("edge: a capability must trace through screen, slice, and test", () => {
  const files = clearedThroughDesign({
    "docs/features/demo/01-prd.md":
      "## Readiness\n- **Status**: READY\n**Approved**: yes\n## Capabilities\n### CAP-1\n**Phase**: 1\n## Delivery phases\nCAP-1",
    "docs/features/demo/02a-design.md": "**Approved**: yes\nscreen for CAP-1",
    "docs/features/demo/03-hld.md": "**Approved**: yes\nslice for CAP-1",
    "docs/features/demo/04-spec.md": 'CAP-1\nDeno.test("works", () => {})',
  });
  assertEquals(checkPipelineArtifacts("demo", files), []);
});

Deno.test("sad: 02a-design.md requires 01c-page-strategy.md approved", () => {
  const files = clearedThroughDesign({
    "docs/features/demo/01c-page-strategy.md":
      "Status: REVIEW\n**Approved**: no",
  });
  const failures = checkPipelineArtifacts("demo", files);
  assert(failures.some((failure) => failure.includes("01c-page-strategy.md")));
});

Deno.test("sad: 02a-design.md requires 01d-creative-direction.md approved", () => {
  const files = clearedThroughDesign({
    "docs/features/demo/01d-creative-direction.md":
      "Status: REVIEW\n**Approved**: no",
  });
  const failures = checkPipelineArtifacts("demo", files);
  assert(
    failures.some((failure) => failure.includes("01d-creative-direction.md")),
  );
});

Deno.test("sad: 02a-design.md requires 01e-visual-identity.md approved", () => {
  const files = clearedThroughDesign({
    "docs/features/demo/01e-visual-identity.md":
      "Status: REVIEW\n**Approved**: no",
  });
  const failures = checkPipelineArtifacts("demo", files);
  assert(
    failures.some((failure) => failure.includes("01e-visual-identity.md")),
  );
});

Deno.test("sad: 02a-design.md requires 01b-brand-alignment.md approved", () => {
  const files = clearedThroughDesign({
    "docs/features/demo/01b-brand-alignment.md":
      "**Verdict**: BLOCKED\n**Approved**: no",
  });
  const failures = checkPipelineArtifacts("demo", files);
  assert(
    failures.some((failure) => failure.includes("01b-brand-alignment.md")),
  );
});
