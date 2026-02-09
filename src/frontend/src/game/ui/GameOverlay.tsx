import { Zap, RotateCcw } from 'lucide-react';
import VirtualJoystick from './VirtualJoystick';

interface GameOverlayProps {
  gameState: 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onFire: () => void;
  onJoystickMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onJoystickNeutral: () => void;
  bulletCount: number;
}

export default function GameOverlay({
  gameState,
  onStart,
  onPause,
  onResume,
  onRestart,
  onFire,
  onJoystickMove,
  onJoystickNeutral,
  bulletCount,
}: GameOverlayProps) {
  return (
    <>
      {/* Start Screen */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md z-50">
          <div className="text-center space-y-6 sm:space-y-10 px-4 sm:px-6 max-w-2xl">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-game-primary via-game-accent to-game-primary-hover tracking-tighter drop-shadow-[0_0_30px_rgba(255,100,0,0.5)] animate-pulse">
                JET RUSH
              </h1>
              <div className="h-1 w-32 sm:w-48 mx-auto bg-gradient-to-r from-transparent via-game-primary to-transparent rounded-full" />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <p className="text-lg sm:text-2xl md:text-3xl text-foreground font-bold tracking-wide">
                USE JOYSTICK TO MOVE
              </p>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium">
                Tap FIRE to shoot
              </p>
            </div>
            
            <button
              onClick={onStart}
              className="group relative px-10 sm:px-14 py-5 sm:py-7 bg-gradient-to-br from-game-primary to-game-primary-hover hover:from-game-primary-hover hover:to-game-primary text-white text-xl sm:text-2xl md:text-3xl font-black rounded-2xl shadow-[0_8px_32px_rgba(255,100,0,0.5)] hover:shadow-[0_12px_48px_rgba(255,100,0,0.7)] transition-all duration-300 active:scale-95 border-2 border-game-accent/30"
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
                START GAME
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md z-50">
          <div className="text-center space-y-6 sm:space-y-10 px-4 sm:px-6 max-w-2xl">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-600 via-orange-500 to-red-600 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse">
                GAME OVER
              </h2>
              <div className="h-1 w-28 sm:w-40 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full" />
            </div>
            
            <button
              onClick={onRestart}
              className="group relative px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-br from-game-primary to-game-primary-hover hover:from-game-primary-hover hover:to-game-primary text-white text-lg sm:text-xl md:text-2xl font-black rounded-xl shadow-[0_6px_24px_rgba(255,100,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,100,0,0.6)] transition-all duration-300 active:scale-95 border-2 border-game-accent/30"
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                RESTART
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md z-50">
          <div className="text-center space-y-6 sm:space-y-10 px-4 sm:px-6 max-w-2xl">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-game-primary via-game-accent to-game-primary-hover tracking-tighter drop-shadow-[0_0_30px_rgba(255,100,0,0.5)]">
                PAUSED
              </h2>
              <div className="h-1 w-24 sm:w-32 mx-auto bg-gradient-to-r from-transparent via-game-primary to-transparent rounded-full" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={onResume}
                className="group relative px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-br from-game-primary to-game-primary-hover hover:from-game-primary-hover hover:to-game-primary text-white text-lg sm:text-xl md:text-2xl font-black rounded-xl shadow-[0_6px_24px_rgba(255,100,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,100,0,0.6)] transition-all duration-300 active:scale-95 border-2 border-game-accent/30"
              >
                <span className="relative z-10">RESUME</span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button
                onClick={onRestart}
                className="group relative px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-br from-game-secondary to-game-secondary-hover hover:from-game-secondary-hover hover:to-game-secondary text-white text-lg sm:text-xl md:text-2xl font-black rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 active:scale-95 border-2 border-game-border/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  RESTART
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD */}
      {gameState === 'playing' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-start z-40 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-game-border/50 shadow-game">
              <div className="flex items-center gap-2 sm:gap-3">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-game-primary" fill="currentColor" />
                <span className="text-lg sm:text-2xl font-black text-foreground tracking-wider">
                  {bulletCount}
                </span>
              </div>
            </div>
            
            <button
              onClick={onPause}
              className="pointer-events-auto bg-background/80 backdrop-blur-sm p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 border-game-border/50 shadow-game hover:bg-background/90 transition-colors active:scale-95"
            >
              <div className="w-4 h-4 sm:w-6 sm:h-6 flex gap-1 sm:gap-1.5 items-center justify-center">
                <div className="w-1 sm:w-1.5 h-full bg-game-primary rounded-full" />
                <div className="w-1 sm:w-1.5 h-full bg-game-primary rounded-full" />
              </div>
            </button>
          </div>

          {/* Virtual Controls */}
          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-40">
            <VirtualJoystick
              onMove={onJoystickMove}
              onNeutral={onJoystickNeutral}
            />
          </div>

          <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-40">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFire();
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-game-primary to-game-primary-hover border-2 sm:border-4 border-game-accent/50 shadow-[0_0_20px_rgba(255,100,0,0.5)] hover:shadow-[0_0_30px_rgba(255,100,0,0.7)] active:scale-95 transition-all flex items-center justify-center group"
            >
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white group-active:scale-110 transition-transform" fill="currentColor" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
