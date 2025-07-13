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
import { Category } from '@/lib/queries';
import { useDebouncedCallback } from 'use-debounce';

interface BookFiltersProps {
  categories: Category[];
}

export default function BookFilters({ categories }: BookFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'default') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="space-y-4 mb-6">
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
          onValueChange={handleSortChange}
          defaultValue={searchParams.get('sort') || 'default'}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Más recientes</SelectItem>
            <SelectItem value="title">Título (A-Z)</SelectItem>
            <SelectItem value="-title">Título (Z-A)</SelectItem>
            <SelectItem value="created_at">Más antiguos</SelectItem>
          </SelectContent>
        </Select>

        {(searchParams.get('title') || searchParams.get('categorySlug') || searchParams.get('sort')) && (
          <Button variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
