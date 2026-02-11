import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play } from 'lucide-react';
import VirtualJoystick from './VirtualJoystick';
import ShootButton from './ShootButton';
import { formatTime } from '../utils/levelTimer';
import { Z_INDEX } from './zIndex';

type GameOverReason = 'border' | 'obstacle' | 'timeExpired' | null;

interface GameOverlayProps {
  gameState: 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused' | 'levelcomplete';
  gameOverReason: GameOverReason;
  score: number;
  level: number;
  timeRemaining: number;
  bossActive: boolean;
  bossHits: number;
  bossMaxHits: number;
  destroyedThisLevel: number;
  targetObstacles: number;
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
  gameOverReason,
  score,
  level,
  timeRemaining,
  bossActive,
  bossHits,
  bossMaxHits,
  destroyedThisLevel,
  targetObstacles,
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
  // Calculate level progress percentage (capped at 100%)
  const levelProgress = Math.min(100, (destroyedThisLevel / targetObstacles) * 100);

  return (
    <>
      {/* HUD - Top bar (above VFX, below overlays) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-between bg-game-field/80 backdrop-blur-sm border-b border-game-border"
          style={{ 
            zIndex: Z_INDEX.HUD,
            paddingLeft: 'var(--compact-hud-padding-x)',
            paddingRight: 'var(--compact-hud-padding-x)',
            paddingTop: 'var(--compact-hud-padding-y)',
            paddingBottom: 'var(--compact-hud-padding-y)',
            gap: 'var(--compact-hud-gap)',
          }}
        >
          <div className="flex items-center" style={{ gap: 'var(--compact-hud-gap)' }}>
            <div className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size)' }}>
              SCORE: <span className="text-white">{score}</span>
            </div>
            <div className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size)' }}>
              LEVEL: <span className="text-white">{level}</span>
            </div>
          </div>
          <div className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size)' }}>
            TIME: <span className="text-white">{formatTime(timeRemaining)}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={gameState === 'playing' ? onPause : onResume}
            className="p-0"
            style={{ 
              width: 'calc(var(--compact-hud-font-size) * 1.75)',
              height: 'calc(var(--compact-hud-font-size) * 1.75)',
            }}
          >
            {gameState === 'playing' ? (
              <Pause style={{ width: 'var(--compact-hud-font-size)', height: 'var(--compact-hud-font-size)' }} />
            ) : (
              <Play style={{ width: 'var(--compact-hud-font-size)', height: 'var(--compact-hud-font-size)' }} />
            )}
          </Button>
        </div>
      )}

      {/* Level progress bar - shown when boss is not active (above VFX, below overlays) */}
      {(gameState === 'playing' || gameState === 'paused') && !bossActive && (
        <div 
          className="absolute left-0 right-0 bg-game-field/80 backdrop-blur-sm border border-game-border rounded"
          style={{ 
            zIndex: Z_INDEX.HUD,
            top: 'calc(var(--compact-hud-padding-y) * 2 + var(--compact-hud-font-size) * 1.2 + 0.25rem)',
            marginLeft: 'var(--compact-hud-padding-x)',
            marginRight: 'var(--compact-hud-padding-x)',
            padding: 'var(--compact-hud-padding-y) var(--compact-hud-padding-x)',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 'calc(var(--compact-hud-padding-y) * 0.5)' }}>
            <span className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size-small)' }}>
              LEVEL PROGRESS
            </span>
            <span className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size-small)' }}>
              {destroyedThisLevel}/{targetObstacles}
            </span>
          </div>
          <Progress 
            value={levelProgress} 
            className="white-progress-bar" 
            style={{ height: 'var(--compact-progress-height)' }}
          />
        </div>
      )}

      {/* Boss health bar - shown when boss is active (above VFX, below overlays) */}
      {(gameState === 'playing' || gameState === 'paused') && bossActive && (
        <div 
          className="absolute left-0 right-0 bg-game-field/80 backdrop-blur-sm border border-game-border rounded"
          style={{ 
            zIndex: Z_INDEX.HUD,
            top: 'calc(var(--compact-hud-padding-y) * 2 + var(--compact-hud-font-size) * 1.2 + 0.25rem)',
            marginLeft: 'var(--compact-hud-padding-x)',
            marginRight: 'var(--compact-hud-padding-x)',
            padding: 'var(--compact-hud-padding-y) var(--compact-hud-padding-x)',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 'calc(var(--compact-hud-padding-y) * 0.5)' }}>
            <span className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size-small)' }}>
              BOSS
            </span>
            <span className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size-small)' }}>
              {bossHits}/{bossMaxHits}
            </span>
          </div>
          <Progress 
            value={(bossHits / bossMaxHits) * 100} 
            className="white-progress-bar"
            style={{ height: 'var(--compact-progress-height)' }}
          />
        </div>
      )}

      {/* Sensitivity control - bottom center (above VFX, below overlays) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 bg-game-field/80 backdrop-blur-sm border border-game-border rounded flex items-center"
          style={{ 
            zIndex: Z_INDEX.HUD,
            bottom: 'calc(var(--compact-control-inset) + var(--safe-area-inset-bottom))',
            padding: 'var(--compact-hud-padding-y) var(--compact-hud-padding-x)',
            gap: 'calc(var(--compact-hud-gap) * 0.75)',
          }}
        >
          <label htmlFor="sensitivity-slider" className="font-bold text-white whitespace-nowrap" style={{ fontSize: 'var(--compact-hud-font-size-small)' }}>
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
            className="h-1 bg-game-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-game-accent [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-game-accent [&::-moz-range-thumb]:border-0"
            style={{ width: 'calc(var(--compact-control-size) * 1.5)' }}
          />
          <span className="font-bold text-white" style={{ fontSize: 'var(--compact-hud-font-size-small)', minWidth: '2ch' }}>
            {sensitivity.toFixed(1)}
          </span>
        </div>
      )}

      {/* Start screen (above all VFX and HUD) */}
      {gameState === 'idle' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm"
          style={{ zIndex: Z_INDEX.OVERLAY }}
        >
          <div className="text-center" style={{ 
            padding: 'var(--compact-overlay-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--compact-overlay-spacing)',
          }}>
            <h1 className="font-bold text-game-accent drop-shadow-lg" style={{ fontSize: 'calc(var(--compact-overlay-title) * 1.5)' }}>
              JET FIGHTER
            </h1>
            <p className="text-white max-w-xs mx-auto" style={{ fontSize: 'var(--compact-overlay-text)' }}>
              Destroy obstacles, defeat bosses, and survive as long as you can!
            </p>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover h-auto mx-auto"
              style={{ 
                fontSize: 'var(--compact-overlay-text)',
                padding: 'calc(var(--compact-overlay-spacing) * 0.75) calc(var(--compact-overlay-spacing) * 1.5)',
              }}
            >
              START GAME
            </Button>
          </div>
        </div>
      )}

      {/* Pause overlay (above all VFX and HUD) */}
      {gameState === 'paused' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-game-field/70 backdrop-blur-sm"
          style={{ zIndex: Z_INDEX.OVERLAY }}
        >
          <div className="text-center" style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--compact-overlay-spacing)',
          }}>
            <h2 className="font-bold text-game-accent drop-shadow-lg" style={{ fontSize: 'calc(var(--compact-overlay-title) * 1.25)' }}>
              PAUSED
            </h2>
            <Button
              size="lg"
              onClick={onResume}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover h-auto"
              style={{ 
                fontSize: 'var(--compact-overlay-text)',
                padding: 'calc(var(--compact-overlay-spacing) * 0.75) calc(var(--compact-overlay-spacing) * 1.5)',
              }}
            >
              RESUME
            </Button>
          </div>
        </div>
      )}

      {/* Game over screen (above all VFX and HUD) */}
      {gameState === 'gameover' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm"
          style={{ zIndex: Z_INDEX.OVERLAY }}
        >
          <div className="text-center" style={{ 
            padding: 'var(--compact-overlay-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--compact-overlay-spacing)',
          }}>
            {gameOverReason === 'timeExpired' && (
              <h2 className="font-bold text-white drop-shadow-lg animate-pulse" style={{ 
                fontSize: 'calc(var(--compact-overlay-title) * 1.5)',
                marginBottom: 'calc(var(--compact-overlay-spacing) * 0.5)',
              }}>
                TIME UP!
              </h2>
            )}
            <h2 className="font-bold text-destructive drop-shadow-lg" style={{ fontSize: 'calc(var(--compact-overlay-title) * 1.25)' }}>
              GAME OVER
            </h2>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 'calc(var(--compact-overlay-spacing) * 0.5)',
            }}>
              <p className="text-white" style={{ fontSize: 'var(--compact-overlay-text)' }}>
                Final Score: <span className="font-bold text-game-accent">{score}</span>
              </p>
              <p className="text-white" style={{ fontSize: 'calc(var(--compact-overlay-text) * 0.875)' }}>
                Level Reached: <span className="font-bold text-game-accent">{level}</span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover h-auto"
              style={{ 
                fontSize: 'var(--compact-overlay-text)',
                padding: 'calc(var(--compact-overlay-spacing) * 0.75) calc(var(--compact-overlay-spacing) * 1.5)',
              }}
            >
              PLAY AGAIN
            </Button>
          </div>
        </div>
      )}

      {/* Level complete screen (above all VFX and HUD) */}
      {gameState === 'levelcomplete' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-game-field/90 backdrop-blur-sm"
          style={{ zIndex: Z_INDEX.OVERLAY }}
        >
          <div className="text-center" style={{ 
            padding: 'var(--compact-overlay-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--compact-overlay-spacing)',
          }}>
            <h2 className="font-bold text-game-accent drop-shadow-lg animate-pulse" style={{ fontSize: 'calc(var(--compact-overlay-title) * 1.25)' }}>
              LEVEL {level} COMPLETE!
            </h2>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 'calc(var(--compact-overlay-spacing) * 0.5)',
            }}>
              <p className="text-white" style={{ fontSize: 'var(--compact-overlay-text)' }}>
                Score: <span className="font-bold text-game-accent">{score}</span>
              </p>
              <p className="text-white" style={{ fontSize: 'calc(var(--compact-overlay-text) * 0.875)' }}>
                Obstacles Destroyed: <span className="font-bold text-game-accent">{destroyedThisLevel}</span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={onNextLevel}
              className="bg-game-primary hover:bg-game-primary-hover text-primary-foreground shadow-game-button hover:shadow-game-button-hover h-auto"
              style={{ 
                fontSize: 'var(--compact-overlay-text)',
                padding: 'calc(var(--compact-overlay-spacing) * 0.75) calc(var(--compact-overlay-spacing) * 1.5)',
              }}
            >
              NEXT LEVEL
            </Button>
          </div>
        </div>
      )}

      {/* Virtual controls - only shown during playing state */}
      {gameState === 'playing' && (
        <>
          {/* Shoot button - bottom left with safe area support */}
          <div 
            className="absolute safe-bottom safe-left pointer-events-none"
            style={{ zIndex: Z_INDEX.CONTROLS }}
          >
            <div className="pointer-events-auto">
              <ShootButton
                onFireStart={onFireStart}
                onFireEnd={onFireEnd}
                disabled={gameState !== 'playing'}
              />
            </div>
          </div>

          {/* Joystick - bottom right with safe area support */}
          <div 
            className="absolute safe-bottom safe-right pointer-events-none"
            style={{ zIndex: Z_INDEX.CONTROLS }}
          >
            <div className="pointer-events-auto">
              <VirtualJoystick
                onMove={onJoystickMove}
                onNeutral={onJoystickNeutral}
                resetToken={joystickResetToken}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
