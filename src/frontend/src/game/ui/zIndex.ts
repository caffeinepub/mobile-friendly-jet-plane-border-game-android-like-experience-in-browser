/**
 * Centralized z-index constants for game UI layering.
 * 
 * Layering order (bottom to top):
 * 1. Playfield content (obstacles, player, bullets) - z-0 (default)
 * 2. VFX (explosions, spark bursts, obstacle sparks) - z-10
 * 3. HUD (top bar, progress bars, sensitivity control) - z-20
 * 4. Virtual controls (joystick, shoot button) - z-25
 * 5. Full-screen overlays (idle, pause, gameover, levelcomplete) - z-30
 * 
 * This ensures VFX never cover HUD or controls, and overlays cover everything.
 */

export const Z_INDEX = {
  // Playfield content (default layer)
  PLAYFIELD: 0,
  
  // Visual effects layer (below HUD)
  VFX: 10,
  
  // HUD elements (above VFX, below controls and overlays)
  HUD: 20,
  
  // Virtual controls (above HUD, below overlays)
  CONTROLS: 25,
  
  // Full-screen overlays (above everything)
  OVERLAY: 30,
} as const;
