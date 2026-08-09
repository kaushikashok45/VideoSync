import { assertEquals } from "@std/assert";
import { act, useEffect, useState } from "react";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import { useMediaPreviewSource } from "./use-media-preview-source.ts";

function Harness({ file }: { file: File }) {
  const [tick, setTick] = useState(0);
  const src = useMediaPreviewSource({ mode: "upload" }, file);

  useEffect(() => {
    if (tick === 0) setTick(1);
  }, [tick]);

  return <span data-testid="src">{src}</span>;
}

Deno.test("useMediaPreviewSource creates one blob url across stable upload rerenders", async () => {
  setupDom();
  const counts = { created: 0, revoked: 0 };
  URL.createObjectURL = () => `blob:mock-${++counts.created}`;
  URL.revokeObjectURL = () => {
    counts.revoked += 1;
  };
  render(
    <Harness file={new File(["video"], "clip.mp4", { type: "video/mp4" })} />,
  );
  await act(async () => {});
  assertEquals(counts.created, 1);
  assertEquals(counts.revoked, 0);
});
