'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateBookAction,
  deleteBookAction,
  getBookAction,
  getCategoriesAction,
  getLocationsAction
} from '@/lib/actions';
import { Book, Category, Location } from '@/lib/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Save, ArrowLeft, User, Building, MapPin } from 'lucide-react';

const initialState = {
  success: false,
  error: undefined
};

export default function EditBookForm({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateBookAction, initialState);
  const [book, setBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load book, categories, and locations
  useEffect(() => {
    async function loadData() {
      try {
        const [bookData, cats, locs] = await Promise.all([
          getBookAction(bookId),
          getCategoriesAction(),
          getLocationsAction()
        ]);

        if (bookData) {
          setBook(bookData);
        } else {
          router.push('/dashboard/books');
        }

        setCategories(cats);
        setLocations(locs);
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
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
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
            Editar Libro
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
            <input type="hidden" name="id" value={bookId} />

            {/* Book ID (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="bookId" className="text-sm font-medium">
                ID del Libro
              </Label>
              <Input
                id="bookId"
                type="text"
                value={bookId}
                disabled
                className="bg-muted"
              />
            </div>

            {/* ISBN */}
            <div className="space-y-2">
              <Label htmlFor="isbn" className="text-sm font-medium">
                ISBN
              </Label>
              <Input
                id="isbn"
                name="isbn"
                type="text"
                defaultValue={book.isbn || ''}
                placeholder="978-84-376-0494-7"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={book.title}
                placeholder="Ingresa el título del libro"
              />
            </div>

            {/* Authors (readonly) */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autores (no editables)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Autor Principal:</span>
                  <span className="text-sm">
                    {book.author1_first_name} {book.author1_last_name}
                  </span>
                </div>
                {book.author2_last_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Segundo Autor:</span>
                    <span className="text-sm">
                      {book.author2_first_name} {book.author2_last_name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publisher (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="publisher" className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Editorial (no editable)
              </Label>
              <Input
                id="publisher"
                type="text"
                value={book.publisher_name || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                name="categoryId"
                defaultValue={book.category_id.toString()}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
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

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="locationId" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación <span className="text-destructive">*</span>
              </Label>
              <Select
                name="locationId"
                defaultValue={book.location_id.toString()}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {isDeleting ? 'Eliminando...' : 'Eliminar Libro'}
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
