'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCpuGame } from '@/hooks/use-cpu-game';
import { GameBoardComponent } from './game-board';
import { GameStats } from './game-stats';
import { GameControls } from './game-controls';
import { YakuGuide } from './yaku-guide';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Bot } from 'lucide-react';
import { Tile } from './tile';
import { cn } from '@/lib/utils';

interface CpuGameProps {
  onGameEnd: (payload: { winnerName: string; isPlayerWin: boolean }) => void;
}

export function CpuGame({ onGameEnd }: CpuGameProps) {
  const { 
    playerState, 
    cpuState, 
    playerAnimBoard,
    isGameOver, 
    winner, 
    startMatch, 
    sendPlayerInput,
    isPaused,
    togglePause,
    cpuSpeed,
    setCpuSpeed,
    countdown
  } = useCpuGame();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    startMatch();
  }, [startMatch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!playerState || playerState.isGameOver || isGameOver) {
        // Allow reset even when game is over
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          startMatch();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          sendPlayerInput('move-left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          sendPlayerInput('move-right');
          break;
        case ' ':
          e.preventDefault();
          sendPlayerInput('hard-drop');
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          startMatch();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setShowGuide(true);
          break;
      }
    },
    [playerState, sendPlayerInput, isGameOver, togglePause, startMatch],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isGameOver && winner) {
      const timer = setTimeout(() => {
        onGameEnd({
          winnerName: winner === 'player' ? 'あなた' : 'CPU',
          isPlayerWin: winner === 'player',
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, winner, onGameEnd]);

  if (!playerState || !cpuState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">試合準備中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:flex flex-col items-center gap-4 pb-32 md:pb-0 w-full max-w-full">
        <div className="flex items-center justify-center gap-8 w-full">
          <div className="text-center">
            <Badge variant="default" className="mb-1">YOU</Badge>
            <p className="font-bold">あなた</p>
            <p className="text-2xl font-mono text-primary">{playerState.score.toLocaleString()}</p>
          </div>
          <div className="text-3xl font-bold text-muted-foreground">VS</div>
          <div className="text-center">
            <Badge variant="secondary" className="mb-1">CPU</Badge>
            <p className="font-bold flex items-center gap-1 justify-center"><Bot className="w-4 h-4"/> CPU</p>
            <p className="text-2xl font-mono text-accent">
              {cpuState.score.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-row gap-4 lg:gap-8 items-start w-full max-w-full justify-center">
          <div className="flex flex-col items-center gap-4">
            <GameBoardComponent
              board={playerAnimBoard || playerState.board}
              currentTile={playerAnimBoard ? null : playerState.currentTile}
              isGameOver={playerState.isGameOver}
              isPaused={isPaused}
              countdown={countdown}
            />
          </div>

          <div className="hidden md:flex flex-col items-center gap-4">
            {/* CPU Difficulty / Speed adjustment */}
            <div className="flex flex-col items-center gap-1.5 bg-card/60 backdrop-blur-md p-3 rounded-2xl border border-border/40 w-full shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground block text-center">CPU難易度 (反応速度)</span>
              <div className="flex gap-1 p-0.5 bg-muted/60 rounded-lg w-full justify-around">
                {(['slow', 'normal', 'fast', 'insane'] as const).map((speed) => {
                  const label = { slow: '遅い', normal: '普通', fast: '速い', insane: '鬼神' }[speed];
                  const isActive = cpuSpeed === speed;
                  return (
                    <button
                      key={speed}
                      onClick={() => setCpuSpeed(speed)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer flex-1 text-center",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                          : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <GameStats
              score={playerState.score}
              level={playerState.level}
              combo={playerState.combo}
              maxCombo={playerState.maxCombo}
              nextTile={playerState.nextTile}
              doraIndicator={playerState.doraIndicator}
              uraDoraIndicator={playerState.uraDoraIndicator}
              lastYaku={playerState.lastYaku}
              clearHistory={playerState.clearHistory}
            />
            <GameControls
              onMove={(dir) => sendPlayerInput(dir === 'left' ? 'move-left' : 'move-right')}
              onDrop={() => {}}
              onHardDrop={() => sendPlayerInput('hard-drop')}
              onPause={togglePause}
              onReset={startMatch}
              onShowGuide={() => setShowGuide(true)}
              isPaused={isPaused}
              isGameOver={isGameOver}
            />
          </div>

          {/* CPU Board Panel */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-between items-center w-full px-2 mb-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">おじゃま</span>
                <span className="text-lg font-mono font-bold text-destructive">
                  {cpuState.garbageQueue}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">NEXT</span>
                <div className="h-10 flex items-center justify-center">
                  {cpuState.nextTile && <Tile tile={cpuState.nextTile} size="sm" />}
                </div>
              </div>
            </div>
            <div className="scale-[0.8] origin-top border-2 border-border/30 rounded-lg p-2 bg-card relative">
              <GameBoardComponent
                board={cpuState.board}
                currentTile={cpuState.currentTile}
                isGameOver={cpuState.isGameOver}
                isPaused={false}
                isOpponent={true}
                countdown={countdown}
              />
              {cpuState.isGameOver && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10 rounded-lg">
                  <div className="text-destructive font-bold text-2xl tracking-widest bg-background/90 px-4 py-2 border-y-4 border-destructive w-full text-center shadow-lg">
                    GAME OVER
                  </div>
                </div>
              )}
            </div>
            {cpuState.lastYaku && (
              <Badge variant="secondary" className="mt-2 text-xs font-bold animate-pulse">
                CPU: {cpuState.lastYaku.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mobile layout - fixed viewport */}
      <div className="flex md:hidden flex-col h-[100dvh] overflow-hidden">
        {/* Compact stats bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-card/50 border-b border-border shrink-0">
          <div className="text-center w-1/3">
            <span className="text-[10px] text-muted-foreground block">YOU</span>
            <span className="text-sm font-mono text-primary font-bold">
              {playerState.score.toLocaleString()}
            </span>
          </div>
          <div className="text-xs font-bold text-muted-foreground w-1/3 text-center">VS</div>
          <div className="text-center w-1/3">
            <span className="text-[10px] text-muted-foreground block flex items-center justify-center gap-1"><Bot className="w-3 h-3"/> CPU</span>
            <span className="text-sm font-mono text-accent font-bold">
              {cpuState.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Mobile difficulty selector */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-card/30 border-b border-border/50 shrink-0 text-xs gap-2">
          <span className="text-[10px] font-bold text-muted-foreground shrink-0">CPU速度:</span>
          <div className="flex gap-1 p-0.5 bg-muted/80 rounded-md flex-1 justify-around">
            {(['slow', 'normal', 'fast', 'insane'] as const).map((speed) => {
              const label = { slow: '遅い', normal: '普通', fast: '速い', insane: '鬼神' }[speed];
              const isActive = cpuSpeed === speed;
              return (
                <button
                  key={speed}
                  onClick={() => setCpuSpeed(speed)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded transition-all duration-155 cursor-pointer flex-1 text-center",
                    isActive 
                      ? "bg-primary text-primary-foreground font-extrabold" 
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Area - fills remaining space */}
        <div className="flex-1 flex flex-row items-center justify-center gap-1 min-h-0 px-1 py-2">
          {/* Player Main Board */}
          <div className="flex-1 flex justify-end items-center h-full max-h-full">
            <div className="scale-[0.95] sm:scale-100 origin-right">
              <GameBoardComponent
                board={playerState.board}
                currentTile={playerState.currentTile}
                isGameOver={playerState.isGameOver}
                isPaused={isPaused}
                isMobile
                countdown={countdown}
              />
            </div>
          </div>

          {/* Mobile middle stats */}
          <div className="flex flex-col gap-2 w-10 shrink-0 justify-center items-center">
             <div className="flex flex-col items-center bg-card p-1 rounded border shadow-sm w-full">
              <span className="text-[8px] text-muted-foreground font-medium">NEXT</span>
              {playerState.nextTile && <Tile tile={playerState.nextTile} size="sm" />}
            </div>
             <div className="flex flex-col items-center bg-card p-1 rounded border shadow-sm w-full">
              <span className="text-[8px] text-muted-foreground font-medium">ドラ</span>
              {playerState.doraIndicator && <Tile tile={playerState.doraIndicator} size="sm" />}
            </div>
             <div className="flex flex-col items-center bg-destructive/10 p-1 rounded border border-destructive/30 shadow-sm w-full mt-1">
              <span className="text-[8px] text-destructive font-bold text-center leading-tight">おじゃま</span>
              <span className="text-base font-mono font-bold text-destructive leading-none mt-1">
                {playerState.garbageQueue}
              </span>
            </div>
          </div>

          {/* CPU Small Board */}
          <div className="flex-1 flex justify-start items-center h-full max-h-full">
            <div className="scale-[0.6] origin-left flex flex-col items-center">
              <div className="border border-border/30 rounded bg-card p-1 relative">
                <GameBoardComponent
                  board={cpuState.board}
                  currentTile={cpuState.currentTile}
                  isGameOver={cpuState.isGameOver}
                  isPaused={false}
                  isOpponent={true}
                  isMobile
                  countdown={countdown}
                />
                 {cpuState.isGameOver && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10 rounded">
                    <div className="text-destructive font-bold text-xl tracking-widest bg-background/90 px-2 py-1 w-full text-center">
                      OUT
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1 w-full bg-destructive/10 border border-destructive/20 p-2 rounded">
                 <span className="text-[10px] text-destructive font-bold">CPUおじゃま</span>
                 <span className="text-xl font-mono font-bold text-destructive leading-none">{cpuState.garbageQueue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom controls */}
        <div className="shrink-0 p-2 bg-card/80 border-t border-border backdrop-blur-sm relative z-50">
          <GameControls
            onMove={(dir) => sendPlayerInput(dir === 'left' ? 'move-left' : 'move-right')}
            onDrop={() => {}}
            onHardDrop={() => sendPlayerInput('hard-drop')}
            onPause={togglePause}
            onReset={startMatch}
            onShowGuide={() => setShowGuide(true)}
            isPaused={isPaused}
            isGameOver={isGameOver}
            isMobile
          />
        </div>
      </div>

      <YakuGuide open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}
