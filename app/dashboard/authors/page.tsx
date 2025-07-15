import { getAuthorsAction } from '@/lib/actions';
import AuthorsTable from '@/components/authors-table';
import AuthorsFilters from '@/components/authors-filters';

export default async function DashboardAuthorsPage(
  props: {
    searchParams?: Promise<{
      name?: string;
      sort?: string;
      page?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams?.name || '';
  const sort = searchParams?.sort || '';

  const authors = await getAuthorsAction(name, sort);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Autores</h1>
          <p className="text-muted-foreground mt-2">
            {authors.length} {authors.length === 1 ? 'autor' : 'autores'} en total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <AuthorsFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <AuthorsTable authors={authors} showActions={true} />
      </div>
    </div>
  );
}
