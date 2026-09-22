const CACHE_MAX = 300;
const CACHE_TTL_MS = 55 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };

const signedUrlCache = new Map<string, CacheEntry>();

function toStorageKey(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean.split("/").slice(4).join("/");
  }
  return clean;
}

/**
 * Returns a stable signed URL for a profile picture, keyed by the underlying
 * storage key. The server re-signs S3 URLs on every data fetch, so without
 * this the <img src> would change on each refetch/navigation and the browser
 * would download the same picture again. The cached URL is reused while it is
 * still within its signing window (S3 signs for 1h); near expiry the incoming
 * fresh URL replaces it so images never go stale.
 */
export function getStableImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;

  const key = toStorageKey(image);
  const now = Date.now();
  const cached = signedUrlCache.get(key);

  if (cached && now < cached.expiresAt) {
    return cached.url;
  }

  if (signedUrlCache.size >= CACHE_MAX) {
    signedUrlCache.delete(signedUrlCache.keys().next().value as string);
  }
  signedUrlCache.set(key, { url: image, expiresAt: now + CACHE_TTL_MS });
  return image;
}
