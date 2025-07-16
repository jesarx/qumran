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
    async signIn({ user, account, profile }) {
      // Check if email is in allowed list
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(email => email.trim()) || [];

      if (allowedEmails.length > 0 && user.email) {
        const isAllowed = allowedEmails.includes(user.email);
        if (!isAllowed) {
          console.log(`Access denied for email: ${user.email}`);
          return false; // This will redirect to the error page
        }
      }

      return true; // Allow sign in
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
