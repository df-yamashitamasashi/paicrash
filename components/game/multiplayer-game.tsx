'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMultiplayer } from '@/hooks/use-multiplayer';
import { useYakumanAnimation } from '@/hooks/use-yakuman-animation';
import { GameBoardComponent } from './game-board';
import { GameStats } from './game-stats';
import { GameControls } from './game-controls';
import { YakuGuide } from './yaku-guide';
import { HistoryDialog } from './history-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import type { GameState, MahjongTile } from '@/lib/mahjong-types';
import type { BattleReport } from '@/lib/multiplayer-protocol';
import { Eye, Download, FileText } from 'lucide-react';
import { Tile } from './tile';
import { NicoCommentsOverlay } from './nico-comments-overlay';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MultiplayerGameProps {
  onGameEnd: (payload: { winnerId: string; winnerName: string; isPlayerWin: boolean; isSpectator: boolean }) => void;
}

export function MultiplayerGame({ onGameEnd }: MultiplayerGameProps) {
  const {
    role,
    playerId,
    playerName,
    matchSnapshot,
    lastGameOver,
    isServerConnected,
    currentRoom,
    sendGameInput,
    sendMessage,
    leaveRoom,
  } = useMultiplayer();

  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredTiles, setHoveredTiles] = useState<MahjongTile[] | null>(null);
  const isSpectator = role === 'spectator';

  const mySnapshot = useMemo(
    () => matchSnapshot?.players.find((p) => p.playerId === playerId) ?? null,
    [matchSnapshot, playerId],
  );

  const opponentSnapshot = useMemo(
    () => matchSnapshot?.players.find((p) => p.playerId !== playerId) ?? null,
    [matchSnapshot, playerId],
  );

  const { animBoard: playerAnimBoard, isAnimating: isPlayerAnimating } = useYakumanAnimation(mySnapshot?.gameState ?? null, !isSpectator);

  // Touch handling refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchLastX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const lastDropTime = useRef<number>(0);
  const gameEndedCalledRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSpectator || mySnapshot?.gameState?.isGameOver || isPlayerAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchLastX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  }, [isSpectator, mySnapshot, isPlayerAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isSpectator || mySnapshot?.gameState?.isGameOver || isPlayerAnimating) return;
    if (touchStartX.current === null || touchLastX.current === null || touchStartY.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchLastX.current;
    const deltaY = currentY - touchStartY.current;

    const cellWidth = 32;
    const now = Date.now();

    if (Math.abs(deltaX) >= cellWidth * 0.8) {
      if (deltaX > 0) void sendGameInput('move-right');
      else void sendGameInput('move-left');
      touchLastX.current = currentX;
    }
    
    if (deltaY > cellWidth * 1.5 && now - lastDropTime.current > 150) {
      void sendGameInput('soft-drop');
      touchStartY.current = currentY;
      lastDropTime.current = now;
    }
  }, [isSpectator, mySnapshot, isPlayerAnimating, sendGameInput]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isSpectator || mySnapshot?.gameState?.isGameOver || isPlayerAnimating) return;
    if (touchStartY.current !== null && touchStartX.current !== null) {
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      
      if (deltaY > 50 && (deltaY / deltaTime) > 0.8) {
        void sendGameInput('hard-drop');
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchLastX.current = null;
  }, [isSpectator, mySnapshot, isPlayerAnimating, sendGameInput]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isSpectator || !mySnapshot?.gameState || mySnapshot.gameState.isGameOver || isPlayerAnimating) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          void sendGameInput('move-left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          void sendGameInput('move-right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          void sendGameInput('soft-drop');
          break;
        case ' ':
          e.preventDefault();
          void sendGameInput('hard-drop');
          break;
      }
    },
    [isSpectator, mySnapshot, isPlayerAnimating, sendGameInput],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const downloadReport = useCallback(async () => {
    if (!lastGameOver) return;

    const element = document.getElementById('pdf-report-container');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
      const dateStr = new Date(lastGameOver.endedAt).toISOString().split('T')[0].replace(/-/g, '');
      pdf.save(`paicrash-certificate-${lastGameOver.roomId}-${dateStr}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  }, [lastGameOver]);

  useEffect(() => {
    if (!lastGameOver) {
      gameEndedCalledRef.current = false;
      return;
    }
    if (gameEndedCalledRef.current) return;
    
    // Add 3.5 seconds delay so players can see the final board state
    gameEndedCalledRef.current = true;
    const timer = setTimeout(() => {
      onGameEnd({
        winnerId: lastGameOver.winnerId,
        winnerName: lastGameOver.winnerName,
        isPlayerWin: lastGameOver.winnerId === playerId,
        isSpectator,
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [lastGameOver, isSpectator, onGameEnd, playerId]);

  if (!matchSnapshot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">対戦データを同期中...</p>
      </div>
    );
  }

  if (isSpectator) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">観戦モード</h2>
          <Badge variant="outline">READ ONLY</Badge>
        </div>

        {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>観戦中: {currentRoom.spectators.map(s => s.name).join(', ')}</span>
          </div>
        )}

        {!isServerConnected && (
          <Alert variant="destructive" className="max-w-lg">
            <AlertDescription>サーバーとの接続が不安定です。</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-row flex-nowrap justify-center gap-2 md:gap-6 items-start w-full max-w-full overflow-x-auto pb-4 px-2">
          {matchSnapshot.players.map((player) => (
            <SpectatorBoardPanel
              key={player.playerId}
              label={player.playerName}
              gameState={player.gameState}
            />
          ))}
        </div>

        {/* 観戦者用コメント入力 */}
        <form 
          className="flex items-center gap-2 w-full max-w-sm mt-4 z-10 relative"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('comment') as HTMLInputElement;
            if (input.value.trim()) {
              void sendMessage(input.value.trim());
              input.value = '';
            }
          }}
        >
          <Input 
            name="comment" 
            placeholder="コメントを入力して応援..." 
            maxLength={50}
            className="bg-background/80 backdrop-blur shadow-xl"
            autoComplete="off"
          />
          <Button type="submit" size="sm" className="shadow-xl">送信</Button>
        </form>

        {lastGameOver && (
          <Alert className="max-w-lg">
            <AlertDescription className="flex flex-col gap-2">
              <span>勝者: {lastGameOver.winnerName}（{lastGameOver.scores.map((s) => `${s.playerName}: ${s.score}`).join(' / ')}）</span>
              <Button variant="outline" size="sm" onClick={() => void downloadReport()} className="w-fit">
                <FileText className="w-4 h-4 mr-2" />
                戦績証明書(PDF)をダウンロード
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Button variant="outline" onClick={() => void leaveRoom()}>
          観戦を終了
        </Button>

        {/* Nico Nico Comments (Spectator) */}
        <NicoCommentsOverlay />
      </div>
    );
  }

  const myState = mySnapshot?.gameState;
  const opponentState = opponentSnapshot?.gameState;

  if (!myState) {
    return null;
  }

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col items-center gap-4 pb-32 md:pb-0 w-full max-w-full">
        {!isServerConnected && (
          <Alert variant="destructive" className="max-w-lg">
            <AlertDescription>サーバーとの接続が不安定です。操作が反映されない場合があります。</AlertDescription>
          </Alert>
        )}

      <div className="flex items-center justify-center gap-8 w-full">
        <div className="text-center">
          <Badge variant="default" className="mb-1">YOU</Badge>
          <p className="font-bold">{playerName || 'あなた'}</p>
          <p className="text-2xl font-mono text-primary">{myState.score.toLocaleString()}</p>
        </div>
        <div className="text-3xl font-bold text-muted-foreground">VS</div>
        <div className="text-center">
          <Badge variant="secondary" className="mb-1">OPPONENT</Badge>
          <p className="font-bold">{opponentSnapshot?.playerName ?? '対戦相手'}</p>
          <p className="text-2xl font-mono text-accent">
            {(opponentState?.score ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* 観戦者一覧 (PC) */}
      {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-2 text-sm text-muted-foreground w-full">
          <Eye className="h-4 w-4" />
          <span>観戦中: {currentRoom.spectators.map(s => s.name).join(', ')}</span>
        </div>
      )}

      <div className="flex flex-row gap-4 lg:gap-8 items-start w-full max-w-full justify-center">
        <div className="flex flex-col items-center gap-4">
          <GameBoardComponent
            board={playerAnimBoard || myState.board}
            currentTile={playerAnimBoard ? null : myState.currentTile}
            isGameOver={myState.isGameOver}
            isPaused={false}
            highlightTiles={hoveredTiles}
          />
        </div>

        <div className="hidden md:flex flex-col items-center gap-4">
          <GameStats
            score={myState.score}
            level={myState.level}
            combo={myState.combo}
            maxCombo={myState.maxCombo}
            nextTile={myState.nextTile}
            doraIndicator={myState.doraIndicator}
            uraDoraIndicator={myState.uraDoraIndicator}
            lastYaku={myState.lastYaku}
            garbageQueue={myState.garbageQueue}
            clearHistory={myState.clearHistory}
            onHoverHistory={setHoveredTiles}
          />
          
          <GameControls
            onMove={(dir) => void sendGameInput(dir === 'left' ? 'move-left' : 'move-right')}
            onDrop={() => void sendGameInput('soft-drop')}
            onHardDrop={() => void sendGameInput('hard-drop')}
            onPause={() => {}}
            onReset={() => {}}
            onShowGuide={() => setShowGuide(true)}
            isPaused={false}
            isGameOver={myState.isGameOver}
            hidePause
            hideReset
          />
        </div>

        {opponentState && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">{opponentSnapshot?.playerName}</p>
            <GameBoardComponent
              board={opponentState.board}
              currentTile={opponentState.currentTile}
              isGameOver={opponentState.isGameOver}
              isOpponent
              scale={0.5}
            />
          </div>
        )}
      </div>
      </div>

      {/* Mobile layout - fixed viewport */}
      <div className="flex md:hidden flex-col h-[100dvh] overflow-hidden w-full relative bg-background">
        {!isServerConnected && (
          <div className="bg-destructive/90 text-destructive-foreground text-xs p-1 text-center shrink-0">
            通信不安定
          </div>
        )}
        
        {/* 観戦者一覧 (Mobile) */}
        {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
          <div className="flex items-center justify-center gap-1 bg-card/80 py-1 text-[10px] text-muted-foreground shrink-0 border-b border-border">
            <Eye className="h-3 w-3" />
            <span>{currentRoom.spectators.map(s => s.name).join(', ')}</span>
          </div>
        )}

        {/* Compact header: Score vs Score */}
        <div className="flex items-center justify-between px-3 py-2 bg-card/50 border-b border-border shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase leading-tight">You</span>
            <span className="text-sm font-bold text-primary leading-tight">{myState.score.toLocaleString()}</span>
          </div>
          <div className="text-base font-bold italic text-muted-foreground px-2">VS</div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-muted-foreground uppercase leading-tight truncate max-w-[80px]">
              {opponentSnapshot?.playerName ?? 'Opponent'}
            </span>
            <span className="text-sm font-bold text-accent leading-tight">
              {(opponentState?.score ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Compact stats bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-card/30 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase leading-tight">Lv</div>
              <div className="text-sm font-bold leading-tight">{myState.level}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase leading-tight">Combo</div>
              <div className="text-sm font-bold leading-tight">{myState.combo > 0 ? `x${myState.combo}` : '-'}</div>
            </div>
            {myState.lastYaku && (
              <div className="text-center ml-2 animate-pulse">
                <div className="text-[10px] text-primary uppercase leading-tight">Yaku</div>
                <div className="text-xs font-bold text-primary leading-tight truncate max-w-[100px]">
                  {myState.lastYaku.japaneseName}
                </div>
              </div>
            )}
            {myState.garbageQueue > 0 && (
              <div className="text-center ml-2 animate-pulse">
                <div className="text-[10px] text-destructive uppercase leading-tight">Ojama</div>
                <div className="text-sm font-bold text-destructive leading-tight">{myState.garbageQueue}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase">Next</span>
            {myState.nextTile && (
              <div className="scale-75 origin-right">
                <Tile tile={myState.nextTile} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Game boards area */}
        <div className={`flex-1 flex flex-row items-stretch justify-center p-2 min-h-0 gap-2 w-full max-w-full transition-all duration-300 ${showHistory ? 'pb-[30dvh]' : ''}`}>
          <div 
            className="flex-1 flex items-center justify-center min-w-0 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <GameBoardComponent
              board={playerAnimBoard || myState.board}
              currentTile={playerAnimBoard ? null : myState.currentTile}
              isGameOver={myState.isGameOver}
              highlightTiles={hoveredTiles}
              isMobile
            />
          </div>
          
          {opponentState && (
            <div className="w-[60px] shrink-0 flex flex-col items-center justify-start pt-2">
              <div className="flex flex-col items-center bg-card/90 p-1 rounded-lg shadow-md border border-border/50 backdrop-blur-md w-full">
                <span className="text-[9px] text-muted-foreground mb-1 truncate w-full text-center">
                  {opponentSnapshot?.playerName}
                </span>
                <GameBoardComponent
                  board={opponentState.board}
                  currentTile={opponentState.currentTile}
                  isGameOver={opponentState.isGameOver}
                  isOpponent
                  scale={0.24}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom controls */}
        <div className="shrink-0 p-2 pb-6 bg-card/90 border-t border-border backdrop-blur-sm relative z-50">

          <GameControls
            onMove={(dir) => void sendGameInput(dir === 'left' ? 'move-left' : 'move-right')}
            onDrop={() => void sendGameInput('soft-drop')}
            onHardDrop={() => void sendGameInput('hard-drop')}
            onPause={() => {}}
            onReset={() => {}}
            onShowGuide={() => setShowGuide(true)}
            onShowHistory={() => setShowHistory(true)}
            isPaused={false}
            isGameOver={myState.isGameOver}
            hidePause
            hideReset
            isMobile
          />
        </div>
      </div>

      <YakuGuide open={showGuide} onOpenChange={setShowGuide} />

      {/* History modal */}
      <HistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        history={myState.clearHistory || []}
        onHoverItem={setHoveredTiles}
      />

      {/* Nico Nico Comments */}
      <NicoCommentsOverlay />

      {/* Hidden PDF Report Template */}
      {lastGameOver && (
        <div className="fixed top-[-9999px] left-[-9999px] z-[-1]">
          <div id="pdf-report-container" className="w-[800px] h-[600px] bg-white text-black p-12 flex flex-col items-center justify-center border-8 border-double border-slate-300 shadow-2xl relative">
            <div className="absolute top-4 left-4 right-4 bottom-4 border border-slate-200 pointer-events-none" />
            <h1 className="text-4xl font-serif font-bold text-slate-800 mb-2 tracking-widest">戦績証明書</h1>
            <p className="text-lg text-slate-500 mb-8 font-serif">Room: {lastGameOver.roomName}</p>
            
            <div className="w-full max-w-2xl bg-slate-50 rounded-xl p-8 mb-8 border border-slate-200">
              <div className="text-center mb-6">
                <span className="inline-block bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full mb-2">WINNER</span>
                <h2 className="text-3xl font-bold text-red-600">
                  {lastGameOver.winnerName}
                </h2>
              </div>
              
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="py-3 text-left font-semibold text-slate-600">プレイヤー</th>
                    <th className="py-3 text-right font-semibold text-slate-600">最終スコア</th>
                    <th className="py-3 text-center font-semibold text-slate-600">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {lastGameOver.scores.map(s => (
                    <tr key={s.playerId} className="border-b border-slate-200">
                      <td className="py-4 font-medium text-slate-800">{s.playerName}</td>
                      <td className="py-4 text-right font-mono font-bold text-slate-700">{s.score.toLocaleString()}</td>
                      <td className="py-4 text-center">
                        {s.playerId === lastGameOver.winnerId ? (
                          <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200">WIN</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">LOSE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-slate-600 font-serif">
              対戦日時: {new Date(lastGameOver.endedAt).toLocaleString('ja-JP')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
              <span className="w-8 h-[1px] bg-slate-300" />
              <span className="text-sm font-serif">PaiCrash Online Multiplayer</span>
              <span className="w-8 h-[1px] bg-slate-300" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SpectatorBoardPanel({ label, gameState }: { label: string; gameState: GameState }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0 min-w-0">
      <Badge variant="secondary" className="truncate max-w-[120px] md:max-w-[150px]">{label}</Badge>
      <GameBoardComponent
        board={gameState.board}
        currentTile={gameState.currentTile}
        isGameOver={gameState.isGameOver}
        isPaused={false}
        scale={0.45}
      />
      <p className="text-xs md:text-sm font-mono">Score: {gameState.score.toLocaleString()}</p>
    </div>
  );
}
