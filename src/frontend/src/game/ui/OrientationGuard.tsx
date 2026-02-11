import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

interface OrientationGuardProps {
  children: React.ReactNode;
}

export default function OrientationGuard({ children }: OrientationGuardProps) {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if device is in portrait mode
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    // Initial check
    checkOrientation();

    // Best-effort attempt to lock to landscape using Screen Orientation API
    const lockToLandscape = async () => {
      try {
        // Type-safe check for Screen Orientation API support
        if (screen.orientation && 'lock' in screen.orientation) {
          const orientation = screen.orientation as any;
          await orientation.lock('landscape').catch(() => {
            // Silently fail if lock is not supported or denied
          });
        }
      } catch (err) {
        // Silently fail - not all browsers support this
      }
    };

    lockToLandscape();

    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (isPortrait) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-game-field px-4">
        <div className="text-center flex flex-col items-center gap-4 max-w-xs">
          <RotateCw className="w-12 h-12 sm:w-16 sm:h-16 text-game-primary mx-auto animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Please Rotate Your Device
          </h2>
          <p className="text-sm sm:text-base text-white">
            This game is best played in landscape orientation for the optimal experience.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
