import { assertEquals } from "@std/assert";
import { collectSpecifierSites } from "./specifier-sites.ts";

Deno.test("happy: a static import is collected", () => {
  const sites = collectSpecifierSites(
    "f.ts",
    'import { a } from "./a.ts";\n',
  );
  assertEquals(sites, ["./a.ts"]);
});

Deno.test("edge: a dynamic import() with a literal argument is collected", () => {
  const sites = collectSpecifierSites(
    "f.ts",
    'const a = () => import("./a.ts");\n',
  );
  assertEquals(sites, ["./a.ts"]);
});

Deno.test("edge: a dynamic import() with a computed argument is not collected (documented blind spot)", () => {
  const sites = collectSpecifierSites(
    "f.ts",
    "const name = pick();\nconst a = () => import(name);\n",
  );
  assertEquals(sites, []);
});

Deno.test("edge: export {x} from is collected as an edge source", () => {
  const sites = collectSpecifierSites(
    "f.ts",
    'export { a } from "./a.ts";\n',
  );
  assertEquals(sites, ["./a.ts"]);
});

Deno.test("edge: export * from is collected as an edge source", () => {
  const sites = collectSpecifierSites("f.ts", 'export * from "./a.ts";\n');
  assertEquals(sites, ["./a.ts"]);
});

Deno.test("sad: a plain export with no source contributes nothing", () => {
  const sites = collectSpecifierSites("f.ts", "export const a = 1;\n");
  assertEquals(sites, []);
});

Deno.test("happy: multiple edge sources in one file are all collected in order", () => {
  const source = 'import { a } from "./a.ts";\n' +
    'export { b } from "./b.ts";\n' +
    'export * from "./c.ts";\n';
  assertEquals(collectSpecifierSites("f.ts", source), [
    "./a.ts",
    "./b.ts",
    "./c.ts",
  ]);
});
