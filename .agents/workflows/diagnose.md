---
description: Forces a deep structural diagnostic of a bug to prevent localized code-patching behavior.
---

---

name: /diagnose
description: Forces a deep structural diagnostic of a bug to prevent localized code-patching behavior.

---

# Workflow: Root-Cause Architectural Diagnostic

## Execution Pipeline

1. **Phase 1: Deep Analysis**
   - **Action:** Analyze the codebase context surrounding the reported error or design flaw. Do not modify any codebase files during this phase.
   - **Output Artifact:** `diagnostic_report.md`

2. **Phase 2: Strategy Drafting**
   - **Action:** Present a clean, structural refactoring strategy that fixes the root cause rather than patching the symptom.
   - **Output Artifact:** `implementation_plan.md`

3. **Phase 3: Human Verification Gate**
   - **Action:** Halt all agent tool execution loops immediately. Await explicit user review, feedback, and verification of the structural plan before touching or editing any files in the workspace.
