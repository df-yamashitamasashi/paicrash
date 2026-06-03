import { useState, useEffect, useRef } from 'react';
import type { GameState, GameBoard } from '@/lib/mahjong-types';
import { useGameStore } from '@/lib/game-store';
import { audio } from '@/lib/audio-manager';

export function useYakumanAnimation(gameState: GameState | null, isPlayer: boolean = true) {
  const [animBoard, setAnimBoard] = useState<GameBoard | null>(null);
  const isAnimatingRef = useRef(false);
  const prevClearHistoryLength = useRef(0);
  
  useEffect(() => {
    if (!gameState) return;
    
    // Check if new clears happened
    if (gameState.clearHistory.length > prevClearHistoryLength.current) {
      const newClears = gameState.clearHistory.slice(prevClearHistoryLength.current);
      
      const yakumanClear = newClears.find(r => 
        r.yaku?.name === 'Thirteen Orphans' || 
        r.yaku?.name === 'All Honors' || 
        r.yaku?.name === 'Nine Gates'
      );
      
      if (yakumanClear && isPlayer) { // Only animate for the main player's board
         isAnimatingRef.current = true;
         
         // Reconstruct board for animation
         const board = JSON.parse(JSON.stringify(gameState.board)) as GameBoard;
         yakumanClear.tiles.forEach(t => {
            if (t.y >= 0 && t.y < board.height && t.x >= 0 && t.x < board.width) {
              board.tiles[t.y][t.x] = { ...t, isClearing: true };
            }
         });
         setAnimBoard(board);
         
         useGameStore.setState({ 
           isYakumanAnimating: true, 
           yakumanName: yakumanClear.yaku!.japaneseName 
         });
         audio.playYakuman();
         
         setTimeout(() => {
           useGameStore.setState({ isYakumanDissolving: true });
           
           setTimeout(() => {
             setAnimBoard(null);
             isAnimatingRef.current = false;
             useGameStore.setState({ isYakumanAnimating: false, isYakumanDissolving: false });
           }, 2000);
         }, 9000);
      }
    }
    prevClearHistoryLength.current = gameState.clearHistory.length;
  }, [gameState, isPlayer]);

  return { animBoard, isAnimating: isAnimatingRef.current };
}
