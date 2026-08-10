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

  export default class Hydra {
    constructor(opts?: HydraOptions);
    canvas: HTMLCanvasElement;
    eval(code: string): void;
    hush(): void;
    setResolution(width: number, height: number): void;
  }
}
