'use client';

import React, { useRef, useMemo } from 'react';
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
  highlightTiles?: MahjongTile[] | null;
}

export const GameBoardComponent = React.memo(function GameBoardComponent({
  board,
  currentTile,
  isGameOver = false,
  isPaused = false,
  isOpponent = false,
  scale = 1,
  isMobile = false,
  countdown,
  highlightTiles,
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
    if (!currentTile || !board?.tiles) return null;
    const x = currentTile.x;
    
    for (let y = 0; y < board.height; y++) {
      if (board.tiles[y]?.[x]) {
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
        {board.tiles?.map((row, y) =>
          row?.map((tile, x) =>
            tile ? (
              <div
                key={tile.id}
                className={cn(
                  "absolute transition-all duration-150",
                  highlightTiles && highlightTiles.length > 0 && "opacity-10 scale-95"
                )}
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
      
      {/* Highlighted Tiles from History (full opacity + border) */}
      {highlightTiles && highlightTiles.length > 0 && (
        <div className="absolute inset-2 z-20 pointer-events-none">
          {highlightTiles.map((tile, i) => (
            <div
              key={`highlight-${tile.id}-${i}`}
              className="absolute transition-all duration-150 animate-pulse"
              style={{
                left: tile.x * cellSize,
                top: tile.y * cellSize,
              }}
            >
              <div className="absolute inset-0 ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded-lg z-10" />
              <Tile
                tile={tile}
                size={tileSize as 'sm' | 'md'}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Ghost tile (landing preview) */}
      {currentTile && ghostY !== null && ghostY >= 0 && !isGameOver && !isPaused && !isYakumanAnimating && !isYakumanDissolving && (!highlightTiles || highlightTiles.length === 0) && (
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
      {currentTile && !isGameOver && !isPaused && !isYakumanAnimating && !isYakumanDissolving && (!highlightTiles || highlightTiles.length === 0) && (
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
      {isGameOver && (!highlightTiles || highlightTiles.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-200">
          <div className="bg-background/90 backdrop-blur-md px-8 py-6 rounded-2xl shadow-2xl border-2 border-destructive/50 text-center animate-yaku-announce pointer-events-auto">
            <h3 className={cn("font-extrabold text-destructive mb-1", isMobile ? "text-2xl" : "text-3xl")}>GAME OVER</h3>
            <p className="text-muted-foreground text-sm font-medium">ゲーム終了</p>
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

      {/* Yakuman Achievement Card — シェアしたくなるデザイン */}
      {!isOpponent && isYakumanAnimating && yakumanName && (() => {
        const score = useGameStore.getState().gameState.score;
        return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{ backgroundColor: 'oklch(0.18 0.02 50 / 0.82)', backdropFilter: 'blur(6px)' }}>
          {/* Warm radial glow behind card */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.80 0.12 80 / 0.12) 0%, transparent 70%)',
            }} />
          {/* Achievement card */}
          <div className="relative w-[82%] max-w-xs flex flex-col items-center py-6 px-5 rounded-2xl overflow-hidden animate-yakuman-entrance"
            style={{
              backgroundColor: 'oklch(0.26 0.03 50)',
              border: '1px solid oklch(0.75 0.12 80 / 0.25)',
              boxShadow: '0 12px 48px oklch(0.15 0.02 50 / 0.7), 0 0 0 1px oklch(0.80 0.12 80 / 0.08)',
            }}>
            {/* Shimmer sweep */}
            <div className="absolute inset-0 animate-yakuman-shimmer pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, oklch(0.95 0.02 80 / 0.06) 45%, oklch(0.95 0.02 80 / 0.10) 50%, oklch(0.95 0.02 80 / 0.06) 55%, transparent 60%)',
                backgroundSize: '200% 100%',
              }} />
            {/* Top accent */}
            <div className="w-8 h-px rounded-full mb-4"
              style={{ backgroundColor: 'oklch(0.80 0.15 80 / 0.5)' }} />
            {/* "YAKUMAN" label */}
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase mb-1"
              style={{ color: 'oklch(0.80 0.15 80 / 0.6)' }}>
              yakuman
            </span>
            {/* Divider dots */}
            <div className="flex gap-1 mb-3">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.15 80 / 0.3)' }} />
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.15 80 / 0.5)' }} />
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.15 80 / 0.3)' }} />
            </div>
            {/* Yakuman name — gold gradient hero text */}
            <span className="text-3xl md:text-4xl font-extrabold tracking-wider text-center leading-tight yakuman-gold-text">
              {yakumanName}
            </span>
            {/* Score */}
            <div className="flex flex-col items-center mt-4 gap-0.5">
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: 'oklch(0.60 0.04 60 / 0.6)' }}>
                score
              </span>
              <span className="text-lg font-bold tabular-nums tracking-wide"
                style={{ color: 'oklch(0.92 0.02 85)' }}>
                {score.toLocaleString()}
              </span>
            </div>
            {/* Bottom divider */}
            <div className="w-16 h-px rounded-full mt-4 mb-3"
              style={{ backgroundColor: 'oklch(0.80 0.15 80 / 0.2)' }} />
            {/* Brand */}
            <span className="text-[10px] font-extrabold tracking-[0.15em]"
              style={{ color: 'oklch(0.55 0.04 50 / 0.5)' }}>
              PaiCrash
            </span>
          </div>
        </div>
        );
      })()}
      
      </div>
    </div>
  );
});
