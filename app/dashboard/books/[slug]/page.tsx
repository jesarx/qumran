import EditBookForm from '@/components/edit-book-form';

export default async function EditBookPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const bookId = parseInt(resolvedParams.slug);

  if (isNaN(bookId)) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-600">ID de libro inválido</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EditBookForm bookId={bookId} />
    </div>
  );
}
