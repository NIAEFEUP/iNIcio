import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  casing: "snake_case",
  out: "./src/drizzle",
  schema: "./src/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
