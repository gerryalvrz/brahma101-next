/**
 * Feed Hydra-compatible `a.fft` from an HTMLAudioElement (not the mic).
 */

export type HydraAudioShim = {
  fft: number[];
  setBins: (n: number) => void;
  show: () => void;
  hide: () => void;
  setSmooth?: (n: number) => void;
  setCutoff?: (n: number) => void;
  setScale?: (n: number) => void;
};

declare global {
  interface Window {
    a?: HydraAudioShim;
  }
}

const DEFAULT_BINS = 6;

export class AudioFftBridge {
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private raf = 0;
  private bins = DEFAULT_BINS;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private fft: number[] = Array(DEFAULT_BINS).fill(0);
  private sources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

  ensureShim() {
    const shim: HydraAudioShim = {
      fft: this.fft,
      setBins: (n: number) => this.setBins(n),
      show: () => {},
      hide: () => {},
      setSmooth: () => {},
      setCutoff: () => {},
      setScale: () => {},
    };
    window.a = shim;
    return shim;
  }

  setBins(n: number) {
    this.bins = Math.max(1, Math.min(32, n | 0));
    this.fft = Array(this.bins).fill(0);
    if (window.a) window.a.fft = this.fft;
    if (this.analyser) {
      this.data = new Uint8Array(
        new ArrayBuffer(this.analyser.frequencyBinCount)
      );
    }
  }

  async attach(audio: HTMLAudioElement) {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.72;
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 1;
      this.analyser.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.data = new Uint8Array(
        new ArrayBuffer(this.analyser.frequencyBinCount)
      );
    }

    try {
      this.source?.disconnect();
    } catch {
      /* ignore */
    }

    let source = this.sources.get(audio);
    if (!source) {
      source = this.ctx.createMediaElementSource(audio);
      this.sources.set(audio, source);
    }
    source.connect(this.analyser);
    this.source = source;

    this.ensureShim();
    this.setBins(this.bins);
    this.start();
  }

  async resume() {
    if (this.ctx?.state === "suspended") {
      await this.ctx.resume();
    }
  }

  dispose() {
    this.stop();
    try {
      this.source?.disconnect();
      this.analyser?.disconnect();
      this.gain?.disconnect();
    } catch {
      /* ignore */
    }
    void this.ctx?.close();
    this.ctx = null;
    this.source = null;
    this.analyser = null;
    this.gain = null;
    this.data = null;
  }

  private start() {
    if (this.raf) return;
    const tick = () => {
      this.sample();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private sample() {
    if (!this.analyser || !this.data) {
      for (let i = 0; i < this.fft.length; i++) this.fft[i] = 0;
      return;
    }
    this.analyser.getByteFrequencyData(this.data);
    const len = this.data.length;
    const chunk = Math.max(1, Math.floor(len / this.bins));
    for (let i = 0; i < this.bins; i++) {
      let sum = 0;
      const start = i * chunk;
      const end = Math.min(len, start + chunk);
      for (let j = start; j < end; j++) sum += this.data[j] ?? 0;
      const avg = sum / (end - start);
      this.fft[i] = avg / 255;
    }
    if (window.a) window.a.fft = this.fft;
  }
}
