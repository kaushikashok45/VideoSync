export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

export interface LoggerDeps {
  level: LogLevel;
  sink?: (line: string) => void;
}

const ORDER: LogLevel[] = ["debug", "info", "warn", "error"];

export function createLogger(deps: LoggerDeps): Logger {
  const threshold = ORDER.indexOf(deps.level);
  const write = deps.sink ?? ((line: string) => console.log(line));

  function log(
    level: LogLevel,
    msg: string,
    fields?: Record<string, unknown>,
  ): void {
    if (ORDER.indexOf(level) < threshold) return;
    write(
      JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields }),
    );
  }

  return {
    debug: (m, f) => log("debug", m, f),
    info: (m, f) => log("info", m, f),
    warn: (m, f) => log("warn", m, f),
    error: (m, f) => log("error", m, f),
  };
}
