import { assertEquals } from "@std/assert";
import { MemoryRouter } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import { LandingScreen } from "./landing-screen.tsx";

Deno.test("join is progressively disclosed from the landing screen", () => {
  setupDom();
  const { container } = render(
    <MemoryRouter>
      <SessionContext.Provider
        value={{
          roomId: "",
          userName: "",
          role: Role.GUEST,
          updateRoomId: () => {},
          updateUserName: () => {},
          updateRole: () => {},
        }}
      >
        <LandingScreen />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  assertEquals(container.textContent?.includes("No account needed"), false);
  assertEquals(container.textContent?.includes("Have an invite?"), false);
  assertEquals(container.querySelector('[data-testid="join-form"]'), null);
  click(container.querySelector('[data-testid="reveal-join"]') as Element);
  assertEquals(
    container.querySelector('[data-testid="join-form"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="reveal-join"]')?.getAttribute(
      "aria-expanded",
    ),
    "true",
  );
  assertEquals(
    container.querySelector('[data-testid="reveal-join"]')?.getAttribute(
      "aria-controls",
    ),
    "join-form",
  );
  assertEquals(container.querySelector("#join-form") !== null, true);
});
