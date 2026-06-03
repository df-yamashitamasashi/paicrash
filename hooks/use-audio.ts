'use client';

import { useState, useEffect } from 'react';
import { audio } from '@/lib/audio-manager';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [sfxVol, setSfxVol] = useState(0.5);
  const [bgmVol, setBgmVol] = useState(0.2);

  useEffect(() => {
    setIsMuted(audio.getMuted());
    setSfxVol(audio.getSfxVolume());
    setBgmVol(audio.getBgmVolume());
  }, []);

  const toggleMute = () => {
    const nextMute = !isMuted;
    audio.setMute(nextMute);
    setIsMuted(nextMute);
  };

  const updateSfxVolume = (vol: number) => {
    audio.setSfxVolume(vol);
    setSfxVol(vol);
  };

  const updateBgmVolume = (vol: number) => {
    audio.setBgmVolume(vol);
    setBgmVol(vol);
  };

  const playClick = () => audio.playClick();
  const playMove = () => audio.playMove();
  const playPlace = () => audio.playPlace();
  const playClear = (combo: number) => audio.playClear(combo);
  const playYaku = () => audio.playYaku();
  const playGameOver = () => audio.playGameOver();
  const playYakuman = () => audio.playYakuman();
  const playCountdownBeep = () => audio.playCountdownBeep();
  const playStartFanfare = () => audio.playStartFanfare();
  const enableAudio = () => audio.enable();
  const startBgm = () => audio.startBgm();
  const stopBgm = () => audio.stopBgm();

  return {
    isMuted,
    sfxVol,
    bgmVol,
    toggleMute,
    updateSfxVolume,
    updateBgmVolume,
    playClick,
    playMove,
    playPlace,
    playClear,
    playYaku,
    playGameOver,
    playYakuman,
    playCountdownBeep,
    playStartFanfare,
    enableAudio,
    startBgm,
    stopBgm,
  };
}
