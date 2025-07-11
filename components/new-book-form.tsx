'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import { createBookAction, searchBookByISBN, getCategoriesAction } from '@/lib/actions';
import { Category } from '@/lib/queries';
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
  error: undefined,
  bookId: undefined
};

export default function NewBookForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(createBookAction, initialState);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author1FirstName, setAuthor1FirstName] = useState('');
  const [author1LastName, setAuthor1LastName] = useState('');
  const [author2FirstName, setAuthor2FirstName] = useState('');
  const [author2LastName, setAuthor2LastName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategoriesAction();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }
    loadCategories();
  }, []);

  // Handle successful creation
  useEffect(() => {
    if (state.success && state.bookId) {
      router.push('/dashboard/books');
    }
  }, [state.success, state.bookId, router]);

  // Search book by ISBN
  const handleISBNSearch = async () => {
    if (!isbn) {
      return;
    }

    setIsSearchingISBN(true);
    try {
      const bookData = await searchBookByISBN(isbn);

      if (bookData) {
        // Auto-fill form fields
        setTitle(bookData.title);

        // Parse first author
        if (bookData.authors && bookData.authors.length > 0) {
          const authorParts = bookData.authors[0].split(' ');
          if (authorParts.length > 1) {
            setAuthor1LastName(authorParts[authorParts.length - 1]);
            setAuthor1FirstName(authorParts.slice(0, -1).join(' '));
          } else {
            setAuthor1LastName(bookData.authors[0]);
          }

          // Parse second author if exists
          if (bookData.authors.length > 1) {
            const author2Parts = bookData.authors[1].split(' ');
            if (author2Parts.length > 1) {
              setAuthor2LastName(author2Parts[author2Parts.length - 1]);
              setAuthor2FirstName(author2Parts.slice(0, -1).join(' '));
            } else {
              setAuthor2LastName(bookData.authors[1]);
            }
          }
        }

        if (bookData.publisher) {
          setPublisherName(bookData.publisher);
        }

        // Try to match category based on subjects
        if (bookData.subjects && bookData.subjects.length > 0) {
          // Simple matching logic - you might want to improve this
          const subject = bookData.subjects[0].toLowerCase();
          const matchedCategory = categories.find(cat =>
            subject.includes(cat.name.toLowerCase()) ||
            subject.includes(cat.slug)
          );
          if (matchedCategory) {
            setCategoryId(matchedCategory.id.toString());
          }
        }
      } else {
        alert('No se encontró información para este ISBN');
      }
    } catch (error) {
      console.error('Error searching ISBN:', error);
      alert('Error al buscar el ISBN');
    } finally {
      setIsSearchingISBN(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Agregar Nuevo Libro</h1>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* ISBN with search */}
        <div>
          <Label htmlFor="isbn">ISBN</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="isbn"
              name="isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-84-376-0494-7"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleISBNSearch}
              disabled={isSearchingISBN || !isbn}
              variant="outline"
            >
              {isSearchingISBN ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa el ISBN para buscar información del libro automáticamente
          </p>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Authors */}
        <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Autor Principal *</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author1FirstName">Nombre</Label>
              <Input
                id="author1FirstName"
                name="author1FirstName"
                type="text"
                value={author1FirstName}
                onChange={(e) => setAuthor1FirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="author1LastName">Apellido *</Label>
              <Input
                id="author1LastName"
                name="author1LastName"
                type="text"
                required
                value={author1LastName}
                onChange={(e) => setAuthor1LastName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <h3 className="font-semibold pt-4">Segundo Autor (opcional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author2FirstName">Nombre</Label>
              <Input
                id="author2FirstName"
                name="author2FirstName"
                type="text"
                value={author2FirstName}
                onChange={(e) => setAuthor2FirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="author2LastName">Apellido</Label>
              <Input
                id="author2LastName"
                name="author2LastName"
                type="text"
                value={author2LastName}
                onChange={(e) => setAuthor2LastName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Publisher */}
        <div>
          <Label htmlFor="publisherName">Editorial *</Label>
          <Input
            id="publisherName"
            name="publisherName"
            type="text"
            required
            value={publisherName}
            onChange={(e) => setPublisherName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="categoryId">Categoría *</Label>
          <Select
            name="categoryId"
            value={categoryId}
            onValueChange={setCategoryId}
            required
          >
            <SelectTrigger className="mt-1">
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

        {/* Action buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit">
            Agregar Libro
          </Button>
        </div>
      </form>
    </div>
  );
}
