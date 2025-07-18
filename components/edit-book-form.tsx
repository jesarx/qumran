'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateBookAction,
  deleteBookAction,
  getBookAction,
  getCategoriesAction,
  getLocationsAction,
  getPublishersAction
} from '@/lib/actions';
import { Book, Category, Location, Publisher } from '@/lib/queries';
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
import { Trash2, Save, ArrowLeft, User, MapPin, Check, ChevronsUpDown, Plus, LayoutList, LibraryBig } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

const initialState = {
  success: false,
  error: undefined
};

interface PublisherData {
  name: string;
  id?: number;
  isNew?: boolean;
}

export default function EditBookForm({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateBookAction, initialState);
  const [book, setBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');

  // Publisher field with popover state
  const [publisher, setPublisher] = useState<PublisherData>({ name: '' });
  const [publisherPopoverOpen, setPublisherPopoverOpen] = useState(false);
  const [publisherSearchTerm, setPublisherSearchTerm] = useState('');
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);

  // Debounced search function for publishers
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

  // Load book, categories, locations, and publishers
  useEffect(() => {
    async function loadData() {
      try {
        const [bookData, cats, locs, pubs] = await Promise.all([
          getBookAction(bookId),
          getCategoriesAction(),
          getLocationsAction(),
          getPublishersAction()
        ]);

        if (bookData) {
          setBook(bookData);
          // Set form fields with current book data
          setTitle(bookData.title);
          setIsbn(bookData.isbn || '');
          setCategoryId(bookData.category_id.toString());
          setLocationId(bookData.location_id?.toString() || '');

          // Set publisher data
          setPublisher({
            name: bookData.publisher_name || '',
            id: bookData.publisher_id,
            isNew: false
          });
          setPublisherSearchTerm(bookData.publisher_name || '');
        } else {
          router.push('/dashboard/books');
        }

        setCategories(cats);
        setLocations(locs);
        setPublishers(pubs.publishers);
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

  // Handle publisher search term changes
  useEffect(() => {
    debouncedPublisherSearch(publisherSearchTerm);
  }, [publisherSearchTerm, debouncedPublisherSearch]);

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

  // Handle manual publisher input
  const handlePublisherSearchChange = (value: string) => {
    setPublisherSearchTerm(value);
    if (value.trim()) {
      // Check if the value matches an existing publisher
      const existingPublisher = publishers.find(p =>
        p.name.toLowerCase() === value.trim().toLowerCase()
      );

      if (existingPublisher) {
        setPublisher({
          name: existingPublisher.name,
          id: existingPublisher.id,
          isNew: false
        });
      } else {
        setPublisher({
          name: value.trim(),
          id: undefined,
          isNew: true
        });
      }
    } else {
      setPublisher({ name: '' });
    }
  };

  // Custom form submission to handle publisher data
  const handleSubmit = async (formData: FormData) => {
    // Debug: Log current state
    console.log('Form submission - Current state:', {
      title,
      isbn,
      publisher,
      categoryId,
      locationId,
      bookId
    });

    // Validate required fields before submission
    if (!title.trim()) {
      alert('El título es requerido');
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
    formData.set('id', bookId.toString());
    formData.set('title', title.trim());
    formData.set('isbn', isbn.trim() || '');
    formData.set('publisherName', publisher.name.trim());
    formData.set('categoryId', categoryId.toString());
    formData.set('locationId', locationId.toString());

    // Debug: Log final FormData
    console.log('Final FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value, `(type: ${typeof value})`);
    }

    return formAction(formData);
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

          <form action={handleSubmit} className="space-y-6">
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
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                    {publisher.name || "Selecciona una editorial..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" style={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}>
                  <Command style={{ backgroundColor: 'hsl(var(--popover))' }}>
                    <CommandInput
                      placeholder="Buscar editorial..."
                      value={publisherSearchTerm}
                      onValueChange={handlePublisherSearchChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {publisher.name && publisher.isNew ? (
                          <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
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
                <Alert>
                  <Plus className="h-4 w-4" />
                  <AlertDescription>
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
            <div className="flex justify-between items-center pt-6 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Eliminando...' : 'Eliminar Libro'}
              </Button>

              <div className="flex gap-3">
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
