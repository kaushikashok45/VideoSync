import { assertEquals } from "@std/assert";
import { act } from "react";
import { hostSourceStore } from "./host-source-store.ts";
import {
  findByTestId,
  Harness,
  METADATA,
} from "./source-behaviour-harness.tsx";
import type { FetchMetadataLike } from "./source-resolver.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";

// Happy: upload with a file commits to the store and calls onDone once
Deno.test("upload submit commits handoff and navigates once", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  let done = 0;
  const { container } = render(<Harness onDone={() => done++} />);
  click(findByTestId(container, "set-file"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(done, 1);
  assertEquals(hostSourceStore.getState().source, { mode: "upload" });
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
  const { container } = render(<Harness onDone={() => done++} />);
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
  hostSourceStore.getState().clear();
  let calls = 0;
  let done = 0;
  const flaky: FetchMetadataLike = () => {
    calls += 1;
    if (calls === 1) return Promise.reject(new Error("down"));
    return Promise.resolve(METADATA);
  };
  const { container } = render(
    <Harness fetchMetadataLike={flaky} onDone={() => done++} />,
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

// Edge: switching sources clears the previous error
Deno.test("switching sources clears the previous error", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  const { container } = render(<Harness />);
  click(findByTestId(container, "toggle-url"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(
    findByTestId(container, "error").textContent,
    "Paste a URL to get started.",
  );
  click(findByTestId(container, "toggle-upload"));
  assertEquals(findByTestId(container, "error").textContent, "none");
});

// Mutation: the pending guard swallows a second submit while one is in flight
Deno.test("a second submit while pending does not double-navigate", async () => {
  setupDom();
  hostSourceStore.getState().clear();
  let done = 0;
  const { container } = render(<Harness onDone={() => done++} />);
  click(findByTestId(container, "set-file"));
  click(findByTestId(container, "submit"));
  click(findByTestId(container, "submit"));
  await act(async () => {});
  assertEquals(done, 1);
});
