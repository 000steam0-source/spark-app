import { installNativeFetch } from "./nativeFetch";
import { mobileSigner } from "./signer";

// Absent on mobile so the renderer uses its browser fallbacks.
const ABSENT = new Set([
  "authSession",
  "diagnoseNetwork",
  "getCacheStats",
  "getDiscordStatus",
  "openCacheFolder",
  "openDownloads",
  "openExportFolder",
]);

const noopUnsubscribe = () => () => {};
const resolved = () => Promise.resolve(undefined);

function platformName(): string {
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() === "ios" ? "ios" : "android";
}

export function isNativeMobile(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export async function installMobilePlatform(): Promise<void> {
  installNativeFetch();
  document.documentElement.classList.add("spark-mobile", `spark-${platformName()}`);

  const youtube = {
    mintPoToken: async (identifier: string) =>
      (await import("./youtube/web-minter")).mintWebPoToken(identifier),
    youtubeTvSession: async () => (await import("./youtube/tv-session")).getTvSession(),
    youtubeSolveN: async (playerId: string, values: string[]) =>
      (await import("./youtube/n-solver")).solveN(playerId, values),
  };

  const explicit: Record<string, unknown> = {
    platform: platformName(),
    isHyprland: false,
    ...mobileSigner,
    ...youtube,
    getAppVersion: async () => __APP_VERSION__,
    isMaximized: async () => true,
    isFullScreen: async () => false,
    checkForUpdates: async () => ({ available: false, disabled: true }),
    clearCoversCache: async () => true,
    clearAudioCache: async () => true,
    clearHttpCache: async () => true,
    toggleOverlay: async () => false,
    isOverlayOpen: async () => false,
  };

  const bridge = new Proxy(explicit, {
    get(target, key) {
      if (typeof key !== "string") return undefined;
      if (ABSENT.has(key)) return undefined;
      if (key in target) return target[key];
      if (key === "then" || key === "toJSON") return undefined;
      if (/^on[A-Z]/.test(key)) return noopUnsubscribe;
      return resolved;
    },
    has(target, key) {
      return typeof key === "string" && !ABSENT.has(key) && key !== "then";
    },
  });

  (window as unknown as { sparkElectron: unknown }).sparkElectron = bridge;

  void import("@capacitor/app").then(({ App }) => {
    void App.addListener("backButton", ({ canGoBack }) => {
      const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
      const handled = !target.dispatchEvent(escape);
      if (handled) return;
      if (canGoBack && window.location.hash.replace(/^#\/?/, "") !== "") window.history.back();
      else void App.minimizeApp();
    });
  });
}
