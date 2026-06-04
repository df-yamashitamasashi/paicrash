'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Swords, Flame, Star, Zap } from 'lucide-react';
import type { ClearResult } from '@/lib/mahjong-types';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
  label: string;
  value: number;
  isHighlight?: boolean;
}

export interface GameResultData {
  winnerName: string;
  isPlayerWin: boolean;
  isSpectator: boolean;
  playerName: string;
  playerScore: number;
  opponentScore: number;
  opponentName: string;
  playerHistory: ClearResult[];
  opponentHistory: ClearResult[];
}

interface GameResultDialogProps {
  result: GameResultData | null;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
  onRematch: () => void;
}

function getScoreRank(score: number): { label: string; color: string } {
  if (score >= 100000) return { label: '神', color: 'text-amber-400' };
  if (score >= 50000) return { label: '極', color: 'text-purple-400' };
  if (score >= 30000) return { label: '達人', color: 'text-rose-400' };
  if (score >= 15000) return { label: '上級', color: 'text-blue-400' };
  if (score >= 5000) return { label: '中級', color: 'text-emerald-400' };
  return { label: '初心', color: 'text-muted-foreground' };
}

function buildBreakdown(history: ClearResult[] = []): ScoreBreakdown[] {
  if (!history || !Array.isArray(history)) return [];
  const items: ScoreBreakdown[] = [];

  // Count yakuman
  const yakumanClears = history.filter(h => h.yaku && h.yaku.han >= 13);
  if (yakumanClears.length > 0) {
    const yakuNames = yakumanClears.map(h => h.yaku!.japaneseName);
    const uniqueYaku = [...new Set(yakuNames)];
    items.push({
      label: `🀄 役満 (${uniqueYaku.join('・')})`,
      value: yakumanClears.reduce((s, h) => s + h.score, 0),
      isHighlight: true,
    });
  }

  // Count mangan+
  const manganClears = history.filter(h => h.yaku && h.yaku.han >= 4 && h.yaku.han < 13);
  if (manganClears.length > 0) {
    items.push({
      label: `🔥 満貫以上 ×${manganClears.length}`,
      value: manganClears.reduce((s, h) => s + h.score, 0),
      isHighlight: true,
    });
  }

  // Count yaku clears (non-mangan)
  const yakuClears = history.filter(h => h.yaku && h.yaku.han >= 2 && h.yaku.han < 4);
  if (yakuClears.length > 0) {
    items.push({
      label: `⭐ 役あり ×${yakuClears.length}`,
      value: yakuClears.reduce((s, h) => s + h.score, 0),
    });
  }

  // Basic clears
  const basicClears = history.filter(h => !h.yaku || h.yaku.han <= 1);
  if (basicClears.length > 0) {
    items.push({
      label: `📦 基本消去 ×${basicClears.length}`,
      value: basicClears.reduce((s, h) => s + h.score, 0),
    });
  }

  // Chain bonus total
  const chainClears = history.filter(h => h.chainCount > 0);
  if (chainClears.length > 0) {
    const maxChain = Math.max(...chainClears.map(h => h.chainCount));
    items.push({
      label: `⚡ 連鎖ボーナス (最大${maxChain + 1}連鎖)`,
      value: chainClears.reduce((s, h) => s + h.score * (h.chainCount / (h.chainCount + 1)), 0) | 0,
    });
  }

  return items;
}

function AnimatedScore({ target, duration = 1500, delay = 0 }: { target: number; duration?: number; delay?: number }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    let animFrame: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(target * eased));
      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [target, duration, started]);

  return <>{current.toLocaleString()}</>;
}

function ScoreMeter({ playerScore, opponentScore, delay }: { playerScore: number; opponentScore: number; delay: number }) {
  const [progress, setProgress] = useState(50);

  useEffect(() => {
    const total = playerScore + opponentScore;
    if (total === 0) return;
    const targetProgress = (playerScore / total) * 100;

    const timer = setTimeout(() => {
      setProgress(targetProgress);
    }, delay);

    return () => clearTimeout(timer);
  }, [playerScore, opponentScore, delay]);

  return (
    <div className="w-full h-3 bg-muted rounded-full overflow-hidden relative">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full transition-all duration-[2000ms] ease-out"
        style={{ width: `${progress}%` }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-500 to-red-400 rounded-r-full transition-all duration-[2000ms] ease-out"
        style={{ width: `${100 - progress}%` }}
      />
      {/* Center line */}
      <div className="absolute inset-y-0 left-1/2 w-[2px] bg-background/80 -translate-x-1/2 z-10" />
    </div>
  );
}

export function GameResultDialog({
  result,
  isMinimized,
  onMinimize,
  onRestore,
  onClose,
  onRematch,
}: GameResultDialogProps) {
  const [revealPhase, setRevealPhase] = useState(0);
  // 0 = show header, 1 = meter + scores, 2 = breakdown, 3 = result + buttons

  useEffect(() => {
    if (!result || isMinimized) {
      setRevealPhase(0);
      return;
    }
    const timers = [
      setTimeout(() => setRevealPhase(1), 300),
      setTimeout(() => setRevealPhase(2), 1800),
      setTimeout(() => setRevealPhase(3), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [result, isMinimized]);

  const playerBreakdown = useMemo(() => result ? buildBreakdown(result.playerHistory) : [], [result]);
  const opponentBreakdown = useMemo(() => result ? buildBreakdown(result.opponentHistory) : [], [result]);
  const playerRank = useMemo(() => result ? getScoreRank(result.playerScore) : null, [result]);
  const opponentRank = useMemo(() => result ? getScoreRank(result.opponentScore) : null, [result]);
  const scoreDiff = result ? result.playerScore - result.opponentScore : 0;

  if (!result) return null;

  return (
    <Dialog open={!!result && !isMinimized} onOpenChange={(open) => {
      if (!open) onMinimize();
    }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-2 border-primary/30">
        {/* Top Banner */}
        <div className={cn(
          "relative px-6 py-5 text-center overflow-hidden",
          result.isSpectator
            ? "bg-gradient-to-b from-slate-800 to-slate-900 text-white"
            : result.isPlayerWin
            ? "bg-gradient-to-b from-amber-500 to-amber-700 text-white"
            : "bg-gradient-to-b from-slate-700 to-slate-900 text-white"
        )}>
          {/* Animated particles effect */}
          {result.isPlayerWin && !result.isSpectator && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                  style={{
                    left: `${10 + (i * 7)}%`,
                    top: `${20 + ((i * 13) % 60)}%`,
                    animationDelay: `${i * 0.15}s`,
                    opacity: 0.6 + (i % 3) * 0.15,
                  }}
                />
              ))}
            </div>
          )}

          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center justify-center gap-3 text-3xl font-black tracking-wide">
              {result.isSpectator ? (
                <>
                  <Swords className="h-7 w-7" />
                  試合終了
                </>
              ) : result.isPlayerWin ? (
                <>
                  <Crown className="h-8 w-8 text-yellow-200 animate-bounce" />
                  勝 利 !
                </>
              ) : (
                <>
                  <Trophy className="h-7 w-7 text-slate-400" />
                  敗 北 ...
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-base font-medium">
              {result.isSpectator
                ? `勝者: ${result.winnerName}`
                : result.isPlayerWin
                ? '素晴らしい対局でした！'
                : `勝者: ${result.winnerName}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Score Section */}
        <div className="px-6 py-4 space-y-4">
          {/* Score Comparison */}
          <div className={cn(
            "transition-all duration-700 ease-out",
            revealPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-end justify-between mb-2">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{result.isSpectator ? result.playerName : 'あなた'}</p>
                <p className="text-3xl font-black tabular-nums text-primary">
                  <AnimatedScore target={result.playerScore} delay={500} />
                </p>
                {playerRank && (
                  <span className={cn("text-xs font-bold", playerRank.color)}>
                    【{playerRank.label}】
                  </span>
                )}
              </div>
              <div className="px-3 pb-2">
                <span className="text-lg font-bold text-muted-foreground italic">VS</span>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{result.opponentName}</p>
                <p className="text-3xl font-black tabular-nums text-destructive">
                  <AnimatedScore target={result.opponentScore} delay={700} />
                </p>
                {opponentRank && (
                  <span className={cn("text-xs font-bold", opponentRank.color)}>
                    【{opponentRank.label}】
                  </span>
                )}
              </div>
            </div>

            {/* Score Meter */}
            <ScoreMeter playerScore={result.playerScore} opponentScore={result.opponentScore} delay={900} />

            {/* Score difference */}
            {revealPhase >= 2 && scoreDiff !== 0 && (
              <div className={cn(
                "text-center mt-2 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-500",
                scoreDiff > 0 ? "text-blue-500" : "text-red-500"
              )}>
                {scoreDiff > 0 ? (
                  <><Zap className="inline h-4 w-4 mr-1" />+{scoreDiff.toLocaleString()}点 リード</>
                ) : (
                  <><Flame className="inline h-4 w-4 mr-1" />{Math.abs(scoreDiff).toLocaleString()}点差</>
                )}
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className={cn(
            "transition-all duration-700 ease-out",
            revealPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="grid grid-cols-2 gap-3">
              {/* Player Breakdown */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">
                  スコア内訳
                </p>
                {playerBreakdown.length > 0 ? playerBreakdown.map((item, i) => (
                  <div key={i} className={cn(
                    "flex justify-between text-xs px-2 py-1 rounded",
                    item.isHighlight ? "bg-primary/10 font-bold" : "bg-muted/30"
                  )}>
                    <span className="truncate mr-1">{item.label}</span>
                    <span className="tabular-nums shrink-0">{item.value.toLocaleString()}</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-2">消去なし</p>
                )}
              </div>

              {/* Opponent Breakdown */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">
                  スコア内訳
                </p>
                {opponentBreakdown.length > 0 ? opponentBreakdown.map((item, i) => (
                  <div key={i} className={cn(
                    "flex justify-between text-xs px-2 py-1 rounded",
                    item.isHighlight ? "bg-destructive/10 font-bold" : "bg-muted/30"
                  )}>
                    <span className="truncate mr-1">{item.label}</span>
                    <span className="tabular-nums shrink-0">{item.value.toLocaleString()}</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-2">消去なし</p>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 mt-3 text-center">
              <div className="bg-muted/20 rounded-lg py-2 px-3">
                <p className="text-[10px] text-muted-foreground">消去回数</p>
                <p className="text-lg font-bold tabular-nums">{result.playerHistory?.length ?? 0}</p>
              </div>
              <div className="bg-muted/20 rounded-lg py-2 px-3">
                <p className="text-[10px] text-muted-foreground">消去回数</p>
                <p className="text-lg font-bold tabular-nums">{result.opponentHistory?.length ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex flex-col gap-3 pt-2 transition-all duration-700 ease-out",
            revealPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex gap-3 justify-center w-full">
              <Button onClick={onClose} className="flex-1 min-w-0 bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none">
                メニューに戻る
              </Button>
              <Button className="flex-1 min-w-0" onClick={onRematch}>
                <Star className="w-4 h-4 mr-1" />
                もう一度
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onMinimize} className="text-muted-foreground w-full">
              盤面を確認する（最小化）
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
