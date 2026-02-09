interface ObstacleProps {
  position: { x: number; y: number };
}

export default function Obstacle({ position }: ObstacleProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
        {/* Hexagon obstacle with orange/red hazard theme */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(255,80,0,0.8)]"
        >
          <defs>
            <radialGradient id="hexGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.65 0.25 30)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="oklch(0.55 0.22 25)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hexBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.55 0.24 30)" />
              <stop offset="50%" stopColor="oklch(0.48 0.22 28)" />
              <stop offset="100%" stopColor="oklch(0.42 0.20 25)" />
            </linearGradient>
          </defs>
          
          {/* Outer glow */}
          <circle cx="50" cy="50" r="45" fill="url(#hexGlow)" className="animate-pulse" />
          
          {/* Main hexagon body - flat top orientation */}
          <polygon
            points="50,10 85,30 85,70 50,90 15,70 15,30"
            fill="url(#hexBody)"
            stroke="oklch(0.70 0.26 32)"
            strokeWidth="3"
          />
          
          {/* Inner hexagon frame */}
          <polygon
            points="50,20 75,35 75,65 50,80 25,65 25,35"
            fill="none"
            stroke="oklch(0.60 0.24 30)"
            strokeWidth="2"
            opacity="0.7"
          />
          
          {/* Hazard stripes - adapted to hexagon */}
          <line x1="30" y1="35" x2="45" y2="50" stroke="oklch(0.75 0.26 35)" strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="50" x2="70" y2="65" stroke="oklch(0.75 0.26 35)" strokeWidth="2" opacity="0.8" />
          <line x1="30" y1="65" x2="45" y2="50" stroke="oklch(0.75 0.26 35)" strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="50" x2="70" y2="35" stroke="oklch(0.75 0.26 35)" strokeWidth="2" opacity="0.8" />
          
          {/* Danger core - pulsing center */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="oklch(0.70 0.28 35)"
            className="animate-pulse"
          />
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="oklch(0.80 0.30 35)"
          />
          
          {/* Warning rings - animated */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="oklch(0.70 0.26 32)"
            strokeWidth="1.5"
            opacity="0.6"
            className="animate-pulse"
            style={{ animationDuration: '1.5s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="oklch(0.65 0.24 30)"
            strokeWidth="1"
            opacity="0.5"
            className="animate-pulse"
            style={{ animationDuration: '2s', animationDelay: '0.3s' }}
          />
        </svg>
        
        {/* Additional glow effect */}
        <div className="absolute inset-0 bg-game-primary rounded-full blur-lg opacity-40 animate-pulse" />
      </div>
    </div>
  );
}
