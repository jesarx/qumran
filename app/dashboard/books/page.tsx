import { getBooksAction, getCategoriesAction } from '@/lib/actions';
import BooksTable from '@/components/books-table';
import BookFilters from '@/components/book-filters';
import PaginationComp from '@/components/pagination';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

export default async function DashboardBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const title = typeof params.title === 'string' ? params.title : '';
  const search = typeof params.search === 'string' ? params.search : '';
  const categorySlug = typeof params.categorySlug === 'string' ? params.categorySlug : '';
  const authorSlug = typeof params.authorSlug === 'string' ? params.authorSlug : '';
  const publisherSlug = typeof params.publisherSlug === 'string' ? params.publisherSlug : '';
  const locationSlug = typeof params.locationSlug === 'string' ? params.locationSlug : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  const [booksData, categories] = await Promise.all([
    getBooksAction({
      title,
      search, // Add the new search parameter
      categorySlug,
      authorSlug,
      publisherSlug,
      locationSlug,
      sort: sort as 'title' | '-title' | 'author' | '-author' | 'created_at' | '-created_at' | undefined,
      page,
      limit: 20,
    }),
    getCategoriesAction(),
  ]);

  const { books, total, totalPages } = booksData;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Libros</h1>
          <p className="text-muted-foreground mt-2">
            {total} {total === 1 ? 'libro' : 'libros'} en total
          </p>
        </div>
        <Link href="/dashboard/books/new">
          <Button className='cursor-pointer' variant="outline">
            <PlusIcon className="mr-2 h-4 w-4" />
            Agregar libro
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <BookFilters categories={categories} />

        <BooksTable books={books} showActions={true} />

        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationComp
              metadata={{
                current_page: page,
                page_size: books.length,
                first_page: 1,
                last_page: totalPages,
                total_records: total,
              }}
              object="libros"
            />
          </div>
        )}
      </div>
    </div>
  );
}
