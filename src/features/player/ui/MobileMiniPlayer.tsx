import { memo } from "react";
import { SkipNext } from "@solar-icons/react";
import { PlayerMorphIcon, ICON_PLAY, ICON_PAUSE } from "./morphPlayerIcons";
import { usePlayerState } from "../hooks/usePlayerState";
import { playerEngine } from "../engine/playerEngine";
import { CoverImage } from "@/features/covers";
import { useTranslation } from "@/languages";

interface MobileMiniPlayerProps {
  onFullscreenOpen?: () => void;
}

// Compact phone mini player: cover, title, play/pause and next. Tapping the
// card opens the full player.
function MobileMiniPlayer({ onFullscreenOpen }: MobileMiniPlayerProps) {
  const player = usePlayerState();
  const { t } = useTranslation();
  const isPlaying = player.status === "playing";
  const isLoading = player.status === "loading";
  const durationMs =
    player.durationMs > 0 ? player.durationMs : (player.currentTrack?.durationMs ?? 0);
  const progress = durationMs > 0 ? Math.min(1, Math.max(0, player.positionMs / durationMs)) : 0;
  const coverUrl = player.currentTrack?.coverUrl || "";
  const title = player.currentTrack?.title ?? t("player.nothing_playing");
  const artists = player.currentTrack?.artists ?? t("player.choose_track");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open player"
      onClick={onFullscreenOpen}
      className="spark-mobile-mini relative mx-[8px] flex h-[62px] items-center gap-[12px] overflow-hidden rounded-[20px] pl-[8px] pr-[6px] cursor-pointer select-none"
    >
      <div className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[13px] bg-bg-elevated">
        {coverUrl ? (
          <CoverImage
            key={coverUrl}
            src={coverUrl}
            alt=""
            width={46}
            height={46}
            priority
            draggable={false}
            className="h-[46px] w-[46px] object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="m-0 truncate text-[14.5px] font-[700] leading-[18px] text-text-primary">{title}</p>
        <p className="m-0 mt-[2px] truncate text-[12.5px] font-[500] leading-[16px] text-text-tertiary">{artists}</p>
      </div>
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        className="spark-gradient-bg inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-none text-spark-on active:scale-[0.92] transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          void playerEngine.togglePlayPause();
        }}
      >
        <span className="relative flex h-[16px] w-[16px] items-center justify-center">
          <span className={`absolute inset-0 flex items-center justify-center ${isLoading ? "opacity-0" : ""}`}>
            <PlayerMorphIcon icon={isPlaying ? ICON_PAUSE : ICON_PLAY} size={16} />
          </span>
          {isLoading && (
            <span className="absolute h-[16px] w-[16px] animate-spin rounded-full border-[2px] border-current border-t-transparent" />
          )}
        </span>
      </button>
      <button
        type="button"
        aria-label="Next track"
        className="inline-flex h-[42px] w-[38px] shrink-0 items-center justify-center rounded-full border-none bg-transparent text-text-secondary active:scale-[0.92] transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          void playerEngine.skipNext();
        }}
      >
        <SkipNext size={22} weight="Bold" />
      </button>
      <span className="pointer-events-none absolute inset-x-[14px] bottom-[3px] h-[2.5px] overflow-hidden rounded-full bg-white/[0.08]">
        <span
          className="spark-gradient-bg block h-full rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </span>
    </div>
  );
}

export default memo(MobileMiniPlayer);
