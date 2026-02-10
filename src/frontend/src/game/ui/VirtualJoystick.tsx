import { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number; magnitude: number }) => void;
  onNeutral: () => void;
  resetToken?: number;
}

export default function VirtualJoystick({ onMove, onNeutral, resetToken }: VirtualJoystickProps) {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);

  const maxDistance = 32; // Reduced from 40

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
      className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-game-field/60 backdrop-blur-sm border-2 border-game-border shadow-game touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Knob */}
      <div
        className="absolute top-1/2 left-1/2 w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full bg-game-primary border-2 border-game-accent shadow-lg pointer-events-none"
        style={{
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
          transition: activePointerRef.current === null ? 'transform 0.1s ease-out' : 'none',
        }}
      />
    </div>
  );
}
