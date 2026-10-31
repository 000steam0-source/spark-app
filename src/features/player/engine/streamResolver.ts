import {
  isYoutubeSignedIn,
  prefersAccountPlayback,
  resolveDirectAudioStream,
  openTvAudioStream,
  resolveTvAudioStream,
  toVideoId,
} from "@/shared/youtube";
import {
  resolveSoundCloudStream,
  toSoundCloudTrackId,
} from "@/shared/media/soundcloud";
import { resolveSparkStream } from "@/shared/media/spark/sparkPlayback";
import { isAbortError } from "@/shared/utils/abort";
import { log } from "@/shared/utils/logger";
import {
  fromInnertubeStream,
  fromSparkStream,
  fromSoundCloudStream,
  fromTvProgressiveStream,
  fromTvStream,
  type PlayableTrack,
  type PlaybackStream,
} from "./playbackStream";
import { findYoutubeStandIn } from "./youtubeStandIn";
import { downloadAudioBytes } from "@/shared/youtube/innertube/chunkedAudioDownload";

export interface ResolveStreamOptions {
  progressive?: boolean;
}

export type {
  BufferedPlaybackStream,
  PlayableTrack,
  PlaybackStream,
  UrlPlaybackStream,
} from "./playbackStream";

async function resolveTvAudio(
  videoId: string,
  progressive: boolean,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  if (progressive)
    return fromTvProgressiveStream(
      await openTvAudioStream(videoId, { signal }),
    );
  return fromTvStream(await resolveTvAudioStream(videoId, { signal }));
}

async function resolveYoutubeAudio(
  videoId: string,
  progressive: boolean,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  if (isYoutubeSignedIn() && prefersAccountPlayback()) {
    try {
      const stream = await resolveTvAudio(videoId, progressive, signal);
      log("cyan", "playback", `playing youtube tv audio for ${videoId}`);
      return stream;
    } catch (error) {
      if (isAbortError(error, signal)) throw error;
      log("yellow", "playback", `youtube tv playback failed: ${String(error)}`);
    }
  }
  return fromInnertubeStream(
    await resolveDirectAudioStream(videoId, { signal }),
  );
}

async function resolveYoutubeStandIn(
  track: PlayableTrack,
  progressive: boolean,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  const videoId = await findYoutubeStandIn(track, signal);
  if (!videoId) throw new Error("No matching YouTube track found");
  log(
    "cyan",
    "playback",
    `playing youtube stand-in ${videoId} for "${track.title}"`,
  );
  return resolveYoutubeAudio(videoId, progressive, signal);
}

async function resolveSoundCloud(
  track: PlayableTrack,
  progressive: boolean,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  try {
    return fromSoundCloudStream(
      await resolveSoundCloudStream(track.id, { signal }),
    );
  } catch (soundCloudError) {
    if (isAbortError(soundCloudError, signal)) throw soundCloudError;
    log(
      "yellow",
      "playback",
      `soundcloud resolution failed, searching youtube: ${String(soundCloudError)}`,
    );
    try {
      return await resolveYoutubeStandIn(track, progressive, signal);
    } catch (standInError) {
      if (isAbortError(standInError, signal)) throw standInError;
      throw soundCloudError;
    }
  }
}

async function resolveYoutubeTrack(
  track: PlayableTrack,
  videoId: string,
  progressive: boolean,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  const spark = await resolveSparkStream(videoId, signal);
  if (spark) {
    log("cyan", "playback", `playing spark audio (r2) for "${track.title}"`);
    return fromSparkStream(spark, track);
  }
  return resolveYoutubeAudio(videoId, progressive, signal);
}

function isAndroidApp(): boolean {
  return (
    typeof window !== "undefined" && (window.sparkElectron?.platform === "android" || window.sparkElectron?.platform === "ios")
  );
}

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
}

// The Android WebView can't stream googlevideo URLs into the <audio> element
// (CORS), so on the phone the audio is downloaded natively and played as a blob.
async function bufferForAndroid(
  stream: PlaybackStream,
  signal?: AbortSignal,
): Promise<PlaybackStream> {
  if (!isAndroidApp() || stream.blob || !stream.url || !isRemoteUrl(stream.url))
    return stream;
  const bytes = await downloadAudioBytes(stream.url, {
    contentLength: stream.contentLength,
    signal,
  });
  if (!bytes) throw new Error("audio download returned no data");
  stream.release?.();
  log("cyan", "playback", `buffered ${Math.round(bytes.byteLength / 1024)} KB for android`);
  return {
    blob: new Blob([bytes], { type: stream.mimeType || "audio/webm" }),
    mimeType: stream.mimeType,
    codec: stream.codec,
    bitrate: stream.bitrate,
    contentLength: bytes.byteLength,
    expiresAtMs: null,
  };
}

export async function resolvePlaybackStream(
  track: PlayableTrack,
  signal?: AbortSignal,
  options: ResolveStreamOptions = {},
): Promise<PlaybackStream> {
  return bufferForAndroid(
    await resolvePlaybackStreamDirect(track, signal, options),
    signal,
  );
}

async function resolvePlaybackStreamDirect(
  track: PlayableTrack,
  signal?: AbortSignal,
  options: ResolveStreamOptions = {},
): Promise<PlaybackStream> {
  const progressive = options.progressive ?? false;
  if (toSoundCloudTrackId(track.id))
    return resolveSoundCloud(track, progressive, signal);
  const videoId = toVideoId(track.id);
  if (videoId) return resolveYoutubeTrack(track, videoId, progressive, signal);
  return resolveYoutubeStandIn(track, progressive, signal);
}
