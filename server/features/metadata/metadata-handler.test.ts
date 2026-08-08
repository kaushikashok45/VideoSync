import { assertEquals } from "@std/assert";
import type { AppErrorPayload } from "../../../shared/contracts/app-error-payload.ts";
import { makeHarness, SEARCH_RESULT } from "./metadata-test-utils.ts";

// Happy: search + detail calls produce fully mapped metadata
Deno.test("returns mapped MovieMetadata for a matched query", async () => {
  const h = await makeHarness();
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 200);
    const meta = (res.body as { metadata: Record<string, unknown> }).metadata;
    assertEquals(meta.title, "The Matrix");
    assertEquals(meta.releaseYear, 1999);
    assertEquals(meta.runtime, 136);
    assertEquals(meta.genres, ["Action", "Sci-Fi"]);
    assertEquals(meta.posterUrl, "https://image.tmdb.org/t/p/w500/p1.jpg");
  } finally {
    await h.close();
  }
});

// Mutation pin: if the detail call returns search-only data (no runtime),
// the result is null — the two-call flow is required to enrich metadata
Deno.test("detail must supply runtime, genres, and cast", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ ...SEARCH_RESULT }), { status: 200 }),
      ),
  });
  try {
    const res = await h.request("/api/metadata?q=matrix");
    const meta = (res.body as { metadata: unknown }).metadata;
    assertEquals(meta, null);
  } finally {
    await h.close();
  }
});

// Sad: API down yields a typed 502
Deno.test("returns a 502 typed error when the metadata API rejects", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.reject(new Error("api down")),
  });
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 502);
    const body = res.body as AppErrorPayload;
    assertEquals(body.code, "MEDIA_URL_UNPLAYABLE");
    assertEquals(body.detail?.stage, "metadata");
  } finally {
    await h.close();
  }
});

// Sad: non-ok API response yields a typed 502
Deno.test("returns a 502 typed error when the metadata API is not ok", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.resolve(new Response("boom", { status: 500 })),
  });
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 502);
    assertEquals((res.body as AppErrorPayload).code, "MEDIA_URL_UNPLAYABLE");
  } finally {
    await h.close();
  }
});

// Edge: no match is a 200 with metadata null
Deno.test("an empty results list yields metadata null with a 200", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      ),
  });
  try {
    const res = await h.request("/api/metadata?q=zzz");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});

// Edge: missing query is a 400 typed error
Deno.test("a missing query parameter returns a 400 typed error", async () => {
  const h = await makeHarness();
  try {
    const res = await h.request("/api/metadata");
    assertEquals(res.status, 400);
    assertEquals((res.body as AppErrorPayload).code, "MEDIA_URL_UNPLAYABLE");
  } finally {
    await h.close();
  }
});

// Edge: non-object API body yields metadata null, not a crash
Deno.test("a non-object API body yields metadata null, not a crash", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.resolve(new Response("42", { status: 200 })),
  });
  try {
    const res = await h.request("/api/metadata?q=x");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});

// Mutation: search result without a numeric id yields metadata null
Deno.test("a search result without an id yields metadata null", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ results: [{ title: "No Id" }] }),
          { status: 200 },
        ),
      ),
  });
  try {
    const res = await h.request("/api/metadata?q=x");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});
