'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createBookAction, searchBookByISBN, getCategoriesAction, getLocationsAction, getAuthorsAction } from '@/lib/actions';
import { Category, Location, Author } from '@/lib/queries';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Camera, X, Search, Save, ArrowLeft, User, Building, BookOpen, MapPin, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface AuthorData {
  firstName: string;
  lastName: string;
  id?: number;
  isNew?: boolean;
}

export default function NewBookForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createBookAction, initialState);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Form fields
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');

  // Author fields with popover states
  const [author1, setAuthor1] = useState<AuthorData>({ lastName: '', firstName: '' });
  const [author2, setAuthor2] = useState<AuthorData>({ lastName: '', firstName: '' });
  const [author1PopoverOpen, setAuthor1PopoverOpen] = useState(false);
  const [author2PopoverOpen, setAuthor2PopoverOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, locs, auths] = await Promise.all([
          getCategoriesAction(),
          getLocationsAction(),
          getAuthorsAction()
        ]);
        setCategories(cats);
        setLocations(locs);
        setAuthors(auths);

        // Set Casa as default location
        const casaLocation = locs.find(loc => loc.slug === 'casa');
        if (casaLocation) {
          setLocationId(casaLocation.id.toString());
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    loadData();
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

  // Parse author name from Google Books API format
  const parseAuthorName = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: '', lastName: parts[0] };
    }
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1]
    };
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
          const author1Data = parseAuthorName(bookData.authors[0]);
          const existingAuthor1 = findExistingAuthor(author1Data.lastName, author1Data.firstName);

          setAuthor1({
            ...author1Data,
            id: existingAuthor1?.id,
            isNew: !existingAuthor1
          });

          // Parse second author if exists
          if (bookData.authors.length > 1) {
            const author2Data = parseAuthorName(bookData.authors[1]);
            const existingAuthor2 = findExistingAuthor(author2Data.lastName, author2Data.firstName);

            setAuthor2({
              ...author2Data,
              id: existingAuthor2?.id,
              isNew: !existingAuthor2
            });
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

  // Find existing author in the database
  const findExistingAuthor = (lastName: string, firstName: string = ''): Author | undefined => {
    return authors.find(author => {
      const authorLastName = author.last_name.toLowerCase();
      const authorFirstName = (author.first_name || '').toLowerCase();
      const searchLastName = lastName.toLowerCase();
      const searchFirstName = firstName.toLowerCase();

      if (firstName) {
        return authorLastName === searchLastName && authorFirstName === searchFirstName;
      } else {
        return authorLastName === searchLastName && !author.first_name;
      }
    });
  };

  // Filter authors based on search term
  const getFilteredAuthors = (searchTerm: string): Author[] => {
    if (!searchTerm) return [];

    return authors.filter(author => {
      const fullName = `${author.last_name} ${author.first_name || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  };

  // Handle author selection from dropdown
  const handleAuthorSelect = (author: Author, authorNumber: 1 | 2) => {
    const authorData: AuthorData = {
      lastName: author.last_name,
      firstName: author.first_name || '',
      id: author.id,
      isNew: false
    };

    if (authorNumber === 1) {
      setAuthor1(authorData);
      setAuthor1PopoverOpen(false);
    } else {
      setAuthor2(authorData);
      setAuthor2PopoverOpen(false);
    }
  };

  // Handle manual author input
  const handleAuthorLastNameChange = (value: string, authorNumber: 1 | 2) => {
    const existingAuthor = findExistingAuthor(value);

    const authorData: AuthorData = {
      lastName: value,
      firstName: existingAuthor?.first_name || (authorNumber === 1 ? author1.firstName : author2.firstName),
      id: existingAuthor?.id,
      isNew: !existingAuthor && value.length > 0
    };

    if (authorNumber === 1) {
      setAuthor1(authorData);
    } else {
      setAuthor2(authorData);
    }
  };

  const handleAuthorFirstNameChange = (value: string, authorNumber: 1 | 2) => {
    if (authorNumber === 1) {
      setAuthor1(prev => ({ ...prev, firstName: value, isNew: !prev.id && (prev.lastName.length > 0 || value.length > 0) }));
    } else {
      setAuthor2(prev => ({ ...prev, firstName: value, isNew: !prev.id && (prev.lastName.length > 0 || value.length > 0) }));
    }
  };

  // Custom form submission to handle author data
  const handleSubmit = async (formData: FormData) => {
    // Add author data to form
    formData.set('author1LastName', author1.lastName);
    formData.set('author1FirstName', author1.firstName);

    if (author2.lastName) {
      formData.set('author2LastName', author2.lastName);
      formData.set('author2FirstName', author2.firstName);
    }

    return formAction(formData);
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

          <form action={handleSubmit} className="space-y-6">
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
                      <Label htmlFor="author1LastName" className="text-sm">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Popover open={author1PopoverOpen} onOpenChange={setAuthor1PopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={author1PopoverOpen}
                            className="w-full justify-between font-normal"
                          >
                            {author1.lastName || "Selecciona o escribe un apellido..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-background border border-input shadow-md">
                          <Command>
                            <CommandInput
                              placeholder="Buscar apellido..."
                              value={author1.lastName}
                              onValueChange={(value) => handleAuthorLastNameChange(value, 1)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {author1.lastName && author1.isNew ? (
                                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                    Se creará un nuevo autor
                                  </div>
                                ) : (
                                  "No se encontraron autores"
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {getFilteredAuthors(author1.lastName).map((author) => (
                                  <CommandItem
                                    key={author.id}
                                    value={`${author.last_name} ${author.first_name || ''}`}
                                    onSelect={() => handleAuthorSelect(author, 1)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        author1.id === author.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {author.last_name}
                                    {author.first_name && (
                                      <span className="text-muted-foreground ml-2">
                                        {author.first_name}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author1FirstName" className="text-sm">
                        Nombre
                      </Label>
                      <Input
                        id="author1FirstName"
                        type="text"
                        value={author1.firstName}
                        onChange={(e) => handleAuthorFirstNameChange(e.target.value, 1)}
                        placeholder="Nombre"
                      />
                    </div>
                  </div>
                  {author1.isNew && author1.lastName && (
                    <Alert>
                      <Plus className="h-4 w-4" />
                      <AlertDescription>
                        Se creará un nuevo autor: {author1.firstName} {author1.lastName}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Secondary Author */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Segundo Autor (opcional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author2LastName" className="text-sm">
                        Apellido
                      </Label>
                      <Popover open={author2PopoverOpen} onOpenChange={setAuthor2PopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={author2PopoverOpen}
                            className="w-full justify-between font-normal"
                          >
                            {author2.lastName || "Selecciona o escribe un apellido..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-background border border-input shadow-md">
                          <Command>
                            <CommandInput
                              placeholder="Buscar apellido..."
                              value={author2.lastName}
                              onValueChange={(value) => handleAuthorLastNameChange(value, 2)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {author2.lastName && author2.isNew ? (
                                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                    Se creará un nuevo autor
                                  </div>
                                ) : (
                                  "No se encontraron autores"
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {getFilteredAuthors(author2.lastName).map((author) => (
                                  <CommandItem
                                    key={author.id}
                                    value={`${author.last_name} ${author.first_name || ''}`}
                                    onSelect={() => handleAuthorSelect(author, 2)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        author2.id === author.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {author.last_name}
                                    {author.first_name && (
                                      <span className="text-muted-foreground ml-2">
                                        {author.first_name}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author2FirstName" className="text-sm">
                        Nombre
                      </Label>
                      <Input
                        id="author2FirstName"
                        type="text"
                        value={author2.firstName}
                        onChange={(e) => handleAuthorFirstNameChange(e.target.value, 2)}
                        placeholder="Nombre"
                      />
                    </div>
                  </div>
                  {author2.isNew && author2.lastName && (
                    <Alert>
                      <Plus className="h-4 w-4" />
                      <AlertDescription>
                        Se creará un nuevo autor: {author2.firstName} {author2.lastName}
                      </AlertDescription>
                    </Alert>
                  )}
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

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="locationId" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación <span className="text-destructive">*</span>
              </Label>
              <Select
                name="locationId"
                value={locationId}
                onValueChange={setLocationId}
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
