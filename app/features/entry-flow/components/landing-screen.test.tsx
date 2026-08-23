import { assertEquals } from "@std/assert";
import { MemoryRouter } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import { LandingScreen } from "./landing-screen.tsx";

Deno.test("join opens as a dialog from the landing screen", () => {
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
  assertEquals(document.querySelector('[data-testid="join-form"]'), null);
  assertEquals(
    container.querySelector('[data-testid="reveal-join"]')?.getAttribute(
      "aria-haspopup",
    ),
    "dialog",
  );
  click(container.querySelector('[data-testid="reveal-join"]') as Element);
  assertEquals(
    document.querySelector('[data-testid="join-form"]') !== null,
    true,
  );
  assertEquals(document.querySelector('[role="dialog"]') !== null, true);
  assertEquals(document.querySelector("#join-form") !== null, true);
});

Deno.test("start party navigates hosts to source selection", () => {
  const landingSource = LandingScreen.toString();

  assertEquals(landingSource.includes("file-upload"), true);
  assertEquals(landingSource.includes("SetupScreen"), false);
});
