import { assertEquals } from "@std/assert";
import { Avatar, initialsOf } from "./avatar.tsx";
import { render, setupDom } from "./render-helper.ts";

// Happy: first and last initials combined
Deno.test("initialsOf combines first and last initial", () => {
  assertEquals(initialsOf("Ada Lovelace"), "AL");
});

// Edge: single word name uses its first letter only
Deno.test("initialsOf handles a single word name", () => {
  assertEquals(initialsOf("Prince"), "P");
});

// Edge: empty and whitespace names fall back to "?"
Deno.test("initialsOf falls back to ? for empty names", () => {
  assertEquals(initialsOf(""), "?");
  assertEquals(initialsOf("   "), "?");
});

// Mutation: initials are normalized to uppercase
Deno.test("initialsOf uppercases the result", () => {
  assertEquals(initialsOf("ada lovelace"), "AL");
});

// Happy: Avatar renders the initials
Deno.test("Avatar renders the member initials", () => {
  setupDom();
  const { container } = render(<Avatar name="Grace Hopper" />);
  assertEquals(container.textContent, "GH");
});

// Edge: Avatar renders "?" for an empty name
Deno.test("Avatar renders ? for an empty name", () => {
  setupDom();
  const { container } = render(<Avatar name="" />);
  assertEquals(container.textContent, "?");
});
