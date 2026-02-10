# Specification

## Summary
**Goal:** Fix jet thruster rendering across all rotations, stabilize obstacle-to-obstacle collisions, improve mobile landscape HUD/control sizing, and enforce landscape-only gameplay on mobile.

**Planned changes:**
- Update the jet thruster/flame rendering so it stays attached to the jet’s rear for any 0–360° rotation, renders behind the jet body, and is not clipped; keep the current behavior of rendering only while thrusting.
- Stabilize obstacle-to-obstacle collision detection and resolution to reliably separate overlapping obstacles (including overlapping spawns/near-zero distances/high relative speeds) without NaN/Infinity, tunneling, jitter, or unrealistic velocity spikes.
- Make the HUD progress bar (and boss bar when shown) more compact on mobile landscape by constraining max width, centering it, and reducing padding/text sizing while preserving progress values and fill behavior.
- Scale down overall in-game UI on mobile landscape (HUD panels and touch controls) so it fits without overlapping and remains fully usable via touch.
- Add a mobile landscape enforcement flow: best-effort orientation lock to landscape when supported, and a blocking “rotate to landscape” overlay that pauses/blocks gameplay until landscape is detected.

**User-visible outcome:** The jet’s thruster flame looks correct at all angles, obstacles visibly collide and separate reliably, mobile landscape UI takes up less space and doesn’t overlap, and on mobile the game blocks in portrait with a rotate-to-landscape overlay until the device is in landscape.
