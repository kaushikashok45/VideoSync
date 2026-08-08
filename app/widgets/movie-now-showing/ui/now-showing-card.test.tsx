import { assertEquals } from "@std/assert";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import NowShowingCard from "./now-showing-card.tsx";

const noop = () => undefined;

const METADATA: MovieMetadata = {
  title: "Inception",
  overview:
    "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
  posterUrl: "/posters/inception.jpg",
  backdropUrl: "/backdrops/inception.jpg",
  releaseYear: 2010,
  ageRating: "PG-13",
  runtime: 148,
  genres: ["Action", "Sci-Fi"],
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
};

// Happy path: every metadata field and the primary action render.
Deno.test("renders all metadata fields and the join action", () => {
  setupDom();
  const { container } = render(
    <NowShowingCard metadata={METADATA} onJoin={noop} />,
  );
  const text = container.textContent ?? "";
  assertEquals(text.includes(METADATA.title), true);
  assertEquals(text.includes(METADATA.ageRating), true);
  assertEquals(text.includes(`${METADATA.runtime} min`), true);
  assertEquals(text.includes(String(METADATA.releaseYear)), true);
  assertEquals(text.includes(METADATA.overview), true);
  for (const genre of METADATA.genres) {
    assertEquals(text.includes(genre), true);
  }
  assertEquals(
    container.querySelector('[aria-label="Leonardo DiCaprio"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="genre-chips"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="join-button"]') !== null,
    true,
  );
});

// Sad path: absent metadata shows the warm empty state but keeps Join.
Deno.test("renders the empty state when metadata is absent, Join still shown", () => {
  setupDom();
  const { container } = render(<NowShowingCard onJoin={noop} />);
  assertEquals(
    container.textContent?.includes("This watch party has no poster yet"),
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="join-button"]') !== null,
    true,
  );
});

// Edge: empty genres/cast arrays render no chips and no crash.
Deno.test("renders cleanly with empty genres and cast", () => {
  setupDom();
  const sparse = { ...METADATA, genres: [], cast: [] };
  const { container } = render(
    <NowShowingCard metadata={sparse} onJoin={noop} />,
  );
  assertEquals(container.querySelector('[data-testid="genre-chips"]'), null);
  assertEquals(container.querySelector('[data-testid="cast-chips"]'), null);
  assertEquals(container.textContent?.includes(METADATA.title), true);
  assertEquals(
    container.querySelector('[data-testid="join-button"]') !== null,
    true,
  );
});

// Mutation: the description must not be dropped and must be clamped.
Deno.test("keeps the overview text clamped to three lines", () => {
  setupDom();
  const { container } = render(
    <NowShowingCard metadata={METADATA} onJoin={noop} />,
  );
  assertEquals(
    container.querySelector("p.line-clamp-3")?.textContent,
    METADATA.overview,
  );
});

// Mutation: the Join action must stay present with its exact label.
Deno.test("keeps the primary Join action with its exact label", () => {
  setupDom();
  const { container } = render(
    <NowShowingCard metadata={METADATA} onJoin={noop} />,
  );
  const join = container.querySelector('[data-testid="join-button"]');
  assertEquals(join !== null, true);
  assertEquals(join?.textContent?.includes("Join the watch party"), true);
});

// Mutation: swapping poster/backdrop URLs would fail these pin assertions.
Deno.test("pins the poster and backdrop image src attributes", () => {
  setupDom();
  const { container } = render(
    <NowShowingCard metadata={METADATA} onJoin={noop} />,
  );
  const poster = container.querySelector<HTMLImageElement>(
    '[data-testid="poster-image"]',
  );
  const backdrop = container.querySelector<HTMLImageElement>(
    '[data-testid="backdrop-image"]',
  );
  assertEquals(poster?.getAttribute("src"), METADATA.posterUrl);
  assertEquals(backdrop?.getAttribute("src"), METADATA.backdropUrl);
});

// Limits: a very long cast list renders every chip without crashing.
Deno.test("renders a long cast list of twelve without crashing", () => {
  setupDom();
  const cast = Array.from({ length: 12 }, (_, index) => `Actor ${index + 1}`);
  const { container } = render(
    <NowShowingCard metadata={{ ...METADATA, cast }} onJoin={noop} />,
  );
  assertEquals(
    container.querySelectorAll('[data-testid="cast-chip"]').length,
    12,
  );
});
