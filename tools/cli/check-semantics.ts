import { createPluginCheckRunner } from "./plugin-check-runner.ts";

const run = createPluginCheckRunner({
  commandName: "check-semantics",
  rulePrefix: "semantics",
});

if (import.meta.main) {
  Deno.exit(await run(Deno.args));
}

export { run as runCheckSemantics };
