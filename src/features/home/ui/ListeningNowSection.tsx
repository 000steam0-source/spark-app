import { memo, type ReactNode } from "react";
import { playerEngine } from "@/features/player";
import SongCardWithMenu from "@/features/player/ui/SongCardWithMenu";
import type { Track } from "@/shared/types";
import SectionHeading from "./SectionHeading";

export interface ListeningNowSectionProps {
  title: string;
  icon?: ReactNode;
  tracks: Track[];
  headingMarginTop?: string;
}

function formatDuration(durationMs: number | undefined): string | undefined {
  if (!durationMs) return undefined;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function ListeningNowSection({
  title,
  icon,
  tracks,
  headingMarginTop,
}: ListeningNowSectionProps) {
  return (
    <section className="flex flex-col">
      <SectionHeading title={title} icon={icon} marginTop={headingMarginTop} />

      <div
        className="spark-listen-grid mx-3 mt-[12px] grid grid-flow-col grid-cols-2 gap-x-[8px] rounded-[24px] bg-bg-glass p-[10px] ring-1 ring-inset ring-border-alpha-14 backdrop-blur-xl"
        style={{ gridTemplateRows: `repeat(${Math.max(1, Math.min(5, Math.ceil(tracks.length / 2)))}, auto)` }}
      >
        {tracks.map((track) => (
          <SongCardWithMenu
            key={track.id}
            id={track.id}
            title={track.title}
            artists={track.artists}
            artistId={track.artistId}
            artistList={track.artistList}
            coverUrl={track.coverUrl}
            duration={formatDuration(track.durationMs)}
            durationMs={track.durationMs}
            explicit={track.explicit}
            onPlay={() =>
              void playerEngine.playTrack(track, tracks, title, track.coverUrl)
            }
          />
        ))}
      </div>
    </section>
  );
}

export default memo(ListeningNowSection);
