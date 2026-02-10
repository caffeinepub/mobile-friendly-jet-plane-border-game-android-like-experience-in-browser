/**
 * Calculate the countdown duration for a given level.
 * Level 1: 30 seconds
 * Level 2: 35 seconds
 * Level 3: 40 seconds
 * Level N: 30 + (N-1) * 5 seconds
 */
export function getLevelDuration(level: number): number {
  return 30 + (level - 1) * 5;
}

/**
 * Format seconds as a time string (e.g., "24s" or "1:05")
 */
export function formatTime(seconds: number): string {
  const roundedSeconds = Math.ceil(seconds);
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }
  const minutes = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
