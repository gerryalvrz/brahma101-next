declare module "hydra-synth" {
  export type HydraOptions = {
    canvas?: HTMLCanvasElement | null;
    width?: number;
    height?: number;
    numSources?: number;
    numOutputs?: number;
    makeGlobal?: boolean;
    autoLoop?: boolean;
    detectAudio?: boolean;
    enableStreamCapture?: boolean;
    precision?: "lowp" | "mediump" | "highp";
  };

  export type HydraOutput = {
    frag?: string;
    vert?: string;
    label?: string;
  };

  export type HydraAudio = {
    fft: number[];
    show: () => void;
    hide: () => void;
    setBins: (n: number) => void;
    setCutoff: (n: number) => void;
    setSmooth: (n: number) => void;
    setScale: (n: number) => void;
    stream?: MediaStream;
  };

  export default class Hydra {
    constructor(opts?: HydraOptions);
    canvas: HTMLCanvasElement;
    o: HydraOutput[];
    detectAudio: boolean;
    synth: { a?: HydraAudio; [key: string]: unknown };
    eval(code: string): void;
    hush(): void;
    setResolution(width: number, height: number): void;
    getScreenImage(callback: (blob: Blob) => void): void;
    _initAudio: () => void;
  }
}
