# iNIcio — Recruitment Website for NIAEFEUP

This repository contains the source code for **iNIcio**, the recruitment platform for the Núcleo de Informática da AEFEUP (NIAEFEUP). It is built with **Next.js** for the frontend and backend logic, and uses **Drizzle ORM** with a **PostgreSQL** database for data management.

---

## 🚀 Getting Started

Follow these steps to get the project running locally:

### 1. Install dependencies

This will also automatically register the pre-commit hook that formats your code on commit.

```bash
npm install
```

### 2. Start the PostgreSQL database

Make sure you have **Docker** installed. Then, run the following command to start the PostgreSQL database:

```bash
docker compose up -d
```

### 3. Setup environment variables

Copy the `.env.example` file to `.env` and fill in the required environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file to set your database connection string and other necessary configurations.

### 4. Push the schema to the database

This will apply the current schema to the running PostgreSQL container.

```bash
npm run db:push
```

### 5. Start the development server

Run the following command to start the Next.js development server:

```bash
npm run dev
```

## 🧪 Useful Scripts

```bash
# Format code manually
npm run format:fix

# Run lint checks
npm run lint

# Start & stop the PostgreSQL database
docker compose down
docker compose up -d

# Push the schema to the database
npm run db:push
```

## 🗄️ Database & Drizzle ORM

The project uses [Drizzle ORM](https://orm.drizzle.team/) with a **PostgreSQL** database for managing and querying data.

### 📁 Directory Structure

```
src/
└── db/
    ├── db.ts               # Initializes the Drizzle instance
    └── schema/             # Contains schema definition files (tables, relations, enums)
        ├── index.ts        # Aggregates all schema definitions
        ├── interview.ts
        ├── recruitment.ts
        └── ...
```

### 🧠 Initialization (db.ts)

The `db.ts` file initializes the Drizzle ORM instance and connects to the PostgreSQL database using the connection string defined in the `.env` file.

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

This ensures the app reuses a single database connection and schema reference instead of re-creating it in multiple places.

You can import the database like so:

```typescript
import { db } from "@/db/db";
```

### 📚 Schema Files

- All database tables and relationships are defined inside `src/db/schema/` as individual `.ts` files.

- Each file exports one or more tables (or enums, views, etc.).

- There's an `index.ts` file inside `schema/` that re-exports everything. This is required so Drizzle can register the full schema when initializing.

**Whenever you create a new file inside `schema/`, make sure to add its exports to index.ts.**

### 🔄 Applying Schema Changes

This project follows Drizzle's **codebase-first** workflow: the TypeScript schema in `src/db/schema/` is the single source of truth, and changes are applied with [`drizzle-kit push`](https://orm.drizzle.team/docs/drizzle-kit-push). There are **no migration SQL files** to maintain by hand.

To change the database:

1. Edit the relevant file(s) in `src/db/schema/` (and re-export anything new from `index.ts`).
2. Apply the changes:

   ```bash
   npm run db:push
   ```

   Drizzle diffs the live database against the schema and generates and applies the DDL itself. Destructive changes (dropping a column or table) prompt for confirmation, so read those prompts carefully.

Data-only changes (for example backfilling a newly added column) can't be expressed as a schema diff; run them once against the database (e.g. with `psql`) or add them to the seed script. Do not commit hand-written schema SQL.
