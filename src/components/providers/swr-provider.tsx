"use client";

import { SWRConfig } from "swr";

/**
 * Global SWR defaults. `revalidateOnFocus: false` stops every hook (candidate
 * data, comments, recruiters, device sessions) from refetching whenever a tab
 * regains focus, which matters on high-traffic days like voting. Data is still
 * refreshed on mount, on reconnect, and via explicit `mutate`.
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ revalidateOnFocus: false }}>{children}</SWRConfig>;
}
