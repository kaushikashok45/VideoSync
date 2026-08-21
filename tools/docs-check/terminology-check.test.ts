import { assert, assertEquals } from "@std/assert";
import { checkTerminology } from "./terminology-check.ts";

const PRODUCT_MODEL = [
  "## Terminology ontology",
  "",
  "### Canonical terms and banned synonyms",
  "",
  "| Concept | Canonical | Banned as a synonym | Notes |",
  "|---|---|---|---|",
  "| the shared viewing space | **room** | `party`, `lobby`, `session` | note |",
  "| a person in a room | **member** | `participant`, `guest` | note |",
  "",
  "### Distinct terms that only look like synonyms",
  "",
  "| Term | Means | Not to be confused with |",
  "|---|---|---|",
  "| **session** | local context | **room** |",
  "| **peer** | a connection | **member** |",
  "",
  "### Grandfathered — frozen, never extended",
  "",
  "| Term | Where | Rule |",
  "|---|---|---|",
  "| `Weird*` | 1 file | frozen |",
].join("\n");

function withFixture(
  files: Record<string, string>,
  run: (root: string) => void,
) {
  const root = Deno.makeTempDirSync();
  for (const [path, contents] of Object.entries(files)) {
    const fullPath = `${root}/${path}`;
    Deno.mkdirSync(fullPath.slice(0, fullPath.lastIndexOf("/")), {
      recursive: true,
    });
    Deno.writeTextFileSync(fullPath, contents);
  }
  try {
    run(root);
  } finally {
    Deno.removeSync(root, { recursive: true });
  }
}

Deno.test("happy: session and peer are never flagged despite being banned-looking", () => {
  withFixture(
    {
      "app/a.ts":
        "const session = useSession(); const peer = new SimplePeer();",
    },
    (root) => {
      const failures = checkTerminology(PRODUCT_MODEL, root, {});
      assertEquals(failures, []);
    },
  );
});

Deno.test("sad: a banned synonym over its ratchet ceiling fails", () => {
  withFixture(
    { "app/a.ts": "const party = 1;" },
    (root) => {
      const failures = checkTerminology(PRODUCT_MODEL, root, { party: 0 });
      assert(failures.some((failure) => failure.startsWith("party:")));
    },
  );
});

Deno.test("edge: a grandfathered term at its baseline ceiling passes", () => {
  withFixture(
    { "app/a.ts": "class WeirdThing {}" },
    (root) => {
      const failures = checkTerminology(PRODUCT_MODEL, root, { "weird*": 1 });
      assertEquals(failures, []);
    },
  );
});

Deno.test("logical-limits: a grandfathered term exceeding its ceiling fails loudly", () => {
  withFixture(
    { "app/a.ts": "class WeirdA {}\nclass WeirdB {}" },
    (root) => {
      const failures = checkTerminology(PRODUCT_MODEL, root, { "weird*": 1 });
      assert(failures.some((failure) => failure.startsWith("Weird*:")));
    },
  );
});
