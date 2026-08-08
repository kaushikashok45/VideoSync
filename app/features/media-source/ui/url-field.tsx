import type { ChangeEvent } from "react";
import { TextField } from "~/shared/ui-kit/index.ts";

export interface UrlFieldProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

export default function UrlField({
  value,
  onChange,
  error,
}: UrlFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-sm">
      <TextField
        label="Video URL"
        placeholder="https://example.com/movie"
        value={value}
        error={error ?? undefined}
        onChange={handleChange}
      />
      <p className="font-mono text-xs text-ink-faint">
        Metadata is looked up automatically when you start watching.
      </p>
    </div>
  );
}
