import { assertEquals } from "@std/assert";
import { normalizeMovie } from "./metadata-normalizer.ts";

const TMDB_MOVIE = {
  title: "The Matrix",
  release_date: "1999-03-31",
  runtime: 136,
  overview: "A hacker learns the truth about reality.",
  genres: [{ name: "Action" }, { name: "Sci-Fi" }],
  cast: [{ name: "Keanu Reeves" }, { name: "Carrie-Anne Moss" }],
  poster_path: "/p1.jpg",
  backdrop_path: "/b1.jpg",
  adult: false,
};

// Happy path: full TMDB-shaped movie maps to exact MovieMetadata fields
Deno.test("maps a full TMDB movie to MovieMetadata fields", () => {
  const meta = normalizeMovie(TMDB_MOVIE);
  assertEquals(meta, {
    title: "The Matrix",
    overview: "A hacker learns the truth about reality.",
    posterUrl: "https://image.tmdb.org/t/p/w500/p1.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/b1.jpg",
    releaseYear: 1999,
    ageRating: "NR",
    runtime: 136,
    genres: ["Action", "Sci-Fi"],
    cast: ["Keanu Reeves", "Carrie-Anne Moss"],
  });
});

// Sad path: missing required fields -> null
Deno.test("returns null when the title is missing", () => {
  assertEquals(normalizeMovie({ ...TMDB_MOVIE, title: "" }), null);
  assertEquals(normalizeMovie({ ...TMDB_MOVIE, title: "  " }), null);
});

Deno.test("returns null when release_date is missing or unparseable", () => {
  assertEquals(
    normalizeMovie({ ...TMDB_MOVIE, release_date: undefined }),
    null,
  );
  assertEquals(
    normalizeMovie({ ...TMDB_MOVIE, release_date: "unknown" }),
    null,
  );
});

Deno.test("returns null when runtime is missing, zero, or fractional", () => {
  assertEquals(normalizeMovie({ ...TMDB_MOVIE, runtime: undefined }), null);
  assertEquals(normalizeMovie({ ...TMDB_MOVIE, runtime: 0 }), null);
  assertEquals(normalizeMovie({ ...TMDB_MOVIE, runtime: 12.5 }), null);
});

// Edge cases
Deno.test("null or missing arrays default to empty arrays", () => {
  const meta = normalizeMovie({ ...TMDB_MOVIE, genres: null, cast: undefined });
  assertEquals(meta?.genres, []);
  assertEquals(meta?.cast, []);
});

Deno.test("missing optional strings default to empty strings", () => {
  const meta = normalizeMovie({
    ...TMDB_MOVIE,
    overview: undefined,
    poster_path: "",
    backdrop_path: undefined,
  });
  assertEquals(meta?.overview, "");
  assertEquals(meta?.posterUrl, "");
  assertEquals(meta?.backdropUrl, "");
});

Deno.test("adult flag maps to an 18+ rating", () => {
  assertEquals(
    normalizeMovie({ ...TMDB_MOVIE, adult: true })?.ageRating,
    "18+",
  );
});

Deno.test("non-object input returns null", () => {
  assertEquals(normalizeMovie(null), null);
  assertEquals(normalizeMovie("movie"), null);
  assertEquals(normalizeMovie(42), null);
});

// Mutation pins: field mapping must come from the specified keys
Deno.test("releaseYear is derived from release_date, not another key", () => {
  const meta = normalizeMovie({ ...TMDB_MOVIE, release_date: "2003-05-15" });
  assertEquals(meta?.releaseYear, 2003);
});

Deno.test("genres and cast keep the source ordering", () => {
  const meta = normalizeMovie(TMDB_MOVIE);
  assertEquals(meta?.genres, ["Action", "Sci-Fi"]);
  assertEquals(meta?.cast, ["Keanu Reeves", "Carrie-Anne Moss"]);
});

Deno.test("posterUrl and backdropUrl keep their distinct image sizes", () => {
  const meta = normalizeMovie(TMDB_MOVIE);
  assertEquals(meta?.posterUrl, "https://image.tmdb.org/t/p/w500/p1.jpg");
  assertEquals(meta?.backdropUrl, "https://image.tmdb.org/t/p/w1280/b1.jpg");
});

// Logical limits
Deno.test("year parsing handles bare years and ISO dates", () => {
  assertEquals(
    normalizeMovie({ ...TMDB_MOVIE, release_date: "1999" })?.releaseYear,
    1999,
  );
  assertEquals(
    normalizeMovie({ ...TMDB_MOVIE, release_date: "2021-07-09" })?.releaseYear,
    2021,
  );
});
