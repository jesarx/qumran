import { getCategoriesAction } from '@/lib/actions';
import CategoriesTable from '@/components/tags-table';

export default async function CategoriesPage() {
  const categories = await getCategoriesAction();

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
        <p className="text-muted-foreground mt-2">
          Explora los libros por categoría
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <CategoriesTable categories={categories} />
      </div>
    </div>
  );
}
