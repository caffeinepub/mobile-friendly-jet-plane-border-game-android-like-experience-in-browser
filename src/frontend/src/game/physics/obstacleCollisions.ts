/**
 * Obstacle-to-obstacle collision physics helper.
 * Implements elastic collision response with position separation to prevent overlap/jitter.
 * Hardened with bounded solver passes, velocity clamping, and NaN/Infinity guards.
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

const EPSILON = 0.001; // Small value to prevent division by zero
const DAMPING = 0.95; // Slight damping to prevent velocity explosions
const MAX_IMPULSE = 500; // Maximum impulse to prevent unrealistic speeds
const MAX_VELOCITY = 500; // Maximum velocity component

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
  const distanceSquared = dx * dx + dy * dy;
  const distance = Math.sqrt(distanceSquared);

  // Check if collision occurred
  const minDistance = radius1 + radius2;
  if (distance >= minDistance) {
    return { collided: false };
  }

  // Handle near-zero or zero distance (obstacles on top of each other)
  let nx: number, ny: number;
  if (distance < EPSILON) {
    // Use a deterministic fallback normal (prefer horizontal separation)
    nx = 1;
    ny = 0;
  } else {
    // Calculate collision normal (unit vector from 1 to 2)
    nx = dx / distance;
    ny = dy / distance;
  }

  // Always separate overlapping obstacles regardless of relative velocity
  const overlap = minDistance - distance;
  const separationX = (overlap / 2 + EPSILON) * nx;
  const separationY = (overlap / 2 + EPSILON) * ny;

  const newX1 = x1 - separationX;
  const newY1 = y1 - separationY;
  const newX2 = x2 + separationX;
  const newY2 = y2 + separationY;

  // Calculate relative velocity
  const dvx = vel2.x - vel1.x;
  const dvy = vel2.y - vel1.y;

  // Calculate relative velocity along collision normal
  const dvn = dvx * nx + dvy * ny;

  // Apply elastic collision impulse only if objects are moving toward each other
  let newVel1: Velocity;
  let newVel2: Velocity;

  if (dvn < 0) {
    // Objects moving toward each other - apply elastic impulse with damping
    let impulse = dvn * DAMPING;
    
    // Clamp impulse to prevent velocity explosions
    if (Math.abs(impulse) > MAX_IMPULSE) {
      impulse = Math.sign(impulse) * MAX_IMPULSE;
    }

    newVel1 = {
      x: vel1.x + impulse * nx,
      y: vel1.y + impulse * ny,
    };

    newVel2 = {
      x: vel2.x - impulse * nx,
      y: vel2.y - impulse * ny,
    };
  } else {
    // Objects moving apart or parallel - just separate, keep velocities
    newVel1 = { ...vel1 };
    newVel2 = { ...vel2 };
  }

  // Guard against NaN/Infinity and clamp velocities
  const clampVelocity = (v: Velocity): Velocity => {
    const x = isFinite(v.x) ? Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v.x)) : 0;
    const y = isFinite(v.y) ? Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v.y)) : 0;
    return { x, y };
  };

  newVel1 = clampVelocity(newVel1);
  newVel2 = clampVelocity(newVel2);

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
