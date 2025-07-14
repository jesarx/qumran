'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createBookAction, searchBookByISBN, getCategoriesAction } from '@/lib/actions';
import { Category } from '@/lib/queries';
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
import { Camera, X, Search, Save, ArrowLeft, User, Building, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the scanner to avoid SSR issues
const BarcodeScanner = dynamic(
  () => import('@/components/barcode-scanner'),
  { ssr: false }
);

const initialState = {
  success: false,
  error: undefined,
  bookId: undefined
};

export default function NewBookForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createBookAction, initialState);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showScanner, setShowScanner] = useState(false);

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

  // Handle barcode scan
  const handleBarcodeScan = async (scannedIsbn: string) => {
    setShowScanner(false);
    setIsbn(scannedIsbn);
    await handleISBNSearch(scannedIsbn);
  };

  // Search book by ISBN
  const handleISBNSearch = async (isbnToSearch?: string) => {
    const searchIsbn = isbnToSearch || isbn;
    if (!searchIsbn) {
      return;
    }

    setIsSearchingISBN(true);
    try {
      const bookData = await searchBookByISBN(searchIsbn);

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
            <BookOpen className="h-5 w-5" />
            Agregar Nuevo Libro
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

          {showScanner && (
            <div className="fixed inset-0 z-50 bg-black">
              <div className="relative h-full">
                <Button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="absolute top-4 right-4 z-10 bg-white text-black hover:bg-gray-200"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
                <BarcodeScanner onScan={handleBarcodeScan} />
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* ISBN with search */}
            <div className="space-y-2">
              <Label htmlFor="isbn" className="text-sm font-medium">
                ISBN
              </Label>
              <div className="flex gap-2">
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
                  onClick={() => setShowScanner(true)}
                  variant="outline"
                  size="icon"
                  title="Escanear código de barras"
                  className="md:hidden"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => handleISBNSearch()}
                  disabled={isSearchingISBN || !isbn}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {isSearchingISBN ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Ingresa el ISBN para buscar información del libro automáticamente
                <span className="md:hidden"> o usa la cámara para escanear el código de barras</span>
              </p>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ingresa el título del libro"
              />
            </div>

            {/* Authors */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Author */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Autor Principal <span className="text-destructive">*</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author1FirstName" className="text-sm">
                        Nombre
                      </Label>
                      <Input
                        id="author1FirstName"
                        name="author1FirstName"
                        type="text"
                        value={author1FirstName}
                        onChange={(e) => setAuthor1FirstName(e.target.value)}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author1LastName" className="text-sm">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="author1LastName"
                        name="author1LastName"
                        type="text"
                        required
                        value={author1LastName}
                        onChange={(e) => setAuthor1LastName(e.target.value)}
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Author */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Segundo Autor (opcional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author2FirstName" className="text-sm">
                        Nombre
                      </Label>
                      <Input
                        id="author2FirstName"
                        name="author2FirstName"
                        type="text"
                        value={author2FirstName}
                        onChange={(e) => setAuthor2FirstName(e.target.value)}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author2LastName" className="text-sm">
                        Apellido
                      </Label>
                      <Input
                        id="author2LastName"
                        name="author2LastName"
                        type="text"
                        value={author2LastName}
                        onChange={(e) => setAuthor2LastName(e.target.value)}
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publisher */}
            <div className="space-y-2">
              <Label htmlFor="publisherName" className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Editorial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="publisherName"
                name="publisherName"
                type="text"
                required
                value={publisherName}
                onChange={(e) => setPublisherName(e.target.value)}
                placeholder="Ingresa el nombre de la editorial"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                name="categoryId"
                value={categoryId}
                onValueChange={setCategoryId}
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
                Agregar Libro
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
