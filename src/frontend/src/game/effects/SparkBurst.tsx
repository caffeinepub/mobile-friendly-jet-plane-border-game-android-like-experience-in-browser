import { Z_INDEX } from '../ui/zIndex';

interface SparkBurstProps {
  x: number; // Position in percent (0-100)
  y: number; // Position in percent (0-100)
  variant?: 'normal' | 'boss' | 'player';
  onComplete?: () => void;
}

export default function SparkBurst({ x, y, variant = 'normal', onComplete }: SparkBurstProps) {
  // Determine spark count and intensity based on variant
  const sparkCount = variant === 'boss' ? 16 : variant === 'player' ? 12 : 8;
  const sparkLength = variant === 'boss' ? 24 : variant === 'player' ? 18 : 14;
  const sparkWidth = variant === 'boss' ? 3 : 2;
  
  // Generate sparks at evenly distributed angles
  const sparks = Array.from({ length: sparkCount }, (_, i) => {
    const angle = (360 / sparkCount) * i;
    const randomOffset = (Math.random() - 0.5) * 15; // Add slight randomness
    return { id: i, angle: angle + randomOffset };
  });

  // Color based on variant
  const sparkColor = 
    variant === 'boss' ? 'oklch(0.85 0.28 15)' : // Bright red for boss
    variant === 'player' ? 'oklch(0.80 0.24 35)' : // Orange for player
    'oklch(0.75 0.22 45)'; // Yellow-orange for normal

  // Trigger completion callback after animation
  if (onComplete) {
    const duration = variant === 'boss' ? 600 : 400;
    setTimeout(onComplete, duration);
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: Z_INDEX.VFX, // Use shared VFX z-index (below HUD and overlays)
      }}
    >
      {/* Spark streaks */}
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute"
          style={{
            transform: `rotate(${spark.angle}deg)`,
            transformOrigin: 'center',
          }}
        >
          <div
            className={`spark-burst-streak ${variant === 'boss' ? 'spark-burst-boss' : variant === 'player' ? 'spark-burst-player' : ''}`}
            style={{
              width: `${sparkWidth}px`,
              height: `${sparkLength}px`,
              background: `linear-gradient(to bottom, ${sparkColor}, transparent)`,
              transformOrigin: 'top center',
            }}
          />
        </div>
      ))}
      
      {/* Central flash */}
      <div
        className={`spark-burst-flash ${variant === 'boss' ? 'spark-burst-flash-boss' : ''}`}
        style={{
          width: variant === 'boss' ? '32px' : variant === 'player' ? '24px' : '16px',
          height: variant === 'boss' ? '32px' : variant === 'player' ? '24px' : '16px',
          background: `radial-gradient(circle, ${sparkColor}, transparent 70%)`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
        }}
      />
      
      {/* Additional glow for boss/player variants */}
      {(variant === 'boss' || variant === 'player') && (
        <div
          className="spark-burst-glow"
          style={{
            width: variant === 'boss' ? '48px' : '36px',
            height: variant === 'boss' ? '48px' : '36px',
            background: `radial-gradient(circle, ${sparkColor}60 0%, transparent 70%)`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );
}
