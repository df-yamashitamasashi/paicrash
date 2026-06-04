'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ArrowDown, ChevronsDown, Pause, Play, RotateCcw, HelpCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  onMove: (direction: 'left' | 'right') => void;
  onDrop: () => void;
  onHardDrop: () => void;
  onPause: () => void;
  onReset: () => void;
  onShowGuide: () => void;
  onShowHistory?: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  isMobile?: boolean;
  hidePause?: boolean;
  hideReset?: boolean;
  hideMobileActions?: boolean;
}

export function GameActionButtons({
  onPause,
  onReset,
  onShowGuide,
  onShowHistory,
  isPaused,
  isGameOver,
  hidePause = false,
  hideReset = false,
  className,
  size = 'icon',
}: {
  onPause: () => void;
  onReset: () => void;
  onShowGuide: () => void;
  onShowHistory?: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  hidePause?: boolean;
  hideReset?: boolean;
  className?: string;
  size?: 'sm' | 'icon';
}) {
  const btnClass = cn(
    "shrink-0 rounded-full bg-card/80 backdrop-blur-sm",
    size === 'icon' ? "h-10 w-10" : "h-8 w-8 px-0"
  );
  const iconClass = size === 'icon' ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {onShowHistory && (
        <Button
          variant="outline"
          size={size}
          onClick={onShowHistory}
          className={btnClass}
          title="履歴"
        >
          <History className={iconClass} />
        </Button>
      )}
      {!hidePause && (
        <Button
          variant="outline"
          size={size}
          onClick={onPause}
          disabled={isGameOver}
          className={btnClass}
          title="一時停止"
        >
          {isPaused ? <Play className={iconClass} /> : <Pause className={iconClass} />}
        </Button>
      )}
      {!hideReset && (
        <Button
          variant="outline"
          size={size}
          onClick={onReset}
          className={btnClass}
          title="リセット"
        >
          <RotateCcw className={iconClass} />
        </Button>
      )}
      <Button
        variant="outline"
        size={size}
        onClick={onShowGuide}
        className={btnClass}
        title="ヘルプ"
      >
        <HelpCircle className={iconClass} />
      </Button>
    </div>
  );
}

export function GameControls({
  onMove,
  onDrop,
  onHardDrop,
  onPause,
  onReset,
  onShowGuide,
  onShowHistory,
  isPaused,
  isGameOver,
  isMobile = false,
  hidePause = false,
  hideReset = false,
  hideMobileActions = false,
}: GameControlsProps) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 pb-2">
        {/* Action bar */}
        {!hideMobileActions && (
          <div className="flex justify-end">
            <GameActionButtons
              onPause={onPause}
              onReset={onReset}
              onShowGuide={onShowGuide}
              onShowHistory={onShowHistory}
              isPaused={isPaused}
              isGameOver={isGameOver}
              hidePause={hidePause}
              hideReset={hideReset}
            />
          </div>
        )}

        {/* Hard Drop Row */}
        <div className="flex px-4">
          <Button
            onClick={onHardDrop}
            disabled={isPaused || isGameOver}
            className="flex-1 h-12 bg-yellow-200/90 hover:bg-yellow-300 text-yellow-950 font-bold border-none rounded-xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            <ChevronsDown className="h-5 w-5 mr-1" />
            HARD DROP
          </Button>
        </div>
        
        {/* Bottom row: Direction controls */}
        <div className="flex gap-3 px-2">
          <Button
            onClick={() => onMove('left')}
            disabled={isPaused || isGameOver}
            className="flex-1 h-16 text-xl bg-blue-200/90 hover:bg-blue-300 text-blue-950 border-none rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>
          <Button
            onClick={onDrop}
            disabled={isPaused || isGameOver}
            className="flex-1 h-16 text-xl bg-slate-200/90 hover:bg-slate-300 text-slate-950 border-none rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <ArrowDown className="h-8 w-8" />
          </Button>
          <Button
            onClick={() => onMove('right')}
            disabled={isPaused || isGameOver}
            className="flex-1 h-16 text-xl bg-blue-200/90 hover:bg-blue-300 text-blue-950 border-none rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <ArrowRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Action buttons */}
      <GameActionButtons
        onPause={onPause}
        onReset={onReset}
        onShowGuide={onShowGuide}
        onShowHistory={onShowHistory}
        isPaused={isPaused}
        isGameOver={isGameOver}
        hidePause={hidePause}
        hideReset={hideReset}
      />
      
      {/* Keyboard hints (desktop) */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] mx-1">→</kbd>
          移動
        </p>
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↓</kbd>
          落下
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] ml-2">Space</kbd>
          ハードドロップ
        </p>
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">P</kbd>
          一時停止
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] ml-2">R</kbd>
          リセット
        </p>
      </div>
    </div>
  );
}
