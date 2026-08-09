import type { ErrorCode } from "contracts/error-code.ts";
import { TriangleAlert } from "lucide-react";

export interface InlineErrorProps {
  message: string;
  code?: ErrorCode;
  className?: string;
}

export function InlineError(
  { message, code, className = "" }: InlineErrorProps,
) {
  return (
    <p
      role="alert"
      data-testid="inline-error"
      className={`flex items-start gap-xs font-mono text-sm text-status-danger ${className}`}
    >
      <TriangleAlert className="mt-[2px] h-4 w-4 shrink-0" />
      <span>
        <span className="block">{message}</span>
        {code
          ? (
            <code
              data-testid="error-code"
              className="block text-xs text-ink-faint select-all"
            >
              Code: {code}
            </code>
          )
          : null}
      </span>
    </p>
  );
}
