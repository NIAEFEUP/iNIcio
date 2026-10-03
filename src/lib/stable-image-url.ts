const CACHE_MAX = 500;
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const STORAGE_KEY = "inicio_profile_picture_cache_v2";

type CacheEntry = { url: string; expiresAt: number };

const signedUrlCache = new Map<string, CacheEntry>();
let isHydrated = false;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function toStorageKey(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    const profilesIdx = clean.indexOf("/profiles/");
    if (profilesIdx !== -1) {
      return clean.slice(profilesIdx + 1);
    }
    const cvsIdx = clean.indexOf("/cvs/");
    if (cvsIdx !== -1) {
      return clean.slice(cvsIdx + 1);
    }
    return clean.split("/").slice(4).join("/");
  }
  return clean;
}

function hydrateFromStorage() {
  if (isHydrated || typeof window === "undefined") return;
  isHydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();

    for (const [key, entry] of Object.entries(parsed)) {
      if (
        entry &&
        typeof entry.url === "string" &&
        typeof entry.expiresAt === "number"
      ) {
        if (now < entry.expiresAt) {
          signedUrlCache.set(key, entry);
        }
      }
    }
  } catch {
    // Ignore localStorage errors (e.g. disabled storage or JSON parse failure)
  }
}

function persistToStorage() {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const data: Record<string, CacheEntry> = {};

    for (const [key, entry] of signedUrlCache.entries()) {
      if (now < entry.expiresAt) {
        data[key] = entry;
      }
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors (e.g. quota exceeded)
  }
}

function schedulePersist() {
  if (typeof window === "undefined") return;
  if (saveTimeout !== null) return;

  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    persistToStorage();
  }, 100);
}

/**
 * Returns a stable signed URL for a profile picture, keyed by the underlying
 * storage key. Presigned S3 URLs are cached in browser localStorage with a 48h TTL
 * so image URLs remain consistent across navigations and page reloads.
 * This allows the browser to serve avatars directly from its HTTP cache without
 * refetching them from the S3 bucket every time.
 */
export function getStableImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;

  // Static assets or non-S3 URLs don't need S3 presigned URL handling
  if (
    image.startsWith("/") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  hydrateFromStorage();

  const key = toStorageKey(image);
  const now = Date.now();
  const cached = signedUrlCache.get(key);

  if (cached && now < cached.expiresAt) {
    return cached.url;
  }

  // If `image` is already a full signed URL, store and return it
  if (image.startsWith("http://") || image.startsWith("https://")) {
    if (signedUrlCache.size >= CACHE_MAX) {
      const oldestKey = signedUrlCache.keys().next().value;
      if (oldestKey) signedUrlCache.delete(oldestKey);
    }

    signedUrlCache.set(key, { url: image, expiresAt: now + CACHE_TTL_MS });
    schedulePersist();
    return image;
  }

  return undefined;
}

/**
 * Invalidates any cached URL for a given image storage key or URL.
 */
export function invalidateStableImageUrl(image?: string | null): void {
  if (!image) return;

  hydrateFromStorage();
  const key = toStorageKey(image);
  if (signedUrlCache.delete(key)) {
    persistToStorage();
  }
}
