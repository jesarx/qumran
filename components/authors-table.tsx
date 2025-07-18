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
import { Author } from "@/lib/queries";

interface AuthorsTableProps {
  authors: Author[];
  showActions?: boolean;
}

export default function AuthorsTable({ authors = [], showActions = false }: AuthorsTableProps) {
  const authorsList = Array.isArray(authors) ? authors : [];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-black">Nombre Completo</TableHead>
          <TableHead className="font-black">Número de Libros</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {authorsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              No se encontraron autores
            </TableCell>
          </TableRow>
        ) : (
          authorsList.map((author) => (
            <TableRow key={author.id}>
              <TableCell>
                {showActions ? (
                  <Link
                    href={`/dashboard/authors/${author.id}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    {author.last_name}
                    {author.first_name && `, ${author.first_name}`}
                  </Link>
                ) : (
                  <Link
                    href={`/books?authorSlug=${author.slug}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors"
                  >
                    {author.last_name}
                    {author.first_name && `, ${author.first_name}`}
                  </Link>
                )}
              </TableCell>
              <TableCell>{author.book_count || 0}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
