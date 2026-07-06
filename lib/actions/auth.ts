'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const callbackUrl = formData.get('callbackUrl');
  const redirectTo =
    typeof callbackUrl === 'string' && callbackUrl.startsWith('/')
      ? callbackUrl
      : '/dashboard';

  try {
    await signIn('credentials', {
      password: formData.get('password'),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Contraseña incorrecta.';
        default:
          return 'Error al iniciar sesión. Intenta de nuevo.';
      }
    }
    // signIn redirects on success by throwing NEXT_REDIRECT; re-throw it.
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}
