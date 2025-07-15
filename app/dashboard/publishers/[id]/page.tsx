import EditPublisherForm from '@/components/edit-publisher-form';

export default async function EditPublisherPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const publisherId = parseInt(resolvedParams.id);

  if (isNaN(publisherId)) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-600">ID de editorial inválido</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EditPublisherForm publisherId={publisherId} />
    </div>
  );
}
