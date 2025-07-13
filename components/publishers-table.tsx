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
  // Ensure publishers is always an array
  const publishersList = Array.isArray(publishers) ? publishers : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Número de Libros</TableHead>
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {publishersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 3 : 2} className="text-center">
              No se encontraron editoriales
            </TableCell>
          </TableRow>
        ) : (
          publishersList.map((publisher) => (
            <TableRow key={publisher.id}>
              <TableCell className="font-medium">{publisher.name}</TableCell>
              <TableCell>{publisher.book_count || 0}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Link href={`/dashboard/publishers/${publisher.id}`}>
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
