import { type ReactNode } from 'react';

interface PlayfieldProps {
  children: ReactNode;
}

export default function Playfield({ children }: PlayfieldProps) {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-10">
      <div className="relative w-full h-full border-[6px] border-game-border rounded-lg bg-game-field shadow-game overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-[6px] border-l-[6px] border-game-accent rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-[6px] border-r-[6px] border-game-accent rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[6px] border-l-[6px] border-game-accent rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[6px] border-r-[6px] border-game-accent rounded-br-lg" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(var(--game-accent)) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(var(--game-accent)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {children}
      </div>
    </div>
  );
}
