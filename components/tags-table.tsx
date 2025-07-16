import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Category } from "@/lib/queries";

interface CategoriesTableProps {
  categories: Category[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-black">Nombre</TableHead>
          <TableHead className="font-black">Número de Libros</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <Link
                href={`/books?categorySlug=${category.slug}`}
                className="font-medium text-sm foreground underline hover:decoration-indigo-500 transition-colors"
              >
                {category.name}
              </Link>
            </TableCell>
            <TableCell>{category.book_count || 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

