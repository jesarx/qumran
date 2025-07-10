import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Publisher } from "@/lib/definitions"

import { fetchPublishers } from "@/lib/data";
import PaginationComp from "./pagination";
import Link from "next/link";


export default async function PublishersTable({
  name,
  currentPage,
  sort,
  location,
}: {
  name: string;
  currentPage: number;
  sort: string;
  location: string;
}) {
  const { publishers: publishers, metadata } = await fetchPublishers({ name: name, page: currentPage, sort: sort, });
  currentPage = metadata.current_page;

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Libros</TableHead>
            {location === "dashboard" && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {publishers.map((publisher: Publisher, i: number) => (
            <TableRow key={i}>
              <TableCell>
                <Link href={'/publishers/' + publisher.slug}>
                  {publisher.name}
                </Link>
              </TableCell>
              <TableCell>
                {publisher.books}
              </TableCell>
              {location === "dashboard" && (
                <TableCell className="text-right">
                  <Link href={`/dashboard/publishers/${publisher.id}`}>
                    <Button className="text-xs h-6 mr-2 cursor-pointer">Editar</Button>
                  </Link>
                </TableCell>
              )}
            </TableRow>

          ))}

        </TableBody>
      </Table>

      <PaginationComp metadata={metadata} object="editoriales" />
    </div>
  );
}


