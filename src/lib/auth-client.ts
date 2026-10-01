import { createAuthClient } from "better-auth/react";
import { multiSessionClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL,
  plugins: [multiSessionClient()],
});
