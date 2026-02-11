import { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onNeutral: () => void;
  resetToken?: number;
}

const DEADZONE_PIXELS = 5; // Small deadzone in pixels to prevent micro-movements

export default function VirtualJoystick({ onMove, onNeutral, resetToken }: VirtualJoystickProps) {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);

  const maxDistance = 28; // Reduced for compact mode

  useEffect(() => {
    if (resetToken !== undefined) {
      activePointerRef.current = null;
      setKnobPosition({ x: 0, y: 0 });
      onNeutral();
    }
  }, [resetToken, onNeutral]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    updateKnobPosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    updateKnobPosition(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    e.currentTarget.releasePointerCapture(e.pointerId);
    activePointerRef.current = null;
    setKnobPosition({ x: 0, y: 0 });
    onNeutral();
  };

  const updateKnobPosition = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!baseRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Apply deadzone - if within deadzone pixels, report neutral
    if (distance < DEADZONE_PIXELS) {
      setKnobPosition({ x: 0, y: 0 });
      onNeutral();
      return;
    }

    const clampedDistance = Math.min(distance, maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * clampedDistance;
    const y = Math.sin(angle) * clampedDistance;

    setKnobPosition({ x, y });

    const magnitude = clampedDistance / maxDistance;
    onMove({ x, y, magnitude });
  };

  return (
    <div
      ref={baseRef}
      className="relative rounded-full bg-game-field/60 backdrop-blur-sm border-2 border-game-border shadow-game touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: 'var(--compact-control-size)',
        height: 'var(--compact-control-size)',
        minWidth: '44px',
        minHeight: '44px',
      }}
    >
      {/* Knob */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full bg-game-primary border-2 border-game-accent shadow-lg pointer-events-none"
        style={{
          width: 'calc(var(--compact-control-icon-size) * 1.25)',
          height: 'calc(var(--compact-control-icon-size) * 1.25)',
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
          transition: activePointerRef.current === null ? 'transform 0.1s ease-out' : 'none',
        }}
      />
    </div>
  );
}
