# 📋 UI/UX Refinement: Bible Reading Table (`/reading`)

## 1. Issue: Chapter List Layout Fix
- **Current State**: The chapter numbers (1, 2, 3...) are currently misaligned or displayed in an unintended layout (as seen in the first attached screenshot).
- **Goal**: Refactor the chapter grid/list layout to match the second screenshot. 
  - Each chapter should be in a clean, square or circular grid format.
  - Ensure the responsive grid remains consistent across different screen sizes.
  - Fix any flexbox or grid CSS that might be causing the current misalignment.

## 2. Issue: Visual Distinction for New Testament
- **Current State**: Both Old Testament (OT) and New Testament (NT) sections use the same theme color (Indigo).
- **Goal**: Change the theme color for the **New Testament (신약)** sections to Tailwind CSS **`rose`** colors.
  - Apply `rose-500` or `rose-600` for active/checked states and accents in the NT section.
  - Keep the Old Testament (구약) as the current color (Indigo).
  - This applies to progress bars, chapter check icons, and section headers within the NT.

## 3. Technical Requirements
- Check `app/(dashboard)/reading/page.tsx` or the relevant sub-components in `components/reading/`.
- Use Tailwind CSS classes for the color change.
- Ensure the **Optimistic Update** logic remains intact while updating the UI components.