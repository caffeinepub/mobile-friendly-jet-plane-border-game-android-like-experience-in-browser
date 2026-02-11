/**
 * Joystick movement utility for converting raw joystick input into game movement.
 * Applies deadzone, speed curve, and sensitivity scaling for fine control.
 */

interface JoystickInput {
  x: number;
  y: number;
  magnitude: number;
}

interface MovementOutput {
  direction: { x: number; y: number };
  speedFactor: number;
}

// Configuration constants - tuned for much finer control and reduced sensitivity
const DEADZONE = 0.15; // Ignore input below 15% to prevent jitter
const SPEED_CURVE_EXPONENT = 2.8; // Increased from 2.2 for much more gradual acceleration
const MAX_SPEED_MULTIPLIER = 0.25; // Reduced from 0.35 for slower top speed

/**
 * Convert raw joystick input to normalized direction and curved speed factor.
 * @param input Raw joystick input with x, y pixel displacement and magnitude (0-1)
 * @returns Normalized direction vector and curved speed factor (0-1)
 */
export function processJoystickInput(input: JoystickInput): MovementOutput {
  // Apply deadzone - return neutral if below threshold
  if (input.magnitude < DEADZONE) {
    return {
      direction: { x: 0, y: 0 },
      speedFactor: 0,
    };
  }

  // Normalize direction from raw x,y displacement
  const distance = Math.sqrt(input.x * input.x + input.y * input.y);
  const direction = distance > 0
    ? { x: input.x / distance, y: input.y / distance }
    : { x: 0, y: 0 };

  // Apply speed curve for fine control near center
  // Remap magnitude from [DEADZONE, 1] to [0, 1]
  const normalizedMagnitude = (input.magnitude - DEADZONE) / (1 - DEADZONE);
  const curvedMagnitude = Math.pow(normalizedMagnitude, SPEED_CURVE_EXPONENT);
  
  // Apply max speed multiplier
  const speedFactor = curvedMagnitude * MAX_SPEED_MULTIPLIER;

  return {
    direction,
    speedFactor,
  };
}
