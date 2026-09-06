import { authClient } from "./auth-client";
import type { Session } from "better-auth";
import type { User } from "./auth";

export function useSession() {
  const { data, ...rest } = authClient.useSession();
  return {
    data: data as { session: Session; user: User } | null,
    ...rest,
  };
}
