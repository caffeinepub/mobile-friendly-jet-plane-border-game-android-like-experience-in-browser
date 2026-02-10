/**
 * Obstacle-to-obstacle collision physics helper.
 * Implements elastic collision response with position separation to prevent overlap/jitter.
 */

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface CollisionResult {
  collided: boolean;
  newVelocity1?: Velocity;
  newVelocity2?: Velocity;
  newPosition1?: Position;
  newPosition2?: Position;
}

/**
 * Resolve collision between two circular obstacles.
 * @param pos1 - Position of first obstacle (percent)
 * @param vel1 - Velocity of first obstacle (pixels/sec)
 * @param radius1 - Collision radius of first obstacle (pixels)
 * @param pos2 - Position of second obstacle (percent)
 * @param vel2 - Velocity of second obstacle (pixels/sec)
 * @param radius2 - Collision radius of second obstacle (pixels)
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @returns Collision result with updated velocities and separated positions
 */
export function resolveObstacleCollision(
  pos1: Position,
  vel1: Velocity,
  radius1: number,
  pos2: Position,
  vel2: Velocity,
  radius2: number,
  playfieldWidth: number,
  playfieldHeight: number
): CollisionResult {
  // Convert positions from percent to pixels
  const x1 = (pos1.x / 100) * playfieldWidth;
  const y1 = (pos1.y / 100) * playfieldHeight;
  const x2 = (pos2.x / 100) * playfieldWidth;
  const y2 = (pos2.y / 100) * playfieldHeight;

  // Calculate distance between centers
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if collision occurred
  const minDistance = radius1 + radius2;
  if (distance >= minDistance) {
    return { collided: false };
  }

  // Collision detected - calculate collision normal (unit vector from 1 to 2)
  const nx = dx / distance;
  const ny = dy / distance;

  // Calculate relative velocity
  const dvx = vel2.x - vel1.x;
  const dvy = vel2.y - vel1.y;

  // Calculate relative velocity along collision normal
  const dvn = dvx * nx + dvy * ny;

  // Objects moving apart - no need to resolve
  if (dvn >= 0) {
    return { collided: false };
  }

  // Simple elastic collision response (equal mass assumption)
  // Reflect velocities along the collision normal
  const impulse = dvn;

  const newVel1: Velocity = {
    x: vel1.x + impulse * nx,
    y: vel1.y + impulse * ny,
  };

  const newVel2: Velocity = {
    x: vel2.x - impulse * nx,
    y: vel2.y - impulse * ny,
  };

  // Separate overlapping obstacles to prevent jitter
  const overlap = minDistance - distance;
  const separationX = (overlap / 2) * nx;
  const separationY = (overlap / 2) * ny;

  const newX1 = x1 - separationX;
  const newY1 = y1 - separationY;
  const newX2 = x2 + separationX;
  const newY2 = y2 + separationY;

  // Convert back to percent
  const newPos1: Position = {
    x: (newX1 / playfieldWidth) * 100,
    y: (newY1 / playfieldHeight) * 100,
  };

  const newPos2: Position = {
    x: (newX2 / playfieldWidth) * 100,
    y: (newY2 / playfieldHeight) * 100,
  };

  return {
    collided: true,
    newVelocity1: newVel1,
    newVelocity2: newVel2,
    newPosition1: newPos1,
    newPosition2: newPos2,
  };
}
