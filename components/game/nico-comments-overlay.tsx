'use client';

import { useEffect, useState, useRef } from 'react';
import { useMultiplayerStore } from '@/lib/multiplayer-store';
import type { ChatMessagePayload } from '@/lib/multiplayer-protocol';
import { cn } from '@/lib/utils';

interface ActiveComment extends ChatMessagePayload {
  top: number;
  duration: number;
  fontSize: number;
}

export function NicoCommentsOverlay() {
  const messages = useMultiplayerStore((state) => state.messages);
  const [activeComments, setActiveComments] = useState<ActiveComment[]>([]);
  
  // マウントした時刻以降のメッセージのみをアニメーションさせる
  const lastProcessedTime = useRef<number>(Date.now());

  useEffect(() => {
    // 新しいメッセージを抽出
    const newMessages = messages.filter((m) => m.timestamp > lastProcessedTime.current);
    
    if (newMessages.length > 0) {
      // 処理済み時刻を更新
      lastProcessedTime.current = Math.max(...newMessages.map((m) => m.timestamp));
      
      const newActive = newMessages.map((msg) => ({
        ...msg,
        // 上下位置をランダムに分散 (5% 〜 80%)
        top: Math.random() * 75 + 5,
        // アニメーション時間 (流れる速さ) を 5秒〜8秒にランダム化
        duration: Math.random() * 3 + 5,
        // フォントサイズ (24px 〜 40px)
        fontSize: Math.random() * 16 + 24,
      }));
      
      setActiveComments((prev) => [...prev, ...newActive]);
      
      // アニメーション完了後にDOMから削除
      newActive.forEach((comment) => {
        setTimeout(() => {
          setActiveComments((prev) => prev.filter((c) => c.id !== comment.id));
        }, comment.duration * 1000 + 500); // 念のため500msのバッファ
      });
    }
  }, [messages]);

  if (activeComments.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {activeComments.map((comment) => (
        <div
          key={comment.id}
          className="absolute left-0 whitespace-nowrap font-bold text-white animate-nico-scroll tracking-widest"
            style={{
              top: `${comment.top}%`,
              fontSize: `${comment.fontSize}px`,
              animationDuration: `${comment.duration}s`,
              // 文字の縁取り（黒）を濃くして視認性を高める
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 3px 6px rgba(0,0,0,0.8)',
            }}
        >
          {comment.text}
        </div>
      ))}
    </div>
  );
}
