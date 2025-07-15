import { queryOne, queryMany, query, createSlug } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Publisher extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  book_count?: number;
}

export interface PublisherFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all publishers with book count and sorting
export async function getPublishers(filters: PublisherFilters = {}): Promise<Publisher[]> {
  let sql = `
    SELECT 
      p.*,
      COUNT(b.id) as book_count
    FROM publishers p
    LEFT JOIN books b ON p.id = b.publisher_id
  `;

  const params: any[] = [];

  if (filters.searchTerm) {
    sql += ` WHERE LOWER(p.name) LIKE LOWER($1)`;
    params.push(`%${filters.searchTerm}%`);
  }

  sql += ` GROUP BY p.id`;

  // Add sorting
  let orderBy = 'p.name ASC'; // default
  switch (filters.sort) {
    case 'name':
      orderBy = 'p.name ASC';
      break;
    case '-name':
      orderBy = 'p.name DESC';
      break;
    case 'book_count':
      orderBy = 'book_count ASC, p.name ASC';
      break;
    case '-book_count':
      orderBy = 'book_count DESC, p.name ASC';
      break;
  }

  sql += ` ORDER BY ${orderBy}`;

  return queryMany<Publisher>(sql, params);
}

// Get publisher by ID
export async function getPublisherById(id: number): Promise<Publisher | null> {
  return queryOne<Publisher>(
    'SELECT * FROM publishers WHERE id = $1',
    [id]
  );
}

// Get publisher by slug
export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  return queryOne<Publisher>(
    'SELECT * FROM publishers WHERE slug = $1',
    [slug]
  );
}

// Create new publisher
export async function createPublisher(name: string): Promise<Publisher> {
  let baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists and generate unique one
  while (await getPublisherBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const result = await queryOne<Publisher>(
    `INSERT INTO publishers (name, slug) 
     VALUES ($1, $2) 
     RETURNING *`,
    [name, slug]
  );

  if (!result) {
    throw new Error('Failed to create publisher');
  }

  return result;
}

// Update publisher
export async function updatePublisher(
  id: number,
  name: string
): Promise<Publisher> {
  const result = await queryOne<Publisher>(
    `UPDATE publishers 
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );

  if (!result) {
    throw new Error('Publisher not found');
  }

  return result;
}

// Delete publisher (only if no books reference it)
export async function deletePublisher(id: number): Promise<boolean> {
  try {
    await query(
      'DELETE FROM publishers WHERE id = $1',
      [id]
    );
    return true;
  } catch (error: any) {
    if (error.code === '23503') { // Foreign key violation
      throw new Error('Cannot delete publisher with existing books');
    }
    throw error;
  }
}

// Find or create publisher
export async function findOrCreatePublisher(name: string): Promise<Publisher> {
  // First try to find existing publisher
  const existing = await queryOne<Publisher>(
    'SELECT * FROM publishers WHERE LOWER(name) = LOWER($1)',
    [name]
  );

  if (existing) {
    return existing;
  }

  // Create new publisher if not found
  return createPublisher(name);
}
