import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Book } from "@/lib/definitions"
import { fetchLatestBooks } from "@/lib/data";
import PaginationComp from "@/components/pagination";
import Link from "next/link";
import Orderby from "@/components/order-by";

export default async function LatestBooksCards({
  title,
  authslug,
  pubslug,
  tags,
  currentPage,
  sort,
}: {
  title: string;
  authslug: string;
  pubslug: string;
  tags: string;
  currentPage: number;
  sort: string;
}) {

  const { books: latestBooks, metadata } = await fetchLatestBooks({ title: title, authslug: authslug, pubslug: pubslug, tags: tags, page: currentPage, sort: sort });
  currentPage = metadata.current_page;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-3 border-b-1 pb-2">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Libros
          {authslug !== '' && (
            <> de {latestBooks[0].author_name} {latestBooks[0].author_last_name}</>
          )}
          {pubslug !== '' && (
            <> de {pubslug.charAt(0).toUpperCase() + pubslug.slice(1)}</>
          )}
        </h1>
        <Orderby />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {latestBooks.map((book: Book, i: number) => (
          <Card key={i} className="w-64 flex flex-col min-h-[200px] justify-between">
            <CardHeader>
              <Link href={`/books/${book.slug}`}>
                <Image
                  src={`${API_URL}/images?file=${book.filename}.jpg`}
                  alt={`Book cover of ${book.title}`}
                  width={200}
                  height={200}
                  className="w-full rounded-md"
                />
              </Link>

            </CardHeader>
            <CardContent>
              <CardTitle className="mb-2"><Link
                href={`/books/${book.slug}`}
                className="hover:underline"
              >{book.title}
              </Link>
              </CardTitle>
              <CardDescription className="mb-2">
                <Link
                  href={`/authors/${book.author_slug}`}
                  className="hover:underline"
                >
                  {book.author_name && <> {book.author_name} {" "}</>}
                  {book.author_last_name}
                </Link>
              </CardDescription>
              <div className="border-t-1">
                {book.tags.map((tag, index) => (
                  <span key={tag}>
                    <Link
                      href={`/books?tags=${encodeURIComponent(tag)}`}
                      className="font-light pt-2 text-sm hover:underline"
                    >
                      {tag}
                    </Link>
                    {index < book.tags.length - 1 && <span className="font-light text-sm">, </span>}
                  </span>
                ))}

              </div>
            </CardContent>
          </Card>
        ))}</div>
      <PaginationComp metadata={metadata} object="libros" />
    </div>
  );
} 
