import { queryOne, queryMany, query, createSlug } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Author extends QueryResultRow {
  id: number;
  first_name: string | null;
  last_name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  book_count?: number;
}

export interface AuthorFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all authors with book count and sorting
export async function getAuthors(filters: AuthorFilters = {}): Promise<Author[]> {
  let sql = `
    SELECT 
      a.*,
      COUNT(DISTINCT b.id) as book_count
    FROM authors a
    LEFT JOIN books b ON a.id = b.author1_id OR a.id = b.author2_id
  `;

  const params: any[] = [];

  if (filters.searchTerm) {
    sql += ` WHERE LOWER(a.first_name || ' ' || a.last_name) LIKE LOWER($1)`;
    params.push(`%${filters.searchTerm}%`);
  }

  sql += ` GROUP BY a.id`;

  // Add sorting
  let orderBy = 'a.last_name ASC, a.first_name ASC'; // default
  switch (filters.sort) {
    case 'name':
      orderBy = 'a.last_name ASC, a.first_name ASC';
      break;
    case '-name':
      orderBy = 'a.last_name DESC, a.first_name DESC';
      break;
    case 'book_count':
      orderBy = 'book_count ASC, a.last_name ASC, a.first_name ASC';
      break;
    case '-book_count':
      orderBy = 'book_count DESC, a.last_name ASC, a.first_name ASC';
      break;
  }

  sql += ` ORDER BY ${orderBy}`;

  return queryMany<Author>(sql, params);
}

// Get author by ID
export async function getAuthorById(id: number): Promise<Author | null> {
  return queryOne<Author>(
    'SELECT * FROM authors WHERE id = $1',
    [id]
  );
}

// Get author by slug
export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  return queryOne<Author>(
    'SELECT * FROM authors WHERE slug = $1',
    [slug]
  );
}

// Create new author
export async function createAuthor(
  firstName: string | null,
  lastName: string
): Promise<Author> {
  // Generate slug from full name
  const fullName = firstName ? `${firstName} ${lastName}` : lastName;
  let baseSlug = createSlug(fullName);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists and generate unique one
  while (await getAuthorBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const result = await queryOne<Author>(
    `INSERT INTO authors (first_name, last_name, slug) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [firstName, lastName, slug]
  );

  if (!result) {
    throw new Error('Failed to create author');
  }

  return result;
}

// Update author
export async function updateAuthor(
  id: number,
  firstName: string | null,
  lastName: string
): Promise<Author> {
  const result = await queryOne<Author>(
    `UPDATE authors 
     SET first_name = $1, last_name = $2
     WHERE id = $3
     RETURNING *`,
    [firstName, lastName, id]
  );

  if (!result) {
    throw new Error('Author not found');
  }

  return result;
}

// Delete author (only if no books reference it)
export async function deleteAuthor(id: number): Promise<boolean> {
  try {
    await query(
      'DELETE FROM authors WHERE id = $1',
      [id]
    );
    return true;
  } catch (error: any) {
    if (error.code === '23503') { // Foreign key violation
      throw new Error('Cannot delete author with existing books');
    }
    throw error;
  }
}

// Find or create author
export async function findOrCreateAuthor(
  firstName: string | null,
  lastName: string
): Promise<Author> {
  // First try to find existing author
  let existing: Author | null;

  if (firstName) {
    existing = await queryOne<Author>(
      `SELECT * FROM authors 
       WHERE LOWER(last_name) = LOWER($1) 
       AND LOWER(first_name) = LOWER($2)`,
      [lastName, firstName]
    );
  } else {
    existing = await queryOne<Author>(
      `SELECT * FROM authors 
       WHERE LOWER(last_name) = LOWER($1) 
       AND first_name IS NULL`,
      [lastName]
    );
  }

  if (existing) {
    return existing;
  }

  // Create new author if not found
  return createAuthor(firstName, lastName);
}
