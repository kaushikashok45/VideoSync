import { assertEquals } from "@std/assert";
import { Select } from "./select.tsx";
import { render, setupDom } from "./render-helper.ts";

// Happy: label links to the select via htmlFor/id
Deno.test("label is linked to the select by id", () => {
  setupDom();
  const { container } = render(
    <Select id="role" label="Role">
      <option>Host</option>
    </Select>,
  );
  const label = container.querySelector("label");
  const select = container.querySelector("select");
  if (!label || !select) throw new Error("no elements");
  assertEquals(label.htmlFor, "role");
  assertEquals(select.id, "role");
});

// Happy: options are rendered inside the select
Deno.test("renders the option children", () => {
  setupDom();
  const { container } = render(
    <Select>
      <option>Host</option>
      <option>Guest</option>
    </Select>,
  );
  const options = container.querySelectorAll("option");
  assertEquals(options.length, 2);
});

// Sad: error sets aria-invalid and shows the message
Deno.test("error marks the select invalid and renders the message", () => {
  setupDom();
  const { container } = render(
    <Select error="Pick a role">
      <option>Host</option>
    </Select>,
  );
  const select = container.querySelector("select");
  const message = container.querySelector("p");
  if (!select || !message) throw new Error("no elements");
  assertEquals(select.getAttribute("aria-invalid"), "true");
  assertEquals(
    select.getAttribute("aria-describedby"),
    message.getAttribute("id"),
  );
  assertEquals(message.textContent, "Pick a role");
});

// Edge: no error means no aria-invalid and no message
Deno.test("no error leaves the select valid", () => {
  setupDom();
  const { container } = render(
    <Select>
      <option>Host</option>
    </Select>,
  );
  const select = container.querySelector("select");
  if (!select) throw new Error("no select");
  assertEquals(select.hasAttribute("aria-invalid"), false);
  assertEquals(container.querySelector("p"), null);
});

// Mutation: a custom id is honored over the generated one
Deno.test("custom id is used instead of a generated id", () => {
  setupDom();
  const { container } = render(
    <Select id="custom" label="Role">
      <option>Host</option>
    </Select>,
  );
  const label = container.querySelector("label");
  const select = container.querySelector("select");
  if (!label || !select) throw new Error("no elements");
  assertEquals(label.htmlFor, "custom");
  assertEquals(select.id, "custom");
});
