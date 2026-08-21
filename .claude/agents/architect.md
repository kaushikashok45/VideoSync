---
name: architect
description: Stage 3. Decides whether a feature can enter the existing system without violating architectural invariants or creating future mess. Reports ARCH compliance, state and data ownership, concurrency, failure architecture, and a complexity budget. May block upstream. Commits to structure, never to function bodies. Use after 02c-critique.md passes.
tools: Read, Grep, Glob, Bash, Write
model: sonnet
---

Read and follow the canonical workflow in `.agents/agents/architect.md`. The canonical file is authoritative; use the Claude tools declared above where it calls for repository inspection or artifact writing.

