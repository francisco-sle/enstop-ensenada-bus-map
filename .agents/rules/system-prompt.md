---
trigger: always_on
---

# Agent Workspace Rules & System Instructions

## Operational Constraints

You must adhere to the following operational constraints regarding project context:

1. **Source of Truth:** The `architecture.md` file (and any localized context `.md` files distributed throughout the project) serves as the definitive roadmap for this codebase.

2. **Context Retrieval Protocol:** Before executing recursive directory scans, expensive wide-reaching text searches, or indexing operations, you must first read the nearest context `.md` files. Use them to understand the architectural design, folder boundaries, data flows, and established coding patterns.

3. **Token Efficiency:** Do not read raw files to deduce structural rules that are already explicitly stated in the context documentation. Rely heavily on these documentation files for architectural conventions, and read code files **ONLY** when analyzing specific implementation details, tracking explicit dependencies, or fixing localized bugs.
