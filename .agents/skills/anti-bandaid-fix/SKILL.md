---
name: anti-bandaid-fix
description: Use this skill whenever the developer asks to fix a bug, correct an unhandled edge case, or eliminate a console error/failing test. This ensures code isn't patched lazily.
---

# Skill: Root-Cause Architectural Rectification

## Goal

Eliminate localized "Band-Aid" code patches by forcing a deep code structural review before any modifications are committed.

## Step-by-Step Instructions

1. **Locate and Isolate:** Inspect the file where the bug manifests. Trace upstream data flow to see where the data or state originates.
2. **Formulate the Matrix:** Before generating code, construct an internal evaluation of the problem. You must draft an internal or shared comparative overview matching these requirements:
   - **Approach A (The Quick Patch):** What does a localized `if` check or fallback patch look like? What technical debt does it introduce?
   - **Approach B (The Architectural Clean Fix):** How can the underlying function signature, type definition, state layout, or flow structure be modified to naturally support this scenario without explicit branching?
3. **Execution Block:** Reject Approach A entirely. Implement Approach B.
4. **Self-Auditing:** After generating the fix, verify that the solution did not introduce dead code or redundant validations elsewhere in the file.
