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
  position: Position;
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
const OBSTACLES_PER_LEVEL = 5; // Base number of obstacles per level (multiplied by level)
const COLLISION_SOLVER_PASSES = 3; // Number of collision resolution passes per frame
const SPARK_BURST_DURATION = 400; // Duration for normal spark bursts
const SPARK_BURST_BOSS_DURATION = 600; // Duration for boss spark bursts
const BOSS_MAX_HITS = 3; // Number of hits required to destroy boss

// Score values for each obstacle size
const SCORE_SMALL = 5;
const SCORE_MEDIUM = 10;
const SCORE_LARGE = 15;

// Fixed delta time for bullet velocity calculation (60 FPS)
const BULLET_DELTA_TIME = 1 / 60;

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
      { id: burstId, position, variant },
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
    setObstacles((prev) => [...prev, bossObstacle]);
    setBossActive(true);
    setBossHits(0);
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
    // Score carries over to next level
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastFrameTimeRef.current, MAX_DELTA_TIME);
      lastFrameTimeRef.current = currentTime;
      const deltaSeconds = deltaTime / 1000;

      // Update countdown timer
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - deltaSeconds);
        if (newTime === 0 && gameStateRef.current === 'playing') {
          // Time's up - game over with time-expired reason
          triggerGameOver('timeExpired');
        }
        return newTime;
      });

      // Handle continuous firing - only during 'playing'
      if (isFiringRef.current && gameStateRef.current === 'playing') {
        fireAccumulatorRef.current += deltaTime;
        while (fireAccumulatorRef.current >= FIRE_COOLDOWN) {
          const now = performance.now();
          if (now - lastFireTimeRef.current >= FIRE_COOLDOWN) {
            spawnBullet();
            lastFireTimeRef.current = now;
          }
          fireAccumulatorRef.current -= FIRE_COOLDOWN;
        }
      }

      // Update player position based on joystick with sensitivity curve
      const rawJoystick = joystickVectorRef.current;
      const movement = processJoystickInput(rawJoystick);
      
      if (movement.speedFactor > 0 && playfieldSizeRef.current.width > 0) {
        // Apply curved speed factor and user sensitivity to base movement speed
        const effectiveSpeed = BASE_MOVEMENT_SPEED * movement.speedFactor * sensitivity;
        const moveDistance = effectiveSpeed * deltaSeconds;
        const dx = (movement.direction.x * moveDistance) / playfieldSizeRef.current.width;
        const dy = (movement.direction.y * moveDistance) / playfieldSizeRef.current.height;

        setPlayerPos((prev) => {
          const newPos = {
            x: prev.x + dx * 100,
            y: prev.y + dy * 100,
          };
          
          // Check if player would reach border before clamping
          if (isAtBorder(newPos, playfieldSizeRef.current.width, playfieldSizeRef.current.height, JET_SIZE)) {
            // Trigger player death with border reason and spawn spark burst
            triggerGameOver('border');
            return prev; // Keep old position
          }
          
          // Clamp position to playfield bounds
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

      // Update obstacles with straight-line motion and border reflection
      setObstacles((prevObstacles) => {
        return prevObstacles
          .map((obstacle) => {
            const currentPlayfieldSize = playfieldSizeRef.current;
            if (currentPlayfieldSize.width === 0 || currentPlayfieldSize.height === 0) {
              return obstacle;
            }

            // Calculate new position
            const dx = (obstacle.velocity.x * deltaSeconds) / currentPlayfieldSize.width;
            const dy = (obstacle.velocity.y * deltaSeconds) / currentPlayfieldSize.height;
            let newPos = {
              x: obstacle.position.x + dx * 100,
              y: obstacle.position.y + dy * 100,
            };

            // Get collision radius based on size
            let collisionRadius: number;
            if (obstacle.isBoss) {
              collisionRadius = BOSS_SIZE;
            } else if (obstacle.size === 'small') {
              collisionRadius = OBSTACLE_SIZE_SMALL;
            } else if (obstacle.size === 'medium') {
              collisionRadius = OBSTACLE_SIZE_MEDIUM;
            } else {
              collisionRadius = OBSTACLE_SIZE_LARGE;
            }

            // Reflect velocity at bounds
            const reflectionResult = reflectAtBounds(
              newPos,
              obstacle.velocity,
              currentPlayfieldSize.width,
              currentPlayfieldSize.height,
              collisionRadius
            );

            return {
              ...obstacle,
              position: reflectionResult.position,
              velocity: reflectionResult.velocity,
            };
          })
          .filter((obstacle) => {
            // Remove obstacles that are far out of bounds (safety cleanup)
            return !isOutOfBounds(obstacle.position, playfieldSizeRef.current.width, playfieldSizeRef.current.height, 20);
          });
      });

      // Resolve obstacle-to-obstacle collisions
      setObstacles((prevObstacles) => {
        let workingObstacles = [...prevObstacles];
        const currentPlayfieldSize = playfieldSizeRef.current;

        if (currentPlayfieldSize.width === 0 || currentPlayfieldSize.height === 0) {
          return workingObstacles;
        }

        // Multiple passes for better stability
        for (let pass = 0; pass < COLLISION_SOLVER_PASSES; pass++) {
          for (let i = 0; i < workingObstacles.length; i++) {
            for (let j = i + 1; j < workingObstacles.length; j++) {
              const obsA = workingObstacles[i];
              const obsB = workingObstacles[j];

              if (!obsA || !obsB) continue;

              const radiusA = obsA.isBoss ? BOSS_SIZE : 
                obsA.size === 'small' ? OBSTACLE_SIZE_SMALL :
                obsA.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;
              const radiusB = obsB.isBoss ? BOSS_SIZE :
                obsB.size === 'small' ? OBSTACLE_SIZE_SMALL :
                obsB.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

              const result = resolveObstacleCollision(
                obsA.position,
                obsA.velocity,
                radiusA,
                obsB.position,
                obsB.velocity,
                radiusB,
                currentPlayfieldSize.width,
                currentPlayfieldSize.height
              );

              if (result.collided && result.newPosition1 && result.newVelocity1 && result.newPosition2 && result.newVelocity2) {
                workingObstacles[i] = { ...obsA, position: result.newPosition1, velocity: result.newVelocity1 };
                workingObstacles[j] = { ...obsB, position: result.newPosition2, velocity: result.newVelocity2 };
              }
            }
          }
        }

        return workingObstacles;
      });

      // Check bullet-obstacle collisions
      setBullets((prevBullets) => {
        const bulletsToKeep: BulletData[] = [];
        const hitObstacleIds = new Set<number>();

        prevBullets.forEach((bullet) => {
          let bulletHit = false;

          obstacles.forEach((obstacle) => {
            if (hitObstacleIds.has(obstacle.id)) return;

            const obstacleRadius = obstacle.isBoss ? BOSS_SIZE :
              obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
              obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

            const dx = (bullet.position.x - obstacle.position.x) * playfieldSizeRef.current.width / 100;
            const dy = (bullet.position.y - obstacle.position.y) * playfieldSizeRef.current.height / 100;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < obstacleRadius + BULLET_SIZE) {
              bulletHit = true;
              hitObstacleIds.add(obstacle.id);

              // Spawn spark burst at obstacle position
              spawnSparkBurst(obstacle.position, obstacle.isBoss ? 'boss' : 'normal');

              // Handle boss hits
              if (obstacle.isBoss) {
                const newHits = bossHits + 1;
                setBossHits(newHits);

                if (newHits >= BOSS_MAX_HITS) {
                  // Boss destroyed - spawn boss-death spark burst
                  spawnSparkBurst(obstacle.position, 'boss');
                  
                  // Remove boss
                  setObstacles((prev) => prev.filter((o) => o.id !== obstacle.id));
                  setBossActive(false);
                  bossIdRef.current = null;
                  
                  // Award points
                  setScore((prev) => prev + 50);
                  setDestroyedThisLevel((prev) => prev + 1);
                }
              } else {
                // Regular obstacle destroyed
                setObstacles((prev) => prev.filter((o) => o.id !== obstacle.id));
                
                // Award points based on size
                const points = obstacle.size === 'small' ? SCORE_SMALL :
                  obstacle.size === 'medium' ? SCORE_MEDIUM : SCORE_LARGE;
                setScore((prev) => prev + points);
                setDestroyedThisLevel((prev) => prev + 1);
              }

              // Spawn hit explosion
              const explosionId = explosionIdRef.current++;
              setExplosions((prev) => [
                ...prev,
                { id: explosionId, position: obstacle.position, variant: 'hit' },
              ]);

              // Schedule explosion removal
              const timerId = window.setTimeout(() => {
                setExplosions((prev) => prev.filter((exp) => exp.id !== explosionId));
                effectTimersRef.current.delete(explosionId);
              }, HIT_EFFECT_DURATION);
              effectTimersRef.current.set(explosionId, timerId);
            }
          });

          if (!bulletHit) {
            bulletsToKeep.push(bullet);
          }
        });

        return bulletsToKeep;
      });

      // Check player-obstacle collisions
      obstacles.forEach((obstacle) => {
        const obstacleRadius = obstacle.isBoss ? BOSS_SIZE :
          obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
          obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

        // Check if this is a full hit (not just grazing)
        if (isFullHit(
          playerPosRef.current,
          JET_SIZE,
          obstacle.position,
          obstacleRadius,
          playfieldSizeRef.current.width,
          playfieldSizeRef.current.height
        )) {
          triggerGameOver('obstacle');
        }
      });

      // Spawn obstacles
      obstacleSpawnAccumulatorRef.current += deltaTime;
      if (obstacleSpawnAccumulatorRef.current >= OBSTACLE_SPAWN_INTERVAL) {
        spawnObstacle();
        obstacleSpawnAccumulatorRef.current -= OBSTACLE_SPAWN_INTERVAL;
      }

      // Check level completion
      const currentDestroyed = destroyedThisLevelRef.current;
      const currentLevel = levelRef.current;
      const requiredDestroyed = OBSTACLES_PER_LEVEL * currentLevel;
      const currentBossActive = bossActiveRef.current;

      if (currentDestroyed >= requiredDestroyed && !currentBossActive) {
        // Spawn boss
        spawnBoss();
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    obstacles,
    bossHits,
    spawnBullet,
    spawnObstacle,
    spawnBoss,
    triggerGameOver,
    spawnSparkBurst,
    sensitivity,
  ]);

  // Cleanup effect timers on unmount
  useEffect(() => {
    return () => {
      effectTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      effectTimersRef.current.clear();
      
      if (explosionTimerRef.current !== null) {
        window.clearTimeout(explosionTimerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Playfield>
        {/* Player */}
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

        {/* Spark Bursts */}
        {sparkBursts.map((burst) => (
          <SparkBurst
            key={burst.id}
            x={burst.position.x}
            y={burst.position.y}
            variant={burst.variant}
          />
        ))}
      </Playfield>

      {/* Game UI Overlay */}
      <GameOverlay
        gameState={gameState}
        gameOverReason={gameOverReason}
        score={score}
        level={level}
        destroyedThisLevel={destroyedThisLevel}
        targetObstacles={OBSTACLES_PER_LEVEL * level}
        bossActive={bossActive}
        bossHits={bossHits}
        bossMaxHits={BOSS_MAX_HITS}
        timeRemaining={timeRemaining}
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
