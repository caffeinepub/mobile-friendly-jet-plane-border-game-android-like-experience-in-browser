import GameScreen from './game/GameScreen';
import OrientationGuard from './game/ui/OrientationGuard';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <OrientationGuard>
        <GameScreen />
      </OrientationGuard>
    </div>
  );
}

export default App;
