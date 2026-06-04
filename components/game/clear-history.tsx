'use client';

import { useState } from 'react';
import type { ClearResult, MahjongTile } from '@/lib/mahjong-types';
import { getTileDisplay, getTileKey } from '@/lib/mahjong-types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, History } from 'lucide-react';

interface ClearHistoryProps {
  history: ClearResult[];
  onHoverItem?: (tiles: MahjongTile[] | null) => void;
}

// Suit color for tile display
export function tileColor(suit: string): string {
  switch (suit) {
    case 'manzu': return 'text-red-600';
    case 'pinzu': return 'text-blue-600';
    case 'souzu': return 'text-emerald-600';
    default: return 'text-slate-700';
  }
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function ClearHistory({ history, onHoverItem }: ClearHistoryProps) {
  const [open, setOpen] = useState(false);

  // Show newest first
  const reversed = [...history].reverse();

  return (
    <div className="bg-card/50 rounded-xl border border-border backdrop-blur-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            履歴
          </span>
          {history.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-mono">
              {history.length}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>

      {/* History list */}
      {open && (
        <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
          {reversed.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">まだ消した牌はありません</p>
          ) : (
            reversed.map((result, i) => (
              <HistoryRow 
                key={`${result.timestamp}-${i}`} 
                result={result} 
                onHoverItem={onHoverItem}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function HistoryRow({ result, onHoverItem }: { result: ClearResult, onHoverItem?: (tiles: MahjongTile[] | null) => void }) {
  const isChain = result.chainCount > 0;

  return (
    <div 
      className={cn(
        'px-3 py-2 text-xs transition-colors hover:bg-muted/50 cursor-default',
        isChain && 'bg-primary/5',
      )}
      onMouseEnter={() => onHoverItem?.(result.tiles)}
      onMouseLeave={() => onHoverItem?.(null)}
    >
      {/* Top row: time + yaku + score */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground/60 font-mono shrink-0">
            {formatTime(result.timestamp)}
          </span>
          {result.yaku ? (
            <span className="font-bold text-primary truncate">
              {result.yaku.japaneseName}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {result.tiles.length}枚消し
            </span>
          )}
          {isChain && (
            <span className="shrink-0 text-[10px] bg-accent/20 text-accent-foreground rounded px-1 font-bold">
              {result.chainCount + 1}連鎖
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-primary shrink-0">
          +{result.score.toLocaleString()}
        </span>
      </div>

      {/* Tile list */}
      <div className="flex flex-wrap gap-0.5">
        {result.tiles
          .slice()
          .sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return (a.number ?? 0) - (b.number ?? 0);
          })
          .map((tile, j) => (
            <span
              key={`${tile.id}-${j}`}
              className={cn(
                'inline-flex items-baseline rounded px-1 py-0.5 font-bold leading-none gap-0.5',
                'bg-white/80 border border-gray-200 shadow-sm',
                tileColor(tile.suit),
              )}
              title={`消去座標: (${tile.x}, ${tile.y})`}
            >
              <span>{getTileDisplay(tile)}</span>
              <span className="text-[9px] font-normal text-muted-foreground/80 opacity-80" style={{ letterSpacing: '-0.5px' }}>
                ({tile.x},{tile.y})
              </span>
            </span>
          ))}
      </div>
    </div>
  );
}
