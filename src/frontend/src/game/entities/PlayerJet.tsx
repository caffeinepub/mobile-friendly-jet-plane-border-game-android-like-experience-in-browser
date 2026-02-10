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
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
        {/* Jet sprite image */}
        <img
          src="/assets/generated/jet-player.dim_256x256.png"
          alt="Player Jet"
          className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(255,120,0,0.6)]"
        />
        
        {/* Animated thruster glow effect - only visible when thrusting */}
        {isThrusting && (
          <>
            {/* Primary thruster glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-12 h-12 sm:w-16 sm:h-16 bg-game-primary rounded-full blur-2xl opacity-70 animate-pulse" />
            
            {/* Secondary flame trail */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-b from-orange-400 via-orange-500 to-transparent rounded-full blur-lg opacity-60 jet-thruster-outer" />
            
            {/* Core bright flame */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-6 h-10 sm:w-8 sm:h-12 bg-gradient-to-b from-yellow-200 via-orange-300 to-transparent rounded-full blur-sm opacity-90 jet-thruster-inner" />
          </>
        )}
      </div>
    </div>
  );
}
