import type { AppErrorPayload } from "./app-error-payload.ts";
import type { ErrorCode } from "./error-code.ts";
import { ERROR_DEFS } from "./error-messages.ts";
import type { Recovery } from "./recovery.ts";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly recovery?: Recovery;
  readonly detail?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    opts: { recovery?: Recovery; detail?: Record<string, unknown> } = {},
  ) {
    super(ERROR_DEFS[code].message);
    this.name = "AppError";
    this.code = code;
    this.recovery = opts.recovery ?? ERROR_DEFS[code].recovery;
    this.detail = opts.detail;
  }

  toJSON(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      recovery: this.recovery,
      detail: this.detail,
    };
  }
}
