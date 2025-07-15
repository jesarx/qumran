import { getBooksAction, getCategoriesAction } from '@/lib/actions';
import BooksTable from '@/components/books-table';
import BookFilters from '@/components/book-filters';
import PaginationComp from '@/components/pagination';

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const title = typeof params.title === 'string' ? params.title : '';
  const categorySlug = typeof params.categorySlug === 'string' ? params.categorySlug : '';
  const authorSlug = typeof params.authorSlug === 'string' ? params.authorSlug : '';
  const publisherSlug = typeof params.publisherSlug === 'string' ? params.publisherSlug : '';
  const locationSlug = typeof params.locationSlug === 'string' ? params.locationSlug : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  console.log('Books page params:', {
    title,
    categorySlug,
    authorSlug,
    publisherSlug,
    locationSlug,
    sort,
    page
  });

  const [booksData, categories] = await Promise.all([
    getBooksAction({
      title,
      categorySlug,
      authorSlug,
      publisherSlug,
      locationSlug,
      sort: sort as any,
      page,
      limit: 20,
    }),
    getCategoriesAction(),
  ]);

  const { books, total, totalPages } = booksData;

  console.log('Books page results:', {
    totalBooks: total,
    booksDisplayed: books.length,
    currentPage: page,
    totalPages
  });

  return (
    <div className="mx-auto max-w-7xl p-4 bg-background min-h-screen min-w-3/4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Biblioteca</h1>
        <p className="text-muted-foreground mt-2">
          {total} {total === 1 ? 'libro' : 'libros'} en total
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <BookFilters categories={categories} />

        <BooksTable books={books} />

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
