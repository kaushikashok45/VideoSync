import { assertEquals } from "@std/assert";
import { act, createRef } from "react";
import { createPlaybackStore } from "~/entities/playback/playback-store.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import PlaybackSync from "./playback-sync.tsx";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";

function paused(currentTime: number, duration = 120) {
  return {
    status: "paused" as const,
    currentTime,
    duration,
    rate: 1,
    updatedAt: 100_000,
  };
}

Deno.test("receiver autoplay recovery does not change authoritative playback state", async () => {
  setupDom();
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  const video = document.createElement("video");
  const actionRef = createRef<PlaybackSyncHandle>();
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  store.getState().applyServerSnapshot(paused(10));
  render(
    <PlaybackSync
      mode="receiver"
      store={store}
      videoRef={{ current: video }}
      actionRef={actionRef}
      stream={null}
      autoplay={false}
    />,
  );
  await act(async () => {
    await actionRef.current?.play();
  });
  assertEquals(store.getState().snapshot?.status, "paused");
  HTMLMediaElement.prototype.play = originalPlay;
});

Deno.test("receiver autoplay does not mark the store as playing on metadata load", async () => {
  setupDom();
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  const video = document.createElement("video");
  const actionRef = createRef<PlaybackSyncHandle>();
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  Object.defineProperty(video, "duration", { configurable: true, value: 120 });
  render(
    <PlaybackSync
      mode="receiver"
      store={store}
      videoRef={{ current: video }}
      actionRef={actionRef}
      stream={null}
      autoplay
    />,
  );
  await act(async () => {
    video.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
  });
  assertEquals(store.getState().snapshot?.status, "paused");
  HTMLMediaElement.prototype.play = originalPlay;
});

Deno.test("receiver drift correction waits for an authoritative playing snapshot", async () => {
  setupDom();
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  const video = document.createElement("video");
  const actionRef = createRef<PlaybackSyncHandle>();
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  Object.defineProperty(video, "duration", { configurable: true, value: 120 });
  render(
    <PlaybackSync
      mode="receiver"
      store={store}
      videoRef={{ current: video }}
      actionRef={actionRef}
      stream={null}
      autoplay
    />,
  );
  await act(async () => {
    video.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
  });
  video.currentTime = 2;
  video.dispatchEvent(new Event("timeupdate"));
  assertEquals(video.currentTime, 2);
  HTMLMediaElement.prototype.play = originalPlay;
});

Deno.test("host reapplies a playing snapshot when media metadata arrives", async () => {
  setupDom();
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  const video = document.createElement("video");
  const actionRef = createRef<PlaybackSyncHandle>();
  const originalPlay = HTMLMediaElement.prototype.play;
  let playCalls = 0;
  HTMLMediaElement.prototype.play = () => {
    playCalls += 1;
    return Promise.resolve();
  };
  store.getState().applyServerSnapshot(paused(10));
  store.getState().play();
  render(
    <PlaybackSync
      mode="host"
      store={store}
      videoRef={{ current: video }}
      actionRef={actionRef}
      stream={null}
      autoplay={false}
    />,
  );
  await act(async () => {
    video.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
  });
  assertEquals(playCalls, 1);
  HTMLMediaElement.prototype.play = originalPlay;
});
