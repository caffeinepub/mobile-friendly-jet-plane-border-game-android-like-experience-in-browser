import { useEffect, useRef, useState, useCallback } from 'react';
import Playfield from './Playfield';
import PlayerJet from './entities/PlayerJet';
import Bullet from './entities/Bullet';
import GameOverlay from './ui/GameOverlay';
import { clampPosition } from './physics/bounds';

type GameState = 'idle' | 'playing' | 'paused';

interface Position {
  x: number;
  y: number;
}

interface BulletData {
  id: number;
  position: Position;
}

const PLAYFIELD_PADDING = 40; // Space for borders
const JET_SIZE = 64; // Half of sprite size for collision
const BULLET_SPEED = 2; // Percent per frame
const FIRE_COOLDOWN = 150; // Milliseconds between shots

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 50, y: 50 });
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [playfieldSize, setPlayfieldSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const lastFireTimeRef = useRef(0);

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

  // Animation loop for smooth movement and bullet updates
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animate = () => {
      // Update player position
      setPlayerPos((prev) => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return prev;

        const speed = 0.15;
        const newX = prev.x + dx * speed;
        const newY = prev.y + dy * speed;

        return clampPosition(
          { x: newX, y: newY },
          playfieldSize.width,
          playfieldSize.height,
          JET_SIZE
        );
      });

      // Update bullets
      setBullets((prevBullets) => {
        return prevBullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x,
              y: bullet.position.y - BULLET_SPEED,
            },
          }))
          .filter((bullet) => bullet.position.y > -5); // Remove bullets that left the screen
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, targetPos, playfieldSize]);

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
    setTargetPos({ x: 50, y: 50 });
    setBullets([]);
    setGameState('idle');
  }, []);

  const handleFire = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    if (now - lastFireTimeRef.current < FIRE_COOLDOWN) return;
    
    lastFireTimeRef.current = now;
    
    // Spawn bullet at jet's nose (slightly above center)
    const newBullet: BulletData = {
      id: bulletIdRef.current++,
      position: {
        x: playerPos.x,
        y: playerPos.y - 8, // Offset to jet nose
      },
    };
    
    setBullets((prev) => [...prev, newBullet]);
  }, [gameState, playerPos]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (gameState !== 'playing') return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left - PLAYFIELD_PADDING) / playfieldSize.width) * 100;
      const y = ((e.clientY - rect.top - PLAYFIELD_PADDING) / playfieldSize.height) * 100;

      const clamped = clampPosition({ x, y }, 100, 100, (JET_SIZE / playfieldSize.width) * 100);
      setTargetPos(clamped);
    },
    [gameState, playfieldSize]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none"
      onPointerMove={handlePointerMove}
    >
      <Playfield>
        <PlayerJet position={playerPos} />
        {bullets.map((bullet) => (
          <Bullet key={bullet.id} position={bullet.position} />
        ))}
      </Playfield>

      <GameOverlay
        gameState={gameState}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onFire={handleFire}
        bulletCount={bullets.length}
      />
    </div>
  );
}
