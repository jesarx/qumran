'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Category, Location } from '@/lib/queries';
import { useDebouncedCallback } from 'use-debounce';
import { getAuthorsAction, getPublishersAction, getLocationsAction } from '@/lib/actions';

interface BookFiltersProps {
  categories: Category[];
}

export default function BookFilters({ categories }: BookFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authorName, setAuthorName] = useState<string>('');
  const [publisherName, setPublisherName] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);

  // Fetch author, publisher names and locations when slugs are present
  useEffect(() => {
    const authorSlug = searchParams.get('authorSlug');
    const publisherSlug = searchParams.get('publisherSlug');

    const fetchData = async () => {
      // Fetch locations for the dropdown
      try {
        const locs = await getLocationsAction();
        setLocations(locs);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocations([]);
      }

      // Fetch author name
      if (authorSlug) {
        try {
          const authorsData = await getAuthorsAction();
          const author = authorsData.authors.find(a => a.slug === authorSlug);
          if (author) {
            const fullName = author.first_name
              ? `${author.first_name} ${author.last_name}`
              : author.last_name;
            setAuthorName(fullName);
          }
        } catch (error) {
          console.error('Failed to fetch author:', error);
          setAuthorName('');
        }
      } else {
        setAuthorName('');
      }

      // Fetch publisher name
      if (publisherSlug) {
        try {
          const publishersData = await getPublishersAction();
          const publisher = publishersData.publishers.find(p => p.slug === publisherSlug);
          if (publisher) {
            setPublisherName(publisher.name);
          }
        } catch (error) {
          console.error('Failed to fetch publisher:', error);
          setPublisherName('');
        }
      } else {
        setPublisherName('');
      }
    };

    fetchData();
  }, [searchParams]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('title', term);
      params.set('page', '1');
    } else {
      params.delete('title');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('categorySlug', value);
      params.set('page', '1');
    } else {
      params.delete('categorySlug');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLocationChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('locationSlug', value);
      params.set('page', '1');
    } else {
      params.delete('locationSlug');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'author') { // 'author' is now the default
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const clearSpecificFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Check if there are any active filters
  const hasActiveFilters = searchParams.get('title') ||
    searchParams.get('categorySlug') ||
    searchParams.get('locationSlug') ||
    searchParams.get('authorSlug') ||
    searchParams.get('publisherSlug') ||
    searchParams.get('sort');

  // Get filter labels for display
  const getFilterSummary = () => {
    const filters = [];

    if (searchParams.get('title')) {
      filters.push({
        type: 'title',
        label: `Título: "${searchParams.get('title')}"`,
        removable: true
      });
    }

    if (searchParams.get('categorySlug')) {
      const category = categories.find(cat => cat.slug === searchParams.get('categorySlug'));
      if (category) {
        filters.push({
          type: 'categorySlug',
          label: `Categoría: ${category.name}`,
          removable: true
        });
      }
    }

    if (searchParams.get('locationSlug')) {
      const location = locations.find(loc => loc.slug === searchParams.get('locationSlug'));
      if (location) {
        filters.push({
          type: 'locationSlug',
          label: `Ubicación: ${location.name}`,
          removable: true
        });
      }
    }

    if (searchParams.get('authorSlug')) {
      filters.push({
        type: 'authorSlug',
        label: authorName ? `Mostrando libros de ${authorName}` : 'Filtrado por autor',
        removable: true,
        isMain: true
      });
    }

    if (searchParams.get('publisherSlug')) {
      filters.push({
        type: 'publisherSlug',
        label: publisherName ? `Mostrando libros de ${publisherName}` : 'Filtrado por editorial',
        removable: true,
        isMain: true
      });
    }

    return filters;
  };

  const filterSummary = getFilterSummary();
  const mainFilter = filterSummary.find(f => f.isMain);
  const otherFilters = filterSummary.filter(f => !f.isMain);

  return (
    <div className="space-y-4 mb-6">
      {/* Main filter display (author or publisher) */}
      {mainFilter && (
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-primary">
              {mainFilter.label}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearSpecificFilter(mainFilter.type)}
              className="text-xs text-primary hover:bg-primary/20"
            >
              ✕ Quitar filtro
            </Button>
          </div>
        </div>
      )}

      {/* Other active filters */}
      {otherFilters.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Filtros adicionales:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {otherFilters.map((filter) => (
                  <span
                    key={filter.type}
                    className="inline-flex items-center gap-1 bg-background rounded px-2 py-1 text-xs border"
                  >
                    {filter.label}
                    <button
                      onClick={() => clearSpecificFilter(filter.type)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                      title="Quitar filtro"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Limpiar todos
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get('title') || ''}
          />
        </div>

        <Select
          onValueChange={handleCategoryChange}
          defaultValue={searchParams.get('categorySlug') || 'all'}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={handleLocationChange}
          defaultValue={searchParams.get('locationSlug') || 'all'}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Todas las ubicaciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ubicaciones</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.slug}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={handleSortChange}
          defaultValue={searchParams.get('sort') || 'author'}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="author">Por Autor (A-Z)</SelectItem>
            <SelectItem value="-author">Por Autor (Z-A)</SelectItem>
            <SelectItem value="title">Título (A-Z)</SelectItem>
            <SelectItem value="-title">Título (Z-A)</SelectItem>
            <SelectItem value="-created_at">Más recientes</SelectItem>
            <SelectItem value="created_at">Más antiguos</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && !mainFilter && (
          <Button variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
