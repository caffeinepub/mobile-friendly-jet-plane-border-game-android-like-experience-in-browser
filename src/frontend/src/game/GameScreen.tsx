import { useEffect, useRef, useState, useCallback } from 'react';
import Playfield from './Playfield';
import PlayerJet from './entities/PlayerJet';
import Bullet from './entities/Bullet';
import Obstacle from './entities/Obstacle';
import Explosion from './effects/Explosion';
import GameOverlay from './ui/GameOverlay';
import { clampPosition, reflectAtBounds, isOutOfBounds } from './physics/bounds';

type GameState = 'idle' | 'playing' | 'exploding' | 'gameover' | 'paused';

interface Position {
  x: number;
  y: number;
}

interface BulletData {
  id: number;
  position: Position;
  direction: { x: number; y: number }; // Normalized direction vector
  angle: number; // Angle in degrees for visual rotation
}

interface ObstacleData {
  id: number;
  position: Position;
  velocity: { x: number; y: number };
  zigzagTimer: number;
  zigzagInterval: number;
  zigzagAmplitude: number;
}

interface ExplosionData {
  id: number;
  position: Position;
}

const PLAYFIELD_PADDING = 40; // Space for borders
const JET_SIZE = 40; // Reduced for mobile - half of sprite size for collision
const BULLET_SPEED = 2; // Percent per frame
const FIRE_COOLDOWN = 150; // Milliseconds between shots
const MOVEMENT_SPEED = 0.8; // Speed multiplier for joystick movement
const OBSTACLE_SPEED = 0.5; // Base speed for obstacles
const OBSTACLE_SIZE = 24; // Reduced for mobile - half size for bounds checking
const BULLET_SIZE = 6; // Reduced for mobile - half size for collision detection
const JET_NOSE_OFFSET = 8; // Distance from jet center to nose (percentage-based)
const EXPLOSION_DURATION = 800; // Milliseconds before transitioning to game over

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 50, y: 50 });
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [playfieldSize, setPlayfieldSize] = useState({ width: 0, height: 0 });
  const [facingAngle, setFacingAngle] = useState(0); // Angle in degrees, 0 = up
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const lastFireTimeRef = useRef(0);
  const joystickVectorRef = useRef({ x: 0, y: 0, magnitude: 0 });
  const explosionTimerRef = useRef<number | null>(null);
  
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

  // Spawn initial obstacles when game starts
  useEffect(() => {
    if (gameState === 'playing' && obstacles.length === 0) {
      const initialObstacles: ObstacleData[] = [];
      for (let i = 0; i < 3; i++) {
        initialObstacles.push(createRandomObstacle());
      }
      setObstacles(initialObstacles);
    }
  }, [gameState, obstacles.length]);

  // Helper to create a random obstacle
  const createRandomObstacle = (): ObstacleData => {
    const angle = Math.random() * Math.PI * 2;
    const speed = OBSTACLE_SPEED * (0.7 + Math.random() * 0.6);
    
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
      zigzagInterval: 30 + Math.random() * 40, // Frames between direction changes
      zigzagAmplitude: 0.3 + Math.random() * 0.5, // How much to turn
    };
  };

  // Helper to check collision between two entities
  const checkCollision = (pos1: Position, size1: number, pos2: Position, size2: number): boolean => {
    if (!playfieldSize.width || !playfieldSize.height) return false;
    
    // Convert percentage to pixels for accurate collision
    const x1 = (pos1.x / 100) * playfieldSize.width;
    const y1 = (pos1.y / 100) * playfieldSize.height;
    const x2 = (pos2.x / 100) * playfieldSize.width;
    const y2 = (pos2.y / 100) * playfieldSize.height;
    
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return distance < (size1 + size2);
  };

  // Helper to trigger explosion and game over
  const triggerExplosion = useCallback((position: Position) => {
    const newExplosion: ExplosionData = {
      id: explosionIdRef.current++,
      position,
    };
    setExplosions([newExplosion]);
    setGameState('exploding');
    
    // Transition to game over after explosion animation
    explosionTimerRef.current = window.setTimeout(() => {
      setGameState('gameover');
      setExplosions([]);
    }, EXPLOSION_DURATION);
  }, []);

  // Animation loop for joystick-based movement, bullet updates, and obstacle movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animate = () => {
      const joystick = joystickVectorRef.current;
      
      // Update player position based on joystick input
      if (joystick.magnitude > 0.1) {
        setPlayerPos((prev) => {
          const speed = MOVEMENT_SPEED * joystick.magnitude;
          const newX = prev.x + joystick.x * speed;
          const newY = prev.y + joystick.y * speed;

          // Check if player would go out of bounds
          if (isOutOfBounds(
            { x: newX, y: newY },
            playfieldSize.width,
            playfieldSize.height,
            JET_SIZE
          )) {
            triggerExplosion(prev);
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

      // Update bullets
      setBullets((prevBullets) => {
        return prevBullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.direction.x * BULLET_SPEED,
              y: bullet.position.y + bullet.direction.y * BULLET_SPEED,
            },
          }))
          .filter((bullet) => 
            bullet.position.x >= -5 && 
            bullet.position.x <= 105 && 
            bullet.position.y >= -5 && 
            bullet.position.y <= 105
          ); // Remove bullets that left the playfield
      });

      // Update obstacles with zig-zag movement
      setObstacles((prevObstacles) => {
        return prevObstacles.map((obstacle) => {
          let newVelocity = { ...obstacle.velocity };
          let newTimer = obstacle.zigzagTimer + 1;

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

          // Update position
          let newPosition = {
            x: obstacle.position.x + newVelocity.x,
            y: obstacle.position.y + newVelocity.y,
          };

          // Reflect at bounds
          const reflected = reflectAtBounds(
            newPosition,
            newVelocity,
            playfieldSize.width,
            playfieldSize.height,
            OBSTACLE_SIZE
          );

          return {
            ...obstacle,
            position: reflected.position,
            velocity: reflected.velocity,
            zigzagTimer: newTimer,
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, playfieldSize, triggerExplosion]);

  // Collision detection (only during playing state)
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check player-obstacle collisions
    for (const obstacle of obstacles) {
      if (checkCollision(playerPos, JET_SIZE, obstacle.position, OBSTACLE_SIZE)) {
        triggerExplosion(playerPos);
        return;
      }
    }

    // Check bullet-obstacle collisions
    for (const bullet of bullets) {
      for (const obstacle of obstacles) {
        if (checkCollision(bullet.position, BULLET_SIZE, obstacle.position, OBSTACLE_SIZE)) {
          triggerExplosion(obstacle.position);
          return;
        }
      }
    }

    // Check obstacle-obstacle collisions and apply bounce
    setObstacles((prevObstacles) => {
      const newObstacles = [...prevObstacles];
      
      for (let i = 0; i < newObstacles.length; i++) {
        for (let j = i + 1; j < newObstacles.length; j++) {
          if (checkCollision(
            newObstacles[i].position,
            OBSTACLE_SIZE,
            newObstacles[j].position,
            OBSTACLE_SIZE
          )) {
            // Swap velocities for bounce effect
            const tempVel = { ...newObstacles[i].velocity };
            newObstacles[i].velocity = { ...newObstacles[j].velocity };
            newObstacles[j].velocity = tempVel;
          }
        }
      }
      
      return newObstacles;
    });
  }, [gameState, playerPos, bullets, obstacles, triggerExplosion]);

  // Cleanup explosion timer
  useEffect(() => {
    return () => {
      if (explosionTimerRef.current !== null) {
        clearTimeout(explosionTimerRef.current);
      }
    };
  }, []);

  const handleStart = useCallback(() => {
    setGameState('playing');
  }, []);

  const handlePause = useCallback(() => {
    setGameState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setPlayerPos({ x: 50, y: 50 });
    setBullets([]);
    setObstacles([]);
    setExplosions([]);
    setFacingAngle(0);
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
    if (explosionTimerRef.current !== null) {
      clearTimeout(explosionTimerRef.current);
      explosionTimerRef.current = null;
    }
    setGameState('idle');
  }, []);

  const handleFire = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    if (now - lastFireTimeRef.current < FIRE_COOLDOWN) return;
    
    lastFireTimeRef.current = now;
    
    // Use refs to capture exact firing snapshot
    const currentPos = playerPosRef.current;
    const currentAngle = facingAngleRef.current;
    
    // Calculate forward direction from facing angle
    const angleRad = (currentAngle * Math.PI) / 180;
    const forwardX = Math.sin(angleRad);
    const forwardY = -Math.cos(angleRad);
    
    // Spawn bullet at jet's nose (offset in facing direction)
    const newBullet: BulletData = {
      id: bulletIdRef.current++,
      position: {
        x: currentPos.x + forwardX * JET_NOSE_OFFSET,
        y: currentPos.y + forwardY * JET_NOSE_OFFSET,
      },
      direction: {
        x: forwardX,
        y: forwardY,
      },
      angle: currentAngle,
    };
    
    setBullets((prev) => [...prev, newBullet]);
  }, [gameState]);

  const handleJoystickMove = useCallback((vector: { x: number; y: number; magnitude: number }) => {
    joystickVectorRef.current = vector;
  }, []);

  const handleJoystickNeutral = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0, magnitude: 0 };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none"
    >
      <Playfield>
        <PlayerJet position={playerPos} rotation={facingAngle} />
        {bullets.map((bullet) => (
          <Bullet key={bullet.id} position={bullet.position} rotation={bullet.angle} />
        ))}
        {obstacles.map((obstacle) => (
          <Obstacle key={obstacle.id} position={obstacle.position} />
        ))}
        {explosions.map((explosion) => (
          <Explosion key={explosion.id} position={explosion.position} />
        ))}
      </Playfield>

      <GameOverlay
        gameState={gameState}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onFire={handleFire}
        onJoystickMove={handleJoystickMove}
        onJoystickNeutral={handleJoystickNeutral}
        bulletCount={bullets.length}
      />
    </div>
  );
}
