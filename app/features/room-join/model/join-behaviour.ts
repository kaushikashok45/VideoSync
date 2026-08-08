import { useState } from "react";

export const NAME_MAX = 60;
export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export interface JoinInput {
  name: string;
  code: string;
}

export interface JoinResult {
  nameError: string | null;
  codeError: string | null;
}

export interface JoinBehaviourDeps {
  onJoin: (name: string, code: string) => void;
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toLowerCase();
}

export function generateRoomCode(length = ROOM_CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    out += ROOM_CODE_ALPHABET[idx];
  }
  return out;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Enter your name to join the party.";
  if (trimmed.length > NAME_MAX) {
    return `Name must be ${NAME_MAX} characters or fewer.`;
  }
  return null;
}

export function validateRoomCode(code: string): string | null {
  const normalized = normalizeRoomCode(code);
  if (normalized === "") return "Enter the room code.";
  if (normalized.length !== ROOM_CODE_LENGTH) {
    return `Room codes are ${ROOM_CODE_LENGTH} characters.`;
  }
  const hasInvalidChar = [...normalized].some(
    (ch) => !ROOM_CODE_ALPHABET.includes(ch),
  );
  if (hasInvalidChar) return "Room code contains invalid characters.";
  return null;
}

export function submitJoin(
  input: JoinInput,
  onJoin: (name: string, code: string) => void,
): JoinResult {
  const nameError = validateName(input.name);
  const codeError = validateRoomCode(input.code);
  if (nameError !== null || codeError !== null) {
    return { nameError, codeError };
  }
  onJoin(input.name.trim(), normalizeRoomCode(input.code));
  return { nameError: null, codeError: null };
}

export function useJoinBehaviour({ onJoin }: JoinBehaviourDeps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const submit = () => {
    const result = submitJoin({ name, code }, onJoin);
    setNameError(result.nameError);
    setCodeError(result.codeError);
  };

  return { name, code, nameError, codeError, setName, setCode, submit };
}
