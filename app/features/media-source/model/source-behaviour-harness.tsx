import { useState } from "react";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import type { FetchMetadataLike } from "./source-resolver.ts";
import { useSourceBehaviour } from "./source-behaviour.ts";

export const METADATA: MovieMetadata = {
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

export function file(name = "clip.mp4"): File {
  return new File(["video"], name, { type: "video/mp4" });
}

export interface HarnessOptions {
  fetchMetadataLike?: FetchMetadataLike;
  onDone?: (route: string) => void;
}

export function Harness({ fetchMetadataLike, onDone }: HarnessOptions) {
  const [label, setLabel] = useState("idle");
  const [hasFile, setHasFile] = useState(false);
  const { source, setSource, setFile, setUrl: updateUrl, submit, error } =
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
      <span data-testid="error">{error ?? "none"}</span>
    </div>
  );
}

export function findByTestId(
  container: HTMLDivElement,
  id: string,
): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing [data-testid="${id}"]`);
  return el as HTMLElement;
}
