/**
 * Convert game facing angle (degrees, 0=up, clockwise positive) to a normalized forward vector.
 * @param angleDegrees - Angle in degrees where 0=up, 90=right, 180=down, 270=left
 * @returns Normalized direction vector {x, y}
 */
export function angleToForwardVector(angleDegrees: number): { x: number; y: number } {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  // 0 degrees = up = (0, -1), so we use sin for x and -cos for y
  return {
    x: Math.sin(angleRadians),
    y: -Math.cos(angleRadians),
  };
}

/**
 * Convert pixel velocity to playfield-percent delta using independent width/height scaling.
 * @param velocityPixelsPerSecond - Speed in pixels per second
 * @param direction - Normalized direction vector
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @param deltaTime - Time delta in seconds
 * @returns Velocity in playfield percent {x, y}
 */
export function pixelVelocityToPercent(
  velocityPixelsPerSecond: number,
  direction: { x: number; y: number },
  playfieldWidth: number,
  playfieldHeight: number,
  deltaTime: number
): { x: number; y: number } {
  const pixelDeltaX = direction.x * velocityPixelsPerSecond * deltaTime;
  const pixelDeltaY = direction.y * velocityPixelsPerSecond * deltaTime;
  
  return {
    x: (pixelDeltaX / playfieldWidth) * 100,
    y: (pixelDeltaY / playfieldHeight) * 100,
  };
}

/**
 * Calculate spawn position offset from entity position along forward direction.
 * @param position - Entity position in percent
 * @param forwardVector - Normalized forward direction
 * @param offsetPixels - Offset distance in pixels
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @returns New position in percent
 */
export function offsetPosition(
  position: { x: number; y: number },
  forwardVector: { x: number; y: number },
  offsetPixels: number,
  playfieldWidth: number,
  playfieldHeight: number
): { x: number; y: number } {
  const offsetX = (forwardVector.x * offsetPixels / playfieldWidth) * 100;
  const offsetY = (forwardVector.y * offsetPixels / playfieldHeight) * 100;
  
  return {
    x: position.x + offsetX,
    y: position.y + offsetY,
  };
}
