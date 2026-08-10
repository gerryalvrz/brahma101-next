export {};

declare global {
  interface Window {
    a?: {
      fft: number[];
      show: () => void;
      hide: () => void;
      setBins: (n: number) => void;
      setCutoff: (n: number) => void;
      setSmooth: (n: number) => void;
      setScale: (n: number) => void;
      stream?: MediaStream;
    };
  }
}
