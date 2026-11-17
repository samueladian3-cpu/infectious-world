/**
 * Audio Infectious World: efek suara dan musik latar adaptif yang disintesis
 * langsung dengan Web Audio API (tanpa file aset). Bila Web Audio tidak
 * tersedia (mis. di tes jsdom), semua fungsi diam tanpa galat.
 *
 * Musik memakai tangga nada pentatonis dengan petikan mirip sasando. Suasana
 * berubah per layar, dan intensitas di dalam game mengikuti nilai tertinggi
 * antara sebaran infeksi dan kesadaran warga. Saat kesadaran warga mendekati
 * 100% (krisis bagi patogen), tangga nada berganti minor dan tempo naik.
 */

export type Sfx =
  | 'click'
  | 'select'
  | 'buy'
  | 'event'
  | 'notify'
  | 'achievement'
  | 'crisis'
  | 'victory'
  | 'defeat'
  | 'correct'
  | 'wrong'
  | 'levelup'
  | 'error'
  | 'decision'
  | 'hoax'
  | 'region';

export type Mood = 'menu' | 'game' | 'win' | 'lose' | 'off';

export interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

type Ctx = AudioContext;

const MAJOR = [0, 2, 4, 7, 9]; // pentatonis mayor
const MINOR = [0, 3, 5, 7, 10]; // pentatonis minor
const ROOT = 50; // D3 (MIDI)
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const CHORDS = [0, -5, -3, -7]; // I – V – vi – IV (relatif ke root, dalam semiton)

class AudioEngine {
  private ctx: Ctx | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private duck: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | undefined;
  private settings: AudioSettings = { musicVolume: 0.5, sfxVolume: 0.7, muteMusic: false, muteSfx: false };
  private mood: Mood = 'off';
  private intensity = 0;
  private crisis = false;
  private ducked = false;
  private step = 0;
  private nextTime = 0;
  private seed = 7;

  /** Membuat/membangunkan AudioContext. Harus dipanggil dari gestur pengguna. */
  unlock() {
    if (!this.ctx) {
      const AC = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const ctx = this.ctx;
      const master = ctx.createDynamicsCompressor();
      master.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.connect(master);
      this.music = ctx.createGain();
      this.music.connect(this.duck);
      this.sfx = ctx.createGain();
      this.sfx.connect(master);
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      this.restartScheduler();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  configure(s: AudioSettings) {
    this.settings = s;
    this.applyVolumes();
  }

  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.step = 0;
    this.restartScheduler();
  }

  setIntensity(value: number, crisis: boolean) {
    this.intensity = Math.max(0, Math.min(1, value));
    this.crisis = crisis;
  }

  /** Musik dipelankan saat jeda atau saat Momen Penentu terbuka. */
  setDucked(ducked: boolean) {
    if (ducked === this.ducked) return;
    this.ducked = ducked;
    if (this.ctx && this.duck) this.duck.gain.setTargetAtTime(ducked ? 0.35 : 1, this.ctx.currentTime, 0.2);
  }

  play(name: Sfx) {
    const ctx = this.ctx;
    if (!ctx || !this.sfx || this.settings.muteSfx || this.settings.sfxVolume <= 0) return;
    const t = ctx.currentTime + 0.005;
    const out = this.sfx;
    switch (name) {
      case 'click':
        this.tone(out, t, 720, 0.04, 'square', 0.08);
        break;
      case 'select':
        this.tone(out, t, 660, 0.06, 'triangle', 0.18);
        this.tone(out, t + 0.06, 990, 0.08, 'triangle', 0.16);
        break;
      case 'buy':
        [0, 4, 7, 12].forEach((n, i) => this.pluck(out, t + i * 0.055, hz(74 + n), 0.3, 0.22));
        this.tone(out, t + 0.22, 2400, 0.12, 'sine', 0.06);
        break;
      case 'event':
        this.bell(out, t, hz(81), 0.9, 0.2);
        this.bell(out, t + 0.12, hz(86), 0.9, 0.14);
        break;
      case 'notify':
        this.bell(out, t, hz(79), 0.5, 0.16);
        this.bell(out, t + 0.1, hz(84), 0.6, 0.16);
        break;
      case 'achievement':
        [0, 4, 7, 12, 16].forEach((n, i) => this.pluck(out, t + i * 0.08, hz(72 + n), 0.5, 0.24));
        this.bell(out, t + 0.42, hz(96), 1.2, 0.12);
        break;
      case 'levelup':
        [0, 2, 4, 7, 9, 12, 14, 16, 19, 24].forEach((n, i) => this.pluck(out, t + i * 0.045, hz(67 + n), 0.35, 0.18));
        break;
      case 'crisis':
        for (let i = 0; i < 3; i++) {
          this.tone(out, t + i * 0.32, 520, 0.14, 'sawtooth', 0.12, 330);
          this.tone(out, t + i * 0.32 + 0.16, 440, 0.14, 'sawtooth', 0.12, 280);
        }
        break;
      case 'victory':
        [0, 7, 12, 15, 19].forEach((n, i) => this.pluck(out, t + i * 0.12, hz(50 + n), 1.2, 0.24));
        this.pad(out, t + 0.5, [50, 57, 62, 65], 2.2, 0.08);
        break;
      case 'defeat':
        // Kekalahan patogen = warga terlindungi: nada turun lalu akor mayor yang lega.
        [12, 9, 7, 4].forEach((n, i) => this.pluck(out, t + i * 0.16, hz(62 + n), 0.6, 0.2));
        this.pad(out, t + 0.7, [62, 66, 69, 74], 2.4, 0.08);
        break;
      case 'correct':
        this.pluck(out, t, hz(76), 0.3, 0.24);
        this.pluck(out, t + 0.09, hz(83), 0.45, 0.24);
        break;
      case 'wrong':
        this.tone(out, t, 220, 0.18, 'square', 0.1, 150);
        this.tone(out, t + 0.16, 160, 0.26, 'square', 0.1, 110);
        break;
      case 'error':
        this.tone(out, t, 150, 0.14, 'square', 0.09, 120);
        break;
      case 'decision':
        this.drum(out, t, 110, 0.5);
        this.whoosh(out, t, 0.5, 400, 3000, 0.12);
        this.bell(out, t + 0.12, hz(74), 0.8, 0.12);
        break;
      case 'hoax':
        this.tone(out, t, 600, 0.5, 'sawtooth', 0.08, 180, 7);
        break;
      case 'region':
        this.whoosh(out, t, 0.45, 300, 2500, 0.14);
        this.pluck(out, t + 0.2, hz(69), 0.3, 0.16);
        break;
    }
  }

  /* ---------- sintesis ---------- */

  private env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private tone(out: AudioNode, t: number, f: number, dur: number, type: OscillatorType, peak: number, fEnd?: number, vibrato?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = vibrato;
      lg.gain.value = f * 0.06;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    this.env(g, t, peak, 0.008, dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Petikan seperti sasando: segitiga + harmoni lembut, peluruhan cepat. */
  private pluck(out: AudioNode, t: number, f: number, dur: number, peak: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f * 6, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    for (const [mul, type, amt] of [
      [1, 'triangle', 1],
      [2.003, 'sine', 0.35],
    ] as const) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mul;
      og.gain.value = amt;
      o.connect(og).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    this.env(g, t, peak, 0.004, dur);
    lp.connect(g).connect(out);
  }

  private bell(out: AudioNode, t: number, f: number, dur: number, peak: number) {
    this.tone(out, t, f, dur, 'sine', peak);
    this.tone(out, t, f * 2.76, dur * 0.5, 'sine', peak * 0.25);
  }

  private pad(out: AudioNode, t: number, notes: number[], dur: number, peak: number) {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    for (const n of notes) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
    lp.connect(g).connect(out);
  }

  private drum(out: AudioNode, t: number, f: number, peak: number) {
    this.tone(out, t, f * 1.8, 0.22, 'sine', peak, f * 0.5);
  }

  private hat(out: AudioNode, t: number, peak: number, dur = 0.05) {
    const ctx = this.ctx!;
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.002, dur);
    src.connect(hp).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private whoosh(out: AudioNode, t: number, dur: number, f0: number, f1: number, peak: number) {
    const ctx = this.ctx!;
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    this.env(g, t, peak, dur * 0.4, dur);
    src.connect(bp).connect(g).connect(out);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  /* ---------- musik ---------- */

  private applyVolumes() {
    if (!this.ctx || !this.music || !this.sfx) return;
    const now = this.ctx.currentTime;
    const m = this.settings.muteMusic ? 0 : this.settings.musicVolume * 0.55;
    const s = this.settings.muteSfx ? 0 : this.settings.sfxVolume;
    this.music.gain.setTargetAtTime(m, now, 0.05);
    this.sfx.gain.setTargetAtTime(s, now, 0.02);
  }

  private rand() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  private restartScheduler() {
    if (typeof window === 'undefined') return;
    window.clearInterval(this.timer);
    this.timer = undefined;
    if (!this.ctx || this.mood === 'off') return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  private bpm() {
    if (this.mood === 'menu') return 84;
    if (this.mood === 'win' || this.mood === 'lose') return 72;
    return 96 + this.intensity * 28 + (this.crisis ? 10 : 0);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.music || this.settings.muteMusic) {
      if (ctx) this.nextTime = ctx.currentTime + 0.1;
      return;
    }
    const eighth = 60 / this.bpm() / 2;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.note(this.step, this.nextTime, eighth);
      this.step = (this.step + 1) % 64;
      this.nextTime += eighth;
    }
  }

  /** Satu langkah 1/8 ketukan; 8 langkah = 1 birama, 4 birama = 1 putaran akor. */
  private note(step: number, t: number, eighth: number) {
    const out = this.music!;
    const bar = Math.floor(step / 8);
    const pos = step % 8;
    const minor = this.mood === 'win' || (this.mood === 'game' && this.crisis);
    const scale = minor ? MINOR : MAJOR;
    const chordRoot = ROOT + (minor ? [0, -2, -4, -5][bar % 4] : CHORDS[bar % 4]);
    const game = this.mood === 'game';
    const k = this.intensity;

    // Pad akor di awal birama.
    if (pos === 0) {
      const third = minor ? 3 : 4;
      this.pad(out, t, [chordRoot + 12, chordRoot + 12 + third, chordRoot + 19], eighth * 8.2, game ? 0.035 : 0.05);
    }
    // Bas.
    if (game || this.mood === 'menu') {
      if (pos === 0 || (game && pos === 4) || (game && k > 0.6 && pos === 6)) this.pluck(out, t, hz(chordRoot - 12), eighth * 3, 0.22);
    }
    // Petikan melodi pentatonis.
    const density = this.mood === 'menu' ? 0.45 : this.mood === 'game' ? 0.45 + k * 0.4 : 0.3;
    if (this.rand() < density && !(this.mood !== 'game' && pos % 2 === 1)) {
      const deg = scale[Math.floor(this.rand() * scale.length)];
      const oct = this.rand() < 0.3 ? 24 : 12;
      this.pluck(out, t, hz(ROOT + deg + oct), eighth * 2.5, 0.1);
    }
    // Perkusi di dalam game.
    if (game) {
      if (pos === 0 || pos === 4) this.drum(out, t, 60, 0.35);
      if (k > 0.25 && pos % 2 === 1) this.hat(out, t, 0.05 + k * 0.05);
      if (this.crisis) {
        this.hat(out, t, 0.06, 0.03);
        if (pos === 2 || pos === 6) this.drum(out, t, 90, 0.18);
      }
    }
  }
}

export const audio = new AudioEngine();
