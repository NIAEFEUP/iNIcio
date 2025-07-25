import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "../db/schema/auth";
import { authClient } from "./auth-client";

export type User = typeof authClient.$Infer.Session.user & { role: string };

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
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
