import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Book } from "@/lib/definitions"
import Link from "next/link"

import { fetchLatestBooks } from "@/lib/data";
import Image from "next/image";
import PaginationComp from "./pagination";


export default async function BooksTableDashboard({
  title,
  currentPage,
}: {
  title: string;
  currentPage: number;
}) {
  const { books: latestBooks, metadata } = await fetchLatestBooks({ title: title, page: currentPage });
  currentPage = metadata.current_page;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;


  return (
    <div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {latestBooks.map((book: Book, i: number) => (
            <TableRow key={i}>
              <TableCell>
                <HoverCard>
                  <HoverCardTrigger className="cursor-help">{book.title}</HoverCardTrigger>
                  <HoverCardContent>
                    <div className="flex justify-between space-x-4">
                      <Image
                        src={`${API_URL}/images?file=${book.filename}.jpg`}
                        alt={`Book cover of ${book.title}`}
                        width={100}
                        height={100}
                        className="object-contain rounded-md"
                      />
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{book.author_name} {book.author_last_name}</h4>
                        <p className="text-sm">
                          {book.publisher_name}
                        </p>
                        <div className="flex items-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            {book.year}
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/dashboard/books/${book.slug}`}>
                  <Button className="text-xs h-6 mr-2 cursor-pointer">Editar</Button>
                </Link>
              </TableCell>
            </TableRow>

          ))}

        </TableBody>
      </Table>

      <PaginationComp metadata={metadata} object="libros" />
    </div>
  );
} 
