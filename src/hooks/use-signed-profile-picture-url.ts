"use client";

import * as React from "react";
import { getSignedProfilePictureUrl } from "@/app/actions";

type SignedEntry = { image: string; url: string | null };

/**
 * Resolves a user's stored profile picture (full URL or storage key) to a
 * signed, temporary S3 URL. Returns a [url, setUrl] tuple like useState:
 * url is null until resolved or if no image set; the setter can be used to
 * push a fresh URL immediately after upload. The URL is keyed to the image,
 * so changing the image discards the stale URL without an effect-setState.
 */
export function useSignedProfilePictureUrl(image?: string | null) {
  const [signed, setSigned] = React.useState<SignedEntry | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (image) {
      getSignedProfilePictureUrl(image)
        .then((url) => {
          if (!cancelled && url) setSigned({ image, url });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [image]);

  const signedImageUrl = image && signed?.image === image ? signed.url : null;

  const setSignedImageUrl = React.useCallback(
    (url: string | null) => {
      setSigned({ image: image ?? "", url });
    },
    [image],
  );

  return [signedImageUrl, setSignedImageUrl] as const;
}
