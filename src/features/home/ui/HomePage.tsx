import { useState, useEffect } from "react";
import PopularTracksSection from "./PopularTracksSection";
import DailyMixesSection from "./DailyMixesSection";
import HomePageSkeleton from "./HomePageSkeleton";
import { usePopularTracksAllTime } from "../hooks/usePopularTracks";
import type { PopularItem } from "../hooks/usePopularTracks";
import { useListeningNow } from "../hooks/useListeningNow";
import ListeningNowSection from "./ListeningNowSection";
import { useDailyMixes } from "../hooks/useDailyMixes";
import { useMostSaved, usePopularAlbums } from "../hooks/useExploreCollections";
import { usePersonalHome } from "../hooks/usePersonalHome";
import HomeHero from "./HomeHero";
import { useTranslation } from "@/languages";
import { usePageBackdrop } from "@/shared/lib";
import type { Track } from "@/shared/types";

const asItems = (tracks: Track[]): PopularItem[] =>
  tracks.map((track) => ({ type: "track", item: track, playCount: track.playCount ?? 0 }));

export default function HomePage() {
  const { t } = useTranslation();

  const personal = usePersonalHome();
  const { tracks: listeningNow, isLoading: tracksLoading } = useListeningNow();
  const { items: popularAlbums, isLoading: albumsLoading } = usePopularAlbums();
  const { data: dailyMixes } = useDailyMixes();
  // global charts only matter until Spark knows your taste
  const { data: popularTracksAllTime } = usePopularTracksAllTime(20);
  const { items: mostSaved } = useMostSaved();
  const hasMixes = Boolean(dailyMixes && dailyMixes.length > 0);

  // Spark home uses its own aurora + hero instead of the blurred cover wash
  usePageBackdrop(undefined);

  // render as soon as anything useful exists; the rest streams in
  const isReady =
    personal.hasHistory || !tracksLoading || !albumsLoading;
  const [skeletonExited, setSkeletonExited] = useState(() => isReady);

  useEffect(() => {
    if (isReady && !skeletonExited) {
      const timer = setTimeout(() => setSkeletonExited(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isReady, skeletonExited]);

  const heroTracks = personal.mix.length > 0 ? personal.mix : personal.heavy.length > 0 ? personal.heavy : listeningNow;
  const heroCovers = [
    ...personal.heavy.map((tr) => tr.coverUrl),
    ...personal.mix.map((tr) => tr.coverUrl),
    ...popularAlbums.map((a) => (a.item as { coverUrl?: string }).coverUrl || ""),
    ...listeningNow.map((tr) => tr.coverUrl),
  ];
  const mt = "mt-[26px]";

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-transparent pt-(--page-inset-top) pb-(--page-inset-bottom)">
      <div className="relative z-1 grid grid-cols-1 items-start w-full">
        {isReady && (
          <div className="col-start-1 row-start-1 w-full pb-[16px]">
            <HomeHero tracks={heroTracks} covers={heroCovers} personal={personal.mix.length > 0} />

            {personal.mix.length > 0 && (
              <PopularTracksSection
                title="Made for you"
                subtitle="New picks that match your taste"
                items={asItems(personal.mix.slice(0, 20))}
                headingMarginTop={mt}
              />
            )}

            {personal.recent.length > 0 && (
              <ListeningNowSection
                title="Jump back in"
                tracks={personal.recent.slice(0, 10)}
                headingMarginTop={mt}
              />
            )}

            {personal.sections.map((section) => (
              <PopularTracksSection
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                items={asItems(section.tracks)}
                headingMarginTop={mt}
              />
            ))}

            {hasMixes && dailyMixes && (
              <DailyMixesSection mixes={dailyMixes} headingMarginTop={mt} />
            )}

            {personal.heavy.length >= 1 && (
              <PopularTracksSection
                title="On repeat"
                subtitle="Songs you've played 5+ times"
                items={asItems(personal.heavy)}
                headingMarginTop={mt}
              />
            )}

            {listeningNow.length > 0 && (
              <ListeningNowSection
                title={personal.hasTaste ? "Trending now" : t("home.whatEveryonesOn")}
                tracks={listeningNow}
                headingMarginTop={mt}
              />
            )}

            {popularAlbums.length > 0 && (
              <PopularTracksSection
                title={t("home.popularAlbums")}
                items={popularAlbums}
                headingMarginTop={mt}
              />
            )}

            {!personal.hasTaste && popularTracksAllTime && popularTracksAllTime.length > 0 && (
              <PopularTracksSection
                title={t("home.mostListened")}
                items={popularTracksAllTime}
                headingMarginTop={mt}
              />
            )}

            {!personal.hasTaste && mostSaved.length > 0 && (
              <PopularTracksSection
                title={t("home.mostSaved")}
                items={mostSaved}
                headingMarginTop={mt}
              />
            )}
          </div>
        )}

        {!skeletonExited && (
          <div
            className={`col-start-1 row-start-1 w-full z-10 transition-opacity duration-300 ease-out ${
              isReady ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
            }`}
            onTransitionEnd={() => setSkeletonExited(true)}
          >
            <HomePageSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
