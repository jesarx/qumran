import { queryOne, queryMany, query } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Book extends QueryResultRow {
  id: number;
  title: string;
  isbn: string | null;
  author1_id: number;
  author2_id: number | null;
  publisher_id: number;
  category_id: number;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  author1_first_name?: string;
  author1_last_name?: string;
  author1_slug?: string;
  author2_first_name?: string;
  author2_last_name?: string;
  author2_slug?: string;
  publisher_name?: string;
  publisher_slug?: string;
  category_name?: string;
  category_slug?: string;
}

export interface BookFilters {
  title?: string;
  authorSlug?: string;
  publisherSlug?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  sort?: 'title' | '-title' | 'created_at' | '-created_at';
}

// Get books with all related data
export async function getBooks(filters: BookFilters = {}): Promise<{
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (filters.title) {
    whereConditions.push(`LOWER(b.title) LIKE LOWER($${++paramCount})`);
    params.push(`%${filters.title}%`);
  }

  if (filters.authorSlug) {
    whereConditions.push(`(a1.slug = $${++paramCount} OR a2.slug = $${paramCount})`);
    params.push(filters.authorSlug);
  }

  if (filters.publisherSlug) {
    whereConditions.push(`p.slug = $${++paramCount}`);
    params.push(filters.publisherSlug);
  }

  if (filters.categorySlug) {
    whereConditions.push(`c.slug = $${++paramCount}`);
    params.push(filters.categorySlug);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Determine sort order
  let orderBy = 'b.created_at DESC'; // default
  switch (filters.sort) {
    case 'title':
      orderBy = 'b.title ASC';
      break;
    case '-title':
      orderBy = 'b.title DESC';
      break;
    case 'created_at':
      orderBy = 'b.created_at ASC';
      break;
    case '-created_at':
      orderBy = 'b.created_at DESC';
      break;
  }

  // Get total count
  const countResult = await queryOne<{ count: string }>(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM books b
    LEFT JOIN authors a1 ON b.author1_id = a1.id
    LEFT JOIN authors a2 ON b.author2_id = a2.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN categories c ON b.category_id = c.id
    ${whereClause}
  `, params);

  const total = parseInt(countResult?.count || '0');
  const totalPages = Math.ceil(total / limit);

  // Get paginated results
  params.push(limit, offset);

  const books = await queryMany<Book>(`
    SELECT 
      b.*,
      a1.first_name as author1_first_name,
      a1.last_name as author1_last_name,
      a1.slug as author1_slug,
      a2.first_name as author2_first_name,
      a2.last_name as author2_last_name,
      a2.slug as author2_slug,
      p.name as publisher_name,
      p.slug as publisher_slug,
      c.name as category_name,
      c.slug as category_slug
    FROM books b
    LEFT JOIN authors a1 ON b.author1_id = a1.id
    LEFT JOIN authors a2 ON b.author2_id = a2.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN categories c ON b.category_id = c.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, params);

  return {
    books,
    total,
    page,
    totalPages
  };
}

// Get single book by ID
export async function getBookById(id: number): Promise<Book | null> {
  return queryOne<Book>(`
    SELECT 
      b.*,
      a1.first_name as author1_first_name,
      a1.last_name as author1_last_name,
      a1.slug as author1_slug,
      a2.first_name as author2_first_name,
      a2.last_name as author2_last_name,
      a2.slug as author2_slug,
      p.name as publisher_name,
      p.slug as publisher_slug,
      c.name as category_name,
      c.slug as category_slug
    FROM books b
    LEFT JOIN authors a1 ON b.author1_id = a1.id
    LEFT JOIN authors a2 ON b.author2_id = a2.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = $1
  `, [id]);
}

// Create new book
export async function createBook(data: {
  title: string;
  isbn?: string | null;
  author1_id: number;
  author2_id?: number | null;
  publisher_id: number;
  category_id: number;
}): Promise<Book> {
  const result = await queryOne<Book>(
    `INSERT INTO books (title, isbn, author1_id, author2_id, publisher_id, category_id) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      data.title,
      data.isbn || null,
      data.author1_id,
      data.author2_id || null,
      data.publisher_id,
      data.category_id
    ]
  );

  if (!result) {
    throw new Error('Failed to create book');
  }

  // Return with full data
  const fullBook = await getBookById(result.id);
  if (!fullBook) {
    throw new Error('Failed to fetch created book');
  }

  return fullBook;
}

// Update book
export async function updateBook(
  id: number,
  data: {
    title?: string;
    isbn?: string | null;
    author1_id?: number;
    author2_id?: number | null;
    publisher_id?: number;
    category_id?: number;
  }
): Promise<Book> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  if (data.title !== undefined) {
    setClauses.push(`title = $${++paramCount}`);
    values.push(data.title);
  }

  if (data.isbn !== undefined) {
    setClauses.push(`isbn = $${++paramCount}`);
    values.push(data.isbn);
  }

  if (data.author1_id !== undefined) {
    setClauses.push(`author1_id = $${++paramCount}`);
    values.push(data.author1_id);
  }

  if (data.author2_id !== undefined) {
    setClauses.push(`author2_id = $${++paramCount}`);
    values.push(data.author2_id);
  }

  if (data.publisher_id !== undefined) {
    setClauses.push(`publisher_id = $${++paramCount}`);
    values.push(data.publisher_id);
  }

  if (data.category_id !== undefined) {
    setClauses.push(`category_id = $${++paramCount}`);
    values.push(data.category_id);
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await queryOne<Book>(
    `UPDATE books 
     SET ${setClauses.join(', ')}
     WHERE id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  if (!result) {
    throw new Error('Book not found');
  }

  // Return with full data
  const fullBook = await getBookById(result.id);
  if (!fullBook) {
    throw new Error('Failed to fetch updated book');
  }

  return fullBook;
}

// Delete book
export async function deleteBook(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM books WHERE id = $1',
    [id]
  );

  return result.rowCount > 0;
}

// Check if ISBN exists
export async function isbnExists(isbn: string, excludeId?: number): Promise<boolean> {
  let sql = 'SELECT COUNT(*) as count FROM books WHERE isbn = $1';
  const params: any[] = [isbn];

  if (excludeId) {
    sql += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await queryOne<{ count: string }>(sql, params);
  return parseInt(result?.count || '0') > 0;
}
