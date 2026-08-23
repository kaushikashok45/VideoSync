# Brand Strategy — The Sync Party

Strategy Version: 1.0
Status: APPROVED
Last Updated: 2026-08-22

## Executive Strategic Summary

The Sync Party is a link-shared, host-dependent, ephemeral watch-together room for
small groups (~15) of friends/family (`PRODUCT.md`; `PRODUCT-MODEL.md` capacity
constraint). Its defining category trait — synchronized playback — is not yet
wired end to end (`PRODUCT-MODEL.md`, `OPEN-1`), and identity is unauthenticated
and advisory-only (`PD-003`). The strategic opportunity this document identifies
is structural, not emotional: every competitor sampled (Teleparty, Scener,
Discord Watch Together) is either a browser-extension overlay riding on a host
platform's own UI, or a feature nested inside a larger, unrelated product. The
Sync Party is neither — it is a standalone, purpose-built room. Positioning
leans into that structural fact ("a room of its own") rather than into
emotional-connection territory Teleparty already owns, or feature-completeness
territory this product cannot yet credibly claim (sync fidelity, permission
enforcement). This document is `REVIEW`, not `APPROVED`: several judgments below
rest on a three-competitor sample (one inaccessible) and this product's own
docs, with no independent user research to promote them past inference. A human
must confirm before this binds downstream stages as approved.

## Evidence Audit

| Source | What it establishes | Class |
|---|---|---|
| `PRODUCT.md` | users, purpose, approved journey, personality words, anti-references, design principles | PRODUCT-MODEL |
| `docs/PRODUCT-MODEL.md` | as-built capability inventory and wiring status; sync playback is `CONTRACT-ONLY`/`UNWIRED`; control delegation `UNWIRED`; capacity ~15; no accounts/persistence/analytics | PRODUCT-MODEL |
| `docs/DECISIONS.md` `PD-001`–`PD-003` | host-dependency (star topology), ephemeral in-memory rooms ending on host disconnect, unauthenticated/advisory identity | PRIOR-DECISION |
| `docs/DECISIONS.md` `PD-021`, `PD-022` | app-wide visual-system rebrand authorized; token *values* superseded, name/wordmark/personality words unaffected; header/footer visibility amendment | PRIOR-DECISION |
| `DESIGN.md` | committed dark-cinema execution, existing anti-slop rules of thumb, semantic z-index scale, motion/accessibility commitments | PRODUCT-MODEL |
| Teleparty homepage/support/App Store copy | https://www.teleparty.com/, https://apps.apple.com/us/app/teleparty-watch-tv-together/id6471985961 | COMPETITOR |
| Scener homepage | https://www.scener.com/ | COMPETITOR |
| Discord Watch Together coverage | https://support-apps.discord.com/hc/en-us/articles/26502500234519-Watch-Together-FAQ, https://www.xda-developers.com/discord-adding-youtube-watch-together/ | COMPETITOR |
| A24 homepage | https://a24films.com/ | DESIGN-REFERENCE |

No customer interviews, usage analytics, or market-size data exist for this
product (`PRODUCT-MODEL.md`'s closed list: no analytics/telemetry of any kind).
Every audience and motivation claim below is bounded by that absence and labelled
accordingly.

## Audience & Motivation Model

- **Who** (PRODUCT-MODEL, PRODUCT.md — HIGH): friends, family, and small
  communities up to ~15 people, watching from different places; one host per
  room supplies the media; no accounts, no return visits guaranteed by design
  (`PD-002`, `PD-003`).
- **Occasion** (PRODUCT.md — HIGH): "hey, I have this thing, watch it with me" —
  spontaneous, host-initiated, single-session.
- **Motivation** (AGENT-INFERENCE — MEDIUM): the emotional payoff is proximity
  despite distance, not the technology of sync itself; users do not care *how*
  playback stays aligned, only that the room feels shared. This is inferred from
  the product's own framing ("the watching feels together") and is not
  independently validated by any user research.
- **What "casual, social, low-commitment" is tested against**: the stakeholder
  request underlying this feature (`00-brief.md`, cited in `01-prd.md`) asks for
  an "immersive," "hyperrealistic," "premium" landing treatment. That request and
  PRODUCT.md's own "casual, low-commitment" self-description are in tension, not
  automatically compatible — recorded below under Brand Tensions rather than
  silently resolved in either direction.

## Customer Alternatives

A user with this need today reaches for, in rough order of evidence strength:

1. **Teleparty** (COMPETITOR) — free browser extension, overlays Netflix/
   YouTube/HBO Max's own player chrome; brand voice leans emotional/
   long-distance ("watch, laugh, cry, share all the feels...across timezones").
2. **Discord Watch Together** (COMPETITOR) — a feature inside an existing voice
   channel in a chat platform most users already have open for other reasons;
   framed as one "Activity" among several, not a destination.
3. **Scener** (COMPETITOR) — a dedicated site with a minimal marketing
   presentation (single hero, fixed 4-link header); structural shape of its
   actual watch room is not established by the homepage alone — recorded as
   **insufficient evidence**, not assumed.
4. **A plain group call with someone holding a phone/laptop up to a screen, or
   texting "3, 2, 1, play"** (AGENT-INFERENCE — no citation exists for this;
   it is the default "no tool" alternative any watch-together product competes
   against, named because it is the honest zero-cost baseline).

## Competitive Landscape

| Product | Structural shape | Brand register | Source |
|---|---|---|---|
| Teleparty | Browser extension overlaying a host platform's own UI; user never leaves Netflix/YouTube's chrome | Emotional/long-distance, casual, free-tool | https://www.teleparty.com/ |
| Scener | Dedicated site, minimal marketing chrome, unverified room-UI shape | Restrained, utility-forward | https://www.scener.com/ |
| Discord Watch Together | A feature nested inside a general chat/voice platform | Gamer-adjacent, "Activity," not a destination | https://support-apps.discord.com/hc/en-us/articles/26502500234519-Watch-Together-FAQ |

**Category read (AGENT-INFERENCE — MEDIUM):** none of the three sampled
competitors present the watch-together moment as its own destination with a
fully owned visual environment. Two are structurally borrowed spaces (an
overlay, a nested feature); the third's actual room experience is unverified.
This is the one gap in the sample this document can respond to with a
structural claim it can actually back with evidence (`PRODUCT-MODEL.md`: this
product's player, header, and room chrome are its own, not borrowed from a host
platform), rather than an emotional or feature-completeness claim it cannot
currently back (sync fidelity is `UNWIRED`; permission is advisory-only).

## Category Analysis

The category is "synchronized watch-together tooling." Its two structural
species, observed: (a) **browser-extension overlays** that skin an existing
streaming site's own UI, and (b) **features nested inside a larger,
unrelated platform** (chat, voice, gaming). A third species — **a standalone,
purpose-built room** — is not clearly occupied by any sampled competitor. That
is this product's actual shape today (`PRODUCT-MODEL.md`: own routes, own
player, no host-platform dependency), independent of anything this feature
changes. The rebrand under review does not create this differentiator; it is
the first feature to give that existing structural fact a visual identity that
reads as intentional rather than incidental.

## Strategic Opportunity

Own the **"dedicated room" territory**: position The Sync Party as a place built
specifically for watching something together, not a skin on someone else's
platform and not a bolt-on feature of an unrelated product. This is
**HYPOTHESIS**-adjacent in its persuasive power (no data on whether users care
about this distinction) but **VERIFIED** as a factual differentiator
(`PRODUCT-MODEL.md`'s navigable-surface and capability tables show a
self-contained set of routes and UI with no host-platform dependency).

## Strategic Territories

1. **A Room of Its Own** — the standalone-destination positioning above.
2. **Effortless Together** — frictionless, one-link-one-name entry as the hero
   claim.
3. **The Long-Distance Movie Night** — emotional-connection/distance framing.
4. **The Democratic Watch Party** — shared control/equality among viewers as the
   hero claim.

## Territory Evaluation

| Territory | Relevance | Credibility | Distinctiveness | Defensibility | Emotional potential | Memorability | Longevity | Verdict |
|---|---|---|---|---|---|---|---|---|
| A Room of Its Own | High — matches actual product shape | High — backed by `PRODUCT-MODEL.md` structural facts | High — no sampled competitor occupies this | Medium — a competitor could copy the *structure* but not the accrued cinema-room identity built on top of it | Medium — "a place, not a tool" has warmth potential | Medium-High | High — structural, not trend-dependent | **Selected** |
| Effortless Together | High | High | Low — already a design *principle* (`PRODUCT.md` #5), not a differentiated *position*; every watch-party tool claims low friction | Low — genericity risk | Medium | Low | Medium | Rejected — genericity failure |
| The Long-Distance Movie Night | Medium | Medium | Low — this is Teleparty's stated territory verbatim ("across timezones, no matter the distance") | Low — competitor-owned | High | Medium | Medium | Rejected — substitution test fails immediately against the one competitor whose own copy already reads this way |
| The Democratic Watch Party | Medium | **Low** — control delegation is `UNWIRED` (`PRODUCT-MODEL.md`, `OPEN-2`); authorization is advisory-only (`PD-003`) | Medium | Low | Medium | Medium | Low — depends on shipping something not yet built | Rejected — not credible against as-built product |

## Positioning Decision

**The Sync Party is a room built for watching something together — not a
feature bolted onto someone else's platform, and not an overlay skinned onto
someone else's player.**

Rejected alternatives: Effortless Together (generic — every competitor in the
category makes the same claim, and this product already states it as a design
*principle*, not a differentiator); The Long-Distance Movie Night (already
Teleparty's territory, verified by direct copy); The Democratic Watch Party (not
credible — the underlying capability is unwired and unauthenticated).

## Brand Strategic Core

- **Category**: synchronized watch-together tooling for small private groups.
- **Primary audience**: friends/family/small communities (~15 people) coordinating
  a spontaneous shared watch session (`PRODUCT.md`, `PRODUCT-MODEL.md`).
- **Customer problem**: wanting to watch something together in real time while
  physically apart, without adopting a general-purpose platform for it.
- **Current alternative**: a browser extension overlaying a streaming site, or a
  feature nested inside an unrelated chat/voice platform.
- **Desired outcome**: the watching feels shared, not administered.
- **Functional value**: one link, one name, into a synced room.
- **Emotional value**: presence despite distance, in a space that feels made for
  this moment rather than borrowed for it.
- **Differentiation**: a self-contained room with its own identity, not an
  overlay or a nested feature (VERIFIED structurally; persuasive weight
  UNKNOWN).
- **Reason to believe**: the product's own routes, player, and chrome are
  independent of any host platform (`PRODUCT-MODEL.md`).
- **Strategic territory**: A Room of Its Own.
- **Positioning**: stated above.
- **Brand promise**: every room feels like a place made for this watch, not a
  tool rented for it.
- **Desired associations**: a private cinema for a few people; a generous host;
  honest about what's happening right now.
- **Associations to avoid**: enterprise reliability/security; gamer/Discord
  aesthetic; generic SaaS dashboard; browser-extension/toolbar feel; premium
  polish that implies a technical fidelity (flawless sync, enforced permissions)
  the product does not yet deliver.

## Brand Promise

Every room feels like a place made for this watch, together — not a tool
borrowed or rented for the occasion, and never pretending to be more
synchronized, secure, or permanent than it actually is right now.

## Brand Meaning

- **We are**: a dedicated room for watching something together, built and owned
  end to end by this product, not borrowed from a streaming site's chrome or
  nested inside an unrelated app.
- **We stand for**: the warmth of a shared occasion; honest, plain-language state
  communication (`PRODUCT.md`'s own "never implies everyone is synchronized when
  the system knows otherwise"); a host who makes starting effortless.
- **We are not**: a browser extension; a feature inside a chat/gaming platform;
  an enterprise collaboration tool; a persistent social network.
- **We do not stand for**: implying security or enforced permissions we do not
  have (`PD-003`); implying rooms remember anything (`PD-002`); implying
  playback is perfectly synchronized when the engine behind that claim is not
  wired end to end (`PRODUCT-MODEL.md`, `OPEN-1`); premium visual polish as a
  substitute for honesty about system state.

## Brand Personality

1. **Warm** — meaning: hospitality, not corporate politeness. Behaviour: copy
   addresses the person, not "the user." Communication: plain, direct
   invitations ("Start a party"). Positive expression: a host screen that feels
   like handing someone the good seat. Failure mode: saccharine or cutesy
   (rejected explicitly by `PRODUCT.md`'s anti-references). Explicitly not:
   corporate-friendly SaaS warmth ("we're so excited you're here!").
2. **Cinematic** — meaning: composed, considered, unhurried. Behaviour: the
   content being watched stays visually dominant. Communication: restrained,
   not effusive. Positive expression: a room that feels like a small private
   screening. Failure mode: cinematic-as-decoration (gradients, glass, generic
   "premium" chrome `DESIGN.md` already rejects). Explicitly not: a streaming
   platform's own busy shelf-and-badge chrome.
3. **Effortless (as host)** — meaning: starting or joining costs one link and one
   name. Behaviour: no unnecessary steps between invite and shared moment.
   Communication: short, action-first copy. Positive expression: joining reads
   as immediate. Failure mode: effortless read as thin/unfinished. Explicitly
   not: minimalism used to disguise missing functionality.
4. **Plainspoken** — meaning: the interface says what is actually true right
   now, including when that truth is "waiting" or "not yet synced."
   Behaviour: state language never overclaims (`PRODUCT.md`'s own
   synchronization-honesty commitment). Communication: "Waiting for host," not
   "Perfectly synced." Positive expression: users trust the interface because it
   never oversold something it then failed to deliver. Failure mode: bluntness
   that reads as unfinished or cold. Explicitly not: marketing copy claiming
   capability the product doesn't have end to end.
5. **Playful** — meaning: reactions, chat, and small delight exist because
   co-watching is social, not purely functional. Behaviour: playful details are
   bounded, never structural. Communication: light touches (emoji, reaction
   tray) inside a composed frame. Positive expression: a reaction landing at the
   right beat. Failure mode: toy-like decoration that undercuts the cinema mood
   (`PRODUCT.md` anti-reference). Explicitly not: gamification, streaks, badges,
   or novelty-for-its-own-sake interactions.

## Brand Tensions

1. **Premium/experimental ambition vs. casual/low-commitment self-description.**
   The stakeholder request driving this feature explicitly wants "hyperrealistic"
   and "experimental" execution; `PRODUCT.md` describes the product as
   "casual, social, low-commitment." Both are legitimate; downstream stages must
   hold both rather than silently picking one. This document does not resolve
   which wins in a given screen — that is `page-strategist`'s and
   `creative-director`'s call within the guardrails below, not a license to
   abandon "low-commitment" entirely.
2. **Warmth/playfulness vs. cinematic restraint.** Reactions and chat must feel
   present without competing with the "video is the stage" principle
   (`DESIGN.md` Principle #1).
3. **Honesty about system limits vs. selling the category's defining promise.**
   "Synchronized" is the product's name and its stated purpose, but the
   mechanism is `UNWIRED` today. Marketing language can describe the *intended*
   experience but must not depict or claim flawless, functioning sync as a
   present-tense fact (see Strategic Invariants, `INV-3`).
3. **Distinct-enough visual ambition vs. "effortless, gets out of the way."** A
   bold enough identity to read as "a room of its own" against minimal
   competitors, without the identity itself becoming the thing users have to
   navigate around.

## Brand Anti-Positioning

- **Generic SaaS chrome** — sidebar-plus-gray-card dashboards; this product has
  three inputs total (name, room code, URL) and should never look like it has
  more.
- **Gamer aesthetic** — Discord-adjacent, badge/level/streak decoration; rejected
  because it misrepresents a casual watch session as a competitive or
  achievement-driven space.
- **AI-slop premium gradients** — glassmorphism, gradient text, uniform rounded
  card grids, decorative uppercase eyebrows, generic marketing copy
  (`DESIGN.md`'s existing rules of thumb, adopted here as a **brand-level**
  guardrail, not merely a token-level one — see `INV-4`).
- **Watch-party feature-brochure marketing** — imagery or copy depicting
  capabilities not wired end to end (synchronized multi-device playback "in
  action," enforced permissions, persistent history).
- **Browser-extension/toolbar visual metaphors** — anything that reads as an
  overlay skinned onto a *different* product's chrome, which would undercut the
  "room of its own" positioning this document selected.

## Desired Brand Associations

**Desired**: a small private cinema; a generous, effortless host; honesty about
what's happening right now; warmth without cuteness; a place, not a tool.

**Avoid**: enterprise reliability/security; gamer/streak/badge culture; generic
SaaS productivity software; a browser extension or toolbar; flawless
synchronization as a present-tense technical claim.

## Voice & Tone

**GOOD**:
- "Start a party" / "Join with a room code"
- "Waiting for host to start."
- "Catching up…" / "Synced"
- "Your room's ready when you are."

**BAD**:
- "Enterprise-grade synchronization engine." — wrong register (enterprise
  claim), and an overclaim against `OPEN-1`.
- "Seamless, always-on collaboration platform." — generic SaaS voice, implies
  reliability guarantees the product does not make.
- "🔥🔥 LEVEL UP your movie night!" — gamer/toy-like, rejected by `PRODUCT.md`'s
  anti-references.
- "100% perfectly synced, guaranteed." — a plainspoken-trait violation and an
  `INV-3` violation; the interface must never imply certainty the system does
  not have.

## Strategic Guardrails

- Every capability's user-facing language stays within what is actually wired
  (`PRODUCT-MODEL.md` wiring status) — a feature marked `UNWIRED` or
  `CONTRACT-ONLY` may not be depicted as functioning in marketing or in-product
  copy.
- No claim implies persistent identity, memory, or enforced security (`PD-002`,
  `PD-003`).
- Visual ambition in service of "a room of its own" must not reintroduce the
  generic-premium patterns `DESIGN.md` already names and this document adopts at
  brand level (`INV-4`).
- Warmth and playfulness are bounded by the cinema mood; they support the
  content being watched, never compete with it.

## Strategic Invariants

- **INV-1 — No implied memory or persistence.** No copy, imagery, or interaction
  implies a room, its history, or a user's identity persists beyond the current
  session (`PD-002`, `PD-003`).
- **INV-2 — No implied enforced security or authenticated identity.** No
  copy implies "permission," "control," or "host authority" is
  server-enforced beyond what `PRODUCT-MODEL.md` records as actually
  server-authoritative (room create, lock/unlock, host-disconnect
  termination). Playback control and any other permission language must read as
  advisory, consistent with `PD-003`.
- **INV-3 — No implied flawless or currently-functioning synchronized
  playback.** Imagery and copy may describe the *intended* shared-watching
  experience but must not depict or assert synchronized multi-device playback
  as a present, functioning, flawless fact while it remains `CONTRACT-ONLY`/
  `UNWIRED` (`PRODUCT-MODEL.md`, `OPEN-1`).
- **INV-4 — Anti-slop rules of thumb are brand-level, not merely token-level,
  narrowed by `PD-025`.** `DESIGN.md`'s "no glassmorphism, no gradient text, no
  side-stripe borders, no uppercase-tracked eyebrows" checklist still binds.
  The prior blanket "generic-SaaS patterns" clause is narrowed by `PD-025`:
  the requester explicitly chose a Tailark/shadcn-derived, Vercel/Geist-style
  monochrome system as the standing visual direction, which reads as
  structurally SaaS-adjacent by design (pill buttons, badge pills, a
  contained gradient-mesh panel) — that specific silhouette is no longer
  treated as a violation. What still counts as slop under this invariant:
  glassmorphism, gradient text, more than one saturated accent in normal use,
  decorative uniform card grids with no information behind them, and generic
  marketing copy that could belong to any product. A future direction change
  still requires a separate brand-strategist review before reintroducing any
  of those specific patterns.
- **INV-5 — Warmth stays out of "cutesy/toy-like" territory.** Carried directly
  from `PRODUCT.md`'s anti-references; playful details never undercut the
  cinema mood.
- **INV-6 — The content being watched stays the visual and narrative center.**
  New chrome (headers, footers, marketing sections) supports the watching
  moment and never competes with it for attention (`DESIGN.md` Principle #1,
  `PRODUCT.md` Principle #11).

## Downstream Agent Contract

- **MUST PRESERVE**: the positioning ("a room of its own"), the five personality
  traits, the brand meaning statements, the anti-positioning list, `INV-1`
  through `INV-6`.
- **MAY INTERPRET**: specific colour, typography, imagery style, motion,
  layout, exact copy wording, and header/footer content — within the
  guardrails and invariants above.
- **MUST NOT INTRODUCE**: security/enterprise-reliability claims; gamer/SaaS/
  browser-extension visual metaphors; glassmorphism/gradient-text/AI-slop
  decoration; depictions of synchronized playback, enforced permissions, or
  persistence beyond what is actually wired.
- **REQUIRES BRAND STRATEGIST REVIEW**: any change to positioning, personality,
  territory, or an invariant; any new user-facing claim about a capability's
  functioning state; any proposal to relax `INV-4` on the grounds that `PD-021`
  supersedes DESIGN.md's tokens.

## Decision Ownership

`brand-strategist` owns positioning, promise, personality, territory, and the
invariants above. `design-lead`/`motion-lead`/`visual-designer` own execution
within them. `pm-analyst` owns whether an underlying capability actually exists
to be promised. A human confirms any Decision Log entry before this document's
body changes.

## Evidence & Assumptions

**Verified Facts** (PRODUCT-MODEL / CODE / PRIOR-DECISION): host-dependent star
topology (`PD-001`); ephemeral in-memory rooms ending on host disconnect
(`PD-002`); unauthenticated, advisory-only identity (`PD-003`); synchronized
playback `CONTRACT-ONLY`/`UNWIRED` (`PRODUCT-MODEL.md`, `OPEN-1`); control
delegation `UNWIRED` across three layers (`OPEN-2`); capacity ~15
(`PRODUCT-MODEL.md`); `DESIGN.md`'s existing anti-slop rules of thumb; `PD-021`
authorizes app-wide token-value replacement while keeping name/wordmark/
personality words authoritative; `PD-022` amends chrome visibility for
fullscreen.

**Research Findings** (COMPETITOR): Teleparty is a browser-extension overlay
with an emotional/long-distance brand voice (https://www.teleparty.com/); Discord
Watch Together is a nested feature inside a chat/voice platform, framed as one
"Activity" among several (https://support-apps.discord.com/hc/en-us/articles/26502500234519-Watch-Together-FAQ);
Scener presents a minimal marketing homepage but its actual room-experience
structure is not established by available evidence (https://www.scener.com/).

**Strategic Inferences** (AGENT-INFERENCE, not `HIGH` confidence): "a room of
its own" is a structurally available position because the two verifiable
competitors are borrowed-space shapes; whether users perceive or value this
distinction is not established by any evidence this document has access to.

**Hypotheses**: that higher visual production value ("premium," "hyperrealistic")
increases perceived attractiveness for this audience — asserted by the
stakeholder request, untested by any user research.

**Unknowns**: whether the target audience (casual friends/family groups) values
cinematic polish over simplicity/speed; whether Teleparty/Scener users would
recognize or value the "dedicated room" distinction; whether any user has ever
compared this product to a named competitor. `PRODUCT-MODEL.md` confirms no
analytics/telemetry exists to close these gaps from usage data.

## Strategic Risks

- **CRITICAL** — Visual ambition could outrun product capability: a "cinematic,
  premium, immersive" identity risks implying a polish and reliability the
  underlying synchronized-playback mechanism does not yet deliver end to end
  (`OPEN-1`). Any copy or imagery depicting sync "in action" as a present,
  working fact would violate `INV-3` and is a credibility risk beyond this
  feature's scope alone.
- **IMPORTANT** — The tension between stakeholder-requested "premium/
  hyperrealistic/experimental" direction and `PRODUCT.md`'s "casual,
  low-commitment" self-description (Brand Tension #1) could be silently
  resolved in favor of "premium" by downstream visual stages without brand
  visibility, drifting the product toward generic premium-SaaS or AI-slop
  territory this document explicitly rejects.
- **IMPORTANT** — No analytics, telemetry, or user research exists
  (`PRODUCT-MODEL.md`'s closed list) to validate any positioning judgment in
  this document against actual user perception; every judgment above the
  Verified Facts tier is an inference from a three-competitor sample (one
  unverifiable) and this product's own docs.
- **MINOR** — The product name foregrounds "Sync" precisely where the product is
  currently weakest (`OPEN-1`); out of scope to change (`PD-021` keeps the
  name/wordmark authoritative) but a standing naming-level risk worth carrying
  forward.

## Open Questions

- Should any user-facing copy use the word "synchronized" in present tense
  before `OPEN-1` resolves, or should copy describe intent ("watch together")
  without asserting present-tense sync fidelity? Needs a human product decision,
  not a brand-strategist unilateral call, since it touches what `pm-analyst` and
  copy-writing stages may claim.
- Is there any plan for user research that could promote this document's
  Strategic Inferences to Verified Facts? None is recorded in `PRODUCT-MODEL.md`
  today.
- Does Brand Tension #1 (premium/experimental vs. casual/low-commitment) need an
  explicit human ruling now, or can it stay a held tension for `page-strategist`/
  `creative-director` to navigate per screen? Recommended: hold as a tension
  unless a specific downstream conflict surfaces.

## Decision Log

| Version | Decision | Reason | Evidence | Impact |
|---|---|---|---|---|
| 1.0 | Selected "A Room of Its Own" over Effortless Together, The Long-Distance Movie Night, and The Democratic Watch Party | Only territory that is both factually credible against `PRODUCT-MODEL.md` and structurally undifferentiated-from by the sampled competitors | COMPETITOR (Teleparty, Discord Watch Together), PRODUCT-MODEL | Sets the standing positioning for every future feature; supersedes nothing (first version) |
| 1.0 | Adopted `DESIGN.md`'s anti-slop rules of thumb as a brand-level invariant (`INV-4`), independent of token values | `PD-021` supersedes token *values* only; anti-slop rules describe decorative/taste patterns that hold regardless of palette | PRIOR-DECISION (`PD-021`), AGENT-INFERENCE | Binds every future visual-rebrand feature, including the one that prompted this document's creation |
| 2.0 | Narrowed `INV-4`'s "generic-SaaS patterns" clause to a specific list (glassmorphism, gradient text, multi-accent, decorative card grids, generic copy) rather than a blanket ban | Requester explicitly chose a Tailark/shadcn/Vercel-monochrome direction, which is structurally SaaS-adjacent by design; a blanket clause would forbid the requester's own explicit choice | REQUESTER-DIRECTION, PRIOR-DECISION (`PD-025`) | `app-visual-rebrand`'s governed pipeline (Territory 2) is abandoned; the shadcn direction ships instead, app-wide |

## Brand Strategy Acceptance Test

| Test | Result | Reasoning |
|---|---|---|
| Evidence | PASS | Every substantive claim carries a closed-list evidence class; `ASSUMPTION`/`AGENT-INFERENCE` claims are labelled and not promoted to `HIGH` confidence. |
| Audience | PASS (bounded) | Audience is well-specified by `PRODUCT.md`/`PRODUCT-MODEL.md` (size, relationship type, occasion), but rests entirely on product docs, not independent primary research. |
| Problem | PASS | The customer problem (wanting to watch together while apart, without adopting an unrelated platform) is grounded in `PRODUCT.md`'s stated purpose. |
| Alternative | PASS | Three named competitor alternatives plus the "no tool" baseline. |
| Differentiation | PASS (bounded) | Structural differentiation (standalone room vs. overlay/nested feature) is verifiable against `PRODUCT-MODEL.md`; its persuasive weight with real users is unverified. |
| Credibility | PASS | Positioning does not claim anything the product cannot currently back — sync fidelity and permission enforcement are explicitly excluded from the promise (`INV-2`, `INV-3`). |
| Competitive Ownership | PARTIAL | Clearly unowned by Teleparty (emotional/overlay) and Discord (nested feature); Scener's actual room-structure is unverified, so ownership relative to Scener specifically is not established. |
| Defensibility | PARTIAL | The structural fact (no host-platform dependency) is easy to state but a competitor could build the same structure; what's harder to copy is the accrued personality/visual identity built on top of it, which does not yet exist. |
| Relevance | PASS | Matches the audience's stated occasion (spontaneous, low-commitment, small-group). |
| Memory | PASS (tentative) | "A room of its own" is a simple, repeatable frame; untested with real audiences. |
| Longevity | PASS | Structural, not trend-dependent — unlike a visual-trend-based territory, this does not expire when a design fashion changes. |
| Personality | PASS | Five traits each carry meaning/behaviour/communication/expression/failure mode/explicit exclusion. |
| Downstream | PASS | Contract section states MUST PRESERVE / MAY INTERPRET / MUST NOT INTRODUCE / REQUIRES REVIEW explicitly. |
| Substitution | PARTIAL | Swapping in "Teleparty" makes the positioning read false (Teleparty *is* an overlay) — a good sign. Swapping in "Discord Watch Together" also reads false (it *is* a nested feature). Swapping in "Scener" cannot be conclusively tested — insufficient evidence about Scener's actual room structure. |
| Genericity | PASS (bounded) | The structural mechanism alone ("we're not an overlay") is somewhat generic to any standalone web app; specificity comes from pairing it with the five personality traits and this product's concrete shape (host-dependent, ephemeral, ~15-person room) — an unrelated product could not adopt the full package unchanged. |

**Overall**: `REVIEW`. Two tests (`Competitive Ownership`, `Substitution`) are
only partially resolved because of a genuine evidence gap (Scener's room
structure was not independently verifiable), and the entire document rests on
zero primary user research, which `PRODUCT-MODEL.md` confirms does not exist
for this product. A human should confirm the positioning and the two brand-level
invariants (`INV-3`, `INV-4`) before this document is marked `APPROVED`.
