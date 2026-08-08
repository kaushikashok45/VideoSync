import { assertEquals } from "@std/assert";
import { act } from "react";
import type { Member } from "contracts/member.ts";
import type { MediaSource } from "contracts/media-source.ts";
import { createPlaybackStore } from "~/entities/playback/playback-store.ts";
import {
  click,
  pressKey,
  render,
  setupDom,
} from "~/shared/ui-kit/render-helper.ts";
import PlayerShell from "./player-shell.tsx";

let blobCounter = 0;
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => `blob:mock-${++blobCounter}`;
  URL.revokeObjectURL = () => {};
}

const URL_MEDIA: MediaSource = {
  mode: "url",
  url: "https://example.com/movie.mp4",
};

function viewer(): Member {
  return {
    id: "viewer",
    name: "V",
    role: "viewer",
    canControl: false,
    joinedAt: 0,
  };
}

function host(): Member {
  return { id: "host", name: "H", role: "host", canControl: true, joinedAt: 0 };
}
function shell(
  opts: {
    idleMs?: number;
    media?: MediaSource;
    me?: Member | null;
    file?: File | null;
  } = {},
) {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  return render(
    <PlayerShell
      mode="host"
      media={opts.media ?? URL_MEDIA}
      me={opts.me ?? null}
      idleMs={opts.idleMs ?? 3000}
      file={opts.file ?? null}
      playbackStore={store}
    />,
  );
}

function flush(ms: number): Promise<void> {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function stage(container: HTMLElement): Element {
  return container.querySelector('[data-testid="player-shell"]') as Element;
}

function bar(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="control-bar"]');
}

// 1. Happy path: the video element and control bar render for a URL source.
Deno.test("renders a video element and the control bar for a url source", async () => {
  setupDom();
  const { container } = shell({ idleMs: 50 });
  const video = container.querySelector<HTMLVideoElement>(
    "[data-testid='player-video']",
  );
  assertEquals(video !== null, true);
  assertEquals(video?.getAttribute("src"), URL_MEDIA.url);
  assertEquals(bar(container) !== null, true);
  assertEquals(container.querySelector('[aria-label="Play"]') !== null, true);
  assertEquals(
    container.querySelector('[data-testid="seeker"]') !== null,
    true,
  );
  await flush(60);
});

// 2. Sad/Edge: controls hide after idle with aria-hidden and reveal on interaction.
Deno.test("controls hide after idle with aria-hidden and reveal on interaction", async () => {
  setupDom();
  const { container } = shell({ idleMs: 20 });
  assertEquals(bar(container)?.getAttribute("aria-hidden"), null);
  await flush(25);
  assertEquals(bar(container)?.getAttribute("aria-hidden"), "true");
  click(stage(container));
  assertEquals(bar(container)?.getAttribute("aria-hidden"), null);
  await flush(25);
  assertEquals(bar(container)?.getAttribute("aria-hidden"), "true");
});

// 2b. Sad/Edge: keyboard movement reveals the hidden chrome too.
Deno.test("keyboard interaction reveals hidden controls", async () => {
  setupDom();
  const { container } = shell({ idleMs: 20 });
  await flush(25);
  assertEquals(bar(container)?.getAttribute("aria-hidden"), "true");
  pressKey(stage(container), "ArrowRight");
  assertEquals(bar(container)?.getAttribute("aria-hidden"), null);
  await flush(25);
});

// 3. Mutation: upload mode without a file keeps the video element and shows the waiting frame.
Deno.test("upload mode shows the waiting frame but keeps the video element", () => {
  setupDom();
  const { container } = shell({ idleMs: 10, media: { mode: "upload" } });
  assertEquals(
    container.querySelector('[data-testid="upload-waiting"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="player-video"]') !== null,
    true,
  );
  assertEquals(container.textContent?.includes("Loading your video"), true);
  return flush(15);
});

// 3c. Fix: a host upload with a local file plays via object URL — no waiting frame.
Deno.test("host upload with a local file gets a video src and no waiting frame", () => {
  setupDom();
  const blob = new File(["video"], "clip.mp4", { type: "video/mp4" });
  const { container } = shell({
    idleMs: 10,
    media: { mode: "upload" },
    file: blob,
  });
  assertEquals(
    container.querySelector('[data-testid="upload-waiting"]'),
    null,
  );
  const video = container.querySelector('[data-testid="player-video"]');
  if (!video) throw new Error("no video element");
  assertEquals(video.getAttribute("src")?.startsWith("blob:"), true);
  return flush(15);
});

// 3b. Mutation: permission wiring gates the transport buttons.
Deno.test("a viewer without control gets disabled transport buttons", () => {
  setupDom();
  const { container } = shell({ idleMs: 10, me: viewer() });
  assertEquals(
    container.querySelector('[aria-label="Play"]')?.hasAttribute("disabled"),
    true,
  );
  return flush(15);
});

Deno.test("the host gets enabled transport buttons", () => {
  setupDom();
  const { container } = shell({ idleMs: 10, me: host() });
  assertEquals(
    container.querySelector('[aria-label="Play"]')?.hasAttribute("disabled"),
    false,
  );
  return flush(15);
});

// 4. Limits: the idle boundary is just-before visible, at/beyond hidden.
Deno.test("idle boundary: visible before the deadline, hidden at and beyond it", async () => {
  setupDom();
  const { container } = shell({ idleMs: 30 });
  pressKey(stage(container), "ArrowRight");
  assertEquals(bar(container)?.getAttribute("aria-hidden"), null);
  await flush(20);
  assertEquals(bar(container)?.getAttribute("aria-hidden"), null);
  await flush(15);
  assertEquals(bar(container)?.getAttribute("aria-hidden"), "true");
});
