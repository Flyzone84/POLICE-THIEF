import { RoleId } from '../shared/types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playPopBurst(delay = 0) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.14;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 950;

    const gain = ctx.createGain();
    gain.gain.value = 0.22;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime + delay);
  }

  public playTap() {
    this.playTone(340, 0.065, 'triangle', 0.07, 0, 190);
  }

  public playShuffle() {
    [0, 0.09, 0.18, 0.27, 0.36].forEach((offset, i) => {
      this.playTone(210 + i * 38, 0.055, 'triangle', 0.05, offset, 130);
    });
  }

  public playFlip() {
    this.playTone(280, 0.085, 'sine', 0.06, 0, 540);
  }

  // Funny & memorable card-specific sound effects
  public playReveal(role: RoleId) {
    switch (role) {
      case 'King':
        // Grand comedic royal trumpet fanfare: Ta-da-da-DAAA!
        this.playTone(392, 0.11, 'sawtooth', 0.045, 0);
        this.playTone(392, 0.11, 'sawtooth', 0.045, 0.12);
        this.playTone(392, 0.11, 'sawtooth', 0.045, 0.24);
        this.playTone(523.25, 0.42, 'triangle', 0.11, 0.36, 535);
        this.playTone(659.25, 0.42, 'sine', 0.06, 0.36);
        break;

      case 'Queen':
        // Shimmering royal harp glissando
        [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((note, idx) => {
          this.playTone(note, 0.24, 'sine', 0.075, idx * 0.065);
        });
        break;

      case 'Police':
        // Playful cartoon police siren + whistle chirp!
        this.playTone(740, 0.16, 'triangle', 0.07, 0, 980);
        this.playTone(980, 0.16, 'triangle', 0.07, 0.16, 700);
        this.playTone(1350, 0.09, 'sine', 0.06, 0.36, 1520);
        this.playTone(1520, 0.16, 'sine', 0.06, 0.46, 1300);
        break;

      case 'Thief':
        // Sneaky cartoon tiptoe bassline ("dum... dum... dum-dum-dum-BOING!")
        this.playTone(146.83, 0.13, 'triangle', 0.09, 0, 138);
        this.playTone(164.81, 0.13, 'triangle', 0.09, 0.17, 155);
        this.playTone(174.61, 0.11, 'triangle', 0.09, 0.34, 165);
        this.playTone(196, 0.11, 'triangle', 0.09, 0.47, 185);
        this.playTone(146.83, 0.25, 'sine', 0.09, 0.61, 110);
        break;

      case 'Minister':
      case 'MLA':
      case 'MP':
        // Pompous wooden gavel double-knock + comical chime
        this.playTone(180, 0.07, 'square', 0.05, 0, 95);
        this.playTone(180, 0.07, 'square', 0.05, 0.13, 95);
        this.playTone(440, 0.2, 'triangle', 0.07, 0.26, 523.25);
        break;

      case 'Bandri':
      case 'Crown':
        // Clinking treasure coins!
        this.playTone(1174.66, 0.1, 'sine', 0.07, 0);
        this.playTone(1567.98, 0.18, 'sine', 0.08, 0.08);
        this.playTone(1760, 0.22, 'sine', 0.07, 0.16);
        break;

      case 'Cross':
      default:
        // Rubbery comic boing!
        this.playTone(230, 0.18, 'triangle', 0.08, 0, 390);
        this.playTone(390, 0.22, 'sine', 0.07, 0.16, 180);
        break;
    }
  }

  public playPoliceAlert() {
    this.playTone(620, 0.12, 'triangle', 0.07, 0, 860);
    this.playTone(860, 0.16, 'triangle', 0.07, 0.12, 580);
  }

  public playCaught(isThiefViewer = false) {
    if (isThiefViewer) {
      // Hilarious sad trombone ("Wah-wah-wah-waaaah") for the busted Thief!
      this.playTone(293.66, 0.22, 'sawtooth', 0.05, 0, 285);
      this.playTone(277.18, 0.22, 'sawtooth', 0.05, 0.24, 270);
      this.playTone(261.63, 0.22, 'sawtooth', 0.05, 0.48, 255);
      this.playTone(246.94, 0.65, 'sawtooth', 0.055, 0.72, 185);
    } else {
      // Popper POP + celebratory catch fanfare!
      this.playPopBurst(0);
      this.playPopBurst(0.14);
      this.playTone(523.25, 0.13, 'triangle', 0.09, 0.04);
      this.playTone(659.25, 0.13, 'triangle', 0.09, 0.14);
      this.playTone(783.99, 0.16, 'triangle', 0.1, 0.24);
      this.playTone(1046.5, 0.36, 'triangle', 0.11, 0.36);
    }
  }

  public playEscaped(isThiefViewer = false) {
    if (isThiefViewer) {
      // Sneaky popper + cheeky getaway jingle for the Thief!
      this.playPopBurst(0);
      this.playTone(392, 0.12, 'triangle', 0.08, 0.05, 587.33);
      this.playTone(659.25, 0.14, 'triangle', 0.09, 0.18, 783.99);
      this.playTone(880, 0.25, 'sine', 0.09, 0.32);
    } else {
      // Cartoon slip-away slide
      this.playTone(440, 0.14, 'sawtooth', 0.045, 0, 320);
      this.playTone(311, 0.28, 'triangle', 0.08, 0.15, 175);
    }
  }

  public playVictory() {
    this.playPopBurst(0);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.5 : 0.15, 'triangle', 0.09, 0.06 + idx * 0.11);
    });
  }
}

export const sound = new SoundEngine();
