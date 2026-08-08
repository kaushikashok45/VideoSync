import { Spinner } from "~/shared/ui-kit/index.ts";

export interface UploadWaitingProps {
  mode: "host" | "receiver";
}

export default function UploadWaiting({ mode }: UploadWaitingProps) {
  const label = mode === "host" ? "Loading your video" : "Waiting for the host";
  return (
    <div
      data-testid="upload-waiting"
      aria-label={label}
      className="absolute inset-0 flex flex-col items-center justify-center gap-md bg-bg"
    >
      <Spinner size="lg" className="animate-pulse-soft" />
      <p className="font-mono text-sm text-ink-muted">{label}</p>
    </div>
  );
}
