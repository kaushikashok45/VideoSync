import { assertEquals } from "@std/assert";
import {
  generateRoomCode,
  NAME_MAX,
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  submitJoin,
  validateName,
  validateRoomCode,
} from "./join-behaviour.ts";

// Happy path: valid name + valid code join with normalized values
Deno.test("submitJoin trims the name and normalizes the code before joining", () => {
  const joined: Array<{ name: string; code: string }> = [];
  const result = submitJoin(
    { name: "  Ada  ", code: " ABC23 " },
    (name, code) => joined.push({ name, code }),
  );
  assertEquals(result, { nameError: null, codeError: null });
  assertEquals(joined, [{ name: "Ada", code: "abc23" }]);
});

Deno.test("validateName accepts a non-empty trimmed name", () => {
  assertEquals(validateName("Ada"), null);
  assertEquals(validateName("  Ada  "), null);
});

Deno.test("validateRoomCode accepts a valid 5-char code", () => {
  assertEquals(validateRoomCode("abc23"), null);
});

// Sad path: validation errors, no join
Deno.test("submitJoin rejects an empty name without joining", () => {
  const joined: string[] = [];
  const result = submitJoin(
    { name: "", code: "abc23" },
    (name) => joined.push(name),
  );
  assertEquals(result.nameError, "Enter your name to join the party.");
  assertEquals(result.codeError, null);
  assertEquals(joined.length, 0);
});

Deno.test("submitJoin rejects a malformed room code without joining", () => {
  const joined: string[] = [];
  const result = submitJoin(
    { name: "Ada", code: "ab!" },
    (name) => joined.push(name),
  );
  assertEquals(result.nameError, null);
  assertEquals(result.codeError, "Room codes are 5 characters.");
  assertEquals(joined.length, 0);
});

Deno.test("submitJoin reports both errors when both fields are invalid", () => {
  const joined: string[] = [];
  const result = submitJoin(
    { name: "", code: "abc" },
    (name) => joined.push(name),
  );
  assertEquals(result.nameError, "Enter your name to join the party.");
  assertEquals(result.codeError, "Room codes are 5 characters.");
  assertEquals(joined.length, 0);
});

// Edge cases: boundaries and normalization
Deno.test("validateRoomCode rejects an empty or too-short code", () => {
  assertEquals(validateRoomCode(""), "Enter the room code.");
  assertEquals(validateRoomCode("abc2"), "Room codes are 5 characters.");
});

Deno.test("validateRoomCode rejects codes longer than 5 characters", () => {
  assertEquals(validateRoomCode("abc234"), "Room codes are 5 characters.");
});

Deno.test("uppercase and whitespace-padded codes are normalized to lowercase", () => {
  assertEquals(validateRoomCode("  ABC23  "), null);
  assertEquals(normalizeRoomCode("  AbC23  "), "abc23");
});

Deno.test("validateRoomCode rejects characters outside the room alphabet", () => {
  assertEquals(
    validateRoomCode("abiol"),
    "Room code contains invalid characters.",
  );
});

// Mutation cases: guards that must hold
Deno.test("validateName rejects whitespace-only names (trim guard)", () => {
  assertEquals(validateName("   "), "Enter your name to join the party.");
});

Deno.test("submitJoin drops trailing whitespace from the joined name", () => {
  const joined: string[] = [];
  submitJoin({ name: "Ada   ", code: "abc23" }, (name) => joined.push(name));
  assertEquals(joined, ["Ada"]);
});

// Logical limits: exact boundaries
Deno.test("name is capped at NAME_MAX characters", () => {
  assertEquals(NAME_MAX, 60);
  assertEquals(validateName("a".repeat(60)), null);
  assertEquals(
    validateName("a".repeat(61)),
    "Name must be 60 characters or fewer.",
  );
});

Deno.test("room code length is pinned at 5 characters", () => {
  assertEquals(ROOM_CODE_LENGTH, 5);
  assertEquals(validateRoomCode("abc23"), null);
  assertEquals(validateRoomCode("abc234"), "Room codes are 5 characters.");
});

// Mutation: generateRoomCode produces a valid-length code from the alphabet.
Deno.test("generateRoomCode yields a 5-char code from the room alphabet", () => {
  const code = generateRoomCode();
  assertEquals(code.length, ROOM_CODE_LENGTH);
  assertEquals(validateRoomCode(code), null);
  assertEquals(
    [...code].every((ch) => ROOM_CODE_ALPHABET.includes(ch)),
    true,
  );
});

// Limits: a custom length is honored.
Deno.test("generateRoomCode honors a custom length", () => {
  assertEquals(generateRoomCode(8).length, 8);
});
