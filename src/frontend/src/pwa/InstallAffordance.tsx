import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { useInstallPrompt } from './useInstallPrompt';

/**
 * Install affordance component
 * Shows a minimal install prompt when the app is installable
 */
export function InstallAffordance() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="bg-game-primary/95 backdrop-blur-sm border-2 border-game-border rounded-lg shadow-lg px-4 py-2 flex items-center gap-3 animate-in slide-in-from-top duration-300">
        <Download className="w-5 h-5 text-game-accent" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Install Jet Defender</span>
          <span className="text-xs text-white/70">Play offline like a native app</span>
        </div>
        <button
          onClick={handleInstall}
          className="ml-2 px-3 py-1.5 bg-game-accent hover:bg-game-accent/80 text-white text-sm font-medium rounded transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  );
}
