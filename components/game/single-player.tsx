'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import { getTileDisplay } from '@/lib/mahjong-types';
import type { MahjongTile } from '@/lib/mahjong-types';
import { GameBoardComponent } from './game-board';
import { GameStats } from './game-stats';
import { GameControls } from './game-controls';
import { YakuGuide } from './yaku-guide';
import { HistoryDialog } from './history-dialog';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface SinglePlayerGameProps {
  onMultiplayerClick?: () => void;
}

export function SinglePlayerGame({ onMultiplayerClick }: SinglePlayerGameProps) {
  const { gameState, startGame, moveTile, dropTile, hardDrop, tick, togglePause, reset } = useGameStore();
  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredTiles, setHoveredTiles] = useState<MahjongTile[] | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  
  // Start game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);
  
  // Game loop
  useEffect(() => {
    const baseSpeed = 1000;
    const speed = Math.max(100, baseSpeed - (gameState.level - 1) * 100);
    
    const runTick = () => {
      const now = Date.now();
      if (now - lastTickRef.current >= speed) {
        tick();
        lastTickRef.current = now;
      }
      if (!gameState.isGameOver && !gameState.isPaused) {
        tickRef.current = setTimeout(runTick, 50);
      }
    };
    
    if (!gameState.isGameOver && !gameState.isPaused) {
      tickRef.current = setTimeout(runTick, speed);
    }
    
    return () => {
      if (tickRef.current) {
        clearTimeout(tickRef.current);
      }
    };
  }, [gameState.isGameOver, gameState.isPaused, gameState.level, tick]);
  
  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.isGameOver) {
      if (e.key === 'r' || e.key === 'R') {
        reset();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveTile('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveTile('right');
        break;
      case 'ArrowDown':
        e.preventDefault();
        dropTile();
        break;
      case ' ':
        e.preventDefault();
        hardDrop();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        togglePause();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        reset();
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        setShowGuide(true);
        break;
    }
  }, [gameState.isGameOver, moveTile, dropTile, hardDrop, togglePause, reset]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col items-center gap-6">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-lg">
          <h1 className="text-2xl font-bold text-primary">
            PaiCrash
          </h1>
          <div className="flex items-center gap-2 mr-32">
            {onMultiplayerClick && (
              <Button variant="outline" size="sm" onClick={onMultiplayerClick}>
                <Users className="h-4 w-4 mr-2" />
                オンライン対戦
              </Button>
            )}
          </div>
        </div>
        
        {/* Game area */}
        <div className="flex flex-row gap-6 items-start">
          {/* Main board */}
          <GameBoardComponent
            board={gameState.board}
            currentTile={gameState.currentTile}
            isGameOver={gameState.isGameOver}
            isPaused={gameState.isPaused}
            highlightTiles={hoveredTiles}
          />
          
          {/* Side panel */}
          <div className="flex flex-col gap-4">
            <GameStats
              score={gameState.score}
              level={gameState.level}
              combo={gameState.combo}
              maxCombo={gameState.maxCombo}
              nextTile={gameState.nextTile}
              doraIndicator={gameState.doraIndicator}
              uraDoraIndicator={gameState.uraDoraIndicator}
              lastYaku={gameState.lastYaku}
              clearHistory={gameState.clearHistory}
              onHoverHistory={setHoveredTiles}
            />
            
            <GameControls
              onMove={moveTile}
              onDrop={dropTile}
              onHardDrop={hardDrop}
              onPause={togglePause}
              onReset={reset}
              onShowGuide={() => setShowGuide(true)}
              isPaused={gameState.isPaused}
              isGameOver={gameState.isGameOver}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile layout - fixed viewport */}
      <div className="flex md:hidden flex-col h-[100dvh] overflow-hidden">
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 py-2 bg-card/50 border-b border-border shrink-0">
          <h1 className="text-lg font-bold text-primary">
            PaiCrash
          </h1>
          <div className="flex items-center gap-2 mr-32">
            {onMultiplayerClick && (
              <Button variant="ghost" size="sm" onClick={onMultiplayerClick} className="h-8 px-2">
                <Users className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Compact stats bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-card/30 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Score</div>
              <div className="text-sm font-bold text-primary">{gameState.score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Lv</div>
              <div className="text-sm font-bold">{gameState.level}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Combo</div>
              <div className="text-sm font-bold">{gameState.combo > 0 ? `x${gameState.combo}` : '-'}</div>
            </div>
          </div>
          {/* Next tile preview */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase">Next</span>
            {gameState.nextTile && (
              <div className="w-8 h-10 rounded bg-gradient-to-b from-white to-gray-100 border border-gray-300 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold" style={{ color: getTileColor(gameState.nextTile.suit) }}>
                  {getTileDisplay(gameState.nextTile)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Yaku announcement */}
        {gameState.lastYaku && (
          <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/30 shrink-0">
            <div className="text-center">
              <span className="text-sm font-bold text-primary animate-pulse">
                {gameState.lastYaku.japaneseName} ({gameState.lastYaku.han}翻)
              </span>
            </div>
          </div>
        )}
        
        {/* Game board - fills remaining space */}
        <div className="flex-1 flex items-center justify-center p-2 min-h-0">
          <GameBoardComponent
            board={gameState.board}
            currentTile={gameState.currentTile}
            isGameOver={gameState.isGameOver}
            isPaused={gameState.isPaused}
            highlightTiles={hoveredTiles}
            isMobile
          />
        </div>
        
        {/* Fixed bottom controls */}
        <div className="shrink-0 p-3 bg-card/80 border-t border-border backdrop-blur-sm">
          <GameControls
            onMove={moveTile}
            onDrop={dropTile}
            onHardDrop={hardDrop}
            onPause={togglePause}
            onReset={reset}
            onShowGuide={() => setShowGuide(true)}
            onShowHistory={() => setShowHistory(true)}
            isPaused={gameState.isPaused}
            isGameOver={gameState.isGameOver}
            isMobile
          />
        </div>
      </div>
      
      {/* Yaku guide modal */}
      <YakuGuide open={showGuide} onOpenChange={setShowGuide} />

      {/* History modal */}
      <HistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        history={gameState.clearHistory}
        onHoverItem={setHoveredTiles}
      />
    </>
  );
}

// Helper function for mobile tile color
function getTileColor(suit: string): string {
  switch (suit) {
    case 'manzu': return '#dc2626'; // Red for characters
    case 'pinzu': return '#2563eb'; // Blue for dots
    case 'souzu': return '#16a34a'; // Green for bamboo
    default: return '#1f2937'; // Dark for honors
  }
}
