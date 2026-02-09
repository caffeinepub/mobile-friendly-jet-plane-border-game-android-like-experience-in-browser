interface PlayerJetProps {
  position: { x: number; y: number };
}

export default function PlayerJet({ position }: PlayerJetProps) {
  return (
    <div
      className="absolute pointer-events-none transition-transform duration-100"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-32 h-32">
        {/* Main jet body */}
        <svg
          viewBox="0 0 128 128"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(255,100,0,0.6)]"
        >
          {/* Thruster glow */}
          <defs>
            <radialGradient id="thrusterGlow" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="oklch(0.75 0.25 35)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="oklch(0.65 0.22 30)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="oklch(0.55 0.18 25)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="jetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.70 0.20 35)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.60 0.18 30)" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Outer glow */}
          <ellipse cx="64" cy="64" rx="50" ry="50" fill="url(#jetGlow)" className="animate-pulse" />
          
          {/* Thruster flames */}
          <ellipse cx="64" cy="100" rx="20" ry="30" fill="url(#thrusterGlow)" className="jet-thruster" />
          
          {/* Wing left */}
          <path
            d="M 30 70 L 15 85 L 20 90 L 40 75 Z"
            fill="oklch(0.45 0.18 30)"
            stroke="oklch(0.65 0.22 35)"
            strokeWidth="1.5"
          />
          
          {/* Wing right */}
          <path
            d="M 98 70 L 113 85 L 108 90 L 88 75 Z"
            fill="oklch(0.45 0.18 30)"
            stroke="oklch(0.65 0.22 35)"
            strokeWidth="1.5"
          />
          
          {/* Main fuselage */}
          <path
            d="M 64 20 L 50 60 L 50 85 L 64 95 L 78 85 L 78 60 Z"
            fill="oklch(0.50 0.20 32)"
            stroke="oklch(0.70 0.24 35)"
            strokeWidth="2"
          />
          
          {/* Cockpit canopy */}
          <ellipse
            cx="64"
            cy="40"
            rx="10"
            ry="15"
            fill="oklch(0.75 0.15 200)"
            fillOpacity="0.7"
            stroke="oklch(0.65 0.22 35)"
            strokeWidth="1.5"
          />
          
          {/* Nose cone */}
          <path
            d="M 64 20 L 58 30 L 70 30 Z"
            fill="oklch(0.68 0.22 35)"
            stroke="oklch(0.75 0.25 35)"
            strokeWidth="1.5"
          />
          
          {/* Engine vents */}
          <rect x="52" y="80" width="6" height="8" rx="1" fill="oklch(0.30 0.15 25)" />
          <rect x="70" y="80" width="6" height="8" rx="1" fill="oklch(0.30 0.15 25)" />
          
          {/* Detail lines */}
          <line x1="64" y1="35" x2="64" y2="75" stroke="oklch(0.60 0.20 35)" strokeWidth="1" opacity="0.5" />
        </svg>
        
        {/* Animated thruster glow effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-game-primary rounded-full blur-xl opacity-60 animate-pulse" />
      </div>
    </div>
  );
}
