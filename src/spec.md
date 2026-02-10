# Specification

## Summary
**Goal:** Remove outer gaps around the playfield border and make the in-game UI more compact while keeping safe-area insets and gameplay bounds correct.

**Planned changes:**
- Update playfield container/layout styles to eliminate any padding/margins that create visible space outside the outer border, while still applying mobile safe-area insets via `env(safe-area-inset-*)`.
- Refine border and corner-accent styling so all four corners align cleanly with the main border (no 1–2px seams/gaps) and the playfield background/grid remain correctly clipped inside.
- Reduce overall HUD footprint (score/level/timer), progress bars, pause button, shoot button, and virtual joystick sizing/padding to be more compact while staying readable and touch-friendly on mobile.
- Adjust playfield bounds/padding calculations so the playable area matches the updated border (no extra “dead space” between the visible border and movement/collision limits), without introducing scrolling or new collision/clamping issues.

**User-visible outcome:** The playfield border sits flush to the screen/container edges (except for safe-area insets), corners look continuous, and the HUD/controls take up less space without breaking touch usability or gameplay bounds.
