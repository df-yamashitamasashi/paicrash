'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ArrowDown, ChevronsDown, Pause, Play, RotateCcw, HelpCircle } from 'lucide-react';

interface GameControlsProps {
  onMove: (direction: 'left' | 'right') => void;
  onDrop: () => void;
  onHardDrop: () => void;
  onPause: () => void;
  onReset: () => void;
  onShowGuide: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  isMobile?: boolean;
  hidePause?: boolean;
  hideReset?: boolean;
}

export function GameControls({
  onMove,
  onDrop,
  onHardDrop,
  onPause,
  onReset,
  onShowGuide,
  isPaused,
  isGameOver,
  isMobile = false,
  hidePause = false,
  hideReset = false,
}: GameControlsProps) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {/* Top row: Hard drop + action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onHardDrop}
            disabled={isPaused || isGameOver}
            className="flex-1 h-10 bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none"
          >
            <ChevronsDown className="h-4 w-4 mr-1" />
            ドロップ
          </Button>
          {!hidePause && (
          <Button
            variant="outline"
            size="icon"
            onClick={onPause}
            disabled={isGameOver}
            className="h-10 w-10 shrink-0"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          )}
          {!hideReset && (
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="h-10 w-10 shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onShowGuide}
            className="h-10 w-10 shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Bottom row: Direction controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => onMove('left')}
            disabled={isPaused || isGameOver}
            className="flex-1 h-12 text-lg bg-yellow-200 hover:bg-yellow-300 text-yellow-950 border-none"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button
            onClick={onDrop}
            disabled={isPaused || isGameOver}
            className="flex-1 h-12 text-lg bg-yellow-200 hover:bg-yellow-300 text-yellow-950 border-none"
          >
            <ArrowDown className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => onMove('right')}
            disabled={isPaused || isGameOver}
            className="flex-1 h-12 text-lg bg-yellow-200 hover:bg-yellow-300 text-yellow-950 border-none"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        {!hidePause && (
        <Button
          variant="outline"
          size="icon"
          onClick={onPause}
          disabled={isGameOver}
          className="h-10 w-10"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        )}
        {!hideReset && (
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          className="h-10 w-10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onShowGuide}
          className="h-10 w-10"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
      
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
