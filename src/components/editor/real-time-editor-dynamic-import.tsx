"use client";

import dynamic from "next/dynamic";

export const RealTimeEditor = dynamic(() => import("./real-time-editor"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});
