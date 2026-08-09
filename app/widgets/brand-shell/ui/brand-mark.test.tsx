import { assertEquals } from "@std/assert";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import BrandMark from "./brand-mark.tsx";

Deno.test("brand mark uses the approved Sync Party wordmark treatment", () => {
  setupDom();
  const { container } = render(<BrandMark />);
  const heading = container.querySelector("h1");
  assertEquals(heading?.textContent, "Sync Party");
  assertEquals(heading?.className.includes("font-built"), true);
  assertEquals(heading?.className.includes("font-airone"), false);
});
