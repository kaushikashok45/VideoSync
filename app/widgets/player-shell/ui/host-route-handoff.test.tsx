import { assertEquals } from "@std/assert";
import { MemoryRouter } from "react-router";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import HostVideoPlayerNew from "~/routes/$id.HostVideoPlayerNew.tsx";

const METADATA: MovieMetadata = {
  title: "The Matrix",
  overview: "",
  posterUrl: "",
  backdropUrl: "",
  releaseYear: 1999,
  ageRating: "NR",
  runtime: 136,
  genres: ["Action"],
  cast: [],
};

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

// Mutation pin: the store's metadata is forwarded to the shell (dropping the
// prop would lose the Now Watching title).
Deno.test("host route forwards handoff metadata to the shell", () => {
  setupDom();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: METADATA,
  });
  const container = renderHost("abc23");
  assertEquals(container.textContent?.includes("The Matrix"), true);
});

// Mutation pin: legacy location.state.videoURL still resolves a URL when the
// store is empty (covers the fallback branch).
Deno.test("host route falls back to location.state videoURL when store is empty", () => {
  setupDom();
  hostSourceStore.getState().clear();
  const { container } = render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/abc23/HostVideoPlayerNew",
          state: { videoURL: "https://legacy.example.com/f.mp4" },
        },
      ]}
    >
      <SessionContext.Provider
        value={{
          roomId: "abc23",
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
  const video = container.querySelector("video");
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src"), "https://legacy.example.com/f.mp4");
});
