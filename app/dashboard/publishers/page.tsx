import { getPublishersAction } from '@/lib/actions';
import PublishersTable from '@/components/publishers-table';
import PublishersFilters from '@/components/publishers-filters';

export default async function DashboardPublishersPage(
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

  const publishers = await getPublishersAction(name, sort);

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
        <PublishersFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <PublishersTable publishers={publishers} showActions={true} />
      </div>
    </div>
  );
}
