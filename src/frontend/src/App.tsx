import GameScreen from './game/GameScreen';
import OrientationGuard from './game/ui/OrientationGuard';

function App() {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      <OrientationGuard>
        <GameScreen />
      </OrientationGuard>
    </div>
  );
}

export default App;
