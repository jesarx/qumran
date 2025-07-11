'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import {
  updateAuthorAction,
  deleteAuthorAction,
  getAuthorAction
} from '@/lib/actions';
import { Author } from '@/lib/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const initialState = {
  success: false,
  error: undefined
};

export default function EditAuthorForm({ authorId }: { authorId: number }) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateAuthorAction, initialState);
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
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el autor');
      setIsDeleting(false);
    }
  };

  if (isLoading || !author) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Editar Autor</h1>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={authorId} />

        {/* Author ID (readonly) */}
        <div>
          <Label htmlFor="authorId">ID del Autor</Label>
          <Input
            id="authorId"
            type="text"
            value={authorId}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        {/* First Name */}
        <div>
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={author.first_name || ''}
            className="mt-1"
          />
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={author.last_name}
            className="mt-1"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Autor'}
          </Button>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
