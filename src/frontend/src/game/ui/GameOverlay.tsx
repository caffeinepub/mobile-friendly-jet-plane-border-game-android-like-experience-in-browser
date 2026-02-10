import { useEffect } from 'react';
import VirtualJoystick from './VirtualJoystick';
import ShootButton from './ShootButton';
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
  // Stop firing when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      onFireEnd();
    }
  }, [gameState, onFireEnd]);

  // Calculate progress percentage
  const progressPercent = target > 0 ? Math.min((destroyed / target) * 100, 100) : 0;
  const bossProgressPercent = bossMaxHits > 0 ? Math.min((bossHits / bossMaxHits) * 100, 100) : 0;

  // Determine if timer is low (less than 10 seconds)
  const isTimerLow = timeRemaining < 10;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD - Top bar with score, level, and timer - MOBILE OPTIMIZED */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-1 left-1 right-1 sm:top-2 sm:left-2 sm:right-2 flex items-start justify-between gap-1 sm:gap-2 pointer-events-auto z-10">
          {/* Left side - Score and Level */}
          <div className="flex flex-col gap-0.5 sm:gap-1 bg-game-field/90 backdrop-blur-sm border border-game-border rounded px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg text-xs sm:text-sm">
            <div className="text-[9px] sm:text-xs font-bold text-game-text-secondary">SCORE</div>
            <div className="text-sm sm:text-lg md:text-xl font-bold text-game-primary tabular-nums leading-tight">
              {score.toString().padStart(6, '0')}
            </div>
            <div className="text-[9px] sm:text-xs font-bold text-game-text-secondary">
              LVL {level}
            </div>
          </div>

          {/* Center - Timer */}
          <div className="flex flex-col items-center gap-0.5 bg-game-field/90 backdrop-blur-sm border border-game-border rounded px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg">
            <div className="text-[9px] sm:text-xs font-bold text-game-text-secondary">TIME</div>
            <div
              className={`text-base sm:text-xl md:text-2xl font-bold tabular-nums transition-colors leading-tight ${
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
            className="bg-game-field/90 backdrop-blur-sm border border-game-border hover:bg-game-primary/20 h-8 w-8 sm:h-10 sm:w-10"
          >
            <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}

      {/* Progress bar - Below HUD - MOBILE OPTIMIZED WITH MAX WIDTH */}
      {(gameState === 'playing' || gameState === 'paused') && !bossActive && (
        <div className="absolute top-12 sm:top-14 left-1 right-1 sm:left-2 sm:right-2 pointer-events-auto z-10 flex justify-center">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-game-field/90 backdrop-blur-sm border border-game-border rounded px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-xs font-bold text-game-text-secondary">
                DESTROYED
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-game-primary tabular-nums">
                {destroyed}/{target}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5 sm:h-2" />
          </div>
        </div>
      )}

      {/* Boss health bar - MOBILE OPTIMIZED WITH MAX WIDTH */}
      {(gameState === 'playing' || gameState === 'paused') && bossActive && (
        <div className="absolute top-12 sm:top-14 left-1 right-1 sm:left-2 sm:right-2 pointer-events-auto z-10 flex justify-center">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-game-field/90 backdrop-blur-sm border border-red-500 rounded px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg shadow-red-500/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-xs font-bold text-red-400 animate-pulse">
                ⚠️ BOSS
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-red-400 tabular-nums">
                {Math.max(0, bossMaxHits - bossHits)} HITS
              </span>
            </div>
            <Progress value={bossProgressPercent} className="h-2 sm:h-2.5 [&>div]:bg-red-500" />
          </div>
        </div>
      )}

      {/* Shoot button - Bottom left - MOBILE OPTIMIZED */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 pointer-events-auto z-20">
          <ShootButton
            onFireStart={onFireStart}
            onFireEnd={onFireEnd}
            disabled={gameState === 'paused'}
          />
        </div>
      )}

      {/* Virtual joystick - Bottom right - MOBILE OPTIMIZED */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 pointer-events-auto z-20">
          <VirtualJoystick onMove={onJoystickMove} onNeutral={onJoystickNeutral} />
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
              Use the joystick to move and the shoot button to fire. Destroy obstacles and defeat the boss!
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
