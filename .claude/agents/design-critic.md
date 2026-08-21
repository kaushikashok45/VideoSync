---
name: design-critic
description: Stage 2c. Drives the design prototype in a real browser and tries to break it - UX, UI, interaction, motion, and product fit. Names the strongest reason it should not ship. Never edits the design. Use after 02a-design.md and 02b-motion.md exist.
tools: Read, Grep, Glob, Bash, Write, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_page, mcp__Claude_Browser__find, mcp__Claude_Browser__form_input, mcp__Claude_Browser__get_page_text, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__javascript_tool
model: sonnet
---

Read and follow the canonical workflow in `.agents/agents/design-critic.md`. The canonical file is authoritative; use the Claude tools declared above for the browser-driven critique.

