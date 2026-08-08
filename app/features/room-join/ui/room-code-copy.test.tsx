import { assertEquals } from "@std/assert";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import RoomCodeCopy from "./room-code-copy.tsx";

// Happy: the code is shown prominently.
Deno.test("renders the room code", () => {
  setupDom();
  const { container } = render(<RoomCodeCopy code="abc23" />);
  const code = container.querySelector('[data-testid="room-code"]');
  if (!code) throw new Error("no code element");
  assertEquals(code.textContent, "abc23");
});

// Edge: the copy button falls back gracefully when clipboard is unavailable.
Deno.test("copy does not throw when the clipboard is unavailable", async () => {
  setupDom();
  const { container } = render(<RoomCodeCopy code="abc23" />);
  const button = container.querySelector("button");
  if (!button) throw new Error("no button");
  button.dispatchEvent(new globalThis.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(button.textContent, "Copy code");
});
