import { assertEquals } from "@std/assert";
import { isChromium, isFirefox } from "./videoPlayerUtils.ts";

Deno.test("isFirefox returns true for a firefox user agent", () => {
  const originalUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, "userAgent", {
    value:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    configurable: true,
  });
  assertEquals(isFirefox(), true);
  assertEquals(isChromium(), false);
  Object.defineProperty(navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
});

Deno.test("isChromium returns true for a chrome user agent", () => {
  const originalUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, "userAgent", {
    value:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    configurable: true,
  });
  assertEquals(isChromium(), true);
  assertEquals(isFirefox(), false);
  Object.defineProperty(navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
});
