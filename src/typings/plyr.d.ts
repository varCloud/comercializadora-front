// Minimal type stub for plyr that avoids the export=/export default conflict
// in plyr's own declarations (known plyr bug with moduleResolution: bundler).
// We only declare what AssetPlayerComponent actually uses.

declare class Plyr {
  constructor(
    target: string | HTMLVideoElement | HTMLAudioElement | HTMLElement,
    options?: Plyr.Options
  );
  destroy(): void;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  fullscreen: Plyr.FullscreenControl;
}

declare namespace Plyr {
  interface Options {
    controls?: string[];
    resetOnEnd?: boolean;
    [key: string]: unknown;
  }
  interface FullscreenControl {
    active: boolean;
    enter(): void;
    exit(): void;
  }
}

export default Plyr;
