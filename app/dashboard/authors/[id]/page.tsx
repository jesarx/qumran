import EditAuthorForm from '@/components/edit-author-form';

export default function EditAuthorPage({ params }: { params: { slug: string } }) {
  const authorId = parseInt(params.slug);

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
