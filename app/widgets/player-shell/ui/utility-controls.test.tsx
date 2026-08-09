import { assertEquals } from "@std/assert";
import { act, useState } from "react";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import UtilityControls from "./utility-controls.tsx";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";

function changeValue(input: HTMLInputElement, value: string) {
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

Deno.test("mute restores the previous non-zero volume", () => {
  setupDom();
  const calls: number[] = [];
  function Harness() {
    const [volume, setVolume] = useState(1);
    return (
      <UtilityControls
        syncHandleRef={syncHandleRef}
        volume={volume}
        onVolumeChange={setVolume}
      />
    );
  }
  const syncHandleRef = {
    current: {
      setVolume(volume: number) {
        calls.push(volume);
      },
      toggleFullscreen() {},
      play() {
        return Promise.resolve(true);
      },
    } satisfies PlaybackSyncHandle,
  };
  const { container } = render(<Harness />);
  const volume = container.querySelector<HTMLInputElement>(
    '[aria-label="Volume"]',
  );
  const mute = container.querySelector<HTMLElement>('[aria-label="Mute"]');
  if (!volume || !mute) throw new Error("missing controls");
  changeValue(volume, "0.35");
  click(mute);
  const unmute = container.querySelector<HTMLElement>('[aria-label="Unmute"]');
  if (!unmute) throw new Error("missing unmute control");
  click(unmute);
  assertEquals(volume.value, "0.35");
  assertEquals(calls, [0.35, 0, 0.35]);
});
