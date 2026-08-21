import { createPluginCheckRunner } from "./plugin-check-runner.ts";

const run = createPluginCheckRunner({
  commandName: "check-dumb-ui",
  rulePrefix: "dumb-ui",
});

if (import.meta.main) {
  Deno.exit(await run(Deno.args));
}

export { run as runCheckDumbUi };
