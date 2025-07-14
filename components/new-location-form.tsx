'use client';

import { useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createLocationAction } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, ArrowLeft, MapPin } from 'lucide-react';

const initialState = {
  success: false,
  error: undefined
};

export default function NewLocationForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createLocationAction, initialState);

  // Handle successful creation
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/locations');
    }
  }, [state.success, router]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <MapPin className="h-5 w-5" />
            Agregar Nueva Ubicación
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ingresa el nombre de la ubicación"
                autoFocus
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Agregar Ubicación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
