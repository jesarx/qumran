'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';

interface SimpleSearchProps {
  placeholder?: string;
  paramName?: string;
}

export default function SimpleSearch({
  placeholder = 'Buscar...',
  paramName = 'name'
}: SimpleSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(paramName, term);
      params.set('page', '1');
    } else {
      params.delete(paramName);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <Input
      placeholder={placeholder}
      onChange={(e) => handleSearch(e.target.value)}
      defaultValue={searchParams.get(paramName) || ''}
      className="max-w-sm"
    />
  );
}
