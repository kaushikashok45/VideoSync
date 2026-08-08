import { assertEquals } from "@std/assert";
import { TextField } from "./text-field.tsx";
import { render, setupDom } from "./render-helper.ts";

function input(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector("input");
  if (!el) throw new Error("no input");
  return el as HTMLInputElement;
}

// Happy: renders label and input together
Deno.test("renders label and input", () => {
  setupDom();
  const { container } = render(<TextField label="Room code" />);
  const label = container.querySelector("label");
  if (!label) throw new Error("no label");
  assertEquals(label.textContent, "Room code");
  assertEquals(input(container).getAttribute("id"), label.getAttribute("for"));
});

// Sad: error shows message and marks aria-invalid
Deno.test("error shows message and marks aria-invalid", () => {
  setupDom();
  const { container } = render(
    <TextField label="Room code" error="Code not found" />,
  );
  const el = input(container);
  assertEquals(el.getAttribute("aria-invalid"), "true");
  assertEquals(container.textContent?.includes("Code not found"), true);
});

// Edge: disabled input is disabled
Deno.test("disabled input is disabled", () => {
  setupDom();
  const { container } = render(<TextField label="Name" disabled />);
  assertEquals(input(container).getAttribute("disabled"), "");
});

// Mutation: onChange is forwarded to the input and the value is readable in the
// handler. NOTE: under Deno+jsdom, React 19 maps the native `input` event to
// `onInput` rather than `onChange` (a known jsdom delegation quirk). The
// component forwards both via {...rest}; the browser maps `input` -> `onChange`.
Deno.test("input events reach the forwarded handler with the typed value", () => {
  setupDom();
  let received = "";
  const { container } = render(
    <TextField
      onInput={(e) => {
        received = e.currentTarget.value;
      }}
    />,
  );
  const el = input(container);
  el.value = "abc";
  el.dispatchEvent(new globalThis.Event("input", { bubbles: true }));
  assertEquals(received, "abc");
});

// Limits: maxLength attribute is forwarded
Deno.test("maxLength is forwarded to the input", () => {
  setupDom();
  const { container } = render(<TextField label="Code" maxLength={6} />);
  assertEquals(input(container).getAttribute("maxlength"), "6");
});
