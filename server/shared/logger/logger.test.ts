import { assertEquals } from "@std/assert";
import { createLogger } from "./logger.ts";

// Logical limit: exactly-at-level included, below filtered
Deno.test("logger filters below the configured level", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "warn", sink: (l) => lines.push(l) });
  log.debug("d");
  log.info("i");
  log.warn("w");
  log.error("e");
  assertEquals(lines.length, 2);
  assertEquals(lines[0].includes('"level":"warn"'), true);
  assertEquals(lines[1].includes('"level":"error"'), true);
});

// Happy path: debug level includes everything
Deno.test("logger at debug level emits all levels", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "debug", sink: (l) => lines.push(l) });
  log.debug("d");
  log.error("e");
  assertEquals(lines.length, 2);
});

// Happy path + mutation: fields are merged into the JSON line
Deno.test("logger includes structured fields", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "info", sink: (l) => lines.push(l) });
  log.info("joined", { code: "abcde" });
  const parsed = JSON.parse(lines[0]);
  assertEquals(parsed.msg, "joined");
  assertEquals(parsed.code, "abcde");
});
