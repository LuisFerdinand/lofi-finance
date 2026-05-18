import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { UserRole } from "@/types/next-auth";

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
          .where(eq(users.email, email))
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
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.isActive = user.isActive;
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