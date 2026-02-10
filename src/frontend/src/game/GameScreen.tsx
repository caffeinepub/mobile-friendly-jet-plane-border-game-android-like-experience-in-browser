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
import { isFullHit } from './physics/playerObstacleHit';
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
  velocityPercent: { x: number; y: number }; // Velocity in percent per frame (fixed at fire time)
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
const BULLET_SPEED = 300; // Pixels per second - FAST speed
const FIRE_COOLDOWN = 200; // Milliseconds between shots - medium cadence
const MOVEMENT_SPEED = 180; // Pixels per second - FAST speed
const OBSTACLE_SPEED = 120; // Base speed in pixels per second - FAST speed
const OBSTACLE_SIZE_SMALL = 18; // Small obstacle collision radius
const OBSTACLE_SIZE_MEDIUM = 24; // Medium obstacle collision radius
const OBSTACLE_SIZE_LARGE = 30; // Large obstacle collision radius
const BOSS_SIZE = 50; // Boss obstacle collision radius
const BULLET_SIZE = 6; // Reduced for mobile - half size for collision detection
const EXPLOSION_DURATION = 800; // Milliseconds before transitioning to game over
const OBSTACLE_SPAWN_INTERVAL = 1000; // Spawn one obstacle every 1000ms (1 second)
const MAX_DELTA_TIME = 100; // Clamp delta to avoid huge jumps after tab switches
const HIT_EFFECT_DURATION = 300; // Duration for bullet hit effects
const BULLET_SPAWN_OFFSET = 30; // Pixels ahead of jet nose for bullet spawn (tuned for visual muzzle)
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

  // Handle joystick movement
  const handleJoystickMove = useCallback((vector: { x: number; y: number; magnitude: number }) => {
    joystickVectorRef.current = vector;
    
    // Update facing angle based on joystick direction
    if (vector.magnitude > 0.1) {
      const angleRad = Math.atan2(vector.x, -vector.y);
      const angleDeg = (angleRad * 180) / Math.PI;
      setFacingAngle(angleDeg);
      setIsThrusting(true);
    } else {
      setIsThrusting(false);
    }
  }, []);

  const handleJoystickNeutral = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setIsThrusting(false);
  }, []);

  // Fire start/end handlers
  const handleFireStart = useCallback(() => {
    isFiringRef.current = true;
  }, []);

  const handleFireEnd = useCallback(() => {
    isFiringRef.current = false;
  }, []);

  // Spawn a bullet from the jet nose
  const spawnBullet = useCallback(() => {
    if (playfieldSize.width === 0 || playfieldSize.height === 0) return;

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

  // Spawn an obstacle
  const spawnObstacle = useCallback(() => {
    if (playfieldSize.width === 0 || playfieldSize.height === 0) return;

    // Random size distribution
    const rand = Math.random();
    let size: ObstacleSize;
    if (rand < 0.5) size = 'small';
    else if (rand < 0.8) size = 'medium';
    else size = 'large';

    // Random spawn position at top edge
    const spawnX = Math.random() * 100;
    const spawnY = -5; // Just above the visible area

    // Random horizontal velocity with level scaling
    const baseVx = (Math.random() - 0.5) * 60;
    const levelMultiplier = 1 + (level - 1) * 0.15;
    const vx = baseVx * levelMultiplier;
    const vy = OBSTACLE_SPEED * levelMultiplier;

    // Random zigzag parameters
    const zigzagInterval = 800 + Math.random() * 400;
    const zigzagAmplitude = 30 + Math.random() * 30;

    const newObstacle: ObstacleData = {
      id: obstacleIdRef.current++,
      position: { x: spawnX, y: spawnY },
      velocity: { x: vx, y: vy },
      zigzagTimer: 0,
      zigzagInterval,
      zigzagAmplitude,
      size,
    };

    setObstacles((prev) => [...prev, newObstacle]);
  }, [playfieldSize, level]);

  // Spawn boss obstacle
  const spawnBoss = useCallback(() => {
    if (playfieldSize.width === 0 || playfieldSize.height === 0) return;

    const spawnX = 50; // Center horizontally
    const spawnY = -10; // Just above the visible area

    const levelMultiplier = 1 + (level - 1) * 0.15;
    const vy = OBSTACLE_SPEED * 0.6 * levelMultiplier; // Boss moves slower

    const bossObstacle: ObstacleData = {
      id: obstacleIdRef.current++,
      position: { x: spawnX, y: spawnY },
      velocity: { x: 0, y: vy },
      zigzagTimer: 0,
      zigzagInterval: 1000,
      zigzagAmplitude: 40,
      size: 'large',
      isBoss: true,
    };

    bossIdRef.current = bossObstacle.id;
    setObstacles((prev) => [...prev, bossObstacle]);
    setBossActive(true);
    setBossHits(0);
  }, [playfieldSize, level]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerPos({ x: 50, y: 50 });
    setFacingAngle(0);
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setScore(0);
    setLevel(1);
    setDestroyedThisLevel(0);
    setBossActive(false);
    setBossHits(0);
    setIsThrusting(false);
    obstacleSpawnAccumulatorRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
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
    setPlayerPos({ x: 50, y: 50 });
    setFacingAngle(0);
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setDestroyedThisLevel(0);
    setBossActive(false);
    setBossHits(0);
    setIsThrusting(false);
    obstacleSpawnAccumulatorRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    isFiringRef.current = false;
    fireAccumulatorRef.current = 0;
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
        if (newTime === 0 && gameState === 'playing') {
          // Time's up - game over
          setGameState('exploding');
          const explosionId = explosionIdRef.current++;
          setExplosions((prev) => [
            ...prev,
            { id: explosionId, position: playerPosRef.current, variant: 'player' },
          ]);
          explosionTimerRef.current = window.setTimeout(() => {
            setGameState('gameover');
          }, EXPLOSION_DURATION);
        }
        return newTime;
      });

      // Handle continuous firing
      if (isFiringRef.current) {
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

      // Update player position based on joystick
      const joystick = joystickVectorRef.current;
      if (joystick.magnitude > MOVEMENT_THRESHOLD && playfieldSize.width > 0) {
        const moveDistance = MOVEMENT_SPEED * deltaSeconds;
        const dx = (joystick.x * moveDistance) / playfieldSize.width;
        const dy = (joystick.y * moveDistance) / playfieldSize.height;

        setPlayerPos((prev) => {
          const newPos = {
            x: prev.x + dx * 100,
            y: prev.y + dy * 100,
          };
          return clampPosition(newPos, playfieldSize.width, playfieldSize.height, JET_SIZE);
        });
      }

      // Update bullets
      setBullets((prev) =>
        prev
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.velocityPercent.x,
              y: bullet.position.y + bullet.velocityPercent.y,
            },
          }))
          .filter((bullet) => !isOutOfBounds(bullet.position, playfieldSize.width, playfieldSize.height, BULLET_SIZE))
      );

      // Spawn obstacles
      if (!bossActive) {
        obstacleSpawnAccumulatorRef.current += deltaTime;
        if (obstacleSpawnAccumulatorRef.current >= OBSTACLE_SPAWN_INTERVAL) {
          spawnObstacle();
          obstacleSpawnAccumulatorRef.current = 0;
        }
      }

      // Check if level target reached
      const targetObstacles = OBSTACLES_PER_LEVEL * level;
      if (!bossActive && destroyedThisLevel >= targetObstacles) {
        spawnBoss();
      }

      // Update obstacles
      setObstacles((prev) => {
        let updated = prev.map((obstacle) => {
          const newZigzagTimer = obstacle.zigzagTimer + deltaTime;
          let newVx = obstacle.velocity.x;

          if (newZigzagTimer >= obstacle.zigzagInterval) {
            newVx = (Math.random() - 0.5) * obstacle.zigzagAmplitude * 2;
          }

          const direction = {
            x: newVx === 0 ? 0 : newVx / Math.abs(newVx),
            y: obstacle.velocity.y === 0 ? 0 : obstacle.velocity.y / Math.abs(obstacle.velocity.y),
          };
          const magnitude = Math.sqrt(newVx * newVx + obstacle.velocity.y * obstacle.velocity.y);
          const normalizedDirection = magnitude === 0 ? { x: 0, y: 1 } : {
            x: newVx / magnitude,
            y: obstacle.velocity.y / magnitude,
          };

          const velocityPercent = pixelVelocityToPercent(
            magnitude,
            normalizedDirection,
            playfieldSize.width,
            playfieldSize.height,
            deltaSeconds
          );

          return {
            ...obstacle,
            position: {
              x: obstacle.position.x + velocityPercent.x,
              y: obstacle.position.y + velocityPercent.y,
            },
            velocity: { x: newVx, y: obstacle.velocity.y },
            zigzagTimer: newZigzagTimer >= obstacle.zigzagInterval ? 0 : newZigzagTimer,
          };
        });

        // Reflect obstacles at horizontal bounds
        updated = updated.map((obstacle) => {
          const obstacleRadius = obstacle.isBoss
            ? BOSS_SIZE
            : obstacle.size === 'small'
              ? OBSTACLE_SIZE_SMALL
              : obstacle.size === 'medium'
                ? OBSTACLE_SIZE_MEDIUM
                : OBSTACLE_SIZE_LARGE;

          const reflected = reflectAtBounds(
            obstacle.position,
            obstacle.velocity,
            playfieldSize.width,
            playfieldSize.height,
            obstacleRadius
          );
          return {
            ...obstacle,
            position: reflected.position,
            velocity: reflected.velocity,
          };
        });

        // Resolve obstacle-to-obstacle collisions
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const obstacleA = updated[i];
            const obstacleB = updated[j];

            const radiusA = obstacleA.isBoss
              ? BOSS_SIZE
              : obstacleA.size === 'small'
                ? OBSTACLE_SIZE_SMALL
                : obstacleA.size === 'medium'
                  ? OBSTACLE_SIZE_MEDIUM
                  : OBSTACLE_SIZE_LARGE;

            const radiusB = obstacleB.isBoss
              ? BOSS_SIZE
              : obstacleB.size === 'small'
                ? OBSTACLE_SIZE_SMALL
                : obstacleB.size === 'medium'
                  ? OBSTACLE_SIZE_MEDIUM
                  : OBSTACLE_SIZE_LARGE;

            const result = resolveObstacleCollision(
              obstacleA.position,
              obstacleA.velocity,
              radiusA,
              obstacleB.position,
              obstacleB.velocity,
              radiusB,
              playfieldSize.width,
              playfieldSize.height
            );

            if (result.collided && result.newPosition1 && result.newVelocity1 && result.newPosition2 && result.newVelocity2) {
              updated[i] = { ...obstacleA, position: result.newPosition1, velocity: result.newVelocity1 };
              updated[j] = { ...obstacleB, position: result.newPosition2, velocity: result.newVelocity2 };
            }
          }
        }

        // Remove obstacles that are out of bounds
        return updated.filter((obstacle) => {
          const obstacleRadius = obstacle.isBoss
            ? BOSS_SIZE
            : obstacle.size === 'small'
              ? OBSTACLE_SIZE_SMALL
              : obstacle.size === 'medium'
                ? OBSTACLE_SIZE_MEDIUM
                : OBSTACLE_SIZE_LARGE;
          return !isOutOfBounds(obstacle.position, playfieldSize.width, playfieldSize.height, obstacleRadius);
        });
      });

      // Check bullet-obstacle collisions
      setBullets((prevBullets) => {
        const remainingBullets = [...prevBullets];
        const bulletsToRemove = new Set<number>();

        setObstacles((prevObstacles) => {
          const remainingObstacles = [...prevObstacles];
          const obstaclesToRemove = new Set<number>();

          for (const bullet of remainingBullets) {
            for (const obstacle of remainingObstacles) {
              if (bulletsToRemove.has(bullet.id) || obstaclesToRemove.has(obstacle.id)) continue;

              const obstacleRadius = obstacle.isBoss
                ? BOSS_SIZE
                : obstacle.size === 'small'
                  ? OBSTACLE_SIZE_SMALL
                  : obstacle.size === 'medium'
                    ? OBSTACLE_SIZE_MEDIUM
                    : OBSTACLE_SIZE_LARGE;

              const dx =
                ((bullet.position.x - obstacle.position.x) * playfieldSize.width) / 100;
              const dy =
                ((bullet.position.y - obstacle.position.y) * playfieldSize.height) / 100;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < BULLET_SIZE + obstacleRadius) {
                bulletsToRemove.add(bullet.id);

                if (obstacle.isBoss) {
                  // Boss hit
                  setBossHits((prev) => {
                    const newHits = prev + 1;
                    if (newHits >= BOSS_MAX_HITS) {
                      // Boss defeated
                      obstaclesToRemove.add(obstacle.id);
                      setScore((s) => s + 100);
                      const explosionId = explosionIdRef.current++;
                      setExplosions((e) => [
                        ...e,
                        { id: explosionId, position: obstacle.position, variant: 'bomb' },
                      ]);
                      effectTimersRef.current.set(
                        explosionId,
                        window.setTimeout(() => {
                          setExplosions((e) => e.filter((ex) => ex.id !== explosionId));
                          effectTimersRef.current.delete(explosionId);
                        }, HIT_EFFECT_DURATION)
                      );
                      setBossActive(false);
                      bossIdRef.current = null;
                      setGameState('levelcomplete');
                    }
                    return newHits;
                  });
                } else {
                  // Regular obstacle hit
                  obstaclesToRemove.add(obstacle.id);
                  setDestroyedThisLevel((d) => d + 1);

                  const scoreValue =
                    obstacle.size === 'small'
                      ? SCORE_SMALL
                      : obstacle.size === 'medium'
                        ? SCORE_MEDIUM
                        : SCORE_LARGE;
                  setScore((s) => s + scoreValue);

                  const explosionId = explosionIdRef.current++;
                  setExplosions((e) => [
                    ...e,
                    { id: explosionId, position: obstacle.position, variant: 'hit' },
                  ]);
                  effectTimersRef.current.set(
                    explosionId,
                    window.setTimeout(() => {
                      setExplosions((e) => e.filter((ex) => ex.id !== explosionId));
                      effectTimersRef.current.delete(explosionId);
                    }, HIT_EFFECT_DURATION)
                  );
                }

                break;
              }
            }
          }

          return remainingObstacles.filter((o) => !obstaclesToRemove.has(o.id));
        });

        return remainingBullets.filter((b) => !bulletsToRemove.has(b.id));
      });

      // Check player-obstacle collisions
      setObstacles((prevObstacles) => {
        for (const obstacle of prevObstacles) {
          const obstacleRadius = obstacle.isBoss
            ? BOSS_SIZE
            : obstacle.size === 'small'
              ? OBSTACLE_SIZE_SMALL
              : obstacle.size === 'medium'
                ? OBSTACLE_SIZE_MEDIUM
                : OBSTACLE_SIZE_LARGE;

          const dx =
            ((playerPosRef.current.x - obstacle.position.x) * playfieldSize.width) / 100;
          const dy =
            ((playerPosRef.current.y - obstacle.position.y) * playfieldSize.height) / 100;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < JET_SIZE + obstacleRadius) {
            // Check if it's a full hit
            const hitResult = isFullHit(
              playerPosRef.current,
              JET_SIZE,
              obstacle.position,
              obstacleRadius,
              playfieldSize.width,
              playfieldSize.height
            );

            if (hitResult) {
              // Game over
              setGameState('exploding');
              const explosionId = explosionIdRef.current++;
              setExplosions((prev) => [
                ...prev,
                { id: explosionId, position: playerPosRef.current, variant: 'bomb' },
              ]);
              explosionTimerRef.current = window.setTimeout(() => {
                setGameState('gameover');
              }, EXPLOSION_DURATION);
              break;
            }
          }
        }

        return prevObstacles;
      });

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
    playfieldSize,
    spawnBullet,
    spawnObstacle,
    spawnBoss,
    level,
    destroyedThisLevel,
    bossActive,
  ]);

  // Cleanup explosion timer on unmount
  useEffect(() => {
    return () => {
      if (explosionTimerRef.current !== null) {
        clearTimeout(explosionTimerRef.current);
      }
      effectTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const targetObstacles = OBSTACLES_PER_LEVEL * level;

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
            isBoss={obstacle.isBoss}
          />
        ))}

        {/* Explosions */}
        {explosions.map((explosion) => (
          <Explosion key={explosion.id} position={explosion.position} variant={explosion.variant} />
        ))}
      </Playfield>

      {/* Game overlay */}
      <GameOverlay
        gameState={gameState}
        score={score}
        level={level}
        destroyed={destroyedThisLevel}
        target={targetObstacles}
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
      />
    </div>
  );
}
