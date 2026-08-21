import { assertEquals } from "@std/assert";
import { generateMutants } from "./mutants.ts";

const SEVEN_OPERATOR_FIXTURE = [
  "function f(x, items) {",
  "  if (!x) return;",
  "  if (x === 1) { g(items[0], true, 4); h({ a: 1, b: 2 }); }",
  "  return x ? 1 : 2;",
  "}",
].join("\n");

function descriptionsOf(source: string): readonly string[] {
  return generateMutants(source, "probe.ts").map((mutant) =>
    mutant.description
  );
}

Deno.test("happy: comparison-flip, guard-removal, and dropped-property all fire on one fixture", () => {
  const descriptions = descriptionsOf(SEVEN_OPERATOR_FIXTURE);
  assertEquals(descriptions.includes("=== → !=="), true, "flip");
  assertEquals(descriptions.includes("guard clause removed"), true, "guard");
  const hasDroppedProperty = descriptions.some((description) =>
    description.startsWith("dropped property")
  );
  assertEquals(hasDroppedProperty, true, "dropped property");
});

Deno.test("happy: off-by-one, boolean-swap, array-index-shift, and condition-negation all fire on one fixture", () => {
  const descriptions = descriptionsOf(SEVEN_OPERATOR_FIXTURE);
  assertEquals(descriptions.includes("4 → 5"), true, "off-by-one");
  assertEquals(descriptions.includes("true → false"), true, "boolean swap");
  assertEquals(descriptions.includes("index 0 → 1"), true, "index shift");
  const negations = descriptions.filter((description) =>
    description === "condition negated"
  );
  assertEquals(negations.length, 3, "negation (if, if, ternary)");
});

Deno.test("happy: one mutation per mutant -- every other site stays untouched", () => {
  const mutants = generateMutants("x === 1 ? true : 2;", "probe.ts");
  const flipped = mutants.find((mutant) => mutant.description === "=== → !==");
  assertEquals(flipped?.source, "x !== 1 ? true : 2;");
});

Deno.test("edge: source with no operator-eligible sites produces no mutants", () => {
  assertEquals(generateMutants("const s = 'literal';", "probe.ts"), []);
});
