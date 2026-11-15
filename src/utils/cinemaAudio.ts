// Web Audio API synthesizer for BranchFrame Play atmospheric soundscapes
class CinemaAudioEngine {
  private ctx: AudioContext | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startDrone(
    mood: 'TENSION_PULSE' | 'DECISION_HEARTBEAT' | 'CYAN_HORIZON' | 'QUARANTINE_DRONE'
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stopDrone();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    const freqMap = {
      TENSION_PULSE: [65.41, 98.0], // C2 + G2 fifth
      DECISION_HEARTBEAT: [55.0, 58.27], // A1 + Bb1 minor second tension
      CYAN_HORIZON: [73.42, 110.0], // D2 + A2 open fifth
      QUARANTINE_DRONE: [49.0, 69.3], // G1 + Db2 tritone containment
    };

    const [f1, f2] = freqMap[mood] || freqMap.TENSION_PULSE;
    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(f1, now);
    osc2.frequency.setValueAtTime(f2, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.6);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    this.oscPrimary = osc1;
    this.oscSub = osc2;
    this.gainNode = gain;
    this.isPlaying = true;
  }

  public stopDrone() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      }
      setTimeout(() => {
        try {
          this.oscPrimary?.stop();
          this.oscSub?.stop();
          this.oscPrimary?.disconnect();
          this.oscSub?.disconnect();
        } catch {}
      }, 260);
    } catch {}
    this.isPlaying = false;
  }

  public playChoiceCue(type: 'SELECT' | 'TRANSITION') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (type === 'SELECT') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.14);
    } else {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.18);
    }

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }
}

export const cinemaAudio = new CinemaAudioEngine();
