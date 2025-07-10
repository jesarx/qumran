"use client";
import { Input } from "./ui/input"
import { SearchIcon } from "lucide-react"
import { useDebouncedCallback } from 'use-debounce';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();


  type SearchConfig = {
    placeholder: string;
    param: string;
  };

  // Define configurations for different pages
  const searchConfigs: Record<string, SearchConfig> = {
    '/authors': { placeholder: 'Buscar autores', param: 'name' },
    '/publishers': { placeholder: 'Buscar editoriales', param: 'name' },
    '/books': { placeholder: 'Buscar libros por título', param: 'title' },
    '/dashboard/authors': { placeholder: 'Buscar autores', param: 'name' },
    '/dashboard/publishers': { placeholder: 'Buscar editoriales', param: 'name' },
    '/dashboard/books': { placeholder: 'Buscar libros por título', param: 'title' },
    // Default configuration
    default: { placeholder: 'Buscar', param: 'title' }
  };

  // Get configuration based on current path, or use default
  const config = searchConfigs[pathname] || searchConfigs.default;

  const handleSearch = useDebouncedCallback((term) => {

    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(config.param, term);
    } else {
      params.delete(config.param);
    }
    replace(`${pathname}?${params.toString()}`);
  }, 400);

  return (
    <div className="relative">
      <Input
        className="max-h-40 peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 inset-shadow-sm inset-shadow-red-300 bg-white text-gray-900"
        placeholder={config.placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get(config.param)?.toString()}
      />
      <SearchIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>

  )
}
