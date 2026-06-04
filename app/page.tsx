'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { SinglePlayerGame } from '@/components/game/single-player';
import { MultiplayerLobby } from '@/components/game/multiplayer-lobby';
import { MultiplayerGame } from '@/components/game/multiplayer-game';
import { CpuGame } from '@/components/game/cpu-game';
import { YakuGuide } from '@/components/game/yaku-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMultiplayerStore } from '@/lib/multiplayer-store';
import { useMultiplayer } from '@/hooks/use-multiplayer';
import type { BattleReport } from '@/lib/multiplayer-protocol';
import { Trophy, Download, Volume2, VolumeX, Music, Maximize2 } from 'lucide-react';
import { TileLogoIcon, SinglePlayerIcon, MultiplayerIcon, GuideIcon } from '@/components/icons/mahjong';
import { useAudio } from '@/hooks/use-audio';

type GameMode = 'menu' | 'single' | 'cpu' | 'multiplayer-lobby' | 'multiplayer-game';

interface GameResult {
  winnerName: string;
  isPlayerWin: boolean;
  isSpectator: boolean;
}

export default function MahjongPuzzleGame() {
  const { data: session } = useSession();
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showYakuGuide, setShowYakuGuide] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isResultMinimized, setIsResultMinimized] = useState(false);
  const multiplayerStatus = useMultiplayerStore((s) => s.status);
  const matchSnapshot = useMultiplayerStore((s) => s.matchSnapshot);
  const lastGameOver = useMultiplayerStore((s) => s.lastGameOver);
  const { leaveRoom } = useMultiplayer();
  const { isMuted, sfxVol, bgmVol, toggleMute, updateSfxVolume, updateBgmVolume, playClick, enableAudio, stopBgm } = useAudio();

  // Initialize/start audio BGM on mount if not muted, but wait for user interaction to resume audio context
  useEffect(() => {
    const handleFirstInteraction = () => {
      enableAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [enableAudio]);

  const handleMenuNavigation = (mode: GameMode) => {
    playClick();
    if (mode === 'menu') {
      stopBgm();
    }
    setGameMode(mode);
  };

  const downloadReport = () => {
    playClick();
    if (!lastGameOver) return;

    const report: BattleReport = {
      schemaVersion: '1.0',
      roomId: lastGameOver.roomId,
      roomName: lastGameOver.roomName,
      startedAt: new Date(lastGameOver.startedAt).toISOString(),
      endedAt: new Date(lastGameOver.endedAt).toISOString(),
      winnerName: lastGameOver.winnerName,
      players: lastGameOver.scores.map(s => ({
        playerName: s.playerName,
        score: s.score,
        isWinner: s.playerId === lastGameOver.winnerId,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date(lastGameOver.endedAt).toISOString().split('T')[0].replace(/-/g, '');
    a.download = `paicrash-battle-${lastGameOver.roomId}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMultiplayerGameEnd = useCallback((payload: { winnerName: string; isPlayerWin: boolean; isSpectator?: boolean }) => {
    setIsResultMinimized(false);
    setGameResult({
      winnerName: payload.winnerName,
      isPlayerWin: payload.isPlayerWin,
      isSpectator: payload.isSpectator ?? false,
    });
  }, []);

  const handleCpuGameEnd = useCallback((payload: { winnerName: string; isPlayerWin: boolean }) => {
    setIsResultMinimized(false);
    setGameResult({
      winnerName: payload.winnerName,
      isPlayerWin: payload.isPlayerWin,
      isSpectator: false,
    });
  }, []);

  const handleResultClose = () => {
    playClick();
    setGameResult(null);
    setIsResultMinimized(false);
    useMultiplayerStore.getState().setLastGameOver(null);
    if (multiplayerStatus === 'playing' || multiplayerStatus === 'spectating' || lastGameOver) {
      leaveRoom();
    }
    setGameMode('menu');
  };

  const showMultiplayerMatch =
    multiplayerStatus === 'playing' ||
    (multiplayerStatus === 'spectating' && matchSnapshot !== null) ||
    lastGameOver !== null;

  return (
    <main className="min-h-screen bg-background relative overflow-hidden p-4 md:p-8">
      {/* ポップなドットパターンの背景 */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at center, currentColor 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      {/* Audio & Settings Control Panel */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-card/85 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => {
            playClick();
            toggleMute();
          }}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4 text-primary" />}
        </Button>
        {!isMuted && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in slide-in-from-left duration-200">
            <span className="flex items-center gap-1 font-bold text-[10px]">
              <Music className="h-3 w-3" />
              BGM
            </span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={bgmVol}
              onChange={(e) => updateBgmVolume(parseFloat(e.target.value))}
              className="w-16 accent-primary h-1 rounded-lg cursor-pointer"
            />
            <span className="font-bold text-[10px] ml-1">SFX</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sfxVol}
              onChange={(e) => updateSfxVolume(parseFloat(e.target.value))}
              className="w-16 accent-primary h-1 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {gameMode === 'menu' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 relative pt-12">
            {session?.user && (
              <div className="absolute top-0 right-0 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="hidden md:inline">{session.user.name || session.user.email}</span>
                <Button variant="outline" size="sm" onClick={() => { playClick(); signOut(); }}>ログアウト</Button>
              </div>
            )}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                {/* 左側のアンティーク風装飾ライン */}
                <div className="hidden sm:block h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/60" />
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-sm select-none">
                  <span className="text-primary">
                    PaiCrash
                  </span>
                </h1>

                {/* 右側のアンティーク風装飾ライン */}
                <div className="hidden sm:block h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/60" />
              </div>
              
              <div className="space-y-1">
                <p className="text-primary/95 text-sm md:text-base tracking-[0.25em] font-semibold uppercase">
                  - Specialty Mahjong Puzzle -
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 w-full max-w-2xl">
              <Card
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
                onClick={() => handleMenuNavigation('single')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <SinglePlayerIcon className="h-5 w-5" />
                    シングルプレイ
                  </CardTitle>
                  <CardDescription>
                    一人で練習モード。役を覚えながらスコアを競おう
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuNavigation('single');
                    }}
                  >
                    プレイ開始
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
                onClick={() => handleMenuNavigation('cpu')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <GuideIcon className="h-5 w-5" />
                    対CPU戦
                  </CardTitle>
                  <CardDescription>
                    ローカルでAIと対戦。CPU相手に実力を試そう
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuNavigation('cpu');
                    }}
                  >
                    対戦開始
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group md:col-span-2"
                onClick={() => handleMenuNavigation('multiplayer-lobby')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <MultiplayerIcon className="h-5 w-5" />
                    オンライン対戦
                  </CardTitle>
                  <CardDescription>
                    リアルタイム対戦と観戦。ルームを作成して友達と対戦
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuNavigation('multiplayer-lobby');
                    }}
                  >
                    ロビーへ
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group md:col-span-2"
                onClick={() => {
                  playClick();
                  setShowYakuGuide(true);
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <GuideIcon className="h-5 w-5" />
                    役ガイド
                  </CardTitle>
                  <CardDescription>
                    麻雀役の一覧と消し方を確認。初心者の方はまずこちら
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClick();
                      setShowYakuGuide(true);
                    }}
                  >
                    ガイドを見る
                  </Button>
                </CardContent>
              </Card>
            </div>

            <footer className="w-full pt-8 text-center text-sm text-muted-foreground/60 font-medium">
              &copy; {new Date().getFullYear()} PaiCrash. All rights reserved.
            </footer>
          </div>
        )}

        {gameMode === 'single' && (
          <SinglePlayerGame onMultiplayerClick={() => setGameMode('multiplayer-lobby')} />
        )}

        {gameMode === 'cpu' && (
          <CpuGame onGameEnd={handleCpuGameEnd} />
        )}

        {gameMode === 'multiplayer-lobby' && !showMultiplayerMatch && (
          <MultiplayerLobby onBack={() => setGameMode('menu')} />
        )}

        {(gameMode === 'multiplayer-lobby' || gameMode === 'multiplayer-game') && showMultiplayerMatch && (
          <MultiplayerGame onGameEnd={handleMultiplayerGameEnd} />
        )}

        <YakuGuide open={showYakuGuide} onOpenChange={setShowYakuGuide} />

        <Dialog open={!!gameResult && !isResultMinimized} onOpenChange={(open) => {
          if (!open) setIsResultMinimized(true);
        }}>
          <DialogContent className="text-center sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
                {gameResult?.isSpectator ? (
                  <>
                    <Trophy className="text-primary" />
                    試合終了
                  </>
                ) : (
                  <>
                    <Trophy className={gameResult?.isPlayerWin ? 'text-primary' : 'text-muted-foreground'} />
                    {gameResult?.isPlayerWin ? '勝利!' : '敗北...'}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-base font-medium">
                {gameResult?.isSpectator
                  ? `勝者: ${gameResult?.winnerName}`
                  : gameResult?.isPlayerWin
                  ? 'おめでとうございます！見事な勝利です。'
                  : `勝者: ${gameResult?.winnerName ?? '対戦相手'}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4 items-center">
              {lastGameOver && gameMode === 'multiplayer-game' && (
                <Button variant="outline" size="sm" onClick={downloadReport} className="w-fit">
                  <Download className="w-4 h-4 mr-2" />
                  レポートをダウンロード
                </Button>
              )}
              <div className="flex gap-3 justify-center w-full">
                <Button onClick={handleResultClose} className="flex-1 min-w-0 bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none">
                  メニューに戻る
                </Button>
                <Button
                  className="flex-1 min-w-0"
                  onClick={() => {
                    playClick();
                    setGameResult(null);
                    setIsResultMinimized(false);
                    useMultiplayerStore.getState().setLastGameOver(null);
                    if (gameMode === 'multiplayer-game' || gameMode === 'multiplayer-lobby') {
                      setGameMode('multiplayer-lobby');
                    } else {
                      // Force remount by briefly unmounting the game component
                      const currentMode = gameMode;
                      setGameMode('menu');
                      requestAnimationFrame(() => setGameMode(currentMode));
                    }
                  }}
                >
                  もう一度
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => setIsResultMinimized(true)} className="text-muted-foreground w-full mt-2">
                盤面を確認する（最小化）
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Minimized Result Button */}
        {!!gameResult && isResultMinimized && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Button
              size="lg"
              onClick={() => setIsResultMinimized(false)}
              className="rounded-full shadow-xl shadow-primary/20 bg-card hover:bg-card/90 text-foreground border border-border gap-2 px-6 h-14"
            >
              <Maximize2 className="w-5 h-5 text-primary" />
              <span className="font-bold">結果ダイアログを開く</span>
            </Button>
          </div>
        )}

        {(gameMode === 'single' || gameMode === 'cpu' || showMultiplayerMatch) && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playClick();
                stopBgm();
                if (showMultiplayerMatch) {
                  leaveRoom();
                }
                setGameMode('menu');
              }}
              className="opacity-60 hover:opacity-100"
            >
              メニューへ戻る
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
