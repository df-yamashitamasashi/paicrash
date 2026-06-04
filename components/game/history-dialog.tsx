'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History, X, Maximize2, Minimize2 } from 'lucide-react';
import type { ClearResult, MahjongTile } from '@/lib/mahjong-types';
import { HistoryRow } from './clear-history';
import { cn } from '@/lib/utils';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: ClearResult[];
  onHoverItem?: (tiles: MahjongTile[] | null) => void;
}

export function HistoryDialog({ open, onOpenChange, history, onHoverItem }: HistoryDialogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reversed = [...history].reverse();

  // Reset expansion state when opened/closed
  useEffect(() => {
    if (!open) {
      setIsExpanded(false);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent 
        overlayClassName="bg-transparent pointer-events-none"
        className={cn(
          "bg-card/95 border-border flex flex-col p-4 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[80vh] h-[80vh]" : "max-h-[30vh] h-[30vh]"
        )}
      >
        <DrawerHeader className="shrink-0 pb-2 border-b border-border text-left flex flex-row items-center justify-between p-0">
          <DrawerTitle className="flex items-center gap-2 text-lg text-left justify-start">
            <History className="h-5 w-5 text-primary" />
            <span>消去履歴</span>
            {history.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-mono">
                {history.length}
              </span>
            )}
          </DrawerTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-full"
              title={isExpanded ? "縮小" : "拡大"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

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
      </DrawerContent>
    </Drawer>
  );
}
