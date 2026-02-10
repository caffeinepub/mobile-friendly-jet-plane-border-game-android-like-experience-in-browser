interface BulletProps {
  position: { x: number; y: number };
  rotation?: number; // Rotation in degrees (0=up, matching PlayerJet convention)
}

export default function Bullet({ position, rotation = 0 }: BulletProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div className="relative w-2 h-5 sm:w-2.5 sm:h-6">
        {/* Bullet glow */}
        <div className="absolute inset-0 bg-game-accent rounded-full blur-sm opacity-80" />
        
        {/* Bullet core */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-game-accent to-game-primary rounded-full" />
        
        {/* Trailing effect */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-3 sm:h-4 bg-gradient-to-b from-game-accent/60 to-transparent rounded-full blur-[1px]" />
      </div>
    </div>
  );
}
