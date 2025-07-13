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
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la editorial');
      setIsDeleting(false);
    }
  };

  if (isLoading || !publisher) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Editar Editorial</h1>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={publisherId} />

        {/* Publisher ID (readonly) */}
        <div>
          <Label htmlFor="publisherId">ID de la Editorial</Label>
          <Input
            id="publisherId"
            type="text"
            value={publisherId}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={publisher.name}
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
            {isDeleting ? 'Eliminando...' : 'Eliminar Editorial'}
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
