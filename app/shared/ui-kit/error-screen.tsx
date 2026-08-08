import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import { Button } from "./button.tsx";

export interface ErrorScreenProps {
  payload: AppErrorPayload;
  onHome?: () => void;
}

function recoveryLabel(payload: AppErrorPayload): string {
  return payload.recovery?.label ?? "Home";
}

export function ErrorScreen({ payload, onHome }: ErrorScreenProps) {
  return (
    <div
      role="alert"
      data-testid="error-screen"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-md px-lg text-center"
    >
      <h1 className="font-script text-display leading-tight text-brand-text">
        It isn&apos;t you, it&apos;s us
      </h1>
      <p className="max-w-[70ch] font-mono text-sm text-ink-muted text-pretty">
        {payload.message}
      </p>
      <code
        data-testid="error-code-caption"
        className="font-mono text-xs text-ink-faint select-all"
      >
        Code: {payload.code}
      </code>
      {onHome
        ? (
          <Button onClick={onHome} data-testid="home-button">
            {recoveryLabel(payload)}
          </Button>
        )
        : null}
    </div>
  );
}
