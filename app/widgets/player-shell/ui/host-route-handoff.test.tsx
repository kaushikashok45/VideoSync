import { assertEquals } from "@std/assert";
import { act } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import HostVideoPlayerNew from "~/routes/$id.HostVideoPlayerNew.tsx";

const METADATA: MovieMetadata = {
  title: "The Matrix",
  overview: "A hacker learns the truth.",
  posterUrl: "",
  backdropUrl: "",
  releaseYear: 1999,
  ageRating: "NR",
  runtime: 136,
  genres: ["Action"],
  cast: [],
};

let blobCounter = 0;
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => `blob:mock-${++blobCounter}`;
  URL.revokeObjectURL = () => {};
}

function installMediaMocks(): void {
  if (typeof HTMLMediaElement === "undefined") return;
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: () => new Promise<void>(() => {}),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: () => {},
  });
}

async function renderHost(
  routeRoomId: string,
  sessionRoomId = routeRoomId,
  preview = true,
): Promise<HTMLDivElement> {
  const { container } = render(
    <MemoryRouter
      initialEntries={[{
        pathname: `/${routeRoomId}/HostVideoPlayerNew`,
        search: preview ? "?preview=1" : "",
      }]}
    >
      <SessionContext.Provider
        value={{
          roomId: sessionRoomId,
          userName: "Ada",
          role: Role.HOST,
          updateRoomId: () => {},
          updateUserName: () => {},
          updateRole: () => {},
        }}
      >
        <Routes>
          <Route
            path="/:id/HostVideoPlayerNew"
            element={<HostVideoPlayerNew />}
          />
        </Routes>
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return container;
}

Deno.test("host route previews url media from hostSourceStore", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: null,
  });
  const container = await renderHost("abc23");
  const video = container.querySelector("video");
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src"), "https://example.com/movie.mp4");
  assertEquals(container.textContent?.includes("Video URL"), true);
});

Deno.test("host route derives a local title and blob preview for upload handoff", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().commit({
    source: { mode: "upload" },
    file: new File(["video"], "My%20Movie.Final.mp4", { type: "video/mp4" }),
    metadata: null,
  });
  const container = await renderHost("abc23");
  const video = container.querySelector("video");
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src")?.startsWith("blob:"), true);
  assertEquals(container.textContent?.includes("My Movie.Final"), true);
});

Deno.test("host route shows a stable empty state when no source is available", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().clear();
  const container = await renderHost("abc23");
  assertEquals(container.textContent?.includes("No video selected"), true);
  assertEquals(container.textContent?.includes("Choose a source"), true);
});

Deno.test("host preplay keeps the room code out of the live stage", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: METADATA,
  });
  const container = await renderHost("abc23", "zzzzz");
  assertEquals(container.textContent?.includes("abc23"), false);
  assertEquals(container.textContent?.includes("The Matrix"), true);
});

Deno.test("host route switches to the live player shell after start watching", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: METADATA,
  });
  const container = await renderHost("abc23", "abc23", false);
  assertEquals(
    container.querySelector('[data-testid="player-shell"]') !== null,
    true,
  );
});

Deno.test("live host playback resolves the route room id over stale session state", async () => {
  setupDom();
  installMediaMocks();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: "https://example.com/movie.mp4" },
    file: null,
    metadata: METADATA,
  });
  const container = await renderHost("abc23", "zzzzz", false);
  click(
    container.querySelector('[aria-label="Open chat and members"]') as Element,
  );
  click(container.querySelector('[data-testid="members-tab"]') as Element);
  assertEquals(container.textContent?.includes("abc23"), true);
});
