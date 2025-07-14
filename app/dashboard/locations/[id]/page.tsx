import EditLocationForm from '@/components/edit-location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const locationId = parseInt(params.id);

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
