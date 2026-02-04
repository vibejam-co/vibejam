# Introduce ThemeExpression for Intentional Discontinuity

**Goal:** Introduce `ThemeExpression` to allow intentional visual discontinuity without touching layout or runtime logic.

## Constraints
- **Do NOT** modify `LayoutConfig` or `LayoutRenderer` contracts
- **Do NOT** introduce absolute positioning
- **Do NOT** introduce inline styles
- **Do NOT** modify `JamPageV2` data flow
- **Tailwind classes only**

## Required Tasks

### 1. `ThemeExpression.ts` (Pure Mapping)
Create a new file `theme/ThemeExpression.ts` to map abstract theme intents (Mood + Palette) to concrete expression classes.
- Should interpret `ThemeConfig` signals (`mood`, `backgroundTreatment`, `surfaceStyle`).
- Should return high-level "Expression Classes" for:
    - `pageBackground` (Gradients, Textures, Solids)
    - `typographyTexture` (Smoothing, Tracking, Weight maps)
    - `surfacePhysics` (Blur, Border, Shadow, Roundedness)

### 2. Extend `ThemeClasses`
Modify `theme/ThemeClasses.ts` to consume `ThemeExpression`.
- Respect expression modes:
    - **editorial** (Serif, muted, paper-like)
    - **brutal** (Mono, hard lines, high contrast, raw)
    - **atmospheric** (Gradients, noise, immersion)
    - **joyful** (Vibrant, rounded, soft)

## Verification
- Switching themes produces **emotional discontinuity**.
- Page feels like a **different artifact**, not just a recolor.
- Control Center works unchanged.

## Stop Condition
- Commit changes.
- Update this file with summary.
- Stop execution.
