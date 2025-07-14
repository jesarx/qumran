import EditAuthorForm from '@/components/edit-author-form';

export default function EditAuthorPage({ params }: { params: { id: string } }) {
  const authorId = parseInt(params.id); // Changed from params.slug to params.id

  if (isNaN(authorId)) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-600">ID de autor inválido</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EditAuthorForm authorId={authorId} />
    </div>
  );
}
