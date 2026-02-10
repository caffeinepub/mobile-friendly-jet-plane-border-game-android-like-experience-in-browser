import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

interface ShootButtonProps {
  onFireStart: () => void;
  onFireEnd: () => void;
  disabled?: boolean;
}

export default function ShootButton({ onFireStart, onFireEnd, disabled = false }: ShootButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFiringRef = useRef(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (disabled) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      if (!isFiringRef.current) {
        isFiringRef.current = true;
        onFireStart();
        button.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isFiringRef.current) {
        isFiringRef.current = false;
        onFireEnd();
        if (button.hasPointerCapture(e.pointerId)) {
          button.releasePointerCapture(e.pointerId);
        }
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isFiringRef.current) {
        isFiringRef.current = false;
        onFireEnd();
        if (button.hasPointerCapture(e.pointerId)) {
          button.releasePointerCapture(e.pointerId);
        }
      }
    };

    const handlePointerLeave = (e: PointerEvent) => {
      // Only stop firing if we don't have pointer capture
      if (isFiringRef.current && !button.hasPointerCapture(e.pointerId)) {
        isFiringRef.current = false;
        onFireEnd();
      }
    };

    button.addEventListener('pointerdown', handlePointerDown);
    button.addEventListener('pointerup', handlePointerUp);
    button.addEventListener('pointercancel', handlePointerCancel);
    button.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      button.removeEventListener('pointerdown', handlePointerDown);
      button.removeEventListener('pointerup', handlePointerUp);
      button.removeEventListener('pointercancel', handlePointerCancel);
      button.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [onFireStart, onFireEnd, disabled]);

  // Clean up firing state when disabled
  useEffect(() => {
    if (disabled && isFiringRef.current) {
      isFiringRef.current = false;
      onFireEnd();
    }
  }, [disabled, onFireEnd]);

  return (
    <Button
      ref={buttonRef}
      disabled={disabled}
      size="lg"
      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-game-primary/90 hover:bg-game-primary border-4 border-game-border shadow-lg shadow-game-primary/50 active:scale-95 transition-all touch-none select-none"
    >
      <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
    </Button>
  );
}
