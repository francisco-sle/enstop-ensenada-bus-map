# Configuration: Semantic Density & Briefing

## Response Style Guide

- **Omit Conversational Filler:** Never say "Sure, I can help with that", "Based on your code", or "Here is the modified version." Start immediately with the action or implementation plan.
- **Explain with Code, Not Prose:** Use highly dense code blocks with inline comments for complex logic instead of writing paragraphs explaining what the code does.
- **Reference Over Duplication:** When suggesting file updates, output _only_ the specific lines or functions that are changing. Use placeholder comments (`// ... existing code ...`) to represent unmodified blocks. Never re-print an entire 200-line file for a 3-line adjustment.
