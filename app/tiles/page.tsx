import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tile } from '@/components/game/tile';
import { TileSuit, TileNumber, HonorType, MahjongTile, TILE_DISPLAY, getTileKey } from '@/lib/mahjong-types';

export default function TilesPage() {
  const manzuTiles: MahjongTile[] = Array.from({ length: 9 }, (_, i) => ({
    id: `m${i + 1}`, suit: 'manzu', number: (i + 1) as TileNumber, x: 0, y: 0
  }));
  const pinzuTiles: MahjongTile[] = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i + 1}`, suit: 'pinzu', number: (i + 1) as TileNumber, x: 0, y: 0
  }));
  const souzuTiles: MahjongTile[] = Array.from({ length: 9 }, (_, i) => ({
    id: `s${i + 1}`, suit: 'souzu', number: (i + 1) as TileNumber, x: 0, y: 0
  }));
  const honorTiles: MahjongTile[] = (['east', 'south', 'west', 'north', 'white', 'green', 'red'] as HonorType[]).map((honor) => ({
    id: honor, suit: 'honor', honor, x: 0, y: 0
  }));
  const ojamaTile: MahjongTile = { id: 'ojama', suit: 'ojama', x: 0, y: 0 };

  const renderSection = (title: string, tiles: MahjongTile[]) => (
    <div className="mb-8 bg-card/50 rounded-2xl p-6 border border-border shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-primary">{title}</h2>
      <div className="flex flex-wrap gap-4 items-center">
        {tiles.map(tile => (
          <div key={tile.id} className="flex flex-col items-center gap-2">
            <Tile tile={tile} size="lg" />
            <span className="text-sm font-bold text-muted-foreground">{TILE_DISPLAY[getTileKey(tile)]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b border-border shadow-sm relative z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-bold text-lg">牌一覧 (Tile Dictionary)</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-muted-foreground text-sm mb-6">
            ゲーム内で使用されるすべての牌の一覧です。
          </p>

          {renderSection('萬子 (マンズ)', manzuTiles)}
          {renderSection('筒子 (ピンズ)', pinzuTiles)}
          {renderSection('索子 (ソーズ)', souzuTiles)}
          {renderSection('字牌 (ジハイ)', honorTiles)}
          {renderSection('特殊牌', [ojamaTile])}
        </div>
      </main>
    </div>
  );
}
