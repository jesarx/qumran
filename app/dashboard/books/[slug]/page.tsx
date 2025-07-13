import EditBookForm from '@/components/edit-book-form';

export default function EditBookPage({ params }: { params: { slug: string } }) {
  const bookId = parseInt(params.slug);

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
