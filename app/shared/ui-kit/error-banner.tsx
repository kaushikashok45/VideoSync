import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import { X } from "lucide-react";
import { Button } from "./button.tsx";
import { IconButton } from "./icon-button.tsx";

export interface ErrorBannerProps {
  payload: AppErrorPayload;
  onDismiss: () => void;
  onRecover?: () => void;
}

export function ErrorBanner(
  { payload, onDismiss, onRecover }: ErrorBannerProps,
) {
  const recovery = payload.recovery;
  return (
    <div
      role="alert"
      data-testid="error-banner"
      className="flex items-start gap-md rounded-md border border-status-danger/40 bg-surface-raised px-md py-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm text-ink">{payload.message}</p>
        {recovery && onRecover
          ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRecover}
              data-testid="recover-button"
            >
              {recovery.label}
            </Button>
          )
          : null}
      </div>
      <IconButton label="Dismiss" onClick={onDismiss}>
        <X className="h-5 w-5" />
      </IconButton>
    </div>
  );
}
