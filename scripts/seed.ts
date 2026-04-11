// scripts/seed.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import bcrypt from "bcryptjs";
import { subDays, format } from "date-fns";

// Load env manually for script context
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const incomeCategories = [
  "salary",
  "freelance",
  "investment",
  "gift",
  "other_income",
] as const;
const expenseCategories = [
  "food",
  "transport",
  "housing",
  "entertainment",
  "health",
  "shopping",
  "education",
  "utilities",
  "other_expense",
] as const;

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("🌱 Starting seed...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  // Create users
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "Admin User",
      email: "admin@lofifinance.com",
      password: adminPassword,
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [user1] = await db
    .insert(schema.users)
    .values({
      name: "Alex Rivera",
      email: "alex@lofifinance.com",
      password: userPassword,
      role: "user",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [user2] = await db
    .insert(schema.users)
    .values({
      name: "Jordan Kim",
      email: "jordan@lofifinance.com",
      password: userPassword,
      role: "user",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Users created");

  // Create sample transactions for the past 3 months
  const usersToSeed = [admin, user1, user2].filter(Boolean);

  for (const u of usersToSeed) {
    const txns = [];

    // Monthly salary for past 3 months
    for (let month = 0; month < 3; month++) {
      const salaryDate = subDays(new Date(), month * 30 + 1);
      txns.push({
        userId: u.id,
        type: "income" as const,
        category: "salary" as const,
        amount: randomBetween(5_000_000, 15_000_000), // Rp 5jt - 15jt
        description: "Monthly Salary",
        transactionDate: format(salaryDate, "yyyy-MM-dd"),
      });

      // Random freelance income
      if (Math.random() > 0.4) {
        txns.push({
          userId: u.id,
          type: "income" as const,
          category: "freelance" as const,
          amount: randomBetween(500_000, 3_000_000), // Rp 500k - 3jt
          description: "Freelance Project",
          transactionDate: format(
            subDays(salaryDate, randomBetween(1, 10)),
            "yyyy-MM-dd"
          ),
        });
      }
    }

    // Daily-ish expenses for past 90 days
    for (let day = 0; day < 90; day++) {
      if (Math.random() > 0.35) {
        const txDate = format(subDays(new Date(), day), "yyyy-MM-dd");
        const cat = pickRandom(expenseCategories);

        const amountMap: Record<string, [number, number]> = {
          food:          [15_000,    150_000],  // Rp 15k - 150k
          transport:     [5_000,     100_000],  // Rp 5k - 100k
          housing:       [500_000, 3_000_000],  // Rp 500k - 3jt
          entertainment: [50_000,    500_000],  // Rp 50k - 500k
          health:        [50_000,    500_000],  // Rp 50k - 500k
          shopping:      [100_000, 1_000_000],  // Rp 100k - 1jt
          education:     [200_000, 2_000_000],  // Rp 200k - 2jt
          utilities:     [100_000,   500_000],  // Rp 100k - 500k
          other_expense: [20_000,    300_000],  // Rp 20k - 300k
        };

        const [min, max] = amountMap[cat] || [20_000, 200_000];
        txns.push({
          userId: u.id,
          type: "expense" as const,
          category: cat,
          amount: randomBetween(min, max),
          description: `${cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")} expense`,
          transactionDate: txDate,
        });
      }
    }

    // Batch insert
    if (txns.length > 0) {
      await db.insert(schema.transactions).values(txns);
    }
    console.log(`✅ Transactions seeded for ${u.name} (${txns.length} txns)`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin: admin@lofifinance.com / admin123");
  console.log("  User:  alex@lofifinance.com  / user123");
  console.log("  User:  jordan@lofifinance.com / user123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});