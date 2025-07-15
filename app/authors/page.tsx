import { getAuthorsAction } from '@/lib/actions';
import AuthorsTable from '@/components/authors-table';
import AuthorsFilters from '@/components/authors-filters';

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  const name = typeof params.name === 'string' ? params.name : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';

  const authors = await getAuthorsAction(name, sort);

  console.log('Authors page data:', {
    authorsReceived: Array.isArray(authors),
    count: authors?.length,
    searchTerm: name,
    sortBy: sort
  });

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Autores</h1>
        <p className="text-muted-foreground mb-4">
          {authors.length} {authors.length === 1 ? 'autor' : 'autores'} en total
        </p>
        <AuthorsFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <AuthorsTable authors={authors || []} showActions={false} />
      </div>
    </div>
  );
}
