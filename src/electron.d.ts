import type { SparkElectronApi } from "../electron/preload";

declare global {
  interface Window {
    sparkElectron?: SparkElectronApi;
  }
}

export {};
