const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateRoomCode(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

export function isValidRoomCode(code: string, length = 5): boolean {
  if (typeof code !== "string") return false;
  if (code.length !== length) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}
