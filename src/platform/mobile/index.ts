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

  if (import.meta.env.VITE_SPARK_SELFTEST === "1") runSelfTest();
}

// CI-only smoke test: enters guest mode, presses the hero play button and
// reports what the player does. Only compiled in when VITE_SPARK_SELFTEST=1.
function runSelfTest(): void {
  try {
    localStorage.setItem("spark_guest_mode", "1");
  } catch {}
  const report = (msg: string) => console.log(`[selftest] ${msg}`);
  window.addEventListener("error", (e) => report(`window error: ${e.message}`));
  window.addEventListener("unhandledrejection", (e) =>
    report(`unhandled rejection: ${String((e as PromiseRejectionEvent).reason)}`),
  );
  let clicked = false;
  const started = Date.now();
  const timer = window.setInterval(() => {
    const elapsed = Math.round((Date.now() - started) / 1000);
    if (!clicked) {
      const guest = Array.from(document.querySelectorAll("button")).find((b) =>
        /continue without an account/i.test(b.textContent ?? ""),
      );
      if (guest) {
        report("pressing continue without an account");
        guest.click();
        return;
      }
      const play = Array.from(document.querySelectorAll("button")).find((b) =>
        /play trending|play your mix/i.test(b.textContent ?? ""),
      );
      if (play) {
        report(`pressing "${play.textContent?.trim()}" after ${elapsed}s`);
        play.click();
        clicked = true;
      }
      return;
    }
    const audio = Array.from(document.querySelectorAll("audio"))[0] as HTMLAudioElement | undefined;
    const anyAudio = audio ?? ((window as unknown as { __sparkAudio?: HTMLAudioElement }).__sparkAudio);
    report(
      `t=${elapsed}s audio=${anyAudio ? `src=${anyAudio.currentSrc.slice(0, 60)} time=${anyAudio.currentTime.toFixed(1)} paused=${anyAudio.paused} ready=${anyAudio.readyState} err=${anyAudio.error?.code ?? "-"}:${anyAudio.error?.message ?? ""}` : "none"} title=${document.title}`,
    );
    if (elapsed > 150) window.clearInterval(timer);
  }, 3000);
}

