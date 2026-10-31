import type { Track } from "@/shared/types";
import { usePlayerStore } from "@/features/player/store/playerStore";

// Local listening profile that drives the personalised Home.
// A play only *counts* once you've actually listened (30s, or half of a short song);
// starting a track and skipping it just puts it in "recent".

const KEY = "spark_taste_v2";
const MAX_TRACKS = 400;

/** a song needs this many real listens before Spark recommends from it */
export const SONG_MIN_PLAYS = 5;
/** an artist needs this many real listens across their songs (or a follow) */
export const ARTIST_MIN_PLAYS = 10;

export interface TasteEntry {
  track: Track;
  count: number;
  last: number;
}

export interface TasteArtist {
  name: string;
  id?: string;
  plays: number;
  seed: Track;
}

type Profile = Record<string, TasteEntry>;

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : {};
  } catch {
    return {};
  }
}

function write(p: Profile) {
  try {
    const entries = Object.values(p);
    if (entries.length > MAX_TRACKS) {
      entries.sort((a, b) => b.last - a.last);
      p = Object.fromEntries(entries.slice(0, MAX_TRACKS).map((e) => [e.track.id, e]));
    }
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("spark:taste-changed"));
  } catch {}
}

function slim(track: Track): Track {
  return {
    id: track.id,
    title: track.title,
    artists: track.artists,
    artistId: track.artistId,
    artistList: track.artistList,
    coverUrl: track.coverUrl,
    durationMs: track.durationMs,
    playCount: track.playCount ?? 0,
    explicit: track.explicit,
    album: track.album,
  };
}

/** track started: shows up in "Jump back in", doesn't count as a listen yet */
export function recordStart(track: Track) {
  if (!track?.id) return;
  const p = read();
  const prev = p[track.id];
  p[track.id] = { track: slim(track), count: prev?.count ?? 0, last: Date.now() };
  write(p);
}

/** track was really listened to */
export function recordListen(track: Track) {
  if (!track?.id) return;
  const p = read();
  const prev = p[track.id];
  p[track.id] = { track: slim(track), count: (prev?.count ?? 0) + 1, last: Date.now() };
  write(p);
}

export function playCount(id: string): number {
  return read()[id]?.count ?? 0;
}

export function recentTracks(limit = 20): Track[] {
  return Object.values(read())
    .sort((a, b) => b.last - a.last)
    .slice(0, limit)
    .map((e) => e.track);
}

/** songs you've played at least SONG_MIN_PLAYS times, most played first */
export function favouriteTracks(limit = 20): Track[] {
  return Object.values(read())
    .filter((e) => e.count >= SONG_MIN_PLAYS)
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, limit)
    .map((e) => e.track);
}

function artistKey(e: TasteEntry) {
  const first = e.track.artistList?.[0] as { id?: string; name?: string } | undefined;
  const name = (first?.name || e.track.artists.split(",")[0] || "").trim();
  return { name, id: first?.id ?? e.track.artistId };
}

/** artists whose songs you've played at least ARTIST_MIN_PLAYS times in total */
export function favouriteArtists(limit = 3): TasteArtist[] {
  const map = new Map<string, TasteArtist & { seedCount: number }>();
  for (const e of Object.values(read())) {
    if (e.count <= 0) continue;
    const { name, id } = artistKey(e);
    if (!name) continue;
    const k = name.toLowerCase();
    const cur = map.get(k);
    if (cur) {
      cur.plays += e.count;
      if (e.count > cur.seedCount) {
        cur.seed = e.track;
        cur.seedCount = e.count;
      }
    } else {
      map.set(k, { name, id, plays: e.count, seed: e.track, seedCount: e.count });
    }
  }
  return [...map.values()]
    .filter((a) => a.plays >= ARTIST_MIN_PLAYS)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit)
    .map(({ seedCount: _s, ...a }) => a);
}

let started = false;
/** watches the player: start = recent, 30s (or half a short song) = a counted listen */
export function initTasteTracking() {
  if (started) return;
  started = true;
  let lastId: string | null = usePlayerStore.getState().currentTrack?.id ?? null;
  let counted = false;
  usePlayerStore.subscribe((state) => {
    const t = state.currentTrack;
    if (!t) {
      lastId = null;
      return;
    }
    if (t.id !== lastId) {
      lastId = t.id;
      counted = false;
      recordStart(t);
    }
    if (!counted && state.status === "playing") {
      const need = Math.min(30_000, Math.max(10_000, (t.durationMs || 60_000) * 0.5));
      if (state.positionMs >= need) {
        counted = true;
        recordListen(t);
      }
    }
  });
}
