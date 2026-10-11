"use client";

import dynamic from "next/dynamic";

export const EmailBodyEditor = dynamic(() => import("./email-body-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-48 animate-pulse rounded-lg border border-border/40 bg-muted/40" />
  ),
});
