interface ExplosionProps {
  position: { x: number; y: number };
  variant?: 'hit' | 'player' | 'bomb';
}

export default function Explosion({ position, variant = 'player' }: ExplosionProps) {
  const isHit = variant === 'hit';
  const isBomb = variant === 'bomb';
  
  // Pre-calculated ember positions (deterministic, no per-render randomness)
  const emberPositions = [
    { angle: 0, distance: 40 },
    { angle: 30, distance: 45 },
    { angle: 60, distance: 38 },
    { angle: 90, distance: 42 },
    { angle: 120, distance: 46 },
    { angle: 150, distance: 40 },
    { angle: 180, distance: 44 },
    { angle: 210, distance: 38 },
    { angle: 240, distance: 42 },
    { angle: 270, distance: 40 },
    { angle: 300, distance: 45 },
    { angle: 330, distance: 43 },
  ];

  if (isHit) {
    // Smaller, faster hit effect for bullet impacts
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Flash */}
        <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full animate-explosion-hit-flash" />
        
        {/* Blast wave */}
        <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 -translate-x-1/2 -translate-y-1/2 border-2 border-game-primary rounded-full animate-explosion-hit-blast" />
        
        {/* Sparks (fewer for hit) */}
        {emberPositions.slice(0, 6).map((ember, i) => {
          const angleRad = (ember.angle * Math.PI) / 180;
          const distance = ember.distance * 0.5; // Smaller spread for hits
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-game-accent rounded-full animate-explosion-hit-spark"
              style={{
                left: '50%',
                top: '50%',
                '--spark-x': `${Math.cos(angleRad) * distance}px`,
                '--spark-y': `${Math.sin(angleRad) * distance}px`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    );
  }

  if (isBomb) {
    // Massive bomb explosion for obstacle→player collision
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Massive flash */}
        <div className="absolute inset-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full animate-explosion-bomb-flash" />
        
        {/* Multiple blast waves */}
        <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 -translate-x-1/2 -translate-y-1/2 border-[6px] sm:border-8 border-game-primary rounded-full animate-explosion-bomb-blast-1" />
        <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 -translate-x-1/2 -translate-y-1/2 border-[6px] sm:border-8 border-game-accent rounded-full animate-explosion-bomb-blast-2" />
        <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 -translate-x-1/2 -translate-y-1/2 border-[6px] sm:border-8 border-red-500 rounded-full animate-explosion-bomb-blast-3" />
        
        {/* More embers with larger spread */}
        {emberPositions.map((ember, i) => {
          const angleRad = (ember.angle * Math.PI) / 180;
          const distance = ember.distance * 2.5; // Much larger spread for bomb
          return (
            <div
              key={i}
              className="absolute w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-game-primary rounded-full animate-explosion-bomb-ember"
              style={{
                left: '50%',
                top: '50%',
                '--ember-x': `${Math.cos(angleRad) * distance}px`,
                '--ember-y': `${Math.sin(angleRad) * distance}px`,
              } as React.CSSProperties}
            />
          );
        })}
        
        {/* Additional ember ring */}
        {emberPositions.map((ember, i) => {
          const angleRad = ((ember.angle + 15) * Math.PI) / 180;
          const distance = ember.distance * 2; // Secondary ring
          return (
            <div
              key={`ring-${i}`}
              className="absolute w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-game-accent rounded-full animate-explosion-bomb-ember-delayed"
              style={{
                left: '50%',
                top: '50%',
                '--ember-x': `${Math.cos(angleRad) * distance}px`,
                '--ember-y': `${Math.sin(angleRad) * distance}px`,
              } as React.CSSProperties}
            />
          );
        })}
        
        {/* Heavy smoke clouds */}
        <div className="absolute inset-0 w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 -translate-x-1/2 -translate-y-1/2 bg-gray-700/70 rounded-full blur-2xl animate-explosion-bomb-smoke" />
        <div className="absolute inset-0 w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 -translate-x-1/2 -translate-y-1/2 bg-gray-600/60 rounded-full blur-xl animate-explosion-bomb-smoke-delayed" />
      </div>
    );
  }

  // Standard player explosion
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Flash */}
      <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full animate-explosion-flash" />
      
      {/* Blast waves */}
      <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 -translate-x-1/2 -translate-y-1/2 border-4 border-game-primary rounded-full animate-explosion-blast-1" />
      <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 -translate-x-1/2 -translate-y-1/2 border-4 border-game-accent rounded-full animate-explosion-blast-2" />
      
      {/* Embers */}
      {emberPositions.map((ember, i) => {
        const angleRad = (ember.angle * Math.PI) / 180;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-game-primary rounded-full animate-explosion-ember"
            style={{
              left: '50%',
              top: '50%',
              '--ember-x': `${Math.cos(angleRad) * ember.distance}px`,
              '--ember-y': `${Math.sin(angleRad) * ember.distance}px`,
            } as React.CSSProperties}
          />
        );
      })}
      
      {/* Smoke */}
      <div className="absolute inset-0 w-20 h-20 sm:w-28 sm:h-28 -translate-x-1/2 -translate-y-1/2 bg-gray-600/60 rounded-full blur-xl animate-explosion-smoke" />
    </div>
  );
}
