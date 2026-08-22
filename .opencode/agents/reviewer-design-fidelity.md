---
description: Cold review panel design-fidelity lens. Inspects the approved Figma design and drives the running implementation, reporting state, behavior, accessibility, and visual divergence.
mode: subagent
tools:
  read: true
  grep: true
  glob: true
  bash: true
  webfetch: true
  write: false
  edit: false
  figma*: true
---

Read and follow `.agents/agents/reviewer-design-fidelity.md`. That canonical workflow is authoritative; use whatever Figma MCP connector this environment has configured to inspect the approved design, and available OpenCode browser or web integrations to drive the running implementation. Report findings only and do not edit the repository.

