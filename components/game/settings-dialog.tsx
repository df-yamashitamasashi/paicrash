'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { useAudio } from '@/hooks/use-audio';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { isMuted, sfxVol, bgmVol, toggleMute, updateSfxVolume, updateBgmVolume, playClick } = useAudio();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ 設定
          </DialogTitle>
          <DialogDescription>
            サウンドの設定を変更できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Mute toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">サウンド</span>
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => {
                playClick();
                toggleMute();
              }}
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  ミュート中
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  ON
                </>
              )}
            </Button>
          </div>

          {/* BGM volume */}
          <div className={`flex flex-col gap-2 transition-opacity ${isMuted ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Music className="h-4 w-4 text-primary" />
                BGM 音量
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {Math.round(bgmVol / 0.5 * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={bgmVol}
              onChange={(e) => updateBgmVolume(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX volume */}
          <div className={`flex flex-col gap-2 transition-opacity ${isMuted ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-primary" />
                効果音 音量
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {Math.round(sfxVol * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVol}
              onChange={(e) => updateSfxVolume(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
