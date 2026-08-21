import { AppError } from "../../../shared/contracts/app-error.ts";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const VALIDATION_CODE_MALFORMED = "VALIDATION_CODE_MALFORMED";
const DEFAULT_CODE_LENGTH = 5;

/**
 * Branded so a bare `string` can never be handed to a call expecting a
 * validated room code -- the parse-don't-validate exemplar (see `ERD.md`,
 * `docs/DECISIONS.md#ad-013`). Produced only by `parseRoomCode` below.
 */
export type RoomCode = string & { readonly __brand: "RoomCode" };

export function generateRoomCode(length = DEFAULT_CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

/**
 * The one format check, expressed as a type guard so `parseRoomCode` can
 * narrow to `RoomCode` without an `as` assertion -- narrowing a checked
 * binding is TypeScript's other route to a nominal type.
 */
function hasValidLength(code: string, length: number): boolean {
  return typeof code === "string" && code.length === length;
}

function isRoomCodeFormat(code: string, length: number): code is RoomCode {
  if (!hasValidLength(code, length)) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}

/** Non-throwing: callers that must not throw on untrusted input (`RoomStore.get`). */
export function isValidRoomCode(
  code: string,
  length = DEFAULT_CODE_LENGTH,
): boolean {
  return isRoomCodeFormat(code, length);
}

/** The one throwing boundary: construct a `RoomCode` or refuse. */
export function parseRoomCode(
  raw: string,
  length = DEFAULT_CODE_LENGTH,
): RoomCode {
  if (!isRoomCodeFormat(raw, length)) {
    throw new AppError(VALIDATION_CODE_MALFORMED);
  }
  return raw;
}
