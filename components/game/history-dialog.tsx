'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import type { ClearResult, MahjongTile } from '@/lib/mahjong-types';
import { HistoryRow } from './clear-history';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: ClearResult[];
  onHoverItem?: (tiles: MahjongTile[] | null) => void;
}

export function HistoryDialog({ open, onOpenChange, history, onHoverItem }: HistoryDialogProps) {
  const reversed = [...history].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] bg-card border-border flex flex-col p-4">
        <DialogHeader className="shrink-0 pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            消去履歴
            {history.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-mono">
                {history.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 mt-2">
          <div className="divide-y divide-border/40">
            {reversed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                まだ消した牌はありません
              </p>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
