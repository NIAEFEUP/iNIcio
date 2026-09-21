"use client";

import * as React from "react";
import { getSignedProfilePictureUrl } from "@/app/actions";

export function useSignedProfilePictureUrl(image?: string | null) {
  const [signedImageUrl, setSignedImageUrl] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    let cancelled = false;
    if (image) {
      getSignedProfilePictureUrl(image)
        .then((url) => {
          if (!cancelled && url) setSignedImageUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [image]);

  return [signedImageUrl, setSignedImageUrl] as const;
}
