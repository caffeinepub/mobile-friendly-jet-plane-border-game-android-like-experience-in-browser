import { type ReactNode } from 'react';

interface PlayfieldProps {
  children: ReactNode;
}

export default function Playfield({ children }: PlayfieldProps) {
  return (
    <div className="relative h-full w-full">
      <div 
        className="relative w-full h-full border-game-border rounded-none bg-game-field shadow-game overflow-hidden"
        style={{ borderWidth: 'var(--compact-border-width)' }}
      >
        {/* Corner accents - positioned to meet border cleanly */}
        <div 
          className="absolute top-[-1px] left-[-1px] border-game-accent" 
          style={{ 
            width: 'var(--compact-corner-size)',
            height: 'var(--compact-corner-size)',
            borderTopWidth: 'var(--compact-border-width)',
            borderLeftWidth: 'var(--compact-border-width)',
          }}
        />
        <div 
          className="absolute top-[-1px] right-[-1px] border-game-accent" 
          style={{ 
            width: 'var(--compact-corner-size)',
            height: 'var(--compact-corner-size)',
            borderTopWidth: 'var(--compact-border-width)',
            borderRightWidth: 'var(--compact-border-width)',
          }}
        />
        <div 
          className="absolute bottom-[-1px] left-[-1px] border-game-accent" 
          style={{ 
            width: 'var(--compact-corner-size)',
            height: 'var(--compact-corner-size)',
            borderBottomWidth: 'var(--compact-border-width)',
            borderLeftWidth: 'var(--compact-border-width)',
          }}
        />
        <div 
          className="absolute bottom-[-1px] right-[-1px] border-game-accent" 
          style={{ 
            width: 'var(--compact-corner-size)',
            height: 'var(--compact-corner-size)',
            borderBottomWidth: 'var(--compact-border-width)',
            borderRightWidth: 'var(--compact-border-width)',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(var(--game-accent)) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(var(--game-accent)) 1px, transparent 1px)
            `,
            backgroundSize: 'var(--compact-grid-size) var(--compact-grid-size)',
          }}
        />

        {children}
      </div>
    </div>
  );
}
