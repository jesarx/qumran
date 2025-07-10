
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tags } from "@/lib/definitions"

import { fetchTags } from "@/lib/data";
import Link from "next/link";


export default async function TagsTable() {
  const { tags } = await fetchTags();
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Libros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag: Tags, i: number) => (
            <TableRow key={i}>
              <TableCell>
                <Link href={'/books?tags=' + tag.name}>
                  {tag.name}
                </Link>
              </TableCell>
              <TableCell>
                {tag.books}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
