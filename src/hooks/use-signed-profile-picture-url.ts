"use client";

import * as React from "react";
import { getSignedProfilePictureUrl } from "@/app/actions";
import { getStableImageUrl } from "@/lib/stable-image-url";

/**
 * Resolves a user's stored profile picture (full URL or storage key) to a
 * signed, temporary S3 URL. Returns a [url, setUrl] tuple like useState:
 * url is null until resolved or if no image set; the setter can be used to
 * push a fresh URL immediately after upload.
 */
export function useSignedProfilePictureUrl(image?: string | null) {
  const [prevImage, setPrevImage] = React.useState(image);
  const [overrideUrl, setOverrideUrl] = React.useState<string | null>(null);
  const [asyncUrl, setAsyncUrl] = React.useState<string | null>(null);

  if (prevImage !== image) {
    setPrevImage(image);
    setOverrideUrl(null);
    setAsyncUrl(null);
  }

  const cachedUrl = React.useMemo(() => {
    if (!image) return null;
    const cached = getStableImageUrl(image);
    if (
      cached &&
      (cached.startsWith("http://") ||
        cached.startsWith("https://") ||
        cached.startsWith("/"))
    ) {
      return cached;
    }
    return null;
  }, [image]);

  React.useEffect(() => {
    if (!image || cachedUrl) return;

    let cancelled = false;
    getSignedProfilePictureUrl(image)
      .then((url) => {
        if (!cancelled && url) {
          const stableUrl = getStableImageUrl(url) ?? url;
          setAsyncUrl(stableUrl);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [image, cachedUrl]);

  const signedImageUrl = overrideUrl ?? cachedUrl ?? asyncUrl;

  const setSignedImageUrl = React.useCallback((url: string | null) => {
    if (url) {
      getStableImageUrl(url);
    }
    setOverrideUrl(url);
  }, []);

  return [signedImageUrl, setSignedImageUrl] as const;
}
