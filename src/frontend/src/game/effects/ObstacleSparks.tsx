import { Z_INDEX } from '../ui/zIndex';

interface ObstacleSparksProps {
  isBoss?: boolean;
}

export default function ObstacleSparks({ isBoss = false }: ObstacleSparksProps) {
  // Generate spark positions (deterministic, no per-render randomness)
  const sparkPositions = [
    { angle: 0, distance: 100 },
    { angle: 60, distance: 95 },
    { angle: 120, distance: 105 },
    { angle: 180, distance: 100 },
    { angle: 240, distance: 95 },
    { angle: 300, distance: 105 },
  ];

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: Z_INDEX.VFX }}
    >
      {sparkPositions.map((spark, i) => {
        const angleRad = (spark.angle * Math.PI) / 180;
        const x = 50 + Math.cos(angleRad) * spark.distance;
        const y = 50 + Math.sin(angleRad) * spark.distance;
        
        return (
          <div
            key={i}
            className={`absolute w-1 h-2 sm:w-1.5 sm:h-3 rounded-full ${
              isBoss ? 'bg-red-500' : 'bg-game-accent'
            } animate-sparkFlicker`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
      
      {/* Additional glow pulse for boss */}
      {isBoss && (
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-sparkPulse" />
      )}
    </div>
  );
}
