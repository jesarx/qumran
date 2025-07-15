'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updatePublisherAction,
  deletePublisherAction,
  getPublisherAction
} from '@/lib/actions';
import { Publisher } from '@/lib/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Save, ArrowLeft } from 'lucide-react';

const initialState = {
  success: false,
  error: undefined
};

export default function EditPublisherForm({ publisherId }: { publisherId: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updatePublisherAction, initialState);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load publisher
  useEffect(() => {
    async function loadPublisher() {
      try {
        const publisherData = await getPublisherAction(publisherId);
        if (publisherData) {
          setPublisher(publisherData);
        } else {
          router.push('/dashboard/publishers');
        }
      } catch (error) {
        console.error('Failed to load publisher:', error);
        router.push('/dashboard/publishers');
      } finally {
        setIsLoading(false);
      }
    }
    loadPublisher();
  }, [publisherId, router]);

  // Handle successful update
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/publishers');
    }
  }, [state.success, router]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta editorial?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePublisherAction(publisherId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(errorMessage || 'Error al eliminar');
      alert(error.message || 'Error al eliminar la editorial');
      setIsDeleting(false);
    }
  };

  if (isLoading || !publisher) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Editar Editorial
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
            <input type="hidden" name="id" value={publisherId} />

            {/* Publisher ID (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="publisherId" className="text-sm font-medium">
                ID de la Editorial
              </Label>
              <Input
                id="publisherId"
                type="text"
                value={publisherId}
                disabled
                className="bg-muted"
              />
            </div>

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
                defaultValue={publisher.name}
                placeholder="Ingresa el nombre de la editorial"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Eliminando...' : 'Eliminar Editorial'}
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
