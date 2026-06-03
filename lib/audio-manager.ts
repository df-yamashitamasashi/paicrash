'use client';

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVol: number = 0.5;
  private bgmVol: number = 0.2;
  private bgmNode: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private isPlayingBgm: boolean = false;
  private bgmTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('paicrash_muted') === 'true';
      this.sfxVol = parseFloat(localStorage.getItem('paicrash_sfx_vol') || '0.5');
      this.bgmVol = parseFloat(localStorage.getItem('paicrash_bgm_vol') || '0.2');
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public enable() {
    this.initCtx();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('paicrash_muted', String(muted));
    }
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('paicrash_sfx_vol', String(this.sfxVol));
    }
  }

  public getSfxVolume() {
    return this.sfxVol;
  }

  public setBgmVolume(vol: number) {
    this.bgmVol = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('paicrash_bgm_vol', String(this.bgmVol));
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVol, this.ctx?.currentTime || 0);
    }
  }

  public getBgmVolume() {
    return this.bgmVol;
  }

  // Plays a short UI Click
  public playClick() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.sfxVol * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Plays a soft sliding move tone
  public playMove() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(this.sfxVol * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // Plays a deep satisfying place thump
  public playPlace() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVol * 0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // Plays standard match clear arpeggio
  public playClear(comboCount: number = 0) {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const baseFreq = 440 * Math.pow(1.15, Math.min(comboCount, 12)); // Higher pitch per combo!
    const notes = [1, 1.25, 1.5, 2]; // Major chord ratios

    notes.forEach((ratio, index) => {
      const timeOffset = index * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, ctx.currentTime + timeOffset);

      gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.4, ctx.currentTime + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.2);
    });
  }

  // Celebrate with high-fi chime for scoring a Yaku
  public playYaku() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const baseFreq = 523.25; // C5
    const chord = [1, 1.2, 1.5, 1.8, 2]; // Sparkly major 7th feel
    
    chord.forEach((ratio, index) => {
      const timeOffset = index * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, ctx.currentTime + timeOffset);

      gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.5, ctx.currentTime + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.5);
    });
  }

  // Descending sad chiptune tune for Game Over
  public playGameOver() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const notes = [400, 350, 300, 200];
    notes.forEach((freq, index) => {
      const timeOffset = index * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);

      gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.5, ctx.currentTime + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.3);
    });
  }

  // Retro short beep for countdown ticks (3, 2, 1)
  public playCountdownBeep() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note

    gain.gain.setValueAtTime(this.sfxVol * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Triumphant start fanfare when game starts (GO!)
  public playStartFanfare() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    // Arpeggiated C-major bright chiptune fanfare
    // C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const timeOffset = index * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
      
      // Add slight vibrato/pitch bend up
      osc.frequency.linearRampToValueAtTime(freq * 1.02, ctx.currentTime + timeOffset + 0.15);

      gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.5, ctx.currentTime + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.3);
    });
  }

  // Epic multi-layer synthesizer arpeggio sweep for Yakuman
  public playYakuman() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    // Temporarily pause normal background BGM to make room for epic sound effect
    const wasPlayingBgm = this.isPlayingBgm;
    this.stopBgm();

    const baseFreq = 261.63; // C4
    // C major chord sweep (C4, E4, G4, C5, E5, G5, C6)
    const notes = [1, 1.25, 1.5, 2, 2.5, 3, 4];
    
    // Play rising sparkly chords
    notes.forEach((ratio, index) => {
      const timeOffset = index * 0.15;
      
      // Layer 1: Bright sawtooth brass
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq * ratio, ctx.currentTime + timeOffset);
      
      gain1.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gain1.gain.linearRampToValueAtTime(this.sfxVol * 0.4, ctx.currentTime + timeOffset + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.6);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime + timeOffset);
      osc1.stop(ctx.currentTime + timeOffset + 0.7);

      // Layer 2: Ringing triangle chime (one octave higher)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * ratio * 2, ctx.currentTime + timeOffset + 0.05);

      gain2.gain.setValueAtTime(0, ctx.currentTime + timeOffset + 0.05);
      gain2.gain.linearRampToValueAtTime(this.sfxVol * 0.3, ctx.currentTime + timeOffset + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.8);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + timeOffset + 0.05);
      osc2.stop(ctx.currentTime + timeOffset + 0.9);
    });

    // Deep sub bass drop
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
    subOsc.frequency.exponentialRampToValueAtTime(45.00, ctx.currentTime + 1.2);

    subGain.gain.setValueAtTime(0, ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(this.sfxVol * 0.9, ctx.currentTime + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(ctx.currentTime);
    subOsc.stop(ctx.currentTime + 2.0);

    // Resume BGM after sweep finishes
    if (wasPlayingBgm) {
      setTimeout(() => {
        this.startBgm();
      }, 5200);
    }
  }

  // Gentle procedural chiptune BGM loops
  public startBgm() {
    if (this.isPlayingBgm || this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.isPlayingBgm = true;
    
    // Create master BGM gain node
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.bgmVol, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);

    // Soothing, cute Pop chord progression & melody structure
    // C Major scale, 32-step loop structure:
    // Steps 0-7: Verse A (Calm intro arpeggio)
    // Steps 8-15: Verse B (Melody builds up)
    // Steps 16-27: Chorus (High bright, happy pop theme)
    // Steps 28-31: Outro/Transition
    
    // Notes mapping (C4 to A5)
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77;

    // 32-step melody track
    const popMelody = [
      // Verse A: Soft arpeggio pattern
      C5, E5, G5, E5, D5, F5, A5, F5,
      C5, E5, G5, E5, D5, G5, B5, G5,
      // Chorus: Bright pop melody
      E5, G5, C5 * 2, B5, A5, F5, A5, G5,
      E5, C5, D5, E5, D5, G4, B4, D5
    ];

    // Bass roots: C - F - C - G
    const bassRoots = [
      C4/2, C4/2, C4/2, C4/2, F4/2, F4/2, F4/2, F4/2,
      C4/2, C4/2, C4/2, C4/2, G4/2, G4/2, G4/2, G4/2,
      C4/2, E4/2, F4/2, A4/2, G4/2, G4/2, G4/2, G4/2,
      C4/2, C4/2, D4/2, D4/2, G4/2, G4/2, G4/2, G4/2
    ];

    let step = 0;
    const stepTime = 0.3; // Lively pop tempo (133 BPM)

    const playSequence = () => {
      if (!this.isPlayingBgm || this.isMuted || !this.ctx) return;
      
      const currentTime = this.ctx.currentTime;
      const index = step % 32;
      
      // 1. Soothing main lead oscillator (Warm Triangle/Sine hybrid feeling)
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = index >= 16 ? 'triangle' : 'sine'; // Triangle for chorus to make it slightly brighter/pop
      osc.frequency.setValueAtTime(popMelody[index], currentTime);

      noteGain.gain.setValueAtTime(0, currentTime);
      noteGain.gain.linearRampToValueAtTime(index >= 16 ? 0.12 : 0.18, currentTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + stepTime * 1.6);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain!);

      osc.start(currentTime);
      osc.stop(currentTime + stepTime * 1.8);

      // 2. Pop Chord Accompaniment (soft background pad on beats)
      if (step % 2 === 0) {
        const root = bassRoots[index];
        const chordNotes = [root * 2, root * 2.5, root * 3]; // Major triad ratios
        
        chordNotes.forEach((freq, chordIndex) => {
          if (!this.ctx) return;
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();

          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(freq, currentTime);

          padGain.gain.setValueAtTime(0, currentTime);
          padGain.gain.linearRampToValueAtTime(0.04, currentTime + 0.08);
          padGain.gain.exponentialRampToValueAtTime(0.001, currentTime + stepTime * 2);

          padOsc.connect(padGain);
          padGain.connect(this.bgmGain!);

          padOsc.start(currentTime);
          padOsc.stop(currentTime + stepTime * 2.2);
        });
      }

      // 3. Structured Rhythmic Pop Bass
      if (step % 4 === 0 || step % 4 === 3) { // Syncopated pop bass rhythm
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassRoots[index], currentTime);

        bassGain.gain.setValueAtTime(0, currentTime);
        bassGain.gain.linearRampToValueAtTime(0.22, currentTime + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.001, currentTime + stepTime * 1.5);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain!);

        bassOsc.start(currentTime);
        bassOsc.stop(currentTime + stepTime * 2);
      }

      step++;
      this.bgmTimeout = setTimeout(playSequence, stepTime * 1000);
    };

    playSequence();
  }

  public stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch (e) {}
      this.bgmGain = null;
    }
  }
}

export const audio = new AudioManager();
