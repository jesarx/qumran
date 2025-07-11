'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { authenticate } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc'; // You'll need to install react-icons

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    await authenticate('google', callbackUrl);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Accede al panel de administración</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
              Error al iniciar sesión. Por favor intenta de nuevo.
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continuar con Google
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Solo usuarios autorizados pueden acceder al panel de administración.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
