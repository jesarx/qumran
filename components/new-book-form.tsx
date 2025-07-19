'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createBookAction, searchBookByISBN, getCategoriesAction, getLocationsAction, getAuthorsAction, getPublishersAction } from '@/lib/actions';
import { Category, Location, Author, Publisher } from '@/lib/queries';
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
import { Camera, X, Search, Save, ArrowLeft, User, BookOpen, MapPin, Check, ChevronsUpDown, Plus, LayoutList, LibraryBig } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
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

interface PublisherData {
  name: string;
  id?: number;
  isNew?: boolean;
}

export default function NewBookForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createBookAction, initialState);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Form fields
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');

  // Author fields with popover states
  const [author1, setAuthor1] = useState<AuthorData>({ lastName: '', firstName: '' });
  const [author2, setAuthor2] = useState<AuthorData>({ lastName: '', firstName: '' });
  const [author1PopoverOpen, setAuthor1PopoverOpen] = useState(false);
  const [author2PopoverOpen, setAuthor2PopoverOpen] = useState(false);
  const [author1SearchTerm, setAuthor1SearchTerm] = useState('');
  const [author2SearchTerm, setAuthor2SearchTerm] = useState('');
  const [filteredAuthors1, setFilteredAuthors1] = useState<Author[]>([]);
  const [filteredAuthors2, setFilteredAuthors2] = useState<Author[]>([]);

  // Publisher field with popover state
  const [publisher, setPublisher] = useState<PublisherData>({ name: '' });
  const [publisherPopoverOpen, setPublisherPopoverOpen] = useState(false);
  const [publisherSearchTerm, setPublisherSearchTerm] = useState('');
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);

  // Debounced search functions for authors
  const debouncedAuthorSearch1 = useDebouncedCallback(async (searchTerm: string) => {
    if (searchTerm.length > 0) {
      try {
        const authorsData = await getAuthorsAction(searchTerm, 'name', 1);
        setFilteredAuthors1(authorsData.authors);
      } catch (error) {
        console.error('Failed to search authors:', error);
        setFilteredAuthors1([]);
      }
    } else {
      setFilteredAuthors1([]);
    }
  }, 300);

  const debouncedAuthorSearch2 = useDebouncedCallback(async (searchTerm: string) => {
    if (searchTerm.length > 0) {
      try {
        const authorsData = await getAuthorsAction(searchTerm, 'name', 1);
        setFilteredAuthors2(authorsData.authors);
      } catch (error) {
        console.error('Failed to search authors:', error);
        setFilteredAuthors2([]);
      }
    } else {
      setFilteredAuthors2([]);
    }
  }, 300);

  const debouncedPublisherSearch = useDebouncedCallback(async (searchTerm: string) => {
    if (searchTerm.length > 0) {
      try {
        const publishersData = await getPublishersAction(searchTerm, 'name', 1);
        setFilteredPublishers(publishersData.publishers);
      } catch (error) {
        console.error('Failed to search publishers:', error);
        setFilteredPublishers([]);
      }
    } else {
      setFilteredPublishers([]);
    }
  }, 300);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, locs] = await Promise.all([
          getCategoriesAction(),
          getLocationsAction()
        ]);

        setCategories(cats);
        setLocations(locs);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    loadData();
  }, []);

  // Set default location after locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !locationId) {
      setLocationId(locations[0].id.toString());
    }
  }, [locations, locationId]);

  // Handle successful creation
  useEffect(() => {
    if (state?.success && state?.bookId) {
      router.push('/dashboard/books');
    }
  }, [state?.success, state?.bookId, router]);

  // Handle author search term changes
  useEffect(() => {
    debouncedAuthorSearch1(author1SearchTerm);
  }, [author1SearchTerm, debouncedAuthorSearch1]);

  useEffect(() => {
    debouncedAuthorSearch2(author2SearchTerm);
  }, [author2SearchTerm, debouncedAuthorSearch2]);

  // Handle publisher search term changes
  useEffect(() => {
    debouncedPublisherSearch(publisherSearchTerm);
  }, [publisherSearchTerm, debouncedPublisherSearch]);

  // Handle barcode scan
  const handleBarcodeScan = async (scannedIsbn: string) => {
    setShowScanner(false);
    setIsbn(scannedIsbn);
  };

  // Parse author name from Google Books API format (no transformation)
  const parseAuthorName = (fullName: string): { firstName: string; lastName: string } => {
    const trimmedName = fullName.trim();
    const parts = trimmedName.split(' ');
    if (parts.length === 1) {
      return { firstName: '', lastName: parts[0] };
    }
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1]
    };
  };

  // Search book by ISBN - simplified
  const handleISBNSearch = async () => {
    if (!isbn || isbn.length < 10) {
      alert('Por favor ingresa un ISBN válido (mínimo 10 dígitos)');
      return;
    }

    setIsSearchingISBN(true);
    try {
      const bookData = await searchBookByISBN(isbn);

      if (bookData) {
        // Auto-fill form fields (no case transformation)
        setTitle(bookData.title);

        // Parse first author
        if (bookData.authors && bookData.authors.length > 0) {
          const author1Data = parseAuthorName(bookData.authors[0]);
          setAuthor1({ ...author1Data, isNew: true });
          setAuthor1SearchTerm(author1Data.lastName);

          // Parse second author if exists
          if (bookData.authors.length > 1) {
            const author2Data = parseAuthorName(bookData.authors[1]);
            setAuthor2({ ...author2Data, isNew: true });
            setAuthor2SearchTerm(author2Data.lastName);
          }
        }

        if (bookData.publisher) {
          setPublisher({ name: bookData.publisher, isNew: true });
          setPublisherSearchTerm(bookData.publisher);
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
      alert('Error al buscar el ISBN. Por favor intenta de nuevo.');
    } finally {
      setIsSearchingISBN(false);
    }
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
      setAuthor1SearchTerm(author.last_name);
      setAuthor1PopoverOpen(false);
    } else {
      setAuthor2(authorData);
      setAuthor2SearchTerm(author.last_name);
      setAuthor2PopoverOpen(false);
    }
  };

  // Handle publisher selection from dropdown
  const handlePublisherSelect = (publisher: Publisher) => {
    const publisherData: PublisherData = {
      name: publisher.name,
      id: publisher.id,
      isNew: false
    };

    setPublisher(publisherData);
    setPublisherSearchTerm(publisher.name);
    setPublisherPopoverOpen(false);
  };

  // Handle manual author last name input
  const handleAuthorLastNameChange = (value: string, authorNumber: 1 | 2) => {
    if (authorNumber === 1) {
      setAuthor1SearchTerm(value);
      setAuthor1(prev => ({
        ...prev,
        lastName: value,
        id: undefined,
        isNew: value.trim().length > 0
      }));
    } else {
      setAuthor2SearchTerm(value);
      setAuthor2(prev => ({
        ...prev,
        lastName: value,
        id: undefined,
        isNew: value.trim().length > 0
      }));
    }
  };

  // Handle manual author first name input
  const handleAuthorFirstNameChange = (value: string, authorNumber: 1 | 2) => {
    if (authorNumber === 1) {
      setAuthor1(prev => ({
        ...prev,
        firstName: value,
        isNew: !prev.id && (prev.lastName.length > 0 || value.length > 0)
      }));
    } else {
      setAuthor2(prev => ({
        ...prev,
        firstName: value,
        isNew: !prev.id && (prev.lastName.length > 0 || value.length > 0)
      }));
    }
  };

  // Handle manual publisher input
  const handlePublisherSearchChange = (value: string) => {
    setPublisherSearchTerm(value);
    setPublisher({
      name: value.trim(),
      id: undefined,
      isNew: value.trim().length > 0
    });
  };

  // Handle ISBN input with validation
  const handleISBNChange = (value: string) => {
    // Only allow numbers and limit to 13 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 13);
    setIsbn(numericValue);
  };

  // Custom form submission
  const handleSubmit = async (formData: FormData) => {
    // Validate required fields before submission
    if (!title.trim()) {
      alert('El título es requerido');
      return;
    }

    if (!author1.lastName.trim()) {
      alert('El apellido del autor principal es requerido');
      return;
    }

    if (!publisher.name.trim()) {
      alert('La editorial es requerida');
      return;
    }

    if (!categoryId) {
      alert('La categoría es requerida');
      return;
    }

    if (!locationId) {
      alert('La ubicación es requerida');
      return;
    }

    // Set form data
    formData.set('title', title.trim());
    formData.set('isbn', isbn.trim() || '');
    formData.set('author1LastName', author1.lastName.trim());
    formData.set('author1FirstName', author1.firstName?.trim() || '');
    formData.set('publisherName', publisher.name.trim());
    formData.set('categoryId', categoryId.toString());
    formData.set('locationId', locationId.toString());

    // Only set author2 if lastName exists
    if (author2.lastName && author2.lastName.trim()) {
      formData.set('author2LastName', author2.lastName.trim());
      formData.set('author2FirstName', author2.firstName?.trim() || '');
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
          {state?.error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950">
              <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
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
                  onChange={(e) => handleISBNChange(e.target.value)}
                  className="flex-1"
                  maxLength={13}
                  placeholder="Ingresa el ISBN (solo números)"
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
                  onClick={handleISBNSearch}
                  disabled={isSearchingISBN || !isbn}
                  variant="outline"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  {isSearchingISBN ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Ingresa el ISBN y presiona &quot;Buscar&quot; para obtener información automáticamente
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className={cn(
                              "w-full justify-between font-normal",
                              !author1.lastName && "text-muted-foreground"
                            )}
                          >
                            {author1.lastName || "Comienza a escribir..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          style={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            backdropFilter: 'none'
                          }}
                        >
                          <Command style={{ backgroundColor: 'hsl(var(--popover))' }}>
                            <CommandInput
                              placeholder="Buscar apellido..."
                              value={author1SearchTerm}
                              onValueChange={(value) => handleAuthorLastNameChange(value, 1)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {author1.lastName && author1.isNew ? (
                                  <div className="flex items-center gap-2 p-2 text-sm text-red-600">
                                    <Plus className="h-4 w-4" />
                                    Se creará un nuevo autor
                                  </div>
                                ) : (
                                  "No se encontraron autores"
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredAuthors1.map((author) => (
                                  <CommandItem
                                    key={author.id}
                                    value={`${author.last_name}${author.first_name ? ` ${author.first_name}` : ''}`}
                                    onSelect={() => handleAuthorSelect(author, 1)}
                                    className="cursor-pointer"
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
                                        ,&nbsp;{author.first_name}
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
                      />
                    </div>
                  </div>
                  {author1.isNew && author1.lastName && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <Plus className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className={cn(
                              "w-full justify-between font-normal",
                              !author2.lastName && "text-muted-foreground"
                            )}
                          >
                            {author2.lastName || "comienza a escribir..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          style={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            backdropFilter: 'none'
                          }}
                        >
                          <Command style={{ backgroundColor: 'hsl(var(--popover))' }}>
                            <CommandInput
                              placeholder="Buscar apellido..."
                              value={author2SearchTerm}
                              onValueChange={(value) => handleAuthorLastNameChange(value, 2)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {author2.lastName && author2.isNew ? (
                                  <div className="flex items-center gap-2 p-2 text-sm text-red-600">
                                    <Plus className="h-4 w-4" />
                                    Se creará un nuevo autor
                                  </div>
                                ) : (
                                  "No se encontraron autores"
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredAuthors2.map((author) => (
                                  <CommandItem
                                    key={author.id}
                                    value={`${author.last_name}${author.first_name ? ` ${author.first_name}` : ''}`}
                                    onSelect={() => handleAuthorSelect(author, 2)}
                                    className="cursor-pointer"
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
                                        ,&nbsp;{author.first_name}
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
                      />
                    </div>
                  </div>
                  {author2.isNew && author2.lastName && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <Plus className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        Se creará un nuevo autor: {author2.firstName} {author2.lastName}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Publisher */}
            <div className="space-y-2">
              <Label htmlFor="publisher" className="text-sm font-medium flex items-center gap-2">
                <LibraryBig className="h-4 w-4" />
                Editorial <span className="text-destructive">*</span>
              </Label>
              <Popover open={publisherPopoverOpen} onOpenChange={setPublisherPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={publisherPopoverOpen}
                    className={cn(
                      "w-full justify-between font-normal",
                      !publisher.name && "text-muted-foreground"
                    )}
                  >
                    {publisher.name || "Comienza a escribir..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    backdropFilter: 'none'
                  }}
                >
                  <Command style={{ backgroundColor: 'hsl(var(--popover))' }}>
                    <CommandInput
                      placeholder="Buscar editorial..."
                      value={publisherSearchTerm}
                      onValueChange={handlePublisherSearchChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {publisher.name && publisher.isNew ? (
                          <div className="flex items-center gap-2 p-2 text-sm text-red-600">
                            <Plus className="h-4 w-4" />
                            Se creará una nueva editorial
                          </div>
                        ) : (
                          "No se encontraron editoriales"
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredPublishers.map((pub) => (
                          <CommandItem
                            key={pub.id}
                            value={pub.name}
                            onSelect={() => handlePublisherSelect(pub)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                publisher.id === pub.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {pub.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {publisher.isNew && publisher.name && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <Plus className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    Se creará una nueva editorial: {publisher.name}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                name="categoryId"
                value={categoryId}
                onValueChange={setCategoryId}
                required
              >
                <SelectTrigger className={cn(!categoryId && "text-muted-foreground")}>
                  <SelectValue placeholder="Selecciona..." />
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
                value={locationId || ""}
                onValueChange={setLocationId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación..." />
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
                className='cursor-pointer'
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex items-center gap-2 cursor-pointer" variant='outline'>
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
