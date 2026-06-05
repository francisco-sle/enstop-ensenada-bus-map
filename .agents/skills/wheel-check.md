---
name: wheel-check
description: Mandatory verification sequence to prevent duplicating existing project functions, components, or utilities.
---

# Skill: Codebase Inventory Verification

## Protocol

Before creating any new helper utility, service method, internal React UI component, or data transformation layer:

1. **Search First:** Use the codebase search tool to check for keywords, synonyms, or similar concepts already defined in the workspace.
2. **Read Shared Directories:** Always inspect internal global utilities (`src/utils/`, `src/hooks/`, etc.) to see if a similar mechanism exists.
3. **Adapt Over Create:** If a utility exists that covers 80% of the required functionality, refactor that utility to support the remaining 20% instead of generating a new, isolated file.
4. **Justification:** If you must create a new component or utility, explicitly state in 1 sentence which existing files you checked and why they were insufficient.
