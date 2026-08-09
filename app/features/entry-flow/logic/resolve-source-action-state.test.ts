import { assertEquals } from "@std/assert";
import { resolveSourceActionState } from "./resolve-source-action-state.ts";

Deno.test("resolveSourceActionState keeps upload disabled until a file is chosen", () => {
  assertEquals(
    resolveSourceActionState({ mode: "upload", fileName: null, url: "" }),
    {
      actionLabel: "Choose a video file",
      disabled: true,
      status: "idle",
      detail: "Pick a local video to unlock the room preview.",
    },
  );
});

Deno.test("resolveSourceActionState marks upload ready after a local file is selected", () => {
  assertEquals(
    resolveSourceActionState({
      mode: "upload",
      fileName: "movie.mp4",
      url: "",
    }),
    {
      actionLabel: "Continue to room",
      disabled: false,
      status: "ready",
      detail: "Your local video is ready for the room preview.",
    },
  );
});

Deno.test("resolveSourceActionState makes invalid url errors actionable", () => {
  assertEquals(
    resolveSourceActionState({
      mode: "url",
      fileName: null,
      url: "ftp://example.com/movie",
    }),
    {
      actionLabel: "Paste a valid video URL",
      disabled: true,
      status: "invalid",
      detail: "Only http and https URLs are supported.",
    },
  );
});

Deno.test("resolveSourceActionState enables continue for a valid url", () => {
  assertEquals(
    resolveSourceActionState({
      mode: "url",
      fileName: null,
      url: "https://example.com/movie",
    }),
    {
      actionLabel: "Continue to room",
      disabled: false,
      status: "ready",
      detail: "We will verify the link and prepare the room preview next.",
    },
  );
});
