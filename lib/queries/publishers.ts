// Update this in: lib/queries/publishers.ts

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
  page?: number;
  limit?: number;
}

// Get all publishers with book count, sorting, and pagination
export async function getPublishers(filters: PublisherFilters = {}): Promise<{
  publishers: Publisher[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let whereCondition = '';
  const params: unknown[] = [];

  if (filters.searchTerm) {
    whereCondition = `WHERE LOWER(p.name) LIKE LOWER($1)`;
    params.push(`%${filters.searchTerm}%`);
  }

  // Get total count
  const countResult = await queryOne<{ count: string }>(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM publishers p
    ${whereCondition}
  `, params);

  const total = parseInt(countResult?.count || '0');
  const totalPages = Math.ceil(total / limit);

  // Get paginated results
  let sql = `
    SELECT 
      p.*,
      COUNT(b.id) as book_count
    FROM publishers p
    LEFT JOIN books b ON p.id = b.publisher_id
    ${whereCondition}
    GROUP BY p.id
  `;

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

  // Add pagination
  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const publishers = await queryMany<Publisher>(sql, params);

  return {
    publishers,
    total,
    page,
    totalPages
  };
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
  const baseSlug = createSlug(name);
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
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
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
