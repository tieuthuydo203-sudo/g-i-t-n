/**
 * Web Audio API synthesizer for 100% offline game sound effects.
 * No external audio files or CDN dependencies needed.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private ufoOsc: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;
  private beamOsc: OscillatorNode | null = null;
  private beamGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopUFOHover();
      this.stopBeamSound();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ufoGain && this.ctx) {
      this.ufoGain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);
    }
  }

  public playWarning() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      const startTime = now + i * 0.22;
      osc.frequency.setValueAtTime(500, startTime);
      osc.frequency.exponentialRampToValueAtTime(900, startTime + 0.12);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, startTime + 0.03);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }

  public startUFOHover() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ufoOsc) return;

    try {
      this.ufoOsc = this.ctx.createOscillator();
      this.ufoGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      this.ufoOsc.type = 'triangle';
      this.ufoOsc.frequency.setValueAtTime(95, this.ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.5, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(18, this.ctx.currentTime);

      lfo.connect(this.ufoOsc.frequency);
      this.ufoGain.gain.setValueAtTime(0.12 * this.volume, this.ctx.currentTime);

      this.ufoOsc.connect(this.ufoGain);
      this.ufoGain.connect(this.ctx.destination);

      lfo.start();
      this.ufoOsc.start();
    } catch {
      // AudioContext policy
    }
  }

  public stopUFOHover() {
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoOsc.disconnect();
      } catch {}
      this.ufoOsc = null;
      this.ufoGain = null;
    }
  }

  public startBeamSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.beamOsc) return;

    try {
      this.beamOsc = this.ctx.createOscillator();
      this.beamGain = this.ctx.createGain();

      this.beamOsc.type = 'sawtooth';
      this.beamOsc.frequency.setValueAtTime(240, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);

      this.beamGain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);

      this.beamOsc.connect(filter);
      filter.connect(this.beamGain);
      this.beamGain.connect(this.ctx.destination);

      this.beamOsc.start();
    } catch {}
  }

  public stopBeamSound() {
    if (this.beamOsc) {
      try {
        this.beamOsc.stop();
        this.beamOsc.disconnect();
      } catch {}
      this.beamOsc = null;
      this.beamGain = null;
    }
  }

  public playLiftSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playSuctionPop() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Pop / Zap sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Bell chime for score
    setTimeout(() => {
      this.playDing();
    }, 150);
  }

  public playDing() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, now); // B5

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playResultFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + i * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  public playWhoosh() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.5);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  // Deep rising sci-fi gravity pulse when ALL students get lifted together
  public playMassLevitation() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.linearRampToValueAtTime(800, now + 1.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.4);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    } catch {}
  }

  // Tense sonar / heartbeat pulse during the mid-air suspended floating phase
  public playSuspensePulse(pitch: number = 440) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.12);

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  // Comical thud / stumble landing sound when students drop back to ground
  public playDropThud() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  // Comical cartoon slide whistle (from uploaded Audio 1)
  public playSlideWhistle(up: boolean = true) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      if (up) {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1250, now + 0.6);
      } else {
        osc.frequency.setValueAtTime(1150, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.6);
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.62);
    } catch {}
  }

  // Cartoon tension woodblock clock tick (from uploaded Audio 1)
  public playCartoonTick(pitch: number = 800) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, now + 0.06);

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /* =========================================================================
     EDM SUSPENSE BACKGROUND MUSIC SYNTHESIZER (Matching uploaded Audio 2 & 1)
     - 128 BPM electronic four-on-the-floor beat with rolling synth bass
     - 16th-note clock-ticking suspense hi-hats
     - Tension arpeggiators & dramatic rising sweeps
     ========================================================================= */
  private bgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private customAudio: HTMLAudioElement | null = null;
  private customAudioUrl: string | null = null;

  public setCustomAudio(url: string | null) {
    this.customAudioUrl = url;
    if (url) {
      if (!this.customAudio) {
        this.customAudio = new Audio(url);
        this.customAudio.loop = true;
      } else {
        this.customAudio.src = url;
      }
      this.customAudio.volume = this.volume;
    } else {
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio = null;
      }
    }
  }

  public getCustomAudioUrl(): string | null {
    return this.customAudioUrl;
  }

  public startBGM() {
    if (!this.enabled) return;
    this.initContext();

    // If teacher uploaded custom audio, play that
    if (this.customAudio && this.customAudioUrl) {
      this.customAudio.currentTime = 0;
      this.customAudio.volume = this.volume;
      this.customAudio.play().catch(() => {});
      this.bgmPlaying = true;
      return;
    }

    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // 128 BPM: 16th note interval = (60 / 128) / 4 = ~117.18 ms
    const stepInterval = 117;
    this.bgmTimer = window.setInterval(() => {
      if (!this.bgmPlaying || !this.enabled || !this.ctx) return;
      this.tickBGMStep(this.bgmStep);
      this.bgmStep = (this.bgmStep + 1) % 64; // 4-bar loop
    }, stepInterval);
  }

  public stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.customAudio) {
      try {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      } catch {}
    }
  }

  private tickBGMStep(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = this.volume;

    // 1. Kick Drum (Four-on-the-floor EDM kick on beats 0, 4, 8, 12 in every 16 steps)
    const beatInBar = step % 16;
    if (beatInBar % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);

      gain.gain.setValueAtTime(0.35 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // 2. Snare / Clap on beats 4 and 12
    if (beatInBar === 4 || beatInBar === 12) {
      // Noise burst + tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

      gain.gain.setValueAtTime(0.2 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    // 3. Ticking Clock / Hi-Hat (Every 16th note or offbeat, creating the classic suspense clock tick)
    if (step % 2 === 0) {
      const isAccent = beatInBar % 4 === 2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isAccent ? 3600 : 2800, now);

      gain.gain.setValueAtTime((isAccent ? 0.08 : 0.04) * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    // 4. Rolling Synth Bassline (Driving EDM bass in A-minor: A -> C -> D -> E -> F -> G)
    const bar = Math.floor(step / 16);
    const bassRootNotes = [55, 43.65, 48.99, 55]; // A1, F1, G1, A1 (Hz)
    const root = bassRootNotes[bar % bassRootNotes.length];
    // Pattern: root, root, octave, root, third, octave...
    const noteMultipliers = [1, 1, 2, 1, 1.2, 1, 2, 1.2, 1, 1, 2, 1.33, 1.5, 1.2, 1, 2];
    const bassFreq = root * noteMultipliers[beatInBar];

    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    const bassFilter = this.ctx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassFreq, now);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(380, now);
    bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    bassGain.gain.setValueAtTime(0.18 * vol, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.12);

    // 5. Suspense Arpeggio Lead (Mysterious game-show melodic motif)
    if (step % 4 === 1 || step % 4 === 3) {
      const arpNotes = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
      const arpFreq = arpNotes[(step * 3) % arpNotes.length];

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(arpFreq, now);

      leadGain.gain.setValueAtTime(0.09 * vol, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      leadOsc.connect(leadGain);
      leadGain.connect(this.ctx.destination);
      leadOsc.start(now);
      leadOsc.stop(now + 0.15);
    }
  }
}

export const sound = new SoundEngine();
