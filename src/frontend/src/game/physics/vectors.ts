interface Position {
  x: number;
  y: number;
}

interface Vector {
  x: number;
  y: number;
}

/**
 * Converts a game facing angle (degrees, 0 = up) to a normalized forward vector.
 * @param angleDegrees - Angle in degrees where 0 = up, positive = clockwise
 * @returns Normalized forward vector { x, y }
 */
export function angleToForwardVector(angleDegrees: number): Vector {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: Math.sin(angleRadians),
    y: -Math.cos(angleRadians),
  };
}

/**
 * Converts pixel velocity to playfield-percent velocity delta per frame.
 * Uses independent width/height scaling for correct aspect ratio handling.
 * @param pixelsPerSecond - Speed in pixels per second
 * @param direction - Normalized direction vector
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @param deltaTime - Time delta in seconds
 * @returns Velocity in percent per frame { x, y }
 */
export function pixelVelocityToPercent(
  pixelsPerSecond: number,
  direction: Vector,
  playfieldWidth: number,
  playfieldHeight: number,
  deltaTime: number
): Vector {
  const pixelsThisFrame = pixelsPerSecond * deltaTime;
  return {
    x: (direction.x * pixelsThisFrame / playfieldWidth) * 100,
    y: (direction.y * pixelsThisFrame / playfieldHeight) * 100,
  };
}

/**
 * Calculates a new position offset from a base position along a direction vector.
 * Used for spawning bullets ahead of the jet nose.
 * @param basePosition - Starting position in percentage coordinates
 * @param direction - Normalized direction vector
 * @param offsetPixels - Distance to offset in pixels
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @returns New position in percentage coordinates
 */
export function offsetPosition(
  basePosition: Position,
  direction: Vector,
  offsetPixels: number,
  playfieldWidth: number,
  playfieldHeight: number
): Position {
  // Convert offset to percentage, using independent width/height scaling
  const offsetPercentX = (direction.x * offsetPixels / playfieldWidth) * 100;
  const offsetPercentY = (direction.y * offsetPixels / playfieldHeight) * 100;
  
  return {
    x: basePosition.x + offsetPercentX,
    y: basePosition.y + offsetPercentY,
  };
}
