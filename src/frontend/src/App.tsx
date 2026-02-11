import { useEffect } from 'react';
import GameScreen from './game/GameScreen';
import OrientationGuard from './game/ui/OrientationGuard';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { InstallAffordance } from './pwa/InstallAffordance';

function App() {
  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="mobile-compact h-[100dvh] w-screen overflow-hidden bg-background" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      <InstallAffordance />
      <OrientationGuard>
        <GameScreen />
      </OrientationGuard>
    </div>
  );
}

export default App;
