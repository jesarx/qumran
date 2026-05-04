import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const AuthConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    async signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(email => email.trim()) ?? [];

      // Fail closed: if no allowed emails configured, deny all sign-ins
      if (allowedEmails.length === 0) {
        console.error('ALLOWED_EMAILS is not configured - denying sign-in');
        return false;
      }

      if (!user.email || !allowedEmails.includes(user.email)) {
        console.error(`Access denied for email: ${user.email ?? 'unknown'}`);
        return false;
      }

      return true;
    },
    async session({ session, token }) {
      // You can add custom session properties here if needed
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist user data in token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(AuthConfig);
