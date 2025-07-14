import { getLocationsAction } from '@/lib/actions';
import LocationsTable from '@/components/locations-table';
import SimpleSearch from '@/components/simple-search';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

export default async function DashboardLocationsPage(
  props: {
    searchParams?: Promise<{
      name?: string;
      page?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams?.name || '';

  const locations = await getLocationsAction(name);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Ubicaciones</h1>
          <p className="text-muted-foreground mt-2">
            {locations.length} {locations.length === 1 ? 'ubicación' : 'ubicaciones'} en total
          </p>
        </div>
        <Link href="/dashboard/locations/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Agregar ubicación
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <SimpleSearch placeholder="Buscar por nombre..." />
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <LocationsTable locations={locations} showActions={true} />
      </div>
    </div>
  );
}
