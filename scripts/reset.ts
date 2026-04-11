// scripts/reset.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function reset() {
  console.log("⚠️  Resetting database...\n");

  // Neon serverless doesn't support multiple statements in one call —
  // run each DROP individually
  const statements = [
    `DROP TABLE IF EXISTS "transactions" CASCADE`,
    `DROP TABLE IF EXISTS "users" CASCADE`,
    `DROP TYPE  IF EXISTS "transaction_type" CASCADE`,
    `DROP TYPE  IF EXISTS "category" CASCADE`,
    `DROP TYPE  IF EXISTS "role" CASCADE`,
  ];

  for (const statement of statements) {
    await db.execute(statement as any);
    console.log(`  ✓ ${statement}`);
  }

  // Clear generated migration files so drizzle-kit starts fresh
  const migrationsDir = path.join(__dirname, "../src/db/migrations");
  if (fs.existsSync(migrationsDir)) {
    fs.rmSync(migrationsDir, { recursive: true, force: true });
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log("  ✓ src/db/migrations cleared");
  }

  console.log("\n✅ Reset complete.");
  console.log("👉 Next steps:");
  console.log("   npm run db:generate");
  console.log("   npm run db:migrate");
  console.log("   npm run db:seed");

  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});