import { memo, useMemo, useState } from "react";
import { PlayFill } from "@mingcute/react";
import { LuShuffle } from "react-icons/lu";
import { playerEngine } from "@/features/player";
import CoverImage from "@/features/covers/ui/CoverImage";
import { useTranslation } from "@/languages";
import type { Track } from "@/shared/types";

export interface HomeHeroProps {
  tracks: Track[];
  covers: string[];
  personal?: boolean;
}

function HomeHero({ tracks, covers, personal = false }: HomeHeroProps) {
  const { t, locale } = useTranslation();
  const [now] = useState(() => new Date());

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 5 && h < 12) return t("home.goodMorning") || "Good morning";
    if (h >= 12 && h < 17) return t("home.goodAfternoon") || "Good afternoon";
    if (h >= 17 && h < 22) return t("home.goodEvening") || "Good evening";
    return t("home.goodNight") || "Good night";
  }, [t, now]);

  const date = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale || "en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);
    } catch {
      return "";
    }
  }, [locale, now]);

  const art = covers.filter(Boolean).slice(0, 3);
  const canPlay = tracks.length > 0;

  const playAll = () => {
    if (!canPlay) return;
    void playerEngine.playTrack(tracks[0], tracks, personal ? "Your Spark mix" : "Trending on Spark", tracks[0].coverUrl);
  };

  const shuffle = () => {
    if (!canPlay) return;
    const list = [...tracks];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    void playerEngine.playTrack(list[0], list, "Shuffle on Spark", list[0].coverUrl);
  };

  return (
    <section className="spark-home-hero relative mx-3 mb-[6px] overflow-hidden rounded-[28px]">
      <div className="spark-home-hero__orb spark-home-hero__orb--a" aria-hidden="true" />
      <div className="spark-home-hero__orb spark-home-hero__orb--b" aria-hidden="true" />

      <div className="relative z-10 flex min-h-[230px] items-center gap-6 px-9 py-8">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11.5px] font-[700] uppercase tracking-[0.22em] text-text-tertiary">
            {date}
          </span>
          <h1 className="m-0 mt-3 text-[44px] font-[800] leading-[1.02] tracking-[-0.045em] text-text-primary">
            {greeting}
            <span className="spark-gradient-text">.</span>
          </h1>
          <p className="m-0 mt-3 max-w-[420px] text-[14.5px] leading-[1.5] text-text-secondary">
            {personal
              ? "A mix tuned to what you play: your artists, your songs, and new picks that match them."
              : "Listen to a song 5 times, or an artist 10 times, and Spark starts picking music for you. Until then, here's what's hot."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={playAll}
              disabled={!canPlay}
              className="spark-gradient-bg inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-full border-0 px-6 text-[14px] font-[800] text-spark-on shadow-[0_12px_30px_-10px_var(--spark-glow)] transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <PlayFill size={18} />
              {personal ? "Play your mix" : "Play trending"}
            </button>
            <button
              type="button"
              onClick={shuffle}
              disabled={!canPlay}
              className="inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-full border-0 bg-bg-toolbox-active px-5 text-[14px] font-[700] text-text-primary ring-1 ring-inset ring-border-alpha-14 backdrop-blur-xl transition-[transform,background] duration-200 hover:-translate-y-0.5 hover:bg-bg-toolbox active:scale-95 disabled:opacity-50"
            >
              <LuShuffle size={17} />
              Shuffle
            </button>
          </div>
        </div>

        {art.length > 0 && (
          <div className="relative hidden h-[190px] w-[260px] shrink-0 md:block" aria-hidden="true">
            {art.map((src, i) => (
              <div
                key={src + i}
                className={`spark-home-hero__art spark-home-hero__art--${i}`}
              >
                <CoverImage src={src} alt="" fill sizes="170px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(HomeHero);
