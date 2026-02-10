import { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onNeutral: () => void;
}

export default function VirtualJoystick({ onMove, onNeutral }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const activePointerRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (activePointerRef.current !== null) return;
    
    activePointerRef.current = e.pointerId;
    setIsActive(true);
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId || !containerRef.current) return;
    
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = e.clientX - rect.left - centerX;
    const deltaY = e.clientY - rect.top - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 10; // Keep knob inside
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    let magnitude = distance / maxDistance;
    
    // Clamp to circle
    if (magnitude > 1) {
      normalizedX /= magnitude;
      normalizedY /= magnitude;
      magnitude = 1;
    }
    
    setKnobPosition({
      x: normalizedX * maxDistance,
      y: normalizedY * maxDistance,
    });
    
    onMove({
      x: normalizedX,
      y: normalizedY,
      magnitude: Math.min(magnitude, 1),
    });
  }, [onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    
    e.stopPropagation();
    
    activePointerRef.current = null;
    setIsActive(false);
    setKnobPosition({ x: 0, y: 0 });
    onNeutral();
    
    const target = e.currentTarget;
    target.releasePointerCapture(e.pointerId);
  }, [onNeutral]);

  // Handle pointer cancel (e.g., when pointer leaves screen)
  useEffect(() => {
    const handlePointerCancel = () => {
      if (activePointerRef.current !== null) {
        activePointerRef.current = null;
        setIsActive(false);
        setKnobPosition({ x: 0, y: 0 });
        onNeutral();
      }
    };
    
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => window.removeEventListener('pointercancel', handlePointerCancel);
  }, [onNeutral]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 touch-none select-none cursor-pointer"
      style={{ touchAction: 'none' }}
    >
      {/* Base circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-game-field/60 to-game-field/40 backdrop-blur-md border-2 border-game-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Directional indicators */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1 sm:top-1.5 w-0.5 sm:w-1 h-2 sm:h-3 bg-game-border/30 rounded-full" />
          <div className="absolute bottom-1 sm:bottom-1.5 w-0.5 sm:w-1 h-2 sm:h-3 bg-game-border/30 rounded-full" />
          <div className="absolute left-1 sm:left-1.5 w-2 sm:w-3 h-0.5 sm:h-1 bg-game-border/30 rounded-full" />
          <div className="absolute right-1 sm:right-1.5 w-2 sm:w-3 h-0.5 sm:h-1 bg-game-border/30 rounded-full" />
        </div>
      </div>
      
      {/* Knob */}
      <div
        className={`absolute top-1/2 left-1/2 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full transition-all duration-75 ${
          isActive
            ? 'bg-gradient-to-br from-game-primary to-game-primary-hover shadow-[0_0_20px_rgba(255,100,0,0.8)] scale-110'
            : 'bg-gradient-to-br from-game-accent to-game-primary shadow-[0_0_14px_rgba(255,100,0,0.5)]'
        } border-2 border-white/30`}
        style={{
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px)) scale(${isActive ? 1.1 : 1})`,
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
      </div>
    </div>
  );
}
