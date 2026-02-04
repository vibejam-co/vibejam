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
✅ **Completed**
Created `theme/ThemeExpression.ts` which maps abstract theme intents (Mood + Palette) to concrete expression classes.
- Maps `mood` + `backgroundTreatment` -> `BACKGROUND_EXPRESSIONS`
- Maps `surfaceStyle` -> `SURFACE_EXPRESSIONS`
- Maps `surfaceStyle` + `mood` -> `CARD_EXPRESSIONS` (handling Brutal special cases)

### 2. Extend `ThemeClasses`
✅ **Completed**
Modified `theme/ThemeClasses.ts` to consume `ThemeExpression`.
- Now delegates background, surface, and card class resolution to `resolveThemeExpression`.
- Maintains typography and accent logic locally (for now) as they are tightly coupled to content flow.
- Respects expression modes:
    - **editorial**: Cleaned up implementation.
    - **brutal**: Hard lines, mono font.
    - **atmospheric**: Conic gradients.
    - **joyful**: Vibrant gradients.

## Verification
- Switching themes produces **emotional discontinuity**.
- Page feels like a **different artifact**, not just a recolor.
- Control Center works unchanged.

## Stop Condition
- ✅ Commit changes.
- ✅ Update this file with summary.
- ✅ Stop execution.
