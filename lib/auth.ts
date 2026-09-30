import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { UserRole } from "@/types/next-auth";

// Sessions are long-lived JWTs, so role / active status baked in at sign-in
// would otherwise stay trusted for the token's whole life — a deactivated or
// deleted user kept access, a demoted admin kept /admin. Re-read them from the
// DB at most this often (one primary-key lookup).
const RECHECK_MS = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          throw new Error("Missing credentials");
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase()))
          .limit(1);

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Account deactivated");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          isActive: user.isActive,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.checkedAt = Date.now();
        return token;
      }

      const lastChecked = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      const userId = typeof token.id === "string" ? token.id : null;
      if (userId && Date.now() - lastChecked > RECHECK_MS) {
        try {
          const [row] = await db
            .select({ role: users.role, isActive: users.isActive, name: users.name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          // Deleted or deactivated → end the session.
          if (!row || !row.isActive) return null;
          token.role = row.role;
          token.isActive = row.isActive;
          token.name = row.name;
          token.checkedAt = Date.now();
        } catch (err) {
          // A DB hiccup shouldn't log everyone out — keep the session and
          // retry on the next request.
          console.error("[auth] session re-check failed", err);
        }
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : "";
      session.user.role =
        token.role === "admin" || token.role === "user" ? token.role : "user";
      session.user.isActive =
        typeof token.isActive === "boolean" ? token.isActive : false;

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },
});
