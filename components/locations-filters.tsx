// Save this as: components/locations-filters.tsx

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from 'use-debounce';

export default function LocationsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('name', term);
      params.set('page', '1');
    } else {
      params.delete('name');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'name') { // 'name' is now the default
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  // Check if there are any active filters
  const hasActiveFilters = searchParams.get('name') || searchParams.get('sort');

  // Get filter labels for display
  const getFilterSummary = () => {
    const filters = [];

    if (searchParams.get('name')) {
      filters.push({
        type: 'name',
        label: `Nombre: "${searchParams.get('name')}"`,
        removable: true
      });
    }

    return filters;
  };

  const clearSpecificFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    router.push(`${pathname}?${params.toString()}`);
  };

  const filterSummary = getFilterSummary();

  return (
    <div className="space-y-4 mb-6">
      {/* Active filters display */}
      {filterSummary.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Filtros activos:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {filterSummary.map((filter, index) => (
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
            placeholder="Buscar por nombre..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get('name') || ''}
          />
        </div>

        <Select
          onValueChange={handleSortChange}
          defaultValue={searchParams.get('sort') || 'name'}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre (A-Z)</SelectItem>
            <SelectItem value="-name">Nombre (Z-A)</SelectItem>
            <SelectItem value="book_count">Menos libros</SelectItem>
            <SelectItem value="-book_count">Más libros</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
