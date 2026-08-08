import type { ErrorCode } from "./error-code.ts";
import type { Recovery } from "./recovery.ts";

export interface AppErrorPayload {
  code: ErrorCode;
  message: string;
  recovery?: Recovery;
  detail?: Record<string, unknown>;
}
