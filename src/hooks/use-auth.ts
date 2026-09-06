"use client";

import { useSession } from "@/lib/use-session";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const { data, isPending } = useSession();
  const router = useRouter();

  const user: User | null = data?.user
    ? {
        ...data.user,
        isAdmin: data.user.role === "admin",
      }
    : null;

  const logout = async () => {
    await authClient.signOut({});
    router.push("/");
    router.refresh();
  };

  return {
    user,
    isAuthenticated: !!data?.user,
    isLoading: isPending,
    logout,
  };
}
