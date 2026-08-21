import { assertEquals, assertThrows } from "@std/assert";
import {
  generateRoomCode,
  isValidRoomCode,
  parseRoomCode,
} from "./room-code.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";

// Happy path
Deno.test("generateRoomCode returns a code of the requested length", () => {
  assertEquals(generateRoomCode(5).length, 5);
  assertEquals(generateRoomCode(7).length, 7);
});

// Happy path + mutation: alphabet must exclude ambiguous characters
Deno.test("generateRoomCode avoids ambiguous characters", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateRoomCode();
    assertEquals(/^[abcdefghjkmnpqrstuvwxyz23456789]+$/.test(code), true);
  }
});

// Edge: default length is 5; repeated calls vary
Deno.test("generateRoomCode defaults to length 5 and produces varied codes", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) seen.add(generateRoomCode());
  assertEquals(generateRoomCode().length, 5);
  assertEquals(seen.size > 1, true);
});

// Sad path
Deno.test("isValidRoomCode rejects malformed, wrong-length, and ambiguous codes", () => {
  assertEquals(isValidRoomCode("ABCDE"), false); // uppercase
  assertEquals(isValidRoomCode("abcd"), false); // too short
  assertEquals(isValidRoomCode(""), false); // empty
  assertEquals(isValidRoomCode("ab1de"), false); // digit 1 excluded
  assertEquals(isValidRoomCode("abode"), false); // 'o' excluded
});

// Happy path + logical limit: exactly at length and just beyond
Deno.test("isValidRoomCode accepts exactly-at-length and rejects beyond", () => {
  assertEquals(isValidRoomCode("abcde", 5), true); // at limit
  assertEquals(isValidRoomCode("abcdef", 5), false); // beyond limit
  assertEquals(isValidRoomCode("abc", 5), false); // under limit
});

// Mutation case: whitespace is not silently accepted
Deno.test("isValidRoomCode rejects codes with whitespace", () => {
  assertEquals(isValidRoomCode("abc e"), false);
  assertEquals(isValidRoomCode("abcde "), false);
});

// Happy path
Deno.test("parseRoomCode returns the code unchanged when well-formed", () => {
  assertEquals(parseRoomCode("abcde"), "abcde");
});

// Sad path: the one throwing construction boundary
Deno.test("parseRoomCode throws AppError on a malformed code", () => {
  assertThrows(() => parseRoomCode("ABCDE"), AppError, "code");
  assertThrows(() => parseRoomCode("abcd"), AppError, "code");
  assertThrows(() => parseRoomCode(""), AppError, "code");
});
