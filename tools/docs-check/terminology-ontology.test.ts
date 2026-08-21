import { assertEquals } from "@std/assert";
import { parseOntology } from "./terminology-ontology.ts";

const FIXTURE = [
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
  "| `Weird*` | 3 files | frozen |",
  "| legacy constants (`app/legacy/constants.ts`) | one file | frozen |",
].join("\n");

Deno.test("happy: parses all three ontology tables from their own headings", () => {
  const ontology = parseOntology(FIXTURE);
  assertEquals(ontology.canonicalBanned, [
    "party",
    "lobby",
    "session",
    "participant",
    "guest",
  ]);
  assertEquals(ontology.distinctTerms, ["session", "peer"]);
  assertEquals(ontology.grandfathered, [{
    term: "Weird*",
    evidenceText: "3 files",
  }]);
});

Deno.test("sad: a missing ontology section parses to empty lists", () => {
  const ontology = parseOntology("# Unrelated doc\nJust prose.");
  assertEquals(ontology, {
    canonicalBanned: [],
    distinctTerms: [],
    grandfathered: [],
  });
});

Deno.test("edge: a grandfathered row whose only backtick span is a file path is not scannable", () => {
  const ontology = parseOntology(FIXTURE);
  assertEquals(
    ontology.grandfathered.some((entry) => entry.term.includes("/")),
    false,
  );
});
