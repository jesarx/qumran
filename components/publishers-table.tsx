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
import { Publisher } from "@/lib/queries";

interface PublishersTableProps {
  publishers: Publisher[];
  showActions?: boolean;
}

export default function PublishersTable({ publishers = [], showActions = false }: PublishersTableProps) {
  const publishersList = Array.isArray(publishers) ? publishers : [];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-black">Nombre</TableHead>
          <TableHead className="font-black">Número de Libros</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {publishersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              No se encontraron editoriales
            </TableCell>
          </TableRow>
        ) : (
          publishersList.map((publisher) => (
            <TableRow key={publisher.id}>
              <TableCell>
                {showActions ? (
                  <Link
                    href={`/dashboard/publishers/${publisher.id}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    {publisher.name}
                  </Link>
                ) : (
                  <Link
                    href={`/books?publisherSlug=${publisher.slug}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors"
                  >
                    {publisher.name}
                  </Link>
                )}
              </TableCell>
              <TableCell>{publisher.book_count || 0}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
