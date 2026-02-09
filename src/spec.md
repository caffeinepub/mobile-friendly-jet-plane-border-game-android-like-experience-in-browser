# Specification

## Summary
**Goal:** Replace the player jet sprite with a non-image rendered jet, add bullet firing controls/mechanics, and polish the in-game UI while keeping the existing orange/red arcade theme.

**Planned changes:**
- Replace the player jet rendering to use non-image primitives (e.g., HTML/CSS shapes and/or inline SVG), keeping the same percent-based positioning and smooth movement, and adding a recognizable jet look with a glow/thruster effect.
- Add shooting mechanics: spawn bullets from the jet’s forward tip during the `playing` state, move bullets forward/upward, and remove bullets when they leave the playfield.
- Add a mobile-friendly on-screen fire control that does not interfere with drag-to-move, and ensure firing is disabled when `idle` or `paused`.
- Improve UI presentation: polish start/pause/resume/restart overlays (layout/typography/depth) and add a lightweight HUD element, keeping all user-facing text in English and maintaining the orange/red theme dominance.

**User-visible outcome:** The player controls a smoothly moving, non-image jet with glow effects, can fire bullets via a mobile-friendly control during gameplay, and sees a more polished arcade-style UI with improved overlays and a small in-game HUD.
