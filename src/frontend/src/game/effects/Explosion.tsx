interface ExplosionProps {
  position: { x: number; y: number };
}

export default function Explosion({ position }: ExplosionProps) {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Flash core */}
      <div className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-white rounded-full animate-explosion-flash" />
      </div>
      
      {/* Blast wave */}
      <div className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-gradient-radial from-game-primary via-game-accent to-transparent rounded-full animate-explosion-blast" />
      </div>
      
      {/* Secondary blast */}
      <div className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-gradient-radial from-orange-500 via-red-600 to-transparent rounded-full animate-explosion-blast-delayed" />
      </div>
      
      {/* Embers */}
      <div className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-game-accent rounded-full animate-explosion-ember-1" />
        <div className="absolute top-1/2 right-0 w-2 h-2 bg-game-primary rounded-full animate-explosion-ember-2" />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full animate-explosion-ember-3" />
        <div className="absolute top-1/2 left-0 w-2 h-2 bg-red-500 rounded-full animate-explosion-ember-4" />
        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-explosion-ember-5" />
        <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full animate-explosion-ember-6" />
      </div>
      
      {/* Smoke/glow */}
      <div className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-gradient-radial from-gray-800/60 via-gray-600/40 to-transparent rounded-full animate-explosion-smoke blur-md" />
      </div>
    </div>
  );
}
