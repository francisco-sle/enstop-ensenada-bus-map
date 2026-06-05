---
trigger: always_on
---

# Architectural Anti-Patching Standards

## Context & Intent

- Agents must prioritize code health over minimal git diffs. Hasty conditional branching to pass test suites or eliminate console errors is heavily penalized.

## Mandatory Fix-Loop Protocols

1. **Root-Cause Analysis:** When an error or bug is reported, do not touch the code file immediately. You must inspect the data-flow chain or component composition to trace _why_ the bad state is possible.
2. **Anti-Branching Constraint:** Do NOT add localized edge-case mitigations (such as nested `if` statements, redundant `?.` optional chains on properties that should be strictly typed, or localized `try/catch` wrappers) if the issue stems from an unhandled state machine or architectural layout flaw.
3. **Refactor-First Mandate:** If an existing function, React custom hook, or component abstraction can be gracefully refactored to encompass the scenario cleanly, you _must_ propose the refactor over a patch.
4. **Complexity Limit:** Any fix that increases cyclomatic complexity or introduces more than 1 additional logic branch must be flagged in the `implementation_plan.md` artifact with an explicit justification.
