import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play } from 'lucide-react';
import VirtualJoystick from './VirtualJoystick';
import ShootButton from './ShootButton';
import { formatTime } from '../utils/levelTimer';

interface GameOverlayProps {
  gameState: 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused' | 'levelcomplete';
  score: number;
  level: number;
  timeRemaining: number;
  bossActive: boolean;
  bossHits: number;
  bossMaxHits: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNextLevel: () => void;
  onJoystickMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onJoystickNeutral: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  joystickResetToken: number;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export default function GameOverlay({
  gameState,
  score,
  level,
  timeRemaining,
  bossActive,
  bossHits,
  bossMaxHits,
  onStart,
  onPause,
  onResume,
  onNextLevel,
  onJoystickMove,
  onJoystickNeutral,
  onFireStart,
  onFireEnd,
  joystickResetToken,
  sensitivity,
  onSensitivityChange,
}: GameOverlayProps) {
  return (
    <>
      {/* HUD - Top bar */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 bg-game-field/80 backdrop-blur-sm border-b border-game-border z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm font-bold text-game-accent">
              SCORE: <span className="text-foreground">{score}</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-game-accent">
              LEVEL: <span className="text-foreground">{level}</span>
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold text-game-accent">
            TIME: <span className="text-foreground">{formatTime(timeRemaining)}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={gameState === 'playing' ? onPause : onResume}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
          >
            {gameState === 'playing' ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </Button>
        </div>
      )}

      {/* Boss health bar */}
      {(gameState === 'playing' || gameState === 'paused') && bossActive && (
        <div className="absolute top-10 sm:top-11 left-0 right-0 px-2 sm:px-3 z-10">
          <div className="bg-game-field/80 backdrop-blur-sm border border-game-border rounded px-2 py-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-destructive">BOSS</span>
              <span className="text-[10px] sm:text-xs font-bold text-foreground">
                {bossHits}/{bossMaxHits}
              </span>
            </div>
            <Progress value={(bossHits / bossMaxHits) * 100} className="h-1.5 sm:h-2" />
          </div>
        </div>
      )}

      {/* Sensitivity control - bottom center */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 sm:bottom-3">
          <div className="bg-game-field/80 backdrop-blur-sm border border-game-border rounded px-2 py-1 flex items-center gap-2">
            <label htmlFor="sensitivity-slider" className="text-[10px] sm:text-xs font-bold text-game-accent whitespace-nowrap">
              SENSITIVITY
            </label>
            <input
              id="sensitivity-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-game-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-game-accent [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-game-accent [&::-moz-range-thumb]:border-0"
            />
            <span className="text-[10px] sm:text-xs font-bold text-foreground min-w-[2ch]">
              {sensitivity.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Start screen */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm z-20">
          <div className="text-center space-y-3 sm:space-y-4 px-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-game-accent drop-shadow-lg">
              JET FIGHTER
            </h1>
            <p className="text-xs sm:text-sm text-game-text-secondary max-w-xs mx-auto">
              Destroy obstacles, defeat bosses, and survive as long as you can!
            </p>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 h-auto"
            >
              START GAME
            </Button>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/70 backdrop-blur-sm z-20">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-game-accent drop-shadow-lg">PAUSED</h2>
            <Button
              size="lg"
              onClick={onResume}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 h-auto"
            >
              RESUME
            </Button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm z-20">
          <div className="text-center space-y-3 sm:space-y-4 px-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-destructive drop-shadow-lg">GAME OVER</h2>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-lg font-bold text-game-accent">
                Final Score: <span className="text-foreground">{score}</span>
              </p>
              <p className="text-base sm:text-lg font-bold text-game-accent">
                Level Reached: <span className="text-foreground">{level}</span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 h-auto"
            >
              PLAY AGAIN
            </Button>
          </div>
        </div>
      )}

      {/* Level complete screen */}
      {gameState === 'levelcomplete' && (
        <div className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm z-20">
          <div className="text-center space-y-3 sm:space-y-4 px-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-game-accent drop-shadow-lg">LEVEL COMPLETE!</h2>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-lg font-bold text-game-accent">
                Score: <span className="text-foreground">{score}</span>
              </p>
              <p className="text-base sm:text-lg font-bold text-game-accent">
                Next Level: <span className="text-foreground">{level + 1}</span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={onNextLevel}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 h-auto"
            >
              NEXT LEVEL
            </Button>
          </div>
        </div>
      )}

      {/* Virtual controls - only show during gameplay */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
            <VirtualJoystick
              onMove={onJoystickMove}
              onNeutral={onJoystickNeutral}
              resetToken={joystickResetToken}
            />
          </div>
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10">
            <ShootButton onFireStart={onFireStart} onFireEnd={onFireEnd} />
          </div>
        </>
      )}
    </>
  );
}
