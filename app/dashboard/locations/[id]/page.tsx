import EditLocationForm from '@/components/edit-location-form';

export default async function EditLocationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const locationId = parseInt(resolvedParams.id);

  if (isNaN(locationId)) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-600">ID de ubicación inválido</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EditLocationForm locationId={locationId} />
    </div>
  );
}
