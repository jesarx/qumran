import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Function to authenticate user via API
async function authenticateUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/tokens/authentication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.authentication_token;
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const authToken = await authenticateUser(email, password);

          if (authToken) {
            // Return a user object that NextAuth can work with
            return {
              id: email, // Using email as ID since we don't have user ID from API
              email: email,
              token: authToken.token,
              expiry: authToken.expiry
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Send properties to the client
      if (token.user) {
        session.user = {
          ...session.user,
          id: token.user.id,
          email: token.user.email,
        };
      }

      // Add token directly to user object
      if (token.authToken) {
        session.user.token = token.authToken.token;
        session.user.expiry = token.authToken.expiry;
      }

      return session;
    },
    async jwt({ token, user }) {
      // Add auth token to JWT on sign in
      if (user) {
        token.user = {
          id: user.email as string,      // Use email as id if actual id is missing
          email: user.email as string,   // Assert that email will be a string
        };
        token.authToken = {
          token: user.token as string,    // Assert that token will be a string
          expiry: user.expiry as string,  // Assert that expiry will be a string
        };
      }
      return token;
    },
  },
  // Add this to include the token in the session
});
