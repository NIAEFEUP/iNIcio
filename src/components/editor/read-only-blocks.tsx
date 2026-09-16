"use client";

import dynamic from "next/dynamic";

export const ReadOnlyBlocks = dynamic(
  () =>
    import("./read-only-blocks-client").then(
      (module) => module.ReadOnlyBlocksClient,
    ),
  {
    ssr: false,
    loading: () => <div className="min-h-8" />,
  },
);
