import { assertEquals } from "@std/assert";
import { MemoryRouter, Route, Routes } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { SetupScreen } from "~/features/entry-flow/components/setup-screen.tsx";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";

Deno.test("setup screen keeps the host flow on reload for the stored host room", () => {
  setupDom();
  globalThis.sessionStorage.setItem("entry-flow.host-room", "abc23");
  const { container } = render(
    <MemoryRouter initialEntries={["/abc23/SetupScreen"]}>
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
        <Routes>
          <Route path="/:id/SetupScreen" element={<SetupScreen />} />
        </Routes>
      </SessionContext.Provider>
    </MemoryRouter>,
  );

  assertEquals(container.textContent?.includes("Host setup"), true);
  assertEquals(container.textContent?.includes("Continue to source"), true);
});
