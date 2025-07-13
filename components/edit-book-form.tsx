'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateBookAction,
  deleteBookAction,
  getBookAction,
  getCategoriesAction
} from '@/lib/actions';
import { Book, Category } from '@/lib/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState = {
  success: false,
  error: undefined
};

export default function EditBookForm({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateBookAction, initialState);
  const [book, setBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load book and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [bookData, cats] = await Promise.all([
          getBookAction(bookId),
          getCategoriesAction()
        ]);

        if (bookData) {
          setBook(bookData);
        } else {
          router.push('/dashboard/books');
        }

        setCategories(cats);
      } catch (error) {
        console.error('Failed to load data:', error);
        router.push('/dashboard/books');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [bookId, router]);

  // Handle successful update
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/books');
    }
  }, [state.success, router]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBookAction(bookId);
      // The action will redirect, so no need to do it here
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Error al eliminar el libro');
      setIsDeleting(false);
    }
  };

  if (isLoading || !book) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Editar Libro</h1>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={bookId} />

        {/* Book ID (readonly) */}
        <div>
          <Label htmlFor="bookId">ID del Libro</Label>
          <Input
            id="bookId"
            type="text"
            value={bookId}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        {/* ISBN */}
        <div>
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            name="isbn"
            type="text"
            defaultValue={book.isbn || ''}
            className="mt-1"
          />
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={book.title}
            className="mt-1"
          />
        </div>

        {/* Authors (readonly) */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Autores (no editables)</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Autor Principal:</span>{' '}
              {book.author1_first_name} {book.author1_last_name}
            </div>
            {book.author2_last_name && (
              <div>
                <span className="font-medium">Segundo Autor:</span>{' '}
                {book.author2_first_name} {book.author2_last_name}
              </div>
            )}
          </div>
        </div>

        {/* Publisher (readonly) */}
        <div>
          <Label htmlFor="publisher">Editorial (no editable)</Label>
          <Input
            id="publisher"
            type="text"
            value={book.publisher_name || ''}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="categoryId">Categoría *</Label>
          <Select
            name="categoryId"
            defaultValue={book.category_id.toString()}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Libro'}
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
