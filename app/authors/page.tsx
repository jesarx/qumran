import { getAuthorsAction } from '@/lib/actions';
import AuthorsTable from '@/components/authors-table';
import SimpleSearch from '@/components/simple-search';

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  const name = typeof params.name === 'string' ? params.name : '';

  const authors = await getAuthorsAction(name);

  console.log('Authors page data:', {
    authorsReceived: Array.isArray(authors),
    count: authors?.length
  });

  return (
    <div className="mx-auto max-w-7xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Autores</h1>
        <SimpleSearch placeholder="Buscar por nombre..." />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <AuthorsTable authors={authors || []} showActions={false} />
      </div>
    </div>
  );
}
