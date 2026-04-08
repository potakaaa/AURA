# Design System Specification

## 1. Overview & Creative North Star: "The Ethereal Intelligence"

The "Ethereal Intelligence" is the Creative North Star for this design system. It moves away from the rigid, grid-heavy "dashboard" aesthetic of traditional AI tools, favoring an interface that feels like it’s breathing. We treat the UI not as a flat screen, but as a deep, ambient space where information flows organically.

To achieve this, the design system utilizes intentional asymmetry. We reject the "center-everything" approach. Instead, we use a wide-gamut typography scale and overlapping glass containers to create a sense of editorial prestige. The interface should feel less like software and more like a premium digital installation—minimalist, authoritative, and profoundly responsive.

---

## 2. Colors

The color palette is anchored in deep, "void-like" dark tones to allow the vibrant spectrum of the assistant's personality to shine through.

### Foundation Tones
*   **Surface Background:** `#0c0e12` (The base "Canvas")
*   **Surface Containers:** Ranging from `surface_container_lowest` (#000000) for deep inset cards to `surface_container_highest` (#21262d) for active floating elements.

### Accent Spectrum (The "Aura" Gradient)
Derived from the signature brand mark, these colors represent the intelligence's "flow":
*   **Primary (Intelligence):** `primary` (#c180ff) — Purple to Pink transition.
*   **Secondary (Action):** `secondary` (#4cd6fe) — Teal to Blue transition.
*   **Tertiary (Alert/Warn):** `tertiary` (#ffb1c5) — Orange to Pink transition.

### The "No-Line" Rule
**Strict Guideline:** 1px solid borders are prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface_container_low` action card should sit atop a `surface` background. The change in tonal depth is the divider.

### The "Glass & Gradient" Rule
Floating UI elements (modals, tooltips, or the central orb) must utilize Glassmorphism. Use semi-transparent surface colors with a `backdrop-blur` (minimum 20px). Signature CTAs should utilize a soft linear gradient from `primary` to `primary_container` to provide a sense of "liquid light" rather than flat ink.

---

## 3. Typography

The system utilizes a dual-font approach to balance editorial authority with high-performance readability.

*   **Display & Headlines (Manrope):** We use Manrope for its modern, geometric construction. Use `display-lg` (3.5rem) with tight letter-spacing for high-impact moments. Headlines should feel bold and commanding, establishing a clear intent.
*   **Body & Labels (Inter):** Inter provides exceptional legibility at smaller scales. `body-lg` (1rem) is our workhorse for conversational text. Use `on_surface_variant` (a soft grey-blue) for secondary body text to reduce visual noise.

**Hierarchy as Identity:** The vast difference between `display-lg` and `label-sm` creates a rhythmic, musical quality to the text, mimicking the natural peaks and valleys of human speech.

---

## 4. Elevation & Depth

In this design system, depth is chronological and biological, not just structural.

### The Layering Principle
Hierarchy is achieved by stacking the surface-container tiers.
*   **Base:** `surface` (#0c0e12)
*   **Sectioning:** `surface_container_low` (#101418)
*   **Interaction Cards:** `surface_container_highest` (#21262d)

### Ambient Shadows
When a card must "float" (e.g., a voice command card), use an extra-diffused shadow:
*   **Blur:** 40px - 60px.
*   **Opacity:** 4%-8%.
*   **Tint:** Use a dark variant of `primary` or `secondary` instead of pure black to mimic the color bleed from the light-emitting components.

### The "Ghost Border" Fallback
If accessibility requirements demand a stroke, use a **Ghost Border**: the `outline_variant` token at **15% opacity**. This provides a hint of a boundary without breaking the "ambient" immersion.

---

## 5. Components

### The Central Voice Orb
The system's heartbeat. It should not be a static circle. Use a `primary` to `secondary` gradient with a `surface_tint` glow. The orb should utilize a fluid, non-perfect CSS blob shape that reacts to voice input.

### Action Cards
*   **Radius:** `md` (1.5rem) or `lg` (2rem).
*   **Separation:** Never use dividers. Use `spacing-6` (2rem) of vertical white space or a subtle background shift to `surface_container_low`.
*   **Interaction:** On hover, a card should transition from `surface_container` to a very subtle `surface_bright` with a soft `primary` outer glow.

### Buttons
*   **Primary:** Filled with the "Aura Gradient." No border. 20px rounded corners.
*   **Secondary:** Glassmorphic background (semi-transparent `surface_variant`) with a white or `primary` text label.
*   **Tertiary:** Ghost style. No background, `on_surface` text, high-contrast on hover.

### Fluid Waveforms
Representing reasoning or processing. These should be thin (2px), multi-layered lines using the teal (#00B4DB) and purple (#8E2DE2) accents at varying opacities (30%, 60%, 100%) to create a sense of 3D depth.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace negative space. Let the background "breathe" around the action cards.
*   **Do** use `primary_fixed_dim` for icons to keep them visible but harmonized with the dark theme.
*   **Do** use asymmetrical layouts where one element (like a display headline) is significantly offset to create visual interest.

### Don't:
*   **Don't** use pure white (#FFFFFF) for body text. Use `on_background` (#e1e6ef) to prevent eye strain in dark mode.
*   **Don't** use 1px solid dividers. If you feel the need for a line, increase the padding instead.
*   **Don't** use harsh, fast animations. All transitions should have a "viscous" feel (use `cubic-bezier(0.2, 0.8, 0.2, 1)`).
*   **Don't** clip the glows. Ensure containers have enough padding to allow ambient glows from the orb or active states to bleed naturally.