interface ObstacleSparksProps {
  isBoss?: boolean;
}

export default function ObstacleSparks({ isBoss = false }: ObstacleSparksProps) {
  // Generate 6-8 spark streaks around the obstacle
  const sparkCount = isBoss ? 8 : 6;
  const sparks = Array.from({ length: sparkCount }, (_, i) => {
    const angle = (360 / sparkCount) * i;
    return { id: i, angle };
  });

  const sparkColor = isBoss 
    ? 'oklch(0.75 0.26 15)' // Red for boss
    : 'oklch(0.75 0.26 35)'; // Orange for regular

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${spark.angle}deg)`,
          }}
        >
          {/* Spark streak */}
          <div
            className={isBoss ? 'obstacle-spark-boss' : 'obstacle-spark'}
            style={{
              width: '2px',
              height: isBoss ? '16px' : '12px',
              background: `linear-gradient(to bottom, ${sparkColor}, transparent)`,
              transformOrigin: 'top center',
              animation: `sparkFlicker ${1.5 + Math.random() * 0.5}s ease-in-out infinite`,
              animationDelay: `${spark.id * 0.15}s`,
            }}
          />
        </div>
      ))}
      
      {/* Additional glow pulse for boss */}
      {isBoss && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${sparkColor}40 0%, transparent 70%)`,
            animation: 'sparkPulse 1.2s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
