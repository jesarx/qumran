'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateAuthorAction,
  deleteAuthorAction,
  getAuthorAction
} from '@/lib/actions';
import { Author } from '@/lib/queries';
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

export default function EditAuthorForm({ authorId }: { authorId: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateAuthorAction, initialState);
  const [author, setAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load author
  useEffect(() => {
    async function loadAuthor() {
      try {
        const authorData = await getAuthorAction(authorId);
        if (authorData) {
          setAuthor(authorData);
        } else {
          router.push('/dashboard/authors');
        }
      } catch (error) {
        console.error('Failed to load author:', error);
        router.push('/dashboard/authors');
      } finally {
        setIsLoading(false);
      }
    }
    loadAuthor();
  }, [authorId, router]);

  // Handle successful update
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/authors');
    }
  }, [state.success, router]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este autor?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAuthorAction(authorId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(errorMessage || 'Error al eliminar el autor');
      setIsDeleting(false);
    }
  };

  if (isLoading || !author) {
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
            Editar Autor
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
            <input type="hidden" name="id" value={authorId} />

            {/* Author ID (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="authorId" className="text-sm font-medium">
                ID del Autor
              </Label>
              <Input
                id="authorId"
                type="text"
                value={authorId}
                disabled
                className="bg-muted"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                Nombre
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={author.first_name || ''}
                placeholder="Ingresa el nombre"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                defaultValue={author.last_name}
                placeholder="Ingresa el apellido"
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
                {isDeleting ? 'Eliminando...' : 'Eliminar Autor'}
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
