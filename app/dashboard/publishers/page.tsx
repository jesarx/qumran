// Update this in: app/dashboard/publishers/page.tsx

import { getPublishersAction } from '@/lib/actions';
import PublishersTable from '@/components/publishers-table';
import PublishersFilters from '@/components/publishers-filters';
import PaginationComp from '@/components/pagination';

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
  const page = parseInt(searchParams?.page || '1');

  const publishersData = await getPublishersAction(name, sort, page);
  const { publishers, total, totalPages } = publishersData;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Editoriales</h1>
          <p className="text-muted-foreground mt-2">
            {total} {total === 1 ? 'editorial' : 'editoriales'} en total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <PublishersFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <PublishersTable publishers={publishers} showActions={true} />

        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationComp
              metadata={{
                current_page: page,
                page_size: publishers.length,
                first_page: 1,
                last_page: totalPages,
                total_records: total,
              }}
              object="editoriales"
            />
          </div>
        )}
      </div>
    </div>
  );
}
