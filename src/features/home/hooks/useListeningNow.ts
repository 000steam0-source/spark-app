import { useEffect, useState } from "react";
import { api, toClientTrack } from "@/shared/api";
import type { Track } from "@/shared/types";
import { shuffled } from "../lib/shuffled";

const LISTENING_NOW_LIMIT = 10;
const CACHE_TTL_MS = 60_000;

const STORE_KEY = "spark_cache_listening_now";
// seeded from disk so Home paints instantly on launch, then refreshes in the background
let cached: { tracks: Track[]; timestamp: number } | null = (() => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...JSON.parse(raw), timestamp: 0 } : null;
  } catch {
    return null;
  }
})();

export function useListeningNow() {
  const [tracks, setTracks] = useState<Track[]>(() => cached?.tracks ?? []);
  const [isLoading, setIsLoading] = useState(() => cached === null);

  useEffect(() => {
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return;

    let active = true;
    api
      .getPopularTracks("12h", LISTENING_NOW_LIMIT)
      .then((response) => {
        const next = shuffled(
          (response.items ?? []).map((entry) => toClientTrack(entry.track)),
        );
        cached = { tracks: next, timestamp: Date.now() };
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify({ tracks: next }));
        } catch {}
        if (active) setTracks(next);
      })
      .catch(() => {
        if (active && !cached) setTracks([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { tracks: tracks.slice(0, LISTENING_NOW_LIMIT), isLoading };
}
