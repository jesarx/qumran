import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book } from "@/lib/queries";

interface BooksTableProps {
  books: Book[];
  showActions?: boolean;
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
            <TableHead className="font-black hidden sm:table-cell">ISBN</TableHead>
            <TableHead className="font-black hidden sm:table-cell">Agregado</TableHead>
            {showActions && (
              <TableHead className="text-right hidden sm:table-cell">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {books.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 8 : 7} className="text-center">
                No se encontraron libros
              </TableCell>
            </TableRow>
          ) : (
            books.map((book) => (
              <TableRow key={book.id}>
                {/* Mobile-only cell */}
                <TableCell className="block sm:hidden py-4">
                  <div className="font-semibold text-sm truncate max-w-[260px]">
                    {book.title}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="font-medium">
                      {book.author1_last_name}
                      {book.author1_first_name && `, ${book.author1_first_name}`}
                    </span>
                    {book.author2_last_name && (
                      <>
                        <br />
                        <span className="text-muted-foreground">
                          {book.author2_last_name}
                          {book.author2_first_name && `, ${book.author2_first_name}`}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>

                {/* Full table for larger screens */}
                <TableCell className="font-medium hidden sm:table-cell">
                  {book.title}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="font-medium">
                    {book.author1_last_name}
                    {book.author1_first_name && `, ${book.author1_first_name}`}
                  </span>
                  {book.author2_last_name && (
                    <>
                      <br />
                      <span className="text-muted-foreground">
                        {book.author2_last_name}
                        {book.author2_first_name && `, ${book.author2_first_name}`}
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{book.publisher_name}</TableCell>
                <TableCell className="hidden sm:table-cell">{book.category_name}</TableCell>
                <TableCell className="hidden sm:table-cell">{book.location_name || 'Sin ubicación'}</TableCell>
                <TableCell className="text-sm hidden sm:table-cell">{book.isbn || '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                  {formatCompactDate(book.created_at)}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right hidden sm:table-cell">
                    <Link href={`/dashboard/books/${book.id}`}>
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
