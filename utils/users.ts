import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ne, count, desc, like, or, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { User } from "@/db/schema";
import type { Role } from "@/types";

// ─── Get all users (admin only) ───────────────────────────────────────────────

export async function getAllUsers(filters?: {
  search?: string;
  role?: Role;
  isActive?: boolean;
}): Promise<User[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(
      or(
        like(users.name, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`)
      )
    );
  }

  if (filters?.role) conditions.push(eq(users.role, filters.role));
  if (filters?.isActive !== undefined)
    conditions.push(eq(users.isActive, filters.isActive));

  const rows = await db
    .select()
    .from(users)
    .where(conditions.length ? and(...(conditions as any[])) : undefined)
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
    .where(eq(users.email, email))
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
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return { ...user, password: "***" };
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

export async function toggleUserActive(id: string): Promise<User> {
  const [current] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const [user] = await db
    .update(users)
    .set({ isActive: !current.isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return { ...user, password: "***" };
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// ─── User stats (admin dashboard) ────────────────────────────────────────────

export async function getUserStats() {
  const [{ total }] = await db.select({ total: count() }).from(users);
  const [{ active }] = await db
    .select({ active: count() })
    .from(users)
    .where(eq(users.isActive, true));
  const [{ admins }] = await db
    .select({ admins: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  return { total, active, admins, users: total - admins };
}
