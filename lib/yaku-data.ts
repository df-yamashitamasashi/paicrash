import type { Yaku, MahjongTile } from './mahjong-types';

export interface YakuDefinition {
  name: string;
  japaneseName: string;
  description: string;
  descriptionJa: string;
  han: number;
  category: 'basic' | 'triplet' | 'sequence' | 'honor' | 'special' | 'yakuman';
  example?: string;
}

export const YAKU_DEFINITIONS: YakuDefinition[] = [
  // Basic clears
  {
    name: 'Triplet',
    japaneseName: '刻子',
    description: 'Three of the same tile',
    descriptionJa: '同じ牌が3つ揃う',
    han: 1,
    category: 'triplet',
    example: '🀇🀇🀇',
  },
  {
    name: 'Sequence',
    japaneseName: '順子',
    description: 'Three consecutive numbered tiles of the same suit',
    descriptionJa: '同じ種類の連続する3つの数牌',
    han: 1,
    category: 'sequence',
    example: '🀇🀈🀉',
  },
  // Honor-based yaku
  {
    name: 'Dragon Triplet',
    japaneseName: '三元牌',
    description: 'Triplet of dragon tiles (white, green, or red)',
    descriptionJa: '三元牌（白・發・中）の刻子',
    han: 2,
    category: 'honor',
    example: '🀄🀄🀄',
  },
  {
    name: 'Wind Triplet',
    japaneseName: '風牌',
    description: 'Triplet of wind tiles',
    descriptionJa: '風牌（東・南・西・北）の刻子',
    han: 1,
    category: 'honor',
    example: '🀀🀀🀀',
  },
  // Special combinations
  {
    name: 'All Triplets',
    japaneseName: '対々和',
    description: 'Clear with multiple triplets at once',
    descriptionJa: '複数の刻子を同時に消す',
    han: 3,
    category: 'special',
    example: '🀇🀇🀇 + 🀙🀙🀙',
  },
  {
    name: 'Pure Straight',
    japaneseName: '一気通貫',
    description: 'Complete sequence 1-9 of the same suit',
    descriptionJa: '同じ種類の1から9までの連続',
    han: 4,
    category: 'special',
    example: '🀇🀈🀉🀊🀋🀌🀍🀎🀏',
  },
  {
    name: 'All Simples',
    japaneseName: '断么九',
    description: 'Clear using only 2-8 numbered tiles',
    descriptionJa: '2〜8の数牌のみで消す',
    han: 2,
    category: 'special',
    example: '🀈🀉🀊',
  },
  {
    name: 'Terminal Triple',
    japaneseName: '老頭牌',
    description: 'Triplet of 1 or 9',
    descriptionJa: '1か9の刻子',
    han: 2,
    category: 'special',
    example: '🀇🀇🀇 or 🀏🀏🀏',
  },
  // Big hands (Yakuman)
  {
    name: 'Big Three Dragons',
    japaneseName: '大三元',
    description: 'Triplets of all three dragons on the board',
    descriptionJa: '白・發・中の3つの刻子が盤面に揃う',
    han: 13,
    category: 'yakuman',
    example: '🀆🀆🀆 + 🀅🀅🀅 + 🀄🀄🀄',
  },
  {
    name: 'Four Winds',
    japaneseName: '四喜和',
    description: 'Triplets of all four winds on the board',
    descriptionJa: '東・南・西・北の4つの刻子が盤面に揃う',
    han: 13,
    category: 'yakuman',
    example: '🀀🀀🀀 + 🀁🀁🀁 + 🀂🀂🀂 + 🀃🀃🀃',
  },
  {
    name: 'Thirteen Orphans',
    japaneseName: '国士無双',
    description: 'Exactly the 13 terminals and honors present on the board (no extra normal tiles allowed)',
    descriptionJa: '盤上に幺九牌13種が各1枚ずつ、計13枚のみ存在するときに成立（お邪魔牌を除く）',
    han: 13,
    category: 'yakuman',
    example: '🀇🀏🀙🀡🀐🀘🀀🀁🀂🀃🀆🀅🀄',
  },
  {
    name: 'Nine Gates',
    japaneseName: '九蓮宝燈',
    description: 'Exactly 14 same-suit tiles forming 1112345678999 plus one extra duplicate (no other tiles allowed)',
    descriptionJa: '盤上に同色の「1112345678999＋任意1枚」の計14枚のみ存在するときに成立（お邪魔牌を除く）',
    han: 13,
    category: 'yakuman',
    example: '🀇🀇🀇🀈🀉🀊🀋🀌🀍🀎🀏🀏🀏',
  },
  {
    name: 'All Honors',
    japaneseName: '字一色',
    description: 'Exactly 14 honor tiles on the board (no other normal tiles allowed)',
    descriptionJa: '盤上に字牌のみが計14枚存在するときに成立（お邪魔牌を除く）',
    han: 13,
    category: 'yakuman',
    example: '🀀🀁🀂🀃🀆🀅🀄',
  },
  {
    name: 'All Terminals',
    japaneseName: '清老頭',
    description: 'Board filled with only 1s and 9s',
    descriptionJa: '1と9のみで構成',
    han: 13,
    category: 'yakuman',
    example: '🀇🀏🀙🀡🀐🀘',
  },
  // Chain bonuses
  {
    name: 'Chain x2',
    japaneseName: '2連鎖',
    description: 'Two consecutive clears',
    descriptionJa: '連続で2回消す',
    han: 1,
    category: 'basic',
  },
  {
    name: 'Chain x3',
    japaneseName: '3連鎖',
    description: 'Three consecutive clears',
    descriptionJa: '連続で3回消す',
    han: 2,
    category: 'basic',
  },
  {
    name: 'Chain x4+',
    japaneseName: '4連鎖以上',
    description: 'Four or more consecutive clears',
    descriptionJa: '連続で4回以上消す',
    han: 3,
    category: 'basic',
  },
];

export function getYakuByCategory(category: YakuDefinition['category']): YakuDefinition[] {
  return YAKU_DEFINITIONS.filter(y => y.category === category);
}

export function createYaku(definition: YakuDefinition, tiles: MahjongTile[]): Yaku {
  return {
    name: definition.name,
    japaneseName: definition.japaneseName,
    description: definition.description,
    han: definition.han,
    tiles,
  };
}
