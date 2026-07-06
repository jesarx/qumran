'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticate } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { KeyRound, LogIn } from 'lucide-react';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Accede al panel de administración</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid w-full items-center gap-4">
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300 rounded">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <Button
            type="submit"
            variant="outline"
            className="w-full cursor-pointer"
            disabled={isPending}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Solo el administrador puede acceder a esta sección.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
