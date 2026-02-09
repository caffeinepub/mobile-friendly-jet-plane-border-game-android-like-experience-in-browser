interface PlayerJetProps {
  position: { x: number; y: number };
  rotation?: number; // Rotation in degrees, 0 = facing up
}

export default function PlayerJet({ position, rotation = 0 }: PlayerJetProps) {
  return (
    <div
      className="absolute pointer-events-none transition-transform duration-100"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        {/* Main jet body */}
        <svg
          viewBox="0 0 128 128"
          className="w-full h-full drop-shadow-[0_0_16px_rgba(255,120,0,0.6)]"
        >
          {/* Thruster glow */}
          <defs>
            <radialGradient id="thrusterGlow" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="oklch(0.80 0.28 35)" stopOpacity="1" />
              <stop offset="50%" stopColor="oklch(0.70 0.24 30)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="oklch(0.60 0.20 25)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="jetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.75 0.22 35)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.65 0.20 30)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.72 0.24 35)" />
              <stop offset="50%" stopColor="oklch(0.58 0.22 32)" />
              <stop offset="100%" stopColor="oklch(0.48 0.20 30)" />
            </linearGradient>
          </defs>
          
          {/* Outer glow aura */}
          <ellipse cx="64" cy="64" rx="52" ry="52" fill="url(#jetGlow)" className="animate-pulse" />
          
          {/* Thruster flames - animated */}
          <ellipse cx="64" cy="102" rx="22" ry="32" fill="url(#thrusterGlow)" className="jet-thruster" />
          
          {/* Wing left - sharper, more angular */}
          <path
            d="M 28 68 L 12 88 L 18 92 L 38 74 Z"
            fill="oklch(0.50 0.20 32)"
            stroke="oklch(0.70 0.26 35)"
            strokeWidth="2"
          />
          
          {/* Wing right - sharper, more angular */}
          <path
            d="M 100 68 L 116 88 L 110 92 L 90 74 Z"
            fill="oklch(0.50 0.20 32)"
            stroke="oklch(0.70 0.26 35)"
            strokeWidth="2"
          />
          
          {/* Main fuselage - sleeker profile */}
          <path
            d="M 64 18 L 48 58 L 48 86 L 64 98 L 80 86 L 80 58 Z"
            fill="url(#fuselageGrad)"
            stroke="oklch(0.75 0.26 35)"
            strokeWidth="2.5"
          />
          
          {/* Cockpit canopy - more prominent */}
          <ellipse
            cx="64"
            cy="38"
            rx="12"
            ry="18"
            fill="oklch(0.80 0.12 200)"
            fillOpacity="0.8"
            stroke="oklch(0.70 0.24 35)"
            strokeWidth="2"
          />
          
          {/* Nose cone - sharper point */}
          <path
            d="M 64 18 L 56 32 L 72 32 Z"
            fill="oklch(0.75 0.26 35)"
            stroke="oklch(0.82 0.28 35)"
            strokeWidth="2"
          />
          
          {/* Engine vents - more defined */}
          <rect x="50" y="82" width="7" height="10" rx="1.5" fill="oklch(0.25 0.12 25)" stroke="oklch(0.40 0.15 30)" strokeWidth="1" />
          <rect x="71" y="82" width="7" height="10" rx="1.5" fill="oklch(0.25 0.12 25)" stroke="oklch(0.40 0.15 30)" strokeWidth="1" />
          
          {/* Detail lines - center spine */}
          <line x1="64" y1="35" x2="64" y2="80" stroke="oklch(0.65 0.22 35)" strokeWidth="1.5" opacity="0.6" />
          
          {/* Wing detail lines */}
          <line x1="28" y1="68" x2="38" y2="74" stroke="oklch(0.65 0.22 35)" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="68" x2="90" y2="74" stroke="oklch(0.65 0.22 35)" strokeWidth="1" opacity="0.5" />
          
          {/* Accent highlights */}
          <circle cx="64" cy="38" r="3" fill="oklch(0.85 0.10 200)" opacity="0.9" />
        </svg>
        
        {/* Animated thruster glow effect - more intense */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-game-primary rounded-full blur-xl opacity-70 animate-pulse" />
      </div>
    </div>
  );
}
