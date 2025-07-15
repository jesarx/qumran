// Update this in: components/locations-table.tsx

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
  // Ensure locations is always an array
  const locationsList = Array.isArray(locations) ? locations : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Número de Libros</TableHead>
          <TableHead>Ver Libros</TableHead>
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {locationsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 4 : 3} className="text-center">
              No se encontraron ubicaciones
            </TableCell>
          </TableRow>
        ) : (
          locationsList.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell>{location.book_count || 0}</TableCell>
              <TableCell>
                <Link
                  href={`/books?locationSlug=${location.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  Ver libros →
                </Link>
              </TableCell>
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
