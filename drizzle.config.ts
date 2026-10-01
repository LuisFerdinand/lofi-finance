import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit doesn't read Next's env files on its own — without this,
// `npm run db:push` / `db:studio` run with an undefined DATABASE_URL.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
