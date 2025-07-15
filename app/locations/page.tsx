// Save this as: app/locations/page.tsx

import { getLocationsAction } from '@/lib/actions';
import LocationsTable from '@/components/locations-table';
import LocationsFilters from '@/components/locations-filters';

export default async function LocationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  const name = typeof params.name === 'string' ? params.name : '';
  const sort = typeof params.sort === 'string' ? params.sort : '';

  const locations = await getLocationsAction(name, sort);

  console.log('Locations page data:', {
    locationsReceived: Array.isArray(locations),
    count: locations?.length,
    searchTerm: name,
    sortBy: sort
  });

  return (
    <div className="mx-auto max-w-4xl p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Ubicaciones</h1>
        <p className="text-muted-foreground mb-4">
          {locations.length} {locations.length === 1 ? 'ubicación' : 'ubicaciones'} en total
        </p>
        <LocationsFilters />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <LocationsTable locations={locations || []} showActions={false} />
      </div>
    </div>
  );
}
