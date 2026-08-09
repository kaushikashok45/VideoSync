import { useEffect, useState } from "react";
import type { MediaSource } from "contracts/media-source.ts";

export function useMediaPreviewSource(
  source: MediaSource | null,
  file: File | null,
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const mode = source?.mode ?? null;
  const url = source?.mode === "url" ? source.url : null;

  useEffect(() => {
    if (mode !== "upload" || file === null) {
      setObjectUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [mode, file]);

  if (url) return url;
  return objectUrl;
}
