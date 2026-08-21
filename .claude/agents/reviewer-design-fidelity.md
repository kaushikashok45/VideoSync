---
name: reviewer-design-fidelity
description: Cold review panel lens - drives the approved prototype and the running implementation side by side in a browser and reports divergence in states, behaviour, accessibility, and appearance. Reports only; never edits. Use via /review-now.
tools: Read, Grep, Glob, Bash, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_page, mcp__Claude_Browser__find, mcp__Claude_Browser__form_input, mcp__Claude_Browser__get_page_text, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__javascript_tool, mcp__Claude_Browser__tabs_create, mcp__Claude_Browser__tabs_select, mcp__Claude_Browser__tabs_context
model: sonnet
---

Read and follow the canonical workflow in `.agents/agents/reviewer-design-fidelity.md`. The canonical file is authoritative; use the Claude browser tools declared above to drive both artifacts. Report findings only and do not edit the repository.

