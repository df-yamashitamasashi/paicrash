'use client';

import React from 'react';
import { Bird } from 'lucide-react';
import { MahjongTile, getTileKey, TILE_DISPLAY } from '@/lib/mahjong-types';
import { cn } from '@/lib/utils';

interface TileProps {
  tile: MahjongTile;
  size?: 'sm' | 'md' | 'lg';
  isGhost?: boolean;
  isClearing?: boolean;
  isYakuman?: boolean;
  isYakumanDissolving?: boolean;
  onClick?: () => void;
}

const suitTextColors: Record<string, string> = {
  manzu: 'text-[var(--tile-manzu)]',      
  pinzu: 'text-[var(--tile-pinzu)]',     
  souzu: 'text-[var(--tile-souzu)]',  
  honor: 'text-black',    
  ojama: 'text-slate-500',    // Gray for ojama
};

const honorColors: Record<string, string> = {
  east: 'text-black',
  south: 'text-black', 
  west: 'text-black',
  north: 'text-black',
  white: 'text-transparent',     
  green: 'text-[var(--tile-souzu)]',  
  red: 'text-[var(--tile-manzu)]',        
};

const sizeClasses: Record<string, { wrapper: string; number: string; suit: string; honor: string }> = {
  sm: { 
    wrapper: 'w-7 h-9', 
    number: 'text-sm font-bold',
    suit: 'text-[8px]',
    honor: 'text-base font-bold'
  },
  md: { 
    wrapper: 'w-9 h-11', 
    number: 'text-lg font-bold',
    suit: 'text-[9px]',
    honor: 'text-xl font-bold'
  },
  lg: { 
    wrapper: 'w-11 h-14', 
    number: 'text-xl font-bold',
    suit: 'text-[10px]',
    honor: 'text-2xl font-bold'
  },
};

// Number display mapping (Japanese numerals)
const numberDisplay: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
  6: '六', 7: '七', 8: '八', 9: '九',
};

// Suit character display
const suitDisplay: Record<string, string> = {
  manzu: '萬',
  pinzu: '筒', 
  souzu: '索',
};

// Honor tile display
const honorDisplay: Record<string, string> = {
  east: '東',
  south: '南',
  west: '西', 
  north: '北',
  white: '　', // White dragon shows as empty with border
  green: '發',
  red: '中',
};

// Pinzu (dots) visual representation
function PinzuDots({ number, size }: { number: number; size: 'sm' | 'md' | 'lg' }) {
  // 1 = blue, 2 = red
  const patterns: Record<number, number[][]> = {
    1: [[2]],
    2: [[1], [1]],
    3: [[1], [2], [1]],
    4: [[1, 1], [1, 1]],
    5: [[1, 1], [2], [1, 1]],
    6: [[1, 1], [1, 1], [1, 1]],
    7: [[2, 2, 2], [1, 1], [1, 1]], // Top 3 red, bottom 4 blue (2x2)
    8: [[1, 1], [1, 1], [1, 1], [1, 1]], // 4 rows of 2 blue
    9: [[1, 1, 1], [2, 2, 2], [1, 1, 1]], // 3x3, middle red
  };

  const pattern = patterns[number] || [[1]];
  const rowsCount = pattern.length;
  const maxCols = Math.max(...pattern.map(r => r.length));

  const getDotSize = (num: number, rCount: number, cCount: number) => {
    if (num === 1) return size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
    
    // If dense, use smaller dots
    const isDense = rCount >= 4 || cCount >= 3;
    if (size === 'sm') return isDense ? 'w-1.5 h-1.5' : 'w-2 h-2';
    if (size === 'md') return isDense ? 'w-2 h-2' : 'w-2.5 h-2.5';
    return isDense ? 'w-2.5 h-2.5' : 'w-3 h-3';
  };
  
  const dotSize = getDotSize(number, rowsCount, maxCols);
  const gap = (rowsCount >= 4 || maxCols >= 3) ? 'gap-[2px]' : size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={cn(
      'flex flex-col items-center justify-center w-full h-full', 
      gap,
      number === 3 && '-rotate-[45deg]'
    )}>
      {pattern.map((row, i) => (
        <div key={i} className={cn('flex', gap)}>
          {row.map((item, j) => (
            <div
              key={j}
              className={cn(
                dotSize,
                'rounded-full shadow-sm border',
                item === 2 
                  ? 'bg-rose-600 border-rose-800/80' 
                  : 'bg-[var(--tile-pinzu)] border-blue-700/50' 
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Souzu (bamboo) visual representation
function SouzuBamboo({ number, size }: { number: number; size: 'sm' | 'md' | 'lg' }) {
  if (number === 1) {
    const iconSize = size === 'sm' ? 20 : size === 'md' ? 26 : 32;
    return (
      <div className="text-emerald-700 flex items-center justify-center w-full h-full">
        <Bird 
          size={iconSize} 
          strokeWidth={2}
          className="fill-emerald-600/30"
        />
      </div>
    );
  }

  // g = green, r = red
  const patterns: Record<number, ('g'|'r')[][]> = {
    2: [['g'], ['g']],
    3: [['g', 'g', 'g']],
    4: [['g', 'g'], ['g', 'g']],
    5: [['g', 'g'], ['r'], ['g', 'g']],
    6: [['g', 'g', 'g'], ['g', 'g', 'g']],
    7: [['r', 'r', 'r'], ['g', 'g', 'g', 'g']],
    8: [['g', 'g', 'g', 'g'], ['g', 'g', 'g', 'g']],
    9: [['g', 'r', 'g'], ['g', 'r', 'g'], ['g', 'r', 'g']], // Vertical red stripe to contrast Pinzu's horizontal red stripe
  };

  const pattern = patterns[number] || [['g']];
  const rowsCount = pattern.length;
  const maxCols = Math.max(...pattern.map(r => r.length));

  const getDims = () => {
    const dense = maxCols >= 4;
    // Explicitly define heights so bamboo always looks like vertical sticks, not squares
    if (size === 'sm') return { 
      w: dense ? 'w-[2px]' : 'w-[3px]', 
      h: rowsCount === 1 ? 'h-[20px]' : rowsCount === 2 ? 'h-[12px]' : 'h-[8px]', 
      gap: 'gap-[2px]' 
    };
    if (size === 'md') return { 
      w: dense ? 'w-[3px]' : 'w-[4px]', 
      h: rowsCount === 1 ? 'h-[26px]' : rowsCount === 2 ? 'h-[14px]' : 'h-[10px]', 
      gap: 'gap-[2px]' 
    };
    return { 
      w: dense ? 'w-[4px]' : 'w-[5px]', 
      h: rowsCount === 1 ? 'h-[32px]' : rowsCount === 2 ? 'h-[20px]' : 'h-[14px]', 
      gap: 'gap-[3px]' 
    };
  };

  const dims = getDims();

  return (
    <div className={cn('flex flex-col items-center justify-center w-full h-full', dims.gap)}>
      {pattern.map((row, i) => (
        <div key={i} className={cn('flex items-center justify-center', dims.gap)}>
          {row.map((color, j) => {
            let rotationClass = '';
            if (number === 8) {
              if (i === 0) { // Top row M: /\/\
                rotationClass = j % 2 === 0 ? 'rotate-[15deg]' : '-rotate-[15deg]';
              } else { // Bottom row W: \/\/
                rotationClass = j % 2 === 0 ? '-rotate-[15deg]' : 'rotate-[15deg]';
              }
            } else if (number === 7 && i === 0) {
              // Top 3 sticks fan out: \ | /
              if (j === 0) rotationClass = '-rotate-[15deg]';
              else if (j === 2) rotationClass = 'rotate-[15deg]';
            }

            return (
              <div
                key={j}
                className={cn(
                  dims.w,
                  dims.h,
                  'rounded-[2px] shadow-sm',
                  color === 'r' 
                    ? 'bg-rose-600 border border-rose-800/80' 
                    : 'bg-emerald-600 border border-emerald-800/80',
                  rotationClass
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const Tile = React.memo(function Tile({ tile, size = 'md', isGhost = false, isClearing = false, isYakuman = false, isYakumanDissolving = false, onClick }: TileProps) {
  const sizeClass = sizeClasses[size];
  const isOjama = tile.suit === 'ojama';
  const isHonor = tile.suit === 'honor';
  const isWhiteDragon = isHonor && tile.honor === 'white';
  const isRedDragon = isHonor && tile.honor === 'red';
  const isGreenDragon = isHonor && tile.honor === 'green';

  const textColor = isHonor 
    ? honorColors[tile.honor || 'east']
    : suitTextColors[tile.suit];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-md',
        'select-none cursor-default overflow-hidden',
        sizeClass.wrapper,
        isGhost && 'opacity-30',
        // Handle normal clear animation vs Yakuman animations
        isClearing && !isYakuman && !isYakumanDissolving && 'animate-tile-clear',
        isYakuman && 'animate-yakuman-glow',
        isYakumanDissolving && 'animate-yakuman-dissolve',
        tile.isDropping && 'animate-tile-drop',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
      )}
      style={{
        // Realistic ivory/bone tile appearance
        background: 'linear-gradient(145deg, #f8f6f0 0%, #e8e4d8 50%, #d8d4c8 100%)',
        boxShadow: isGhost ? 'none' : `
          inset 0 1px 2px rgba(255,255,255,0.8),
          inset 0 -1px 2px rgba(0,0,0,0.1),
          0 2px 4px rgba(0,0,0,0.3),
          0 4px 8px rgba(0,0,0,0.15)
        `,
        border: '1px solid rgba(180, 170, 150, 0.5)',
      }}
    >
      {/* Top edge highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)'
        }}
      />
      
      {/* Left edge highlight */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-md"
        style={{
          background: 'linear-gradient(to right, rgba(255,255,255,0.4), transparent)'
        }}
      />

      {/* Accessibility Index (Small number in corner) */}
      {['pinzu', 'souzu', 'manzu'].includes(tile.suit) && tile.number && (
         <div 
           className={cn(
             "absolute top-0.5 left-1 font-black opacity-40 leading-none select-none z-10",
             textColor,
           )} 
           style={{ 
             fontSize: size === 'sm' ? '8px' : size === 'md' ? '10px' : '13px',
             textShadow: '0 1px 1px rgba(255,255,255,0.8)'
           }}
         >
            {tile.number}
         </div>
      )}

      {/* Tile content */}
      {tile.suit === 'pinzu' && tile.number ? (
        <PinzuDots number={tile.number} size={size} />
      ) : tile.suit === 'souzu' && tile.number ? (
        <SouzuBamboo number={tile.number} size={size} />
      ) : tile.suit === 'manzu' && tile.number ? (
        // Manzu (characters) - traditional display
        <div className={cn('flex flex-col items-center justify-center w-full h-full leading-none', textColor)}>
          <span className={cn(sizeClass.number, 'font-black')}>{numberDisplay[tile.number]}</span>
          <span className={cn(sizeClass.suit, 'opacity-90 font-bold mt-0.5')}>{suitDisplay.manzu}</span>
        </div>
      ) : isWhiteDragon ? (
        // White dragon - completely empty as requested (no pattern)
        <span className={cn(sizeClass.honor, 'text-transparent')}>
          　
        </span>
      ) : isRedDragon ? (
        // Red dragon - 中 character
        <span className={cn(sizeClass.honor, 'text-[var(--tile-manzu)]')}>
          中
        </span>
      ) : isGreenDragon ? (
        // Green dragon - 發 character
        <span className={cn(sizeClass.honor, 'text-[var(--tile-souzu)]')}>
          發
        </span>
      ) : isOjama ? (
        // Ojama tile - Gray block with X
        <div className="flex items-center justify-center w-5/6 h-5/6 bg-slate-200/80 rounded-sm border-2 border-slate-300 shadow-inner">
          <span className={cn(sizeClass.number, 'text-slate-400')}>✕</span>
        </div>
      ) : isHonor ? (
        // Wind tiles
        <span className={cn(sizeClass.honor, textColor)}>
          {honorDisplay[tile.honor || 'east']}
        </span>
      ) : null}

      {/* Bottom edge shadow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-md"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)'
        }}
      />

      {/* Right edge shadow */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-0.5 rounded-r-md"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)'
        }}
      />
    </div>
  );
});

export function TilePreview({ tile, label }: { tile: MahjongTile | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div 
        className="p-2 rounded-lg"
        style={{
          background: 'linear-gradient(145deg, #2a2520 0%, #1a1815 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {tile ? (
          <Tile tile={tile} size="lg" />
        ) : (
          <div className="w-11 h-14 bg-muted/20 rounded-md border-2 border-dashed border-muted-foreground/30" />
        )}
      </div>
    </div>
  );
}

export function TileGroup({ tiles, label }: { tiles: MahjongTile[]; label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      <div className="flex gap-0.5">
        {tiles.map((tile, i) => (
          <Tile key={tile.id || i} tile={tile} size="sm" />
        ))}
      </div>
    </div>
  );
}
