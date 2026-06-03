'use client';

import { TilePreview } from './tile';
import { ClearHistory } from './clear-history';
import type { MahjongTile, Yaku, ClearResult } from '@/lib/mahjong-types';
import { cn } from '@/lib/utils';

interface GameStatsProps {
  score: number;
  level: number;
  combo: number;
  maxCombo: number;
  nextTile: MahjongTile | null;
  doraIndicator?: MahjongTile | null;
  uraDoraIndicator?: MahjongTile | null;
  lastYaku: Yaku | null;
  garbageQueue?: number;
  clearHistory?: ClearResult[];
}

export function GameStats({
  score,
  level,
  combo,
  maxCombo,
  nextTile,
  doraIndicator,
  uraDoraIndicator,
  lastYaku,
  garbageQueue = 0,
  clearHistory = [],
}: GameStatsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card/50 rounded-xl border border-border backdrop-blur-sm">
      {/* Next tile */}
      <TilePreview tile={nextTile} label="NEXT" />
      {doraIndicator && (
        <TilePreview tile={doraIndicator} label="DORA" />
      )}
      {uraDoraIndicator && (
        <TilePreview tile={uraDoraIndicator} label="URA DORA" />
      )}

      {/* Score */}
      <div className="space-y-3">
        <StatItem label="SCORE" value={score.toLocaleString()} highlight />
        <StatItem label="LEVEL" value={level.toString()} />
        <StatItem label="COMBO" value={combo > 0 ? `x${combo}` : '-'} />
        <StatItem label="MAX" value={maxCombo > 0 ? `x${maxCombo}` : '-'} />
      </div>

      {/* Garbage queue indicator */}
      {garbageQueue > 0 && (
        <div className="p-2 bg-destructive/20 border border-destructive/50 rounded-lg animate-garbage-incoming">
          <div className="text-xs text-destructive font-medium text-center">
            おじゃま牌: {garbageQueue}
          </div>
        </div>
      )}

      {/* Last yaku */}
      {lastYaku && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg animate-combo-flash">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {lastYaku.japaneseName}
            </div>
            <div className="text-xs text-muted-foreground">
              {lastYaku.han}翻
            </div>
          </div>
        </div>
      )}

      {/* Clear history */}
      <ClearHistory history={clearHistory} />
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          'font-mono font-bold text-lg',
          highlight ? 'text-primary' : 'text-foreground'
        )}
      >
        {value}
      </span>
    </div>
  );
}
