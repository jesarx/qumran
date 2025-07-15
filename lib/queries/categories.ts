// Update this in: lib/queries/categories.ts

import { queryOne, queryMany } from '@/lib/db';
import { QueryResultRow } from 'pg';

export interface Category extends QueryResultRow {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  book_count?: number;
}

export interface CategoryFilters {
  searchTerm?: string;
  sort?: 'name' | '-name' | 'book_count' | '-book_count';
}

// Get all categories with book count and filtering
export async function getCategories(filters: CategoryFilters = {}): Promise<Category[]> {
  let sql = `
    SELECT 
      c.*,
      COUNT(b.id) as book_count
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
  `;

  const params: unknown[] = [];

  if (filters.searchTerm) {
    sql += ` WHERE LOWER(c.name) LIKE LOWER($1)`;
    params.push(`%${filters.searchTerm}%`);
  }

  sql += ` GROUP BY c.id`;

  // Add sorting
  let orderBy = 'c.name ASC'; // default
  switch (filters.sort) {
    case 'name':
      orderBy = 'c.name ASC';
      break;
    case '-name':
      orderBy = 'c.name DESC';
      break;
    case 'book_count':
      orderBy = 'book_count ASC, c.name ASC';
      break;
    case '-book_count':
      orderBy = 'book_count DESC, c.name ASC';
      break;
  }

  sql += ` ORDER BY ${orderBy}`;

  return queryMany<Category>(sql, params);
}

// Get category by ID
export async function getCategoryById(id: number): Promise<Category | null> {
  return queryOne<Category>(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return queryOne<Category>(
    'SELECT * FROM categories WHERE slug = $1',
    [slug]
  );
}

// Note: We typically don't create/update/delete categories since they're predefined
// But here are the functions if needed:

// Update category name
export async function updateCategory(
  id: number,
  name: string
): Promise<Category> {
  const result = await queryOne<Category>(
    `UPDATE categories 
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );

  if (!result) {
    throw new Error('Category not found');
  }

  return result;
}
