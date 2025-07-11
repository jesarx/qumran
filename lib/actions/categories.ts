'use server';

import { revalidatePath } from 'next/cache';
import {
  getCategories,
  getCategoryById,
  Category
} from '@/lib/queries';

// Get all categories
export async function getCategoriesAction(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

// Get single category
export async function getCategoryAction(id: number): Promise<Category | null> {
  try {
    return await getCategoryById(id);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    throw new Error('Failed to fetch category');
  }
}

// Note: We don't typically allow creating/deleting categories since they're predefined
// But you could add update functionality if needed
