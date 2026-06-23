---
name: /commit
description: Commits the current workspace changes with a meaningful and concise commit message. Does not push.
---

# Workflow: Smart Commit

## Execution Pipeline

1. **Phase 1: Analyze Changes**
   - **Action:** Run `git status` and `git diff` to deeply understand the context of the modifications. Do not just look at file names; analyze the actual code changes to grasp the intent.

2. **Phase 2: Stage Changes**
   - **Action:** Execute `git add .` to stage all modified, deleted, and new files (unless the user explicitly requested partial staging).

3. **Phase 3: Generate and Execute Commit**
   - **Action:** Synthesize a clear, concise, and meaningful commit message. The message should describe *what* changed and *why*, rather than just restating the diff.
   - **Action:** Execute `git commit -m "<message>"`.
   - **Constraint:** **DO NOT PUSH**. You must stop after the commit is successfully created.

4. **Phase 4: Completion**
   - **Action:** Output a short, concise message confirming the commit is complete.
   - **Constraint:** **DO NOT** ask for further instructions, do not ask if the user wants to push, and **DO NOT** pause for user input. Terminate the workflow immediately after the confirmation message.
