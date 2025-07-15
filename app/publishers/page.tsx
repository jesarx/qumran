import { getPublishersAction } from '@/lib/actions';
import PublishersTable from '@/components/publishers-table';
import PublishersFilters from '@/components/publishers-filters';

export default async function PublishersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  const name = typeof params.name === 'string' ? params.name : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';

  const publishers = await getPublishersAction(name, sort);

  console.log('Publishers page data:', {
    publishersReceived: Array.isArray(publishers),
    count: publishers?.length,
    searchTerm: name,
    sortBy: sort
  });

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Editoriales</h1>
        <p className="text-muted-foreground mb-4">
          {publishers.length} {publishers.length === 1 ? 'editorial' : 'editoriales'} en total
        </p>
        <PublishersFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <PublishersTable publishers={publishers || []} />
      </div>
    </div>
  );
}
