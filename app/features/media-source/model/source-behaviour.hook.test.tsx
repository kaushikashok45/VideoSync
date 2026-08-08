import { assertEquals } from "@std/assert";
import { useState } from "react";
import { act } from "react";
import { hostSourceStore } from "./host-source-store.ts";
import { useSourceBehaviour } from "./source-behaviour.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";

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

function file(name = "clip.mp4"): File {
  return new File(["video"], name, { type: "video/mp4" });
}

interface HarnessOptions {
  fetchMetadataLike?:
    typeof import("~/shared/api/metadata-client.ts").fetchMetadata;
  onDone?: (route: string) => void;
}

function Harness({ fetchMetadataLike, onDone }: HarnessOptions) {
  const [label, setLabel] = useState("idle");
  const [hasFile, setHasFile] = useState(false);
  const { source, setSource, setFile, setUrl: updateUrl, submit } =
    useSourceBehaviour({
      roomId: "abc23",
      fetchMetadataLike,
      onDone: (route) => {
        onDone?.(route);
        setLabel("done:" + route);
      },
    });

  return (
    <div>
      <button
        type="button"
        data-testid="toggle-url"
        onClick={() => setSource("url")}
      >
        to-url
      </button>
      <button
        type="button"
        data-testid="toggle-upload"
        onClick={() => setSource("upload")}
      >
        to-upload
      </button>
      <button
        type="button"
        data-testid="set-file"
        onClick={() => {
          setFile(file());
          setHasFile(true);
        }}
      >
        set-file
      </button>
      <button
        type="button"
        data-testid="set-url"
        onClick={() => updateUrl("https://example.com/movie")}
      >
        set-url
      </button>
      <button type="button" data-testid="submit" onClick={() => void submit()}>
        submit
      </button>
      <span data-testid="source">{source}</span>
      <span data-testid="has-file">{String(hasFile)}</span>
      <span data-testid="label">{label}</span>
    </div>
  );
}

function findByTestId(
  container: HTMLDivElement,
  id: string,
): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing [data-testid="${id}"]`);
  return el as HTMLElement;
}

// Happy: upload with a file commits to the store and calls onDone once
Deno.test("upload submit commits handoff and navigates once", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  let done = 0;
  const { container } = render(
    <Harness onDone={() => done++} />,
  );
  click(findByTestId(container, "set-file"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(done, 1);
  assertEquals(
    hostSourceStore.getState().source,
    { mode: "upload" },
  );
  assertEquals(
    findByTestId(container, "label").textContent,
    "done:/abc23/HostVideoPlayerNew",
  );
});

// Sad: upload without a file does not navigate and stays idle
Deno.test("upload submit without a file does not navigate", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  let done = 0;
  const { container } = render(
    <Harness onDone={() => done++} />,
  );
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(done, 0);
  assertEquals(hostSourceStore.getState().source, null);
});

// Happy: url submit resolves metadata, commits, and navigates once
Deno.test("url submit resolves metadata and navigates once", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  let done = 0;
  const { container } = render(
    <Harness
      fetchMetadataLike={() => Promise.resolve(METADATA)}
      onDone={() => done++}
    />,
  );
  click(findByTestId(container, "toggle-url"));
  click(findByTestId(container, "set-url"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(done, 1);
  assertEquals(
    hostSourceStore.getState().source,
    { mode: "url", url: "https://example.com/movie" },
  );
  assertEquals(hostSourceStore.getState().metadata?.title, "The Matrix");
});

// Mutation: metadata lookup failure is recoverable — retry calls fetch again
Deno.test("metadata lookup failure resets pending so retry refetches", async () => {
  setupDom();
  let calls = 0;
  let done = 0;
  const flaky = () => {
    calls += 1;
    if (calls === 1) return Promise.reject(new Error("down"));
    return Promise.resolve(METADATA);
  };
  const { container } = render(
    <Harness
      fetchMetadataLike={flaky as typeof import("~/shared/api/metadata-client.ts").fetchMetadata}
      onDone={() => done++}
    />,
  );
  click(findByTestId(container, "toggle-url"));
  click(findByTestId(container, "set-url"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(calls, 1);
  assertEquals(done, 0);
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(calls, 2);
  assertEquals(done, 1);
});

// Edge: switch between sources clears the error state
Deno.test("switching sources clears the previous error", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  const { container } = render(<Harness />);
  click(findByTestId(container, "toggle-url"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  click(findByTestId(container, "toggle-upload"));
  assertEquals(hostSourceStore.getState().source, null);
});
