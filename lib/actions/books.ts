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

// Validation schemas
const CreateBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  isbn: z.string().trim().optional().transform(val => {
    // Convert empty string to null, keep valid ISBNs
    if (!val || val === '') return null;
    return val;
  }).refine(val => {
    // If ISBN is provided, it should be valid length (10 or 13 digits)
    if (val === null) return true;
    const cleanIsbn = val.replace(/[-\s]/g, '');
    return cleanIsbn.length === 10 || cleanIsbn.length === 13;
  }, 'ISBN must be 10 or 13 digits'),
  author1FirstName: z.string().trim().optional().transform(val => val || null),
  author1LastName: z.string().trim().min(1, 'Author last name is required'),
  author2FirstName: z.string().trim().optional().transform(val => val || null),
  author2LastName: z.string().trim().optional().transform(val => val || null),
  publisherName: z.string().trim().min(1, 'Publisher is required'),
  categoryId: z.number().min(1, 'Category is required'),
  locationId: z.number().min(1, 'Location is required'),
});

const UpdateBookSchema = z.object({
  id: z.number(),
  title: z.string().trim().min(1, 'Title is required'),
  isbn: z.string().trim().optional().transform(val => {
    // Convert empty string to null, keep valid ISBNs
    if (!val || val === '') return null;
    return val;
  }).refine(val => {
    // If ISBN is provided, it should be valid length (10 or 13 digits)
    if (val === null) return true;
    const cleanIsbn = val.replace(/[-\s]/g, '');
    return cleanIsbn.length === 10 || cleanIsbn.length === 13;
  }, 'ISBN must be 10 or 13 digits'),
  categoryId: z.number().min(1, 'Category is required'),
  locationId: z.number().min(1, 'Location is required'),
});

// Helper function to normalize ISBN
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

// Get books with filters
export async function getBooksAction(filters: BookFilters = {}) {
  try {
    console.log('getBooksAction called with filters:', filters);
    const result = await getBooks(filters);
    console.log('getBooksAction result:', {
      totalBooks: result.total,
      booksReturned: result.books.length,
      filters: filters
    });
    return result;
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
    const validatedFields = CreateBookSchema.parse({
      title: formData.get('title'),
      isbn: formData.get('isbn'),
      author1FirstName: formData.get('author1FirstName'),
      author1LastName: formData.get('author1LastName'),
      author2FirstName: formData.get('author2FirstName'),
      author2LastName: formData.get('author2LastName'),
      publisherName: formData.get('publisherName'),
      categoryId: Number(formData.get('categoryId')),
      locationId: Number(formData.get('locationId')),
    });

    // Check if ISBN already exists (only if ISBN is provided)
    if (validatedFields.isbn) {
      const normalizedIsbn = normalizeIsbn(validatedFields.isbn);
      if (await isbnExists(normalizedIsbn)) {
        return {
          success: false,
          error: 'Ya existe un libro con este ISBN en la base de datos'
        };
      }
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

    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        return {
          success: false,
          error: 'Ya existe un libro con este ISBN en la base de datos'
        };
      }
    }

    return {
      success: false,
      error: 'Error al crear el libro. Por favor, intenta de nuevo.'
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
      isbn: formData.get('isbn'),
      categoryId: Number(formData.get('categoryId')),
      locationId: Number(formData.get('locationId')),
    });

    // Check if ISBN already exists (only if ISBN is provided and excluding current book)
    if (validatedFields.isbn) {
      const normalizedIsbn = normalizeIsbn(validatedFields.isbn);
      if (await isbnExists(normalizedIsbn, validatedFields.id)) {
        return {
          success: false,
          error: 'Ya existe otro libro con este ISBN en la base de datos'
        };
      }
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

    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        return {
          success: false,
          error: 'Ya existe otro libro con este ISBN en la base de datos'
        };
      }
    }

    return {
      success: false,
      error: 'Error al actualizar el libro. Por favor, intenta de nuevo.'
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
    const cleanIsbn = normalizeIsbn(isbn);

    // Validate ISBN length
    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      return null;
    }

    // Your Google Books API key
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      console.warn('Google Books API key not configured');
      return null;
    }

    // Fetch book data from Google Books API
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch book data from Google Books API');
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
