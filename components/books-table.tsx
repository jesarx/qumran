import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Book, BookScanStatus } from "@/lib/queries";

interface BooksTableProps {
  books: Book[];
  showActions?: boolean;
}

// Traffic-light indicator for the "Escaneado?" column:
//   done           -> verde
//   pending        -> amarillo
//   not_applicable -> gris
const SCAN_STATUS_META: Record<BookScanStatus, { color: string; label: string }> = {
  done: { color: "bg-green-500", label: "Escaneado" },
  pending: { color: "bg-yellow-400", label: "Pendiente" },
  not_applicable: { color: "bg-gray-400", label: "No aplica" },
};

function ScanStatusDot({ status }: { status?: BookScanStatus }) {
  const meta = SCAN_STATUS_META[status ?? "not_applicable"] ?? SCAN_STATUS_META.not_applicable;
  return (
    <span className="inline-flex items-center gap-1.5" title={meta.label} aria-label={meta.label}>
      <span className={`inline-block h-3 w-3 rounded-full ${meta.color}`} />
    </span>
  );
}

// Function to format date compactly
function formatCompactDate(date: Date): string {
  const now = new Date();
  const bookDate = new Date(date);

  // Calculate days difference
  const diffTime = now.getTime() - bookDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If today, show "Hoy"
  if (diffDays === 0) {
    return "Hoy";
  }

  // If yesterday, show "Ayer"
  if (diffDays === 1) {
    return "Ayer";
  }

  // If within last 7 days, show "Hace X días"
  if (diffDays <= 7) {
    return `${diffDays}d`;
  }

  // If within current year, show "DD/MM"
  if (bookDate.getFullYear() === now.getFullYear()) {
    return `${bookDate.getDate().toString().padStart(2, '0')}/${(bookDate.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Otherwise show "DD/MM/YY"
  const year = bookDate.getFullYear().toString().slice(-2);
  return `${bookDate.getDate().toString().padStart(2, '0')}/${(bookDate.getMonth() + 1).toString().padStart(2, '0')}/${year}`;
}

export default function BooksTable({ books, showActions = false }: BooksTableProps) {
  // In the dashboard the title opens the edit form; in the public catalog it
  // opens the individual book page. Filter links (author/publisher/category/
  // location) stay within the current section.
  const basePath = showActions ? '/dashboard/books' : '/books';
  const linkClass = "font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer";

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Mobile-only header */}
            <TableHead className="font-black block sm:hidden">Libro</TableHead>

            {/* Full headers for larger screens */}
            <TableHead className="font-black hidden sm:table-cell">Título</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Autor(xs)</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Editorial</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Categoría</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Ubicación</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Agregado</TableHead>
            <TableHead className="font-black hidden sm:table-cell text-center">Escaneado?</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {books.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No se encontraron libros
              </TableCell>
            </TableRow>
          ) : (
            books.map((book) => {
              const detailHref = `${basePath}/${book.id}`;
              return (
              <TableRow key={book.id}>
                {/* Mobile-only cell */}
                <TableCell className="block sm:hidden py-4">
                  <div className="flex items-center gap-2">
                    <ScanStatusDot status={book.scanned} />
                    <div className="font-semibold text-sm truncate max-w-[240px]">
                      <Link
                        href={detailHref}
                        className={linkClass}
                        title={showActions ? "Editar" : "Ver libro"}
                      >
                        {book.title}
                      </Link>
                    </div>
                  </div>
                  <div className="text-xs mt-1">
                    {book.author1_slug ? (
                      <Link href={`${basePath}?authorSlug=${book.author1_slug}`} className={linkClass}>
                        {book.author1_last_name}
                        {book.author1_first_name && `, ${book.author1_first_name}`}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {book.author1_last_name}
                        {book.author1_first_name && `, ${book.author1_first_name}`}
                      </span>
                    )}
                    {book.author2_last_name && (
                      <>
                        <br />
                        {book.author2_slug ? (
                          <Link
                            href={`${basePath}?authorSlug=${book.author2_slug}`}
                            className="text-muted-foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer"
                          >
                            {book.author2_last_name}
                            {book.author2_first_name && `, ${book.author2_first_name}`}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            {book.author2_last_name}
                            {book.author2_first_name && `, ${book.author2_first_name}`}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>

                {/* Full table for larger screens */}
                <TableCell className="font-medium hidden sm:table-cell">
                  <div className="max-w-[450px] truncate">
                    <Link
                      href={detailHref}
                      className={linkClass}
                      title={showActions ? `Editar: ${book.title}` : book.title}
                    >
                      {book.title}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {book.author1_slug ? (
                    <Link href={`${basePath}?authorSlug=${book.author1_slug}`} className={linkClass}>
                      {book.author1_last_name}
                      {book.author1_first_name && `, ${book.author1_first_name}`}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {book.author1_last_name}
                      {book.author1_first_name && `, ${book.author1_first_name}`}
                    </span>
                  )}
                  {book.author2_last_name && (
                    <>
                      <br />
                      {book.author2_slug ? (
                        <Link
                          href={`${basePath}?authorSlug=${book.author2_slug}`}
                          className="text-muted-foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer"
                        >
                          {book.author2_last_name}
                          {book.author2_first_name && `, ${book.author2_first_name}`}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {book.author2_last_name}
                          {book.author2_first_name && `, ${book.author2_first_name}`}
                        </span>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {book.publisher_slug ? (
                    <Link href={`${basePath}?publisherSlug=${book.publisher_slug}`} className={linkClass}>
                      {book.publisher_name}
                    </Link>
                  ) : (
                    book.publisher_name
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {book.category_slug ? (
                    <Link href={`${basePath}?categorySlug=${book.category_slug}`} className={linkClass}>
                      {book.category_name}
                    </Link>
                  ) : (
                    book.category_name
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {book.location_slug ? (
                    <Link href={`${basePath}?locationSlug=${book.location_slug}`} className={linkClass}>
                      {book.location_name || 'Sin ubicación'}
                    </Link>
                  ) : (
                    book.location_name || 'Sin ubicación'
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                  {formatCompactDate(book.created_at)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  <ScanStatusDot status={book.scanned} />
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
