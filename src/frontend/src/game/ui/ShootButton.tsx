import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useRef } from 'react';

interface ShootButtonProps {
  onFireStart: () => void;
  onFireEnd: () => void;
  disabled?: boolean;
}

export default function ShootButton({ onFireStart, onFireEnd, disabled = false }: ShootButtonProps) {
  const activePointerRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || activePointerRef.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    onFireStart();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    e.currentTarget.releasePointerCapture(e.pointerId);
    activePointerRef.current = null;
    onFireEnd();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    activePointerRef.current = null;
    onFireEnd();
  };

  return (
    <Button
      size="icon"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      disabled={disabled}
      className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-game-secondary hover:bg-game-secondary-hover border-2 border-game-border shadow-game-button hover:shadow-game-button-hover active:scale-95 transition-all touch-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-game-accent" fill="currentColor" />
    </Button>
  );
}
