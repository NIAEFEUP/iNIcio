"use client";

import useSWR from "swr";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/use-session";

export type DeviceSession = Awaited<
  ReturnType<typeof authClient.multiSession.listDeviceSessions>
>["data"][number];

export function useDeviceSessions() {
  const { data: sessionData } = useSession();

  const {
    data: sessions,
    error,
    isLoading,
    mutate,
  } = useSWR<DeviceSession[]>(
    sessionData ? ["device-sessions"] : null,
    async () => {
      const res = await authClient.multiSession.listDeviceSessions({
        query: {},
      });
      if (res.error) throw res.error;
      return res.data ?? [];
    },
  );

  const switchAccount = async (sessionToken: string) => {
    const res = await authClient.multiSession.setActive({ sessionToken });
    if (res.error) throw res.error;
    await mutate();
    return res.data;
  };

  const revokeAccount = async (sessionToken: string) => {
    const res = await authClient.multiSession.revoke({ sessionToken });
    if (res.error) throw res.error;
    await mutate();
    return res.data;
  };

  return {
    sessions: sessions ?? [],
    isLoading,
    error,
    switchAccount,
    revokeAccount,
    mutate,
  };
}
