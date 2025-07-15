import EditAuthorForm from '@/components/edit-author-form';

export default async function EditAuthorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const authorId = parseInt(resolvedParams.id);

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
