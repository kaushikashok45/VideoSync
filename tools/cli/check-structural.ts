import { createPluginCheckRunner } from "./plugin-check-runner.ts";

const run = createPluginCheckRunner({
  commandName: "check-structural",
  rulePrefix: "structural",
});

if (import.meta.main) {
  Deno.exit(await run(Deno.args));
}

export { run as runCheckStructural };
