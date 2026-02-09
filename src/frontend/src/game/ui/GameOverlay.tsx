import { Zap } from 'lucide-react';

interface GameOverlayProps {
  gameState: 'idle' | 'playing' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onFire: () => void;
  bulletCount: number;
}

export default function GameOverlay({
  gameState,
  onStart,
  onPause,
  onResume,
  onRestart,
  onFire,
  bulletCount,
}: GameOverlayProps) {
  return (
    <>
      {/* Start Screen */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md z-50">
          <div className="text-center space-y-10 px-6 max-w-2xl">
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-game-primary via-game-accent to-game-primary-hover tracking-tighter drop-shadow-[0_0_30px_rgba(255,100,0,0.5)] animate-pulse">
                JET RUSH
              </h1>
              <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-game-primary to-transparent rounded-full" />
            </div>
            
            <div className="space-y-3">
              <p className="text-2xl md:text-3xl text-foreground font-bold tracking-wide">
                DRAG TO MOVE
              </p>
              <p className="text-lg md:text-xl text-muted-foreground font-medium">
                Tap FIRE to shoot
              </p>
            </div>
            
            <button
              onClick={onStart}
              className="group relative px-14 py-7 bg-gradient-to-br from-game-primary to-game-primary-hover hover:from-game-primary-hover hover:to-game-primary text-white text-2xl md:text-3xl font-black rounded-2xl shadow-[0_8px_32px_rgba(255,100,0,0.5)] hover:shadow-[0_12px_48px_rgba(255,100,0,0.7)] transition-all duration-300 active:scale-95 border-2 border-game-accent/30"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-8 h-8" fill="currentColor" />
                START GAME
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md z-50">
          <div className="text-center space-y-10 px-6 max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-game-primary via-game-accent to-game-primary-hover tracking-tighter drop-shadow-[0_0_30px_rgba(255,100,0,0.5)]">
                PAUSED
              </h2>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-game-primary to-transparent rounded-full" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onResume}
                className="group relative px-12 py-6 bg-gradient-to-br from-game-primary to-game-primary-hover hover:from-game-primary-hover hover:to-game-primary text-white text-xl md:text-2xl font-black rounded-xl shadow-[0_6px_24px_rgba(255,100,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,100,0,0.6)] transition-all duration-200 active:scale-95 border-2 border-game-accent/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-6 h-6" fill="currentColor" />
                  RESUME
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button
                onClick={onRestart}
                className="group relative px-12 py-6 bg-gradient-to-br from-game-secondary to-game-secondary-hover hover:from-game-secondary-hover hover:to-game-secondary text-white text-xl md:text-2xl font-black rounded-xl shadow-[0_6px_24px_rgba(200,80,0,0.4)] hover:shadow-[0_8px_32px_rgba(200,80,0,0.6)] transition-all duration-200 active:scale-95 border-2 border-game-accent/20"
              >
                <span className="relative z-10">RESTART</span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD and Controls */}
      {gameState === 'playing' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-6 z-40 pointer-events-none">
            {/* Bullets Counter */}
            <div className="pointer-events-auto bg-gradient-to-br from-game-field/90 to-game-field/70 backdrop-blur-md px-5 py-3 rounded-xl border-2 border-game-border/40 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-game-accent" fill="currentColor" />
                <span className="text-lg font-black text-game-accent tracking-wider">
                  {bulletCount}
                </span>
              </div>
            </div>
            
            {/* Pause Button */}
            <button
              onClick={onPause}
              className="pointer-events-auto group relative p-4 bg-gradient-to-br from-game-primary/90 to-game-primary-hover/90 hover:from-game-primary hover:to-game-primary-hover text-white rounded-xl shadow-[0_4px_16px_rgba(255,100,0,0.4)] hover:shadow-[0_6px_24px_rgba(255,100,0,0.6)] transition-all duration-200 active:scale-95 backdrop-blur-md border-2 border-game-accent/30"
              aria-label="Pause"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          
          {/* Fire Button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                onFire();
              }}
              className="group relative px-10 py-5 bg-gradient-to-br from-game-accent to-game-primary hover:from-game-primary hover:to-game-accent text-white text-xl md:text-2xl font-black rounded-2xl shadow-[0_8px_32px_rgba(255,150,0,0.6)] hover:shadow-[0_12px_48px_rgba(255,150,0,0.8)] transition-all duration-150 active:scale-95 border-2 border-white/30 backdrop-blur-sm"
              aria-label="Fire"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-7 h-7" fill="currentColor" />
                FIRE
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
