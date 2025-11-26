
type SoundType = 
  | 'success' 
  | 'failure' 
  | 'item_use' 
  | 'button_click' 
  | 'event_trigger' 
  | 'turn_end' 
  | 'sanity_low' 
  | 'hp_recovery' 
  | 'knowledge_gain' 
  | 'game_over'
  | 'alert'
  | 'heartbeat'
  | 'flatline'
  | 'glitch_noise';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5; // Default volume increased to 50%

  constructor() {
    // Load volume setting from storage if available
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('rsa_setting_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }
    }
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
    return this.ctx;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    
    try {
      localStorage.setItem('rsa_setting_volume', this.volume.toString());
    } catch (e) {
      console.error("Failed to save volume setting", e);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public getMuteStatus(): boolean {
    return this.isMuted;
  }

  private async init() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public play(type: SoundType) {
    this.init(); // Always ensure context is running
    if (this.isMuted) return;
    
    const ctx = this.getContext();
    const t = ctx.currentTime;

    switch (type) {
      case 'button_click':
        this.playTone(800, 'sine', t, 0.05, 0.15);
        this.playTone(1200, 'square', t, 0.01, 0.1); // Click transient
        break;

      case 'item_use':
        // Pop sound
        this.playTone(400, 'sine', t, 0.1, 0.25, 800); // Slide up
        break;

      case 'success':
        // Arpeggio
        this.playTone(523.25, 'triangle', t, 0.1, 0.2); // C5
        this.playTone(659.25, 'triangle', t + 0.05, 0.1, 0.2); // E5
        this.playTone(783.99, 'triangle', t + 0.1, 0.2, 0.2); // G5
        break;

      case 'failure':
        // Descending buzz
        this.playTone(150, 'sawtooth', t, 0.3, 0.2, 50);
        this.playTone(148, 'sawtooth', t, 0.3, 0.2, 48); // Detune
        break;

      case 'alert':
      case 'sanity_low':
        // Alarm
        this.playTone(800, 'square', t, 0.1, 0.2);
        this.playTone(800, 'square', t + 0.15, 0.1, 0.2);
        break;

      case 'event_trigger':
        // Notification bell
        this.playTone(660, 'sine', t, 0.2, 0.25);
        this.playTone(880, 'sine', t + 0.1, 0.4, 0.25);
        break;

      case 'turn_end':
        // Swoosh (Noise)
        this.playNoise(t, 0.3, 0.3);
        break;

      case 'hp_recovery':
        // Healing swell
        this.playTone(300, 'sine', t, 0.5, 0.2, 400);
        this.playTone(400, 'sine', t + 0.1, 0.5, 0.2, 600);
        break;

      case 'knowledge_gain':
        // Quick scale
        [440, 554, 659, 880].forEach((freq, i) => {
          this.playTone(freq, 'square', t + i * 0.04, 0.05, 0.15);
        });
        break;

      case 'game_over':
        // Deep impact
        this.playTone(100, 'sawtooth', t, 2.0, 0.4, 20);
        this.playNoise(t, 1.0, 0.5);
        break;

      case 'heartbeat':
        // Low thud
        this.playTone(60, 'sine', t, 0.1, 0.8, 40);
        this.playTone(60, 'sine', t + 0.2, 0.1, 0.5, 40);
        break;

      case 'flatline':
        // Continuous high pitch tone
        this.playTone(1000, 'sine', t, 2.0, 0.2);
        break;

      case 'glitch_noise':
        // Random noise burst
        this.playNoise(t, 0.2, 0.3);
        this.playTone(400 + Math.random() * 1000, 'sawtooth', t, 0.1, 0.2);
        break;
    }
  }

  private playTone(freq: number, type: OscillatorType, startTime: number, duration: number, vol: number, freqEnd?: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }

    // Local gain multiplied by intent volume, master gain handles global volume
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playNoise(startTime: number, duration: number, vol: number = 0.1) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    // Simple Lowpass filter for "swoosh" effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, startTime);
    filter.frequency.linearRampToValueAtTime(100, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(startTime);
  }
}

export const Sound = new SoundManager();
