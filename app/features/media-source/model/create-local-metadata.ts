import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { deriveLocalTitle } from "~/features/entry-flow/logic/derive-local-title.ts";

export function createLocalMetadata(fileName: string): MovieMetadata {
  return {
    title: deriveLocalTitle(fileName),
    overview: "A local video ready for your watch party.",
    posterUrl: "",
    backdropUrl: "",
    releaseYear: 0,
    ageRating: "",
    runtime: 0,
    genres: [],
    cast: [],
  };
}
