import { useEffect, useRef } from 'react';
import VirtualJoystick from './VirtualJoystick';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatTime } from '../utils/levelTimer';

interface GameOverlayProps {
  gameState: 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused' | 'levelcomplete';
  score: number;
  level: number;
  destroyed: number;
  target: number;
  bossActive: boolean;
  bossHits: number;
  bossMaxHits: number;
  timeRemaining: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNextLevel: () => void;
  onJoystickMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onJoystickNeutral: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
}

export default function GameOverlay({
  gameState,
  score,
  level,
  destroyed,
  target,
  bossActive,
  bossHits,
  bossMaxHits,
  timeRemaining,
  onStart,
  onPause,
  onResume,
  onNextLevel,
  onJoystickMove,
  onJoystickNeutral,
  onFireStart,
  onFireEnd,
}: GameOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isFiringRef = useRef(false);

  // Handle pointer capture for continuous firing
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (gameState !== 'playing') return;
      
      // Check if click is on fire button area (right side of screen on mobile, or anywhere on desktop)
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isRightSide = x > rect.width / 2;
      
      // On mobile (touch), only fire on right side; on desktop (mouse), fire anywhere
      if (e.pointerType === 'touch' && !isRightSide) return;
      
      if (!isFiringRef.current) {
        isFiringRef.current = true;
        onFireStart();
        overlay.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isFiringRef.current) {
        isFiringRef.current = false;
        onFireEnd();
        if (overlay.hasPointerCapture(e.pointerId)) {
          overlay.releasePointerCapture(e.pointerId);
        }
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (isFiringRef.current) {
        isFiringRef.current = false;
        onFireEnd();
        if (overlay.hasPointerCapture(e.pointerId)) {
          overlay.releasePointerCapture(e.pointerId);
        }
      }
    };

    overlay.addEventListener('pointerdown', handlePointerDown);
    overlay.addEventListener('pointerup', handlePointerUp);
    overlay.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      overlay.removeEventListener('pointerdown', handlePointerDown);
      overlay.removeEventListener('pointerup', handlePointerUp);
      overlay.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [gameState, onFireStart, onFireEnd]);

  // Stop firing when game state changes
  useEffect(() => {
    if (gameState !== 'playing' && isFiringRef.current) {
      isFiringRef.current = false;
      onFireEnd();
    }
  }, [gameState, onFireEnd]);

  // Calculate progress percentage
  const progressPercent = target > 0 ? Math.min((destroyed / target) * 100, 100) : 0;
  const bossProgressPercent = bossMaxHits > 0 ? Math.min((bossHits / bossMaxHits) * 100, 100) : 0;

  // Determine if timer is low (less than 10 seconds)
  const isTimerLow = timeRemaining < 10;

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
      {/* HUD - Top bar with score, level, and timer */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-start justify-between gap-2 sm:gap-4 pointer-events-auto z-10">
          {/* Left side - Score and Level */}
          <div className="flex flex-col gap-1 sm:gap-2 bg-game-field/90 backdrop-blur-sm border-2 border-game-border rounded-lg px-3 py-2 sm:px-4 sm:py-2 shadow-lg">
            <div className="text-xs sm:text-sm font-bold text-game-text-secondary">SCORE</div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-game-primary tabular-nums">
              {score.toString().padStart(6, '0')}
            </div>
            <div className="text-xs sm:text-sm font-bold text-game-text-secondary mt-1">
              LEVEL {level}
            </div>
          </div>

          {/* Center - Timer */}
          <div className="flex flex-col items-center gap-1 bg-game-field/90 backdrop-blur-sm border-2 border-game-border rounded-lg px-3 py-2 sm:px-4 sm:py-2 shadow-lg">
            <div className="text-xs sm:text-sm font-bold text-game-text-secondary">TIME</div>
            <div
              className={`text-xl sm:text-3xl md:text-4xl font-bold tabular-nums transition-colors ${
                isTimerLow ? 'text-red-500 animate-pulse' : 'text-game-primary'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Right side - Pause button */}
          <Button
            onClick={onPause}
            variant="outline"
            size="icon"
            className="bg-game-field/90 backdrop-blur-sm border-2 border-game-border hover:bg-game-primary/20 h-12 w-12 sm:h-14 sm:w-14"
          >
            <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      )}

      {/* Progress bar - Below HUD */}
      {(gameState === 'playing' || gameState === 'paused') && !bossActive && (
        <div className="absolute top-20 sm:top-24 left-2 right-2 sm:left-4 sm:right-4 pointer-events-auto z-10">
          <div className="bg-game-field/90 backdrop-blur-sm border-2 border-game-border rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-game-text-secondary">
                OBSTACLES DESTROYED
              </span>
              <span className="text-xs sm:text-sm font-bold text-game-primary tabular-nums">
                {destroyed} / {target}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 sm:h-3" />
          </div>
        </div>
      )}

      {/* Boss health bar */}
      {(gameState === 'playing' || gameState === 'paused') && bossActive && (
        <div className="absolute top-20 sm:top-24 left-2 right-2 sm:left-4 sm:right-4 pointer-events-auto z-10">
          <div className="bg-game-field/90 backdrop-blur-sm border-2 border-red-500 rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-lg shadow-red-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-red-400 animate-pulse">
                ⚠️ BOSS ENCOUNTER
              </span>
              <span className="text-xs sm:text-sm font-bold text-red-400 tabular-nums">
                {Math.max(0, bossMaxHits - bossHits)} HITS REMAINING
              </span>
            </div>
            <Progress value={bossProgressPercent} className="h-3 sm:h-4 [&>div]:bg-red-500" />
          </div>
        </div>
      )}

      {/* Virtual joystick - Bottom left */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 pointer-events-auto z-20">
          <VirtualJoystick onMove={onJoystickMove} onNeutral={onJoystickNeutral} />
        </div>
      )}

      {/* Fire instruction - Bottom right (mobile only) */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:hidden pointer-events-none z-20">
          <div className="bg-game-field/90 backdrop-blur-sm border-2 border-game-border rounded-lg px-4 py-3 shadow-lg">
            <div className="text-sm font-bold text-game-primary text-center">
              TAP RIGHT SIDE
              <br />
              TO FIRE
            </div>
          </div>
        </div>
      )}

      {/* Desktop fire instruction */}
      {gameState === 'playing' && (
        <div className="hidden md:block absolute bottom-8 right-8 pointer-events-none z-20">
          <div className="bg-game-field/90 backdrop-blur-sm border-2 border-game-border rounded-lg px-4 py-3 shadow-lg">
            <div className="text-sm font-bold text-game-primary text-center">
              CLICK ANYWHERE
              <br />
              TO FIRE
            </div>
          </div>
        </div>
      )}

      {/* Start screen */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/95 backdrop-blur-sm pointer-events-auto">
          <div className="text-center space-y-4 sm:space-y-6 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-game-primary drop-shadow-[0_0_20px_rgba(255,120,0,0.8)]">
              JET RUSH
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-game-text-secondary max-w-md mx-auto">
              Navigate with the joystick, fire to destroy obstacles, and defeat the boss to advance!
            </p>
            <Button
              onClick={onStart}
              size="lg"
              className="bg-game-primary hover:bg-game-primary/90 text-white font-bold text-lg sm:text-xl px-8 py-6 shadow-lg shadow-game-primary/50"
            >
              <Play className="mr-2 h-6 w-6" />
              START GAME
            </Button>
          </div>
        </div>
      )}

      {/* Paused screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/95 backdrop-blur-sm pointer-events-auto">
          <div className="text-center space-y-4 sm:space-y-6 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-game-primary">PAUSED</h2>
            <Button
              onClick={onResume}
              size="lg"
              className="bg-game-primary hover:bg-game-primary/90 text-white font-bold text-lg sm:text-xl px-8 py-6 shadow-lg shadow-game-primary/50"
            >
              <Play className="mr-2 h-6 w-6" />
              RESUME
            </Button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/95 backdrop-blur-sm pointer-events-auto">
          <div className="text-center space-y-4 sm:space-y-6 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-500">GAME OVER</h2>
            <div className="space-y-2">
              <p className="text-xl sm:text-2xl md:text-3xl text-game-text-secondary">
                Final Score:{' '}
                <span className="text-game-primary font-bold">{score.toString().padStart(6, '0')}</span>
              </p>
              <p className="text-lg sm:text-xl md:text-2xl text-game-text-secondary">
                Level Reached: <span className="text-game-primary font-bold">{level}</span>
              </p>
            </div>
            <Button
              onClick={onStart}
              size="lg"
              className="bg-game-primary hover:bg-game-primary/90 text-white font-bold text-lg sm:text-xl px-8 py-6 shadow-lg shadow-game-primary/50"
            >
              <Play className="mr-2 h-6 w-6" />
              PLAY AGAIN
            </Button>
          </div>
        </div>
      )}

      {/* Level complete screen */}
      {gameState === 'levelcomplete' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/95 backdrop-blur-sm pointer-events-auto">
          <div className="text-center space-y-4 sm:space-y-6 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-500">LEVEL COMPLETE!</h2>
            <div className="space-y-2">
              <p className="text-xl sm:text-2xl md:text-3xl text-game-text-secondary">
                Score: <span className="text-game-primary font-bold">{score.toString().padStart(6, '0')}</span>
              </p>
              <p className="text-lg sm:text-xl md:text-2xl text-game-text-secondary">
                Obstacles Destroyed:{' '}
                <span className="text-game-primary font-bold">
                  {destroyed} / {target}
                </span>
              </p>
            </div>
            <Button
              onClick={onNextLevel}
              size="lg"
              className="bg-game-primary hover:bg-game-primary/90 text-white font-bold text-lg sm:text-xl px-8 py-6 shadow-lg shadow-game-primary/50"
            >
              <Play className="mr-2 h-6 w-6" />
              NEXT LEVEL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
