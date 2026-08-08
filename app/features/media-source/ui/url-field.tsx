import type { ChangeEvent } from "react";
import { Button, TextField } from "~/shared/ui-kit/index.ts";

export interface UrlFieldProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  onLookup: () => void;
}

export default function UrlField({
  value,
  onChange,
  error,
  onLookup,
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
      <div className="flex justify-end">
        <Button
          variant="secondary"
          data-testid="lookup-button"
          onClick={onLookup}
        >
          Look up metadata
        </Button>
      </div>
    </div>
  );
}
