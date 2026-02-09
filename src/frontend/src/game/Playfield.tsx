import { type ReactNode } from 'react';

interface PlayfieldProps {
  children: ReactNode;
}

export default function Playfield({ children }: PlayfieldProps) {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="relative w-full h-full border-4 sm:border-[6px] border-game-border rounded-lg bg-game-field shadow-game overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 sm:border-t-[6px] border-l-4 sm:border-l-[6px] border-game-accent rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 sm:border-t-[6px] border-r-4 sm:border-r-[6px] border-game-accent rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 sm:border-b-[6px] border-l-4 sm:border-l-[6px] border-game-accent rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 sm:border-b-[6px] border-r-4 sm:border-r-[6px] border-game-accent rounded-br-lg" />

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
