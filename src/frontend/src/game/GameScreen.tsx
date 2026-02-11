import { useEffect, useRef, useState, useCallback } from 'react';
import Playfield from './Playfield';
import PlayerJet from './entities/PlayerJet';
import Bullet from './entities/Bullet';
import Obstacle from './entities/Obstacle';
import Explosion from './effects/Explosion';
import SparkBurst from './effects/SparkBurst';
import GameOverlay from './ui/GameOverlay';
import { clampPosition, reflectAtBounds, isOutOfBounds, isAtBorder } from './physics/bounds';
import { angleToForwardVector, pixelVelocityToPercent, offsetPosition } from './physics/vectors';
import { resolveObstacleCollision } from './physics/obstacleCollisions';
import { isFullHit } from './physics/playerObstacleHit';
import { getLevelDuration } from './utils/levelTimer';
import { processJoystickInput } from './utils/joystickMovement';
import { useJoystickSensitivity } from './hooks/useJoystickSensitivity';

type GameState = 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused' | 'levelcomplete';
type ObstacleSize = 'small' | 'medium' | 'large';
type GameOverReason = 'border' | 'obstacle' | 'timeExpired' | null;

interface Position {
  x: number;
  y: number;
}

interface BulletData {
  id: number;
  position: Position;
  velocityPercent: { x: number; y: number }; // Velocity in percent per frame (fixed at fire time)
  angle: number; // Angle in degrees for visual rotation (snapshot at fire time)
}

interface ObstacleData {
  id: number;
  position: Position;
  velocity: { x: number; y: number };
  size: ObstacleSize;
  isBoss?: boolean;
}

interface ExplosionData {
  id: number;
  position: Position;
  variant: 'hit' | 'player' | 'bomb';
}

interface SparkBurstData {
  id: number;
  x: number; // Changed from position to x/y
  y: number;
  variant: 'normal' | 'boss' | 'player';
}

const JET_SIZE = 32; // Reduced for mobile - smaller collision radius
const BULLET_SPEED = 400; // Increased from 300 - bullets travel faster
const FIRE_COOLDOWN = 120; // Reduced from 200ms - faster continuous fire for tighter bullet spacing
const BASE_MOVEMENT_SPEED = 180; // Base pixels per second - will be scaled by joystick
const OBSTACLE_SPEED = 120; // Base speed in pixels per second - FAST speed
const OBSTACLE_SIZE_SMALL = 18; // Small obstacle collision radius
const OBSTACLE_SIZE_MEDIUM = 24; // Medium obstacle collision radius
const OBSTACLE_SIZE_LARGE = 30; // Large obstacle collision radius
const BOSS_SIZE = 50; // Boss obstacle collision radius
const BULLET_SIZE = 4; // Reduced from 6 for smaller bullets
const EXPLOSION_DURATION = 800; // Milliseconds before transitioning to game over
const OBSTACLE_SPAWN_INTERVAL = 1000; // Spawn one obstacle every 1000ms (1 second)
const MAX_DELTA_TIME = 100; // Clamp delta to avoid huge jumps after tab switches
const HIT_EFFECT_DURATION = 300; // Duration for bullet hit effects
const BULLET_SPAWN_OFFSET = 30; // Pixels ahead of jet nose for bullet spawn (tuned for visual muzzle)
const FACING_THRESHOLD = 0.1; // Threshold for updating facing angle
const COLLISION_SOLVER_PASSES = 3; // Number of collision resolution passes per frame
const SPARK_BURST_DURATION = 400; // Duration for normal spark bursts
const SPARK_BURST_BOSS_DURATION = 600; // Duration for boss spark bursts
const BOSS_MAX_HITS = 15; // Number of hits required to destroy boss (updated from 3 to 15)

// Score values for each obstacle size
const SCORE_SMALL = 5;
const SCORE_MEDIUM = 10;
const SCORE_LARGE = 15;

// Fixed delta time for bullet velocity calculation (60 FPS)
const BULLET_DELTA_TIME = 1 / 60;

// Boss spawn thresholds per level
function getBossSpawnThreshold(level: number): number {
  if (level === 1) return 5;
  if (level === 2) return 10;
  // For levels 3+, continue scaling: 15, 20, 25, etc.
  return 5 + (level - 1) * 5;
}

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 50, y: 50 });
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [sparkBursts, setSparkBursts] = useState<SparkBurstData[]>([]);
  const [playfieldSize, setPlayfieldSize] = useState({ width: 0, height: 0 });
  const [facingAngle, setFacingAngle] = useState(0); // Angle in degrees, 0 = up
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [destroyedThisLevel, setDestroyedThisLevel] = useState(0);
  const [isThrusting, setIsThrusting] = useState(false); // Track if jet is moving
  const [bossActive, setBossActive] = useState(false);
  const [bossHits, setBossHits] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0); // Countdown timer in seconds
  const [joystickResetToken, setJoystickResetToken] = useState(0); // Token to trigger joystick reset
  const { sensitivity, setSensitivity } = useJoystickSensitivity();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const sparkBurstIdRef = useRef(0);
  const lastFireTimeRef = useRef(0);
  const joystickVectorRef = useRef({ x: 0, y: 0, magnitude: 0 });
  const explosionTimerRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const obstacleSpawnAccumulatorRef = useRef<number>(0);
  const effectTimersRef = useRef<Map<number, number>>(new Map());
  const sparkBurstTimersRef = useRef<Map<number, number>>(new Map());
  const bossIdRef = useRef<number | null>(null);
  const isFiringRef = useRef(false);
  const fireAccumulatorRef = useRef(0);
  const bossSpawnedThisAttemptRef = useRef(false); // Track if boss has been spawned for current level attempt
  const levelAttemptTokenRef = useRef(0); // Token to track unique level attempts
  
  // Refs to capture firing snapshot
  const playerPosRef = useRef<Position>(playerPos);
  const facingAngleRef = useRef<number>(facingAngle);
  const gameStateRef = useRef<GameState>(gameState);
  
  // Refs for game loop to access current values (avoid stale closures)
  const bossActiveRef = useRef<boolean>(bossActive);
  const levelRef = useRef<number>(level);
  const destroyedThisLevelRef = useRef<number>(destroyedThisLevel);
  const playfieldSizeRef = useRef({ width: 0, height: 0 });

  // Update refs whenever position, angle, or gameState changes
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    facingAngleRef.current = facingAngle;
  }, [facingAngle]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Update game loop refs
  useEffect(() => {
    bossActiveRef.current = bossActive;
  }, [bossActive]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    destroyedThisLevelRef.current = destroyedThisLevel;
  }, [destroyedThisLevel]);

  useEffect(() => {
    playfieldSizeRef.current = playfieldSize;
  }, [playfieldSize]);

  // Initialize timer when starting a new level or game
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeRemaining(getLevelDuration(level));
    }
  }, [gameState, level]);

  // Measure playfield size - now uses full container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPlayfieldSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset joystick and firing when leaving playing state
  useEffect(() => {
    if (gameState !== 'playing') {
      // Reset joystick vector
      joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
      setIsThrusting(false);
      // Increment reset token to trigger joystick component reset
      setJoystickResetToken(prev => prev + 1);
      // Stop firing
      isFiringRef.current = false;
      fireAccumulatorRef.current = 0;
    }
  }, [gameState]);

  // Cleanup spark burst timers on unmount or state transitions
  useEffect(() => {
    return () => {
      sparkBurstTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      sparkBurstTimersRef.current.clear();
    };
  }, []);

  // Helper to spawn a spark burst
  const spawnSparkBurst = useCallback((position: Position, variant: 'normal' | 'boss' | 'player') => {
    const burstId = sparkBurstIdRef.current++;
    const duration = variant === 'boss' ? SPARK_BURST_BOSS_DURATION : SPARK_BURST_DURATION;
    
    setSparkBursts((prev) => [
      ...prev,
      { id: burstId, x: position.x, y: position.y, variant },
    ]);
    
    // Schedule removal
    const timerId = window.setTimeout(() => {
      setSparkBursts((prev) => prev.filter((burst) => burst.id !== burstId));
      sparkBurstTimersRef.current.delete(burstId);
    }, duration);
    
    sparkBurstTimersRef.current.set(burstId, timerId);
  }, []);

  // Centralized game over handler with reason tracking
  const triggerGameOver = useCallback((reason: GameOverReason = 'obstacle') => {
    if (gameStateRef.current === 'exploding' || gameStateRef.current === 'gameover') {
      return; // Already in game over flow
    }
    
    setGameState('exploding');
    setGameOverReason(reason);
    const explosionId = explosionIdRef.current++;
    
    // Determine explosion variant based on reason
    const explosionVariant = reason === 'obstacle' ? 'bomb' : 'player';
    
    setExplosions((prev) => [
      ...prev,
      { id: explosionId, position: playerPosRef.current, variant: explosionVariant },
    ]);
    
    // Spawn spark burst at player position
    spawnSparkBurst(playerPosRef.current, 'player');
    
    // Clear any existing explosion timer
    if (explosionTimerRef.current !== null) {
      window.clearTimeout(explosionTimerRef.current);
    }
    
    // Schedule transition to gameover
    explosionTimerRef.current = window.setTimeout(() => {
      setGameState('gameover');
      explosionTimerRef.current = null;
    }, EXPLOSION_DURATION);
    
    // Stop all inputs
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setIsThrusting(false);
  }, [spawnSparkBurst]);

  // Handle joystick movement
  const handleJoystickMove = useCallback((vector: { x: number; y: number; magnitude: number }) => {
    // Only allow movement during 'playing' state
    if (gameStateRef.current !== 'playing') {
      return;
    }
    
    joystickVectorRef.current = vector;
    
    // Update facing angle based on joystick direction (only when moving)
    if (vector.magnitude > FACING_THRESHOLD) {
      const angleRad = Math.atan2(vector.x, -vector.y);
      const angleDeg = (angleRad * 180) / Math.PI;
      setFacingAngle(angleDeg);
    }
    
    // Show thruster when joystick is active (will be refined by processJoystickInput)
    setIsThrusting(vector.magnitude > 0.05);
  }, []);

  const handleJoystickNeutral = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setIsThrusting(false);
  }, []);

  // Fire start/end handlers - only allow firing during 'playing'
  const handleFireStart = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      isFiringRef.current = true;
    }
  }, []);

  const handleFireEnd = useCallback(() => {
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
  }, []);

  // Spawn a bullet from the jet nose
  const spawnBullet = useCallback(() => {
    if (playfieldSize.width === 0 || playfieldSize.height === 0) return;
    if (gameStateRef.current !== 'playing') return; // Only spawn during playing

    // Capture current player position and facing angle at fire time
    const currentPlayerPos = playerPosRef.current;
    const currentFacingAngle = facingAngleRef.current;

    // Calculate forward direction vector from facing angle
    const forwardVector = angleToForwardVector(currentFacingAngle);

    // Calculate bullet spawn position offset from jet nose
    const bulletSpawnPos = offsetPosition(
      currentPlayerPos,
      forwardVector,
      BULLET_SPAWN_OFFSET,
      playfieldSize.width,
      playfieldSize.height
    );

    // Calculate bullet velocity in percent per frame (fixed at fire time)
    const bulletVelocityPercent = pixelVelocityToPercent(
      BULLET_SPEED,
      forwardVector,
      playfieldSize.width,
      playfieldSize.height,
      BULLET_DELTA_TIME
    );

    const newBullet: BulletData = {
      id: bulletIdRef.current++,
      position: bulletSpawnPos,
      velocityPercent: bulletVelocityPercent, // Fixed velocity at fire time
      angle: currentFacingAngle, // Snapshot angle for visual rotation
    };

    setBullets((prev) => [...prev, newBullet]);
  }, [playfieldSize]);

  // Spawn an obstacle with straight-line motion
  const spawnObstacle = useCallback(() => {
    const currentPlayfieldSize = playfieldSizeRef.current;
    const currentLevel = levelRef.current;
    
    if (currentPlayfieldSize.width === 0 || currentPlayfieldSize.height === 0) return;

    // Random size distribution
    const rand = Math.random();
    let size: ObstacleSize;
    if (rand < 0.5) size = 'small';
    else if (rand < 0.8) size = 'medium';
    else size = 'large';

    // Random spawn position at top edge
    const spawnX = Math.random() * 100;
    const spawnY = -5; // Just above the visible area

    // Level scaling for speed
    const levelMultiplier = 1 + (currentLevel - 1) * 0.15;
    const speed = OBSTACLE_SPEED * levelMultiplier;

    // Random initial velocity direction (downward with some horizontal component)
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180); // -30 to +30 degrees from vertical
    const vx = Math.sin(angle) * speed;
    const vy = Math.cos(angle) * speed;

    const newObstacle: ObstacleData = {
      id: obstacleIdRef.current++,
      position: { x: spawnX, y: spawnY },
      velocity: { x: vx, y: vy },
      size,
    };

    setObstacles((prev) => [...prev, newObstacle]);
  }, []);

  // Spawn boss obstacle with straight-line motion
  const spawnBoss = useCallback(() => {
    const currentPlayfieldSize = playfieldSizeRef.current;
    const currentLevel = levelRef.current;
    const currentBossActive = bossActiveRef.current;
    
    if (currentPlayfieldSize.width === 0 || currentPlayfieldSize.height === 0) return;
    if (currentBossActive) return; // Don't spawn if boss already active
    if (bossSpawnedThisAttemptRef.current) return; // Don't spawn if boss already spawned this attempt

    // Runtime safeguard: check if a boss obstacle already exists in the obstacles array
    setObstacles((currentObstacles) => {
      const existingBoss = currentObstacles.find(obs => obs.isBoss);
      if (existingBoss) {
        return currentObstacles; // Boss already exists, don't spawn
      }

      const spawnX = 50; // Center horizontally
      const spawnY = -10; // Just above the visible area

      const levelMultiplier = 1 + (currentLevel - 1) * 0.15;
      const speed = OBSTACLE_SPEED * 0.6 * levelMultiplier; // Boss moves slower

      // Boss starts moving downward with slight horizontal component
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180); // -20 to +20 degrees from vertical
      const vx = Math.sin(angle) * speed;
      const vy = Math.cos(angle) * speed;

      const bossObstacle: ObstacleData = {
        id: obstacleIdRef.current++,
        position: { x: spawnX, y: spawnY },
        velocity: { x: vx, y: vy },
        size: 'large',
        isBoss: true,
      };

      bossIdRef.current = bossObstacle.id;
      bossSpawnedThisAttemptRef.current = true; // Mark boss as spawned for this attempt
      setBossActive(true);
      setBossHits(0);
      
      return [...currentObstacles, bossObstacle];
    });
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setGameOverReason(null);
    setPlayerPos({ x: 50, y: 50 });
    setFacingAngle(0);
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setSparkBursts([]);
    setScore(0);
    setLevel(1);
    setDestroyedThisLevel(0);
    setBossActive(false);
    setBossHits(0);
    bossIdRef.current = null;
    bossSpawnedThisAttemptRef.current = false; // Reset boss spawn flag
    levelAttemptTokenRef.current++; // New attempt token
    setIsThrusting(false);
    obstacleSpawnAccumulatorRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
    // Clear any pending timers
    if (explosionTimerRef.current !== null) {
      window.clearTimeout(explosionTimerRef.current);
      explosionTimerRef.current = null;
    }
    sparkBurstTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    sparkBurstTimersRef.current.clear();
    // Reset joystick
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setJoystickResetToken(prev => prev + 1);
  }, []);

  // Pause game
  const pauseGame = useCallback(() => {
    setGameState('paused');
  }, []);

  // Resume game
  const resumeGame = useCallback(() => {
    setGameState('playing');
    lastFrameTimeRef.current = performance.now();
  }, []);

  // Next level
  const nextLevel = useCallback(() => {
    setLevel((prev) => prev + 1);
    setGameState('playing');
    setGameOverReason(null);
    setPlayerPos({ x: 50, y: 50 });
    setFacingAngle(0);
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setSparkBursts([]);
    setDestroyedThisLevel(0);
    setBossActive(false);
    setBossHits(0);
    bossIdRef.current = null;
    bossSpawnedThisAttemptRef.current = false; // Reset boss spawn flag for new level
    levelAttemptTokenRef.current++; // New attempt token
    setIsThrusting(false);
    obstacleSpawnAccumulatorRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
    // Clear any pending timers
    if (explosionTimerRef.current !== null) {
      window.clearTimeout(explosionTimerRef.current);
      explosionTimerRef.current = null;
    }
    sparkBurstTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    sparkBurstTimersRef.current.clear();
    // Reset joystick
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setJoystickResetToken(prev => prev + 1);
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTime = lastFrameTimeRef.current;

    const gameLoop = (currentTime: number) => {
      const rawDeltaTime = currentTime - lastTime;
      const deltaTime = Math.min(rawDeltaTime, MAX_DELTA_TIME);
      lastTime = currentTime;

      const deltaSeconds = deltaTime / 1000;

      // Update countdown timer
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - deltaSeconds);
        if (newTime === 0 && prev > 0) {
          // Time expired - trigger game over
          triggerGameOver('timeExpired');
        }
        return newTime;
      });

      // Handle continuous firing
      if (isFiringRef.current) {
        fireAccumulatorRef.current += deltaTime;
        while (fireAccumulatorRef.current >= FIRE_COOLDOWN) {
          spawnBullet();
          fireAccumulatorRef.current -= FIRE_COOLDOWN;
        }
      }

      // Spawn obstacles at regular intervals - ONLY if boss is NOT active
      if (!bossActiveRef.current) {
        obstacleSpawnAccumulatorRef.current += deltaTime;
        while (obstacleSpawnAccumulatorRef.current >= OBSTACLE_SPAWN_INTERVAL) {
          spawnObstacle();
          obstacleSpawnAccumulatorRef.current -= OBSTACLE_SPAWN_INTERVAL;
        }
      }

      // Check if we should spawn the boss based on destroyed count
      const currentDestroyedCount = destroyedThisLevelRef.current;
      const currentLevel = levelRef.current;
      const bossThreshold = getBossSpawnThreshold(currentLevel);
      
      if (currentDestroyedCount >= bossThreshold && !bossActiveRef.current && !bossSpawnedThisAttemptRef.current) {
        spawnBoss();
      }

      // Update player position based on joystick input
      const joystickVector = joystickVectorRef.current;
      if (joystickVector.magnitude > 0) {
        const { direction, speedFactor } = processJoystickInput(joystickVector);
        const speed = BASE_MOVEMENT_SPEED * speedFactor * sensitivity;
        const velocityX = direction.x * speed;
        const velocityY = direction.y * speed;

        setPlayerPos((prev) => {
          const deltaX = (velocityX * deltaSeconds / playfieldSizeRef.current.width) * 100;
          const deltaY = (velocityY * deltaSeconds / playfieldSizeRef.current.height) * 100;
          const newPos = {
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          };
          return clampPosition(newPos, playfieldSizeRef.current.width, playfieldSizeRef.current.height, JET_SIZE);
        });
      }

      // Update bullets
      setBullets((prevBullets) => {
        return prevBullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.velocityPercent.x,
              y: bullet.position.y + bullet.velocityPercent.y,
            },
          }))
          .filter((bullet) => !isOutOfBounds(bullet.position, playfieldSizeRef.current.width, playfieldSizeRef.current.height, BULLET_SIZE));
      });

      // Update obstacles
      setObstacles((prevObstacles) => {
        let updatedObstacles = prevObstacles.map((obstacle) => {
          const deltaX = (obstacle.velocity.x * deltaSeconds / playfieldSizeRef.current.width) * 100;
          const deltaY = (obstacle.velocity.y * deltaSeconds / playfieldSizeRef.current.height) * 100;

          let newPos = {
            x: obstacle.position.x + deltaX,
            y: obstacle.position.y + deltaY,
          };
          let newVel = { ...obstacle.velocity };

          // Get obstacle size for bounds checking
          const obstacleSize = obstacle.isBoss ? BOSS_SIZE :
                              obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
                              obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

          // Check if at border
          if (isAtBorder(newPos, playfieldSizeRef.current.width, playfieldSizeRef.current.height, obstacleSize)) {
            const result = reflectAtBounds(newPos, newVel, playfieldSizeRef.current.width, playfieldSizeRef.current.height, obstacleSize);
            newPos = result.position;
            newVel = result.velocity;
          }

          return {
            ...obstacle,
            position: newPos,
            velocity: newVel,
          };
        });

        // Collision resolution between obstacles (multiple passes)
        for (let pass = 0; pass < COLLISION_SOLVER_PASSES; pass++) {
          for (let i = 0; i < updatedObstacles.length; i++) {
            for (let j = i + 1; j < updatedObstacles.length; j++) {
              const obsA = updatedObstacles[i];
              const obsB = updatedObstacles[j];

              const sizeA = obsA.isBoss ? BOSS_SIZE : 
                           obsA.size === 'small' ? OBSTACLE_SIZE_SMALL :
                           obsA.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;
              const sizeB = obsB.isBoss ? BOSS_SIZE :
                           obsB.size === 'small' ? OBSTACLE_SIZE_SMALL :
                           obsB.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

              const result = resolveObstacleCollision(
                obsA.position,
                obsA.velocity,
                sizeA,
                obsB.position,
                obsB.velocity,
                sizeB,
                playfieldSizeRef.current.width,
                playfieldSizeRef.current.height
              );

              if (result.collided && result.newPosition1 && result.newVelocity1 && result.newPosition2 && result.newVelocity2) {
                updatedObstacles[i] = {
                  ...obsA,
                  position: result.newPosition1,
                  velocity: result.newVelocity1,
                };
                updatedObstacles[j] = {
                  ...obsB,
                  position: result.newPosition2,
                  velocity: result.newVelocity2,
                };
              }
            }
          }
        }

        // Remove obstacles that are out of bounds (only non-boss obstacles)
        return updatedObstacles.filter((obstacle) => {
          if (obstacle.isBoss) return true; // Keep boss even if out of bounds
          const obstacleSize = obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
                              obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;
          return !isOutOfBounds(obstacle.position, playfieldSizeRef.current.width, playfieldSizeRef.current.height, obstacleSize);
        });
      });

      // Check bullet-obstacle collisions
      setBullets((prevBullets) => {
        const bulletsToRemove = new Set<number>();

        setObstacles((prevObstacles) => {
          const obstaclesToRemove = new Set<number>();
          const newExplosions: ExplosionData[] = [];
          const newSparkBursts: SparkBurstData[] = [];

          prevBullets.forEach((bullet) => {
            prevObstacles.forEach((obstacle) => {
              if (bulletsToRemove.has(bullet.id) || obstaclesToRemove.has(obstacle.id)) return;

              const obstacleSize = obstacle.isBoss ? BOSS_SIZE :
                                  obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
                                  obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

              const dx = (bullet.position.x - obstacle.position.x) * playfieldSizeRef.current.width / 100;
              const dy = (bullet.position.y - obstacle.position.y) * playfieldSizeRef.current.height / 100;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < obstacleSize + BULLET_SIZE) {
                bulletsToRemove.add(bullet.id);

                if (obstacle.isBoss) {
                  // Boss hit - increment hit counter
                  setBossHits((prev) => {
                    const newHits = prev + 1;
                    if (newHits >= BOSS_MAX_HITS) {
                      // Boss defeated - mark for removal
                      obstaclesToRemove.add(obstacle.id);
                      
                      // Spawn boss explosion
                      const explosionId = explosionIdRef.current++;
                      newExplosions.push({
                        id: explosionId,
                        position: obstacle.position,
                        variant: 'bomb',
                      });

                      // Spawn boss spark burst
                      const burstId = sparkBurstIdRef.current++;
                      newSparkBursts.push({
                        id: burstId,
                        x: obstacle.position.x,
                        y: obstacle.position.y,
                        variant: 'boss',
                      });

                      // Award score for boss
                      setScore((prev) => prev + 100);

                      // Clear boss state
                      setBossActive(false);
                      bossIdRef.current = null;

                      // Transition to level complete
                      setGameState('levelcomplete');
                    }
                    return newHits;
                  });

                  // Spawn hit effect for boss
                  const hitExplosionId = explosionIdRef.current++;
                  newExplosions.push({
                    id: hitExplosionId,
                    position: bullet.position,
                    variant: 'hit',
                  });
                } else {
                  // Regular obstacle hit
                  obstaclesToRemove.add(obstacle.id);

                  // Spawn explosion
                  const explosionId = explosionIdRef.current++;
                  newExplosions.push({
                    id: explosionId,
                    position: obstacle.position,
                    variant: 'player',
                  });

                  // Spawn spark burst
                  const burstId = sparkBurstIdRef.current++;
                  newSparkBursts.push({
                    id: burstId,
                    x: obstacle.position.x,
                    y: obstacle.position.y,
                    variant: 'normal',
                  });

                  // Award score based on obstacle size
                  const scoreValue = obstacle.size === 'small' ? SCORE_SMALL :
                                    obstacle.size === 'medium' ? SCORE_MEDIUM : SCORE_LARGE;
                  setScore((prev) => prev + scoreValue);

                  // Increment destroyed count (only for non-boss obstacles)
                  setDestroyedThisLevel((prev) => prev + 1);
                }
              }
            });
          });

          // Add new explosions
          if (newExplosions.length > 0) {
            setExplosions((prev) => [...prev, ...newExplosions]);
            newExplosions.forEach((explosion) => {
              const timerId = window.setTimeout(() => {
                setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
                effectTimersRef.current.delete(explosion.id);
              }, HIT_EFFECT_DURATION);
              effectTimersRef.current.set(explosion.id, timerId);
            });
          }

          // Add new spark bursts
          if (newSparkBursts.length > 0) {
            setSparkBursts((prev) => [...prev, ...newSparkBursts]);
            newSparkBursts.forEach((burst) => {
              const duration = burst.variant === 'boss' ? SPARK_BURST_BOSS_DURATION : SPARK_BURST_DURATION;
              const timerId = window.setTimeout(() => {
                setSparkBursts((prev) => prev.filter((b) => b.id !== burst.id));
                sparkBurstTimersRef.current.delete(burst.id);
              }, duration);
              sparkBurstTimersRef.current.set(burst.id, timerId);
            });
          }

          return prevObstacles.filter((obstacle) => !obstaclesToRemove.has(obstacle.id));
        });

        return prevBullets.filter((bullet) => !bulletsToRemove.has(bullet.id));
      });

      // Check player-obstacle collisions
      setObstacles((prevObstacles) => {
        for (const obstacle of prevObstacles) {
          const obstacleSize = obstacle.isBoss ? BOSS_SIZE :
                              obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
                              obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

          if (isFullHit(playerPosRef.current, JET_SIZE, obstacle.position, obstacleSize, playfieldSizeRef.current.width, playfieldSizeRef.current.height)) {
            triggerGameOver('obstacle');
            break;
          }
        }
        return prevObstacles;
      });

      // Check player-border collision
      if (isAtBorder(playerPosRef.current, playfieldSizeRef.current.width, playfieldSizeRef.current.height, JET_SIZE)) {
        triggerGameOver('border');
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameState, spawnBullet, spawnObstacle, spawnBoss, triggerGameOver, sensitivity]);

  // Calculate target obstacles for current level (for display purposes)
  const targetObstacles = getBossSpawnThreshold(level);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Playfield>
        {/* Player jet */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <PlayerJet
            position={playerPos}
            rotation={facingAngle}
            isThrusting={isThrusting}
          />
        )}

        {/* Bullets */}
        {bullets.map((bullet) => (
          <Bullet
            key={bullet.id}
            position={bullet.position}
            rotation={bullet.angle}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <Obstacle
            key={obstacle.id}
            position={obstacle.position}
            size={obstacle.size}
            isBoss={obstacle.isBoss}
          />
        ))}

        {/* Explosions */}
        {explosions.map((explosion) => (
          <Explosion
            key={explosion.id}
            position={explosion.position}
            variant={explosion.variant}
          />
        ))}

        {/* Spark bursts */}
        {sparkBursts.map((burst) => (
          <SparkBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            variant={burst.variant}
          />
        ))}
      </Playfield>

      {/* Game overlay with HUD and controls */}
      <GameOverlay
        gameState={gameState}
        gameOverReason={gameOverReason}
        score={score}
        level={level}
        timeRemaining={timeRemaining}
        bossActive={bossActive}
        bossHits={bossHits}
        bossMaxHits={BOSS_MAX_HITS}
        destroyedThisLevel={destroyedThisLevel}
        targetObstacles={targetObstacles}
        onStart={startGame}
        onPause={pauseGame}
        onResume={resumeGame}
        onNextLevel={nextLevel}
        onJoystickMove={handleJoystickMove}
        onJoystickNeutral={handleJoystickNeutral}
        onFireStart={handleFireStart}
        onFireEnd={handleFireEnd}
        joystickResetToken={joystickResetToken}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />
    </div>
  );
}
