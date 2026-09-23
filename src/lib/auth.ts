import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import * as schema from "../db/schema/auth";
import { cache } from "react";
import { headers } from "next/headers";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        fieldName: "role",
        defaultValue: "candidate",
        // Never accept `role` from the client (e.g. sign-up payloads). It is
        // always assigned server-side, so users cannot self-register as admin.
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        url,
      });
    },
  },
});

/**
 * Resolves the session for the current request, deduplicated with
 * `React.cache`. Layouts, pages and the navbar all need the session, so
 * without this the same lookup ran several times per navigation. The cache is
 * scoped to a single request, so a server action still re-authorizes.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/**
 * Same as `getSession`, for route handlers that already hold the incoming
 * `Request` and should not reach for `next/headers`.
 */
export const getSessionFromRequest = cache(async (request: Request) =>
  auth.api.getSession({ headers: request.headers }),
);
