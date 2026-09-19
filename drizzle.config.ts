import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  casing: "snake_case",
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
