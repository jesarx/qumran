'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  provider: string = 'google',
  callbackUrl: string = '/dashboard'
) {
  try {
    await signIn(provider, { redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}
