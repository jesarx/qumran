import Image from 'next/image';
import { Book } from '@/lib/definitions';
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import EditButton from '@/components/edit-button';

import { auth } from "@/auth"
import Link from 'next/link';
import CopyButton from './copy-url';


interface BookDetailsProps {
  book: Book;
}
export default async function BookDetails({ book }: BookDetailsProps) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  const API_URL = process.env.NEXT_PUBLIC_API_URL;


  return (
    < div className="w-3/4 mx-auto bg-white rounded-lg shadow-md overflow-hidden my-8">

      <div className="md:flex ">
        {/* Book Cover */}
        <div className="md:flex-shrink-0 bg-gray-50 flex items-start justify-center p-6">
          <div className="relative w-60 shadow-lg">
            <Image
              src={`${API_URL}/images?file=${book.filename}.jpg`}
              alt={`${book.title} cover`}
              className="rounded"
              priority
              width={300}
              height={100}
            />
          </div>
        </div>

        {/* Book Details */}
        <div className="p-8 w-full">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h1>
              <p className="text-gray-600 mb-6">
                de <span className="font-semibold">
                  <Link
                    href={`/authors/${book.author_slug}`}
                    className="hover:underline text-blue-600"
                  >
                    {book.author_name && <> {book.author_name} </>}
                    {book.author_last_name}
                  </Link>
                </span>

                {book.author2_name && book.author2_last_name &&
                  <span> | <span className="font-semibold">
                    <Link
                      href={`/authors/${book.author2_slug}`}
                      className="hover:underline text-blue-600"
                    >
                      {book.author2_name && <> {book.author2_name} </>}
                      {book.author2_last_name}
                    </Link>
                  </span></span>
                }
              </p>

              <div className="prose prose-sm mb-6">
                <p className="text-gray-700 whitespace-pre-line">{book.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                <div>
                  <span className="block text-gray-500">Editorial</span>
                  <span className="font-mono text-xs">
                    <Link
                      href={'/publishers/' + book.publisher_slug}
                      className="font-mono text-xs hover:underline text-blue-600"
                    >
                      {book.publisher_name}
                    </Link>
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">Año</span>
                  <span className="font-medium">{book.year}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Páginas</span>
                  <span className="font-medium">{book.pages}</span>
                </div>
                <div>
                  <span className="block text-gray-500">ISBN</span>
                  <span className="font-mono text-xs">{book.isbn}</span>
                </div>
                <div className='col-span-2'>
                  <span className="block text-gray-500">Etiquetas</span>
                  <div className="flex flex-wrap gap-1">
                    {book.tags.map((tag, index) => (
                      <span key={tag}>
                        <Link
                          href={`/books?tags=${encodeURIComponent(tag)}`}
                          className="font-mono text-xs hover:underline text-blue-600"
                        >
                          {tag}
                        </Link>
                        {index < book.tags.length - 1 && <span className="font-mono text-xs">, </span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>


              <div className="flex flex-col space-y-6 w-full">
                {/* Other links */}
                <div className="border rounded-lg p-4 shadow-sm">
                  {isAuthenticated && <EditButton href={book.slug} />}
                  <a href={book.external_link} target='_blank'>
                    <Button className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base mt-2 cursor-pointer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Liga externa
                    </Button>
                  </a>
                  <CopyButton />
                </div>

                {/* PDF Original Section */}
                <div className="border rounded-lg p-4 shadow-sm">
                  <p className="text-center font-bold text-lg mb-4">PDF original</p>
                  <div className="grid gap-4">
                    {/* Direct Download PDF */}
                    {book.dir_dwl &&
                      <a href={`${API_URL}/pdfs?file=${book.filename}.pdf`} target="_blank" className="block">
                        <Button className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base cursor-pointer">
                          <Download className="mr-2 h-4 w-4" />
                          Descarga directa
                        </Button>
                      </a>
                    }
                    {/* Torrent Download PDF */}
                    <a href={`${API_URL}/torrs?file=${book.filename}.pdf.torrent`} target="_blank" className="block">
                      <Button className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base cursor-pointer">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar torrent
                      </Button>
                    </a>
                    {/* IPFS Download */}
                    <a href={`https://ipfs.io/ipfs/${book.cid}`} target="_blank" className="block">
                      <Button className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base cursor-pointer">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar IPFS
                      </Button>
                    </a>
                  </div>
                </div>

              </div>


            </div>
          </div>
        </div>
      </div>
    </div >


  );
};


