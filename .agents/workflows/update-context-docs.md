---
description: Conforms to the project architecture standards by scanning the repository structure and updating core architectural `.md` files.
---

---

name: /update-context-doccs
description: Conforms to the project architecture standards by scanning the repository structure and updating core architectural `.md` files.

---

# Workflow: Update Context Documentation

Conforms to the project architecture standards by scanning the repository structure and updating core architectural `.md` files.

## Metadata

- **Name:** Update Context Documentation
- **Trigger:** Manual
- **Description:** Scans the codebase, extracts design patterns, and updates project roadmap documentation for optimal AI context retrieval.

## Exclusion Rules

To prevent token waste, ignore these directories during the scan:

- `node_modules/`
- `dist/`
- `.git/`
- `.agents/`
- `tests/`

---

## Execution Steps

### Step 1: Scan and Analyze Repository Structure

Run a full directory analysis on the active workspace. Focus on core logic zones:

- `src/`
- `lib/`
- `config/`

Examine directory nesting, primary file entry points, and database schemas/types if present.

### Step 2: Generate/Update Architecture Documentation

Using the gathered repository state, update the `./architecture.md` file in the root directory.

#### Prompt Instructions for Agent:

Act as a Principal Software Architect. Analyze the gathered repository data and generate or modify the project's `architecture.md` file.

Adhere to these strict guidelines to maximize token efficiency:

1. **High Signal-to-Noise:** Focus on the "Rules" of the system, not the "Contents." Do not list individual files or components.
2. **Structural Overview:** Map out the directory layout at a high level. Explain what each folder's _purpose_ is (e.g., "Contains state machines", "Handles Leaflet map layers").
3. **Tech Stack & State:** Explicitly detail the core technologies, global state providers, and database clients being used.
4. **Data Flow:** Summarize how data flows between your frontend views, hooks, and backend services/databases.
5. **Instruction Marker:** Ensure the very first line of the output file contains this exact blockquote:
   > **System Note:** This file is the absolute source of truth for codebase architecture. Prioritize these rules over automated vector search.

#### Output Configuration:

- **Mode:** Overwrite / Synchronize
- **Target Path:** `./architecture.md`
