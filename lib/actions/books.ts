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
  isbn: z.string().trim().optional().nullable(),
  author1FirstName: z.string().trim().nullable(),
  author1LastName: z.string().trim().min(1, 'Author last name is required'),
  author2FirstName: z.string().trim().optional().nullable(),
  author2LastName: z.string().trim().optional().nullable(),
  publisherName: z.string().trim().min(1, 'Publisher is required'),
  categoryId: z.number().min(1, 'Category is required'),
});

const UpdateBookSchema = z.object({
  id: z.number(),
  title: z.string().trim().min(1, 'Title is required'),
  isbn: z.string().trim().optional().nullable(),
  categoryId: z.number().min(1, 'Category is required'),
});

// Get books with filters
export async function getBooksAction(filters: BookFilters = {}) {
  try {
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
    const validatedFields = CreateBookSchema.parse({
      title: formData.get('title'),
      isbn: formData.get('isbn') || null,
      author1FirstName: formData.get('author1FirstName') || null,
      author1LastName: formData.get('author1LastName'),
      author2FirstName: formData.get('author2FirstName') || null,
      author2LastName: formData.get('author2LastName') || null,
      publisherName: formData.get('publisherName'),
      categoryId: Number(formData.get('categoryId')),
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

// Update book (only title, ISBN, and category)
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

    // Fetch book data from Open Library API
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch book data');
    }

    const data = await response.json();
    const bookKey = `ISBN:${cleanIsbn}`;

    if (!data[bookKey]) {
      return null;
    }

    const bookData = data[bookKey];

    // Extract and format the data
    return {
      title: bookData.title || '',
      authors: bookData.authors?.map((author: any) => author.name) || [],
      publisher: bookData.publishers?.[0]?.name || ''
    };
  } catch (error) {
    console.error('Failed to search book by ISBN:', error);
    return null;
  }
}
