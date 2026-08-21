# /review-now — the cold review panel

You are orchestrating **layer 2 of verification**: five independent cold reviewers over
the staged change. Layer 1 is the deterministic machine gate, and it must already be
green before you spend a token here.

Read `docs/GOVERNANCE.md` for the D1 governed-diff definition and the tier map, and
`docs/PIPELINE.md` for the panel roster.

## Step 1 — Refuse to run on a red machine gate

```bash
deno task precommit --machine-only
```

**If this is not green, stop.** Report the failures and do not spawn a single reviewer.

This refusal is load-bearing, not politeness: the commit hook trusts a receipt because a
receipt's *existence* implies every machine check passed for that exact diff. If you
write a receipt on a red gate, the hook's fast path becomes a lie and the whole gate is
worthless.

## Step 2 — Compute the governed diff (D1), exactly

One definition, no variants:

```bash
git -c core.abbrev=40 diff --cached --no-color --no-ext-diff -U3 \
  -- . ':(exclude).agents/review-receipts/**'
```

`RECEIPT_KEY` is the **sha256 of that patch text**. The receipt exclusion is what keeps
the mechanism non-circular — without it, writing the receipt changes the diff the
receipt certifies.

If the staged diff is empty, say so and stop. There is nothing to review.

## Step 3 — Establish the stated intent

The reviewers need to know what this change is *supposed* to do, and they get **nothing
else** from you.

Derive it from the commit's scope: the feature's `01-prd.md` capabilities if this is
pipeline work, or the user's own words for a standalone change. Keep it to a few lines.

**Never pass along your reasoning, your plan, the implementer's justifications, or any of
this conversation.** A reviewer shown the author's rationale accepts it. Their coldness is
the mechanism; leaking context defeats it silently, and you will not be able to tell.

## Step 4 — Spawn all five in parallel

One message, five delegated reviewer calls, so they run concurrently and cannot influence one another:

| Agent | Lens |
|---|---|
| `reviewer-correctness` | logic, boundaries, error paths, ERD invariants, undefined identifiers |
| `reviewer-architecture` | Tier 3 only — ISP, premature abstraction, name correctness, state ownership |
| `reviewer-contracts-tests` | do the tests prove what they claim; contract fidelity; `ARCH-009` |
| `reviewer-security-concurrency` | `ARCH-004` room isolation, `ARCH-005` trust, ordering, capacity |
| `reviewer-design-fidelity` | does the built feature match the approved prototype |

Give each: the governed diff, the stated intent, the changed-file list, and the slug if
there is one. They read the standing docs themselves.

**Skip `reviewer-design-fidelity` only when the change has no user-visible surface** —
tooling, docs, or server-only work with no approved prototype to compare against. Say
explicitly that you skipped it and why; do not skip it silently.

## Step 5 — Aggregate OR-blocking

- **Any single `BLOCKING` finding blocks the commit.**
- No reviewer's `NON_BLOCKING` may downgrade another's `BLOCKING`.
- Do not merge, summarise away, or reconcile disagreement between reviewers. Report each
  finding as its author classified it. Reconciling is how a panel collapses into one
  opinion.
- A reviewer that returned nothing must have said so explicitly. If one returned an empty
  or malformed result, treat that as a **failed review**, not a clean one, and re-run it.

## Step 6 — Write the receipt

Only when the verdict is `CLEAR`:

```
.agents/review-receipts/<RECEIPT_KEY>.json
{
  "key": "<sha256 of the D1 patch>",
  "verdict": "CLEAR",
  "reviewers": ["reviewer-correctness", "..."],
  "skipped": ["reviewer-design-fidelity: no user-visible surface"],
  "nonBlockingCount": <n>,
  "changedFiles": [...],
  "at": "<ISO timestamp>"
}
```

**On a `BLOCKING` verdict, write no receipt.** The absence of a receipt is what blocks the
commit; writing one with a non-clear verdict would defeat the gate.

Receipts are untracked (`.gitignore`) because CI does not consume them and tracking them
would add churn to every commit for no reader.

## Step 7 — Report

```
Panel: 5 run, 0 skipped
BLOCKING:     n
NON_BLOCKING: n
Verdict:      CLEAR | BLOCKED
Receipt:      <key> | not written
```

Then every finding, `BLOCKING` first, each with its reviewer, `file:line`, and the
concrete failing state.

## What you must not do

- **Do not fix anything.** The panel reports; the implementer fixes. If you fix a finding
  yourself you have altered the diff, and the receipt would certify a different change
  from the one that was reviewed.
- **Do not re-run a reviewer hoping for a better answer.** Re-run only a failed or
  malformed one.
- **Do not argue a reviewer out of a finding.** If you believe one is wrong, say so in
  your report as your own assessment and leave the finding standing. You are not a sixth
  reviewer with veto power.
- **Do not write a receipt after any edit.** Any change to the tree changes the key, and a
  stale receipt is correctly rejected by the hook.
