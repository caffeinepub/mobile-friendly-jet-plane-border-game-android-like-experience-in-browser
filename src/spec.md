# Specification

## Summary
**Goal:** Improve shooting accuracy, obstacle clarity, and overall usability on small mobile screens.

**Planned changes:**
- Fix bullet spawning and movement so each bullet spawns from the jet’s nose and travels in the jet’s facing direction at the instant of firing, without being affected by later joystick changes.
- Redesign obstacle visuals to render as a clear six-sided hexagon shape while keeping the current orange/red hazard glow styling and the existing percentage-based positioning/movement logic.
- Scale down gameplay entities (jet, bullets, obstacles) and UI controls (HUD, FIRE button, joystick) for better fit on typical mobile viewports, and adjust hitboxes to match the new visual sizes.

**User-visible outcome:** Bullets shoot straight from the jet’s nose in the correct direction, obstacles look like glowing orange/red hexagons, and the game feels less crowded and more comfortable to play on mobile without UI overlap or clipping.
