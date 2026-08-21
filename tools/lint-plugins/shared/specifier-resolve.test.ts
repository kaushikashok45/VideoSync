import { assert, assertEquals } from "@std/assert";
import { createResolver } from "./specifier-resolve.ts";

async function writeDenoJson(repoRoot: string): Promise<void> {
  await Deno.writeTextFile(
    `${repoRoot}/deno.json`,
    JSON.stringify({
      imports: {
        "~/": "./app/",
        "contracts/": "./shared/contracts/",
        "react": "npm:react@^19.0.0",
        "socket.io-client": "npm:socket.io-client@^4.8.1",
      },
    }),
  );
}

async function writeFixtureModules(repoRoot: string): Promise<void> {
  await Deno.mkdir(`${repoRoot}/app/features/entry-flow`, { recursive: true });
  await Deno.mkdir(`${repoRoot}/shared/contracts`, { recursive: true });
  await Deno.mkdir(`${repoRoot}/app/widgets/player-shell/model`, {
    recursive: true,
  });
  await Deno.writeTextFile(
    `${repoRoot}/app/features/entry-flow/index.ts`,
    "export {};\n",
  );
  await Deno.writeTextFile(
    `${repoRoot}/shared/contracts/room-meta.ts`,
    "export {};\n",
  );
}

async function fixture(): Promise<
  { repoRoot: string; denoJsonPath: string; fromFile: string }
> {
  const repoRoot = await Deno.makeTempDir();
  await writeDenoJson(repoRoot);
  await writeFixtureModules(repoRoot);
  const fromFile = `${repoRoot}/app/widgets/player-shell/model/store.ts`;
  await Deno.writeTextFile(fromFile, "export {};\n");
  return { repoRoot, denoJsonPath: `${repoRoot}/deno.json`, fromFile };
}

async function cleanup(repoRoot: string) {
  await Deno.remove(repoRoot, { recursive: true });
}

Deno.test("happy: ~/ alias resolves through app/", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("~/features/entry-flow", env.fromFile);
  assertEquals(resolved.raw, "~/features/entry-flow");
  assertEquals(resolved.kind, "alias");
  assertEquals(
    resolved.absolutePath,
    `${env.repoRoot}/app/features/entry-flow/index.ts`,
  );
  await cleanup(env.repoRoot);
});

Deno.test("happy: contracts/ alias resolves through shared/contracts/", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("contracts/room-meta", env.fromFile);
  assertEquals(resolved.kind, "alias");
  assertEquals(
    resolved.absolutePath,
    `${env.repoRoot}/shared/contracts/room-meta.ts`,
  );
  await cleanup(env.repoRoot);
});

Deno.test("happy: relative specifier resolves against fromFile's directory", async () => {
  const env = await fixture();
  await Deno.writeTextFile(
    `${env.repoRoot}/app/widgets/player-shell/model/helper.ts`,
    "export {};\n",
  );
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("./helper", env.fromFile);
  assertEquals(resolved.kind, "relative");
  assertEquals(
    resolved.absolutePath,
    `${env.repoRoot}/app/widgets/player-shell/model/helper.ts`,
  );
  await cleanup(env.repoRoot);
});

Deno.test("happy: bare npm specifier has null absolutePath and a bareName", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("socket.io-client", env.fromFile);
  assertEquals(resolved.kind, "bare");
  assertEquals(resolved.absolutePath, null);
  assertEquals(resolved.bareName, "socket.io-client");
  await cleanup(env.repoRoot);
});

Deno.test("sad: an alias prefix pointing at a nonexistent file is unresolvable", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("~/does/not/exist", env.fromFile);
  assertEquals(resolved.kind, "unresolvable");
  assertEquals(resolved.absolutePath, null);
  await cleanup(env.repoRoot);
});

Deno.test("sad: a bare specifier absent from deno.json still resolves gracefully as bare", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("left-pad", env.fromFile);
  assertEquals(resolved.kind, "bare");
  assertEquals(resolved.bareName, "left-pad");
  assertEquals(resolved.absolutePath, null);
  await cleanup(env.repoRoot);
});

Deno.test("edge: extensionless specifier resolves to index.ts when only the index file exists", async () => {
  const env = await fixture();
  await Deno.mkdir(`${env.repoRoot}/app/widgets/player-shell/model/sub`, {
    recursive: true,
  });
  await Deno.writeTextFile(
    `${env.repoRoot}/app/widgets/player-shell/model/sub/index.ts`,
    "export {};\n",
  );
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("./sub", env.fromFile);
  assertEquals(
    resolved.absolutePath,
    `${env.repoRoot}/app/widgets/player-shell/model/sub/index.ts`,
  );
  await cleanup(env.repoRoot);
});

Deno.test("edge: precedence -- a specifier matching both foo.ts and foo/index.ts resolves to foo.ts", async () => {
  const env = await fixture();
  const base = `${env.repoRoot}/app/widgets/player-shell/model`;
  await Deno.writeTextFile(`${base}/foo.ts`, "export {};\n");
  await Deno.mkdir(`${base}/foo`, { recursive: true });
  await Deno.writeTextFile(`${base}/foo/index.ts`, "export {};\n");
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("./foo", env.fromFile);
  assertEquals(
    resolved.absolutePath,
    `${base}/foo.ts`,
    "the documented precedence is exact, +.ts, +.tsx, /index.ts, /index.tsx",
  );
  await cleanup(env.repoRoot);
});

Deno.test("edge: .ts vs .tsx shadowing resolves .ts first per the documented precedence", async () => {
  const env = await fixture();
  const base = `${env.repoRoot}/app/widgets/player-shell/model`;
  await Deno.writeTextFile(`${base}/dual.ts`, "export {};\n");
  await Deno.writeTextFile(`${base}/dual.tsx`, "export {};\n");
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("./dual", env.fromFile);
  assertEquals(resolved.absolutePath, `${base}/dual.ts`);
  await cleanup(env.repoRoot);
});

Deno.test("edge: .. escaping the repo root does not throw and is honestly unresolvable when absent", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("../../outside", env.fromFile);
  assertEquals(resolved.raw, "../../outside");
  assertEquals(resolved.kind, "unresolvable");
  await cleanup(env.repoRoot);
});

Deno.test("mutation-guard: reordering the extension-inference list would break the precedence test", async () => {
  const env = await fixture();
  const base = `${env.repoRoot}/app/widgets/player-shell/model`;
  await Deno.writeTextFile(`${base}/order.tsx`, "export {};\n");
  await Deno.mkdir(`${base}/order`, { recursive: true });
  await Deno.writeTextFile(`${base}/order/index.ts`, "export {};\n");
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("./order", env.fromFile);
  // .tsx (candidate 3) must be picked over /index.ts (candidate 4).
  assertEquals(resolved.absolutePath, `${base}/order.tsx`);
  await cleanup(env.repoRoot);
});

Deno.test("logical-limits: raw is byte-identical to the input for every case, including unresolvable ones", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const specifiers = [
    "~/features/entry-flow",
    "contracts/room-meta",
    "./nope",
    "../../nope",
    "socket.io-client",
    "totally-unknown-package",
    "~/does/not/exist",
  ];
  for (const raw of specifiers) {
    const resolved = resolver.resolve(raw, env.fromFile);
    assertEquals(resolved.raw, raw);
  }
  await cleanup(env.repoRoot);
});

Deno.test("logical-limits: scoped npm packages extract the two-segment bareName", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve("@testing-library/react", env.fromFile);
  assertEquals(resolved.kind, "bare");
  assertEquals(resolved.bareName, "@testing-library/react");
  await cleanup(env.repoRoot);
});

Deno.test("logical-limits: bare specifier with a subpath extracts only the package name", async () => {
  const env = await fixture();
  const resolver = createResolver(env.denoJsonPath);
  const resolved = resolver.resolve(
    "socket.io-client/build/esm/socket",
    env.fromFile,
  );
  assert(resolved.kind === "bare");
  assertEquals(resolved.bareName, "socket.io-client");
  await cleanup(env.repoRoot);
});
