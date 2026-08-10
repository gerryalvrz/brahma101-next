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

  export default class Hydra {
    constructor(opts?: HydraOptions);
    canvas: HTMLCanvasElement;
    o: HydraOutput[];
    eval(code: string): void;
    hush(): void;
    setResolution(width: number, height: number): void;
    getScreenImage(callback: (blob: Blob) => void): void;
  }
}
