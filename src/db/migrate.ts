import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resolve } from "node:path";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const db = drizzle(pool);
    const migrationsFolder = resolve(__dirname, "drizzle");

    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Database migrations completed successfully.");
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
