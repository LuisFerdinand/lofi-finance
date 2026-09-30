import { db } from "@/db";
import { users } from "@/db/schema";
import "server-only";
import { eq, count, desc, ilike, or, and, sql, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { User } from "@/db/schema";
import type { Role } from "@/types";

// ─── Get all users (admin only) ───────────────────────────────────────────────

export async function getAllUsers(filters?: {
  search?: string;
  role?: Role;
  isActive?: boolean;
}): Promise<User[]> {
  const conditions: SQL[] = [];

  if (filters?.search) {
    conditions.push(
      or(
        ilike(users.name, `%${filters.search}%`),
        ilike(users.email, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.role) conditions.push(eq(users.role, filters.role));
  if (filters?.isActive !== undefined)
    conditions.push(eq(users.isActive, filters.isActive));

  const rows = await db
    .select()
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));

  // Strip passwords
  return rows.map((u) => ({ ...u, password: "***" }));
}

// ─── Get user by ID ───────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return null;
  return { ...user, password: "***" };
}

// ─── Get user by email ────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase()))
    .limit(1);
  return user ?? null;
}

// ─── Create user (admin) ─────────────────────────────────────────────────────

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<User> {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role ?? "user",
    })
    .returning();
  return { ...user, password: "***" };
}

// ─── Update user ──────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    avatar: string;
  }>
): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user ? { ...user, password: "***" } : null;
}

// ─── Update password ──────────────────────────────────────────────────────────

export async function updatePassword(
  id: string,
  newPassword: string
): Promise<void> {
  const hashed = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(users.id, id));
}

// ─── Toggle user active status ────────────────────────────────────────────────

export async function toggleUserActive(id: string): Promise<User | null> {
  // Flip in SQL — one round trip, and no crash when the id doesn't exist.
  const [user] = await db
    .update(users)
    .set({ isActive: sql`not ${users.isActive}`, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user ? { ...user, password: "***" } : null;
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// ─── User stats (admin dashboard) ────────────────────────────────────────────

export async function getUserStats() {
  const [row] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${users.isActive})::int`,
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
    })
    .from(users);
  const total = Number(row?.total ?? 0);
  const admins = Number(row?.admins ?? 0);
  return { total, active: Number(row?.active ?? 0), admins, users: total - admins };
}
