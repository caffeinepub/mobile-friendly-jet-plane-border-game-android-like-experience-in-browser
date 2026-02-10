import { useEffect, useRef, useState, useCallback } from 'react';
import Playfield from './Playfield';
import PlayerJet from './entities/PlayerJet';
import Bullet from './entities/Bullet';
import Obstacle from './entities/Obstacle';
import Explosion from './effects/Explosion';
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

const JET_SIZE = 32; // Reduced for mobile - smaller collision radius
const BULLET_SPEED = 400; // Increased from 300 - bullets travel faster
const FIRE_COOLDOWN = 200; // Milliseconds between shots - medium cadence
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
  const [joystickResetToken, setJoystickResetToken] = useState(0); // Token to trigger joystick reset
  const { sensitivity, setSensitivity } = useJoystickSensitivity();
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
    }
  }, [gameState]);

  // Handle joystick movement
  const handleJoystickMove = useCallback((vector: { x: number; y: number; magnitude: number }) => {
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
    // Reset joystick
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    setJoystickResetToken(prev => prev + 1);
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

      // Update player position based on joystick with sensitivity curve
      const rawJoystick = joystickVectorRef.current;
      const movement = processJoystickInput(rawJoystick);
      
      if (movement.speedFactor > 0 && playfieldSize.width > 0) {
        // Apply curved speed factor and user sensitivity to base movement speed
        const effectiveSpeed = BASE_MOVEMENT_SPEED * movement.speedFactor * sensitivity;
        const moveDistance = effectiveSpeed * deltaSeconds;
        const dx = (movement.direction.x * moveDistance) / playfieldSize.width;
        const dy = (movement.direction.y * moveDistance) / playfieldSize.height;

        setPlayerPos((prev) => {
          const newPos = {
            x: prev.x + dx * 100,
            y: prev.y + dy * 100,
          };
          
          // Check if player would reach border before clamping
          if (isAtBorder(newPos, playfieldSize.width, playfieldSize.height, JET_SIZE)) {
            // Trigger player death
            setGameState('exploding');
            const explosionId = explosionIdRef.current++;
            setExplosions((prevExplosions) => [
              ...prevExplosions,
              { id: explosionId, position: prev, variant: 'player' },
            ]);
            explosionTimerRef.current = window.setTimeout(() => {
              setGameState('gameover');
            }, EXPLOSION_DURATION);
            // Return clamped position for final frame
            return clampPosition(newPos, playfieldSize.width, playfieldSize.height, JET_SIZE);
          }
          
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
            newVx = (Math.random() - 0.5) * obstacle.zigzagAmplitude;
          }

          const newPos = {
            x: obstacle.position.x + (newVx * deltaSeconds * 100) / playfieldSize.width,
            y: obstacle.position.y + (obstacle.velocity.y * deltaSeconds * 100) / playfieldSize.height,
          };

          return {
            ...obstacle,
            position: newPos,
            velocity: { ...obstacle.velocity, x: newVx },
            zigzagTimer: newZigzagTimer >= obstacle.zigzagInterval ? 0 : newZigzagTimer,
          };
        });

        // Resolve obstacle-to-obstacle collisions
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const obs1 = updated[i];
            const obs2 = updated[j];

            const radius1 = obs1.isBoss ? BOSS_SIZE : 
              obs1.size === 'small' ? OBSTACLE_SIZE_SMALL :
              obs1.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;
            const radius2 = obs2.isBoss ? BOSS_SIZE :
              obs2.size === 'small' ? OBSTACLE_SIZE_SMALL :
              obs2.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

            const result = resolveObstacleCollision(
              obs1.position,
              obs1.velocity,
              radius1,
              obs2.position,
              obs2.velocity,
              radius2,
              playfieldSize.width,
              playfieldSize.height
            );

            if (result.collided && result.newPosition1 && result.newVelocity1 && result.newPosition2 && result.newVelocity2) {
              updated[i] = {
                ...obs1,
                position: result.newPosition1,
                velocity: result.newVelocity1,
              };
              updated[j] = {
                ...obs2,
                position: result.newPosition2,
                velocity: result.newVelocity2,
              };
            }
          }
        }

        return updated.filter((obstacle) => !isOutOfBounds(obstacle.position, playfieldSize.width, playfieldSize.height, 50));
      });

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
              const obstacleRadius = obstacle.isBoss ? BOSS_SIZE :
                obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
                obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

              const dx = ((bullet.position.x - obstacle.position.x) * playfieldSize.width) / 100;
              const dy = ((bullet.position.y - obstacle.position.y) * playfieldSize.height) / 100;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < obstacleRadius + BULLET_SIZE) {
                bulletsToRemove.add(bullet.id);

                if (obstacle.isBoss) {
                  // Boss hit
                  setBossHits((prev) => {
                    const newHits = prev + 1;
                    if (newHits >= BOSS_MAX_HITS) {
                      obstaclesToRemove.add(obstacle.id);
                      setScore((s) => s + 100);
                      setGameState('levelcomplete');
                      const explosionId = explosionIdRef.current++;
                      setExplosions((prevExplosions) => [
                        ...prevExplosions,
                        { id: explosionId, position: obstacle.position, variant: 'bomb' },
                      ]);
                      effectTimersRef.current.set(
                        explosionId,
                        window.setTimeout(() => {
                          setExplosions((prev) => prev.filter((e) => e.id !== explosionId));
                          effectTimersRef.current.delete(explosionId);
                        }, HIT_EFFECT_DURATION * 3)
                      );
                    } else {
                      const explosionId = explosionIdRef.current++;
                      setExplosions((prevExplosions) => [
                        ...prevExplosions,
                        { id: explosionId, position: bullet.position, variant: 'hit' },
                      ]);
                      effectTimersRef.current.set(
                        explosionId,
                        window.setTimeout(() => {
                          setExplosions((prev) => prev.filter((e) => e.id !== explosionId));
                          effectTimersRef.current.delete(explosionId);
                        }, HIT_EFFECT_DURATION)
                      );
                    }
                    return newHits;
                  });
                } else {
                  // Regular obstacle hit
                  obstaclesToRemove.add(obstacle.id);
                  const scoreValue = obstacle.size === 'small' ? SCORE_SMALL :
                    obstacle.size === 'medium' ? SCORE_MEDIUM : SCORE_LARGE;
                  setScore((s) => s + scoreValue);
                  setDestroyedThisLevel((d) => d + 1);

                  const explosionId = explosionIdRef.current++;
                  setExplosions((prevExplosions) => [
                    ...prevExplosions,
                    { id: explosionId, position: obstacle.position, variant: 'hit' },
                  ]);
                  effectTimersRef.current.set(
                    explosionId,
                    window.setTimeout(() => {
                      setExplosions((prev) => prev.filter((e) => e.id !== explosionId));
                      effectTimersRef.current.delete(explosionId);
                    }, HIT_EFFECT_DURATION)
                  );
                }
                break;
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
          const obstacleRadius = obstacle.isBoss ? BOSS_SIZE :
            obstacle.size === 'small' ? OBSTACLE_SIZE_SMALL :
            obstacle.size === 'medium' ? OBSTACLE_SIZE_MEDIUM : OBSTACLE_SIZE_LARGE;

          // Check if it's a full hit using the correct function signature
          if (isFullHit(
            playerPosRef.current,
            JET_SIZE,
            obstacle.position,
            obstacleRadius,
            playfieldSize.width,
            playfieldSize.height
          )) {
            setGameState('exploding');
            const explosionId = explosionIdRef.current++;
            setExplosions((prevExplosions) => [
              ...prevExplosions,
              { id: explosionId, position: playerPosRef.current, variant: 'bomb' },
            ]);
            explosionTimerRef.current = window.setTimeout(() => {
              setGameState('gameover');
            }, EXPLOSION_DURATION);
            break;
          }
        }
        return prevObstacles;
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (explosionTimerRef.current) {
        clearTimeout(explosionTimerRef.current);
      }
      effectTimersRef.current.forEach((timer) => clearTimeout(timer));
      effectTimersRef.current.clear();
    };
  }, [gameState, playfieldSize, spawnBullet, spawnObstacle, spawnBoss, level, destroyedThisLevel, bossActive, sensitivity]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Playfield>
        {/* Player jet */}
        <PlayerJet
          position={playerPos}
          rotation={facingAngle}
          isThrusting={isThrusting}
        />

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
      </Playfield>

      <GameOverlay
        gameState={gameState}
        score={score}
        level={level}
        timeRemaining={timeRemaining}
        bossActive={bossActive}
        bossHits={bossHits}
        bossMaxHits={BOSS_MAX_HITS}
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
