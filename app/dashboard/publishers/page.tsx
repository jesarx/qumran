import { getPublishersAction } from '@/lib/actions';
import PublishersTable from '@/components/publishers-table';
import SimpleSearch from '@/components/simple-search';

export default async function DashboardPublishersPage(
  props: {
    searchParams?: Promise<{
      name?: string;
      page?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams?.name || '';

  const publishers = await getPublishersAction(name);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Editoriales</h1>
          <p className="text-muted-foreground mt-2">
            {publishers.length} {publishers.length === 1 ? 'editorial' : 'editoriales'} en total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <SimpleSearch placeholder="Buscar por nombre..." />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <PublishersTable publishers={publishers} showActions={true} />
      </div>
    </div>
  );
}
