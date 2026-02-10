# Specification

## Summary
**Goal:** Make the virtual joystick control less sensitive and provide an in-game sensitivity setting that persists locally.

**Planned changes:**
- Adjust the joystick-to-movement mapping to reduce top speed at full deflection and make near-center input more gradual/precise, while preserving prompt stop on neutral.
- Add an in-game, English-labeled joystick sensitivity control available during gameplay (playing/paused) that updates movement immediately.
- Persist the selected sensitivity value in client-side storage (e.g., localStorage) and default it to the newly tuned baseline.

**User-visible outcome:** During gameplay, the jet moves more smoothly and less aggressively with the virtual joystick, and players can adjust and save joystick sensitivity without reloading.
