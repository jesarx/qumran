import BookDetails from '@/components/book-details';
import { fetchBookBySlug } from '@/lib/data';


export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params object first
  const resolvedParams = await params;
  const bookData = await fetchBookBySlug(resolvedParams.slug);

  return (
    <BookDetails book={bookData} />
  );
}
