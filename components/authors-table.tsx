import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Author } from "@/lib/definitions"

import { fetchAuthors } from "@/lib/data";
import PaginationComp from "./pagination";
import Link from "next/link";


export default async function AuthorsTable({
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
  const { authors: authors, metadata } = await fetchAuthors({ name: name, page: currentPage, sort: sort });
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
          {authors.map((author: Author, i: number) => (
            <TableRow key={i}>
              <TableCell>
                <Link href={'/authors/' + author.slug}>
                  {author.last_name}
                  {author.name && <>, {author.name}</>}
                </Link>
              </TableCell>
              <TableCell>
                {author.books}
              </TableCell>
              {location === "dashboard" && (
                <TableCell className="text-right">
                  <Link href={'/dashboard/authors/' + author.id}>
                    <Button className="text-xs h-6 mr-2 cursor-pointer">Editar</Button>
                  </Link>
                </TableCell>
              )}
            </TableRow>
          ))}

        </TableBody>
      </Table>

      <PaginationComp metadata={metadata} object="autores" />
    </div>
  );
}

