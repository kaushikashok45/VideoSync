import { AppError } from "contracts/app-error.ts";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ErrorCode } from "contracts/error-code.ts";
import { ERROR_DEFS } from "contracts/error-messages.ts";

export type ErrorSeverity = "recoverable" | "terminal";

interface RouteErrorLike {
  status: number;
  statusText: string;
  data: unknown;
}

const INTERNAL_PAYLOAD: AppErrorPayload = {
  code: "SERVER_INTERNAL",
  message: ERROR_DEFS.SERVER_INTERNAL.message,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRouteErrorLike(value: unknown): value is RouteErrorLike {
  return isRecord(value) && typeof value.status === "number" &&
    typeof value.statusText === "string" && "data" in value;
}

function isPayloadLike(value: unknown): value is AppErrorPayload {
  return isRecord(value) && typeof value.code === "string" &&
    typeof value.message === "string" &&
    value.code in ERROR_DEFS;
}

function routeErrorPayload(value: RouteErrorLike): AppErrorPayload {
  if (value.status === 404) {
    return {
      code: "ROOM_NOT_FOUND",
      message: ERROR_DEFS.ROOM_NOT_FOUND.message,
      recovery: ERROR_DEFS.ROOM_NOT_FOUND.recovery,
    };
  }
  return INTERNAL_PAYLOAD;
}

export function toAppErrorPayload(error: unknown): AppErrorPayload {
  if (error instanceof AppError) return error.toJSON();
  if (isRouteErrorLike(error)) return routeErrorPayload(error);
  if (isPayloadLike(error)) return error;
  return INTERNAL_PAYLOAD;
}

export function severityOf(code: ErrorCode): ErrorSeverity {
  return ERROR_DEFS[code]?.recovery ? "recoverable" : "terminal";
}
