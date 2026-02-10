import { useEffect, useRef, useState, useCallback } from 'react';
import Playfield from './Playfield';
import PlayerJet from './entities/PlayerJet';
import Bullet from './entities/Bullet';
import Obstacle from './entities/Obstacle';
import Explosion from './effects/Explosion';
import GameOverlay from './ui/GameOverlay';
import { clampPosition, reflectAtBounds, isOutOfBounds } from './physics/bounds';
import { angleToForwardVector, pixelVelocityToPercent, offsetPosition } from './physics/vectors';
import { resolveObstacleCollision } from './physics/obstacleCollisions';
import { getLevelDuration } from './utils/levelTimer';

type GameState = 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused' | 'levelcomplete';
type ObstacleSize = 'small' | 'medium' | 'large';

interface Position {
  x: number;
  y: number;
}

interface BulletData {
  id: number;
  position: Position;
  velocityPercent: { x: number; y: number }; // Velocity in percent per frame
  angle: number; // Angle in degrees for visual rotation (snapshot at fire time)
}

interface ObstacleData {
  id: number;
  position: Position;
  velocity: { x: number; y: number };
  zigzagTimer: number;
  zigzagInterval: number;
  zigzagAmplitude: number;
  size: ObstacleSize;
  isBoss?: boolean;
}

interface ExplosionData {
  id: number;
  position: Position;
  variant: 'hit' | 'player' | 'bomb';
}

const PLAYFIELD_PADDING = 40; // Space for borders
const JET_SIZE = 40; // Reduced for mobile - half of sprite size for collision
const BULLET_SPEED = 300; // Pixels per second - FAST speed (increased from 100)
const FIRE_COOLDOWN = 200; // Milliseconds between shots - medium cadence
const MOVEMENT_SPEED = 180; // Pixels per second - FAST speed (increased from 50)
const OBSTACLE_SPEED = 120; // Base speed in pixels per second - FAST speed (increased from 35)
const OBSTACLE_SIZE_SMALL = 18; // Small obstacle collision radius
const OBSTACLE_SIZE_MEDIUM = 24; // Medium obstacle collision radius
const OBSTACLE_SIZE_LARGE = 30; // Large obstacle collision radius
const BOSS_SIZE = 50; // Boss obstacle collision radius
const BULLET_SIZE = 6; // Reduced for mobile - half size for collision detection
const EXPLOSION_DURATION = 800; // Milliseconds before transitioning to game over
const OBSTACLE_SPAWN_INTERVAL = 1000; // Spawn one obstacle every 1000ms (1 second)
const MAX_DELTA_TIME = 100; // Clamp delta to avoid huge jumps after tab switches
const HIT_EFFECT_DURATION = 300; // Duration for bullet hit effects
const BULLET_SPAWN_OFFSET = 20; // Pixels ahead of jet nose for bullet spawn (reduced from 80)
const MOVEMENT_THRESHOLD = 0.1; // Joystick magnitude threshold to show thruster
const BOSS_MAX_HITS = 15; // Boss requires 15 hits to defeat
const OBSTACLES_PER_LEVEL = 5; // Base number of obstacles per level (multiplied by level)

// Score values for each obstacle size
const SCORE_SMALL = 5;
const SCORE_MEDIUM = 10;
const SCORE_LARGE = 15;

// Fixed delta time for bullet velocity calculation (60 FPS)
const BULLET_DELTA_TIME = 1 / 60;

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 50, y: 50 });
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [playfieldSize, setPlayfieldSize] = useState({ width: 0, height: 0 });
  const [facingAngle, setFacingAngle] = useState(0); // Angle in degrees, 0 = up
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [destroyedThisLevel, setDestroyedThisLevel] = useState(0);
  const [isThrusting, setIsThrusting] = useState(false); // Track if jet is moving
  const [bossActive, setBossActive] = useState(false);
  const [bossHits, setBossHits] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0); // Countdown timer in seconds
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const lastFireTimeRef = useRef(0);
  const joystickVectorRef = useRef({ x: 0, y: 0, magnitude: 0 });
  const explosionTimerRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const obstacleSpawnAccumulatorRef = useRef<number>(0);
  const effectTimersRef = useRef<Map<number, number>>(new Map());
  const bossIdRef = useRef<number | null>(null);
  const isFiringRef = useRef(false);
  const fireAccumulatorRef = useRef(0);
  
  // Refs to capture firing snapshot
  const playerPosRef = useRef<Position>(playerPos);
  const facingAngleRef = useRef<number>(facingAngle);

  // Update refs whenever position or angle changes
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    facingAngleRef.current = facingAngle;
  }, [facingAngle]);

  // Initialize timer when starting a new level or game
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeRemaining(getLevelDuration(level));
    }
  }, [gameState, level]);

  // Measure playfield size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPlayfieldSize({
          width: rect.width - PLAYFIELD_PADDING * 2,
          height: rect.height - PLAYFIELD_PADDING * 2,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate target obstacles for current level
  const getObstacleTarget = useCallback((currentLevel: number) => {
    return OBSTACLES_PER_LEVEL * currentLevel;
  }, []);

  // Spawn initial obstacles when game starts
  useEffect(() => {
    if (gameState === 'playing' && obstacles.length === 0 && !bossActive) {
      const targetCount = getObstacleTarget(level);
      const initialObstacles: ObstacleData[] = [];
      for (let i = 0; i < targetCount; i++) {
        initialObstacles.push(createRandomObstacle());
      }
      setObstacles(initialObstacles);
    }
  }, [gameState, obstacles.length, bossActive, level, getObstacleTarget]);

  // Helper to get obstacle size radius
  const getObstacleSize = (obstacle: ObstacleData): number => {
    if (obstacle.isBoss) {
      return BOSS_SIZE;
    }
    switch (obstacle.size) {
      case 'small':
        return OBSTACLE_SIZE_SMALL;
      case 'medium':
        return OBSTACLE_SIZE_MEDIUM;
      case 'large':
        return OBSTACLE_SIZE_LARGE;
    }
  };

  // Helper to get score for obstacle size
  const getObstacleScore = (size: ObstacleSize): number => {
    switch (size) {
      case 'small':
        return SCORE_SMALL;
      case 'medium':
        return SCORE_MEDIUM;
      case 'large':
        return SCORE_LARGE;
    }
  };

  // Helper to create a random obstacle
  const createRandomObstacle = (): ObstacleData => {
    const angle = Math.random() * Math.PI * 2;
    // Constrained speed variation for consistent fast speed
    const speed = OBSTACLE_SPEED * (0.85 + Math.random() * 0.3); // 85%-115% of base speed
    
    // Random size distribution
    const sizeRoll = Math.random();
    let size: ObstacleSize;
    if (sizeRoll < 0.5) {
      size = 'small';
    } else if (sizeRoll < 0.85) {
      size = 'medium';
    } else {
      size = 'large';
    }
    
    return {
      id: obstacleIdRef.current++,
      position: {
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      zigzagTimer: 0,
      zigzagInterval: 1200 + Math.random() * 800, // Constrained zig-zag timing
      zigzagAmplitude: 0.35 + Math.random() * 0.25, // Constrained turn amount
      size,
      isBoss: false,
    };
  };

  // Helper to create boss obstacle
  const createBossObstacle = (): ObstacleData => {
    const angle = Math.random() * Math.PI * 2;
    const speed = OBSTACLE_SPEED * 0.7; // Boss moves slower
    
    return {
      id: obstacleIdRef.current++,
      position: {
        x: 50,
        y: 20,
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      zigzagTimer: 0,
      zigzagInterval: 1500,
      zigzagAmplitude: 0.3,
      size: 'large',
      isBoss: true,
    };
  };

  // Helper to check collision between two entities and return collision point
  const checkCollisionWithPoint = (
    pos1: Position,
    size1: number,
    pos2: Position,
    size2: number
  ): { collided: boolean; point: Position } => {
    if (!playfieldSize.width || !playfieldSize.height) {
      return { collided: false, point: pos1 };
    }
    
    // Convert percentage to pixels for accurate collision
    const x1 = (pos1.x / 100) * playfieldSize.width;
    const y1 = (pos1.y / 100) * playfieldSize.height;
    const x2 = (pos2.x / 100) * playfieldSize.width;
    const y2 = (pos2.y / 100) * playfieldSize.height;
    
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const collided = distance < (size1 + size2);
    
    if (collided) {
      // Calculate contact point (weighted by sizes)
      const weight1 = size1 / (size1 + size2);
      const weight2 = size2 / (size1 + size2);
      const contactX = x1 * weight2 + x2 * weight1;
      const contactY = y1 * weight2 + y2 * weight1;
      
      // Convert back to percentage
      const contactPoint: Position = {
        x: (contactX / playfieldSize.width) * 100,
        y: (contactY / playfieldSize.height) * 100,
      };
      
      return { collided: true, point: contactPoint };
    }
    
    return { collided: false, point: pos1 };
  };

  // Helper to check collision between two entities (legacy)
  const checkCollision = (pos1: Position, size1: number, pos2: Position, size2: number): boolean => {
    return checkCollisionWithPoint(pos1, size1, pos2, size2).collided;
  };

  // Helper to trigger bomb explosion and game over (for player→obstacle collisions)
  const triggerBombExplosion = useCallback((position: Position) => {
    const newExplosion: ExplosionData = {
      id: explosionIdRef.current++,
      position,
      variant: 'bomb',
    };
    setExplosions([newExplosion]);
    setGameState('exploding');
    
    // Transition to game over after explosion animation
    explosionTimerRef.current = window.setTimeout(() => {
      setGameState('gameover');
      setExplosions([]);
    }, EXPLOSION_DURATION);
  }, []);

  // Helper to add a hit effect with auto-cleanup
  const addHitEffect = useCallback((position: Position) => {
    const effectId = explosionIdRef.current++;
    const newEffect: ExplosionData = {
      id: effectId,
      position,
      variant: 'hit',
    };
    
    setExplosions((prev) => [...prev, newEffect]);
    
    // Schedule cleanup
    const timerId = window.setTimeout(() => {
      setExplosions((prev) => prev.filter((exp) => exp.id !== effectId));
      effectTimersRef.current.delete(effectId);
    }, HIT_EFFECT_DURATION);
    
    effectTimersRef.current.set(effectId, timerId);
  }, []);

  // Helper to trigger boss defeat
  const defeatBoss = useCallback((position: Position) => {
    // Trigger bomb explosion at boss position
    const newExplosion: ExplosionData = {
      id: explosionIdRef.current++,
      position,
      variant: 'bomb',
    };
    setExplosions((prev) => [...prev, newExplosion]);
    
    // Remove boss obstacle
    if (bossIdRef.current !== null) {
      setObstacles((prev) => prev.filter((obs) => obs.id !== bossIdRef.current));
      bossIdRef.current = null;
    }
    
    // Reset boss state
    setBossActive(false);
    setBossHits(0);
    
    // Transition to level complete after explosion
    setTimeout(() => {
      setGameState('levelcomplete');
    }, EXPLOSION_DURATION);
  }, []);

  // Helper to fire a bullet
  const fireBullet = useCallback(() => {
    if (!playfieldSize.width || !playfieldSize.height) return;

    const currentPos = playerPosRef.current;
    const currentAngle = facingAngleRef.current;

    // Calculate forward vector from facing angle
    const forward = angleToForwardVector(currentAngle);

    // Calculate spawn position ahead of jet nose (reduced offset for closer spawn)
    const spawnPos = offsetPosition(
      currentPos,
      forward,
      BULLET_SPAWN_OFFSET,
      playfieldSize.width,
      playfieldSize.height
    );

    // Calculate bullet velocity in percent per frame
    const bulletVelocityPercent = pixelVelocityToPercent(
      BULLET_SPEED,
      forward,
      playfieldSize.width,
      playfieldSize.height,
      BULLET_DELTA_TIME
    );

    const newBullet: BulletData = {
      id: bulletIdRef.current++,
      position: spawnPos,
      velocityPercent: bulletVelocityPercent,
      angle: currentAngle,
    };

    setBullets((prev) => [...prev, newBullet]);
  }, [playfieldSize]);

  // Continuous firing handlers
  const handleFireStart = useCallback(() => {
    if (gameState !== 'playing') return;
    isFiringRef.current = true;
    fireAccumulatorRef.current = FIRE_COOLDOWN; // Fire immediately on first press
  }, [gameState]);

  const handleFireEnd = useCallback(() => {
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
  }, []);

  // Stop firing when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      isFiringRef.current = false;
      fireAccumulatorRef.current = 0;
    }
  }, [gameState]);

  // Animation loop with delta-time for smooth movement
  useEffect(() => {
    if (gameState !== 'playing') {
      lastFrameTimeRef.current = 0;
      obstacleSpawnAccumulatorRef.current = 0;
      return;
    }

    const animate = (currentTime: number) => {
      // Initialize lastFrameTime on first frame
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time in seconds, clamped to avoid huge jumps
      let deltaTime = Math.min(currentTime - lastFrameTimeRef.current, MAX_DELTA_TIME) / 1000;
      lastFrameTimeRef.current = currentTime;

      // Update countdown timer
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - deltaTime);
        
        // Check for timeout
        if (newTime <= 0 && prev > 0) {
          // Trigger game over due to timeout
          triggerBombExplosion(playerPosRef.current);
        }
        
        return newTime;
      });

      const joystick = joystickVectorRef.current;
      
      // Update thruster state based on joystick magnitude
      setIsThrusting(joystick.magnitude > MOVEMENT_THRESHOLD);
      
      // Update player position based on joystick input
      if (joystick.magnitude > 0.1) {
        setPlayerPos((prev) => {
          const speed = MOVEMENT_SPEED * joystick.magnitude * deltaTime;
          const speedPercent = (speed / playfieldSize.width) * 100;
          const newX = prev.x + joystick.x * speedPercent;
          const newY = prev.y + joystick.y * speedPercent;

          // Check if player would go out of bounds
          if (isOutOfBounds(
            { x: newX, y: newY },
            playfieldSize.width,
            playfieldSize.height,
            JET_SIZE
          )) {
            triggerBombExplosion(prev);
            return prev;
          }

          return clampPosition(
            { x: newX, y: newY },
            playfieldSize.width,
            playfieldSize.height,
            JET_SIZE
          );
        });
        
        // Update facing angle based on joystick direction
        const angle = Math.atan2(joystick.x, -joystick.y) * (180 / Math.PI);
        setFacingAngle(angle);
      }

      // Handle continuous firing
      if (isFiringRef.current) {
        fireAccumulatorRef.current += deltaTime * 1000; // Convert to ms
        if (fireAccumulatorRef.current >= FIRE_COOLDOWN) {
          fireAccumulatorRef.current -= FIRE_COOLDOWN;
          fireBullet();
        }
      }

      // Update bullets with delta-time using stored velocity
      setBullets((prevBullets) => {
        return prevBullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.velocityPercent.x,
              y: bullet.position.y + bullet.velocityPercent.y,
            },
          }))
          .filter((bullet) => 
            bullet.position.x >= -5 && 
            bullet.position.x <= 105 && 
            bullet.position.y >= -5 && 
            bullet.position.y <= 105
          ); // Remove bullets that left the playfield
      });

      // Update obstacles with delta-time and zig-zag movement
      setObstacles((prevObstacles) => {
        const updatedObstacles = prevObstacles.map((obstacle) => {
          let newVelocity = { ...obstacle.velocity };
          let newTimer = obstacle.zigzagTimer + (deltaTime * 1000); // Convert to ms

          // Change direction at intervals (zig-zag)
          if (newTimer >= obstacle.zigzagInterval) {
            newTimer = 0;
            const currentAngle = Math.atan2(newVelocity.y, newVelocity.x);
            const turnAmount = (Math.random() - 0.5) * obstacle.zigzagAmplitude * Math.PI;
            const newAngle = currentAngle + turnAmount;
            const speed = Math.sqrt(newVelocity.x ** 2 + newVelocity.y ** 2);
            
            newVelocity = {
              x: Math.cos(newAngle) * speed,
              y: Math.sin(newAngle) * speed,
            };
          }

          // Update position with delta-time
          const velocityPercent = {
            x: (newVelocity.x * deltaTime / playfieldSize.width) * 100,
            y: (newVelocity.y * deltaTime / playfieldSize.height) * 100,
          };

          let newPosition = {
            x: obstacle.position.x + velocityPercent.x,
            y: obstacle.position.y + velocityPercent.y,
          };

          // Reflect at bounds
          const reflected = reflectAtBounds(
            newPosition,
            newVelocity,
            playfieldSize.width,
            playfieldSize.height,
            getObstacleSize(obstacle)
          );

          return {
            ...obstacle,
            position: reflected.position,
            velocity: reflected.velocity,
            zigzagTimer: newTimer,
          };
        });

        // Handle obstacle-to-obstacle collisions
        const finalObstacles = [...updatedObstacles];
        for (let i = 0; i < finalObstacles.length; i++) {
          for (let j = i + 1; j < finalObstacles.length; j++) {
            const obs1 = finalObstacles[i];
            const obs2 = finalObstacles[j];
            
            const result = resolveObstacleCollision(
              obs1.position,
              obs1.velocity,
              getObstacleSize(obs1),
              obs2.position,
              obs2.velocity,
              getObstacleSize(obs2),
              playfieldSize.width,
              playfieldSize.height
            );
            
            if (result.collided && result.newPosition1 && result.newPosition2 && result.newVelocity1 && result.newVelocity2) {
              finalObstacles[i] = { ...obs1, position: result.newPosition1, velocity: result.newVelocity1 };
              finalObstacles[j] = { ...obs2, position: result.newPosition2, velocity: result.newVelocity2 };
            }
          }
        }

        return finalObstacles;
      });

      // Spawn new obstacles if below target (only when not in boss mode)
      if (!bossActive) {
        const targetCount = getObstacleTarget(level);
        obstacleSpawnAccumulatorRef.current += deltaTime * 1000; // Convert to ms
        
        if (obstacleSpawnAccumulatorRef.current >= OBSTACLE_SPAWN_INTERVAL) {
          obstacleSpawnAccumulatorRef.current = 0;
          
          setObstacles((prev) => {
            if (prev.length < targetCount) {
              return [...prev, createRandomObstacle()];
            }
            return prev;
          });
        }
      }

      // Check bullet-obstacle collisions
      setBullets((prevBullets) => {
        const remainingBullets = [...prevBullets];
        const bulletsToRemove = new Set<number>();

        setObstacles((prevObstacles) => {
          const remainingObstacles = [...prevObstacles];
          const obstaclesToRemove = new Set<number>();

          for (const bullet of remainingBullets) {
            for (let i = 0; i < remainingObstacles.length; i++) {
              const obstacle = remainingObstacles[i];
              const collision = checkCollisionWithPoint(
                bullet.position,
                BULLET_SIZE,
                obstacle.position,
                getObstacleSize(obstacle)
              );

              if (collision.collided) {
                bulletsToRemove.add(bullet.id);
                
                // Add hit effect at collision point
                addHitEffect(collision.point);

                if (obstacle.isBoss) {
                  // Boss hit
                  setBossHits((prev) => {
                    const newHits = prev + 1;
                    if (newHits >= BOSS_MAX_HITS) {
                      // Boss defeated
                      defeatBoss(obstacle.position);
                      obstaclesToRemove.add(obstacle.id);
                    }
                    return newHits;
                  });
                } else {
                  // Regular obstacle destroyed
                  obstaclesToRemove.add(obstacle.id);
                  setScore((prev) => prev + getObstacleScore(obstacle.size));
                  setDestroyedThisLevel((prev) => {
                    const newDestroyed = prev + 1;
                    const targetCount = getObstacleTarget(level);
                    
                    // Check if level complete (all obstacles destroyed)
                    if (newDestroyed >= targetCount) {
                      // Spawn boss
                      setBossActive(true);
                      setBossHits(0);
                      const boss = createBossObstacle();
                      bossIdRef.current = boss.id;
                      setObstacles([boss]);
                    }
                    
                    return newDestroyed;
                  });
                }
                
                break; // Bullet can only hit one obstacle
              }
            }
          }

          return remainingObstacles.filter((obs) => !obstaclesToRemove.has(obs.id));
        });

        return remainingBullets.filter((bullet) => !bulletsToRemove.has(bullet.id));
      });

      // Check player-obstacle collisions
      setObstacles((prevObstacles) => {
        for (const obstacle of prevObstacles) {
          if (checkCollision(playerPos, JET_SIZE, obstacle.position, getObstacleSize(obstacle))) {
            triggerBombExplosion(playerPos);
            break;
          }
        }
        return prevObstacles;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    playerPos,
    playfieldSize,
    fireBullet,
    triggerBombExplosion,
    addHitEffect,
    defeatBoss,
    bossActive,
    level,
    getObstacleTarget,
  ]);

  // Cleanup explosion timer on unmount
  useEffect(() => {
    return () => {
      if (explosionTimerRef.current) {
        clearTimeout(explosionTimerRef.current);
      }
      // Cleanup all effect timers
      effectTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      effectTimersRef.current.clear();
    };
  }, []);

  const handleJoystickMove = useCallback((vector: { x: number; y: number; magnitude: number }) => {
    joystickVectorRef.current = vector;
  }, []);

  const handleJoystickNeutral = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
  }, []);

  const handleStart = () => {
    setGameState('playing');
    setPlayerPos({ x: 50, y: 50 });
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setScore(0);
    setLevel(1);
    setDestroyedThisLevel(0);
    setFacingAngle(0);
    setBossActive(false);
    setBossHits(0);
    bossIdRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    lastFrameTimeRef.current = 0;
    obstacleSpawnAccumulatorRef.current = 0;
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
  };

  const handlePause = () => {
    setGameState('paused');
  };

  const handleResume = () => {
    setGameState('playing');
    lastFrameTimeRef.current = 0; // Reset frame time to avoid huge delta
  };

  const handleNextLevel = () => {
    setLevel((prev) => prev + 1);
    setDestroyedThisLevel(0);
    setPlayerPos({ x: 50, y: 50 });
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setFacingAngle(0);
    setBossActive(false);
    setBossHits(0);
    bossIdRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    lastFrameTimeRef.current = 0;
    obstacleSpawnAccumulatorRef.current = 0;
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
    setGameState('playing');
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Playfield>
        {/* Player jet */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <PlayerJet position={playerPos} rotation={facingAngle} isThrusting={isThrusting} />
        )}

        {/* Bullets */}
        {bullets.map((bullet) => (
          <Bullet key={bullet.id} position={bullet.position} rotation={bullet.angle} />
        ))}

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <Obstacle
            key={obstacle.id}
            position={obstacle.position}
            size={obstacle.size}
          />
        ))}

        {/* Explosions */}
        {explosions.map((explosion) => (
          <Explosion key={explosion.id} position={explosion.position} variant={explosion.variant} />
        ))}
      </Playfield>

      {/* Game UI Overlay */}
      <GameOverlay
        gameState={gameState}
        score={score}
        level={level}
        destroyed={destroyedThisLevel}
        target={getObstacleTarget(level)}
        bossActive={bossActive}
        bossHits={bossHits}
        bossMaxHits={BOSS_MAX_HITS}
        timeRemaining={timeRemaining}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onNextLevel={handleNextLevel}
        onJoystickMove={handleJoystickMove}
        onJoystickNeutral={handleJoystickNeutral}
        onFireStart={handleFireStart}
        onFireEnd={handleFireEnd}
      />
    </div>
  );
}
