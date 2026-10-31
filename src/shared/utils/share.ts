// Spark share links open straight in the app through the spark:// protocol
// (registered by the installer). No third-party redirect site is involved.
export const SHARE_BASE_URL = "spark://";

export type ShareEntityType = "artist" | "album" | "playlist" | "track";

export function buildShareUrl(type: ShareEntityType, id: string): string {
  return `spark://${type}?id=${encodeURIComponent(id)}`;
}
