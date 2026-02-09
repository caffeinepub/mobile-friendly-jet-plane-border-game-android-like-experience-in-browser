interface BulletProps {
  position: { x: number; y: number };
}

export default function Bullet({ position }: BulletProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-3 h-8">
        {/* Bullet glow */}
        <div className="absolute inset-0 bg-game-accent rounded-full blur-sm opacity-80" />
        
        {/* Bullet core */}
        <div className="absolute inset-0 flex flex-col gap-0.5">
          <div className="flex-1 bg-gradient-to-b from-white via-game-accent to-game-primary rounded-full shadow-[0_0_8px_rgba(255,150,0,0.8)]" />
        </div>
        
        {/* Trail effect */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-4 bg-gradient-to-b from-game-accent/60 to-transparent rounded-full" />
      </div>
    </div>
  );
}
