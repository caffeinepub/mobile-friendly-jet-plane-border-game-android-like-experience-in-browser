interface PlayerJetProps {
  position: { x: number; y: number };
  rotation?: number; // Rotation in degrees, 0 = facing up
  isThrusting?: boolean; // Whether the jet is actively moving
}

export default function PlayerJet({ position, rotation = 0, isThrusting = false }: PlayerJetProps) {
  return (
    <div
      className="absolute pointer-events-none transition-transform duration-100"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" style={{ overflow: 'visible' }}>
        {/* Animated thruster glow effect - rendered BEHIND jet, engine-relative */}
        {isThrusting && (
          <div 
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform: 'translate(-50%, -50%)',
              zIndex: -1,
            }}
          >
            {/* Outer flame layer - orange glow */}
            <div 
              className="absolute left-1/2 top-1/2 w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-b from-orange-400 via-orange-500 to-transparent rounded-full blur-lg opacity-60 jet-thruster-outer"
              style={{
                transform: 'translate(-50%, 20%) rotate(0deg)',
                transformOrigin: 'center top',
              }}
            />
            
            {/* Middle flame layer - bright orange */}
            <div 
              className="absolute left-1/2 top-1/2 w-6 h-12 sm:w-8 sm:h-16 bg-gradient-to-b from-orange-300 via-orange-400 to-transparent rounded-full blur-md opacity-75 jet-thruster-middle"
              style={{
                transform: 'translate(-50%, 22%) rotate(0deg)',
                transformOrigin: 'center top',
              }}
            />
            
            {/* Inner core - bright yellow-white */}
            <div 
              className="absolute left-1/2 top-1/2 w-4 h-8 sm:w-6 sm:h-12 bg-gradient-to-b from-yellow-200 via-orange-300 to-transparent rounded-full blur-sm opacity-90 jet-thruster-inner"
              style={{
                transform: 'translate(-50%, 24%) rotate(0deg)',
                transformOrigin: 'center top',
              }}
            />
            
            {/* Primary thruster glow base */}
            <div 
              className="absolute left-1/2 top-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-game-primary rounded-full blur-2xl opacity-70 animate-pulse"
              style={{
                transform: 'translate(-50%, 15%)',
              }}
            />
          </div>
        )}
        
        {/* UI-rendered jet body using SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_16px_rgba(255,120,0,0.6)] relative z-10"
        >
          {/* Main fuselage */}
          <ellipse
            cx="50"
            cy="50"
            rx="12"
            ry="28"
            fill="url(#fuselageGradient)"
            stroke="#1a1a2e"
            strokeWidth="1.5"
          />
          
          {/* Nose cone */}
          <path
            d="M 50 22 L 44 30 L 56 30 Z"
            fill="#ff6b35"
            stroke="#1a1a2e"
            strokeWidth="1"
          />
          
          {/* Cockpit window */}
          <ellipse
            cx="50"
            cy="38"
            rx="6"
            ry="8"
            fill="url(#cockpitGradient)"
            stroke="#1a1a2e"
            strokeWidth="1"
          />
          
          {/* Left wing */}
          <path
            d="M 38 55 L 20 65 L 25 68 L 40 60 Z"
            fill="url(#wingGradient)"
            stroke="#1a1a2e"
            strokeWidth="1.5"
          />
          
          {/* Right wing */}
          <path
            d="M 62 55 L 80 65 L 75 68 L 60 60 Z"
            fill="url(#wingGradient)"
            stroke="#1a1a2e"
            strokeWidth="1.5"
          />
          
          {/* Left stabilizer */}
          <path
            d="M 42 72 L 35 80 L 38 82 L 44 75 Z"
            fill="url(#stabilizerGradient)"
            stroke="#1a1a2e"
            strokeWidth="1"
          />
          
          {/* Right stabilizer */}
          <path
            d="M 58 72 L 65 80 L 62 82 L 56 75 Z"
            fill="url(#stabilizerGradient)"
            stroke="#1a1a2e"
            strokeWidth="1"
          />
          
          {/* Tail fin */}
          <path
            d="M 50 75 L 46 85 L 54 85 Z"
            fill="url(#tailGradient)"
            stroke="#1a1a2e"
            strokeWidth="1"
          />
          
          {/* Engine exhausts */}
          <ellipse cx="45" cy="78" rx="2.5" ry="3" fill="#2a2a3e" />
          <ellipse cx="55" cy="78" rx="2.5" ry="3" fill="#2a2a3e" />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="fuselageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8e8f0" />
              <stop offset="50%" stopColor="#c0c0d0" />
              <stop offset="100%" stopColor="#a0a0b8" />
            </linearGradient>
            
            <linearGradient id="cockpitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4dd0e1" />
              <stop offset="100%" stopColor="#0097a7" />
            </linearGradient>
            
            <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d0d0e0" />
              <stop offset="100%" stopColor="#9090a8" />
            </linearGradient>
            
            <linearGradient id="stabilizerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8c8d8" />
              <stop offset="100%" stopColor="#8888a0" />
            </linearGradient>
            
            <linearGradient id="tailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#d84315" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
