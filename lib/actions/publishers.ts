// Update this in: lib/actions/publishers.ts

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
  Publisher,
  PublisherFilters
} from '@/lib/queries';

// Form state type
interface ActionState {
  success: boolean;
  error?: string;
}

// Validation schemas
const CreatePublisherSchema = z.object({
  name: z.string().trim().min(1, 'Publisher name is required'),
});

const UpdatePublisherSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1, 'Publisher name is required'),
});

// Get all publishers with optional search, sorting, and pagination
export async function getPublishersAction(
  searchTerm?: string,
  sort?: string,
  page?: number
): Promise<{
  publishers: Publisher[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const filters: PublisherFilters = {
      searchTerm,
      sort: sort as PublisherFilters['sort'],
      page: page || 1,
      limit: 20
    };
    return await getPublishers(filters);
  } catch (error) {
    console.error('Failed to fetch publishers:', error);
    throw new Error('Failed to fetch publishers');
  }
}

// Get single publisher
export async function getPublisherAction(id: number): Promise<Publisher | null> {
  try {
    return await getPublisherById(id);
  } catch (error) {
    console.error('Failed to fetch publisher:', error);
    throw new Error('Failed to fetch publisher');
  }
}

// Create publisher
export async function createPublisherAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const validatedFields = CreatePublisherSchema.parse({
      name: formData.get('name'),
    });

    await createPublisher(validatedFields.name);

    revalidatePath('/publishers');
    revalidatePath('/dashboard/publishers');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to create publisher:', error);
    return {
      success: false,
      error: 'Failed to create publisher'
    };
  }
}

// Update publisher
export async function updatePublisherAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const validatedFields = UpdatePublisherSchema.parse({
      id: Number(formData.get('id')),
      name: formData.get('name'),
    });

    await updatePublisher(validatedFields.id, validatedFields.name);

    revalidatePath('/publishers');
    revalidatePath('/dashboard/publishers');
    revalidatePath(`/dashboard/publishers/${validatedFields.id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to update publisher:', error);
    return {
      success: false,
      error: 'Failed to update publisher'
    };
  }
}

// Delete publisher
export async function deletePublisherAction(id: number): Promise<void> {
  try {
    await deletePublisher(id);

    revalidatePath('/publishers');
    revalidatePath('/dashboard/publishers');
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Cannot delete publisher with existing books')) {
      throw new Error('No se puede eliminar una editorial que tiene libros asociados');
    }

    console.error('Failed to delete publisher:', error);
    throw new Error('Failed to delete publisher');
  }

  redirect('/dashboard/publishers');
}
