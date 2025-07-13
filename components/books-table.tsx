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

export default function BooksTable({ books, showActions = false }: BooksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Autor(es)</TableHead>
          <TableHead>Editorial</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>ISBN</TableHead>
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center">
              No se encontraron libros
            </TableCell>
          </TableRow>
        ) : (
          books.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium">{book.title}</TableCell>
              <TableCell>
                {book.author1_first_name} {book.author1_last_name}
                {book.author2_last_name && (
                  <>
                    <br />
                    {book.author2_first_name} {book.author2_last_name}
                  </>
                )}
              </TableCell>
              <TableCell>{book.publisher_name}</TableCell>
              <TableCell>{book.category_name}</TableCell>
              <TableCell className="text-sm">{book.isbn || '-'}</TableCell>
              {showActions && (
                <TableCell className="text-right">
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
  );
}
