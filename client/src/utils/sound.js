class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('dc_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('dc_sound_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, delay = 0, gainLevel = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

    gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.0, 0.2);
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.2);
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.2);
    this.playTone(1046.50, 'triangle', 0.25, 0.24, 0.25);
  }

  playNearMiss() {
    this.playTone(440, 'sine', 0.08, 0.0, 0.15);
    this.playTone(466.16, 'sine', 0.12, 0.07, 0.15);
  }

  playTick() {
    this.playTone(800, 'sine', 0.03, 0.0, 0.08);
  }

  playTurnStart() {
    this.playTone(392.00, 'sine', 0.1, 0.0, 0.15);
    this.playTone(587.33, 'sine', 0.18, 0.1, 0.18);
  }

  playWin() {
    this.playTone(523.25, 'triangle', 0.3, 0.0, 0.2);
    this.playTone(659.25, 'triangle', 0.3, 0.0, 0.2);
    this.playTone(783.99, 'triangle', 0.4, 0.0, 0.2);
    this.playTone(1046.50, 'triangle', 0.6, 0.15, 0.3);
  }
}

export const sounds = new SoundEffects();
