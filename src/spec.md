# Specification

## Summary
**Goal:** Add spark-like particle burst visual effects for bullet impacts, boss deaths, and player collision deaths without changing gameplay.

**Planned changes:**
- Create a reusable spark-burst effect component that can be spawned at a given (x%, y%) position with a tunable intensity/variant and that self-terminates after a short lifetime without per-frame React state updates.
- Trigger a spark burst once per bullet→obstacle collision at the impact position while preserving existing hit behavior.
- Trigger a higher-intensity spark burst once when a boss obstacle is destroyed/removed at its death position.
- Trigger a spark burst once when the player dies due to obstacle collision or border collision, alongside the existing player explosion/game-over flow.

**User-visible outcome:** Spark particle bursts appear on bullet hits, on boss destruction (stronger burst), and when the player dies from obstacle/border collisions, while the rest of the game behavior remains the same.
