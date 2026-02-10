# Specification

## Summary
**Goal:** Keep obstacles visible through the time-expired transition and show a distinct "TIME UP!" game-over message when the level timer reaches 0.

**Planned changes:**
- Adjust the playfield rendering/state transition so regular obstacles and the boss obstacle remain rendered (with boss red styling) when the timer hits 0, during the 'exploding' transition, until the game-over UI takes over.
- Add a distinct "time expired" game-over reason and update the game-over overlay messaging to display "TIME UP!" only when the timer reaches 0 (and not for other loss conditions).

**User-visible outcome:** When the countdown reaches 0, obstacles (including the boss) remain visible during the transition to game over, and the game-over overlay clearly displays "TIME UP!".
