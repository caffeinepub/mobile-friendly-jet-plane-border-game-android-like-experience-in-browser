interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

export function clampPosition(
  pos: Position,
  maxWidth: number,
  maxHeight: number,
  entityHalfSize: number
): Position {
  const minPercent = (entityHalfSize / maxWidth) * 100;
  const maxPercentX = 100 - minPercent;
  const maxPercentY = 100 - (entityHalfSize / maxHeight) * 100;

  return {
    x: Math.max(minPercent, Math.min(maxPercentX, pos.x)),
    y: Math.max(minPercent, Math.min(maxPercentY, pos.y)),
  };
}

export function reflectAtBounds(
  pos: Position,
  vel: Velocity,
  maxWidth: number,
  maxHeight: number,
  entityHalfSize: number
): { position: Position; velocity: Velocity } {
  const minPercent = (entityHalfSize / maxWidth) * 100;
  const maxPercentX = 100 - minPercent;
  const maxPercentY = 100 - (entityHalfSize / maxHeight) * 100;

  let newPos = { ...pos };
  let newVel = { ...vel };

  // Reflect on X bounds
  if (newPos.x < minPercent) {
    newPos.x = minPercent;
    newVel.x = Math.abs(newVel.x); // Bounce right
  } else if (newPos.x > maxPercentX) {
    newPos.x = maxPercentX;
    newVel.x = -Math.abs(newVel.x); // Bounce left
  }

  // Reflect on Y bounds
  if (newPos.y < minPercent) {
    newPos.y = minPercent;
    newVel.y = Math.abs(newVel.y); // Bounce down
  } else if (newPos.y > maxPercentY) {
    newPos.y = maxPercentY;
    newVel.y = -Math.abs(newVel.y); // Bounce up
  }

  return { position: newPos, velocity: newVel };
}

export function isOutOfBounds(
  pos: Position,
  maxWidth: number,
  maxHeight: number,
  entityHalfSize: number
): boolean {
  const minPercent = (entityHalfSize / maxWidth) * 100;
  const maxPercentX = 100 - minPercent;
  const maxPercentY = 100 - (entityHalfSize / maxHeight) * 100;

  return (
    pos.x < minPercent ||
    pos.x > maxPercentX ||
    pos.y < minPercent ||
    pos.y > maxPercentY
  );
}
