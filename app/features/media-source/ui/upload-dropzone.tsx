import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

export interface UploadDropzoneProps {
  onFile: (file: File) => void;
}

export default function UploadDropzone({ onFile }: UploadDropzoneProps) {
  const [chosenName, setChosenName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const chooseFile = (file: File | undefined) => {
    if (file === undefined) return;
    setChosenName(file.name);
    onFile(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div
      data-testid="upload-dropzone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-40 flex-col items-center justify-center gap-sm rounded-md border border-dashed p-lg text-center transition-[background-color,border-color] duration-200 motion-reduce:transition-none ${
        dragging
          ? "border-brand-text bg-brand-soft"
          : "border-line-strong bg-surface-sunken hover:border-ink-faint hover:bg-surface-raised"
      }`}
    >
      <label
        htmlFor="file-input"
        className="flex w-full cursor-pointer flex-col items-center gap-sm focus-within:ring-2 focus-within:ring-brand-text"
      >
        <span className="font-mono text-sm font-semibold text-ink">
          {chosenName ?? "Drag a video here, or click to browse"}
        </span>
        <span className="font-mono text-xs text-ink-muted">
          mp4 · mkv · webm · mov
        </span>
      </label>
      <input
        id="file-input"
        type="file"
        data-testid="file-input"
        accept=".mkv,.mp4,.webm,.mov,video/*"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
