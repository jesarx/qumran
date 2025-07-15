'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  Author
} from '@/lib/queries';

// Validation schemas
const CreateAuthorSchema = z.object({
  firstName: z.string().trim().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

const UpdateAuthorSchema = z.object({
  id: z.number(),
  firstName: z.string().trim().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

// Author filters interface
export interface AuthorFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all authors with optional search and sorting
export async function getAuthorsAction(searchTerm?: string, sort?: string): Promise<Author[]> {
  try {
    const filters: AuthorFilters = {
      searchTerm,
      sort: sort as AuthorFilters['sort']
    };
    return await getAuthors(filters);
  } catch (error) {
    console.error('Failed to fetch authors:', error);
    throw new Error('Failed to fetch authors');
  }
}

// Get single author
export async function getAuthorAction(id: number): Promise<Author | null> {
  try {
    return await getAuthorById(id);
  } catch (error) {
    console.error('Failed to fetch author:', error);
    throw new Error('Failed to fetch author');
  }
}

// Create author
export async function createAuthorAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedFields = CreateAuthorSchema.parse({
      firstName: formData.get('firstName') || null,
      lastName: formData.get('lastName'),
    });

    await createAuthor(validatedFields.firstName, validatedFields.lastName);

    revalidatePath('/authors');
    revalidatePath('/dashboard/authors');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to create author:', error);
    return {
      success: false,
      error: 'Failed to create author'
    };
  }
}

// Update author
export async function updateAuthorAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedFields = UpdateAuthorSchema.parse({
      id: Number(formData.get('id')),
      firstName: formData.get('firstName') || null,
      lastName: formData.get('lastName'),
    });

    await updateAuthor(
      validatedFields.id,
      validatedFields.firstName,
      validatedFields.lastName
    );

    revalidatePath('/authors');
    revalidatePath('/dashboard/authors');
    revalidatePath(`/dashboard/authors/${validatedFields.id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to update author:', error);
    return {
      success: false,
      error: 'Failed to update author'
    };
  }
}

// Delete author
export async function deleteAuthorAction(id: number): Promise<void> {
  try {
    await deleteAuthor(id);

    revalidatePath('/authors');
    revalidatePath('/dashboard/authors');
  } catch (error: any) {
    if (error.message.includes('Cannot delete author with existing books')) {
      throw new Error('No se puede eliminar un autor que tiene libros asociados');
    }

    console.error('Failed to delete author:', error);
    throw new Error('Failed to delete author');
  }

  redirect('/dashboard/authors');
}
