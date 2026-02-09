interface Position {
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
