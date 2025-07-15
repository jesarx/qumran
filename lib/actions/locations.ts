// Update this in: lib/actions/locations.ts

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getDefaultLocation,
  Location
} from '@/lib/queries';

// Validation schemas
const CreateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required'),
});

const UpdateLocationSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1, 'Location name is required'),
});

// Location filters interface
export interface LocationFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all locations with optional search and sorting
export async function getLocationsAction(searchTerm?: string, sort?: string): Promise<Location[]> {
  try {
    const filters: LocationFilters = {
      searchTerm,
      sort: sort as LocationFilters['sort']
    };
    return await getLocations(filters);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw new Error('Failed to fetch locations');
  }
}

// Get single location
export async function getLocationAction(id: number): Promise<Location | null> {
  try {
    return await getLocationById(id);
  } catch (error) {
    console.error('Failed to fetch location:', error);
    throw new Error('Failed to fetch location');
  }
}

// Get default location (Casa)
export async function getDefaultLocationAction(): Promise<Location | null> {
  try {
    return await getDefaultLocation();
  } catch (error) {
    console.error('Failed to fetch default location:', error);
    return null;
  }
}

// Create location
export async function createLocationAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedFields = CreateLocationSchema.parse({
      name: formData.get('name'),
    });

    await createLocation(validatedFields.name);

    revalidatePath('/locations');
    revalidatePath('/dashboard/locations');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to create location:', error);
    return {
      success: false,
      error: 'Failed to create location'
    };
  }
}

// Update location
export async function updateLocationAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedFields = UpdateLocationSchema.parse({
      id: Number(formData.get('id')),
      name: formData.get('name'),
    });

    await updateLocation(validatedFields.id, validatedFields.name);

    revalidatePath('/locations');
    revalidatePath('/dashboard/locations');
    revalidatePath(`/dashboard/locations/${validatedFields.id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to update location:', error);
    return {
      success: false,
      error: 'Failed to update location'
    };
  }
}

// Delete location
export async function deleteLocationAction(id: number): Promise<void> {
  try {
    await deleteLocation(id);

    revalidatePath('/locations');
    revalidatePath('/dashboard/locations');
  } catch (error: any) {
    if (error.message.includes('Cannot delete location with existing books')) {
      throw new Error('No se puede eliminar una ubicación que tiene libros asociados');
    }

    console.error('Failed to delete location:', error);
    throw new Error('Failed to delete location');
  }

  redirect('/dashboard/locations');
}
