'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  isbnExists,
  findOrCreateAuthor,
  findOrCreatePublisher,
  Book,
  BookFilters
} from '@/lib/queries';
import { getDefaultLocation } from '@/lib/queries/locations';

// Validation schemas
const CreateBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  isbn: z.string().trim().optional().nullable(),
  author1FirstName: z.string().trim().nullable(),
  author1LastName: z.string().trim().min(1, 'Author last name is required'),
  author2FirstName: z.string().trim().optional().nullable(),
  author2LastName: z.string().trim().optional().nullable(),
  publisherName: z.string().trim().min(1, 'Publisher is required'),
  categoryId: z.number().min(1, 'Category is required'),
  locationId: z.number().min(1, 'Location is required'),
});

const UpdateBookSchema = z.object({
  id: z.number(),
  title: z.string().trim().min(1, 'Title is required'),
  isbn: z.string().trim().optional().nullable(),
  categoryId: z.number().min(1, 'Category is required'),
  locationId: z.number().min(1, 'Location is required'),
});

// Get books with filters
export async function getBooksAction(filters: BookFilters = {}) {
  try {
    // Set default sort to author if no sort is specified
    if (!filters.sort) {
      filters.sort = 'author';
    }
    return await getBooks(filters);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    throw new Error('Failed to fetch books');
  }
}

// Get single book
export async function getBookAction(id: number): Promise<Book | null> {
  try {
    return await getBookById(id);
  } catch (error) {
    console.error('Failed to fetch book:', error);
    throw new Error('Failed to fetch book');
  }
}

// Create book
export async function createBookAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string; bookId?: number }> {
  try {
    // Get default location if not provided
    let locationId = Number(formData.get('locationId'));
    if (!locationId || isNaN(locationId)) {
      const defaultLocation = await getDefaultLocation();
      locationId = defaultLocation?.id || 1; // Fallback to 1 if no default found
    }

    const validatedFields = CreateBookSchema.parse({
      title: formData.get('title'),
      isbn: formData.get('isbn') || null,
      author1FirstName: formData.get('author1FirstName') || null,
      author1LastName: formData.get('author1LastName'),
      author2FirstName: formData.get('author2FirstName') || null,
      author2LastName: formData.get('author2LastName') || null,
      publisherName: formData.get('publisherName'),
      categoryId: Number(formData.get('categoryId')),
      locationId: locationId,
    });

    // Check if ISBN already exists
    if (validatedFields.isbn && await isbnExists(validatedFields.isbn)) {
      return {
        success: false,
        error: 'A book with this ISBN already exists'
      };
    }

    // Find or create author 1
    const author1 = await findOrCreateAuthor(
      validatedFields.author1FirstName,
      validatedFields.author1LastName
    );

    // Find or create author 2 if provided
    let author2Id: number | null = null;
    if (validatedFields.author2LastName) {
      const author2 = await findOrCreateAuthor(
        validatedFields.author2FirstName,
        validatedFields.author2LastName
      );
      author2Id = author2.id;
    }

    // Find or create publisher
    const publisher = await findOrCreatePublisher(validatedFields.publisherName);

    // Create book
    const book = await createBook({
      title: validatedFields.title,
      isbn: validatedFields.isbn,
      author1_id: author1.id,
      author2_id: author2Id,
      publisher_id: publisher.id,
      category_id: validatedFields.categoryId,
      location_id: validatedFields.locationId,
    });

    revalidatePath('/books');
    revalidatePath('/dashboard/books');

    return { success: true, bookId: book.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to create book:', error);
    return {
      success: false,
      error: 'Failed to create book'
    };
  }
}

// Update book (title, ISBN, category, and location)
export async function updateBookAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedFields = UpdateBookSchema.parse({
      id: Number(formData.get('id')),
      title: formData.get('title'),
      isbn: formData.get('isbn') || null,
      categoryId: Number(formData.get('categoryId')),
      locationId: Number(formData.get('locationId')),
    });

    // Check if ISBN already exists (excluding current book)
    if (validatedFields.isbn && await isbnExists(validatedFields.isbn, validatedFields.id)) {
      return {
        success: false,
        error: 'A book with this ISBN already exists'
      };
    }

    await updateBook(validatedFields.id, {
      title: validatedFields.title,
      isbn: validatedFields.isbn,
      category_id: validatedFields.categoryId,
      location_id: validatedFields.locationId,
    });

    revalidatePath('/books');
    revalidatePath('/dashboard/books');
    revalidatePath(`/dashboard/books/${validatedFields.id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    console.error('Failed to update book:', error);
    return {
      success: false,
      error: 'Failed to update book'
    };
  }
}

// Delete book
export async function deleteBookAction(id: number): Promise<void> {
  try {
    await deleteBook(id);

    revalidatePath('/books');
    revalidatePath('/dashboard/books');
  } catch (error) {
    console.error('Failed to delete book:', error);
    throw new Error('Failed to delete book');
  }

  redirect('/dashboard/books');
}

// Search book by ISBN (for auto-fill feature)
export async function searchBookByISBN(isbn: string): Promise<any> {
  try {
    // Clean ISBN by removing hyphens or spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Your Google Books API key
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    // Fetch book data from Google Books API
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch book data');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const book = data.items[0].volumeInfo;

    return {
      title: book.title || '',
      authors: book.authors || [],
      publisher: book.publisher || '',
      subjects: book.subjects || [],
    };
  } catch (error) {
    console.error('Failed to search book by ISBN:', error);
    return null;
  }
}
