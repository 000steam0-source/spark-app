import { useEffect, useState } from "react";
import { api, getAuthSession, toClientTrack } from "@/shared/api";
import type { Track } from "@/shared/types";
import {
  ARTIST_MIN_PLAYS,
  SONG_MIN_PLAYS,
  favouriteArtists,
  favouriteTracks,
  recentTracks,
} from "../lib/tasteProfile";

export interface PersonalSection {
  id: string;
  title: string;
  subtitle?: string;
  tracks: Track[];
}

export interface PersonalHome {
  /** you've played something on this device */
  hasHistory: boolean;
  /** Spark knows enough (5+ plays of a song, 10+ of an artist, or a follow) to recommend */
  hasTaste: boolean;
  recent: Track[];
  heavy: Track[];
  sections: PersonalSection[];
  mix: Track[];
}

const CACHE_KEY = "spark_home_personal_v2";
const FRESH_MS = 10 * 60_000;

function readCache(): { at: number; data: PersonalHome } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function localOnly(): PersonalHome {
  const recent = recentTracks(20);
  const heavy = favouriteTracks(20);
  const cached = readCache()?.data;
  return {
    hasHistory: recent.length > 0,
    hasTaste: Boolean(cached?.hasTaste) || heavy.length > 0,
    recent,
    heavy,
    sections: cached?.sections ?? [],
    mix: cached?.mix ?? [],
  };
}

async function radioFor(seed: Track, exclude: Set<string>, k = 24): Promise<Track[]> {
  try {
    const res = await api.getRadio(seed.id, { k });
    const out: Track[] = [];
    for (const item of res.items ?? []) {
      const t = toClientTrack(item);
      if (!t.id || exclude.has(t.id)) continue;
      exclude.add(t.id);
      out.push(t);
    }
    return out;
  } catch {
    return [];
  }
}

interface ArtistSeed {
  name: string;
  seed: Track;
  reason: string;
}

/** artists you follow in your library (signed-in only) */
async function followedArtists(limit = 3): Promise<ArtistSeed[]> {
  if (!getAuthSession()) return [];
  try {
    const res = await api.listSavedCollections("artists");
    const artists = (res.items ?? [])
      .map((e: any) => e?.artist)
      .filter((a: any) => a?.id && a?.name)
      .slice(0, limit);
    const seeds = await Promise.all(
      artists.map(async (a: any): Promise<ArtistSeed | null> => {
        try {
          const details = await api.getArtist(a.id);
          const top = details.tracks?.[0];
          return top ? { name: a.name, seed: toClientTrack(top), reason: "An artist you follow" } : null;
        } catch {
          return null;
        }
      }),
    );
    return seeds.filter((s): s is ArtistSeed => s !== null);
  } catch {
    return [];
  }
}

async function build(): Promise<PersonalHome> {
  const recent = recentTracks(20);
  const heavy = favouriteTracks(20);

  const played: ArtistSeed[] = favouriteArtists(3).map((a) => ({
    name: a.name,
    seed: a.seed,
    reason: `${a.plays} plays from you`,
  }));
  const followed = await followedArtists(3);
  const seen = new Set(played.map((a) => a.name.toLowerCase()));
  const artists = [...played, ...followed.filter((a) => !seen.has(a.name.toLowerCase()))].slice(0, 4);

  const hasTaste = heavy.length > 0 || artists.length > 0;
  if (!hasTaste) {
    return { hasHistory: recent.length > 0, hasTaste: false, recent, heavy, sections: [], mix: [] };
  }

  const known = new Set(heavy.slice(0, 10).map((t) => t.id));
  const seeds = heavy.slice(0, 3);

  // all radio requests at once so Home fills in a single round trip
  const [mixParts, artistLists] = await Promise.all([
    Promise.all(seeds.map((s) => radioFor(s, new Set(known), 14))),
    Promise.all(artists.map((a) => radioFor(a.seed, new Set(known), 20))),
  ]);

  const mixSeen = new Set<string>();
  const mix: Track[] = [];
  for (let i = 0; mix.length < 30; i++) {
    let added = false;
    for (const part of mixParts) {
      const t = part[i];
      if (t && !mixSeen.has(t.id)) {
        mixSeen.add(t.id);
        mix.push(t);
        added = true;
      }
    }
    if (!added) break;
  }

  const sections: PersonalSection[] = artists
    .map((a, i) => ({
      id: `because-${a.name}`,
      title: `Because you like ${a.name}`,
      subtitle: a.reason,
      tracks: (artistLists[i] ?? []).slice(0, 18),
    }))
    .filter((s) => s.tracks.length >= 4);

  return { hasHistory: recent.length > 0, hasTaste: true, recent, heavy, sections, mix };
}

export { SONG_MIN_PLAYS, ARTIST_MIN_PLAYS };

export function usePersonalHome() {
  const [data, setData] = useState<PersonalHome>(() => localOnly());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = readCache();
    const stale = !cached || Date.now() - cached.at > FRESH_MS;

    if (stale) {
      setRefreshing(true);
      build()
        .then((next) => {
          if (!active) return;
          setData(next);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: next }));
          } catch {}
        })
        .finally(() => active && setRefreshing(false));
    }

    const onTaste = () => {
      if (!active) return;
      const recent = recentTracks(20);
      setData((d) => ({ ...d, recent, heavy: favouriteTracks(20), hasHistory: recent.length > 0 }));
    };
    window.addEventListener("spark:taste-changed", onTaste);
    return () => {
      active = false;
      window.removeEventListener("spark:taste-changed", onTaste);
    };
  }, []);

  return { ...data, refreshing };
}
