---
trigger: always_on
---

# Agent Rule: React & Tailwind Design System Standards

## 1. Core Architecture Constraints

- **Tailwind Engine version:** Tailwind v4.x (CSS-First architecture).
- **Configuration File:** Under no circumstances should you create or modify a `tailwind.config.js`. All design system tokens, configurations, and overrides must live inside the global CSS entry point (`app.css` or `global.css`) using the `@theme` directive.
- **Strict Purge Compliance:** Never dynamically construct Tailwind class strings using runtime interpolation (e.g., `text-${variant}-600` or `p-${paddingSize}`). All class sequences must remain fully literal so the static analysis engine can detect and preserve them.

## 2. Token Specification & Layout Architecture

When adjusting properties or themes globally, maintain the following structural schema directly in the CSS root:

```css
@import "tailwindcss";

@theme {
  /* System Brand Tokens */
  --color-brand-primary: oklch(0.62 0.17 256.4);
  --color-brand-secondary: oklch(0.48 0.15 281.2);
  --color-surface-bg: oklch(0.98 0.01 247.5);

  /* System Responsive Scales (Mobile-First Defaults) */
  --breakpoint-sm: 40rem; /* 640px - Small tablets / Landscape mobile */
  --breakpoint-md: 48rem; /* 768px - Large tablets */
  --breakpoint-lg: 64rem; /* 1024px - Standard Laptops */
  --breakpoint-xl: 80rem; /* 1280px - Large Desktops */
}
```
