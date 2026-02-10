import { type ReactNode } from 'react';

interface PlayfieldProps {
  children: ReactNode;
}

export default function Playfield({ children }: PlayfieldProps) {
  return (
    <div className="relative h-full w-full">
      <div className="relative w-full h-full border-[3px] sm:border-4 border-game-border rounded-none bg-game-field shadow-game overflow-hidden">
        {/* Corner accents - positioned to meet border cleanly */}
        <div className="absolute top-[-1px] left-[-1px] w-4 h-4 sm:w-5 sm:h-5 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-game-accent" />
        <div className="absolute top-[-1px] right-[-1px] w-4 h-4 sm:w-5 sm:h-5 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-game-accent" />
        <div className="absolute bottom-[-1px] left-[-1px] w-4 h-4 sm:w-5 sm:h-5 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-game-accent" />
        <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 sm:w-5 sm:h-5 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-game-accent" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(var(--game-accent)) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(var(--game-accent)) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />

        {children}
      </div>
    </div>
  );
}
