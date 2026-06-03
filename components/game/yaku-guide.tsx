'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { YAKU_DEFINITIONS, type YakuDefinition } from '@/lib/yaku-data';
import { cn } from '@/lib/utils';
import { HelpIcon, SuitTileIcon, HonorTileIcon, SpecialTileIcon, YakumanIcon } from '@/components/icons/mahjong';
import { Tile } from './tile';
import { type MahjongTile } from '@/lib/mahjong-types';

const mockTiles = {
  m1: { id: 'm1', suit: 'manzu', number: 1, x: 0, y: 0 } as MahjongTile,
  m2: { id: 'm2', suit: 'manzu', number: 2, x: 0, y: 0 } as MahjongTile,
  m3: { id: 'm3', suit: 'manzu', number: 3, x: 0, y: 0 } as MahjongTile,
  p5: { id: 'p5', suit: 'pinzu', number: 5, x: 0, y: 0 } as MahjongTile,
  haku: { id: 'haku', suit: 'honor', honor: 'white', x: 0, y: 0 } as MahjongTile,
  hatsu: { id: 'hatsu', suit: 'honor', honor: 'green', x: 0, y: 0 } as MahjongTile,
  chun: { id: 'chun', suit: 'honor', honor: 'red', x: 0, y: 0 } as MahjongTile,
};

interface YakuGuideProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function YakuGuide({ open, onOpenChange }: YakuGuideProps) {
  const categories = [
    { id: 'basic', label: '基本', icon: SuitTileIcon },
    { id: 'triplet', label: '刻子系', icon: SuitTileIcon },
    { id: 'sequence', label: '順子系', icon: SuitTileIcon },
    { id: 'honor', label: '字牌系', icon: HonorTileIcon },
    { id: 'special', label: '特殊', icon: SpecialTileIcon },
    { id: 'yakuman', label: '役満', icon: YakumanIcon },
  ] as const;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-border flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpIcon className="h-5 w-5 text-primary" />
            ルール
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[75vh] pr-4 -mr-4">
          <div className="flex flex-col gap-8 w-full">
            {categories.map((cat) => {
              const yakus = YAKU_DEFINITIONS.filter((y) => y.category === cat.id);
              if (yakus.length === 0) return null;
              
              return (
                <div key={cat.id} className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 border-b border-border pb-2 sticky top-0 bg-card z-10">
                    <cat.icon className="h-5 w-5" />
                    {cat.label}
                  </h3>
                  <div className="space-y-3 pb-2">
                    {yakus.map((yaku) => (
                      <YakuCard key={yaku.name} yaku={yaku} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* How to play section */}
          <div className="mt-8 flex flex-col gap-3 pb-6">
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold mb-2 text-sm">消えるパターン（3つ以上繋げる）</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">同じ牌を3つ以上（刻子）<br/>直線だけでなくL字やT字、斜めやその複合でもOK</p>
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">直線</span>
                    <div className="flex gap-0.5">
                      <Tile tile={mockTiles.p5} size="sm"/><Tile tile={mockTiles.p5} size="sm"/><Tile tile={mockTiles.p5} size="sm"/>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">L字</span>
                    <div className="flex flex-col gap-0.5">
                      <Tile tile={mockTiles.p5} size="sm"/>
                      <div className="flex gap-0.5"><Tile tile={mockTiles.p5} size="sm"/><Tile tile={mockTiles.p5} size="sm"/></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">斜め</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <Tile tile={mockTiles.p5} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.p5} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.p5} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">複合（直線＋斜め）</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.p5} size="sm" />
                      <Tile tile={mockTiles.p5} size="sm" />
                      <Tile tile={mockTiles.p5} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">連続する数字を3つ以上（順子）<br/>直線・斜め・上下左右が混ざって繋がっていてもOK</p>
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">直線</span>
                    <div className="flex gap-0.5">
                      <Tile tile={mockTiles.m1} size="sm"/><Tile tile={mockTiles.m2} size="sm"/><Tile tile={mockTiles.m3} size="sm"/>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">L字</span>
                    <div className="flex flex-col gap-0.5">
                      <Tile tile={mockTiles.m2} size="sm"/>
                      <div className="flex gap-0.5"><Tile tile={mockTiles.m1} size="sm"/><Tile tile={mockTiles.m3} size="sm"/></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">斜め</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <Tile tile={mockTiles.m1} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.m2} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.m3} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">複合（直線＋斜め）</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <Tile tile={mockTiles.m3} size="sm" />
                      <Tile tile={mockTiles.m1} size="sm" />
                      <Tile tile={mockTiles.m2} size="sm" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                      <div className="w-7 h-9" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 役が成立するとボーナス点が入ります。</li>
              <li>• 連鎖（コンボ）すると得点が倍増！</li>
            </ul>
          </div>

          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <h4 className="font-semibold mb-2 text-sm text-destructive">お邪魔牌（Ojama）について</h4>
            <p className="text-xs text-muted-foreground mb-2">
              対戦モードでは、相手が役を作ると<strong>「1翻につき1個」</strong>のお邪魔牌が降ってきます。<br/>
              お邪魔牌自体は3つ並べても消えません（完全に邪魔なブロックです）。
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>相殺（カウンター）：</strong> 自分に予告が来ている時、落ちてくる前に自分が役を作れば、相手の攻撃を相殺して減らすことができます。</li>
              <li>• <strong>消し方（巻き込み）：</strong> 降ってきてしまったお邪魔牌は、<strong>「上下左右」に隣接している通常の牌</strong>を（役や3つ組で）消去することで、巻き込んで一緒に消滅させることができます！</li>
            </ul>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-sm text-primary">役の作り方（大三元・一気通貫など）</h4>
            <p className="text-xs text-muted-foreground mb-2">
              「大三元」や「四喜和」「一気通貫」などの役は、一度に全ての牌を消す必要はありません。<br/>
              ゲーム中にそれぞれ別々に消してストック（履歴）していけば、条件を満たした時点で役が成立しボーナスが入ります！
            </p>
            <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
              <div className="flex gap-0.5 shrink-0"><Tile tile={mockTiles.haku} size="sm"/><Tile tile={mockTiles.haku} size="sm"/><Tile tile={mockTiles.haku} size="sm"/></div>
              <span className="shrink-0">+</span>
              <div className="flex gap-0.5 shrink-0"><Tile tile={mockTiles.hatsu} size="sm"/><Tile tile={mockTiles.hatsu} size="sm"/><Tile tile={mockTiles.hatsu} size="sm"/></div>
              <span className="shrink-0">+</span>
              <div className="flex gap-0.5 shrink-0"><Tile tile={mockTiles.chun} size="sm"/><Tile tile={mockTiles.chun} size="sm"/><Tile tile={mockTiles.chun} size="sm"/></div>
              <span className="font-bold text-primary ml-2 shrink-0">⇒ 大三元 成立！</span>
            </div>
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function parseUnicodeTile(char: string): MahjongTile | null {
  const code = char.codePointAt(0);
  if (!code) return null;
  // Manzu: 1F007 (🀇) to 1F00F (🀏)
  if (code >= 0x1F007 && code <= 0x1F00F) return { id: char, suit: 'manzu', number: (code - 0x1F006) as any, x: 0, y: 0 };
  // Souzu: 1F010 (🀐) to 1F018 (🀘)
  if (code >= 0x1F010 && code <= 0x1F018) return { id: char, suit: 'souzu', number: (code - 0x1F00F) as any, x: 0, y: 0 };
  // Pinzu: 1F019 (🀙) to 1F021 (🀡)
  if (code >= 0x1F019 && code <= 0x1F021) return { id: char, suit: 'pinzu', number: (code - 0x1F018) as any, x: 0, y: 0 };
  
  // Honors
  switch (char) {
    case '🀀': return { id: char, suit: 'honor', honor: 'east', x: 0, y: 0 };
    case '🀁': return { id: char, suit: 'honor', honor: 'south', x: 0, y: 0 };
    case '🀂': return { id: char, suit: 'honor', honor: 'west', x: 0, y: 0 };
    case '🀃': return { id: char, suit: 'honor', honor: 'north', x: 0, y: 0 };
    case '🀆': return { id: char, suit: 'honor', honor: 'white', x: 0, y: 0 };
    case '🀅': return { id: char, suit: 'honor', honor: 'green', x: 0, y: 0 };
    case '🀄': return { id: char, suit: 'honor', honor: 'red', x: 0, y: 0 };
  }
  return null;
}

function ParsedExample({ example }: { example: string }) {
  const chars = [...example];
  return (
    <div className="flex flex-wrap items-center gap-y-1">
      {chars.map((char, index) => {
        const tile = parseUnicodeTile(char);
        if (tile) {
          return (
            <div key={index} className="flex-shrink-0" style={{ marginRight: '2px' }}>
              <Tile tile={tile} size="sm" />
            </div>
          );
        }
        return <span key={index} className="mx-1 text-muted-foreground font-bold">{char}</span>;
      })}
    </div>
  );
}

function YakuCard({ yaku }: { yaku: YakuDefinition }) {
  const isYakuman = yaku.category === 'yakuman';
  
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        isYakuman
          ? 'bg-primary/10 border-primary/30 hover:border-primary/50'
          : 'bg-card/50 border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className={cn(
              'font-bold',
              isYakuman ? 'text-primary' : 'text-foreground'
            )}>
              {yaku.japaneseName}
            </h5>
            <span className="text-xs text-muted-foreground">
              ({yaku.name})
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {yaku.descriptionJa}
          </p>
          {yaku.example && (
            <div className="mt-3">
              <ParsedExample example={yaku.example} />
            </div>
          )}
        </div>
        <div className={cn(
          'px-2 py-1 rounded text-xs font-bold',
          isYakuman
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}>
          {yaku.han}翻
        </div>
      </div>
    </div>
  );
}

export function YakuGuideButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <HelpIcon className="h-4 w-4" />
      ルール
    </Button>
  );
}
