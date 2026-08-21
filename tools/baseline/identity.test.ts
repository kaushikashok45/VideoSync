import {
  assert,
  assertEquals,
  assertMatch,
  assertNotEquals,
} from "@std/assert";
import { violationIdentity } from "./identity.ts";
import type { ViolationSite } from "../contracts/identity";

function site(overrides: Partial<ViolationSite> = {}): ViolationSite {
  return {
    ruleId: "structural/max-body-length",
    enclosingFunction: "computeTotal",
    paramCount: 2,
    bodyFingerprint: "abc123",
    sliceKey: null,
    ...overrides,
  };
}

Deno.test("happy: stable hash across repeated calls", () => {
  const firstHash = violationIdentity(site());
  const secondHash = violationIdentity(site());
  assertEquals(firstHash, secondHash);
});

Deno.test("happy: output is a hex sha256 string", () => {
  const id = violationIdentity(site());
  assertMatch(id, /^[0-9a-f]{64}$/);
});

Deno.test("sad: differing ruleId produces a differing hash", () => {
  const maxBodyLengthHash = violationIdentity(
    site({ ruleId: "structural/max-body-length" }),
  );
  const maxComplexityHash = violationIdentity(
    site({ ruleId: "structural/max-complexity" }),
  );
  assertNotEquals(maxBodyLengthHash, maxComplexityHash);
});

Deno.test("edge: a body fingerprint representing under-3-statement bodies still hashes deterministically", () => {
  const firstHash = violationIdentity(site({ bodyFingerprint: "" }));
  const secondHash = violationIdentity(site({ bodyFingerprint: "" }));
  assertEquals(firstHash, secondHash);
});

Deno.test("edge: a body fingerprint representing a comment-only body still hashes deterministically", () => {
  const commentOnlyHash = violationIdentity(
    site({ bodyFingerprint: "comment-only" }),
  );
  assertMatch(commentOnlyHash, /^[0-9a-f]{64}$/);
});

Deno.test("edge: two textually identical function bodies with different names must NOT collide", () => {
  const computeTotalHash = violationIdentity(
    site({ enclosingFunction: "computeTotal", bodyFingerprint: "same-body" }),
  );
  const computeSumHash = violationIdentity(
    site({ enclosingFunction: "computeSum", bodyFingerprint: "same-body" }),
  );
  assertNotEquals(
    computeTotalHash,
    computeSumHash,
    "identical bodies under different names must produce different identities",
  );
});

Deno.test("edge: the same function moved 40 lines down MUST produce the same hash", () => {
  // Line numbers are not part of ViolationSite at all -- this is what proves
  // an edit above a violation cannot make it appear to move/disappear.
  const before = site({
    enclosingFunction: "computeTotal",
    bodyFingerprint: "body-hash-1",
  });
  const after = site({
    enclosingFunction: "computeTotal",
    bodyFingerprint: "body-hash-1",
  });
  assertEquals(violationIdentity(before), violationIdentity(after));
});

Deno.test("edge: differing sliceKey produces a differing hash for slice-level rules", () => {
  const chatSliceHash = violationIdentity(
    site({ sliceKey: "app/features/chat" }),
  );
  const roomJoinSliceHash = violationIdentity(
    site({ sliceKey: "app/features/room-join" }),
  );
  assertNotEquals(chatSliceHash, roomJoinSliceHash);
});

Deno.test("edge: differing paramCount produces a differing hash", () => {
  const twoParamHash = violationIdentity(site({ paramCount: 2 }));
  const threeParamHash = violationIdentity(site({ paramCount: 3 }));
  assertNotEquals(twoParamHash, threeParamHash);
});

Deno.test("mutation: a naive concatenation without a field separator must not collide adjacent fields", () => {
  // "ab" + "c" vs "a" + "bc" would collide under naive string concatenation
  // with no delimiter between fields -- this pins that a delimiter is used.
  const abConcatHash = violationIdentity(
    site({ enclosingFunction: "ab", bodyFingerprint: "c" }),
  );
  const aBcConcatHash = violationIdentity(
    site({ enclosingFunction: "a", bodyFingerprint: "bc" }),
  );
  assertNotEquals(abConcatHash, aBcConcatHash);
});

Deno.test("logical-limits: identity is a pure function of its five fields only", () => {
  const baseSite = site();
  const results = new Set<string>();
  for (let i = 0; i < 5; i++) {
    results.add(violationIdentity({ ...baseSite }));
  }
  assertEquals(results.size, 1);
  assert(results.has(violationIdentity(baseSite)));
});
