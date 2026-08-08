import { useEffect, useState } from "react";

export function useLocalFileSource(
  mode: "host" | "receiver",
  file: File | null,
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "host" || file === null) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mode, file]);

  return objectUrl;
}
