import bcrypt from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export function mergeRoleIntoToken(token: JWT, user?: { role?: string } | null): JWT {
  if (user?.role) token.role = user.role;
  return token;
}

export function mergeRoleIntoSession(session: Session, token: JWT): Session {
  if (session.user) {
    session.user.id = token.sub ?? session.user.id ?? "";
    session.user.role = token.role ?? "USER";
  }
  return session;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user) return null;

        const matches = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!matches) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      return mergeRoleIntoToken(token, user as { role?: string } | null);
    },
    async session({ session, token }) {
      return mergeRoleIntoSession(session, token);
    },
  },
  pages: { signIn: "/signin" },
};
