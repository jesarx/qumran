// Update this in: app/dashboard/authors/page.tsx

import { getAuthorsAction } from '@/lib/actions';
import AuthorsTable from '@/components/authors-table';
import AuthorsFilters from '@/components/authors-filters';
import PaginationComp from '@/components/pagination';

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
  const page = parseInt(searchParams?.page || '1');

  const authorsData = await getAuthorsAction(name, sort, page);
  const { authors, total, totalPages } = authorsData;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Autores</h1>
          <p className="text-muted-foreground mt-2">
            {total} {total === 1 ? 'autor' : 'autores'} en total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <AuthorsFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <AuthorsTable authors={authors} showActions={true} />

        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationComp
              metadata={{
                current_page: page,
                page_size: authors.length,
                first_page: 1,
                last_page: totalPages,
                total_records: total,
              }}
              object="autores"
            />
          </div>
        )}
      </div>
    </div>
  );
}
