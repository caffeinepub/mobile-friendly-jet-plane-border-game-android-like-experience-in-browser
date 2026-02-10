# Specification

## Summary
**Goal:** Improve core gameplay feel by spawning bullets from the player jet, scaling obstacle counts by level, and updating the player jet art to look clearly like a jet plane.

**Planned changes:**
- Adjust bullet spawn position so bullets originate at (or very near) the player jet nose and align with the jet’s facing angle.
- Update level obstacle scaling so each level targets 5 * level obstacles (e.g., 5, 10, 15, ...), and ensure any level progress/target UI reflects the new per-level obstacle target.
- Replace/update the player jet visual to a more jet-like silhouette (sleek fuselage, wings, pointed nose) while keeping centering and rotation behavior consistent.

**User-visible outcome:** Bullets appear to fire directly from the jet, each new level starts with a higher obstacle count in multiples of 5, and the player character looks like a jet plane rather than a “bud.”
