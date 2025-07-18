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
import { Location } from "@/lib/queries";

interface LocationsTableProps {
  locations: Location[];
  showActions?: boolean;
}

export default function LocationsTable({ locations = [], showActions = false }: LocationsTableProps) {
  const locationsList = Array.isArray(locations) ? locations : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-black">Nombre</TableHead>
          <TableHead className="font-black">Número de Libros</TableHead>
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {locationsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 3 : 2} className="text-center">
              No se encontraron ubicaciones
            </TableCell>
          </TableRow>
        ) : (
          locationsList.map((location) => (
            <TableRow key={location.id}>
              <TableCell>
                {showActions ? (
                  <Link
                    href={`/dashboard/books?locationSlug=${location.slug}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    {location.name}
                  </Link>
                ) : (
                  <Link
                    href={`/books?locationSlug=${location.slug}`}
                    className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors"
                  >
                    {location.name}
                  </Link>
                )}

              </TableCell>
              <TableCell>{location.book_count || 0}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Link href={`/dashboard/locations/${location.id}`}>
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

