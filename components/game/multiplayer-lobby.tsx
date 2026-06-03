'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMultiplayer } from '@/hooks/use-multiplayer';
import { useMultiplayerStore } from '@/lib/multiplayer-store';
import { cn } from '@/lib/utils';
import {
  ConnectIcon,
  LeaveIcon,
  ChatIcon,
  ReadyIcon,
  CancelIcon,
  HostCrownIcon,
  MultiplayerIcon,
  PlayIcon,
  AddIcon,
  JoinIcon,
  DisconnectIcon,
} from '@/components/icons/mahjong';
import { Eye } from 'lucide-react';

interface MultiplayerLobbyProps {
  onBack: () => void;
}

export function MultiplayerLobby({ onBack }: MultiplayerLobbyProps) {
  const {
    status,
    role,
    playerId,
    playerName,
    currentRoom,
    availableRooms,
    messages,
    error,
    isServerConnected,
    connect,
    resumeSession,
    disconnect,
    createRoom,
    joinRoom,
    spectateRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendMessage,
  } = useMultiplayer();

  const { data: session } = useSession();
  const [roomNameInput, setRoomNameInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resumeAttempted, setResumeAttempted] = useState(false);
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    if (resumeAttempted) return;
    setResumeAttempted(true);
    void resumeSession();
  }, [resumeAttempted, resumeSession]);

  useEffect(() => {
    if (session?.user?.name && status === 'disconnected' && resumeAttempted && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      void connect(session.user.name);
    }
  }, [session, status, resumeAttempted, connect]);

  useEffect(() => {
    if (session?.user?.name && !playerName) {
      useMultiplayerStore.getState().setPlayerName(session.user.name);
    }
  }, [session?.user?.name, playerName]);

  const handleCreateRoom = async () => {
    if (roomNameInput.trim()) {
      await createRoom(roomNameInput.trim());
      setShowCreateDialog(false);
      setRoomNameInput('');
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      void sendMessage(chatInput);
      setChatInput('');
    }
  };

  if (status === 'disconnected' || status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-primary mb-2">オンライン対戦</h2>
          <p className="text-muted-foreground">サーバーに接続中...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Googleアカウントのユーザー名を使用します
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="max-w-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center py-4">
                <ConnectIcon className="h-8 w-8 animate-spin text-primary" />
              </div>
              <Button onClick={onBack} className="w-full bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none">
                <LeaveIcon className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((status === 'in-room' || status === 'spectating') && currentRoom) {
    const myPlayer = currentRoom.players.find((p) => p.id === playerId);
    const isHost = myPlayer?.isHost ?? false;
    const isSpectator = role === 'spectator';
    const allReady = currentRoom.players.every((p) => p.isReady && p.isConnected);
    const canStart = isHost && allReady && currentRoom.players.length >= 2 && !currentRoom.isStarted;

    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-primary">{currentRoom.name}</h2>
              {isSpectator && <Badge variant="outline">観戦中</Badge>}
              {currentRoom.isStarted && <Badge>対戦中</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentRoom.players.length}/{currentRoom.maxPlayers} プレイヤー · 観戦 {currentRoom.spectatorCount}/{currentRoom.maxSpectators}
            </p>
          </div>
          <Button variant="outline" onClick={() => void leaveRoom()}>
            <LeaveIcon className="h-4 w-4 mr-2" />
            退出
          </Button>
        </div>

        {!isServerConnected && (
          <Alert variant="destructive">
            <AlertDescription>サーバーとの接続が不安定です。自動再接続を試行しています。</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プレイヤー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentRoom.players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  player.id === playerId ? 'bg-primary/10 border-primary/30' : 'bg-card',
                )}
              >
                <div className="flex items-center gap-2">
                  {player.isHost && <HostCrownIcon className="h-4 w-4 text-primary" />}
                  <span className="font-medium">{player.name}</span>
                  {player.id === playerId && (
                    <Badge variant="secondary" className="text-xs">あなた</Badge>
                  )}
                  {!player.isConnected && (
                    <Badge variant="destructive" className="text-xs">切断</Badge>
                  )}
                </div>
                <Badge variant={player.isReady ? 'default' : 'secondary'}>
                  {player.isReady ? '準備完了' : '待機中'}
                </Badge>
              </div>
            ))}

            {currentRoom.players.length < currentRoom.maxPlayers && !currentRoom.isStarted && (
              <div className="flex items-center justify-center p-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground">
                <MultiplayerIcon className="h-4 w-4 mr-2" />
                対戦相手を待っています...
              </div>
            )}
          </CardContent>
        </Card>

        {currentRoom.spectators.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">観戦者</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {currentRoom.spectators.map((spectator) => (
                <Badge key={spectator.id} variant="outline">
                  {spectator.name}
                  {spectator.id === playerId ? '（あなた）' : ''}
                  {!spectator.isConnected ? ' · 切断' : ''}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">チャット</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 mb-3 p-3 bg-muted/50 rounded-lg">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">メッセージがありません</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-primary">
                        {msg.playerName}
                        {msg.role === 'spectator' ? '（観戦）' : ''}:{' '}
                      </span>
                      <span className="text-foreground">{msg.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="メッセージを入力..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                maxLength={200}
              />
              <Button onClick={handleSendMessage} size="icon">
                <ChatIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {!isSpectator && !currentRoom.isStarted && (
          <div className="flex gap-3">
            <Button
              variant={myPlayer?.isReady ? 'secondary' : 'default'}
              onClick={() => void toggleReady()}
              className="flex-1"
            >
              {myPlayer?.isReady ? (
                <>
                  <CancelIcon className="h-4 w-4 mr-2" />
                  準備解除
                </>
              ) : (
                <>
                  <ReadyIcon className="h-4 w-4 mr-2" />
                  準備完了
                </>
              )}
            </Button>
            {isHost && (
              <Button onClick={() => void startGame()} disabled={!canStart} className="flex-1">
                <PlayIcon className="h-4 w-4 mr-2" />
                ゲーム開始
              </Button>
            )}
          </div>
        )}

        {isSpectator && currentRoom.isStarted && (
          <p className="text-center text-sm text-muted-foreground">
            対戦画面は自動的に表示されます
          </p>
        )}

        {error && <p className="text-destructive text-sm text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">ロビー</h2>
          <p className="text-sm text-muted-foreground">ようこそ、{playerName}さん</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onBack} className="bg-yellow-200 hover:bg-yellow-300 text-yellow-950 font-bold border-none">
            <LeaveIcon className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <Button variant="outline" onClick={disconnect}>
            <DisconnectIcon className="h-4 w-4 mr-2" />
            切断
          </Button>
        </div>
      </div>

      {!isServerConnected && (
        <Alert variant="destructive">
          <AlertDescription>サーバーとの接続が切断されました。</AlertDescription>
        </Alert>
      )}

      <Button onClick={() => setShowCreateDialog(true)}>
        <AddIcon className="h-4 w-4 mr-2" />
        部屋を作成
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">部屋一覧</CardTitle>
          <CardDescription>参加または観戦する部屋を選んでください</CardDescription>
        </CardHeader>
        <CardContent>
          {availableRooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">利用可能な部屋がありません</p>
          ) : (
            <div className="space-y-3">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{room.name}</h4>
                      {room.isStarted && <Badge>対戦中</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {room.playerCount}/{room.maxPlayers} プレイヤー · 観戦 {room.spectatorCount}/{room.maxSpectators}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void joinRoom(room.id)}
                      disabled={room.playerCount >= room.maxPlayers || room.isStarted}
                      size="sm"
                    >
                      <JoinIcon className="h-4 w-4 mr-2" />
                      参加
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void spectateRoom(room.id)}
                      disabled={room.spectatorCount >= room.maxSpectators}
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      観戦
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>部屋を作成</DialogTitle>
            <DialogDescription>新しい対戦部屋を作成します（最大2人 + 観戦20人）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="部屋名（2〜32文字）"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              maxLength={32}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateRoom} disabled={!roomNameInput.trim()}>
                作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}
    </div>
  );
}
