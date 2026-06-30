import { getBookAction } from '@/lib/actions';
import { BookScanStatus } from '@/lib/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, User, LibraryBig, LayoutList, MapPin, ScanLine, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

const SCAN_STATUS_META: Record<BookScanStatus, { color: string; label: string }> = {
  done: { color: 'bg-green-500', label: 'Escaneado' },
  pending: { color: 'bg-yellow-400', label: 'Pendiente' },
  not_applicable: { color: 'bg-gray-400', label: 'No aplica' },
};

function formatDate(date?: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bookId = parseInt(id);
  if (isNaN(bookId)) return { title: 'Libro no encontrado' };
  const book = await getBookAction(bookId);
  return { title: book ? book.title : 'Libro no encontrado' };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = parseInt(id);
  if (isNaN(bookId)) notFound();

  const book = await getBookAction(bookId);
  if (!book) notFound();

  const scan = SCAN_STATUS_META[book.scanned ?? 'not_applicable'] ?? SCAN_STATUS_META.not_applicable;

  const authorName = (first?: string, last?: string) =>
    `${last || ''}${first ? `, ${first}` : ''}`.trim();

  return (
    <div className="mx-auto max-w-3xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la biblioteca
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-start gap-3 text-2xl">
            <BookOpen className="h-6 w-6 mt-1 shrink-0" />
            <span>{book.title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Authors */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Autor(es)</p>
              <p className="text-base">
                {book.author1_slug ? (
                  <Link href={`/books?authorSlug=${book.author1_slug}`} className="underline hover:decoration-indigo-500">
                    {authorName(book.author1_first_name, book.author1_last_name)}
                  </Link>
                ) : (
                  authorName(book.author1_first_name, book.author1_last_name) || '-'
                )}
                {book.author2_last_name && (
                  <>
                    {'  ·  '}
                    {book.author2_slug ? (
                      <Link href={`/books?authorSlug=${book.author2_slug}`} className="underline hover:decoration-indigo-500">
                        {authorName(book.author2_first_name, book.author2_last_name)}
                      </Link>
                    ) : (
                      authorName(book.author2_first_name, book.author2_last_name)
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Publisher */}
          <div className="flex items-start gap-3">
            <LibraryBig className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editorial</p>
              <p className="text-base">
                {book.publisher_slug ? (
                  <Link href={`/books?publisherSlug=${book.publisher_slug}`} className="underline hover:decoration-indigo-500">
                    {book.publisher_name}
                  </Link>
                ) : (
                  book.publisher_name || '-'
                )}
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <LayoutList className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoría</p>
              <p className="text-base">
                {book.category_slug ? (
                  <Link href={`/books?categorySlug=${book.category_slug}`} className="underline hover:decoration-indigo-500">
                    {book.category_name}
                  </Link>
                ) : (
                  book.category_name || '-'
                )}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ubicación</p>
              <p className="text-base">
                {book.location_slug ? (
                  <Link href={`/books?locationSlug=${book.location_slug}`} className="underline hover:decoration-indigo-500">
                    {book.location_name || 'Sin ubicación'}
                  </Link>
                ) : (
                  book.location_name || 'Sin ubicación'
                )}
              </p>
            </div>
          </div>

          {/* ISBN */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ISBN</p>
              <p className="text-base font-mono">{book.isbn || '-'}</p>
            </div>
          </div>

          {/* Scanned status */}
          <div className="flex items-start gap-3">
            <ScanLine className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escaneado?</p>
              <p className="text-base inline-flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${scan.color}`} />
                {scan.label}
              </p>
            </div>
          </div>

          {/* Added date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agregado</p>
              <p className="text-base">{formatDate(book.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
