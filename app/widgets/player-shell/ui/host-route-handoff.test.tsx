import { assertEquals } from "@std/assert";
import { MemoryRouter } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import HostVideoPlayerNew from "~/routes/$id.HostVideoPlayerNew.tsx";

function renderHost(roomId: string): HTMLDivElement {
  const { container } = render(
    <MemoryRouter>
      <SessionContext.Provider
        value={{
          roomId,
          userName: "Ada",
          role: Role.HOST,
          updateRoomId: () => {},
          updateUserName: () => {},
          updateRole: () => {},
        }}
      >
        <HostVideoPlayerNew />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  return container;
}

// Mutation pin: the host route consumes the Task 7 hostSourceStore handoff,
// so URL-mode media from the picker reaches the video element. If the route
// regressed to location.state-only (or stopped reading the store), the video
// would lose its src.
Deno.test("host route plays URL media committed to hostSourceStore", () => {
  setupDom();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: null,
  });
  const container = renderHost("abc23");
  const video = container.querySelector("video");
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src"), "https://example.com/movie.mp4");
});

// Mutation pin: upload-mode handoff renders the waiting frame, not a broken src
Deno.test("host route upload handoff leaves the video src empty", () => {
  setupDom();
  hostSourceStore.getState().commit({
    source: { mode: "upload" },
    file: null,
    metadata: null,
  });
  const container = renderHost("abc23");
  const video = container.querySelector("video");
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src"), null);
});
