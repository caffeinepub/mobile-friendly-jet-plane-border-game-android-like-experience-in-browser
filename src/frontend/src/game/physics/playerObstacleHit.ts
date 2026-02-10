interface Position {
  x: number;
  y: number;
}

/**
 * Determines if a player-obstacle collision qualifies as a "full hit" that should trigger game over.
 * Uses overlap depth threshold to distinguish between grazing contacts and significant impacts.
 * 
 * @param playerPos - Player position in percentage coordinates
 * @param playerRadius - Player collision radius in pixels
 * @param obstaclePos - Obstacle position in percentage coordinates
 * @param obstacleRadius - Obstacle collision radius in pixels
 * @param playfieldWidth - Playfield width in pixels
 * @param playfieldHeight - Playfield height in pixels
 * @returns true if the collision is a "full hit" that should trigger game over
 */
export function isFullHit(
  playerPos: Position,
  playerRadius: number,
  obstaclePos: Position,
  obstacleRadius: number,
  playfieldWidth: number,
  playfieldHeight: number
): boolean {
  if (!playfieldWidth || !playfieldHeight) {
    return false;
  }
  
  // Convert percentage to pixels for accurate collision
  const x1 = (playerPos.x / 100) * playfieldWidth;
  const y1 = (playerPos.y / 100) * playfieldHeight;
  const x2 = (obstaclePos.x / 100) * playfieldWidth;
  const y2 = (obstaclePos.y / 100) * playfieldHeight;
  
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const combinedRadius = playerRadius + obstacleRadius;
  
  // No collision at all
  if (distance >= combinedRadius) {
    return false;
  }
  
  // Calculate overlap depth (how much the circles penetrate each other)
  const overlapDepth = combinedRadius - distance;
  
  // Use the smaller radius as reference for threshold calculation
  const referenceRadius = Math.min(playerRadius, obstacleRadius);
  
  // Full hit threshold: overlap must be at least 40% of the smaller radius
  // This ensures grazing contacts don't trigger game over while clear impacts do
  const fullHitThreshold = referenceRadius * 0.4;
  
  return overlapDepth >= fullHitThreshold;
}
