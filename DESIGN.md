# Design System Philosophy: The Radiant Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Radiant Editor."** 

We are moving away from the rigid, sterile grids of traditional SaaS and moving toward a digital experience that feels sun-drenched, tactile, and curated. This system rejects the "box-within-a-box" mentality. Instead, we use intentional asymmetry, expansive white space (breathing room), and high-contrast typography scales to create a rhythmic, editorial flow. 

The goal is to make the user feel like they are interacting with a high-end physical lookbook. We achieve this "contemporary energy" by pairing the brutalist, geometric soul of Space Grotesk with a soft, pastel-driven color palette that feels organic and inviting.

## 2. Colors: Sunlight & Shadow
The palette is built on a foundation of warm creams and energetic corals. This isn't just about color; it’s about simulating light.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. To define boundaries, you must use background color shifts. 
*   **Example:** A `surface-container-low` (#f6f0e7) card sitting on a `surface` (#fcf6ee) background provides all the definition needed. 
*   **Why:** Hard lines create visual "noise." Tonal shifts create "atmosphere."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets. 
*   **Nesting:** Use `surface-container-lowest` (#ffffff) for the most prominent foreground elements and `surface-dim` (#dad4c9) for deep background context. 
*   **The Glass & Gradient Rule:** For main CTAs and Hero backgrounds, use a subtle linear gradient transitioning from `primary` (#a83206) to `primary-container` (#ff784e). This adds a "soul" to the color that flat hex codes lack. For floating overlays, apply a `surface` color at 80% opacity with a `24px` backdrop-blur to create a "frosted glass" effect.

## 3. Typography: Geometric Rhythm
We pair the eccentric, bold energy of **Space Grotesk** with the sophisticated clarity of **Plus Jakarta Sans**.

*   **Display & Headlines (Space Grotesk):** Use these to anchor the page. The tight apertures and quirky "g" and "y" characters in Space Grotesk provide the "Modern" in our system. Don't be afraid of `display-lg` (3.5rem)—it should feel like a magazine headline.
*   **Body & Titles (Plus Jakarta Sans):** This font provides the "Friendly" vibe. It is highly legible and softens the sharpness of the display type.
*   **The Editorial Scale:** Maintain a high contrast between your `headline-lg` and `body-md`. This gap creates a sense of hierarchy and intentional design that "standard" apps often ignore.

## 4. Elevation & Depth: Tonal Layering
In this system, depth is felt, not seen. We favor **Tonal Layering** over heavy drop shadows.

*   **The Layering Principle:** Achieve lift by "stacking" container tiers. Place a `surface-container-highest` (#e2dcd2) element inside a `surface-container` (#ede7de) to create a soft, natural inset.
*   **Ambient Shadows:** If an element must float (like a FAB or a Modal), use a custom shadow. Color it with a tinted version of `on-surface` (#312e29) at 6% opacity, with a blur radius of at least `40px`. Never use pure black or grey shadows; they "muddy" the warm pastel palette.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token (#b1aca5) at 15% opacity. It should be a suggestion of a line, not a hard boundary.

## 5. Components: The Signature Kit

### Buttons
*   **Shape:** Full roundness (`9999px`) is mandatory.
*   **Primary:** A gradient of `primary` to `primary-container`. Text is `on-primary` (#ffefeb).
*   **Secondary:** `secondary-container` (#ffc4b3) background with `on-secondary-container` (#713723) text.
*   **Interaction:** On hover, buttons should scale slightly (1.02x) rather than just changing color. This adds "energetic" feedback.

### Cards & Lists
*   **The Rule:** No dividers. Use `1.5rem` to `2rem` of vertical space to separate items.
*   **Editorial Card:** Use a `surface-container-low` background with a `2rem` corner radius (`lg`). The image should bleed to the edges on at least two sides to break the "boxed" feel.

### Input Fields
*   **Styling:** Inputs should use `surface-container-high` (#e8e2d8) with a `1rem` corner radius. 
*   **Active State:** Instead of a heavy border, the background should shift to `surface-container-lowest` (#ffffff) with a subtle `primary` tint shadow.

### Signature Component: The "Sun-Dial" Chip
*   For selection states, use chips with `tertiary-container` (#feb64c) and `on-tertiary-container` (#583700). These provide a pop of "energy" against the softer peach/cream background.

## 6. Do’s and Don’ts

### Do
*   **Do** embrace asymmetry. Center a headline but left-align the body copy below it to create visual tension.
*   **Do** use "Full" roundness for buttons and chips, but use `lg` (2rem) or `xl` (3rem) for large containers to keep the UI from looking like a toy.
*   **Do** use `on-surface-variant` (#5e5b55) for secondary text to maintain the "muted" part of the "warm pastel" promise.

### Don't
*   **Don't** use 100% black (#000000) for text. Always use `on-background` (#312e29) to keep the "Sun-Kissed" warmth.
*   **Don't** use 1px dividers to separate list items. It breaks the high-end editorial feel.
*   **Don't** crowd the edges. The "Radiant" vibe requires significant padding (at least 24px-32px) inside all containers.