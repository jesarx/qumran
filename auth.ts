import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

// Single-admin password login. The password is never stored: only its bcrypt
// hash lives in ADMIN_PASSWORD_HASH. Generate one with:
//   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'tu-contraseña'
//
// Brute-force protection (single-instance in-memory limiter — this app runs
// as one Node process on the VPS):
//   - after MAX_ATTEMPTS failed tries within WINDOW_MS, logins are rejected
//     until the window expires, even with the right password.
//   - bcrypt cost 12 also makes each attempt inherently slow (~100ms).
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
let failedAttempts: number[] = [];

// Dummy hash ("this-is-not-the-password") so a misconfigured server still
// burns a bcrypt compare instead of returning instantly (no timing oracle).
const DUMMY_HASH = "$2b$12$7JzX0GFft2BILcWAkQCYUOY6w.yPIcAOu4BmrB0fraTfJ6pkfNZFO";

function isLockedOut(): boolean {
  const now = Date.now();
  failedAttempts = failedAttempts.filter((t) => now - t < WINDOW_MS);
  return failedAttempts.length >= MAX_ATTEMPTS;
}

export const AuthConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Contraseña",
      credentials: {
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        if (typeof password !== "string" || password.length === 0) {
          return null;
        }

        if (isLockedOut()) {
          console.error("Login locked out: too many failed attempts");
          return null;
        }

        const hash = process.env.ADMIN_PASSWORD_HASH;
        if (!hash) {
          // Fail closed, but still spend a bcrypt compare.
          console.error("ADMIN_PASSWORD_HASH is not configured - denying sign-in");
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const ok = await bcrypt.compare(password, hash);
        if (!ok) {
          failedAttempts.push(Date.now());
          return null;
        }

        failedAttempts = [];
        return { id: "admin", name: "Admin" };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(AuthConfig);
