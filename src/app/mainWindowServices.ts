import { initTelemetry } from "@/shared/telemetry";
import { initBackgroundStorageAnalytics } from "@/shared/utils/cacheManager";
import { initClientVisitorSession } from "@/shared/youtube";
import { initBundleStampLog } from "@/shared/utils/bundleStampLog";
import { initTasteTracking } from "@/features/home/lib/tasteProfile";

export function initMainWindowServices() {
  initTelemetry();
  initBackgroundStorageAnalytics();
  initClientVisitorSession();
  initBundleStampLog();
  initTasteTracking();
}
