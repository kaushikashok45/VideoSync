export function deriveLocalTitle(fileName: string | null): string {
  if (fileName == null) return "Local video";
  const withoutExtension = fileName.trim().replace(/\.[^.]+$/, "");
  const decoded = decodeFileName(withoutExtension).trim();
  return decoded === "" ? "Local video" : decoded;
}

function decodeFileName(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
