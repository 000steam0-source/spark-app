import { useTranslation } from "@/languages";
import { cn } from "@/shared/lib";
import { useWindowAnimationStore } from "@/shared/ui";
import { useWindowState } from "../hooks/useWindowState";
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./WindowControlIcons";

export interface WindowControlsProps {
  className?: string;
  variant?: "default" | "glass" | "island";
  style?: React.CSSProperties;
  isFullscreen?: boolean;
  embedded?: boolean;
  bare?: boolean;
}

// the window goes away right under the cursor (minimize / into the overlay), so
// chromium never sees the pointer leave and the button keeps its hover look when the
// window comes back. while this flag is on the control buttons drop their hover
// highlight; it clears on the first real mouse move after the window is back.
function suppressStaleHover() {
  const root = document.documentElement;
  root.setAttribute("data-hover-reset", "");
  (document.activeElement as HTMLElement | null)?.blur?.();
  let wentAway = false;
  const clear = () => root.removeAttribute("data-hover-reset");
  const onAway = () => {
    wentAway = true;
  };
  const onBack = () => {
    if (!wentAway) return;
    window.removeEventListener("blur", onAway);
    window.removeEventListener("focus", onBack);
    document.removeEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", clear, { once: true });
  };
  const onVisibility = () => (document.hidden ? onAway() : onBack());
  window.addEventListener("blur", onAway);
  window.addEventListener("focus", onBack);
  document.addEventListener("visibilitychange", onVisibility);
}

export default function WindowControls(props: WindowControlsProps) {
  if (typeof window !== "undefined" && (window.sparkElectron?.platform === "android" || window.sparkElectron?.platform === "ios")) return null;
  return <WindowControlsInner {...props} />;
}

function WindowControlsInner({
  className = "",
  style,
  embedded = false,
  bare = false,
  isFullscreen = false,
}: WindowControlsProps) {
  const { t } = useTranslation();
  const { isFullScreen: isWindowFullScreen, isMaximized: isWindowMaximized } = useWindowState();

  const isHyprland = window.sparkElectron?.isHyprland ?? false;
  const isMinimizeDisabled = isWindowFullScreen || isHyprland;

  const handleMinimize = () => {
    // macos fullscreen spaces and hyprland tiling wm prohibit/ignore minimizing
    if (isWindowFullScreen || isHyprland) return;
    suppressStaleHover();
    useWindowAnimationStore.getState().triggerMinimize();
  };

  const handleMaximize = () => {
    window.sparkElectron?.toggleMaximize();
  };

  const handleClose = () => {
    useWindowAnimationStore.getState().triggerClose();
  };

  const onDarkGlass = isFullscreen || !bare;

  const buttonClass = cn(
    "spark-winbtn flex items-center justify-center rounded-full border-0 p-0 cursor-pointer select-none pointer-events-auto transition-[background-color,color,opacity,transform] duration-150 active:scale-90",
    isFullscreen ? "w-[28px] h-[28px]" : "w-[32px] h-[32px]",
    onDarkGlass
      ? "bg-white/10 text-white/80 hover:text-white hover:bg-white/20"
      : "bg-bg-toolbox text-text-secondary hover:text-text-primary hover:bg-bg-toolbox-active",
  );

  const buttons = (
    <>
      <button
        type="button"
        onClick={isMinimizeDisabled ? undefined : handleMinimize}
        disabled={isMinimizeDisabled}
        aria-disabled={isMinimizeDisabled}
        data-no-tooltip="true"
        className={cn(
          buttonClass,
          isMinimizeDisabled &&
            "!opacity-25 cursor-not-allowed pointer-events-none",
        )}
        aria-label="Minimize"
      >
        <MinimizeIcon />
      </button>

      <button
        type="button"
        onClick={handleMaximize}
        data-no-tooltip="true"
        className={buttonClass}
        aria-label={
          isWindowFullScreen
            ? t("common.exitFullscreen")
            : isWindowMaximized
              ? t("common.restore")
              : t("common.maximize")
        }
      >
        <MaximizeIcon isMaximized={isWindowMaximized || isWindowFullScreen} />
      </button>

      <button
        type="button"
        onClick={handleClose}
        data-no-tooltip="true"
        className={cn(buttonClass, "hover:!bg-[#e5484d] hover:!text-white")}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </>
  );

  if (bare) {
    return buttons;
  }

  const capsule = (
    <div
      data-no-window-drag
      data-window-controls
      data-no-tooltip="true"
      className={cn(
        "flex items-center gap-[2px] select-none pointer-events-auto",
        isFullscreen
          ? "h-[36px] gap-[6px] px-[4px] rounded-full bg-black/40 backdrop-blur-xl"
          : "h-[44px] gap-[6px] px-[6px] rounded-full bg-black/30 backdrop-blur-xl",
      )}
    >
      {buttons}
    </div>
  );

  if (embedded) {
    return capsule;
  }

  return (
    <div
      style={style}
      className={cn(
        "absolute top-[6px] right-[6px] z-[62] flex items-center justify-end pointer-events-none select-none",
        className,
      )}
    >
      {capsule}
    </div>
  );
}
