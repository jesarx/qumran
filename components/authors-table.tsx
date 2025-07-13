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
  // Ensure authors is always an array
  const authorsList = Array.isArray(authors) ? authors : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Número de Libros</TableHead>
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {authorsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 3 : 2} className="text-center">
              No se encontraron autores
            </TableCell>
          </TableRow>
        ) : (
          authorsList.map((author) => (
            <TableRow key={author.id}>
              <TableCell className="font-medium">
                {author.first_name} {author.last_name}
              </TableCell>
              <TableCell>{author.book_count || 0}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Link href={`/dashboard/authors/${author.id}`}>
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
