import EditPublisherForm from '@/components/edit-publisher-form';

export default function EditPublisherPage({ params }: { params: { slug: string } }) {
  const publisherId = parseInt(params.slug);

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
