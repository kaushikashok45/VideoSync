import { assertEquals, assertRejects } from "@std/assert";
import { TmdbClient } from "./metadata-tmdb.ts";
import type { FetchLike } from "./metadata-tmdb.ts";
import { DETAIL_RESULT, SEARCH_RESULT } from "./metadata-test-utils.ts";

function client(fetchLike: FetchLike): TmdbClient {
  return new TmdbClient({ apiKey: "test-key", fetchLike });
}

// Happy: search then detail enriches runtime/genres/cast
Deno.test("two-call flow maps search + detail into full metadata", async () => {
  const calls: string[] = [];
  const tmdb = client((url) => {
    const href = String(url);
    calls.push(href);
    if (href.includes("/search/movie")) {
      return Promise.resolve(
        new Response(JSON.stringify({ results: [SEARCH_RESULT] }), {
          status: 200,
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(DETAIL_RESULT), { status: 200 }),
    );
  });
  const meta = await tmdb.fetchByTitle("matrix");
  assertEquals(meta?.title, "The Matrix");
  assertEquals(meta?.runtime, 136);
  assertEquals(meta?.genres, ["Action", "Sci-Fi"]);
  assertEquals(meta?.cast, ["Keanu Reeves", "Carrie-Anne Moss"]);
  assertEquals(calls.length, 2);
  assertEquals(calls[1].includes("/movie/603"), true);
});

// Sad: search failure rejects
Deno.test("search failure rejects", async () => {
  const tmdb = client(() => Promise.reject(new Error("down")));
  await assertRejects(() => tmdb.fetchByTitle("matrix"));
});

// Edge: empty search results yield null
Deno.test("empty search results yield null", async () => {
  const tmdb = client(() =>
    Promise.resolve(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    )
  );
  assertEquals(await tmdb.fetchByTitle("zzz"), null);
});

// Edge: missing api key yields null without calling fetch
Deno.test("missing api key yields null without fetching", async () => {
  let called = 0;
  const tmdb = new TmdbClient({
    apiKey: "",
    fetchLike: () => {
      called += 1;
      return Promise.resolve(new Response("{}", { status: 200 }));
    },
  });
  assertEquals(await tmdb.fetchByTitle("matrix"), null);
  assertEquals(called, 0);
});

// Mutation: search result without an id short-circuits to null
Deno.test("search result without an id yields null", async () => {
  const tmdb = client(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ results: [{ title: "No Id" }] }),
        { status: 200 },
      ),
    )
  );
  assertEquals(await tmdb.fetchByTitle("x"), null);
});

// Logical limits: a non-ok detail response rejects
Deno.test("non-ok detail response rejects", async () => {
  const tmdb = client((url) => {
    if (String(url).includes("/search/movie")) {
      return Promise.resolve(
        new Response(JSON.stringify({ results: [SEARCH_RESULT] }), {
          status: 200,
        }),
      );
    }
    return Promise.resolve(new Response("boom", { status: 500 }));
  });
  await assertRejects(() => tmdb.fetchByTitle("matrix"));
});
