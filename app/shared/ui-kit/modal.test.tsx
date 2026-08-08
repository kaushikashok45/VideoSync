import { assertEquals } from "@std/assert";
import { useState } from "react";
import { Modal } from "./modal.tsx";
import { click, pressKey, render, setupDom } from "./render-helper.ts";

// Happy: opens with role dialog and aria-modal true
Deno.test("open modal has role dialog and aria-modal true", () => {
  setupDom();
  render(
    <Modal open onClose={() => {}} title="Join">
      <p>content</p>
    </Modal>,
  );
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) throw new Error("no dialog");
  assertEquals(dialog.getAttribute("aria-modal"), "true");
  assertEquals(dialog.textContent?.includes("content"), true);
});

// Sad: Esc closes via onClose
Deno.test("Esc closes the modal", () => {
  setupDom();
  let closed = 0;
  render(
    <Modal open onClose={() => closed++} title="Join">
      <p>content</p>
    </Modal>,
  );
  pressKey(document, "Escape");
  assertEquals(closed, 1);
});

// Edge: focus trap returns focus to previously focused element on close
Deno.test("focus returns to trigger when modal closes", () => {
  setupDom();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Join">
          <button type="button">Inside</button>
        </Modal>
      </>
    );
  }
  const { container } = render(<Harness />);
  const trigger = container.querySelector("button");
  if (!trigger) throw new Error("no trigger");
  trigger.focus();
  click(trigger);
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) throw new Error("no dialog");
  assertEquals(dialog.contains(document.activeElement), true);
  pressKey(document, "Escape");
  assertEquals(document.activeElement === trigger, true);
});

// Mutation: aria-labelledby is present and points at the title
Deno.test("aria-labelledby references the title heading", () => {
  setupDom();
  render(
    <Modal open onClose={() => {}} title="Join Room">
      <p>content</p>
    </Modal>,
  );
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) throw new Error("no dialog");
  const labelledBy = dialog.getAttribute("aria-labelledby");
  if (!labelledBy) throw new Error("no aria-labelledby");
  const title = document.querySelector(`#${labelledBy}`);
  if (!title) throw new Error("no title heading");
  assertEquals(title.textContent, "Join Room");
});
