import { Spinner } from "~/shared/ui-kit/index.ts";

export default function UploadWaiting() {
  return (
    <div
      data-testid="upload-waiting"
      aria-label="Waiting for the stream"
      className="absolute inset-0 flex flex-col items-center justify-center gap-md bg-bg"
    >
      <Spinner size="lg" className="animate-pulse-soft" />
      <p className="font-mono text-sm text-ink-muted">Waiting for the stream</p>
    </div>
  );
}
