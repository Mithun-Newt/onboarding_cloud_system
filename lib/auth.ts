import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RoleName } from "@prisma/client";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        const ip = req.headers?.["x-forwarded-for"] || "unknown";
        const rateLimitKey = `${ip}-${credentials.username}`;

        if (!checkRateLimit(rateLimitKey)) {
          throw new Error("Too many login attempts. Please try again in 5 minutes.");
        }

        const user = await prisma.staffUser.findUnique({
          where: { username: credentials.username },
          include: {
            staffUserRoles: { include: { role: true } },
          },
        });

        if (!user || !user.isActive) {
          await logFailedLogin(credentials.username);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          await logFailedLogin(credentials.username);
          return null;
        }

        await prisma.staffUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        resetRateLimit(rateLimitKey);

        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            action: "LOGIN_SUCCESS",
            entityType: "StaffUser",
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          username: user.username,
          name: user.fullName,
          email: user.email ?? undefined,
          roles: user.staffUserRoles.map((r) => r.role.name),
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.roles = (user as any).roles;
        token.mustChangePassword = (user as any).mustChangePassword;
      } else if (token.id) {
        // Refresh token on every session call to get latest mustChangePassword status
        const user = await prisma.staffUser.findUnique({
          where: { id: token.id as string },
          include: {
            staffUserRoles: { include: { role: true } },
          },
        });
        
        if (user) {
          token.mustChangePassword = user.mustChangePassword;
          token.roles = user.staffUserRoles.map((r) => r.role.name);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).roles = token.roles;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const parsedUrl = new URL(url);
        const baseWithProto = baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
          ? baseUrl
          : `http://${baseUrl}`;
        const parsedBase = new URL(baseWithProto);
        if (
          parsedUrl.origin === parsedBase.origin ||
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname === "127.0.0.1" ||
          parsedUrl.hostname.endsWith(".render.com")
        ) {
          return url;
        }
      } catch (e) {
        // Ignore parsing errors and fallback
      }

      if (url.startsWith("/")) {
        return url;
      }
      return "/dashboard";
    },
  },
};

async function logFailedLogin(username: string) {
  await prisma.auditLog.create({
    data: {
      action: "LOGIN_FAILURE",
      entityType: "StaffUser",
      newValue: { username },
    },
  });
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function hasRole(roles: RoleName[], required: RoleName[]): boolean {
  return required.some((r) => roles.includes(r));
}

export async function requireRole(required: RoleName[]) {
  const session = await requireAuth();
  const userRoles = ((session.user as any).roles ?? []) as RoleName[];
  if (!hasRole(userRoles, required)) throw new Error("Forbidden");
  return session;
}
