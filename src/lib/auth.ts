import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "../db/schema/auth";

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
  },
});
