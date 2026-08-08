import { assertEquals } from "@std/assert";
import type { AppErrorPayload } from "../../../shared/contracts/app-error-payload.ts";
import { makeHarness } from "./metadata-test-utils.ts";

// Mutation pin: cache reuse skips the network within the TTL
Deno.test("a second identical query within TTL does not refetch", async () => {
  const h = await makeHarness();
  try {
    await h.request("/api/metadata?q=matrix");
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 2);
  } finally {
    await h.close();
  }
});

// Mutation pin: a cached no-match is reused too, not refetched
Deno.test("a cached no-match result is reused within the TTL", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      ),
  });
  try {
    await h.request("/api/metadata?q=zzz");
    await h.request("/api/metadata?q=zzz");
    assertEquals(h.fetchCount(), 1);
  } finally {
    await h.close();
  }
});

// Logical limits: rate limiting per IP
Deno.test("the N+1th request in the rate window is rejected with 429", async () => {
  const h = await makeHarness({ cfg: { metadataRateLimit: 2 } });
  try {
    assertEquals((await h.request("/api/metadata?q=a")).status, 200);
    assertEquals((await h.request("/api/metadata?q=b")).status, 200);
    const third = await h.request("/api/metadata?q=c");
    assertEquals(third.status, 429);
    assertEquals((third.body as AppErrorPayload).code, "SERVER_RATE_LIMITED");
  } finally {
    await h.close();
  }
});

// Logical limits: TTL expiry triggers a refetch
Deno.test("TTL expiry evicts the cache and refetches", async () => {
  let clock = 0;
  const h = await makeHarness({ now: () => clock });
  try {
    await h.request("/api/metadata?q=matrix");
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 2);
    clock = 60_001;
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 4);
  } finally {
    await h.close();
  }
});

// Logical limits: rate window resets after it elapses
Deno.test("the rate window resets once it elapses", async () => {
  let clock = 0;
  const h = await makeHarness({
    now: () => clock,
    cfg: { metadataRateLimit: 2 },
  });
  try {
    assertEquals((await h.request("/api/metadata?q=a")).status, 200);
    assertEquals((await h.request("/api/metadata?q=b")).status, 200);
    assertEquals((await h.request("/api/metadata?q=c")).status, 429);
    clock = 60_001;
    assertEquals((await h.request("/api/metadata?q=d")).status, 200);
  } finally {
    await h.close();
  }
});
