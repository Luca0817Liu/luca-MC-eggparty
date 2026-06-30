/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentMusicNode: OscillatorNode | null = null;
  private currentMusicGain: GainNode | null = null;
  private currentMusicInterval: number | null = null;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private currentBiome: string = 'grassland';

  constructor() {
    // Context is created lazily on user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopMusic();
    } else {
      this.startMusic(this.currentBiome);
    }
    return this.isMusicMuted;
  }

  public toggleSfx() {
    this.isSfxMuted = !this.isSfxMuted;
    return this.isSfxMuted;
  }

  public getMusicMuteState() {
    return this.isMusicMuted;
  }

  public getSfxMuteState() {
    return this.isSfxMuted;
  }

  // SOUND EFFECTS
  public playJump() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playDoubleJump() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playDive() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Sweet white-noise whoosh or sweeping low frequency
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    // Create a low pass band filter
    const bqp = this.ctx.createBiquadFilter();
    bqp.type = 'lowpass';
    bqp.frequency.setValueAtTime(1000, this.ctx.currentTime);
    bqp.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.25);

    osc.connect(bqp);
    bqp.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playLand() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playDiamond() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Standard high pitch beautiful chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc1.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, this.ctx.currentTime); // D6
    osc2.frequency.setValueAtTime(1567.98, this.ctx.currentTime + 0.08); // G6

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.35);
    osc2.stop(this.ctx.currentTime + 0.35);
  }

  public playCoin() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playExplosion() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Retro white noise explosion
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it a heavy boom
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);
  }

  public playSmashBlock() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Crunchy sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(60, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playSpring() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playHurt() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Sound: low pitch "oof!"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playEnderTeleport() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playPortalEnter() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Vortex whoosh
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.6);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.6);
    osc2.stop(this.ctx.currentTime + 0.6);
  }

  public playWin() {
    if (this.isSfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Victory fanfare!
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    const duration = 0.08;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * duration);

      gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + idx * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * duration + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * duration);
      osc.stop(this.ctx!.currentTime + idx * duration + 0.3);
    });
  }

  // MUSIC SYSTEM (Chip tune ambient tracks)
  public startMusic(biome: string) {
    this.currentBiome = biome;
    if (this.isMusicMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopMusic();

    let tempo = 120; // BPM
    let scale: number[] = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C Major

    if (biome === 'mineshaft') {
      tempo = 100;
      scale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 415.30]; // A Harmonic Minor (spooky)
    } else if (biome === 'cloud') {
      tempo = 110;
      scale = [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37]; // D Lydian (ethereal/glassy)
    } else if (biome === 'deepsea') {
      tempo = 80;
      scale = [196.00, 220.00, 233.08, 261.63, 293.66, 311.13, 349.23]; // G Minor Pentatonic / Blue (sinking/slow)
    } else if (biome === 'ender') {
      tempo = 130;
      scale = [196.00, 207.65, 246.94, 261.63, 293.66, 311.13, 392.00]; // Phrygian / Spooky Boss theme
    }

    const stepDuration = 60 / tempo / 2; // Eighth notes
    let step = 0;

    const playStep = () => {
      if (!this.ctx || this.isMusicMuted) return;
      
      const time = this.ctx.currentTime;
      
      // Simple melodic ambient note (sometimes skips or changes chord)
      if (step % 2 === 0 && Math.random() < 0.7) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        // Choose a note from our scale
        let noteIdx = Math.floor(Math.random() * scale.length);
        // Sometimes play bass note
        let note = scale[noteIdx];
        if (step % 8 === 0) {
          note = scale[0] / 2; // Root octave lower
        } else if (step % 4 === 0) {
          note = scale[noteIdx % 3] / 2;
        }

        osc.frequency.setValueAtTime(note, time);
        
        // soft attack and decay
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(time);
        osc.stop(time + stepDuration * 3);
      }

      // Bass beat on count 1 & 3
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(100, time);
        kickOsc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

        kickGain.gain.setValueAtTime(0.05, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(time);
        kickOsc.stop(time + 0.16);
      }

      // Snare pop on count 2 & 4
      if (step % 4 === 2 && Math.random() < 0.8) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(150, time);
        snareOsc.frequency.linearRampToValueAtTime(20, time + 0.08);

        snareGain.gain.setValueAtTime(0.02, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        snareOsc.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snareOsc.start(time);
        snareOsc.stop(time + 0.09);
      }

      step = (step + 1) % 16;
    };

    // Use an interval for music trigger loops
    const loopInterval = setInterval(() => {
      try {
        playStep();
      } catch (err) {
        console.error('Audio music loop error', err);
      }
    }, stepDuration * 1000);

    this.currentMusicInterval = loopInterval as any;
  }

  public stopMusic() {
    if (this.currentMusicInterval) {
      clearInterval(this.currentMusicInterval);
      this.currentMusicInterval = null;
    }
  }
}

export const gameAudio = new SoundSynthesizer();
