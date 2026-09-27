import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  const db = drizzle(pool);

  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Database migrations completed successfully.");

  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
