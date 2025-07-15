// Update this in: app/tags/page.tsx

import { getCategoriesAction } from '@/lib/actions';
import CategoriesTable from '@/components/tags-table';
import CategoriesFilters from '@/components/categories-filters';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  const name = typeof params.name === 'string' ? params.name : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';

  const categories = await getCategoriesAction(name, sort);

  console.log('Categories page data:', {
    categoriesReceived: Array.isArray(categories),
    count: categories?.length,
    searchTerm: name,
    sortBy: sort
  });

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Categorías</h1>
        <p className="text-muted-foreground mb-4">
          {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'} en total
        </p>
        <CategoriesFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <CategoriesTable categories={categories} />
      </div>
    </div>
  );
}
