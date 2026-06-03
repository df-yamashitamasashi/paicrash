'use client';

import { useRef, useMemo } from 'react';
import type { GameBoard, MahjongTile } from '@/lib/mahjong-types';
import { Tile } from './tile';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/lib/game-store';

interface GameBoardProps {
  board: GameBoard;
  currentTile: MahjongTile | null;
  isGameOver?: boolean;
  isPaused?: boolean;
  isOpponent?: boolean;
  scale?: number;
  isMobile?: boolean;
  countdown?: number | null;
}

export function GameBoardComponent({
  board,
  currentTile,
  isGameOver = false,
  isPaused = false,
  isOpponent = false,
  scale = 1,
  isMobile = false,
  countdown,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Read Yakuman and Countdown state from global game store
  const { isYakumanAnimating: globalYakumanAnimating, isYakumanDissolving: globalYakumanDissolving, yakumanName, countdown: storeCountdown } = useGameStore();
  
  // Scope animations to player's board only (unless we add opponent-specific yakuman state later)
  const isYakumanAnimating = !isOpponent && globalYakumanAnimating;
  const isYakumanDissolving = !isOpponent && globalYakumanDissolving;
  
  const activeCountdown = countdown !== undefined ? countdown : (isOpponent ? null : storeCountdown);
  
  // Calculate ghost position (where tile will land)
  const ghostY = useMemo(() => {
    if (!currentTile) return null;
    const x = currentTile.x;
    
    for (let y = 0; y < board.height; y++) {
      if (board.tiles[y][x] !== null) {
        return y - 1;
      }
    }
    return board.height - 1;
  }, [currentTile, board]);
  
  // Responsive cell size
  const cellSize = isOpponent ? 32 : isMobile ? 32 : 48;
  const tileSize = isOpponent ? 'sm' : isMobile ? 'sm' : 'md';
  
  // Calculate dimensions and final scale
  const baseWidth = board.width * cellSize + 16;
  const baseHeight = board.height * cellSize + 16;
  const finalScale = scale;

  return (
    <div
      style={{
        width: baseWidth * finalScale,
        height: baseHeight * finalScale,
        position: 'relative',
      }}
    >
      <div
        ref={boardRef}
        className={cn(
          'absolute top-0 left-0 bg-card/90 rounded-3xl border-4 border-primary/60 overflow-hidden',
          'shadow-[0_0_40px_rgba(var(--primary),0.3)] backdrop-blur-md',
          isYakumanAnimating && 'animate-yakuman-freeze' // Screen shake / freeze shake effect
        )}
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${finalScale})`,
          transformOrigin: 'top left',
        }}
      >
      {/* Background grid */}
      <div className="absolute inset-2 grid" style={{
        gridTemplateColumns: `repeat(${board.width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${board.height}, ${cellSize}px)`,
      }}>
        {Array.from({ length: board.width * board.height }).map((_, i) => (
          <div
            key={i}
            className="border border-border/30 bg-muted/20"
          />
        ))}
      </div>
      
      {/* Placed tiles */}
      <div className="absolute inset-2">
        {board.tiles.map((row, y) =>
          row.map((tile, x) =>
            tile ? (
              <div
                key={tile.id}
                className="absolute transition-all duration-150"
                style={{
                  left: x * cellSize,
                  top: y * cellSize,
                }}
              >
                <Tile
                  tile={tile}
                  size={tileSize as 'sm' | 'md'}
                  isClearing={tile.isClearing}
                  isYakuman={isYakumanAnimating && tile.suit !== 'ojama'}
                  isYakumanDissolving={isYakumanDissolving && tile.suit !== 'ojama' && tile.isClearing}
                />
              </div>
            ) : null
          )
        )}
      </div>
      
      {/* Ghost tile (landing preview) */}
      {currentTile && ghostY !== null && ghostY >= 0 && !isGameOver && !isPaused && !isYakumanAnimating && !isYakumanDissolving && (
        <div
          className="absolute transition-all duration-75"
          style={{
            left: currentTile.x * cellSize + 8,
            top: ghostY * cellSize + 8,
          }}
        >
          <Tile tile={currentTile} size={tileSize as 'sm' | 'md'} isGhost />
        </div>
      )}
      
      {/* Current falling tile */}
      {currentTile && !isGameOver && !isPaused && !isYakumanAnimating && !isYakumanDissolving && (
        <div
          className="absolute transition-all duration-75 z-10"
          style={{
            left: currentTile.x * cellSize + 8,
            top: currentTile.y * cellSize + 8,
          }}
        >
          <Tile tile={currentTile} size={tileSize as 'sm' | 'md'} />
        </div>
      )}
      
      {/* Countdown overlay */}
      {activeCountdown !== null && activeCountdown !== undefined && activeCountdown > 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-40">
          <div className="text-center animate-pulse">
            <span className="font-extrabold text-white text-8xl md:text-9xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {activeCountdown}
            </span>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center animate-yaku-announce">
            <h3 className={cn("font-bold text-destructive mb-2", isMobile ? "text-xl" : "text-2xl")}>GAME OVER</h3>
            <p className="text-muted-foreground text-sm">ゲーム終了</p>
          </div>
        </div>
      )}
      
      {/* Paused overlay */}
      {isPaused && !isGameOver && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h3 className={cn("font-bold text-primary mb-2", isMobile ? "text-xl" : "text-2xl")}>PAUSED</h3>
            <p className="text-muted-foreground text-sm">一時停止中</p>
          </div>
        </div>
      )}

      {/* Yakuman Marquee Overlay Banner */}
      {!isOpponent && isYakumanAnimating && yakumanName && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-xs">
          <div className="w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 border-y-4 border-yellow-300 py-3 shadow-[0_0_30px_#eab308] overflow-hidden">
            <div className="animate-yakuman-banner whitespace-nowrap text-center font-extrabold text-black tracking-widest text-2xl md:text-3xl drop-shadow-md">
              ⚡ 役満 ⚡ 【 {yakumanName} 】 ⚡ 役満 ⚡
            </div>
          </div>
          <span className="text-[10px] text-yellow-300 font-bold mt-2 animate-pulse">
            SCREEN FROZEN — DEVASTATING DAMAGE DETECTED
          </span>
        </div>
      )}
      
      </div>
    </div>
  );
}
